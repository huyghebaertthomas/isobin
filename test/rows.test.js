import test from "node:test";
import assert from "node:assert/strict";

import { bin, buildScene, gap, resolveConfig, row } from "../src/core.js";

/**
 * What a row can be.
 *
 * A row used to be one bin type repeated across equal slots, which describes
 * the two organizers this started as and very little else. These tests are
 * mostly about the arrangements that were impossible then: unequal widths,
 * holes, mixed contents, and dividers decided per bin.
 *
 * Widths are checked as proportions rather than as numbers, because the numbers
 * depend on hardware settings that are nobody's business here — what has to
 * hold is that a bin spanning three slots is three slots wide.
 */

const wall = (rows, config) =>
  buildScene(
    resolveConfig({ ...config, layout: { ...config?.layout, organizers: [{ id: "A", rows }] } })
  );

const widths = (scene) => scene.bins.map((b) => b.box.w);
/** the innerWidth a row's contents actually consume, gaps and all */
const filled = (scene, innerWidth = 5) => {
  const bins = scene.bins;
  const left = Math.min(...bins.map((b) => b.box.x));
  return { left, spread: Math.max(...bins.map((b) => b.box.x + b.box.w)) - left, innerWidth };
};

test("a row is however many slots its contents add up to", () => {
  const scene = wall([{ bins: [{ span: 3, id: "L" }, { span: 4, id: "R" }] }]);
  const [l, r] = widths(scene);

  // three slots against four: the bins are in that ratio once the gap each
  // swallows is accounted for, which is what makes them read as 3/7 and 4/7
  const gapWidth = scene.bins[1].box.x - (scene.bins[0].box.x + scene.bins[0].box.w);
  const unit = (l - 2 * gapWidth) / 3;
  assert.ok(Math.abs((r - 3 * gapWidth) / 4 - unit) < 1e-9, "both are built from the same slot");
  assert.ok(l < r, "and three of them is less than four");

  // the row still fills the cabinet exactly, which is the invariant that makes
  // spans safe to change: nothing overflows and nothing is left over
  const { spread, innerWidth } = filled(scene);
  assert.ok(Math.abs(spread - innerWidth) < 1e-9, "the row fills its cabinet");
});

test("a gap is space in a row with no bin in it", () => {
  const scene = wall([{ bins: [{ id: "A1" }, { gap: 2 }, { id: "A2" }] }]);

  assert.deepEqual(
    scene.bins.map((b) => b.id),
    ["A1", "A2"],
    "a gap is not a bin, and never becomes one"
  );

  const [a1, a2] = scene.bins;
  assert.ok(Math.abs(a1.box.w - a2.box.w) < 1e-9, "the bins either side are unaffected");

  // the hole is three slots of clear air: its own two plus the one it takes
  // from each neighbour's gap. What matters is that it is there.
  const hole = a2.box.x - (a1.box.x + a1.box.w);
  assert.ok(hole > a1.box.w * 2, "and there is real space between them");

  const { spread, innerWidth } = filled(scene);
  assert.ok(Math.abs(spread - innerWidth) < 1e-9, "the row still fills the cabinet");
});

test("a row of one type and a count is unchanged", () => {
  // the shape almost every existing config is written in — this is the
  // regression that matters most, since it is what everyone already has
  const scene = wall([{ type: "small", count: 4 }]);
  const [first, ...rest] = widths(scene);

  assert.equal(scene.bins.length, 4);
  for (const w of rest) assert.ok(Math.abs(w - first) < 1e-9, "four equal bins");
  assert.deepEqual(
    scene.bins.map((b) => b.id),
    ["A-0-0", "A-0-1", "A-0-2", "A-0-3"]
  );
});

test("a row can mix types, and is as tall as the tallest thing in it", () => {
  const mixed = wall([{ bins: [{ type: "small" }, { type: "large", span: 2 }] }]);

  assert.deepEqual(
    mixed.bins.map((b) => b.type),
    ["small", "large"],
    "each bin keeps its own type"
  );

  // large is two row units, so the row is two units tall and both bins in it
  // are that tall — a row is a shelf, and a shelf has one height
  const [small, large] = mixed.bins;
  assert.equal(small.box.h, large.box.h);

  const plain = wall([{ type: "small" }]);
  assert.ok(mixed.bins[0].box.h > plain.bins[0].box.h, "taller than a one-unit row");

  // and a row may simply be told
  const told = wall([{ height: 3, bins: [{ type: "small" }] }]);
  assert.ok(told.bins[0].box.h > mixed.bins[0].box.h);
});

test("bins can be named one at a time, wherever they sit", () => {
  const scene = wall([
    { bins: [{ span: 2, id: "WIDE" }, { gap: 1 }, { id: "NARROW" }] },
    { type: "small", count: 2 },
  ]);

  assert.deepEqual(
    scene.bins.map((b) => b.id),
    ["WIDE", "NARROW", "A-1-0", "A-1-1"],
    "a named bin keeps its name; the rest fall back to their position"
  );

  // the gap does not count as a bin, so it does not shift the numbering either
  assert.equal(scene.binsById.get("NARROW").index, 1);
});

test("the helpers write the same thing you would have typed", () => {
  assert.deepEqual(bin(3, "L"), { span: 3, id: "L" });
  assert.deepEqual(bin(), { span: 1 });
  assert.deepEqual(gap(2), { gap: 2 });
  assert.deepEqual(row(bin(3, "L"), gap(), bin(3, "R")), {
    bins: [{ span: 3, id: "L" }, { gap: 1 }, { span: 3, id: "R" }],
  });
  assert.deepEqual(row({ height: 2 }, bin(1)), { height: 2, bins: [{ span: 1 }] });

  // which is the point of them: a layout is still data, so it still serialises
  const built = row(bin(3, "L"), gap(), bin(3, "R"));
  assert.deepEqual(JSON.parse(JSON.stringify(built)), built);

  // and the drawing cannot tell which way it was written
  const byHand = wall([{ bins: [{ span: 3, id: "L" }, { gap: 1 }, { span: 3, id: "R" }] }]);
  assert.deepEqual(widths(wall([built])), widths(byHand));
});

test("a row that cannot be built says why", () => {
  const fails = (rows, pattern) => assert.throws(() => wall(rows), pattern);

  fails([{}], /needs either a `type` or a `bins` list/);
  fails([{ bins: [{ gap: 2 }] }], /all gaps/);
  fails([{ bins: [{ span: 0 }] }], /`span` must be a whole number/);
  fails([{ bins: [{ span: 1.5 }] }], /`span` must be a whole number/);
  fails([{ bins: {} }], /`bins` must be an array/);
  fails([{ type: "small", height: 0 }], /`height` must be greater than zero/);
  fails([{ type: "small", divider: "sideways" }], /splits "width" or "depth"/);
  fails([{ type: "small", divider: 2.5 }], /divider count must be a whole number/);
  fails([{ type: "nope" }], /Unknown bin type "nope"/);

  // the error names the cabinet, because a wall of nine has to say which one
  fails([{ bins: [{ span: -1 }] }], /Cabinet A/);
});

test("the arrow keys steer by the space a bin takes, not by counting bins", async () => {
  const { neighbour } = await import("../src/lib/navigate.js");

  const scene = wall([
    { bins: [{ span: 3, id: "WIDE" }, { span: 3, id: "ALSO" }] },
    { type: "small", count: 6 },
  ]);

  // the left-hand bin covers the left half of the row, so down from it lands in
  // the left half below — counting bins would have sent it to bin 0 every time
  assert.equal(neighbour(scene, "WIDE", "ArrowDown"), "A-1-1");
  assert.equal(neighbour(scene, "ALSO", "ArrowDown"), "A-1-4");

  // and back up again from either side
  assert.equal(neighbour(scene, "A-1-0", "ArrowUp"), "WIDE");
  assert.equal(neighbour(scene, "A-1-5", "ArrowUp"), "ALSO");

  // a hole is passed over rather than stopped in
  const holed = wall([{ bins: [{ id: "L" }, { gap: 3 }, { id: "R" }] }, { type: "small", count: 2 }]);
  assert.equal(neighbour(holed, "L", "ArrowRight"), "R");
  assert.equal(neighbour(holed, "R", "ArrowLeft"), "L");
});
