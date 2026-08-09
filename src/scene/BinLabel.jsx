import { useProjection } from "../render/ProjectionContext.jsx";

/**
 * Lettering on the face of a bin.
 *
 * Drawn *into* the plane of the front face rather than sitting flat on top of
 * the picture: the face runs along world +x, which on screen goes right and
 * slightly up, so text laid on it has to lean the same way or it reads as a
 * sticker floating in front of the drawing.
 *
 * The lean is the whole transform. A step of one along the text's own x maps to
 * `(1, -depthScale)` on screen, which is the direction the face runs and is
 * exactly `depthScale` — the camera's foreshortening — expressed as a shear.
 * Text's y already points down the screen, which is the way the face falls, so
 * that column is left alone. Everything then lands at the face's centre, which
 * is what the translation is for.
 *
 * Nothing here measures anything: an SVG has no text metrics until it is in a
 * document, and by then it is too late to choose a size. So the size comes down
 * if the label is long enough to need it, on a plain estimate of how wide a
 * character is — good enough for part numbers, which is what goes on a bin.
 */
export function BinLabel({ bin, text, label }) {
  const { project, scale, depthScale } = useProjection();

  const face = bin.shape.shell.front;
  const middle = centre(face);
  const [x, y] = project(...middle);

  const value = String(text);
  const size = fitted(value, bin.box.w, label.size) * scale;

  return (
    <text
      transform={`matrix(1 ${-depthScale} 0 1 ${round(x)} ${round(y)})`}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={round(size)}
      fontFamily={label.family}
      fontWeight={label.weight}
      fill={label.fill}
      fillOpacity={label.opacity}
      stroke="none"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {value}
    </text>
  );
}

/** the middle of a quad, which for a parallelogram is the mean of its corners */
const centre = (quad) => [0, 1, 2].map((axis) => quad.reduce((sum, p) => sum + p[axis], 0) / quad.length);

/**
 * A size that will very likely fit. Monospaced digits and capitals run about
 * 0.6 em wide, so a label of n characters wants roughly `0.6 · n · size`; if
 * that is wider than the bin, the size comes down to suit, and never below
 * two thirds of what was asked for — past that it is unreadable anyway and
 * the honest answer is a shorter label.
 */
function fitted(text, width, size) {
  const wanted = text.length * size * 0.6;
  const room = width * 0.86; // leave the bin's own edges alone
  return wanted <= room ? size : Math.max(size * 0.66, (size * room) / wanted);
}

const round = (value) => Math.round(value * 1e3) / 1e3;
