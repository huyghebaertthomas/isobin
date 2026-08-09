/**
 * Painter's order, derived rather than authored.
 *
 * Two points share a pixel when (x − z) and ((x + z)/2 + y) both match. Solving
 * those for depth along the view axis shows the nearer point is always the one
 * with the LARGER y. Height decides occlusion outright; x only breaks ties
 * between pieces at the same height.
 *
 * Sorting with this comparator yields farthest-first, which is the order the
 * pieces have to be painted in.
 */
export const paintOrder = (a, b) =>
  a.box.y + a.box.h / 2 - (b.box.y + b.box.h / 2) ||
  b.box.x + b.box.w / 2 - (a.box.x + a.box.w / 2);

/**
 * Cabinets stand side by side at the same height, so the height term above
 * never separates them — they are ordered on x alone, farthest (largest x)
 * first.
 */
export const cabinetOrder = (a, b) => b.body.x - a.body.x;
