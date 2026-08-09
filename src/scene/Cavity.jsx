import { Divider } from "./Divider.jsx";
import { Edges } from "./Edges.jsx";
import { Face } from "./Face.jsx";

/**
 * What is inside a bin: the three surfaces you look down onto, and whatever
 * dividers stand in them.
 *
 * It is drawn twice — once behind the bin's walls, and once again, blurred,
 * as what shows through them when the bin is frosted.
 */
export function Cavity({ bin, materials }) {
  const { interior, dividers } = bin.shape;

  return (
    <g>
      {/* the inside of the back wall faces the camera like any front, and the
          inside of the right wall like any side, so they light the same way */}
      <g stroke="none">
        <Face quad={interior.floor} direction="top" material={materials.binInterior} />
        <Face quad={interior.back} direction="front" material={materials.binInterior} />
        <Face quad={interior.right} direction="side" material={materials.binInterior} />
      </g>
      <Edges edges={interior.edges} material={materials.binInterior} />

      {dividers.map((divider) => (
        <Divider key={divider.id} divider={divider} material={materials.divider} />
      ))}
    </g>
  );
}
