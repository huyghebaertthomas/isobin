import { boundsOf } from "../lib/bounds.js";
import { boardEdges, box, boxCorners, deckEdges, horizontalQuad } from "../lib/cuboid.js";
import { paintOrder } from "../lib/ordering.js";
import { expandRows } from "./rows.js";
import { fittedDivider, pullDistance } from "./binType.js";
import { buildBinShape } from "./binShape.js";

/**
 * Build one cabinet: its carcass, its shelves, and the bins sitting on them.
 *
 * Nothing here is positioned by hand. Rows stack downward from the top of the
 * carcass by their own height, and each row divides the cabinet's inner width
 * into equal slots, so the geometry follows from the row list alone.
 *
 * A shelf is what separates one row from the next, so there is one fewer shelf
 * than there are rows: the bottom row stands on the carcass floor, which is a
 * surface of the cabinet rather than a board laid on top of it. That row is
 * therefore short of one board, and the cabinet is too — otherwise the bottom
 * row would open a shelf's thickness taller than every other row.
 */
export function buildOrganizer(def, ctx) {
  // a cabinet may deviate from the system-wide hardware
  const hw = { ...ctx.hardware, ...(def.hardware ?? {}) };
  const innerWidth = def.innerWidth ?? ctx.innerWidth;

  const rows = expandRows(def.rows, ctx.binTypes);
  const heightUnits = rows.reduce((sum, row) => sum + row.type.rowUnits, 0);

  // the bottom row is the one without a shelf, so the cabinet does without
  // that board's thickness as well and every row opens by the same amount
  const floorBoard = rows.length ? hw.shelfThickness : 0;

  const body = box(
    ctx.x,
    ctx.baseline,
    0,
    innerWidth + hw.frame * 2,
    heightUnits * hw.rowHeight - floorBoard + hw.frame * 2,
    hw.depth
  );

  const interiorDepth = hw.depth - hw.frame;
  const binDepth = interiorDepth - hw.binDepthInset;

  const bins = [];
  const shelves = [];
  const rowModels = [];

  let cursor = body.y + body.h - hw.frame; // top of the interior, walking down

  rows.forEach((row, rowIndex) => {
    // the last row rests on the carcass floor, so it needs no shelf of its own
    // — and gives up that thickness, so its opening matches the rest
    const shelved = rowIndex < rows.length - 1;
    const deck = shelved ? hw.shelfThickness : 0;

    const rowHeight = row.type.rowUnits * hw.rowHeight - (shelved ? 0 : floorBoard);
    cursor -= rowHeight;

    // a board of no thickness is nothing to draw, only three coincident edges
    if (shelved && deck > 0) {
      const shelfBox = box(
        body.x + hw.frame,
        cursor,
        body.z,
        body.w - hw.frame * 2,
        deck,
        interiorDepth - hw.shelfDepthInset
      );

      shelves.push({
        id: `${def.id}-shelf-${rowIndex}`,
        kind: "shelf",
        organizerId: def.id,
        row: rowIndex,
        box: shelfBox,
        edges: boardEdges(shelfBox),
      });
    }

    // space between, not around: the gaps fall between bins, so the outermost
    // bins sit flush against the cabinet's inner walls
    const binWidth = (innerWidth - hw.binGap * (row.count - 1)) / row.count;
    const binHeight = hw.binHeight + (row.type.rowUnits - 1) * hw.rowHeight;

    const divider = fittedDivider(row.type, row.divided);
    const rowBins = [];

    for (let i = 0; i < row.count; i++) {
      const outer = box(
        body.x + hw.frame + i * (binWidth + hw.binGap),
        cursor + deck,
        body.z + hw.binFrontInset,
        binWidth,
        binHeight,
        binDepth
      );

      const pull = pullDistance(row.type, outer.d, hw.binPullFraction);

      rowBins.push({
        id: `${def.id}-${rowIndex}-${i}`,
        kind: "bin",
        organizerId: def.id,
        organizerName: def.name,
        type: row.typeName,
        row: rowIndex,
        index: i,
        label: `${def.name} · row ${rowIndex + 1} · bin ${i + 1}`,
        box: outer,
        divider,
        pull,
        shape: buildBinShape(outer, divider, hw),
        screen: travelBounds(outer, pull, ctx.projection),
      });
    }

    bins.push(...rowBins);
    rowModels.push({
      index: rowIndex,
      type: row.typeName,
      y: cursor,
      height: rowHeight,
      binIds: rowBins.map((b) => b.id),
    });
  });

  // The surface the bottom row stands on. It belongs to the carcass rather
  // than to any row, so it has no thickness of its own — just the horizontal
  // face you look down onto, and the edges where it meets the inner walls.
  const floorPlan = { x: body.x + hw.frame, z: body.z, w: innerWidth, d: interiorDepth };
  const floorLevel = body.y + hw.frame;
  const ceilingLevel = body.y + body.h - hw.frame;
  const floor = {
    quad: horizontalQuad(floorPlan, floorLevel),
    edges: deckEdges(floorPlan, floorLevel),
  };

  // The one upright interior surface this camera can see into: the inner face
  // of the right-hand wall. It faces the way every left/right face does, so it
  // shades as one. Whatever else shows through the mouth is the back panel,
  // which faces the camera like any front.
  const innerWall = [
    [floorPlan.x + innerWidth, floorLevel, body.z],
    [floorPlan.x + innerWidth, floorLevel, body.z + interiorDepth],
    [floorPlan.x + innerWidth, ceilingLevel, body.z + interiorDepth],
    [floorPlan.x + innerWidth, ceilingLevel, body.z],
  ];

  // The cabinet mouth, in world space. Everything inside the carcass is drawn
  // clipped to this (swept along the pull direction), so the carcass itself can
  // be one continuous piece painted once, underneath.
  const opening = [
    [body.x + hw.frame, body.y + hw.frame, body.z],
    [body.x + body.w - hw.frame, body.y + hw.frame, body.z],
    [body.x + body.w - hw.frame, body.y + body.h - hw.frame, body.z],
    [body.x + hw.frame, body.y + body.h - hw.frame, body.z],
  ];

  return {
    id: def.id,
    name: def.name,
    hardware: hw,
    innerWidth,
    body,
    floor,
    innerWall,
    opening,
    maxPull: bins.reduce((max, bin) => Math.max(max, bin.pull), 0),
    rows: rowModels,
    bins,
    shelves,
    /** shelves and bins interleaved, farthest first */
    pieces: [...bins, ...shelves].sort(paintOrder),
  };
}

/**
 * Every pixel a bin can cover, shut or fully drawn out.
 *
 * The frosted backdrop behind a bin is rasterised to this box, so the blur only
 * ever has to cover the bin rather than the whole cabinet.
 */
function travelBounds(body, pull, projection) {
  const corners = boxCorners(body).map((corner) => projection.project(...corner));
  const [dx, dy] = projection.pullOffset(pull);
  return boundsOf([...corners, ...corners.map(([x, y]) => [x + dx, y + dy])]);
}
