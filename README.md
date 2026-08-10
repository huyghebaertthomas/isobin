# isobin

2.5D isometric SVG digital twins of storage and inventory systems.

Describe your shelving as a config object and isobin draws it. Every bin has an
id, and your code opens it, closes it and asks whether it is open — so a search
result, a pick list or a sensor reading can point at the physical compartment it
means. No canvas, no WebGL: one `<svg>`, sized by whatever you put it in.

<!--
  Absolute, not relative. GitHub would resolve a relative path fine, but the
  GIF is not in the npm tarball — `files` ships dist, the readme and the
  licence, and nothing else — so on npmjs.com a relative path resolves to
  nothing. One absolute URL serves both.
-->
<img src="https://raw.githubusercontent.com/huyghebaertthomas/isobin/main/isobin.gif" alt="Eight styles and eight arrangements, cycling" width="576">

*Every frame above is one `<Isobin config={…} />` — only the config changes.*

```bash
npm install isobin
```

```jsx
import { useRef } from "react";
import { Isobin } from "isobin";

// bins carry your ids, not ours
const config = {
  layout: {
    organizers: [
      { id: "A", rows: [
        { type: "small", ids: ["R-100", "R-101", "R-102", "R-103", "R-104"] },
        { type: "medium", id: "IC" },
      ] },
      { id: "B", rows: [{ type: "small", repeat: 8 }] },
    ],
  },
};

export function Wall({ found, lowStock }) {
  const wall = useRef(null);

  // somebody searched for a part: pull out the bin it lives in
  useEffect(() => {
    if (found) wall.current.open(found);
  }, [found]);

  return (
    <Isobin
      ref={wall}
      config={config}
      mode="single"
      highlight={{ ...lowStock, [found]: "found" }}
      onBinEnter={(bin) => showTooltip(bin.label, bin.screen)}
    />
  );
}
```

React 18 or 19, as a peer dependency. Written in JavaScript; the published types
are generated from it, so TypeScript gets the full config shape checked.

> Keep `config` at module scope or memoise it. A fresh object literal on every
> render rebuilds every bin on every render.

## Three ways in

| import | what it is | needs |
| --- | --- | --- |
| `isobin` | `<Isobin>`, the config API, the styles | react |
| `isobin/core` | the geometry and the config, no components | nothing |
| `isobin/svg` | `renderToSVG(config)` → a string | react, react-dom |

`core` is for when you want the numbers rather than the picture — how many bins
a layout comes to, what box they fit in, where each one is:

```js
import { buildScene, resolveConfig } from "isobin/core";

const scene = buildScene(resolveConfig());
scene.bins.length; // 96
scene.bins[0].id; // "A-0-0" — cabinet, row, position
scene.bounds.viewBox; // the box they all fit in
```

`svg` is for when there is no browser — committing a diagram to a repo, putting
one in an email, serving one from a process with no front end:

```js
import { writeFileSync } from "node:fs";
import { renderToSVG } from "isobin/svg";

writeFileSync("wall.svg", renderToSVG({ style: "kraft" }));
```

What comes back is a still: drawn shut unless `open` says otherwise, and
carrying no click handlers.

## Cabinets and rows

Nothing is positioned by hand — no coordinate is authored anywhere. Rows stack
downward by their own height, each row divides the cabinet's inner width into
slots, cabinets are placed left to right from an origin and a gap, and the
viewBox is measured from the result. So a wall is entirely a matter of listing
what is in it:

```js
layout: {
  gap: 0.14,
  innerWidth: 5,        // in world units: one unit is one small bin slot
  organizers: [
    { id: "A", rows: [{ type: "small", repeat: 12 }] },
    { id: "B", rows: ["small", { type: "large", repeat: 2, divided: false }] },
  ],
}
```

| field | meaning |
| --- | --- |
| `type` | key into `binTypes` — `small`, `medium` or `large` as shipped |
| `count` | bins across the row; defaults to the type's `perRow`. The row is always filled exactly, so this widens or narrows the bins |
| `bins` | what is in the row, one entry at a time — see below |
| `repeat` | emit this many identical rows (default 1) |
| `height` | row units tall; defaults to the tallest bin type in the row |
| `divider` | the default divider for every bin in the row |
| `id` / `ids` | what the bins are called — see below |

A cabinet may also carry `innerWidth`, or a `hardware` block, to deviate from
the rest of the wall.

### Rows that are not all one size

`type` and `count` are a shorthand for the common row. The general form lists
what is in the row, and each entry says how many slots it takes. **The row is
however many slots its contents add up to**, so widths are proportions rather
than measurements — a 3 and a 4 make sevenths, and nothing says seven:

```js
{ bins: [{ span: 3, id: "L" }, { span: 4, id: "R" }] }
```

Change the 4 to a 5 and the row re-proportions itself. It cannot overflow, and
it cannot leave a strip of the cabinet unaccounted for.

An entry can also be a hole, for the part of a shelf that holds something which
is not a bin at all:

```js
{ bins: [{ id: "A" }, { gap: 2 }, { id: "B" }] }
```

A gap takes up its share of the row and leaves nothing behind — the shelf runs
on underneath it, the bins either side are unaffected, and it is not a bin: it
gets no id, takes no index, and the arrow keys pass over it.

A bin entry is all optional. `{}` is a bin one slot wide named by its position;
everything else is a refinement:

| field | meaning |
| --- | --- |
| `span` | slots it takes across the row (default 1) |
| `type` | key into `binTypes`; defaults to the row's, and a bin needs no type at all |
| `id` | what this bin is called — beats every other naming rule |
| `divider` | how it is divided, or `false` for not at all |
| `label` | the readable description, for screen readers and `bin()` reports |
| `data` | anything of your own; handed back on `bin(id).data` |

A row is as tall as the tallest bin type in it, so types of different heights
can share one, and `height` overrides that if you would rather say.

If you prefer it read as a shape rather than as a list, `bin()`, `gap()` and
`row()` are exported from `isobin/core` and return exactly the objects above —
a layout built with them is still plain data, so it still serialises:

```js
import { bin, gap, row } from "isobin/core";

rows: [
  row(bin(3, "L"), gap(), bin(3, "R")),
  row({ height: 2 }, bin(4, "IC-555"), bin(3, "IC-OPAMP")),
]
```

### Dividers

A divider belongs to the bin, not to its type — the type is only where the
default comes from. Any row or bin may say otherwise, including saying no:

```js
{ type: "small", divider: false }                        // a whole row, bare
{ type: "large", divider: 4 }                            // four compartments
{ bins: [{ divider: { split: "width", into: 3 } }] }     // this bin only
```

Which way it runs is said in terms of what it splits, because "the x divider"
tells you nothing while you are looking at a bin:

| spec | means |
| --- | --- |
| `{ split: "width", into: 3 }` | three compartments, left to right |
| `{ split: "depth", into: 2 }` | two compartments, front to back |
| `3` | three compartments, split whichever way the type splits |
| `"width"` | two compartments, left and right |
| `false` | no divider, whatever the type says |

Most specific wins: the bin's over the row's over the type's, and `false`
anywhere is an answer rather than an absence. There is no such thing as a
divider you cannot take out.

### Naming bins

Bins are named positionally by default — `A-2-3` is cabinet A, row 3, bin 4 —
which is fine for a drawing and wrong for a record. **Insert a shelf at the top
of a cabinet and every id below it shifts by one**, so anything you stored
against `A-2-3` now points at the bin above it.

So say what they are called, and then they are called that however the drawing
is rearranged around them:

```js
rows: [
  { type: "small", ids: ["R-100", "R-101", "R-102", "R-103", "R-104"] },
  { type: "large", id: "BULK" },        // a row of one takes the name as it is
  { type: "medium", id: "IC" },         // a row of several: IC-0, IC-1, …
  { bins: [{ id: "L" }, { gap: 1 }, { id: "R" }] },   // or one bin at a time
]
```

Or name the whole wall at once, if your ids follow a rule:

```js
layout: {
  idFor: ({ organizerId, row, index }) => `${organizerId}/${row + 1}/${index + 1}`,
  organizers: [ … ],
}
```

Most specific wins: a bin's own `id` beats `ids` beats `id` on the row beats
`idFor` beats the positional default. `idFor` is a function, so it will not survive `JSON.stringify` — for a
config you mean to serialise, name bins on the rows.

Ids are addresses, so **they must be unique**: two bins with one name throws at
build time rather than leaving one of them unreachable. Naming a row and
`repeat`ing it throws too — every repeat would want the same name.

## The rest of the config

Every branch is optional and deep-merged over the defaults, so you name only
what differs. Objects merge; **arrays replace**, so `organizers` and
`appearance.surfaces` are all-or-nothing.

| branch | holds |
| --- | --- |
| `style` | a ready-made look by name, folded in *under* your own overrides |
| `layout` | the cabinets, their rows, the spacing, and the table they stand on |
| `hardware` | physical dimensions in world units — row pitch, bin height, depth, frame, wall and divider thickness, how far a bin pulls out |
| `binTypes` | named bundles of bin defaults — height, how many fill a row, how far they pull, how they are divided. Presets, not a fixed menu: add your own, or describe each bin directly and use none |
| `view` | camera scale, isometric foreshortening, padding around the scene |
| `motion` | how long a bin takes to slide, and on what easing |
| `appearance` | surfaces (fill, outline, opacity), the backdrop, the light and its ramp, the bin frost, the named highlights, and how labels are set |

`resolveConfig(overrides)` gives you the resolved article if you want to inspect
it, and `diff(defaultConfig, yours)` gives back the smallest override that
reproduces it — which is what the playground's **Copy config** button does.

## Styles

Thirteen ready-made looks. A style is nothing but a config override, so picking
one and then correcting a colour of it does exactly what it looks like:

```jsx
<Isobin config={{ style: "noir", appearance: { background: "#000" } }} />
```

| | | |
| --- | --- | --- |
| `paper` the default: white card, hairline ink | `ink` woodcut, heavy mitred line on laid paper | `riso` one bright ink on newsprint, printed flat |
| `candy` coral bins in a cream carcass | `clay` no outlines at all — the light does it | `terminal` phosphor wireframe on a dead screen |
| `blueprint` drawing-office cyanotype | `noir` white hairline on charcoal | `basalt` Clay after dark: no outlines, all modelling |
| `kraft` corrugated board under a warm lamp | `copper` raking light across metal | `glass` frosted fronts over a lit carcass |
| `xray` every surface see-through | | |

`styles` exports the list, `styleNames` just the keys. For building a picker,
`stylePreview(style, defaultConfig)` boils a look down to the three colours a
swatch can show, and `restyle`/`activeStyle` apply one to settings a user is
already editing — see the [playground](demo/) for both in use.

## Opening and closing bins

Bins are addressed by id, and a ref is how you reach them. Nothing moves on its
own: a bin opens when it is clicked, or when you say so.

```jsx
const wall = useRef(null);

<Isobin ref={wall} config={config} />;

wall.current.open("A-2-3");           // one, or ["A-2-3", "B-0-1"]
wall.current.close("A-2-3");
wall.current.toggle("A-2-3");
wall.current.set(["A-0-0", "A-0-1"]); // exactly these, and nothing else
wall.current.closeAll();
```

Those five hand back the resulting open set. Reading is immediate — the answer
comes from the current state, not the last render, so `open` then `isOpen` is
true straight away rather than a moment later:

```js
wall.current.isOpen("A-2-3");  // boolean
wall.current.getOpen();        // ["A-2-3"], in the order they opened
wall.current.bin("A-2-3");     // where it is, and its box on screen — or null
wall.current.bins();           // every bin in the drawing
```

`bin(id)` gives you `{ id, organizerId, organizerName, type, row, index, label,
open, screen }`. `screen` is the box the bin occupies in the drawing's own
viewBox units, covering it both shut and fully pulled out — so a tooltip or a
quantity badge anchored there does not have to move when the bin does.

An id that names no bin is ignored, with one warning. A silent no-op on a
mistyped id is a long afternoon.

### Single or multi

`mode` decides what opening one bin does to the others.

```jsx
<Isobin ref={wall} config={config} mode="single" />
```

| | |
| --- | --- |
| `multi` *(default)* | opening a bin leaves the others where they are |
| `single` | opening a bin shuts the rest, so at most one is ever out |

It applies to clicks and to calls on the handle alike, so a drawing in `single`
mode mirrors a selection elsewhere in your app without you policing it.

### Who holds the state

Left alone, `<Isobin>` holds the open set itself, seeded by `defaultOpen`. That
is usually what you want, and the handle works either way.

Pass `open` and you own it. The handle and the clicks then *report* what they
would have changed, through `onChange`, and change nothing themselves:

```jsx
const [open, setOpen] = useState([]);

<Isobin config={config} open={open} mode="single" onChange={setOpen} />
```

`onChange(open, detail)` fires for clicks and for calls alike; `detail.action`
is `"open"`, `"close"`, `"toggle"`, `"set"` or `"closeAll"`. Controlled or not,
`mode` is already applied to the set you are handed. If you would rather apply
the rules yourself, `isobin/core` exports them: `openBins`, `closeBins`,
`toggleBin`, `setBins`, `closeAllBins`, each a pure function of the old set.

## Saying something about a bin

Two props, both keyed by bin id, so both come straight out of your own data.

```jsx
<Isobin
  config={config}
  highlight={{ "R-102": "found", "C-201": "low", "IC-300": "#8b5cf6" }}
  labels={{ "R-100": "10k", "R-102": "47k", "IC-300": "LM358" }}
/>
```

**`highlight`** picks bins out. The value names one of `appearance.highlights`,
or gives a colour, or a whole surface of its own. Four are shipped — `found`,
`low`, `empty` and `alert` — and they are only config, so you can replace them
or add your own:

```js
appearance: {
  highlights: {
    expiring: { fill: "#fb923c", stroke: "#7c2d12", pulse: true },
  },
}
```

A highlight is folded *over* the `bin` surface, so naming a fill is enough and
the style's outlines, opacity and light all survive — a highlighted bin still
reads as a solid rather than a flat sticker. `pulse` breathes its opacity, for
the one bin you want somebody to look at; it stands down under
`prefers-reduced-motion`. An array is shorthand for the `found` highlight:
`highlight={["R-102"]}`.

**`labels`** letters the bin's face — a part number, a quantity, whatever you
have. The text is drawn *into* the plane of the face rather than flat over the
picture, so it leans with the drawing, and it shrinks if the label is long for
the bin. Set it in `appearance.label`: `size` is in world units, so lettering
scales with everything else.

Both work in `renderToSVG` too, which is how you serve a picture of the wall
with today's low-stock bins already flagged.

## Keyboard and screen readers

When `interactive`, every bin is a real focus target: tab into the wall, arrow
around it, Enter or Space to open.

| key | |
| --- | --- |
| <kbd>←</kbd> <kbd>→</kbd> | along the row, and off the end into the next cabinet |
| <kbd>↑</kbd> <kbd>↓</kbd> | the row above or below, keeping your place across its width |
| <kbd>Home</kbd> <kbd>End</kbd> | first or last bin in the row |
| <kbd>Enter</kbd> <kbd>Space</kbd> | open or shut it |

Rows do not have to be the same width for this to work — moving from a row of
five into a row of two lands where it looks like it should rather than at bin
one.

Each bin carries `role="button"`, its own `aria-label` and `aria-pressed`. The
`<svg>` itself is a `group` when interactive and an `img` when it is not:
`role="img"` tells a screen reader the whole thing is one picture and silences
everything inside it, which is right for a still and wrong for a wall of
buttons.

### Nothing moves on a timer

Bins do not drift open by themselves. If you want that — an idle attract loop
on a warehouse screen, a walkthrough, a replay of the morning's picks — it is a
timer of yours calling `open` and `close`, and it is a dozen lines: see
[`useIdleDrift`](demo/src/useIdleDrift.js) in the playground, which is exactly
that and nothing more.

`interactive={false}` draws scenery: no handlers, and no cursor promising a
click that does nothing. The handle still works.

## Props

| prop | |
| --- | --- |
| `config` | the whole description; see above |
| `ref` | the handle: `open`, `close`, `toggle`, `set`, `closeAll`, `isOpen`, `getOpen`, `bin`, `bins` |
| `mode` | `"multi"` (default) or `"single"` |
| `open` | the bins that are out. Passing this takes control |
| `defaultOpen` | which bins start out, when you are not controlling `open` |
| `highlight` | bins to pick out, by id |
| `labels` | what to letter each bin with, by id |
| `onChange` | `(open, detail) => void` — the set changed, or would have |
| `onToggle` | `(bin) => void`, called when a bin is clicked or worked from the keyboard |
| `onBinEnter`, `onBinLeave` | the pointer entered or left a bin — for tooltips. Reported even on a non-interactive drawing |
| `interactive` | `false` for a still: no clicks, no focus, no cursor |
| `idPrefix` | names this drawing's internal ids — see below |
| `label` | the `aria-label`; one is described from the scene by default |
| `className`, `style` | passed to the `<svg>`, which carries no size of its own |

## Server rendering

One caveat, and only one. Everything the drawing refers to by url — clip paths,
one gradient per shaded face — needs an id unique to the document. In a browser
`useId` handles that for any number of drawings. Across *separate*
`renderToStaticMarkup` calls it cannot, because the counter behind it restarts
each time: the second drawing's `url(#…)` then resolves to the first one's
gradients, and it comes out wearing the wrong colours with nothing thrown.

So when server-rendering more than one drawing into a page, name them:

```jsx
<Isobin config={a} idPrefix="wall-a" />
<Isobin config={b} idPrefix="wall-b" />
```

`renderToSVG` takes a fresh prefix per call, so the string renderer needs no
thought. Client rendering needs none either.

## The playground

`demo/` is a config explorer: every knob live, the styles as swatches, and
**Copy config** to hand your changes back as the override object that reproduces
them. It is the package's first consumer — it imports `isobin` by name — but it
is not published.

```bash
npm run dev
```

## Notes

- ESM and CJS are both published; `sideEffects: false`, so unused entries drop out.
- `npm test` builds first and tests `dist/`, because the build is what people install.
- [ARCHITECTURE.md](ARCHITECTURE.md) covers how the drawing is actually put together — the projection, paint order, the light and its ramp, the frost.

MIT.
