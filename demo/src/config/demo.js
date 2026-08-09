/**
 * The playground's own settings — not config, and never seen by the library.
 *
 * `mode` is a prop on `<Isobin>`. The idle drift is a timer in this app calling
 * `open` and `close` on the handle, which is where that behaviour belongs: a
 * twin of a real shelf should move when something happens, not on a clock.
 *
 * It rides in the same object as the config because the panel edits by path and
 * does not care which branch a path lands in. `<Isobin>` ignores it.
 */
export const demo = {
  /** what opening one bin does to the others: "multi" or "single" */
  mode: "multi",

  idle: {
    enabled: true,
    interval: 1150,
    holdMin: 2400,
    holdMax: 5200,
  },
};
