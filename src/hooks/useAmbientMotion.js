import { useEffect } from "react";
import { chance, randomIn, randomPick } from "../lib/random.js";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";

/**
 * The idle animation: every `interval`, open a bin or two at random and shut
 * them again after a while. Purely decorative, so it stands down when the OS
 * asks for reduced motion.
 */
export function useAmbientMotion(bins, controller, settings) {
  const reduced = usePrefersReducedMotion();
  const { openBin, closeBin, closedAmong } = controller;

  const active = settings.enabled && !(settings.respectReducedMotion && reduced) && bins.length > 0;

  useEffect(() => {
    if (!active) return;

    const ids = bins.map((bin) => bin.id);
    const timers = new Set();

    const tick = () => {
      const closed = closedAmong(ids);
      if (!closed.length) return;

      const count = chance(settings.burstChance) ? settings.burstSize : 1;
      for (let i = 0; i < count; i++) {
        const id = randomPick(closed);
        openBin(id);

        const timer = setTimeout(() => {
          closeBin(id);
          timers.delete(timer);
        }, randomIn(settings.hold));
        timers.add(timer);
      }
    };

    const interval = setInterval(tick, settings.interval);
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
    };
  }, [active, bins, settings, openBin, closeBin, closedAmong]);
}
