/**
 * Monotone-chain convex hull over screen-space points.
 * Used to build the clip region that keeps sliding bins inside the cabinet.
 */
export function convexHull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const cross = (o, a, b) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const half = (src) => {
    const out = [];
    for (const q of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    return out.slice(0, -1);
  };

  return [...half(sorted), ...half([...sorted].reverse())];
}
