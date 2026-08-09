import { useEffect, useState } from "react";
import { Playground } from "./Playground.jsx";
import { Sandbox } from "./Sandbox.jsx";

/**
 * The isobin demo, in two halves.
 *
 * `#bench` drives a drawing through its handle — modes, highlights, labels,
 * hover, keyboard. Everything else is the playground, which edits config.
 * Both are demo, not library: the page, the panel, and the schema that
 * describes it are this app's. The drawing in each is `<Isobin>` out of the
 * package, configured exactly the way anyone installing it would configure it —
 * which is the point of `Copy config`.
 */
export default function App() {
  const route = useHash();
  return route === "#bench" ? <Sandbox /> : <Playground />;
}

function useHash() {
  const [hash, setHash] = useState(() => (typeof location === "undefined" ? "" : location.hash));

  useEffect(() => {
    const onChange = () => setHash(location.hash);
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);

  return hash;
}
