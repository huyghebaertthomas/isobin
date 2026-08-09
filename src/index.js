/**
 * isobin — isometric drawings of bin-wall storage, from a config object.
 *
 *   import { Isobin } from "isobin";
 *
 *   const config = { style: "blueprint", layout: { organizers: [
 *     { id: "A", rows: [{ type: "small", repeat: 8 }] },
 *   ] } };
 *
 *   <Isobin config={config} />
 *
 * Two neighbours, for when the React component is not what you want:
 *
 *   isobin/core   the geometry and the config, with no React at all
 *   isobin/svg    the same drawing as a string, for files and servers
 */

// Named exports only. A default alongside them means `require("isobin")` hands
// back something whose shape depends on your bundler's interop, and there is
// nothing to gain from the second spelling.
export { Isobin } from "./Isobin.jsx";

/**
 * The drawing surface on its own: hand it a scene you built and materials you
 * resolved, and it draws them. `<Isobin>` is this plus the config and the state
 * — reach past it when you want to own both.
 */
export { SceneView } from "./scene/SceneView.jsx";

export * from "./core.js";
