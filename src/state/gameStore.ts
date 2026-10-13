import { create } from "zustand";
import { advanceRound } from "../logic/placeholder";

export interface GameState {
  /** Current round number; a game starts at round 1. */
  round: number;
  advanceRound: () => void;
}

/**
 * Zustand store holding the game state. Deliberately headless-capable:
 * it carries no React dependency beyond the hook binding, so simulations
 * can drive it via `useGameStore.getState()` / `setState()` without a UI.
 */
export const useGameStore = create<GameState>((set) => ({
  round: 1,
  advanceRound: () => set((state) => ({ round: advanceRound(state.round) })),
}));
