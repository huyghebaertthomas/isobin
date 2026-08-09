import { useCallback, useMemo, useRef, useState } from "react";

/**
 * Which bins are currently pulled out.
 *
 * State is a set of open ids; the ref mirrors it so callers on a timer can read
 * the current value without re-subscribing every render.
 *
 * `initial` seeds it once, at mount. Changing it afterwards does nothing, which
 * is what makes it a default rather than a value — a caller who wants to say
 * which bins are open from moment to moment controls `open` instead.
 */
export function useOpenBins(initial) {
  const [open, setOpen] = useState(() =>
    Object.fromEntries((initial ?? []).map((id) => [id, true]))
  );
  const latest = useRef(open);
  latest.current = open;

  const openBin = useCallback(
    (id) => setOpen((prev) => (prev[id] ? prev : { ...prev, [id]: true })),
    []
  );

  const closeBin = useCallback(
    (id) =>
      setOpen((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      }),
    []
  );

  const toggleBin = useCallback(
    (id) =>
      setOpen((prev) => {
        const next = { ...prev };
        if (next[id]) delete next[id];
        else next[id] = true;
        return next;
      }),
    []
  );

  const closeAll = useCallback(() => setOpen({}), []);

  /** ids from `candidates` that are shut right now, read off the ref */
  const closedAmong = useCallback((ids) => ids.filter((id) => !latest.current[id]), []);

  const isOpen = useCallback((id) => !!open[id], [open]);

  return useMemo(
    () => ({ open, isOpen, openBin, closeBin, toggleBin, closeAll, closedAmong }),
    [open, isOpen, openBin, closeBin, toggleBin, closeAll, closedAmong]
  );
}
