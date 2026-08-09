import test from "node:test";
import assert from "node:assert/strict";

import {
  activeStyle,
  darken,
  deepMerge,
  defaultConfig,
  diff,
  getAt,
  resolveConfig,
  resolveMaterials,
  restyle,
  setAt,
  styleBranches,
  styleNames,
  styles,
} from "../src/core.js";

test("paths read and write anywhere in the config, arrays included", () => {
  assert.equal(getAt(defaultConfig, "view.padding.top"), defaultConfig.view.padding.top);
  assert.equal(getAt(defaultConfig, "appearance.surfaces.1.key"), "cabinet");
  assert.equal(getAt(defaultConfig, "nothing.here.at.all"), undefined);

  const next = setAt(defaultConfig, "appearance.surfaces.2.fill", "#ff0000");
  assert.equal(next.appearance.surfaces[2].fill, "#ff0000");
  assert.ok(Array.isArray(next.appearance.surfaces));
  assert.equal(defaultConfig.appearance.surfaces[2].fill, "#ffffff", "the original is untouched");
});

test("a write clones only the branch it touches", () => {
  const next = setAt(defaultConfig, "view.scale", 40);

  assert.notEqual(next.view, defaultConfig.view);
  assert.equal(next.motion, defaultConfig.motion, "timings keep their identity");
  assert.equal(next.hardware, defaultConfig.hardware, "so does the hardware");
});

test("the copied patch is the smallest override that reproduces the edits", () => {
  const edited = setAt(setAt(defaultConfig, "view.scale", 40), "hardware.binGap", 0.2);
  const patch = diff(defaultConfig, edited);

  assert.deepEqual(patch, { view: { scale: 40 }, hardware: { binGap: 0.2 } });
  assert.deepEqual(deepMerge(defaultConfig, patch), edited);
  assert.equal(diff(defaultConfig, defaultConfig), undefined, "no edits, no patch");
});

test("a merge keeps the identity of every branch it did not change", () => {
  // the whole of memoisation downstream rests on this: an edit to one branch
  // has to leave the other five the very same objects, or every bin rebuilds
  const edited = setAt(defaultConfig, "appearance.background", "#eeeeee");
  const merged = deepMerge(defaultConfig, edited);

  assert.equal(merged.layout, defaultConfig.layout, "layout survives a repaint");
  assert.equal(merged.hardware, defaultConfig.hardware);
  assert.equal(merged.binTypes, defaultConfig.binTypes);
  assert.equal(merged.view, defaultConfig.view);
  assert.notEqual(merged.appearance, defaultConfig.appearance, "and the touched one did change");

  // a patch that asks for what is already there is not a change at all
  assert.equal(deepMerge(defaultConfig, { view: { scale: defaultConfig.view.scale } }), defaultConfig);
  assert.equal(resolveConfig({}), defaultConfig, "an empty override resolves to the defaults");
});

test("the surfaces are exactly the six the renderer asks for", () => {
  const keys = defaultConfig.appearance.surfaces.map((surface) => surface.key);
  assert.deepEqual(keys, ["table", "cabinet", "shelf", "bin", "binInterior", "divider"]);
});

test("every style is an override the renderer can actually paint", () => {
  assert.ok(styles.length > 1);
  assert.equal(new Set(styles.map((s) => s.key)).size, styles.length, "keys are unique");
  assert.deepEqual(styleNames, styles.map((s) => s.key));

  const wanted = defaultConfig.appearance.surfaces.map((surface) => surface.key);

  for (const style of styles) {
    const config = deepMerge(defaultConfig, style.patch);
    const { surfaces } = resolveMaterials(config.appearance);

    assert.deepEqual(Object.keys(surfaces), wanted, `${style.key} paints every surface`);
    for (const [key, material] of Object.entries(surfaces)) {
      for (const [direction, face] of Object.entries(material.faces)) {
        assert.match(face.fill, /^#[0-9a-f]{6}$/i, `${style.key}/${key}/${direction}`);
      }
    }
  }
});

test("a style can be named in the config, and your own overrides win over it", () => {
  for (const name of styleNames) {
    const wanted = styles.find((style) => style.key === name);
    assert.equal(diff(resolveConfig({ style: name }).appearance, deepMerge(defaultConfig, wanted.patch).appearance), undefined);
  }

  // the style goes on first so a correction on top of it survives
  const corrected = resolveConfig({ style: "blueprint", appearance: { background: "#000000" } });
  assert.equal(corrected.appearance.background, "#000000");
  assert.equal(
    corrected.appearance.surfaces[1].fill,
    deepMerge(defaultConfig, styles.find((s) => s.key === "blueprint").patch).appearance.surfaces[1].fill,
    "and the rest of the style is still there"
  );

  assert.throws(() => resolveConfig({ style: "chartreuse" }), /Unknown style/);
});

test("switching style leaves nothing of the last one behind", () => {
  const branches = styleBranches(styles);
  const pick = (settings, key) =>
    restyle(settings, defaultConfig, branches, styles.find((s) => s.key === key).patch);

  assert.deepEqual(branches, ["appearance"], "the styles own the look and nothing else");

  // through every style in turn and back to the first: no trace of the others
  const roundTrip = styles.reduce((settings, style) => pick(settings, style.key), defaultConfig);
  assert.equal(diff(defaultConfig, pick(roundTrip, styles[0].key)), undefined);

  // a style claims the settings only while they are untouched
  const dark = pick(defaultConfig, "terminal");
  assert.equal(activeStyle(styles, defaultConfig, dark)?.key, "terminal");
  assert.equal(activeStyle(styles, defaultConfig, defaultConfig)?.key, styles[0].key);
  assert.equal(activeStyle(styles, defaultConfig, setAt(dark, "appearance.background", "#123456")), null);

  // and it survives edits to anything it does not own
  const moved = setAt(dark, "view.scale", 40);
  assert.equal(activeStyle(styles, defaultConfig, moved)?.key, "terminal");
});

test("shading gives each face direction its own fill, darkest last", () => {
  const shaded = resolveMaterials(defaultConfig.appearance).surfaces.cabinet.faces;

  // lit from the top by default: sides one step down, fronts two
  assert.equal(shaded.top.fill, "#ffffff");
  assert.equal(shaded.side.fill, darken("#ffffff", 0.07));
  assert.equal(shaded.front.fill, darken("#ffffff", 0.14));
  assert.ok(shaded.front.fill < shaded.side.fill, "and each is darker than the last");
});

test("the lit face can be any of the three, and the rest fall away from it", () => {
  const litFrom = (lit) =>
    resolveMaterials(setAt(defaultConfig, "appearance.shading.lit", lit).appearance).surfaces
      .cabinet.faces;

  assert.equal(litFrom("front").front.fill, "#ffffff", "whichever is lit keeps the colour");
  assert.equal(litFrom("front").top.fill, darken("#ffffff", 0.07));
  assert.equal(litFrom("side").side.fill, "#ffffff");
});

test("shading off leaves every face the surface's own colour", () => {
  const off = setAt(defaultConfig, "appearance.shading.enabled", false);
  const faces = resolveMaterials(off.appearance).surfaces.cabinet.faces;

  assert.deepEqual(new Set(Object.values(faces).map((f) => f.fill)), new Set(["#ffffff"]));
});

test("the ramp shades every face but the one taking the light", () => {
  const { ramp, faces } = resolveMaterials(defaultConfig.appearance).surfaces.cabinet;
  const { strength } = defaultConfig.appearance.shading.gradient;

  assert.equal(ramp.shades.top, null, "the lit face is square to the light: no far end");
  assert.equal(ramp.shades.side, darken(faces.side.fill, strength));
  assert.equal(ramp.shades.front, darken(faces.front.fill, strength));

  // the shadow deepens away from the lit face, so the lit one comes out level
  const corners = [
    [0, 0, 0],
    [1, 1, 1],
  ].map(ramp.shadow);
  assert.ok(corners[1] < corners[0], "lit from the top: higher is lighter");
});

test("the ramp follows the lit face, and switches off on its own", () => {
  const litFrom = (lit) =>
    resolveMaterials(setAt(defaultConfig, "appearance.shading.lit", lit).appearance).surfaces
      .cabinet.ramp;

  assert.equal(litFrom("side").shades.side, null);
  assert.equal(litFrom("front").shades.front, null);
  assert.ok(litFrom("front").shades.top, "and the others gain one");

  const off = (path) =>
    resolveMaterials(setAt(defaultConfig, path, false).appearance).surfaces.cabinet.ramp;
  assert.equal(off("appearance.shading.gradient.enabled"), null);
  assert.equal(off("appearance.shading.enabled"), null, "no light, no ramp");

  // a colour the mixer cannot read would ramp to itself, which is just a fill
  const named = setAt(defaultConfig, "appearance.surfaces.1.fill", "rebeccapurple");
  assert.equal(resolveMaterials(named.appearance).surfaces.cabinet.ramp, null);
});

test("a colour that cannot be read is left alone rather than mangled", () => {
  assert.equal(darken("rebeccapurple", 0.5), "rebeccapurple");
  assert.equal(darken("#fff", 0.5), "#808080", "short hex still works");
  assert.equal(darken("#ffffff", 0), "#ffffff", "no falloff, no change");
});
