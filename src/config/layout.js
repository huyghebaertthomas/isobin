/**
 * Which cabinets exist, and what goes in them.
 *
 * A row is either a plain one — a bin type and a count — or a list of what is
 * in it. A bare string is the shortest plain row there is.
 *
 *   type     — key into `config/binTypes.js`, for a row of one kind of bin
 *   count    — bins across the row; defaults to the bin type's `perRow`.
 *              The row is always filled exactly, so this widens or narrows the
 *              bins rather than leaving a gap.
 *   repeat   — how many identical rows to emit (default 1)
 *   height   — row units tall; defaults to the tallest bin type in the row
 *   divider  — the default divider for every bin in the row
 *   bins     — what is in the row, in order across it. Each entry takes `span`
 *              slots and the row is however many slots they add up to, so
 *              `[{ span: 3 }, { span: 4 }]` gives you sevenths. `{ gap: 2 }`
 *              leaves two slots clear with no bin in them.
 *
 * Rows are listed top to bottom. Cabinets are placed left to right from
 * `origin`, each one `gap` away from the last — no x coordinate is authored.
 */
export const layout = {
  /** world x where the leftmost cabinet starts */
  origin: 0,
  /** horizontal gap between neighbouring cabinets */
  gap: 0.14,
  /** usable width inside a cabinet, in world units; per-cabinet overridable */
  innerWidth: 5,

  /**
   * The surface the cabinets stand on. Measured from them, not authored: it
   * spans whatever cabinets there are, `overhang` clear of them on every side.
   */
  table: { enabled: true, thickness: 0.16, overhang: 0.35 },

  organizers: [
    {
      id: "A",
      name: "Organizer 1",
      rows: [{ type: "small", repeat: 12 }],
    },
    {
      id: "B",
      name: "Organizer 2",
      rows: [
        { type: "small", repeat: 6 },
        { type: "medium", repeat: 2 },
        { type: "large", repeat: 2 },
      ],
    },
  ],
};
