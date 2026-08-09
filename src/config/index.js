import { deepMerge } from "../lib/merge.js";
import { hardware } from "./hardware.js";
import { binTypes } from "./binTypes.js";
import { layout } from "./layout.js";
import { view } from "./view.js";
import { motion } from "./motion.js";
import { appearance } from "./appearance.js";
import { controls } from "./controls.js";
import { styles } from "./styles.js";
import { ui } from "./ui.js";

/** The whole twin, described as data. */
export const defaultConfig = {
  hardware,
  binTypes,
  layout,
  view,
  motion,
  appearance,
  ui,
  controls,
  styles,
};

/**
 * Fold overrides into the defaults. Nested objects merge; arrays and
 * primitives are replaced. Pass the result to `<BinWall config={…} />`.
 *
 *   resolveConfig({ view: { scale: 32 } })
 *   resolveConfig({ layout: { organizers: [{ id: "A", rows: ["large"] }] } })
 */
export function resolveConfig(overrides) {
  return deepMerge(defaultConfig, overrides);
}

export { hardware, binTypes, layout, view, motion, appearance, styles, ui, controls };
export { surfaceFields } from "./controls.js";
