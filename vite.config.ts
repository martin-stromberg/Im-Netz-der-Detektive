import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/vite-env.d.ts", "**/*.test.*"],
      reporter: ["text", "text-summary", "json-summary", "html"],
      thresholds: {
        lines: 70,
      },
    },
  },
});
