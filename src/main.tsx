import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./theme.css";
import App from "./App";
import { useGameStore } from "./state/gameStore";

// E2E instrumentation: expose the store only on the dev server so
// Playwright can introspect state — production builds never see this.
if (import.meta.env.DEV) {
  (window as unknown as { __gameStore: typeof useGameStore }).__gameStore = useGameStore;
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element '#root' not found in index.html");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
