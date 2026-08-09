/**
 * Ready-made looks.
 *
 * A style is nothing but a config override — the same object `Copy config`
 * hands back — so anything you can dial in by hand can be saved as one, and
 * picking one writes into the very same settings the panel edits. Nothing here
 * is a special case in the renderer.
 *
 * Between them the styles own the branches they name, so switching puts every
 * one of those back to config before folding the new style in. Two styles never
 * bleed into each other, and a style that leaves a branch out is choosing the
 * default for it — which is all `Paper` is.
 *
 * Light grounds first, then dark. One thing worth knowing when adding to them:
 * the light darkens a fill and never lifts it, so a fill already near black has
 * nowhere to go and comes out flat however hard the ramp is turned up. Dark
 * styles that want form give their surfaces a mid-tone and let the ground be
 * the black thing.
 */
import { appearance } from "./appearance.js";

/** the default surfaces, repainted: `common` over all of them, `byKey` on top */
const paint = (common, byKey = {}) =>
  appearance.surfaces.map((surface) => ({ ...surface, ...common, ...(byKey[surface.key] ?? {}) }));

export const styles = [
  {
    key: "paper",
    label: "Paper",
    hint: "the default: white card, hairline ink, light from above",
    patch: {},
  },

  {
    key: "ink",
    label: "Ink",
    hint: "woodcut: heavy mitred line on laid paper",
    patch: {
      appearance: {
        background: "#efe9dc",
        surfaces: paint(
          { fill: "#fbf8f1", stroke: "#1c1917", width: 1.7 },
          {
            table: { fill: "#e7dfcd" },
            binInterior: { fill: "#eae3d4" },
            divider: { fill: "#f2ece0" },
          }
        ),
        stroke: { linejoin: "miter", nonScaling: true },
        shading: { enabled: true, lit: "side", strength: 0.05, gradient: { enabled: true, strength: 0.07 } },
      },
    },
  },

  {
    key: "riso",
    label: "Riso",
    hint: "one bright ink on newsprint, printed flat",
    patch: {
      appearance: {
        background: "#f7f2e8",
        surfaces: paint(
          { fill: "#fadcd2", stroke: "#e4572e", width: 1.3 },
          {
            table: { fill: "#efbdaa" },
            bin: { fill: "#fdeee8" },
            binInterior: { fill: "#f3c6b7" },
            divider: { fill: "#f8d0c3" },
          }
        ),
        // a riso lays down one flat pass of ink; no light, no ramp
        shading: { enabled: true, lit: "top", strength: 0.04, gradient: { enabled: false } },
      },
    },
  },

  {
    key: "candy",
    label: "Candy",
    hint: "coral bins in a cream carcass, on a wooden bench",
    patch: {
      appearance: {
        background: "#fdf5ea",
        surfaces: paint(
          { fill: "#ffffff", stroke: "#2b2118", strokeOpacity: 0.8, width: 0.8 },
          {
            table: { fill: "#b0764a", stroke: "#54351d" },
            cabinet: { fill: "#fdf1de" },
            shelf: { fill: "#f7e0c0" },
            bin: { fill: "#f97362", stroke: "#7c2d20" },
            binInterior: { fill: "#fbbf9c", stroke: "#7c2d20" },
            divider: { fill: "#4fb8a4", stroke: "#1f6b5e" },
          }
        ),
        shading: { enabled: true, lit: "top", strength: 0.08, gradient: { enabled: true, strength: 0.15 } },
      },
    },
  },

  {
    key: "clay",
    label: "Clay",
    hint: "no outlines at all — the light does the whole job",
    patch: {
      appearance: {
        background: "#e9edf2",
        borders: false,
        surfaces: paint(
          { fill: "#d4dbe4" },
          {
            table: { fill: "#c0cad6" },
            bin: { fill: "#eef2f7" },
            binInterior: { fill: "#b4c0ce" },
            divider: { fill: "#cbd4df" },
          }
        ),
        shading: { enabled: true, lit: "top", strength: 0.11, gradient: { enabled: true, strength: 0.18 } },
      },
    },
  },

  {
    key: "terminal",
    label: "Terminal",
    hint: "phosphor wireframe on a dead screen",
    patch: {
      appearance: {
        background: "#141414",
        surfaces: paint(
          { fill: "#1c1c1c", stroke: "#4ade80", strokeOpacity: 0.9, width: 0.8 },
          {
            table: { fill: "#181818" },
            binInterior: { fill: "#171717" },
            divider: { fill: "#1c1c1c" },
          }
        ),
        // nothing to darken at this end of the scale: the lines carry the form
        shading: { enabled: true, lit: "top", strength: 0.1, gradient: { enabled: false } },
      },
    },
  },

  {
    key: "blueprint",
    label: "Blueprint",
    hint: "drawing-office cyanotype",
    patch: {
      appearance: {
        background: "#0b2545",
        surfaces: paint(
          { fill: "#14395f", stroke: "#9fd3e8", strokeOpacity: 0.85, width: 0.7 },
          {
            table: { fill: "#0f2c4c" },
            bin: { fill: "#1a4571" },
            binInterior: { fill: "#0e3054" },
            divider: { fill: "#1a4571" },
          }
        ),
        shading: { enabled: true, lit: "top", strength: 0.14, gradient: { enabled: true, strength: 0.2 } },
      },
    },
  },

  {
    key: "noir",
    label: "Noir",
    hint: "white hairline on charcoal, lit hard from above",
    patch: {
      appearance: {
        background: "#050505",
        surfaces: paint(
          { fill: "#3a3a3a", stroke: "#f5f5f5", strokeOpacity: 0.85, width: 0.7 },
          {
            table: { fill: "#242424" },
            bin: { fill: "#454545" },
            binInterior: { fill: "#232323" },
            divider: { fill: "#333333" },
          }
        ),
        shading: { enabled: true, lit: "top", strength: 0.16, gradient: { enabled: true, strength: 0.28 } },
      },
    },
  },

  {
    key: "basalt",
    label: "Basalt",
    hint: "Clay after dark: no outlines, all modelling",
    patch: {
      appearance: {
        background: "#15181c",
        borders: false,
        surfaces: paint(
          { fill: "#3d444d" },
          {
            table: { fill: "#2a2f36" },
            bin: { fill: "#4d555f" },
            binInterior: { fill: "#282d34" },
            divider: { fill: "#39404a" },
          }
        ),
        shading: { enabled: true, lit: "top", strength: 0.14, gradient: { enabled: true, strength: 0.24 } },
      },
    },
  },

  {
    key: "kraft",
    label: "Kraft",
    hint: "corrugated board under a warm lamp",
    patch: {
      appearance: {
        background: "#332b22",
        surfaces: paint(
          { fill: "#c9a273", stroke: "#4a3520", strokeOpacity: 0.5, width: 0.7 },
          {
            table: { fill: "#8c6f4d" },
            bin: { fill: "#dcb684" },
            binInterior: { fill: "#a87f52" },
            divider: { fill: "#c49a68" },
          }
        ),
        shading: { enabled: true, lit: "top", strength: 0.1, gradient: { enabled: true, strength: 0.24 } },
      },
    },
  },

  {
    key: "copper",
    label: "Copper",
    hint: "raking light across metal — the only one lit from the side this hard",
    patch: {
      appearance: {
        background: "#191410",
        surfaces: paint(
          { fill: "#b87333", stroke: "#3a2413", strokeOpacity: 0.45, width: 0.6 },
          {
            table: { fill: "#5c4326" },
            bin: { fill: "#d18f4e" },
            binInterior: { fill: "#7d4a1f" },
            divider: { fill: "#a9662c" },
          }
        ),
        shading: { enabled: true, lit: "side", strength: 0.13, gradient: { enabled: true, strength: 0.34 } },
      },
    },
  },

  {
    key: "glass",
    label: "Glass",
    hint: "frosted fronts over a lit carcass — the heaviest of these to draw",
    patch: {
      appearance: {
        background: "#0f172a",
        surfaces: paint(
          { fill: "#1e293b", stroke: "#94a3b8", strokeOpacity: 0.45, width: 0.6 },
          {
            table: { fill: "#111c33" },
            bin: { fill: "#dbeafe", fillOpacity: 0.18, stroke: "#e2e8f0", strokeOpacity: 0.75 },
            binInterior: { fill: "#3b4d68" },
            divider: { fill: "#4c6183" },
          }
        ),
        glass: { blur: 2.5, opacity: 0.7 },
        shading: { enabled: true, lit: "front", strength: 0.1, gradient: { enabled: true, strength: 0.22 } },
      },
    },
  },

  {
    key: "xray",
    label: "X-ray",
    hint: "every surface see-through, so depth comes from what stacks up",
    patch: {
      appearance: {
        background: "#04121c",
        surfaces: paint(
          { fill: "#7dd3fc", fillOpacity: 0.12, stroke: "#7dd3fc", strokeOpacity: 0.5, width: 0.6 },
          {
            table: { fillOpacity: 0.08 },
            bin: { fillOpacity: 0.16, strokeOpacity: 0.7 },
            binInterior: { fillOpacity: 0.1 },
            divider: { fillOpacity: 0.18 },
          }
        ),
        shading: { enabled: true, lit: "top", strength: 0.2, gradient: { enabled: true, strength: 0.3 } },
      },
    },
  },
];
