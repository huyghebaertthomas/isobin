import { deepMerge } from "../lib/merge.js";
import { hardware } from "./hardware.js";
import { binTypes } from "./binTypes.js";
import { layout } from "./layout.js";
import { view } from "./view.js";
import { motion } from "./motion.js";
import { appearance } from "./appearance.js";
import { styles } from "./styles.js";

/**
 * The whole twin, described as data.
 *
 * Every branch here is overridable, and nothing outside this object decides how
 * a scene looks or what is in it. That is what makes one config the whole of a
 * cabinet's description — and what lets a caller hold several at once.
 */
export const defaultConfig = {
  /** a ready-made look by name, from `styles`; null is the default paper look */
  style: null,
  hardware,
  binTypes,
  layout,
  view,
  motion,
  appearance,
};

/** the names `config.style` accepts */
export const styleNames = styles.map((style) => style.key);

/**
 * Fold overrides into the defaults. Nested objects merge; arrays and primitives
 * are replaced whole, so a partial `layout.organizers` never half-merges into
 * the two the defaults ship with — you get exactly the cabinets you listed.
 *
 *   resolveConfig({ view: { scale: 32 } })
 *   resolveConfig({ layout: { organizers: [{ id: "A", rows: ["large"] }] } })
 *   resolveConfig({ style: "blueprint" })
 *
 * A named style is folded in first and your own overrides go on top of it, so
 * picking a style and then correcting one colour of it does what it looks like.
 *
 * @param {import("../types.js").Config} [overrides]
 * @returns {import("../types.js").ResolvedConfig}
 */
export function resolveConfig(overrides) {
  return deepMerge(styled(overrides?.style), overrides);
}

/** the defaults wearing a named style, or the plain defaults for no name */
function styled(name) {
  if (!name) return defaultConfig;

  const style = styles.find((candidate) => candidate.key === name);
  if (!style) {
    throw new Error(`Unknown style ${JSON.stringify(name)}. Try one of: ${styleNames.join(", ")}.`);
  }
  return deepMerge(defaultConfig, style.patch);
}

export { hardware, binTypes, layout, view, motion, appearance, styles };
