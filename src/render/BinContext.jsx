import { createContext, useContext } from "react";

/**
 * Everything a bin needs that is about *that* bin.
 *
 * Highlighting, lettering and the handlers all vary bin by bin, and threading
 * five more props through the cabinet to reach them would make `Organizer` a
 * post office for messages it has no interest in. A context is the honest
 * shape: the scene knows these things, the bins want them, and nothing in
 * between is involved.
 *
 * The default is a drawing that does none of it, which is what keeps `Bin`
 * usable on its own and the common case free.
 */
const NOTHING = {
  /** a material to wear instead of the plain `bin` surface, or null */
  materialFor: () => null,
  /** what to letter it with, or null */
  labelFor: () => null,
  /** how lettering is set — `appearance.label`, resolved */
  labelStyle: null,
  /** click, hover and keyboard; null handlers mean "not interactive" */
  handlers: { onToggle: null, onEnter: null, onLeave: null, onKeyDown: null, focusable: false },
};

const BinContext = createContext(NOTHING);

export function BinProvider({ value, children }) {
  return <BinContext.Provider value={value}>{children}</BinContext.Provider>;
}

export const useBin = () => useContext(BinContext);
