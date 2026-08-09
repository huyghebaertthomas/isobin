/**
 * A TypeScript consumer, type-checked against the built declarations.
 *
 * This file is never run and never bundled — `npm run check:types` compiles it
 * with `noEmit` and nothing else. It exists because the declarations are
 * generated rather than written, so the only way to know they are usable is to
 * use them: an export that vanished, a `.jsx` specifier TypeScript cannot
 * follow, or a config shape that rejects a legal config all fail here.
 */
import { Isobin, buildScene, resolveConfig, styles, stylePreview } from "isobin";
import { defaultConfig, diff, restyle, styleBranches } from "isobin/core";
import { renderToSVG } from "isobin/svg";
import type { Config, IsobinProps, StyleName } from "isobin";

// a config is an override: any subset, nested as deep as you like
const config: Config = {
  style: "blueprint",
  view: { scale: 30, padding: { top: 10 } },
  layout: {
    gap: 0.2,
    organizers: [
      { id: "A", rows: ["small", { type: "large", repeat: 2, divided: false }] },
      { id: "B", rows: [{ type: "medium", count: 3 }], hardware: { depth: 1.4 } },
    ],
  },
  appearance: {
    borders: false,
    shading: { lit: "side", gradient: { strength: 0.3 } },
  },
};

const name: StyleName = "kraft";
const svg: string = renderToSVG(config, { open: ["A-0-0"], idPrefix: "x" });
const scene = buildScene(resolveConfig(config));
const count: number = scene.bins.length;
const box: string = scene.bounds.viewBox;

// the editing helpers, as a picker would use them
const branches: string[] = styleBranches(styles);
const next = restyle(config, defaultConfig, branches, styles[0].patch);
const patch = diff(defaultConfig, next);
const swatch = stylePreview(styles[0], defaultConfig);
const fill: string = swatch.fill;

// props are checked, including the ones that change how it behaves
const props: IsobinProps = {
  config,
  open: ["A-0-0"],
  onToggle: (bin) => bin.id.toUpperCase(),
  interactive: false,
  className: "w-full",
};

export { Isobin, config, name, svg, count, box, patch, fill, props };
