import { useCallback, useMemo, useRef, useState } from "react";
import { createBinApi } from "../lib/binApi.js";

/**
 * The open set, and the handle that drives it.
 *
 * Controlled or not, the handle is the same object and behaves the same way.
 * The difference is only in what `write` does: uncontrolled, it sets state;
 * controlled, it reports what it would have set and leaves the caller to do it.
 * Either way `onChange` fires, so a caller can mirror the set into their own
 * state without having to take over first.
 *
 * `latest` is what makes reads truthful. A handle that closed over the state
 * value would answer `isOpen` from the last render, so `open(id)` followed by
 * `isOpen(id)` would say false — true a moment later, which is worse than
 * wrong. The ref is written on every change as well as every render, so the
 * answer is current even in the same tick.
 *
 * @param {object} options
 * @param {string[]} [options.open] the caller's set; supplying it takes control
 * @param {string[]} [options.defaultOpen] the set to start from, when uncontrolled
 * @param {"single"|"multi"} options.mode
 * @param {(ids: string[], detail: object) => void} [options.onChange]
 * @param {Map<string, object>} options.bins every bin in the scene, by id
 */
export function useOpenBins({ open, defaultOpen, mode, onChange, bins }) {
  const controlled = open !== undefined;
  const [held, setHeld] = useState(() => [...(defaultOpen ?? [])]);

  const current = controlled ? open : held;
  const latest = useRef(current);
  latest.current = current;

  // read through refs so the handle never needs rebuilding, and so a caller who
  // stashes it in a ref of their own is not holding a stale closure
  const settings = useRef({ mode, onChange, controlled });
  settings.current = { mode, onChange, controlled };

  const write = useCallback((next, detail) => {
    const { controlled: owned, onChange: report } = settings.current;
    if (next === latest.current) return;

    latest.current = next;
    if (!owned) setHeld(next);
    report?.(next, detail);
  }, []);

  const api = useMemo(
    () =>
      createBinApi({
        read: () => latest.current,
        write,
        getMode: () => settings.current.mode,
        lookup: bins,
      }),
    [write, bins]
  );

  return { open: current, api };
}
