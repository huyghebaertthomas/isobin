/**
 * isobin/core — everything that does not need React.
 *
 * The geometry, the config and the paint. Nothing here imports React, so this
 * is the entry to reach for from a build script, a server, a test, or a
 * renderer of your own: `buildScene` hands back plain coordinates, and drawing
 * them is somebody else's job.
 *
 *   import { buildScene, resolveConfig } from "isobin/core";
 *
 *   const scene = buildScene(resolveConfig({ style: "blueprint" }));
 *   scene.bins.length;        // how many bins the layout came to
 *   scene.bounds.viewBox;     // the box they all fit in
 */

/**
 * The shapes, for TypeScript consumers. Nothing at runtime — `types.js` is all
 * JSDoc — so this line costs a bundler nothing and hands `import type { Config }`
 * somewhere to resolve.
 */
export * from "./types.js";

export {
  defaultConfig,
  resolveConfig,
  styles,
  styleNames,
  hardware,
  binTypes,
  layout,
  view,
  motion,
  appearance,
} from "./config/index.js";

export { buildScene } from "./models/scene.js";

/**
 * Applying a style to settings somebody is already editing, which is a
 * different job from `resolveConfig({ style })` — see `lib/styles.js`.
 */
export { restyle, activeStyle, styleBranches, stylePreview } from "./lib/styles.js";

export { createProjection } from "./lib/projection.js";
export { resolveMaterials, materialFor, blankMaterial, FACES } from "./render/materials.js";

/**
 * Config plumbing, exported because a config-driven library owes it to anyone
 * building an editor on top: `diff` against the defaults is the smallest
 * override that reproduces what you have, which is the thing worth saving.
 */
export { deepMerge, diff } from "./lib/merge.js";
export { getAt, setAt } from "./lib/path.js";
export { darken } from "./lib/color.js";
