# isobin

Isometric drawings of bin-wall storage, built from a config object. Bins slide
out when clicked and drift open on their own when idle. No canvas, no WebGL —
one `<svg>`, sized by whatever you put it in.

```bash
npm install isobin
```

```jsx
import { Isobin } from "isobin";

const config = {
  style: "blueprint",
  layout: {
    organizers: [
      { id: "A", rows: [{ type: "small", repeat: 12 }] },
      { id: "B", rows: [{ type: "medium", repeat: 4 }, { type: "large", repeat: 2 }] },
    ],
  },
};

export const Wall = () => <Isobin config={config} />;
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
equal slots, cabinets are placed left to right from an origin and a gap, and the
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

A row is `{ type, repeat?, count?, divided? }`, or just the type name as a
string:

| field | meaning |
| --- | --- |
| `type` | key into `binTypes` — `small`, `medium` or `large` as shipped |
| `repeat` | emit this many identical rows (default 1) |
| `count` | bins across the row; defaults to the type's `perRow`. The row is always filled exactly, so this widens or narrows the bins rather than leaving a gap |
| `divided` | fit the compartment divider? Only honoured where the type marks its divider `optional` |

A cabinet may also carry `innerWidth`, or a `hardware` block, to deviate from
the rest of the wall.

## The rest of the config

Every branch is optional and deep-merged over the defaults, so you name only
what differs. Objects merge; **arrays replace**, so `organizers` and
`appearance.surfaces` are all-or-nothing.

| branch | holds |
| --- | --- |
| `style` | a ready-made look by name, folded in *under* your own overrides |
| `layout` | the cabinets, their rows, the spacing, and the table they stand on |
| `hardware` | physical dimensions in world units — row pitch, bin height, depth, frame, wall and divider thickness, how far a bin pulls out |
| `binTypes` | the bin types and their compartments |
| `view` | camera scale, isometric foreshortening, padding around the scene |
| `motion` | slide timing and the idle animation |
| `appearance` | surfaces (fill, outline, opacity), the backdrop, the light and its ramp, the bin frost |

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

## Which bins are open

Left alone, `<Isobin>` holds its own set and the idle animation drifts bins open
and shut. Pass `open` and you take over: the component holds nothing, the idle
animation stands down rather than fighting you, and `onToggle` is how it asks.

```jsx
const [open, setOpen] = useState([]);

<Isobin
  config={config}
  open={open}
  onToggle={(bin) => setOpen((was) => was.includes(bin.id)
    ? was.filter((id) => id !== bin.id)
    : [...was, bin.id])}
/>
```

`interactive={false}` draws scenery instead: no handlers, and no cursor
promising a click that does nothing.

## Props

| prop | |
| --- | --- |
| `config` | the whole description; see above |
| `open` | the bins that are out. Passing this takes control |
| `defaultOpen` | which bins start out, when you are not controlling `open` |
| `onToggle` | `(bin) => void`, called when a bin is clicked |
| `interactive` | `false` for a still |
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
