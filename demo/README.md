# The isobin playground

A config explorer for [isobin](../README.md): every knob live, the thirteen
styles as swatches, and **Copy config** to hand your changes back as the
override object that reproduces them. Dial in a wall here, paste the result
into your code, done.

```bash
npm run dev            # http://localhost:5173
npm run demo:build     # demo/dist, ready for GitHub Pages
```

It is not published. It is, though, the package's first consumer: it imports
`isobin` by name rather than by relative path, so an export missing from
`src/index.js` breaks the demo — which is the point. A Vite alias sends those
imports at the source rather than at `dist/`, so there is no build step in the
loop and only one React on the page.

`base` is relative in the Vite config, so the built demo works from a project
page's subpath without knowing the repository's name.

## The panel

The panel is a renderer of `src/config/controls.js`, not a hand-built form. A
field is a path into the config and the shape of the value; the panel reads and
writes that path and knows nothing else, so exposing a new knob is one line:

```js
{ path: "hardware.binWall", label: "Wall", min: 0.01, max: 0.3, step: 0.005 }
```

| field | meaning |
| --- | --- |
| `path` | where the control reads and writes, `"view.padding.top"` style; array indices work too |
| `type` | `number` (the default), `color`, `toggle` or `select` |
| `hint` | tooltip, for knobs whose name is not enough |
| `enabledWhen` | path to a flag that has to be on for the control to do anything |

Surfaces are the exception: their controls are generated from
`appearance.surfaces`, so adding a surface adds its five controls by itself.
`test/demo.test.js` checks that every path a control names still lands
somewhere in the config — a path that stops resolving is a control that
silently does nothing.

Edits go into one live config object, the same one `<Isobin>` takes. Writes
clone only the branch they touch, which is what keeps a colour change from
rebuilding the geometry: the scene is memoised on `layout`, `hardware`,
`binTypes` and `view`, and those four are still the same objects afterwards.
Three branches ride along in that object which the package knows nothing about
— `controls` describes the widgets, `ui` holds the copy, `styles` is the swatch
list — and are ignored when it is handed over.

## Styles, from the panel's side

Picking a style puts the branches the styles own between them back to defaults
*before* folding the patch in, so two styles never bleed into each other and a
style that leaves a branch out is choosing the default for it rather than
keeping whatever was there. That is all `Paper` is: an empty patch. The logic is
`restyle` and `activeStyle` in `isobin/core`; the panel only decides what a
swatch looks like.

A style is a starting point, not a mode. Carry on turning knobs afterwards and
the panel neither knows nor minds — the lit swatch simply goes out, because from
then on what you are looking at is yours. It comes back if you put the value
back. Edits to anything the styles do not own — the camera, the layout, the
timings — never disturb it.
