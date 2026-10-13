import { describe, expect, it } from "vitest";
import {
  buildDetectiveView,
  buildGanoveView,
  runAiBatch,
  runAiGame,
  summarizeBatch,
} from "./AiSimulation";
import { deducePossiblePositions } from "./Deduction";
import { visibleCameras, visibleEvents } from "./InformationSystem";
import { loadMap } from "./MapLoader";
import { serializeLog } from "./Recorder";
import type { MapPack } from "./mapPack";
import type { GameState } from "../state/gameStore";

const teststadt = loadMap("teststadt");
const luebeck = loadMap("luebeck");
const muenster = loadMap("muenster");

/** Clone of teststadt without the `falsche_spur` sabotage effect. */
function withoutFalseTrail(map: MapPack): MapPack {
  return {
    ...map,
    settings: {
      ...map.settings,
      sabotageEffects: map.settings.sabotageEffects.filter((e) => e !== "falsche_spur"),
    },
  };
}

describe("runAiGame", () => {
  it("plays a full game to a regular outcome with a complete log", () => {
    const result = runAiGame(teststadt, 1);
    expect(result.outcome).not.toBeNull();
    expect(result.rounds).toBeGreaterThan(0);
    const types = result.log.map((entry) => entry.type);
    expect(types[0]).toBe("header");
    expect(types).toContain("result");
    const resultEntry = result.log.find((entry) => entry.type === "result");
    expect(resultEntry?.outcome).toBe(result.outcome);
  });

  it("is reproducible — same seed produces a bit-identical log", () => {
    const first = runAiGame(teststadt, 42);
    const second = runAiGame(teststadt, 42);
    expect(serializeLog(second.log)).toBe(serializeLog(first.log));
  });

  it("produces different games for different seeds", () => {
    const logs = [1, 2, 3, 4, 5].map((seed) => serializeLog(runAiGame(teststadt, seed).log));
    expect(new Set(logs).size).toBeGreaterThan(1);
  });

  it("the deduction never excludes the true ganove position", () => {
    // Unfalsified run (no `falsche_spur`): after every turn the belief
    // set built from detective-visible data must contain the real
    // ganove position.
    const violations: string[] = [];
    const clean = withoutFalseTrail(muenster);
    runAiGame(clean, 3, {
      observe: (state: GameState) => {
        if (state.outcome !== null || state.ganovePosition === null) {
          return;
        }
        const header = state.log.find((e) => e.type === "header");
        const starts = (header?.starts as { detectives?: string[] } | undefined)?.detectives ?? [];
        const belief = deducePossiblePositions({
          map: clean,
          detectiveStarts: starts,
          events: visibleEvents(state.events, "detectives"),
          cameras: visibleCameras(state.cameras, "detectives"),
          round: state.phase === "detektive" ? state.round : state.round - 1,
          detectivePositions: state.detektivePositions,
        });
        if (!belief.includes(state.ganovePosition)) {
          violations.push(`round ${state.round}: ${state.ganovePosition} ∉ [${belief}]`);
        }
      },
    });
    expect(violations).toEqual([]);
  });
});

describe("Informations-Trennung (structural no-leak)", () => {
  it("buildDetectiveView exposes no ganove position or mission targets", () => {
    const result = runAiGame(teststadt, 1, {
      observe: (state) => {
        if (state.outcome !== null) {
          return;
        }
        const view = buildDetectiveView(state, []);
        // The view type has no fields for forbidden knowledge at all.
        expect("ganovePosition" in view).toBe(false);
        expect("mission" in view).toBe(false);
        expect("escapeNodeIds" in view).toBe(false);
        // Mission targets must not appear anywhere in the structure view.
        // (Hint events may legitimately carry the ganove's position —
        // that is the detective-side information channel itself.)
        if (state.mission !== null) {
          for (const target of Object.values(state.mission.targets)) {
            if (typeof target === "string") {
              expect(JSON.stringify(view.missionStructure)).not.toContain(`"${target}"`);
            }
          }
        }
      },
    });
    expect(result.outcome).not.toBeNull();
  });

  it("buildGanoveView exposes the ganove-side truth", () => {
    const result = runAiGame(teststadt, 2, {
      observe: (state) => {
        const view = buildGanoveView(state);
        expect(view.ganovePosition).toBe(state.ganovePosition);
        expect(view.mission).toBe(state.mission);
      },
    });
    expect(result.outcome).not.toBeNull();
  });
});

describe("runAiBatch + summarizeBatch", () => {
  it("runs N games on different seeds to regular endings", () => {
    const results = runAiBatch(luebeck, [1, 2, 3, 4, 5]);
    expect(results).toHaveLength(5);
    for (const r of results) {
      expect(["caught", "surrounded", "escaped", "timeout", "draw"]).toContain(r.outcome);
      expect(r.log.some((e) => e.type === "result")).toBe(true);
    }
  });

  it("aggregates outcome distribution and metrics", () => {
    const results = runAiBatch(teststadt, [1, 2, 3]);
    const summary = summarizeBatch(results);
    expect(summary.games).toBe(3);
    const total = Object.values(summary.outcomes).reduce((a, b) => a + b, 0);
    expect(total).toBe(3);
    expect(summary.avgRounds).toBeGreaterThan(0);
    expect(summary.minRounds).toBeLessThanOrEqual(summary.maxRounds);
  });

  it("detectives exert measurable pressure and the ganove can win", () => {
    // teststadt is tiny — the detectives catch fast and reliably.
    const detResults = runAiBatch(
      teststadt,
      Array.from({ length: 10 }, (_, i) => i + 1),
    );
    const detWins = detResults.filter((r) =>
      ["caught", "surrounded", "timeout"].includes(r.outcome),
    ).length;
    expect(detWins).toBeGreaterThan(0);
    // luebeck without generated missions: the ganove escapes a
    // relevant share of the batch.
    const ganResults = runAiBatch(
      luebeck,
      Array.from({ length: 10 }, (_, i) => i + 1),
    );
    expect(ganResults.filter((r) => r.outcome === "escaped").length).toBeGreaterThan(0);
  });
});
