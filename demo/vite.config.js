import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

const src = (path) => fileURLToPath(new URL(`../src/${path}`, import.meta.url));

/**
 * The demo: the playground that goes on GitHub Pages, and the package's first
 * consumer.
 *
 * It imports `isobin` by name rather than by relative path, so it exercises the
 * public surface exactly as anyone else would — an export missing from
 * `src/index.js` breaks the demo, which is the point. The alias then sends
 * those imports at the source rather than at `dist/`, so `npm run dev` needs no
 * build step and one React is on the page instead of two.
 *
 * `base` is relative so the built demo works from a project page's subpath
 * without knowing the repository's name.
 */
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  plugins: [react(), tailwind()],
  resolve: {
    alias: [
      { find: /^isobin\/core$/, replacement: src("core.js") },
      { find: /^isobin\/svg$/, replacement: src("svg.js") },
      { find: /^isobin$/, replacement: src("index.js") },
    ],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
