import {
  box,
  cuboidEdges,
  cuboidFaces,
  horizontalQuad,
  segmentsOf,
  withoutSegments,
} from "../lib/cuboid.js";

/**
 * All polygons a bin is drawn from, in world space.
 *
 * A bin is a shell with the top face knocked out over its interior, so you look
 * down into three inside surfaces — floor, back wall and right wall. The other
 * two inside walls face away from the camera and are never drawn.
 *
 * Every edge is listed once. Outlining each face in full would stroke the two
 * creases between them twice over, so the shell is outlined first and the rim
 * and the cavity keep only what it has not already drawn. A wall of no
 * thickness is the case that makes this matter: the cavity is then exactly the
 * shell, every edge of the one lands on an edge of the other, and what should
 * look like a bin with paper-thin walls looked instead like a bin with a lid.
 *
 * Dividers are packed from a compartment COUNT, so every compartment comes out
 * exactly equal whatever the bin's width.
 */
export function buildBinShape(outer, divider, hw) {
  const wall = Math.max(0, hw.binWall);

  // interior cavity: walls on all four sides, floor at the bottom, open on top
  const ix = outer.x + wall;
  const iy = outer.y + wall;
  const iz = outer.z + wall;
  const iw = outer.w - wall * 2;
  const id = outer.d - wall * 2;
  const ih = outer.h - wall;

  const footprint = { x: ix, z: iz, w: iw, d: id };

  const shellEdges = cuboidEdges(outer);
  const drawn = segmentsOf(shellEdges);
  const mouth = horizontalQuad(footprint, outer.y + outer.h);

  return {
    shell: cuboidFaces(outer),
    edges: shellEdges,
    /** the opening cut out of the shell's top face */
    mouth,
    /** the rim, unless the walls are so thin that it is the shell's own top */
    mouthEdges: withoutSegments([[...mouth, mouth[0]]], drawn),
    interior: {
      floor: horizontalQuad(footprint, iy),
      back: [
        [ix, iy, iz + id],
        [ix + iw, iy, iz + id],
        [ix + iw, iy + ih, iz + id],
        [ix, iy + ih, iz + id],
      ],
      right: [
        [ix + iw, iy, iz],
        [ix + iw, iy, iz + id],
        [ix + iw, iy + ih, iz + id],
        [ix + iw, iy + ih, iz],
      ],
      /** the floor's outline and the three upright creases above it; the rim
       *  is already drawn as the mouth, and the shell as its own edges */
      edges: withoutSegments(
        [
          [
            [ix, iy, iz],
            [ix + iw, iy, iz],
            [ix + iw, iy, iz + id],
            [ix, iy, iz + id],
            [ix, iy, iz],
          ],
          [
            [ix, iy, iz + id],
            [ix, iy + ih, iz + id],
          ],
          [
            [ix + iw, iy, iz + id],
            [ix + iw, iy + ih, iz + id],
          ],
          [
            [ix + iw, iy, iz],
            [ix + iw, iy + ih, iz],
          ],
        ],
        drawn
      ),
    },
    dividers: buildDividers({ ix, iy, iz, iw, id, ih }, divider, hw),
  };
}

function buildDividers(cavity, divider, hw) {
  if (!divider) return [];

  const { ix, iy, iz, iw, id, ih } = cavity;
  const { axis, compartments } = divider;
  const thickness = hw.dividerThickness;
  const height = ih * hw.dividerHeightFraction;

  const span = axis === "x" ? iw : id;
  const compartment = (span - thickness * (compartments - 1)) / compartments;
  const start = axis === "x" ? ix : iz;

  const dividers = [];
  for (let i = 1; i < compartments; i++) {
    const at = start + compartment * i + thickness * (i - 1);
    dividers.push({ id: `d${i}`, at, ...panel(at, axis, thickness, height, cavity) });
  }

  // nearest last: within a bin the far divider has to be painted first
  return dividers.sort((a, b) => b.at - a.at);
}

/**
 * A divider of no thickness is a plane, not a box — drawing it as a box would
 * put its front and back outlines in exactly the same place.
 */
function panel(at, axis, thickness, height, { ix, iy, iz, iw, id }) {
  if (thickness > 0) {
    const body = axis === "x" ? box(at, iy, iz, thickness, height, id) : box(ix, iy, at, iw, height, thickness);
    return { faces: cuboidFaces(body), edges: cuboidEdges(body) };
  }

  const plane =
    axis === "x"
      ? [
          [at, iy, iz],
          [at, iy, iz + id],
          [at, iy + height, iz + id],
          [at, iy + height, iz],
        ]
      : [
          [ix, iy, at],
          [ix + iw, iy, at],
          [ix + iw, iy + height, at],
          [ix, iy + height, at],
        ];

  // it only faces one way now, so it shades as whichever family that is
  return { plane, face: axis === "x" ? "side" : "front", edges: [[...plane, plane[0]]] };
}
