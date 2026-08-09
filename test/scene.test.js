import test from "node:test";
import assert from "node:assert/strict";

import { defaultConfig, resolveConfig } from "../src/config/index.js";
import { buildScene } from "../src/models/scene.js";
import { box, cuboidEdges, cuboidFaces, segmentsOf } from "../src/lib/cuboid.js";
import { axisGradient } from "../src/lib/gradient.js";
import { createProjection } from "../src/lib/projection.js";

const near = (actual, expected, message) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${message ?? ""} expected ${expected}, got ${actual}`
  );

const scene = buildScene(defaultConfig);
const [a, b] = scene.organizers;

test("cabinets are sized from their row lists", () => {
  // 5 wide inside + frame either side; 12 row units tall + frame top and
  // bottom, less the one shelf the bottom row does without
  near(a.body.w, 5.36, "cabinet A width");
  near(a.body.h, 7.71, "cabinet A height");
  near(a.body.d, 2, "cabinet A depth");

  // 6 small + 2 medium + 2 double-height large rows = 12 units, same as A
  near(b.body.h, 7.71, "cabinet B height");
  assert.equal(b.rows.length, 10);
});

test("cabinets are placed left to right with a gap, not by hand", () => {
  near(a.body.x, 0);
  near(b.body.x, a.body.w + defaultConfig.layout.gap);
});

test("bin counts follow from perRow", () => {
  assert.equal(a.bins.length, 60); // 12 rows x 5
  assert.equal(b.bins.length, 36); // 6x5 + 2x2 + 2x1
  assert.equal(scene.bins.length, 96);
});

test("the first bin lands where the geometry says it should", () => {
  const bin = a.bins[0];
  near(bin.box.x, 0.18, "x sits flush against the inner wall");
  near(bin.box.y, 7.0, "y");
  near(bin.box.z, 0.05, "z");
  near(bin.box.w, 0.952, "w"); // (5 - 4 gaps) / 5
  near(bin.box.h, 0.49, "h");
  near(bin.box.d, 1.7, "d");
  near(bin.pull, 1.2, "pull is capped by the small bin's maxPull");
});

test("rows fill the cabinet exactly, with the gaps between the bins", () => {
  const { binGap } = defaultConfig.hardware;

  for (const organizer of scene.organizers) {
    for (const row of organizer.rows) {
      const bins = row.binIds.map((id) => scene.binsById.get(id));
      const last = bins[bins.length - 1].box;
      const where = `row ${row.index} of ${organizer.id}`;

      // flush at both ends, so the row is the inner width with no half-gaps
      near(bins[0].box.x, organizer.body.x + organizer.hardware.frame, `${where} starts flush`);
      near(last.x + last.w - bins[0].box.x, organizer.innerWidth, where);

      for (let i = 1; i < bins.length; i++) {
        const previous = bins[i - 1].box;
        near(bins[i].box.x - (previous.x + previous.w), binGap, `${where} gap ${i}`);
      }
    }
  }
});

test("shelves separate rows, so the bottom row stands on the carcass floor", () => {
  for (const organizer of scene.organizers) {
    assert.equal(organizer.shelves.length, organizer.rows.length - 1);

    const floor = organizer.body.y + defaultConfig.hardware.frame;
    const lowest = Math.min(...organizer.shelves.map((shelf) => shelf.box.y));
    assert.ok(lowest > floor, `no shelf laid on the floor of ${organizer.id}`);

    // the cabinet's own floor is what the bottom row rests on
    near(organizer.floor.quad[0][1], floor, "floor level");
    const bottom = organizer.rows[organizer.rows.length - 1];
    near(scene.binsById.get(bottom.binIds[0]).box.y, floor, "bottom bin rests on it");
  }
});

test("the interior wall spans the cabinet, standing on the floor", () => {
  const { frame } = defaultConfig.hardware;

  for (const organizer of scene.organizers) {
    const wall = organizer.innerWall;
    const right = organizer.body.x + organizer.body.w - frame;
    const where = `cabinet ${organizer.id}`;

    // upright and at x = max: the inner face of the wall opposite the one we see
    assert.ok(wall.every(([x]) => Math.abs(x - right) < 1e-9), `${where} is not the right wall`);
    near(Math.min(...wall.map(([, y]) => y)), organizer.floor.quad[0][1], `${where} stands on the floor`);
    near(Math.max(...wall.map(([, y]) => y)), organizer.body.y + organizer.body.h - frame, where);

    // it runs the full interior depth, from the mouth back to the back panel
    const depths = wall.map(([, , z]) => z);
    near(Math.min(...depths), organizer.body.z, `${where} starts at the mouth`);
    near(Math.max(...depths), organizer.body.z + organizer.hardware.depth - frame, where);
  }
});

test("every row opens by the same height, bottom row included", () => {
  const { shelfThickness, rowHeight } = defaultConfig.hardware;

  for (const organizer of scene.organizers) {
    for (const row of organizer.rows) {
      const bin = scene.binsById.get(row.binIds[0]);
      const rowUnits = bin.box.h === defaultConfig.hardware.binHeight ? 1 : 2;

      // from where the bins stand to the underside of whatever is above them
      near(
        row.y + row.height - bin.box.y,
        rowUnits * rowHeight - shelfThickness,
        `row ${row.index} of ${organizer.id}`
      );
    }
  }
});

test("bins of a type are all the same height, whatever the row pitch", () => {
  const heights = new Map();
  for (const bin of scene.bins) {
    const seen = heights.get(bin.type);
    if (seen === undefined) heights.set(bin.type, bin.box.h);
    else near(bin.box.h, seen, `every ${bin.type} bin`);
  }

  near(heights.get("small"), defaultConfig.hardware.binHeight, "a one-unit bin is binHeight tall");
});

test("row height moves the rows without resizing the bins", () => {
  const taller = buildScene(resolveConfig({ hardware: { rowHeight: 0.9 } }));
  const single = (built) => built.bins.find((bin) => bin.type === "small").box.h;

  near(single(taller), single(scene), "a one-unit bin is untouched");
  assert.ok(taller.organizers[0].body.h > a.body.h, "but the cabinet grows");
});

test("large bins are twice as tall and reach further out", () => {
  const small = b.bins.find((bin) => bin.type === "small");
  const large = b.bins.find((bin) => bin.type === "large");
  near(large.box.h - small.box.h, defaultConfig.hardware.rowHeight, "extra row unit of height");
  assert.ok(large.pull > small.pull);
});

test("dividers come from a compartment count and split the bin equally", () => {
  const byType = (type) => scene.bins.find((bin) => bin.type === type);

  assert.equal(byType("small").shape.dividers.length, 1);
  assert.equal(byType("medium").shape.dividers.length, 1);
  assert.equal(byType("large").shape.dividers.length, 2);

  assert.equal(byType("small").divider.axis, "z", "small splits depth-wise");
  assert.equal(byType("medium").divider.axis, "x");

  // three equal compartments across a large bin
  const large = byType("large");
  const { dividerThickness } = defaultConfig.hardware;
  const inner = large.box.w - defaultConfig.hardware.binWall * 2;
  const [far, near_] = large.shape.dividers;
  near(near_.at - (large.box.x + defaultConfig.hardware.binWall), (inner - dividerThickness * 2) / 3);
  near(far.at - near_.at, (inner - dividerThickness * 2) / 3 + dividerThickness);
});

test("an optional divider can be left out row by row", () => {
  const bare = buildScene(
    resolveConfig({
      layout: {
        organizers: [{ id: "X", name: "X", rows: [{ type: "small", divided: false }] }],
      },
    })
  );
  assert.equal(bare.bins[0].shape.dividers.length, 0);

  // large bins are not optional, so asking still leaves them divided
  const large = buildScene(
    resolveConfig({
      layout: {
        organizers: [{ id: "X", name: "X", rows: [{ type: "large", divided: false }] }],
      },
    })
  );
  assert.equal(large.bins[0].shape.dividers.length, 2);
});

test("row count overrides re-slice the row without leaving a gap", () => {
  const wide = buildScene(
    resolveConfig({
      layout: {
        organizers: [{ id: "X", name: "X", rows: [{ type: "small", count: 4 }] }],
      },
    })
  );
  assert.equal(wide.bins.length, 4);
  near(wide.bins[0].box.w, (5 - defaultConfig.hardware.binGap * 3) / 4);
});

test("layout changes reframe the view instead of needing a new viewBox", () => {
  const wider = buildScene(
    resolveConfig({
      layout: { organizers: [...defaultConfig.layout.organizers, { id: "C", name: "C", rows: ["small"] }] },
    })
  );
  assert.ok(wider.bounds.width > scene.bounds.width);
  assert.match(scene.bounds.viewBox, /^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
});

test("the table is measured from the cabinets and framed with them", () => {
  const { table } = scene;
  const { overhang, thickness } = defaultConfig.layout.table;

  near(table.body.y + table.body.h, a.body.y, "its top is what the cabinets stand on");
  near(table.body.h, thickness);
  near(table.body.x, a.body.x - overhang, "it reaches past the leftmost cabinet");
  near(table.body.x + table.body.w, b.body.x + b.body.w + overhang, "and past the rightmost");

  const bare = buildScene(resolveConfig({ layout: { table: { enabled: false } } }));
  assert.equal(bare.table, null);
  assert.ok(scene.bounds.height > bare.bounds.height, "the view makes room for it");
});

test("a bin with no wall is still an open bin, outlined only once", () => {
  const thin = buildScene(resolveConfig({ hardware: { binWall: 0 } }));
  const bin = thin.bins[0];

  assert.ok(bin.shape.interior, "it keeps its insides");
  assert.equal(bin.shape.dividers.length, 1, "and its divider");

  // the cavity is exactly the shell, so nothing of it may be outlined twice
  assert.deepEqual(bin.shape.mouthEdges, [], "the rim is the shell's own top");
  const drawn = segmentsOf(bin.shape.edges);
  for (const key of segmentsOf(bin.shape.interior.edges)) {
    assert.ok(!drawn.has(key), `${key} is drawn twice`);
  }

  // a real wall keeps a rim of its own
  assert.ok(scene.bins[0].shape.mouthEdges.length > 0);
});

test("a divider with no thickness is a plane rather than a flattened box", () => {
  const flat = buildScene(resolveConfig({ hardware: { dividerThickness: 0 } }));
  const [divider] = flat.bins[0].shape.dividers;

  assert.equal(divider.faces, undefined);
  assert.equal(divider.plane.length, 4);
  assert.equal(divider.edges.length, 1, "one ring, not three coincident faces");
});

test("every edge of a box is traced exactly once", () => {
  const seen = new Set();
  for (const line of cuboidEdges(box(0, 0, 0, 2, 3, 4))) {
    for (let i = 1; i < line.length; i++) {
      const ends = [line[i - 1].join(), line[i].join()].sort().join("|");
      assert.ok(!seen.has(ends), `edge ${ends} drawn twice`);
      seen.add(ends);
    }
  }
  assert.equal(seen.size, 9, "three faces meeting at a corner show nine edges");
});

test("painter's order runs farthest first", () => {
  // cabinets: larger x is further from the camera
  assert.deepEqual(
    scene.order.map((organizer) => organizer.id),
    ["B", "A"]
  );

  // pieces: never paint something lower before something higher in the cabinet
  for (const organizer of scene.organizers) {
    const centres = organizer.pieces.map((piece) => piece.box.y + piece.box.h / 2);
    for (let i = 1; i < centres.length; i++) assert.ok(centres[i] >= centres[i - 1] - 1e-9);
  }
});

test("a face's ramp runs square to the light's level lines", () => {
  const { project } = createProjection(defaultConfig.view);
  const faces = cuboidFaces(box(0, 0, 0, 2, 3, 4));
  const shadow = ([, y]) => -y; // lit from above: the shadow deepens downward

  const ramp = axisGradient(faces.side, project, shadow);
  const run = [ramp.x2 - ramp.x1, ramp.y2 - ramp.y1];

  // the top edge of that face is a level line — the ramp must not lean along it
  const [a, b] = [project(0, 3, 0), project(0, 3, 4)];
  const level = [b[0] - a[0], b[1] - a[1]];
  near(level[0] * run[0] + level[1] * run[1], 0, "the ramp is square to the level line");

  // it starts lit, on the top edge, and ends level with the bottom one
  assert.ok([a, b].some(([x, y]) => Math.abs(x - ramp.x1) < 1e-9 && Math.abs(y - ramp.y1) < 1e-9));
  const foot = project(0, 0, 0);
  const reach = [ramp.x2 - foot[0], ramp.y2 - foot[1]];
  near(level[0] * reach[1] - level[1] * reach[0], 0, "and reaches the far edge exactly");

  // a face square to the light is level all over, so there is nothing to ramp
  assert.equal(axisGradient(faces.top, project, shadow), null);
});

test("projection matches the original isometric camera", () => {
  const { project, pullOffset } = createProjection(defaultConfig.view);
  assert.deepEqual(project(1, 0, 0), [24, -12]);
  assert.deepEqual(project(0, 1, 0), [0, -24]);
  assert.deepEqual(project(0, 0, 1), [-24, -12]);
  assert.deepEqual(pullOffset(1), [24, 12]);
});

test("unknown bin types fail loudly", () => {
  assert.throws(
    () => buildScene(resolveConfig({ layout: { organizers: [{ id: "X", name: "X", rows: ["huge"] }] } })),
    /Unknown bin type "huge"/
  );
});
