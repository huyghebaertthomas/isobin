import { BinWall } from "./components/BinWall.jsx";

/**
 * Nothing is configured here, so the twin runs on `src/config/`. To try a
 * variation, define an override object at module scope and pass it:
 *
 *   const config = { view: { scale: 30 } };
 *   <BinWall config={config} />
 */
export default function App() {
  return <BinWall />;
}
