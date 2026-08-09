# How isobin works

How the drawing is put together, for anyone changing it. For how to *use* it,
see the [readme](README.md).

## Where things live

```
src/
  index.js     isobin        — the React component, and everything below
  core.js      isobin/core   — the same minus React
  svg.js       isobin/svg    — a drawing as a string
  types.js     the shapes, in JSDoc; no runtime

  config/      what a drawing IS — every dimension, layout, timing and colour
  lib/         pure maths: projection, cuboids, hulls, paint order, bounds
  models/      config + maths → a scene of cabinets, shelves and bins
  render/      materials, the projection context, scene-unique ids
  scene/       SVG components; they draw the scene, they don't compute it
  hooks/       open/closed state and the idle animation

demo/          the playground: page chrome, control panel, and its schema
test/          geometry, config and the built package's public surface
```

The dependency arrow only ever points left: `lib` knows nothing about config,
`models` know nothing about React, and components never do geometry. Everything
a component draws was already worked out in `models/`.

That layering is what makes three entry points cheap rather than a rewrite:
`core.js` is the part of the tree that was already React-free, and `svg.js` is
the component rendered once through `renderToStaticMarkup`.

```bash
npm install
npm run dev        # the demo, http://localhost:5173
npm test           # builds, then checks geometry, config and the built package
npm run build      # dist/ — bundles and declarations
```

The test script names its four files rather than globbing them. A glob is only
expanded by Node itself from v22, and letting Node discover tests on its own
sweeps up `test/types/consumer.ts` — which is a fixture for the type checker,
not a test, and which older Node cannot even parse. Add a test file and add it
to the list.

## Ids, and why scenes need names

Everything the scene refers to by url — clip paths, frost backdrops, one
gradient per ramped face — needs an SVG id, and an SVG id is global to the
document however deeply it is nested. In a browser `useId` settles that: it is
unique per React root and per position in the tree, so any number of mounted
drawings get their own.

Server rendering breaks that guarantee, because the counter behind `useId`
restarts on every `renderToStaticMarkup` call. Render two drawings in two calls,
put both in one page, and the second one's `url(#…)` resolves to the first one's
gradients — it comes out wearing the wrong colours, silently. Hence `idPrefix`:
name a drawing and it is answerable for its own uniqueness. `renderToSVG` takes
a fresh one per call so the common case needs no thought.

## Frosted bins

`appearance.glass` frosts the bins: `blur` is how far what is behind a wall is
smeared, `opacity` how strongly it shows through. SVG has no backdrop filter, so
it is built by hand, out of two blurred stamps shown through the bin's walls
with the open mouth cut out of them — you look straight down into a bin there
rather than through anything:

- **the cavity** — the bin's own insides and dividers, which is most of what
  there is to see through a wall. It rides inside the sliding group untouched,
  so it tracks the bin exactly.
- **the cabinet** — carcass, floor and shelves, drawn a second time into
  `<defs>` and reached by `<use>`. It is shifted back by however far the bin has
  travelled, with the same transition, so it holds still while the bin slides
  across it.

Other bins are not in the backdrop; that would mean redrawing every bin once per
bin. At `blur: 0`, the default, none of it is emitted at all.

## Light

An isometric camera only ever shows three faces of a box: one horizontal, two
upright. `appearance.shading` gives each direction its own fill — `lit` takes
the surface's own colour, the next direction round is one `strength` darker and
the last is two — which reads as a solid rather than as a wireframe, without a
single extra polygon.

Which of the three a surface belongs to is a matter of which way it faces, not
of what it is part of. The inside of a bin's back wall faces the camera like any
front; the cabinet's inner right wall — the one upright interior surface this
camera can look into — faces the way its outer left wall does, and takes the
same fill. A divider with no thickness is a single plane, so it takes the one
direction it has.

The order round is tops → sides → fronts, so the default lights it from above
and in front. Point `lit` at any of the three and the other two fall away from
it in that same order. Keep `strength` low; it should look like one object under
a light, not like three colours. Turning it off gives every face the surface's
own colour again.

Fills are darkened by mixing toward black, the way a surface turned away from
the light keeps a proportion of what it reflects. A colour the mixer cannot read
— a named colour, `rgb()`, a gradient — is handed back untouched, so an unshaded
face is the worst that happens.

### The ramp

`shading.gradient` adds a falloff across each face on top of that flat step: a
face runs from its own fill where it meets the light to `strength` darker at its
far end. So the flat step says which way a face points and the ramp says how far
along it you are looking.

The shadow deepens along the lit face's own normal — down when the tops are lit,
rightward when the sides are, backward when the fronts are. That is the one
direction that leaves the lit face level, since it is square to it, and takes
the other two the whole way, which is exactly the split wanted: the lit face
stays flat and the other two ramp.

A face projects to a parallelogram, and two of its edges lie along the light's
level lines. SVG will not take level lines though — it takes a vector, and reads
a point's place in the ramp as its projection onto that vector. So the vector
has to be the part of the offset between those two edges that is *square* to
them (`lib/gradient.js`). Hand it the whole offset and the ramp leans over and
shades a corner instead of the face.

Each face carries its own gradient, emitted beside the shape rather than
gathered into the scene's `<defs>`: a gradient draws nothing itself, so it is at
home anywhere. Its name is `useId` for the face within the drawing, under the
drawing's own name for the page — see [Ids](#ids-and-why-scenes-need-names).
That is one gradient per ramped face, a few hundred over the default wall, which
is what `shading.gradient.enabled` is for if it is ever too many.

## Bin height and row pitch

`hardware.rowHeight` is the pitch of one row; `hardware.binHeight` is how tall a
bin filling one row is. They are independent, so the rows can be spread out
without the bins growing to match. A bin spanning n rows is `binHeight` tall plus
the (n − 1) row pitches it swallows, and whatever is left over is the headroom
above its rim.

Across a row, `hardware.binGap` falls *between* bins and never against a wall, so
the outermost bins sit flush against the cabinet's inner walls and the row still
fills the inner width exactly.

## Bin types

Three types, matching the hardware. The `perRow` and `compartments` fields are
counts, not measurements — widths and divider positions are packed from them, so
every compartment comes out exactly equal whatever the cabinet's width.

| type   | height   | per row | compartments                       |
| ------ | -------- | ------- | ---------------------------------- |
| small  | 1 unit   | 5       | 2, split depth-wise; optional      |
| medium | 1 unit   | 2       | 2, split left/right; optional      |
| large  | 2 units  | 1       | 3, split left/right; always fitted |

## How the drawing works

World axes: `x` along the cabinet face, `y` up, `z` into the wall. The depth term
in the y projection is negative, which puts the camera at `(-x, +y, -z)` — so the
three faces drawn (top, `z = min`, `x = min`) are the ones actually turned toward
us, and `-z` is the direction a bin travels when it slides out.

There is no z-buffer. Occlusion comes from paint order, which is derived rather
than authored: two points share a pixel when `(x − z)` and `((x + z)/2 + y)` both
match, and solving those shows the nearer point is always the one with the larger
`y`. So height decides occlusion outright, and `x` only breaks ties between
pieces at the same height (`lib/ordering.js`).

A shelf is what separates one row from the next, so a cabinet has one fewer
shelf than it has rows: the bottom row stands on the cabinet's own floor, which
is a face of the carcass rather than a board laid inside it. The cabinet is a
board shorter for it too — otherwise that row, alone in having nothing under it,
would open a shelf's thickness taller than all the others. Shelves run wall to
wall, so their two ends are buried in the cabinet — the top surface, the one the
bins stand on, is outlined in full, but the ends are not drawn.

Every edge is traced exactly once (`cuboidEdges`) rather than by stroking each
face whole, which would lay two lines along every crease — invisible while
outlines are opaque hairlines, obvious the moment they are not. Where two pieces
genuinely share an edge, the second one drops it (`withoutSegments`).

A stroke straddles its own path, so the frame's inner edge and the clip that
holds the interior inside the mouth land on the very same line, and a shelf
spanning the interior exactly then paints over half of that edge. The frame
draws it at twice the width and clips it to the frame band instead: the half
that would have been painted over is never drawn, and the half that survives is
the width asked for. It stays part of the carcass, laid down before anything
inside, so a bin sliding out still passes in front of it.

There is only ever one clip on the interior, and it stays outside the bins'
sliding transform. `userSpaceOnUse` resolves a clip in the user space of
whatever refers to it, so a clip referenced from inside a bin travels with the
bin — a second, tighter clip on the fills alone slid along with each bin as it
opened and cut every one of its fills away.

Degenerate settings collapse rather than double up. A divider with no thickness
is a plane, not a box with its front and back in the same place; a bin with no
wall is still an open bin with its dividers in it, its cavity simply coincident
with its shell and outlined once between them.

Each cabinet is painted as one continuous carcass — back panel, a single
picture-frame face with the mouth knocked out, top and side — so its outer edge
is one unbroken outline at every corner. Everything inside is then drawn clipped
to the convex hull of the mouth swept along the pull direction, which is why a
bin can slide out without ever painting outside the cabinet.

The inner right wall belongs to the carcass but is drawn with the interior, and
has to be: it stands the full depth of the cabinet, and depth reads as up and to
the left on screen, so unclipped it would reach past the mouth and paint over
the frame. The mouth clip is the right one for it — that clip only ever opens
toward the camera, which is the one direction this wall does not go.