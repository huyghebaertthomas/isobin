import { Edges } from "./Edges.jsx";
import { Face } from "./Face.jsx";

/**
 * The cabinet's own floor: the surface the bottom row stands on. It has no
 * thickness — it is a face of the carcass, not a board laid inside it — so it
 * is a single quad, outlined everywhere except along the mouth, which the
 * carcass draws.
 */
export function Deck({ deck, material }) {
  return (
    <g>
      <g stroke="none">
        <Face quad={deck.quad} direction="top" material={material} />
      </g>
      <Edges edges={deck.edges} material={material} />
    </g>
  );
}
