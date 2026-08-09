import { useEffect } from "react";

/**
 * Bins that open and shut on their own, for a screen nobody is using.
 *
 * This used to live in the library, and does not belong there: an inventory
 * twin should move when something happens, not on a timer. It is kept here
 * because it is the shortest honest example of driving a drawing from outside
 * — every line below goes through the same handle any application would use.
 *
 *   const wall = useRef(null);
 *   useIdleDrift(wall, { enabled: true });
 *
 * It stands down when the OS asks for reduced motion, which decorative motion
 * always should.
 *
 * @param {{ current: import("isobin").IsobinHandle|null }} wall
 */
export function useIdleDrift(wall, { enabled = true, interval = 1150, hold = [2400, 5200] } = {}) {
  useEffect(() => {
    if (!enabled || reducedMotion()) return undefined;

    const timers = new Set();

    const tick = () => {
      const api = wall.current;
      if (!api) return;

      // ask the drawing what it has and what is already out — no need to keep
      // a copy of either
      const shut = api.bins().filter((bin) => !bin.open);
      if (!shut.length) return;

      const { id } = shut[Math.floor(Math.random() * shut.length)];
      api.open(id);

      const timer = setTimeout(() => {
        wall.current?.close(id);
        timers.delete(timer);
      }, hold[0] + Math.random() * (hold[1] - hold[0]));
      timers.add(timer);
    };

    const ticking = setInterval(tick, interval);
    return () => {
      clearInterval(ticking);
      timers.forEach(clearTimeout);
      wall.current?.closeAll();
    };
  }, [wall, enabled, interval, hold[0], hold[1]]);
}

const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
