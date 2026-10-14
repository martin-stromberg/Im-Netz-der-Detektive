import { beforeEach, describe, expect, it } from "vitest";
import { loadMap } from "../logic/MapLoader";
import type { EventMode } from "../logic/mapPack";
import { GameConfigError, useGameStore } from "./gameStore";

const teststadt = loadMap("teststadt");

function start(options: Parameters<ReturnType<typeof useGameStore.getState>["startGame"]>[2] = {}) {
  useGameStore.getState().startGame(teststadt, 7, {
    detectivePositions: ["a"],
    ganovePosition: "g",
    mission: "none",
    cameraCount: 0,
    roundLimit: 20,
    ...options,
  });
}

beforeEach(() => {
  useGameStore.getState().resetGame();
});

describe("startGame — eventMode/eventDefaults", () => {
  it("applies the map's event settings by default", () => {
    start();
    const state = useGameStore.getState();
    expect(state.eventMode).toBe("tension");
    expect(state.eventDefaults).toEqual(teststadt.settings.eventDefaults);
  });

  it("applies an eventMode + cadence override and logs the effective values", () => {
    start({ eventMode: "cycle", eventDefaults: { cycle: 2 } });
    const state = useGameStore.getState();
    expect(state.eventMode).toBe("cycle");
    expect(state.eventDefaults.cycle).toBe(2);
    expect(state.eventDefaults.chance).toBe(teststadt.settings.eventDefaults.chance);
    const header = state.log.find((entry) => entry.type === "header");
    expect(header?.config).toMatchObject({
      eventMode: "cycle",
      eventDefaults: { cycle: 2, chance: teststadt.settings.eventDefaults.chance },
    });
  });

  it("rejects an unknown eventMode", () => {
    expect(() => start({ eventMode: "bogus" as EventMode })).toThrow(GameConfigError);
  });

  it("rejects an invalid cadence override", () => {
    expect(() => start({ eventDefaults: { cycle: 0 } })).toThrow(GameConfigError);
    expect(() => start({ eventDefaults: { cycle: 1.5 } })).toThrow(GameConfigError);
    expect(() => start({ eventDefaults: { chance: 0 } })).toThrow(GameConfigError);
    expect(() => start({ eventDefaults: { chance: 1.5 } })).toThrow(GameConfigError);
    expect(() => start({ eventDefaults: { threshold: -1 } })).toThrow(GameConfigError);
    expect(() => start({ eventDefaults: { perRound: 0 } })).toThrow(GameConfigError);
  });

  it("fires cycle events exactly every N rounds", () => {
    start({ eventMode: "cycle", eventDefaults: { cycle: 2 }, radioHintCount: 3 });
    const move = (nodeId: string) => {
      useGameStore.getState().moveGanove(nodeId);
      const dets = useGameStore.getState().getLegalDetectiveMoves();
      if (useGameStore.getState().outcome === null && dets.length > 0) {
        useGameStore.getState().moveDetective(dets[0].nodeId);
      }
    };
    // Route h→i→j avoids flucht nodes (b/d/g end the game without a mission).
    move("h");
    move("i");
    move("j");
    const eventRounds = useGameStore
      .getState()
      .events.map((event) => event.round)
      .filter((round) => round > 0);
    expect(eventRounds.length).toBeGreaterThan(0);
    for (const round of eventRounds) {
      expect(round % 2).toBe(0);
    }
  });
});

describe("startGame — mission-aware ganove spawn", () => {
  const tightMap = {
    ...teststadt,
    settings: {
      ...teststadt.settings,
      missionRules: { ...teststadt.settings.missionRules, routeBudget: 11 },
    },
  };
  const customTargets = { diebstahl: "a", kontakt: "j", flucht: "d" };

  it("draws only criteria-conforming spawns for a custom mission", () => {
    // Detectives on "j" + routeBudget 11: only spawn "a" satisfies the
    // mission criteria — the draw is forced, not just lucky.
    useGameStore.getState().startGame(tightMap, 7, {
      detectivePositions: ["j"],
      mission: { type: "custom", targets: customTargets },
    });
    expect(useGameStore.getState().ganovePosition).toBe("a");
  });

  it("throws SpawnError when no spawn satisfies the mission criteria", () => {
    expect(() =>
      useGameStore.getState().startGame(teststadt, 7, {
        detectivePositions: ["j"],
        mission: {
          type: "custom",
          targets: { diebstahl: "a", kontakt: "e", flucht: "b" },
        },
      }),
    ).toThrowError(/spawn/i);
  });

  it("keeps validating an explicit spawn against the mission criteria", () => {
    expect(() =>
      useGameStore.getState().startGame(tightMap, 7, {
        detectivePositions: ["j"],
        ganovePosition: "g",
        mission: { type: "custom", targets: customTargets },
      }),
    ).toThrow(GameConfigError);
  });
});
