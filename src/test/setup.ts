import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { useGameStore } from "../state/gameStore";
import { DEFAULT_UI_PREFS, UI_PREFS_STORAGE_KEY, useUiPrefs } from "../state/uiPrefs";

// React 18 act() support for @testing-library/react under Vitest.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  cleanup();
  // The game store is a module-level singleton — reset it so tests stay isolated.
  useGameStore.getState().resetGame();
  // Same for the persisted UI preferences: reset state and drop the
  // localStorage entry so no test inherits a previous language/volume.
  useUiPrefs.setState({ ...DEFAULT_UI_PREFS });
  if (typeof window !== "undefined" && window.localStorage != null) {
    window.localStorage.removeItem(UI_PREFS_STORAGE_KEY);
  }
});
