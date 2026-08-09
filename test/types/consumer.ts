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
import { openBins, setBins, toggleBin } from "isobin/core";
import type {
  BinInfo,
  ChangeDetail,
  Config,
  IsobinHandle,
  IsobinProps,
  SelectionMode,
  StyleName,
} from "isobin";

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
const mode: SelectionMode = "single";
const props: IsobinProps = {
  config,
  mode,
  open: ["A-0-0"],
  onToggle: (bin) => bin.id.toUpperCase(),
  onChange: (ids: string[], detail: ChangeDetail) => `${ids.length} ${detail.action}`,
  interactive: false,
  className: "w-full",
};

/**
 * The handle, as an application would hold it. Typed against the declarations
 * rather than mounted, so this checks the shape a `useRef<IsobinHandle>` gets
 * — that the writes hand back the open set and the reads answer what they say.
 */
declare const wall: IsobinHandle;

const nowOpen: string[] = wall.open("A-0-0");
const afterMany: string[] = wall.open(["A-0-0", "A-0-1"]);
const afterClose: string[] = wall.close("A-0-0");
const afterToggle: string[] = wall.toggle("A-0-0");
const exactly: string[] = wall.set(["A-1-0"]);
const shut: string[] = wall.closeAll();
const isOut: boolean = wall.isOpen("A-0-0");
const outNow: string[] = wall.getOpen();
const found: BinInfo | null = wall.bin("A-0-0");
const everyBin: BinInfo[] = wall.bins();
const anchor = found ? found.screen.width * found.screen.height : 0;

// the same rules, for anyone holding the set themselves
const held: string[] = setBins(toggleBin(openBins([], "A-0-0", mode), "A-0-1", mode), [], mode);

export {
  Isobin,
  config,
  name,
  svg,
  count,
  box,
  patch,
  fill,
  props,
  nowOpen,
  afterMany,
  afterClose,
  afterToggle,
  exactly,
  shut,
  isOut,
  outNow,
  found,
  everyBin,
  anchor,
  held,
};
