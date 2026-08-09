import { useProjection } from "../../render/ProjectionContext.jsx";
import { Bin } from "./Bin.jsx";
import { Carcass } from "./Carcass.jsx";
import { Deck } from "./Deck.jsx";
import { InnerWall } from "./InnerWall.jsx";
import { Shelf } from "./Shelf.jsx";

/**
 * One cabinet. The carcass is painted first and whole; everything that lives
 * inside it is then drawn into the clipped mouth, farthest piece first.
 *
 * One clip, the mouth itself, and it has to stay outside the bins' sliding
 * transform. `userSpaceOnUse` resolves a clip in the user space of whatever
 * refers to it, so a clip referenced from inside a bin travels with the bin —
 * a second, tighter clip on the fills alone slid right along with a bin as it
 * opened and cut every one of its fills away. Whatever a piece needs of its own
 * outline it has to get some other way; see `Carcass` for how the frame keeps
 * its inner edge.
 *
 * When the bins are frosted the cabinet is also put in `<defs>` under its own
 * id. That copy is never drawn; it is only what each bin blurs to make its
 * glass, and while the blur is zero it is not emitted at all.
 */
export function Organizer({ organizer, ids, materials, slide, isOpen, onToggle, frost }) {
  const { screenPoints } = useProjection();

  return (
    <g>
      <defs>
        <clipPath id={ids.mouth}>
          <polygon points={screenPoints(organizer.clip)} />
        </clipPath>

        {frost ? (
          <g id={frost.backdropId}>
            <Carcass organizer={organizer} bandId={ids.backdropBand} material={materials.cabinet} />
            <g clipPath={`url(#${ids.mouth})`}>
              <InnerWall wall={organizer.innerWall} material={materials.cabinet} />
              <Deck deck={organizer.floor} material={materials.shelf} />
              {organizer.shelves.map((shelf) => (
                <Shelf key={shelf.id} shelf={shelf} material={materials.shelf} />
              ))}
            </g>
          </g>
        ) : null}
      </defs>

      <Carcass organizer={organizer} bandId={ids.band} material={materials.cabinet} />

      <g clipPath={`url(#${ids.mouth})`}>
        <InnerWall wall={organizer.innerWall} material={materials.cabinet} />
        <Deck deck={organizer.floor} material={materials.shelf} />

        {organizer.pieces.map((piece) =>
          piece.kind === "shelf" ? (
            <Shelf key={piece.id} shelf={piece} material={materials.shelf} />
          ) : (
            <Bin
              key={piece.id}
              bin={piece}
              open={isOpen(piece.id)}
              onToggle={onToggle}
              materials={materials}
              slide={slide}
              frost={frost}
            />
          )
        )}
      </g>
    </g>
  );
}
