import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { useGameStore } from "../state/gameStore";

// React 18 act() support for @testing-library/react under Vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  // The game store is a module-level singleton — reset it so tests stay isolated.
  useGameStore.getState().resetGame();
});
