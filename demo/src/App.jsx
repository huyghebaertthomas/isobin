import { Playground } from "./Playground.jsx";

/**
 * The isobin playground.
 *
 * Everything here is demo, not library: the page around the drawing, the
 * control panel, and the schema that describes it. The drawing itself is
 * `<Isobin>` out of the package, configured exactly the way anyone installing
 * it would configure it — which is the point of `Copy config`.
 */
export default function App() {
  return <Playground />;
}
