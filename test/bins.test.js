import test from "node:test";
import assert from "node:assert/strict";

import { buildScene, defaultConfig, resolveConfig, resolveMaterials } from "../src/core.js";
import { neighbour } from "../src/lib/navigate.js";

/**
 * Naming bins, picking them out, and walking between them.
 *
 * The ids matter most of the three. They are addresses — an inventory system
 * stores them against parts — so the tests here are mostly about what happens
 * when a layout changes underneath one.
 */

const wall = (overrides) => buildScene(resolveConfig(overrides));

test("bins can be named, and then keep their names when the layout moves", () => {
  const rows = [
    { type: "small", ids: ["R-100", "R-101", "R-102", "R-103", "R-104"] },
    { type: "large", id: "BULK" },
  ];

  const before = wall({ layout: { organizers: [{ id: "A", rows }] } });
  assert.deepEqual(
    before.bins.map((bin) => bin.id),
    ["R-100", "R-101", "R-102", "R-103", "R-104", "BULK"],
    "a row of one is called what the row is called, with no index tacked on"
  );

  // the thing positional ids get wrong: a shelf added above shifts everything
  const after = wall({
    layout: { organizers: [{ id: "A", rows: [{ type: "medium" }, ...rows] }] },
  });
  assert.ok(after.binsById.has("R-100"), "R-100 is still R-100");
  assert.equal(after.binsById.get("BULK").row, 2, "even though it moved down a row");

  // and what it costs when they are left positional
  const moved = wall({
    layout: { organizers: [{ id: "A", rows: [{ type: "medium" }, { type: "small" }] }] },
  });
  assert.equal(moved.bins.at(-1).id, "A-1-4", "positional ids follow the position");
});

test("a naming function names the whole wall at once", () => {
  const scene = wall({
    layout: {
      idFor: ({ organizerId, row, index }) => `${organizerId}/${row + 1}/${index + 1}`,
      organizers: [{ id: "A", rows: [{ type: "medium" }] }],
    },
  });

  assert.deepEqual(
    scene.bins.map((bin) => bin.id),
    ["A/1/1", "A/1/2"]
  );
});

test("a name that cannot be honoured is refused, not fudged", () => {
  const fails = (rows, pattern) =>
    assert.throws(() => wall({ layout: { organizers: [{ id: "A", rows }] } }), pattern);

  fails([{ type: "small", ids: ["a", "b"] }], /holds 5 bins but was given 2 ids/);
  fails([{ type: "small", ids: "a" }], /must be an array/);
  fails([{ type: "small", repeat: 2, ids: ["a", "b", "c", "d", "e"] }], /cannot use `repeat`/);

  // the one that would quietly break addressing: two bins answering to one name
  fails([{ type: "small", ids: ["x", "x", "y", "z", "w"] }], /Two bins are called "x"/);

  assert.throws(
    () =>
      wall({
        layout: {
          organizers: [
            { id: "A", rows: [{ type: "large", id: "SHARED" }] },
            { id: "B", rows: [{ type: "large", id: "SHARED" }] },
          ],
        },
      }),
    /Two bins are called "SHARED"/,
    "across cabinets too"
  );
});

test("a highlight is the bin surface with something folded over it", () => {
  const materials = resolveMaterials(defaultConfig.appearance);
  const plain = materials.surfaces.bin;

  const found = materials.highlights.found;
  assert.notEqual(found.faces.top.fill, plain.faces.top.fill, "it looks different");
  assert.equal(found.pulse, true, "and this one asks to be noticed");
  assert.equal(materials.highlights.low.pulse, undefined);

  // a colour on the spot, for a highlight that comes from data
  const adhoc = materials.highlight("#123456");
  assert.equal(adhoc.faces.top.fill, "#123456");
  assert.equal(adhoc.line.strokeWidth, plain.line.strokeWidth, "the style's outline survives");

  // the light still applies, so a highlighted bin is still a solid
  assert.notEqual(adhoc.faces.top.fill, adhoc.faces.front.fill);
});

test("the arrow keys walk the wall the way it looks", () => {
  const scene = wall({
    layout: {
      organizers: [
        { id: "A", rows: [{ type: "small" }, { type: "medium" }] },
        { id: "B", rows: [{ type: "small" }, { type: "small" }] },
      ],
    },
  });

  const at = (id, key) => neighbour(scene, id, key);

  assert.equal(at("A-0-0", "ArrowRight"), "A-0-1", "along the row");
  assert.equal(at("A-0-1", "ArrowLeft"), "A-0-0");
  assert.equal(at("A-0-0", "ArrowLeft"), null, "and stops at the left wall of the first cabinet");

  // five across, then two across: keep your place rather than landing on bin 0
  assert.equal(at("A-0-0", "ArrowDown"), "A-1-0");
  assert.equal(at("A-0-4", "ArrowDown"), "A-1-1", "the far right of five is the far right of two");
  assert.equal(at("A-1-1", "ArrowUp"), "A-0-3");

  assert.equal(at("A-0-4", "ArrowRight"), "B-0-0", "off the end and into the next cabinet");
  assert.equal(at("B-0-0", "ArrowLeft"), "A-0-4", "and back again");
  assert.equal(at("B-0-4", "ArrowRight"), null, "the far end is the far end");

  assert.equal(at("A-0-2", "Home"), "A-0-0");
  assert.equal(at("A-0-2", "End"), "A-0-4");
  assert.equal(at("A-0-0", "ArrowUp"), null, "the top row has nothing above it");
  assert.equal(at("nope", "ArrowRight"), null, "and an unknown bin goes nowhere");
});
