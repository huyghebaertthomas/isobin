# Bin wall

A digital twin of a wall of component storage organizers, drawn as an isometric
wireframe. Bins slide out when clicked, and drift open on their own when idle.
Every dimension, colour and timing is editable live from the control panel —
start from one of the ready-made styles or build your own — and `Copy config`
hands your changes back as an override object.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm test         # geometry checks
```

## Where things live

```
src/
  config/      what the twin IS — every dimension, layout and timing
  lib/         pure maths: projection, cuboids, hulls, paint order, bounds
  models/      config + maths → a scene of cabinets, shelves and bins
  render/      materials and the projection context
  hooks/       open/closed state, idle animation, the live settings
  components/  SVG and controls; they draw the scene, they don't compute it
```

The dependency arrow only ever points left: `lib` knows nothing about config,
`models` know nothing about React, and components never do geometry. Everything
a component draws was already worked out in `models/`.

## Changing the wall

Nothing is positioned by hand — no coordinate is authored anywhere. Rows stack
downward by their own height, each row divides the cabinet's inner width into
equal slots, cabinets are placed left to right from an origin and a gap, and the
SVG viewBox is measured from the result. So the layout is entirely a matter of
editing `src/config/layout.js`:

```js
organizers: [
  { id: "A", name: "Organizer 1", rows: [{ type: "small", repeat: 12 }] },
  { id: "B", name: "Organizer 2", rows: [
      { type: "small", repeat: 6 },
      { type: "medium", repeat: 2 },
      { type: "large", repeat: 2 },
  ]},
]
```

A row is `{ type, repeat?, count?, divided? }`, or just the type name as a
string:

| field     | meaning                                                              |
| --------- | -------------------------------------------------------------------- |
| `type`    | key into `config/binTypes.js`                                        |
| `repeat`  | emit this many identical rows (default 1)                            |
| `count`   | bins across the row; defaults to the type's `perRow`. The row is always filled exactly, so this widens or narrows the bins rather than leaving a gap |
| `divided` | fit the compartment divider? Only honoured where the type marks its divider `optional` |

A cabinet may also carry `innerWidth` or a `hardware` block to deviate from the
system defaults.

## The rest of the config

| file            | holds                                                            |
| --------------- | ---------------------------------------------------------------- |
| `hardware.js`   | physical dimensions in world units — row pitch, bin height, depth, frame, wall and divider thickness, how far a bin pulls out |
| `binTypes.js`   | the three bin types and their compartments                        |
| `layout.js`     | the cabinets, their rows, how they are spaced, and the table they stand on |
| `view.js`       | camera scale, isometric foreshortening, padding around the scene  |
| `motion.js`     | slide timing and the idle animation                               |
| `appearance.js` | surfaces — fill, outline and opacity; the backdrop, the light and its ramp, and the bin frost |
| `styles.js`     | the ready-made looks the panel offers as swatches                  |
| `controls.js`   | which of all of the above the panel offers, and over what range    |
| `ui.js`         | every string the interface shows                                  |

To vary any of it without editing the defaults, pass an override object — it is
deep-merged, so you only name what differs:

```jsx
const config = { view: { scale: 30 }, motion: { ambient: { enabled: false } } };

<BinWall config={config} />
```

Keep that object at module scope or memoise it; a fresh object every render
rebuilds the scene every render.

## The control panel

The panel is a renderer of `config/controls.js`, not a hand-built form. A field
is a path into the config and the shape of the value; the panel reads and writes
that path and knows nothing else, so exposing a new knob is one line:

```js
{ path: "hardware.binWall", label: "Wall", min: 0.01, max: 0.3, step: 0.005 }
```

| field         | meaning                                                     |
| ------------- | ----------------------------------------------------------- |
| `path`        | where the control reads and writes, `"view.padding.top"` style; array indices work too |
| `type`        | `number` (the default), `color`, `toggle` or `select`        |
| `hint`        | tooltip, for knobs whose name is not enough                  |
| `enabledWhen` | path to a flag that has to be on for the control to do anything |

Surfaces are the exception: their controls are generated from
`appearance.surfaces`, so adding a surface adds its five controls by itself.

Edits go into one live config object with the same shape as `config/`. Writes
clone only the branch they touch, which is what keeps a colour change from
rebuilding the geometry — the scene is memoised on `layout`, `hardware`,
`binTypes` and `view`, and those four are still the same objects afterwards.
`Copy config` diffs the live settings against the defaults and puts the result
on the clipboard, ready to paste into a `<BinWall config={…} />`.

## Styles

The swatches at the top of the panel are `config/styles.js`, and a style there
is nothing but a config override — the very object `Copy config` hands back. So
anything you can dial in by hand can be saved as one, and picking one writes
into the same settings every other control writes into. Nothing in the renderer
knows styles exist.

```js
{ key: "terminal", label: "Terminal", hint: "phosphor wireframe on a dead screen",
  patch: { appearance: { background: "#141414", surfaces: paint({ … }) } } }
```

Between them the styles own the branches they name — `appearance`, as it stands.
Picking one puts all of those back to config *before* folding the patch in, so
two styles never bleed into each other, and a style that leaves a branch out is
choosing the default for it rather than keeping whatever was there. That is all
`Paper` is: an empty patch.

A style is a starting point, not a mode. Carry on turning knobs afterwards and
the panel neither knows nor minds; the lit swatch simply goes out, because from
then on what you are looking at is yours. It comes back if you put the value
back. Edits to anything the styles do not own — the camera, the layout, the
timings — never disturb it.

Since the list is config like everything else, `<BinWall config={{ styles: […] }} />`
replaces it with your own.

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
home anywhere, and `useId` keeps the reference unique without a name having to
be threaded down from the scene. That is one gradient per ramped face — a few
hundred over the default wall — which is what the toggle is for if it is ever
too many.

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