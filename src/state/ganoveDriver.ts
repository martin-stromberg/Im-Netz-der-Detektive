/**
 * Store-bound driver for the AI ganove (requirement step 10 — the mirror
 * image of `detectiveDriver.ts`): in the detective perspective a human
 * steers the whole squad while the AI plays the ganove's turns. Whenever
 * the phase is `"ganove"` the driver resolves the pending sabotage offer,
 * taps the police radio under pressure and picks a move or action round
 * via `chooseGanoveTurn` — synchronously, until the phase hands back to
 * `"detektive"` or an `outcome` ends the game.
 *
 * Determinism matches the headless simulation exactly: draws come from
 * `aiRng(seed, round, 0)` (same salt, same lane as `AiSimulation`), and
 * the AI only ever sees `buildGanoveView(state)` — the same filtered
 * view the human ganove UI uses. The driver never acts outside the
 * ganove phase; a `pendingChoice` is answered the moment it appears
 * (the same order `runAiGame` uses — it does not block detective moves).
 */
import { chooseGanoveTurn, chooseSabotagePath, shouldUseRadio } from "../logic/GanoveAI";
import { aiRng, buildGanoveView } from "../logic/AiSimulation";
import { useGameStore } from "./gameStore";

/**
 * Runs the ganove phase to completion: pending informant offers are
 * answered first (`chooseSabotagePath`), then the police radio is tapped
 * when `shouldUseRadio` fires, then `chooseGanoveTurn` decides between
 * `ganoveAction` and `moveGanove` — the store's escape/surrounded/outcome
 * handling applies inside the loop. No-op unless the game is running and
 * work exists (`pendingChoice` or `phase === "ganove"`).
 */
export function driveGanovePhase(): void {
  const store = useGameStore;
  for (;;) {
    const state = store.getState();
    if (state.map === null || state.outcome !== null) {
      return;
    }
    if (state.mission?.pendingChoice != null) {
      state.chooseMissionPath(chooseSabotagePath(buildGanoveView(state)));
      continue;
    }
    if (state.phase !== "ganove") {
      return;
    }
    const view = buildGanoveView(state);
    if (shouldUseRadio(view)) {
      state.useRadio();
      continue;
    }
    const turn = chooseGanoveTurn(view, aiRng(state.seed, state.round, 0));
    if (turn.type === "action") {
      state.ganoveAction();
    } else {
      state.moveGanove(turn.target);
    }
  }
}

let driving = false;

/**
 * Subscribes to the store and drives every ganove turn automatically.
 * Returns the unsubscribe function — idempotent per subscription; a
 * re-entrancy guard prevents nested notifications (each action publishes
 * again) from re-entering the loop.
 */
export function installGanoveDriver(): () => void {
  return useGameStore.subscribe((state) => {
    if (driving || state.map === null || state.outcome !== null) {
      return;
    }
    if (state.phase !== "ganove" && state.mission?.pendingChoice == null) {
      return;
    }
    driving = true;
    try {
      driveGanovePhase();
    } finally {
      driving = false;
    }
  });
}
