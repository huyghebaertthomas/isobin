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
 * How a bin is divided, or `false` for not at all.
 *
 * Said in terms of what the divider splits rather than the axis it lies on:
 * `{ split: "width", into: 3 }` is three compartments left to right. A bare
 * number keeps whatever direction the bin type uses and changes only the count,
 * and a bare direction means two compartments that way.
 *
 * A bin's own beats its row's beats its type's, and `false` at any level wins —
 * every divider can be left out, whatever the type says.
 *
 * @typedef {{ split?: "width"|"depth", into?: number }|number|"width"|"depth"|boolean} DividerSpec
 */

/**
 * One bin in a row, or a bare bin type name.
 *
 * Everything is optional: `{}` is a bin one slot wide, named by its position,
 * with whatever its row's type gives it. `span` is how many of the row's slots
 * it takes, which is how unequal widths are expressed — a 3 and a 4 in the same
 * row make sevenths.
 *
 * @typedef {object} BinSpec
 * @property {number} [span] slots this bin takes across the row (default 1)
 * @property {string} [type] key into `binTypes`; defaults to the row's
 * @property {string} [id] what this bin is called. Beats every other naming rule.
 * @property {DividerSpec} [divider]
 * @property {string} [label] the readable description, for screen readers and
 *   `bin()` reports; one is described from the position by default
 * @property {unknown} [data] anything of your own; handed back untouched on the bin
 */

/**
 * Space in a row with no bin in it — the shelf runs on underneath, and the bins
 * either side are unaffected.
 *
 * @typedef {{ gap: number|true }} GapSpec
 */

/**
 * One row of a cabinet, or just the bin type's name for a single plain row.
 *
 * A row is either plain — one type across equal slots — or a list of what is in
 * it. `bins` is the general form and `type`/`count` the shorthand; a row that
 * gives both uses `type` as the default for the bins it lists.
 *
 * @typedef {object} RowSpec
 * @property {string} [type] key into `binTypes`
 * @property {number} [count] bins across the row; defaults to the type's `perRow`.
 *   The row is always filled exactly, so this widens or narrows the bins.
 * @property {Array<BinSpec|GapSpec|string|null>} [bins] what is in the row, left
 *   to right. Each entry takes `span` slots and the row is as many slots as they
 *   add up to, so widths are proportions rather than measurements.
 * @property {number} [repeat] how many identical rows to emit (default 1)
 * @property {number} [height] row units tall; defaults to the tallest bin type in it
 * @property {DividerSpec} [divider] the default for every bin in this row
 * @property {boolean} [divided] older spelling of `divider: false`
 * @property {string} [id] names the row: its bins become `id-0`, `id-1`… , or
 *   just `id` when the row holds one. Cannot be combined with `repeat`.
 * @property {string[]} [ids] one id per bin, in order across the row. Give every
 *   bin a name or none. Cannot be combined with `repeat`.
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
 * @property {(at: { organizerId: string, row: number, index: number, type: string })
 *   => string} [idFor] names every bin at once. A function, so it does not
 *   survive `JSON.stringify` — for a config you mean to serialise, name bins on
 *   the rows instead.
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
 * A named bundle of bin defaults. Presets, not a fixed menu: add your own, or
 * describe each bin directly and use none.
 *
 * @typedef {object} BinTypeSpec
 * @property {string} [label]
 * @property {number} [rowUnits] row units of height this bin occupies (default 1)
 * @property {number} [perRow] how many a plain row of this type holds
 * @property {number} [maxPull] furthest it can slide out, whatever `binPullFraction` says
 * @property {DividerSpec} [divider] the default, which any row or bin may override
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
 * @property {Record<string, HighlightSpec>} [highlights] named ways for a bin to
 *   stand out, for the `highlight` prop to point at
 * @property {LabelConfig} [label] how a lettered bin is set
 */

/**
 * A way for a bin to stand out: the `bin` surface with this folded over it, so
 * naming a fill is enough. `pulse` breathes its opacity, for the one bin you
 * are trying to make somebody look at — it stands down under
 * `prefers-reduced-motion`.
 *
 * @typedef {object} HighlightSpec
 * @property {string} [fill]
 * @property {number} [fillOpacity]
 * @property {string} [stroke]
 * @property {number} [strokeOpacity]
 * @property {number} [width]
 * @property {boolean} [pulse]
 */

/**
 * @typedef {object} LabelConfig
 * @property {string} [fill]
 * @property {number} [opacity]
 * @property {number} [size] cap height in world units, so it scales with the drawing
 * @property {string} [family]
 * @property {number|string} [weight]
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
 * A bin in a built scene. `id` is what every call and callback deals in.
 *
 * @typedef {object} SceneBin
 * @property {string} id
 * @property {string} organizerId
 * @property {string|null} type the bin type's key, if it has one
 * @property {number} pull how far it slides, in world units
 * @property {{ at: number, span: number }} slot where it sits across its row, in slots
 * @property {unknown} [data] whatever the layout hung on this bin
 */

/**
 * A bin as the handle reports it: where it sits in the layout, whether it is
 * open, and the box it occupies on screen.
 *
 * `screen` is in the same user units as the drawing's viewBox — it covers the
 * bin both shut and fully pulled out, so a badge or tooltip anchored to it
 * stays put while the bin moves.
 *
 * @typedef {object} BinInfo
 * @property {string} id
 * @property {string} organizerId
 * @property {string} [organizerName]
 * @property {string|null} type the bin type's key, if it has one
 * @property {number} row which row it is in, counting from the top
 * @property {number} index its place across that row, from the left, counting
 *   bins only — a gap is not a bin and does not take a number
 * @property {string} label a readable description, e.g. "Organizer 1 · row 3 · bin 2"
 * @property {boolean} open
 * @property {unknown} [data] whatever the layout hung on this bin
 * @property {{ x: number, y: number, width: number, height: number }} screen
 */

/**
 * What a `ref` on `<Isobin>` gives you.
 *
 * The four that change things return the resulting open set. Reads answer from
 * the current state rather than the last render, so `open(id)` followed by
 * `isOpen(id)` is true straight away.
 *
 * An id that names no bin is ignored, with one warning — a silent no-op on a
 * mistyped id is a long afternoon.
 *
 * @typedef {object} IsobinHandle
 * @property {(ids: string|string[]) => string[]} open pull out a bin, or several
 * @property {(ids: string|string[]) => string[]} close push one back in
 * @property {(id: string) => string[]} toggle
 * @property {(ids: string|string[]) => string[]} set exactly these, and nothing else
 * @property {() => string[]} closeAll
 * @property {(id: string) => boolean} isOpen
 * @property {() => string[]} getOpen the ids out now, in the order they opened
 * @property {(id: string) => BinInfo|null} bin
 * @property {() => BinInfo[]} bins every bin in the drawing, in build order
 */

/**
 * What opening one bin does to the others.
 *
 * `multi` leaves them alone. `single` shuts them, so the set never holds more
 * than one — a drawing that follows a selection somewhere else in your app.
 *
 * @typedef {"single"|"multi"} SelectionMode
 */

/**
 * @typedef {object} ChangeDetail
 * @property {"open"|"close"|"toggle"|"set"|"closeAll"} action what was asked for
 * @property {string|string[]} [ids] the argument it was asked with
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
 * @property {string[]} [open] the bins that are out. Passing this takes control: the
 *   component stops holding its own set and reports through `onChange` instead.
 * @property {string[]} [defaultOpen] which bins start out, when you are not controlling `open`
 * @property {SelectionMode} [mode] what opening one bin does to the others. Default `"multi"`.
 * @property {Record<string, string|HighlightSpec>|string[]} [highlight] bins to
 *   pick out, by id. The value names one of `appearance.highlights`, or gives a
 *   colour, or a whole surface. An array is shorthand for the `found` highlight.
 * @property {Record<string, string|number>} [labels] what to letter each bin
 *   with, by id — a part number, a count, whatever your data has
 * @property {(open: string[], detail: ChangeDetail) => void} [onChange] the open set
 *   changed, or would have. Fires for clicks and for calls on the handle alike.
 * @property {(bin: BinInfo) => void} [onToggle] a bin was clicked or worked from the keyboard
 * @property {(bin: BinInfo) => void} [onBinEnter] the pointer entered a bin — for tooltips.
 *   Reported even when `interactive` is false.
 * @property {(bin: BinInfo) => void} [onBinLeave] and left it
 * @property {boolean} [interactive] false draws scenery: no clicks, no focus, no cursor
 * @property {string} [idPrefix] names this drawing's internal ids. Only needed when
 *   server-rendering more than one into a page — see the readme.
 * @property {string} [label] the `aria-label`; one is described from the scene by default
 * @property {string} [className]
 * @property {import("react").CSSProperties} [style]
 */

/**
 * @typedef {object} RenderOptions
 * @property {string[]} [open] bins to draw pulled out
 * @property {Record<string, string|HighlightSpec>|string[]} [highlight] bins to pick out
 * @property {Record<string, string|number>} [labels] what to letter each bin with
 * @property {string} [idPrefix] defaults to a fresh one per call
 * @property {string} [label] the `aria-label` for the drawing as a whole
 * @property {string} [className]
 */

export {};
