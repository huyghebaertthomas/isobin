/**
 * Isometric projection.
 *
 *   world axes:  x → along the cabinet face
 *                y → up
 *                z → into the wall (depth)
 *
 * The depth term in the y projection is negative, which puts the camera at
 * (-x, +y, -z). That makes the three faces we draw — top, z = min, x = min —
 * the ones actually turned toward us, and -z the direction a bin travels when
 * it slides out.
 *
 * `scale` is screen units per world unit; `depthScale` is how much the depth
 * axis is foreshortened vertically (0.5 gives the classic 2:1 isometric look).
 */
export function createProjection({ scale, depthScale }) {
  /** world point → screen point */
  const project = (x, y, z) => [(x - z) * scale, -(x + z) * scale * depthScale - y * scale];

  /** already-projected points → SVG `points` attribute */
  const screenPoints = (screen) => screen.map((p) => p.join(",")).join(" ");

  /** world points → SVG `points` attribute */
  const points = (world) => screenPoints(world.map((p) => project(...p)));

  /** world points → closed SVG path, so several rings can share one `d` */
  const outline = (world) => `M${points(world).replace(/ /g, "L").replace(/,/g, " ")}Z`;

  /** sliding out means z decreases → on screen the bin moves right and down */
  const pullOffset = (distance) => [distance * scale, distance * scale * depthScale];

  return { scale, depthScale, project, points, screenPoints, outline, pullOffset };
}
