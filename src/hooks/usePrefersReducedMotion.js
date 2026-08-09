import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const supported = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

/** Tracks the OS reduced-motion setting, and keeps tracking it if it changes. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => (supported() ? window.matchMedia(QUERY).matches : false));

  useEffect(() => {
    if (!supported()) return;
    const query = window.matchMedia(QUERY);
    const update = (event) => setReduced(event.matches);

    setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}
