import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E for the ganove-perspective user flow. The dev server
 * is started automatically; tests navigate with `?map=`/`?seed=` URL
 * params for deterministic games and introspect `window.__gameStore`
 * (exposed in `import.meta.env.DEV` builds only) for route planning.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
