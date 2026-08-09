/**
 * The shapes a caller passes in and gets back.
 *
 * This module exports nothing at runtime. It exists so the published types have
 * one place to come from, and so every `@param` elsewhere in the source can name
 * a shape instead of restating it.
 *
 * Everything on `Config` is optional: it is an override folded over the
 * defaults, and the resolved article is `ResolvedConfig`. The one asymmetry
 * worth knowing is that objects merge but arrays replace, so `layout.organizers`
 * and `appearance.surfaces` are all-or-nothing — you list the whole set.
 */

/**
 * A ready-made look. See `styles` for the list and what each one is going for.
 *
 * @typedef {"paper"|"ink"|"riso"|"candy"|"clay"|"terminal"|"blueprint"|"noir"
 *   |"basalt"|"kraft"|"copper"|"glass"|"xray"} StyleName
 */

/**
 * One row of a cabinet, or just the bin type's name for a single plain row.
 *
 * @typedef {object} RowSpec
 * @property {string} type key into `binTypes`
 * @property {number} [repeat] how many identical rows to emit (default 1)
 * @property {number} [count] bins across the row; defaults to the type's `perRow`.
 *   The row is always filled exactly, so this widens or narrows the bins.
 * @property {boolean} [divided] fit the compartment divider; only honoured when
 *   the bin type marks its divider optional
 * @property {string} [id]
 */

/**
 * One cabinet. Rows run top to bottom; cabinets are placed left to right from
 * `layout.origin`, so no x coordinate is ever authored.
 *
 * @typedef {object} OrganizerSpec
 * @property {string} id
 * @property {string} [name]
 * @property {Array<RowSpec|string>} rows
 * @property {number} [innerWidth] usable width inside this cabinet
 * @property {Partial<HardwareConfig>} [hardware] hardware overrides for this cabinet alone
 */

/**
 * @typedef {object} LayoutConfig
 * @property {number} [origin] world x where the leftmost cabinet starts
 * @property {number} [gap] horizontal gap between neighbouring cabinets
 * @property {number} [innerWidth] usable width inside a cabinet, in world units
 * @property {number} [baseline] world y the cabinets stand on
 * @property {{ enabled?: boolean, thickness?: number, overhang?: number }} [table]
 *   the surface the cabinets stand on, measured from them rather than authored
 * @property {OrganizerSpec[]} [organizers]
 */

/**
 * Physical dimensions, in world units. One unit is the width of one small bin
 * slot, so `layout.innerWidth: 5` means a cabinet is five small bins wide.
 *
 * @typedef {object} HardwareConfig
 * @property {number} [rowHeight] height of one row unit
 * @property {number} [depth] front-to-back depth of the carcass
 * @property {number} [frame] thickness of the carcass frame around the mouth
 * @property {number} [shelfThickness]
 * @property {number} [shelfDepthInset]
 * @property {number} [binGap] gap between neighbouring bins
 * @property {number} [binHeight] height of a bin filling one row unit
 * @property {number} [binWall] wall thickness of a bin
 * @property {number} [binDepthInset]
 * @property {number} [binFrontInset] how far back from the mouth a shut bin sits
 * @property {number} [binPullFraction] fraction of its depth a bin travels when opened
 * @property {number} [dividerThickness]
 * @property {number} [dividerHeightFraction]
 */

/**
 * @typedef {object} BinTypeSpec
 * @property {string} [label]
 * @property {number} rowUnits row units of height this bin occupies
 * @property {number} perRow how many fit across one row
 * @property {number} [maxPull] furthest it can slide out, whatever `binPullFraction` says
 * @property {{ axis: "x"|"z", compartments: number, optional?: boolean,
 *   fittedByDefault?: boolean }} [divider]
 */

/**
 * Camera and canvas. The viewBox is measured from the built scene, so changing
 * the layout or the scale reframes it on its own.
 *
 * @typedef {object} ViewConfig
 * @property {number} [scale] screen units per world unit
 * @property {number} [depthScale] foreshortening of the depth axis; 0.5 is 2:1 isometric
 * @property {{ top?: number, right?: number, bottom?: number, left?: number }} [padding]
 */

/**
 * @typedef {object} MotionConfig
 * @property {{ duration?: number, easing?: string }} [slide] the slide a bin performs
 * @property {object} [ambient] the idle animation that opens random bins on its own
 * @property {boolean} [ambient.enabled]
 * @property {boolean} [ambient.respectReducedMotion]
 * @property {number} [ambient.interval]
 * @property {number} [ambient.burstChance]
 * @property {number} [ambient.burstSize]
 * @property {{ min: number, max: number }} [ambient.hold]
 */

/**
 * One paintable surface. `key` is how a drawing component asks for it, so the
 * six the renderer looks up are `table`, `cabinet`, `shelf`, `bin`,
 * `binInterior` and `divider`.
 *
 * @typedef {object} SurfaceSpec
 * @property {string} key
 * @property {string} [label]
 * @property {string} fill
 * @property {number} [fillOpacity]
 * @property {string} [stroke]
 * @property {number} [strokeOpacity]
 * @property {number} [width] outline width
 */

/**
 * Cheap directional light. An isometric camera shows three faces of a box, so
 * shading is a matter of giving each direction its own fill: `lit` keeps the
 * surface colour, the next is one `strength` darker, the last two. `gradient`
 * then ramps every face but the lit one across itself, away from the light.
 *
 * @typedef {object} ShadingConfig
 * @property {boolean} [enabled]
 * @property {"top"|"side"|"front"} [lit] which face direction takes the light
 * @property {number} [strength] how much darker each step is, 0–1
 * @property {{ enabled?: boolean, strength?: number }} [gradient]
 */

/**
 * @typedef {object} AppearanceConfig
 * @property {boolean} [borders] master switch for outlines
 * @property {string} [background] what the scene is drawn on
 * @property {SurfaceSpec[]} [surfaces] the whole set; this one replaces rather than merges
 * @property {{ blur?: number, opacity?: number }} [glass] frosted bins; zero blur draws no filter
 * @property {ShadingConfig} [shading]
 * @property {{ linejoin?: "round"|"miter"|"bevel", nonScaling?: boolean }} [stroke]
 */

/**
 * Everything about a drawing, as one overridable object. Pass any part of it;
 * what you leave out comes from the defaults.
 *
 * @typedef {object} Config
 * @property {StyleName|null} [style] a ready-made look, folded in under your own overrides
 * @property {HardwareConfig} [hardware]
 * @property {Record<string, BinTypeSpec>} [binTypes]
 * @property {LayoutConfig} [layout]
 * @property {ViewConfig} [view]
 * @property {MotionConfig} [motion]
 * @property {AppearanceConfig} [appearance]
 */

/**
 * A `Config` with every branch present, as `resolveConfig` returns it.
 *
 * @typedef {Required<Config>} ResolvedConfig
 */

/**
 * A bin in a built scene. `id` is what `open` and `onToggle` deal in.
 *
 * @typedef {object} SceneBin
 * @property {string} id
 * @property {string} organizerId
 * @property {string} type the bin type's key
 * @property {number} pull how far it slides, in world units
 */

/**
 * The built drawing: plain coordinates, no React.
 *
 * @typedef {object} Scene
 * @property {SceneBin[]} bins every bin in every cabinet, in build order
 * @property {Map<string, SceneBin>} binsById
 * @property {object[]} organizers
 * @property {object[]} order the cabinets, farthest first — the order to paint them
 * @property {{ viewBox: string, width: number, height: number }} bounds
 * @property {object} projection
 * @property {object|null} table
 */

/**
 * @typedef {object} IsobinProps
 * @property {Config} [config] keep this stable across renders — module scope, or `useMemo`
 * @property {string[]} [open] the bins that are out. Passing this takes control:
 *   the component stops holding its own set, and the idle animation stands down.
 * @property {string[]} [defaultOpen] which bins start out, when you are not controlling `open`
 * @property {(bin: SceneBin) => void} [onToggle] called when a bin is clicked
 * @property {boolean} [interactive] false draws scenery: no handlers, no pointer cursor
 * @property {string} [idPrefix] names this drawing's internal ids. Only needed when
 *   server-rendering more than one into a page — see the readme.
 * @property {string} [label] the `aria-label`; one is described from the scene by default
 * @property {string} [className]
 * @property {import("react").CSSProperties} [style]
 */

/**
 * @typedef {object} RenderOptions
 * @property {string[]} [open] bins to draw pulled out
 * @property {string} [idPrefix] defaults to a fresh one per call
 * @property {string} [label]
 * @property {string} [className]
 */

export {};
