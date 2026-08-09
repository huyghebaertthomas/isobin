import test from "node:test";
import assert from "node:assert/strict";

import { buildScene, defaultConfig, getAt, resolveConfig } from "../src/core.js";
import { controls, surfaceFields } from "../demo/src/config/controls.js";
import { demo } from "../demo/src/config/demo.js";
import { stock, wall } from "../demo/src/config/parts.js";

/** the panel edits the config plus the demo's own branches, all by path */
const settings = { ...defaultConfig, demo };

/**
 * The demo is not published, but it is the package's first consumer and the
 * thing people copy configs out of. What is worth guarding is the seam: the
 * panel addresses the config by dotted path, and a path that no longer lands
 * anywhere is a control that silently does nothing.
 */

test("every control points at something the config actually has", () => {
  const fields = [
    ...controls.flatMap((section) => section.fields),
    ...settings.appearance.surfaces.flatMap((_, index) => surfaceFields(index)),
  ];

  for (const field of fields) {
    assert.notEqual(getAt(settings, field.path), undefined, `${field.path} is missing`);
    if (field.enabledWhen) {
      assert.notEqual(
        getAt(settings, field.enabledWhen),
        undefined,
        `${field.path} is gated on the missing ${field.enabledWhen}`
      );
    }
  }
});

test("the demo's own branch stays the demo's own", () => {
  // `demo.*` is this app's behaviour, not the drawing's. If one of these ever
  // resolves against the library config, it has been put in the wrong place.
  const mine = controls
    .flatMap((section) => section.fields)
    .filter((field) => field.path.startsWith("demo."));

  assert.ok(mine.length, "the panel drives the demo's behaviour too");
  for (const field of mine) {
    assert.equal(getAt(defaultConfig, field.path), undefined, `${field.path} leaked into the config`);
  }
});

test("the materials section generates its rows from the surfaces", () => {
  assert.ok(controls.some((section) => section.surfaces));
});

test("the bench's stock table and its wall agree on what bins exist", () => {
  // the bench keys highlights and labels off `stock`, so a name in one and not
  // the other is a bin that never lights up, or a flag aimed at nothing — the
  // exact drift a real inventory system has against a real shelf
  const built = buildScene(resolveConfig(wall)).bins.map((bin) => bin.id);

  assert.deepEqual(Object.keys(stock).sort(), [...built].sort());
});
