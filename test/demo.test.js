import test from "node:test";
import assert from "node:assert/strict";

import { defaultConfig, getAt } from "../src/core.js";
import { controls, surfaceFields } from "../demo/src/config/controls.js";

/**
 * The demo is not published, but it is the package's first consumer and the
 * thing people copy configs out of. What is worth guarding is the seam: the
 * panel addresses the config by dotted path, and a path that no longer lands
 * anywhere is a control that silently does nothing.
 */

test("every control points at something the config actually has", () => {
  const fields = [
    ...controls.flatMap((section) => section.fields),
    ...defaultConfig.appearance.surfaces.flatMap((_, index) => surfaceFields(index)),
  ];

  for (const field of fields) {
    assert.notEqual(getAt(defaultConfig, field.path), undefined, `${field.path} is missing`);
    if (field.enabledWhen) {
      assert.notEqual(
        getAt(defaultConfig, field.enabledWhen),
        undefined,
        `${field.path} is gated on the missing ${field.enabledWhen}`
      );
    }
  }
});

test("the materials section generates its rows from the surfaces", () => {
  assert.ok(controls.some((section) => section.surfaces));
});
