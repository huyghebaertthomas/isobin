/** Screen-space bounding box of a set of projected points, plus padding. */
export function boundsOf(screenPoints, padding = {}) {
  if (!screenPoints.length) return { x: 0, y: 0, width: 0, height: 0, viewBox: "0 0 0 0" };

  const { top = 0, right = 0, bottom = 0, left = 0 } = padding;
  const xs = screenPoints.map((p) => p[0]);
  const ys = screenPoints.map((p) => p[1]);

  const x = Math.min(...xs) - left;
  const y = Math.min(...ys) - top;
  const width = Math.max(...xs) + right - x;
  const height = Math.max(...ys) + bottom - y;

  return { x, y, width, height, viewBox: `${x} ${y} ${width} ${height}` };
}
