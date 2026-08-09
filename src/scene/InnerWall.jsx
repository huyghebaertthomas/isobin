import { Face } from "./Face.jsx";

/**
 * The inner face of the cabinet's right-hand wall — the one upright interior
 * surface this camera looks into, and so the one that must not be left with the
 * back panel's fill.
 *
 * It belongs to the carcass, but it cannot be drawn with it: it stands the full
 * depth of the cabinet, and depth reads as up-and-left on screen, so unclipped
 * it would reach out past the mouth and paint over the frame and the top panel.
 * It goes inside the mouth clip instead, first of everything there — the clip
 * only ever opens toward the camera, which is exactly where this wall does not
 * go.
 */
export function InnerWall({ wall, material }) {
  return (
    <g stroke="none">
      <Face quad={wall} direction="side" material={material} />
    </g>
  );
}
