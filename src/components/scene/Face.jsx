import { useId } from "react";
import { axisGradient } from "../../lib/gradient.js";
import { useProjection } from "../../render/ProjectionContext.jsx";

/**
 * One filled face of a piece.
 *
 * Which of the three directions a face points decides its fill, and, when the
 * light ramps, where it stands between the light and the shadow decides how
 * that fill falls off across it. Every filled shape in the scene goes through
 * here, so `direction` is the one thing a component has to know about light.
 *
 * The gradient is emitted next to the shape that uses it rather than gathered
 * into the scene's `<defs>` — it is this face's and no other's, and `useId`
 * keeps the reference unique without a name having to be threaded down from
 * the scene. A gradient element draws nothing itself, so it is at home
 * anywhere.
 *
 * `d` is for the two faces with a hole knocked out of them, the cabinet's frame
 * and a bin's rim. The ramp is still measured off `quad`, the whole face before
 * the hole, so it runs exactly as it would have unbroken.
 */
export function Face({ quad, d, direction, material }) {
  const { points, project } = useProjection();
  const name = `f${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const face = material.faces[direction];
  const shade = material.ramp?.shades[direction];
  const ramp = shade ? axisGradient(quad, project, material.ramp.shadow) : null;
  const fill = ramp ? { ...face, fill: `url(#${name})` } : face;

  return (
    <>
      {ramp ? (
        <linearGradient id={name} gradientUnits="userSpaceOnUse" {...ramp}>
          <stop offset="0" stopColor={face.fill} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
      ) : null}

      {d ? (
        <path d={d} fillRule="evenodd" {...fill} />
      ) : (
        <polygon points={points(quad)} {...fill} />
      )}
    </>
  );
}
