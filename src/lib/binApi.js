import { closeAllBins, closeBins, openBins, setBins, toggleBin } from "./selection.js";

/**
 * The handle a caller drives a drawing with.
 *
 * Everything here is a closure over three things — how to read the open set,
 * how to write it, and what bins exist — so the same object serves a mounted
 * component and a test with a plain variable behind it. React does not appear
 * in this file, which is why the behaviour can be checked without a DOM.
 *
 * Reads are answered from `read()` at the moment they are asked, not from a
 * value captured when the handle was built. `open(id)` followed immediately by
 * `isOpen(id)` therefore tells the truth, which it would not if this leaned on
 * a state value that React has not re-rendered with yet.
 */
export function createBinApi({ read, write, getMode, lookup }) {
  /**
   * Ids that name a bin. An id that names nothing is almost always a typo or a
   * key from the wrong system, and silently doing nothing about it is a long
   * afternoon — so it is dropped, and said out loud once.
   */
  const known = (ids) => {
    const all = Array.isArray(ids) ? ids : [ids];
    const good = all.filter((id) => lookup.has(id));

    if (good.length !== all.length) {
      const missing = all.filter((id) => !lookup.has(id));
      warn(`isobin: no bin with id ${missing.map((id) => JSON.stringify(id)).join(", ")}.`);
    }
    return good;
  };

  const change = (next, detail) => {
    write(next, detail);
    return next;
  };

  return {
    /** pull a bin out, or several. In single mode, the last one wins. */
    open: (ids) => change(openBins(read(), known(ids), getMode()), { action: "open", ids }),

    /** push one back in */
    close: (ids) => change(closeBins(read(), ids), { action: "close", ids }),

    /** out if it is in, in if it is out */
    toggle: (id) => change(toggleBin(read(), known(id)[0], getMode()), { action: "toggle", ids: id }),

    /** exactly these, and nothing else */
    set: (ids) => change(setBins(read(), known(ids), getMode()), { action: "set", ids }),

    closeAll: () => change(closeAllBins(read()), { action: "closeAll" }),

    /** is this one out? */
    isOpen: (id) => read().includes(id),

    /**
     * The ids currently out, in the order they were opened.
     *
     * Named for what it does rather than what it is about: `openBins()` would
     * read as an instruction to open them, and would collide with the reducer
     * of that name in `isobin/core`.
     */
    getOpen: () => [...read()],

    /** one bin and what is known about it, or null if there is no such bin */
    bin: (id) => describe(lookup.get(id), read()),

    /** every bin in the drawing, in build order */
    bins: () => [...lookup.values()].map((bin) => describe(bin, read())),
  };
}

/**
 * What a caller gets told about a bin: where it is in the layout, whether it is
 * open, and the box it occupies on screen — that last one is what an HTML
 * tooltip or badge needs in order to sit over the right compartment.
 */
function describe(bin, open) {
  if (!bin) return null;

  return {
    id: bin.id,
    organizerId: bin.organizerId,
    organizerName: bin.organizerName,
    type: bin.type,
    row: bin.row,
    index: bin.index,
    label: bin.label,
    open: open.includes(bin.id),
    /** whatever the layout hung on this bin, so a caller gets it back here */
    data: bin.data,
    screen: {
      x: bin.screen.x,
      y: bin.screen.y,
      width: bin.screen.width,
      height: bin.screen.height,
    },
  };
}

/** said once per message, so a mistake in a render loop does not flood the log */
const said = new Set();

function warn(message) {
  if (said.has(message)) return;
  said.add(message);
  // eslint-disable-next-line no-console
  console.warn(message);
}
