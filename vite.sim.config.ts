import { defineConfig } from "vite";

/**
 * SSR-Build für die KI-vs.-KI-Batch-CLI `scripts/sim.ts`
 * (`npm run sim`): bündelt den Headless-Einstieg samt `import.meta.glob`
 * (MapLoader/MissionLoader) zu einem Node-ESM-Bundle in `dist-sim/`.
 * Unabhängig vom App-Build (`vite build` → `dist/`).
 */
export default defineConfig({
  build: {
    ssr: "scripts/sim.ts",
    outDir: "dist-sim",
    rollupOptions: { output: { entryFileNames: "sim.mjs" } },
    logLevel: "warn",
  },
});
