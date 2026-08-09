/**
 * What the control panel offers.
 *
 * Every field names a `path` into the config and nothing else, so the panel is
 * a renderer of this list rather than a hand-built form: adding a control is a
 * line here, and it writes straight back into the config the scene is built
 * from. Surfaces are the one exception — they are generated from
 * `appearance.surfaces`, so adding a surface adds its controls by itself.
 *
 *   path        where the control reads and writes
 *   type        "number" (the default), "color", "toggle" or "select"
 *   hint        tooltip, for the knobs whose name is not enough
 *   enabledWhen path to a flag that has to be on for the control to do anything
 */

/** slider bounds shared by every surface */
const OPACITY = { min: 0, max: 1, step: 0.01 };
const BORDER_WIDTH = { min: 0, max: 4, step: 0.1 };

/** which of the three face directions takes the light; the rest fall away from it */
const LIT = [
  { value: "top", label: "Tops" },
  { value: "side", label: "Sides" },
  { value: "front", label: "Fronts" },
];

/** what opening one bin does to the others */
const MODES = [
  { value: "multi", label: "Multi — leave the others" },
  { value: "single", label: "Single — shut the others" },
];

const EASINGS = [
  { value: "cubic-bezier(.22,1,.32,1)", label: "Glide" },
  { value: "cubic-bezier(.4,0,.2,1)", label: "Standard" },
  { value: "cubic-bezier(.34,1.56,.64,1)", label: "Overshoot" },
  { value: "ease-in-out", label: "Ease in out" },
  { value: "linear", label: "Linear" },
];

export const controls = [
  {
    key: "camera",
    label: "Camera",
    fields: [
      { path: "view.scale", label: "Scale", min: 6, max: 80, step: 1, hint: "screen units per world unit" },
      { path: "view.depthScale", label: "Depth", min: 0, max: 1.5, step: 0.01, hint: "vertical foreshortening; 0.5 is classic 2:1 isometric" },
      { path: "view.padding.top", label: "Pad top", min: 0, max: 200, step: 1 },
      { path: "view.padding.right", label: "Pad right", min: 0, max: 200, step: 1 },
      { path: "view.padding.bottom", label: "Pad bottom", min: 0, max: 200, step: 1 },
      { path: "view.padding.left", label: "Pad left", min: 0, max: 200, step: 1 },
    ],
  },

  {
    key: "cabinet",
    label: "Cabinet",
    fields: [
      { path: "layout.innerWidth", label: "Inner width", min: 1, max: 12, step: 0.1, hint: "usable width inside a cabinet, in small-bin slots" },
      { path: "hardware.rowHeight", label: "Row height", min: 0.1, max: 2, step: 0.01 },
      { path: "hardware.depth", label: "Depth", min: 0.4, max: 5, step: 0.05 },
      { path: "hardware.frame", label: "Frame", min: 0, max: 0.8, step: 0.01, hint: "thickness of the carcass around the mouth" },
      { path: "hardware.shelfThickness", label: "Shelf", min: 0, max: 0.4, step: 0.01 },
      { path: "hardware.shelfDepthInset", label: "Shelf inset", min: 0, max: 1.5, step: 0.01, hint: "how much shallower a shelf is than the interior" },
      { path: "layout.gap", label: "Cabinet gap", min: 0, max: 2, step: 0.01 },
      { path: "layout.origin", label: "Origin", min: -5, max: 5, step: 0.1 },
      { path: "layout.table.enabled", label: "Table", type: "toggle", hint: "the surface the cabinets stand on" },
      { path: "layout.table.thickness", label: "Table top", min: 0.02, max: 1, step: 0.01, enabledWhen: "layout.table.enabled" },
      { path: "layout.table.overhang", label: "Table edge", min: 0, max: 2, step: 0.01, hint: "how far the table reaches past the cabinets on every side", enabledWhen: "layout.table.enabled" },
    ],
  },

  {
    key: "bins",
    label: "Bins",
    fields: [
      { path: "hardware.binGap", label: "Gap", min: 0, max: 0.5, step: 0.01, hint: "falls between bins; the outermost sit flush against the walls" },
      { path: "hardware.binHeight", label: "Height", min: 0.05, max: 2, step: 0.01, hint: "set outright, so the row pitch can change without the bins following" },
      { path: "hardware.binWall", label: "Wall", min: 0, max: 0.3, step: 0.005, hint: "at zero the bin is still open, just paper-thin" },
      { path: "hardware.binDepthInset", label: "Depth inset", min: 0, max: 1.5, step: 0.01 },
      { path: "hardware.binFrontInset", label: "Front inset", min: 0, max: 0.6, step: 0.01, hint: "how far back from the mouth a shut bin sits" },
      { path: "hardware.binPullFraction", label: "Pull", min: 0, max: 1, step: 0.01, hint: "fraction of its own depth a bin travels, capped per type" },
      { path: "hardware.dividerThickness", label: "Divider", min: 0, max: 0.2, step: 0.005 },
      { path: "hardware.dividerHeightFraction", label: "Divider height", min: 0, max: 1, step: 0.01 },
    ],
  },

  {
    key: "motion",
    label: "Motion",
    fields: [
      { path: "motion.slide.duration", label: "Slide", min: 0, max: 2000, step: 10, unit: "ms" },
      { path: "motion.slide.easing", label: "Easing", type: "select", options: EASINGS },
    ],
  },

  {
    /*
     * Not config: `demo.*` is the playground's own, and the library never sees
     * it. `mode` is a prop on <Isobin>; the idle drift is a hook in this app
     * calling open() and close() on a ref, because a twin of a real shelf
     * should move when something happens rather than on a timer.
     */
    key: "behaviour",
    label: "Behaviour",
    fields: [
      { path: "demo.mode", label: "Mode", type: "select", options: MODES, hint: "single shuts the others when a bin opens" },
      { path: "demo.idle.enabled", label: "Idle drift", type: "toggle", hint: "demo only — this app opening bins on a timer through the public handle" },
      { path: "demo.idle.interval", label: "Every", min: 200, max: 5000, step: 50, unit: "ms", enabledWhen: "demo.idle.enabled" },
      { path: "demo.idle.holdMin", label: "Hold min", min: 200, max: 12000, step: 100, unit: "ms", enabledWhen: "demo.idle.enabled" },
      { path: "demo.idle.holdMax", label: "Hold max", min: 200, max: 12000, step: 100, unit: "ms", enabledWhen: "demo.idle.enabled" },
    ],
  },

  {
    key: "materials",
    label: "Materials",
    open: true,
    /** render a block of controls per entry in `appearance.surfaces` too */
    surfaces: true,
    fields: [
      { path: "appearance.background", label: "Background", type: "color" },
      { path: "appearance.borders", label: "Borders", type: "toggle" },
      { path: "appearance.stroke.linejoin", label: "Corners", type: "select", enabledWhen: "appearance.borders", options: ["round", "miter", "bevel"] },
      { path: "appearance.stroke.nonScaling", label: "Hairlines", type: "toggle", enabledWhen: "appearance.borders", hint: "draw outlines at their set width on screen instead of scaling them with the camera" },
      { path: "appearance.shading.enabled", label: "Light", type: "toggle", hint: "shade the three face directions apart, for depth" },
      { path: "appearance.shading.lit", label: "Lit face", type: "select", enabledWhen: "appearance.shading.enabled", options: LIT },
      { path: "appearance.shading.strength", label: "Falloff", min: 0, max: 0.5, step: 0.01, enabledWhen: "appearance.shading.enabled", hint: "how much darker each turn away from the light is" },
      { path: "appearance.shading.gradient.enabled", label: "Gradient", type: "toggle", enabledWhen: "appearance.shading.enabled", hint: "ramp each face away from the light instead of filling it flat" },
      { path: "appearance.shading.gradient.strength", label: "Ramp", min: 0, max: 0.5, step: 0.01, enabledWhen: "appearance.shading.gradient.enabled", hint: "how much darker the shaded end of a face is than its lit end" },
      { path: "appearance.glass.blur", label: "Bin frost", min: 0, max: 12, step: 0.1, hint: "smears the cabinet seen through a bin's walls" },
      { path: "appearance.glass.opacity", label: "Frost strength", ...OPACITY, hint: "how strongly the frost shows on the walls" },
    ],
  },
];

/**
 * The five controls behind one surface. Generated rather than listed, so the
 * panel follows `appearance.surfaces` wherever it goes.
 */
export function surfaceFields(index) {
  const at = (leaf) => `appearance.surfaces.${index}.${leaf}`;

  return [
    { path: at("fill"), label: "Fill", type: "color" },
    { path: at("fillOpacity"), label: "Fill opacity", ...OPACITY },
    { path: at("stroke"), label: "Border", type: "color", enabledWhen: "appearance.borders" },
    { path: at("strokeOpacity"), label: "Border alpha", ...OPACITY, enabledWhen: "appearance.borders" },
    { path: at("width"), label: "Border width", ...BORDER_WIDTH, enabledWhen: "appearance.borders" },
  ];
}
