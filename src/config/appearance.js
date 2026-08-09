/**
 * Materials. `surfaces` is the single source of truth: it drives both what the
 * renderer paints and what rows the control panel offers, in this order. Add a
 * surface here and it shows up in both — as long as some component asks for it
 * by key.
 *
 * Every surface carries the same five knobs, so the panel can generate its
 * controls without knowing what any of them are for.
 */
const surface = (key, label, extra) => ({
  key,
  label,
  fill: "#ffffff",
  fillOpacity: 1,
  stroke: "#000000",
  strokeOpacity: 1,
  width: 0.8,
  ...extra,
});

export const appearance = {
  /** master switch for outlines */
  borders: true,

  /** what the scene is drawn on; the page around it stays neutral */
  background: "#ffffff",

  surfaces: [
    surface("table", "Table"),
    surface("cabinet", "Cabinet", { width: 1 }),
    surface("shelf", "Shelves"),
    surface("bin", "Bins"),
    surface("binInterior", "Bin insides"),
    surface("divider", "Dividers"),
  ],

  /**
   * Frosted glass, bins only. `blur` is how far the cabinet behind a bin is
   * smeared, `opacity` how strongly that shows on the bin's walls. Zero blur
   * draws no filter at all — the bins are then plain surfaces.
   */
  glass: { blur: 0, opacity: 0.65 },

  /**
   * Cheap directional light. An isometric camera only ever shows three faces of
   * a box — one horizontal and two upright — so shading is a matter of giving
   * each direction its own fill: `lit` takes the surface's colour, the next
   * direction round is one `strength` darker and the last is two. Subtle is the
   * point; it should read as a solid, not as three different colours.
   *
   * `gradient` softens that further. Every face but the lit one runs from its
   * own fill where it meets the light to `strength` darker at the far end,
   * measured away from the light — so the flat step says which way a face
   * points and the ramp says how far along it you are looking.
   */
  shading: {
    enabled: true,
    lit: "top",
    strength: 0.07,
    gradient: { enabled: true, strength: 0.1 },
  },

  /** stroke styling shared by every surface */
  stroke: { linejoin: "round", nonScaling: true },
};
