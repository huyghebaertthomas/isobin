/**
 * Named bundles of bin defaults — presets, not a fixed menu.
 *
 * A type is only where a bin's defaults come from. Any row or bin may override
 * any of it, and a bin need not have a type at all: `{ span: 3, id: "L" }` is a
 * perfectly good bin. Add your own types here for the sizes your system
 * actually uses, or skip types entirely and describe each row's bins directly.
 *
 * `perRow` is the count a plain `{ type: "small" }` row fills itself with. It
 * is not a width — a row is always filled exactly, so bin width falls out of
 * how many slots the row's contents add up to.
 *
 * A divider is described by what it splits, not by the axis it lies on:
 *
 *   { split: "width", into: 3 }   three compartments, left to right
 *   { split: "depth", into: 2 }   two compartments, front to back
 *
 * Whatever a type says, a row or a bin can say `divider: false` and have none —
 * a divider is a piece of plastic you can take out.
 */
export const binTypes = {
  small: {
    label: "Small",
    /** row units of height this bin occupies */
    rowUnits: 1,
    /** how many of these a plain row of this type holds */
    perRow: 5,
    /** furthest this bin can slide out, regardless of binPullFraction */
    maxPull: 1.2,
    divider: { split: "depth", into: 2 },
  },
  medium: {
    label: "Medium",
    rowUnits: 1,
    perRow: 2,
    maxPull: 1.2,
    divider: { split: "width", into: 2 },
  },
  large: {
    label: "Large",
    rowUnits: 2,
    perRow: 1,
    maxPull: 1.45,
    divider: { split: "width", into: 3 },
  },
};
