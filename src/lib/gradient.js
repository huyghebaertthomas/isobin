/**
 * Where a linear gradient has to start and end for it to ramp along a world
 * direction across one face.
 *
 * A box face projects to a parallelogram, and two of its edges lie along the
 * light's own level lines — those are the stripes the ramp has to follow. SVG
 * does not take stripes though: it takes a vector, and reads a point's place in
 * the ramp as its projection onto that vector. So the vector has to be the part
 * of the offset between the two level edges that is square to them. Handing it
 * the whole offset instead leans the ramp over and shades a corner rather than
 * the face.
 *
 * Returns null when there is no ramp to draw: a face square to the light is
 * level all over, which is exactly the face the light leaves flat.
 */
export function axisGradient(quad, project, shadow) {
  const into = quad.map((corner) => shadow(corner));
  const lit = [];
  const dark = [];

  const middle = (Math.min(...into) + Math.max(...into)) / 2;
  quad.forEach((corner, i) => (into[i] < middle ? lit : dark).push(project(...corner)));
  if (lit.length !== 2 || dark.length !== 2) return null;

  // the lit edge, and how far the dark one lies off it
  const [start] = lit;
  const edge = [lit[1][0] - start[0], lit[1][1] - start[1]];
  const off = [dark[0][0] - start[0], dark[0][1] - start[1]];

  const span = edge[0] * edge[0] + edge[1] * edge[1];
  const along = span > 0 ? (off[0] * edge[0] + off[1] * edge[1]) / span : 0;
  const run = [off[0] - along * edge[0], off[1] - along * edge[1]];
  if (Math.hypot(...run) < 1e-9) return null;

  return {
    x1: round(start[0]),
    y1: round(start[1]),
    x2: round(start[0] + run[0]),
    y2: round(start[1] + run[1]),
  };
}

const round = (value) => Math.round(value * 1e3) / 1e3;
