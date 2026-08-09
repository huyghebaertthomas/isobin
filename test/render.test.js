import test from "node:test";
import assert from "node:assert/strict";

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { buildScene, defaultConfig, resolveConfig, styleNames } from "../dist/core.js";
import { renderToSVG } from "../dist/svg.js";

/**
 * The published surface, exercised the way a consumer would.
 *
 * These import `dist/`, not `src/` — partly because Node cannot parse the JSX
 * the components are written in, but mostly because the build is what people
 * install, and a package that passes its tests from source and ships a broken
 * bundle has tested the wrong thing. `npm test` builds first.
 *
 * They go through `renderToSVG` rather than poking at components, because the
 * string is the one thing every entry point eventually agrees on — the React
 * component renders this same markup into a document.
 */

const ids = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);
const refs = (svg) => [...svg.matchAll(/url\(#([^)]+)\)/g)].map(([, id]) => id);

/** every bare specifier an entry reaches, following its own chunks down */
async function reachableFrom(entry, seen = new Set()) {
  if (seen.has(entry)) return [];
  seen.add(entry);

  const source = await readFile(new URL(`../dist/${entry}`, import.meta.url), "utf8");
  const specifiers = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map(([, id]) => id);

  const bare = specifiers.filter((id) => !id.startsWith("."));
  const local = await Promise.all(
    specifiers.filter((id) => id.startsWith(".")).map((id) => reachableFrom(id.slice(2), seen))
  );

  return [...new Set([...bare, ...local.flat()])].sort();
}

test("a default drawing is one svg with a measured viewBox", () => {
  const svg = renderToSVG();

  assert.match(svg, /^<svg /, "one element, no wrapper");
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, "valid on its own as a file");

  const scene = buildScene(defaultConfig);
  assert.ok(svg.includes(`viewBox="${scene.bounds.viewBox}"`), "framed from the built scene");
  assert.ok(!/\bwidth=|\bheight=/.test(svg.slice(0, svg.indexOf(">"))), "sized by its container");
});

test("the config decides what is drawn, and how much of it", () => {
  const one = renderToSVG({
    layout: { organizers: [{ id: "A", rows: [{ type: "small", repeat: 2 }] }] },
  });
  const many = renderToSVG({
    layout: {
      organizers: [
        { id: "A", rows: [{ type: "small", repeat: 2 }] },
        { id: "B", rows: [{ type: "large", repeat: 3 }] },
        { id: "C", rows: ["medium"] },
      ],
    },
  });

  assert.ok(many.length > one.length, "three cabinets draw more than one");
  for (const id of ["A", "B", "C"]) {
    assert.ok(many.includes(`-${id}"`), `cabinet ${id} is in the drawing`);
  }
  assert.ok(!one.includes('-B"'), "and a cabinet nobody asked for is not");
});

test("every id a drawing refers to is one the same drawing defines", () => {
  const svg = renderToSVG({ style: "clay", appearance: { glass: { blur: 2 } } });
  const defined = new Set(ids(svg));

  assert.ok(defined.size > 100, "gradients, clips and backdrops all get names");
  for (const ref of refs(svg)) {
    assert.ok(defined.has(ref), `url(#${ref}) points at nothing`);
  }
});

test("two drawings in one document cannot borrow each other's ids", () => {
  // the failure this guards against is silent: React's id counter restarts per
  // render, so without a prefix the second drawing's url(#…) resolves to the
  // first one's gradients and it comes out wearing the wrong colours
  const [first, second] = [renderToSVG({ style: "noir" }), renderToSVG({ style: "riso" })];
  const shared = ids(first).filter((id) => new Set(ids(second)).has(id));

  assert.deepEqual(shared, [], "no id appears in both");

  // and the ones inside each drawing still resolve
  for (const svg of [first, second]) {
    const defined = new Set(ids(svg));
    for (const ref of refs(svg)) assert.ok(defined.has(ref));
  }

  // saying so explicitly is what a caller does when they want it reproducible
  assert.equal(renderToSVG({}, { idPrefix: "a" }), renderToSVG({}, { idPrefix: "a" }));
});

test("a rendered drawing is a still: shut, and nothing to click", () => {
  const svg = renderToSVG();
  assert.ok(!svg.includes("onclick"), "no handlers survive to markup");
  assert.ok(!svg.includes("cursor:pointer") && !svg.includes("cursor: pointer"));
  assert.ok(!/translate\((?!0px, ?0px)/.test(svg), "every bin is drawn shut");

  const scene = buildScene(defaultConfig);
  const [id] = scene.bins.map((bin) => bin.id);
  const opened = renderToSVG({}, { open: [id] });
  assert.ok(/translate\((?!0px, ?0px)/.test(opened), "unless the caller says otherwise");
});

test("every style renders, and no two of them render the same", () => {
  const seen = new Map();

  for (const style of styleNames) {
    const svg = renderToSVG({ style }, { idPrefix: "s" });
    assert.match(svg, /^<svg /, style);

    const background = svg.match(/background:\s*([^;"]+)/)?.[1];
    assert.equal(background, resolveConfig({ style }).appearance.background, `${style} background`);

    assert.ok(!seen.has(svg), `${style} is indistinguishable from ${seen.get(svg)}`);
    seen.set(svg, style);
  }

  assert.equal(seen.size, styleNames.length);
});

test("the package resolves the way its exports map promises", async () => {
  const require = createRequire(import.meta.url);

  // both formats load, and agree
  const cjs = require("../dist/core.cjs");
  const esm = await import("../dist/core.js");
  assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).filter((k) => k !== "default").sort());
  assert.deepEqual(cjs.styleNames, styleNames);

  // core is the one entry that must not drag React in behind it, and the
  // entry file alone does not prove that — what it pulls in has to be clean
  // the whole way down
  assert.deepEqual(await reachableFrom("core.js"), [], "isobin/core imports no React");
  assert.deepEqual(await reachableFrom("index.js"), ["react", "react/jsx-runtime"]);
  assert.deepEqual(await reachableFrom("svg.js"), [
    "react",
    "react-dom/server",
    "react/jsx-runtime",
  ]);

  const { Isobin } = await import("../dist/index.js");
  assert.equal(typeof Isobin, "function", "the component is the headline export");
});

test("the label describes the scene, and the caller can say otherwise", () => {
  assert.match(renderToSVG(), /aria-label="Isometric drawing of 2 storage cabinets, \d+ bins"/);
  assert.match(
    renderToSVG({ layout: { organizers: [{ id: "A", rows: ["small"] }] } }),
    /1 storage cabinet, 5 bins/,
    "counted, and singular when there is one"
  );
  assert.match(renderToSVG({}, { label: "The wall" }), /aria-label="The wall"/);
});
