/**
 * Replay determinism (spec section 8.1): the recorded actor entries
 * re-executed on the header reconstruction reproduce the recorded
 * game state exactly — at every step, in both directions.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { loadMap } from "./MapLoader";
import { runAiGame } from "./AiSimulation";
import { serializeLog } from "./Recorder";
import { isReplayAction, openReplay, ReplayError, replayActions, replayTo } from "./ReplayPlayer";
import { visibleEvents } from "./InformationSystem";
import { snapshotGame } from "./SaveGame";
import { useGameStore, type GameStateSnapshot } from "../state/gameStore";

const map = loadMap("teststadt");
const store = () => useGameStore.getState();

/** Runs one AI-vs-AI game to a natural (non-draw) outcome. */
function recordedGame(seed = 3): { jsonl: string; observed: GameStateSnapshot[] } {
  const observed: GameStateSnapshot[] = [];
  const result = runAiGame(map, seed, { observe: (s) => observed.push(snapshotGame(s)) });
  // draw-by-abort leaves no actor entry — pick a natural ending instead.
  if (result.outcome === "draw") {
    return recordedGame(seed + 1);
  }
  return { jsonl: serializeLog(result.log), observed };
}

/** The plain-data subset of the current store state. */
function currentSnapshot(): GameStateSnapshot {
  return snapshotGame(store());
}

describe("isReplayAction / replayActions", () => {
  beforeEach(() => store().resetGame());

  it("marks only actor entries as replay steps", () => {
    const { jsonl } = recordedGame();
    const source = openReplay(jsonl);
    for (const action of source.actions) {
      expect(isReplayAction(action)).toBe(true);
      expect(["move", "action", "sabotage_offer", "radio"]).toContain(action.type);
      if (action.type === "sabotage_offer") {
        expect(action.chosen).toBeDefined();
      }
    }
    // Engine-emitted entries are never steps.
    expect(
      source.entries.filter(
        (entry) =>
          !isReplayAction(entry) &&
          !["header", "hint", "event", "edge_unblock", "sabotage", "result"].includes(entry.type),
      ),
    ).toEqual([]);
    // A `sabotage_offer` without `chosen` (the mere offer) is engine output.
    const offer = source.entries.find(
      (entry) => entry.type === "sabotage_offer" && entry.chosen === undefined,
    );
    if (offer !== undefined) {
      expect(isReplayAction(offer)).toBe(false);
    }
  });
});

describe("openReplay", () => {
  it("reconstructs the start from the header", () => {
    const { jsonl } = recordedGame();
    const source = openReplay(jsonl);
    expect(source.start.mapId).toBe("teststadt");
    expect(source.start.options.resolvedCameras).toBeDefined();
    expect(source.actions.length).toBeGreaterThan(0);
  });

  it("throws ReplayError for logs without a header", () => {
    expect(() => openReplay(JSON.stringify({ type: "move" }))).toThrow(ReplayError);
  });
});

describe("replayTo determinism", () => {
  beforeEach(() => store().resetGame());

  it("reproduces the recorded state at every step", () => {
    const { jsonl, observed } = recordedGame();
    const source = openReplay(jsonl);
    // Each AI loop iteration applies exactly one actor entry.
    const comparable = Math.min(observed.length, source.actions.length);
    for (let step = 1; step <= comparable; step += 1) {
      replayTo(useGameStore, map, source, step);
      expect(currentSnapshot()).toEqual(observed[step - 1]);
    }
  });

  it("rebuilds the identical log after the full replay", () => {
    const { jsonl } = recordedGame();
    const source = openReplay(jsonl);
    replayTo(useGameStore, map, source, source.actions.length);
    expect(serializeLog(store().log)).toBe(jsonl);
  });

  it("rebuilds a bit-identical log for a human-mode log (config.playerMode)", () => {
    // Human games carry `playerMode` in the header config — the
    // reconstructed start must rewrite it or the replayed header
    // would differ from the recorded one.
    store().startGame(map, 42, { playerMode: "ganove" });
    const moves = store().getLegalGanoveMoves();
    store().moveGanove(moves[0].nodeId);
    while (store().phase === "detektive" && store().outcome === null) {
      const targets = store().getLegalDetectiveMoves();
      if (targets.length === 0) {
        break;
      }
      store().moveDetective(targets[0].nodeId);
    }
    const jsonl = serializeLog(store().log);
    const source = openReplay(jsonl);
    expect(source.start.options.playerMode).toBe("ganove");
    replayTo(useGameStore, map, source, source.actions.length);
    expect(serializeLog(store().log)).toBe(jsonl);
  });

  it("stepping back lands on the identical earlier state", () => {
    const { jsonl } = recordedGame();
    const source = openReplay(jsonl);
    const mid = Math.max(1, Math.floor(source.actions.length / 2));

    replayTo(useGameStore, map, source, mid);
    const forward = { snapshot: currentSnapshot(), log: serializeLog(store().log) };

    replayTo(useGameStore, map, source, source.actions.length);
    replayTo(useGameStore, map, source, mid - 1);
    expect(currentSnapshot()).not.toEqual(forward.snapshot);

    replayTo(useGameStore, map, source, mid);
    expect(currentSnapshot()).toEqual(forward.snapshot);
    expect(serializeLog(store().log)).toBe(forward.log);
  });

  it("clamps the step count into the valid range", () => {
    const { jsonl } = recordedGame();
    const source = openReplay(jsonl);
    replayTo(useGameStore, map, source, source.actions.length + 50);
    const beyond = currentSnapshot();
    replayTo(useGameStore, map, source, source.actions.length);
    expect(currentSnapshot()).toEqual(beyond);
  });
});

describe("perspective filtering", () => {
  beforeEach(() => store().resetGame());

  it("detective view never contains ganove-only entries", () => {
    const { jsonl } = recordedGame();
    const source = openReplay(jsonl);
    replayTo(useGameStore, map, source, source.actions.length);
    const detectiveIntel = visibleEvents(store().events, "detectives");
    expect(detectiveIntel.every((event) => event.visibleTo !== "ganove")).toBe(true);
    expect(detectiveIntel.every((event) => event.kind !== "polizeifunk")).toBe(true);
    // The recorded log does contain ganove-only entries — the asymmetry
    // is a data filter, not a property of the log.
    expect(replayActions(source.entries).some((entry) => entry.visibleTo === "ganove")).toBe(true);
  });
});
