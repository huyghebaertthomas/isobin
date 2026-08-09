import { useProjection } from "../render/ProjectionContext.jsx";
import { Cavity } from "./Cavity.jsx";

/**
 * Frosted glass on a bin's walls.
 *
 * SVG has no backdrop filter, so the effect is built by hand out of two blurred
 * stamps, both shown through the bin's walls with the open mouth cut out of
 * them — you look straight down into a bin there rather than through anything.
 *
 *   the cabinet   drawn a second time into `<defs>` and reached by `<use>`.
 *                 It is shifted back by however far the bin has travelled, with
 *                 the same transition, so it holds still while the bin slides
 *                 across it.
 *   the cavity    the bin's own insides and dividers, which is most of what
 *                 there is to see through a wall. It rides inside the sliding
 *                 group untouched, so it tracks the bin exactly.
 *
 * One filter serves both: its region is every pixel the bin can reach, which
 * contains the bin in either frame of reference, grown by the blur's own reach
 * so the smear is not cut off at the edges.
 */
export function Frost({ bin, frost, materials, undo }) {
  const { points, outline } = useProjection();
  const { shell, mouth } = bin.shape;

  const clipId = `${frost.uid}-glass-${bin.id}`;
  const filterId = `${frost.uid}-blur-${bin.id}`;
  const blur = `url(#${filterId})`;

  const reach = frost.blur * 3;
  const region = bin.screen;

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <path d={`${outline(shell.top)} ${outline(mouth)}`} clipRule="evenodd" />
          <polygon points={points(shell.front)} />
          <polygon points={points(shell.side)} />
        </clipPath>

        <filter
          id={filterId}
          filterUnits="userSpaceOnUse"
          x={region.x - reach}
          y={region.y - reach}
          width={region.width + reach * 2}
          height={region.height + reach * 2}
        >
          <feGaussianBlur stdDeviation={frost.blur} />
        </filter>
      </defs>

      <g clipPath={`url(#${clipId})`} opacity={frost.opacity}>
        <g style={undo}>
          <use href={`#${frost.backdropId}`} filter={blur} />
        </g>
        <g filter={blur}>
          <Cavity bin={bin} materials={materials} />
        </g>
      </g>
    </>
  );
}
