/**
 * Axis-aligned boxes and the polygons derived from them.
 *
 * A box is `{ x, y, z, w, h, d }` in world units: its near-bottom-left corner
 * plus a size along each axis.
 */

export const box = (x, y, z, w, h, d) => ({ x, y, z, w, h, d });

/** the three faces of a box that are turned toward the camera */
export function cuboidFaces({ x, y, z, w, h, d }) {
  return {
    top: [
      [x, y + h, z],
      [x + w, y + h, z],
      [x + w, y + h, z + d],
      [x, y + h, z + d],
    ],
    front: [
      [x, y, z],
      [x + w, y, z],
      [x + w, y + h, z],
      [x, y + h, z],
    ],
    side: [
      [x, y, z],
      [x, y, z + d],
      [x, y + h, z + d],
      [x, y + h, z],
    ],
  };
}

/** all eight corners, for bounds calculations */
export function boxCorners({ x, y, z, w, h, d }) {
  const corners = [];
  for (const cx of [x, x + w]) {
    for (const cy of [y, y + h]) {
      for (const cz of [z, z + d]) corners.push([cx, cy, cz]);
    }
  }
  return corners;
}

/**
 * The nine edges of a box that are actually seen, each traced exactly once.
 *
 * Outlining the three drawn faces separately would stroke the two creases
 * twice — where the top meets the front, and where the side meets the front —
 * which is invisible while outlines are opaque and hairline, and obvious as
 * soon as they are not.
 */
export function cuboidEdges({ x, y, z, w, h, d }) {
  return [
    // the front face, closed
    [
      [x, y, z],
      [x + w, y, z],
      [x + w, y + h, z],
      [x, y + h, z],
      [x, y, z],
    ],
    // back along the side, and up to the crease it shares with the top
    [
      [x, y, z],
      [x, y, z + d],
      [x, y + h, z + d],
      [x, y + h, z],
    ],
    // the two edges of the top the others have not already drawn
    [
      [x, y + h, z + d],
      [x + w, y + h, z + d],
      [x + w, y + h, z],
    ],
  ];
}

/**
 * The edges of a shelf board: its whole top surface, plus the front lip below.
 *
 * A shelf spans the cabinet's interior exactly, so its two ends are buried in
 * the inner walls — outlining the whole cuboid would draw them anyway, as a
 * vertical border at either end of every shelf. The top surface is the one the
 * bins stand on, so it keeps its full outline.
 */
export function boardEdges({ x, y, z, w, h, d }) {
  const top = y + h;

  return [
    [
      [x, top, z],
      [x + w, top, z],
      [x + w, top, z + d],
      [x, top, z + d],
      [x, top, z],
    ],
    [
      [x, y, z],
      [x + w, y, z],
    ],
  ];
}

/**
 * The edges of a horizontal surface with no thickness — the cabinet floor.
 * Its front edge is the mouth's bottom edge, which the carcass already draws.
 */
export function deckEdges({ x, z, w, d }, y) {
  return [
    [
      [x, y, z],
      [x, y, z + d],
      [x + w, y, z + d],
      [x + w, y, z],
    ],
  ];
}

/**
 * Which segments a set of polylines covers, as keys that ignore direction, so
 * the same edge walked from either end matches.
 */
export function segmentsOf(lines) {
  const keys = new Set();
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) keys.add(segmentKey(line[i - 1], line[i]));
  }
  return keys;
}

/**
 * The same polylines with any segment already in `drawn` taken out, the rest
 * kept joined up where they still run on.
 *
 * This is what stops a bin whose walls have no thickness from outlining itself
 * twice: its cavity is then exactly its shell, and every edge of the one lands
 * on an edge of the other.
 */
export function withoutSegments(lines, drawn) {
  const kept = [];

  for (const line of lines) {
    let run = [];
    for (let i = 1; i < line.length; i++) {
      if (drawn.has(segmentKey(line[i - 1], line[i]))) {
        if (run.length > 1) kept.push(run);
        run = [];
      } else {
        if (!run.length) run.push(line[i - 1]);
        run.push(line[i]);
      }
    }
    if (run.length > 1) kept.push(run);
  }

  return kept;
}

const round = (value) => Math.round(value * 1e6) / 1e6;
const segmentKey = (a, b) => [a.map(round).join(), b.map(round).join()].sort().join("|");

/** the rectangle a box carves out of a plane at height `y` */
export function horizontalQuad({ x, z, w, d }, y) {
  return [
    [x, y, z],
    [x + w, y, z],
    [x + w, y, z + d],
    [x, y, z + d],
  ];
}
