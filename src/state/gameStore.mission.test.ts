import { beforeEach, describe, expect, it } from "vitest";
import { loadMap } from "../logic/MapLoader";
import type { MapPack } from "../logic/mapPack";
import { MissionGenerationError, missionTargetIds } from "../logic/MissionSystem";
import { MissionValidationError } from "../logic/MissionSystem";
import { MoveError } from "../logic/Movement";
import { GameConfigError, useGameStore } from "./gameStore";

const muenster = loadMap("muenster");
const teststadt = loadMap("teststadt");

function reset() {
  useGameStore.getState().resetGame();
}

function store() {
  return useGameStore.getState();
}

function reasonOf(fn: () => void): string {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(MoveError);
    return (error as MoveError).reason;
  }
  throw new Error("expected MoveError");
}

/**
 * Controlled mission map:
 *   p - s - d - m1 - k - m2 - x        (x = sabotage dead end)
 *                   \- m3 - m4 - m5 - f
 * Targets d/k/x/f satisfy every criterion of its missionRules
 * (pairwise >= 2, consecutive <= 8, k-f = 4, d-f = 6, detour exactly 4,
 * routes 10/14 within 12/15). `chance: 1` + `hinweis`-only eventMix
 * makes every ganove round emit a zone hint — ideal for sabotage tests.
 */
const missionMap: MapPack = {
  id: "missionmap",
  name: "Mission Test",
  viewBox: "0 0 12 2",
  nodes: [
    { id: "p", name: "P", x: 0, y: 0, categories: ["kontakt"], zone: "west" },
    { id: "s", name: "S", x: 1, y: 0, categories: ["kontakt"], zone: "west" },
    { id: "d", name: "D", x: 2, y: 0, categories: ["diebstahl"], zone: "west" },
    { id: "m1", name: "M1", x: 3, y: 0, categories: ["kontakt"], zone: "mid" },
    { id: "k", name: "K", x: 4, y: 0, categories: ["kontakt"], zone: "mid" },
    { id: "m2", name: "M2", x: 5, y: 0, categories: ["kontakt"], zone: "mid" },
    { id: "x", name: "X", x: 6, y: 0, categories: ["sabotage"], zone: "mid" },
    { id: "m3", name: "M3", x: 5, y: 1, categories: ["kontakt"], zone: "east" },
    { id: "m4", name: "M4", x: 6, y: 1, categories: ["kontakt"], zone: "east" },
    { id: "m5", name: "M5", x: 7, y: 1, categories: ["kontakt"], zone: "east" },
    { id: "f", name: "F", x: 8, y: 1, categories: ["flucht"], zone: "east" },
  ],
  edges: [
    { a: "p", b: "s", type: "weg" },
    { a: "s", b: "d", type: "weg" },
    { a: "d", b: "m1", type: "weg" },
    { a: "m1", b: "k", type: "weg" },
    { a: "k", b: "m2", type: "weg" },
    { a: "m2", b: "x", type: "weg" },
    { a: "k", b: "m3", type: "weg" },
    { a: "m3", b: "m4", type: "weg" },
    { a: "m4", b: "m5", type: "weg" },
    { a: "m5", b: "f", type: "weg" },
  ],
  spawnRules: {
    detectives: { mode: "choice", nodes: ["p"] },
    ganove: { mode: "choice", nodes: ["s"] },
    order: "detektive_first",
  },
  settings: {
    detectiveCount: { suggested: 1, min: 1, max: 4 },
    cameraCount: { suggested: 1, min: 0, max: 4 },
    roundLimit: { suggested: 60, min: 1, unlimited: true },
    radioHintCount: { suggested: 3, min: 1, max: 5 },
    edgeBlockRounds: { suggested: 3, min: 1, max: 6 },
    cameraMinGap: 2,
    hintZoneRadius: 1,
    eventMode: "chance",
    eventDefaults: { cycle: 2, chance: 1.0, threshold: 10, perRound: 10 },
    eventMix: { sichtbarkeit: 0, hinweis: 1, umwelt: 0 },
    missionRules: {
      minGap: 2,
      maxGap: 8,
      routeBudget: 12,
      routeBudgetSabotage: 15,
      sabotageDetour: 4,
    },
    sabotageEffects: ["kamera_aus", "funkstille", "falsche_spur"],
  },
};

function effectMap(effect: "kamera_aus" | "funkstille" | "falsche_spur"): MapPack {
  return {
    ...missionMap,
    id: `missionmap-${effect}`,
    settings: { ...missionMap.settings, sabotageEffects: [effect] },
  };
}

/** Starts the missionMap script: detective on p, ganove on s. */
function startMissionMap(map: MapPack = missionMap, seed = 1) {
  store().startGame(map, seed, {
    detectivePositions: ["p"],
    ganovePosition: "s",
    roundLimit: 60,
  });
}

/** Detective oscillates p <-> s, never touching the mission route. */
function detStep() {
  const pos = store().detektivePositions[0];
  store().moveDetective(pos === "p" ? "s" : "p");
}

/** Full ganove turn: move (or act), then the detective's oscillation. */
function ganoveMove(target: string) {
  store().moveGanove(target);
  if (store().outcome === null) {
    detStep();
  }
}

function ganoveAct() {
  store().ganoveAction();
  if (store().outcome === null) {
    detStep();
  }
}

/** Script to the pending sabotage offer: d action, k action. */
function playToOffer() {
  ganoveMove("d"); // R1
  ganoveAct(); // R2: diebstahl -> kontakt
  ganoveMove("m1"); // R3
  ganoveMove("k"); // R4
  ganoveAct(); // R5: kontakt -> wahl (pendingChoice)
}

describe("startGame mission resolution", () => {
  beforeEach(reset);

  it("generates a mission on teststadt and binds the escape node to it", () => {
    store().startGame(teststadt, 1, {
      detectivePositions: ["i"],
      ganovePosition: "d",
    });
    const s = store();
    expect(s.mission).not.toBeNull();
    expect(s.mission!.id).toBe("random");
    expect(s.mission!.stage).toBe("diebstahl");
    expect(s.mission!.targets).toEqual({
      diebstahl: "a",
      kontakt: "j",
      sabotage: null,
      flucht: "d",
    });
    expect(s.escapeNodeIds).toEqual(["d"]);
  });

  it("produces the same mission for the same seed (muenster)", () => {
    store().startGame(muenster, 99);
    const first = { ...store().mission!.targets };
    reset();
    store().startGame(muenster, 99);
    expect(store().mission!.targets).toEqual(first);
  });

  it("keeps mission targets camera-free on generated missions (muenster)", () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      reset();
      store().startGame(muenster, seed);
      const s = store();
      expect(s.mission).not.toBeNull();
      const protectedTargets = new Set(missionTargetIds(s.mission!.targets));
      for (const camera of s.cameras) {
        expect(protectedTargets.has(camera.nodeId)).toBe(false);
      }
      expect(s.escapeNodeIds).toEqual([s.mission!.targets.flucht]);
    }
  });

  it("plays without a mission when the option is 'none'", () => {
    startMissionMap(missionMap);
    store().resetGame();
    store().startGame(teststadt, 1, {
      detectivePositions: ["i"],
      ganovePosition: "d",
      mission: "none",
    });
    expect(store().mission).toBeNull();
    expect(store().escapeNodeIds).toEqual(["b", "d", "g"]);
  });

  it("throws MissionGenerationError for 'random' on a pool-less map", () => {
    const poolless: MapPack = {
      ...missionMap,
      id: "poolless",
      nodes: missionMap.nodes.map((node) => ({ ...node, categories: ["kontakt"] })),
    };
    expect(() =>
      store().startGame(poolless, 1, {
        detectivePositions: ["p"],
        ganovePosition: "s",
        mission: "random",
      }),
    ).toThrow(MissionGenerationError);
    // "auto" falls back to no mission instead of failing.
    store().startGame(poolless, 1, {
      detectivePositions: ["p"],
      ganovePosition: "s",
      mission: "auto",
    });
    expect(store().mission).toBeNull();
  });

  it("rejects an unknown mission option", () => {
    expect(() =>
      store().startGame(missionMap, 1, {
        detectivePositions: ["p"],
        ganovePosition: "s",
        mission: "bogus" as never,
      }),
    ).toThrow(GameConfigError);
  });

  it("starts a predefined case with name and story", () => {
    store().startGame(muenster, 1, {
      mission: { type: "case", id: "diebstahlserie-altstadt" },
    });
    const mission = store().mission!;
    expect(mission.id).toBe("diebstahlserie-altstadt");
    expect(mission.name).toContain("Altstadt");
    expect(mission.story).toBeTruthy();
    expect(mission.targets).toEqual({
      diebstahl: "schloss",
      kontakt: "wienburgpark",
      sabotage: "stadtwerke",
      flucht: "hafenpier",
    });
    expect(mission.targets.sabotageEffect).toBeUndefined();
    expect(store().escapeNodeIds).toEqual(["hafenpier"]);
  });

  it("rejects an unknown case id", () => {
    expect(() =>
      store().startGame(muenster, 1, {
        mission: { type: "case", id: "unbekannt" },
      }),
    ).toThrow(MissionValidationError);
  });

  it("accepts a valid custom mission and rejects invalid ones", () => {
    store().startGame(missionMap, 1, {
      detectivePositions: ["p"],
      ganovePosition: "s",
      mission: {
        type: "custom",
        targets: { diebstahl: "d", kontakt: "k", flucht: "f", sabotage: "x" },
      },
    });
    expect(store().mission!.id).toBe("custom");

    reset();
    expect(() =>
      store().startGame(missionMap, 1, {
        detectivePositions: ["p"],
        ganovePosition: "s",
        mission: {
          type: "custom",
          targets: { diebstahl: "k", kontakt: "k", flucht: "f" }, // k is no diebstahl
        },
      }),
    ).toThrow(GameConfigError);
  });
});

describe("mission order and action rounds", () => {
  beforeEach(reset);

  it("refuses the action away from the current target node", () => {
    startMissionMap();
    expect(store().getMissionAction()).toBeNull();
    expect(reasonOf(() => store().ganoveAction())).toBe("no_action_available");
    // On the kontakt node while diebstahl is still open: no action.
    ganoveMove("d");
    ganoveMove("m1");
    ganoveMove("k");
    expect(store().getMissionAction()).toBeNull();
    expect(reasonOf(() => store().ganoveAction())).toBe("no_action_available");
  });

  it("executes actions in fixed order and emits the trace hint before detectives move", () => {
    startMissionMap();
    ganoveMove("d"); // R1
    expect(store().getMissionAction()).toBe("diebstahl");
    const round = store().round;
    store().ganoveAction();

    const s = store();
    // The ganove stays put and the phase opened for the detectives.
    expect(s.ganovePosition).toBe("d");
    expect(s.phase).toBe("detektive");
    expect(s.mission!.stage).toBe("kontakt");
    const trace = s.events.find((event) => event.kind === "aktion");
    expect(trace).toMatchObject({
      round,
      nodeId: "d",
      visibleTo: "detectives",
      details: { action: "diebstahl" },
    });
    // The trace counts in the heat indicator (weight +2).
    expect(s.getHeatLevel().score).toBeGreaterThanOrEqual(2);
    // The detective may catch him right after the action — full
    // vulnerability: he never left the node.
    store().moveDetective("d"); // s -> d: catch!
    expect(store().outcome).toBe("caught");
  });

  it("does not escape when reaching the mission flucht node early", () => {
    startMissionMap();
    // Walk the whole route without a single action.
    for (const node of ["d", "m1", "k", "m3", "m4", "m5", "f"]) {
      ganoveMove(node);
    }
    const s = store();
    expect(s.ganovePosition).toBe("f");
    expect(s.mission!.stage).toBe("diebstahl");
    expect(s.outcome).toBeNull(); // no escape — the mission is not at "flucht"
  });

  it("plays a full mission without sabotage pool on teststadt to the escape", () => {
    store().startGame(teststadt, 1, {
      detectivePositions: ["i"],
      ganovePosition: "d",
    });
    // Mission: diebstahl a, kontakt j, flucht d (no sabotage offer).
    store().moveGanove("c");
    store().moveDetective("h");
    store().moveGanove("b");
    store().moveDetective("i");
    store().moveGanove("a");
    store().moveDetective("h");
    store().ganoveAction(); // diebstahl at a -> kontakt
    store().moveDetective("i");
    store().moveGanove("b");
    store().moveDetective("h");
    store().moveGanove("e");
    store().moveDetective("i");
    store().moveGanove("j");
    store().moveDetective("h");
    store().ganoveAction(); // kontakt at j -> direct flucht (sabotage pool empty)
    expect(store().mission!.stage).toBe("flucht");
    expect(store().mission!.pendingChoice).toBeNull();
    store().moveDetective("i");
    store().moveGanove("e");
    store().moveDetective("h");
    store().moveGanove("f");
    store().moveDetective("i");
    store().moveGanove("g");
    store().moveDetective("h");
    store().moveGanove("d"); // mission escape node
    const s = store();
    expect(s.outcome).toBe("escaped");
    expect(s.log.at(-1)).toMatchObject({
      type: "result",
      outcome: "escaped",
      rounds: 12,
      hintsTotal: expect.any(Number),
      camerasTriggered: expect.any(Number),
      visibleTo: "both",
    });
  });
});

describe("binary choice and sabotage", () => {
  beforeEach(reset);

  it("offers a sabotage target with a drawn effect after the kontakt action", () => {
    startMissionMap();
    playToOffer();
    const mission = store().mission!;
    expect(mission.stage).toBe("wahl");
    expect(mission.pendingChoice).not.toBeNull();
    expect(mission.pendingChoice!.sabotageNode).toBe("x");
    expect(missionMap.settings.sabotageEffects).toContain(mission.pendingChoice!.effect);
    expect(mission.offeredEffect).toBe(mission.pendingChoice!.effect);
  });

  it("blocks ganove moves and actions while the offer is pending", () => {
    startMissionMap();
    playToOffer();
    // detStep completed the round: the ganove phase of round 6 runs
    // with the unresolved offer — both move and action are blocked.
    expect(store().phase).toBe("ganove");
    expect(reasonOf(() => store().moveGanove("m2"))).toBe("mission_choice_pending");
    expect(reasonOf(() => store().ganoveAction())).toBe("mission_choice_pending");
  });

  it("does not leak the choice through the kontakt trace event", () => {
    startMissionMap();
    playToOffer();
    const trace = store()
      .events.filter((event) => event.kind === "aktion")
      .at(-1)!;
    expect(trace.details).toEqual({ action: "kontakt" });
    store().chooseMissionPath("sabotage");
    // The trace stays identical after the choice — nothing was appended.
    const after = store()
      .events.filter((event) => event.kind === "aktion")
      .at(-1)!;
    expect(after.details).toEqual({ action: "kontakt" });
    expect(reasonOf(() => store().chooseMissionPath("flucht"))).toBe("no_mission_choice");
  });

  it("makes the binary choice final (flucht path escapes, sabotage node dead)", () => {
    startMissionMap();
    playToOffer();
    store().chooseMissionPath("flucht");
    expect(store().mission!.stage).toBe("flucht");
    expect(store().mission!.pendingChoice).toBeNull();
    // The sabotage node is no longer actionable — choice is final.
    ganoveMove("m2");
    ganoveMove("x");
    expect(store().getMissionAction()).toBeNull();
    expect(reasonOf(() => store().ganoveAction())).toBe("no_action_available");
    ganoveMove("m2");
    ganoveMove("k");
    for (const node of ["m3", "m4", "m5", "f"]) {
      ganoveMove(node);
    }
    expect(store().outcome).toBe("escaped");
  });
});

describe("sabotage effects", () => {
  beforeEach(reset);

  /** Drive to the sabotage node and execute the sabotage action. */
  function playToSabotageAction(map: MapPack) {
    startMissionMap(map);
    playToOffer();
    store().chooseMissionPath("sabotage");
    ganoveMove("m2"); // R6
    ganoveMove("x"); // R7
    const actionRound = store().round;
    expect(store().getMissionAction()).toBe("sabotage");
    store().ganoveAction();
    return actionRound;
  }

  it("kamera_aus deactivates every camera for the rest of the game", () => {
    const map = effectMap("kamera_aus");
    playToSabotageAction(map);
    const s = store();
    expect(s.mission!.appliedEffect).toBe("kamera_aus");
    expect(s.mission!.stage).toBe("flucht");
    expect(s.cameras.length).toBeGreaterThan(0);
    expect(s.cameras.every((camera) => !camera.active)).toBe(true);
    // No camera event can trigger anymore.
    const before = s.events.filter((event) => event.kind === "camera").length;
    detStep();
    for (const node of ["m2", "k", "m3", "m4", "m5", "f"]) {
      ganoveMove(node);
    }
    expect(store().events.filter((event) => event.kind === "camera")).toHaveLength(before);
    expect(store().outcome).toBe("escaped");
  });

  it("funkstille suppresses hint events for the sabotage duration", () => {
    const map = effectMap("funkstille");
    const actionRound = playToSabotageAction(map);
    const until = actionRound + missionMap.settings.eventDefaults.cycle;
    expect(store().hintSilenceUntilRound).toBe(until);
    detStep();
    const hintsBefore = store().events.filter((event) => event.kind === "hinweis").length;
    // Two silenced rounds (until covers actionRound+1..+2).
    ganoveMove("m2");
    ganoveMove("k");
    expect(store().events.filter((event) => event.kind === "hinweis").length).toBe(hintsBefore);
    // Window over — hints resume.
    ganoveMove("m3");
    const hints = store().events.filter((event) => event.kind === "hinweis");
    expect(hints.length).toBeGreaterThan(hintsBefore);
    expect(hints.at(-1)!.round).toBe(store().round - 1); // emitted during the move round
  });

  it("falsche_spur replaces zone hints with a wrong but consistent zone", () => {
    const map = effectMap("falsche_spur");
    const actionRound = playToSabotageAction(map);
    const until = actionRound + missionMap.settings.eventDefaults.cycle;
    expect(store().falseTrailUntilRound).toBe(until);
    detStep();
    // During the window the ganove is in zone "mid" (m2/k) — hints must lie.
    ganoveMove("m2"); // zone mid
    ganoveMove("k"); // zone mid
    const falsified = store().events.filter(
      (event) => event.kind === "hinweis" && event.round > actionRound && event.round <= until,
    );
    expect(falsified.length).toBe(2);
    for (const event of falsified) {
      expect(event.zone).not.toBe("mid");
      expect(["west", "east"]).toContain(event.zone);
      expect(event.nodeIds!.length).toBeGreaterThan(0);
    }
    // After the window: the true zone returns.
    ganoveMove("m3");
    expect(
      store()
        .events.filter((e) => e.kind === "hinweis")
        .at(-1)!.zone,
    ).toBe("east");
  });
});

describe("case-fixed sabotageEffect", () => {
  beforeEach(reset);

  it("offers and applies the case-fixed effect instead of the random draw", () => {
    // "kurier-am-hafen" fixes sabotageEffect "funkstille" — the offer
    // must show it for every seed (a random pool draw landing on
    // funkstille 5 times in a row has probability ~1/243).
    for (const seed of [1, 2, 3, 4, 5]) {
      reset();
      store().startGame(muenster, seed, {
        mission: { type: "case", id: "kurier-am-hafen" },
      });
      expect(store().mission!.targets.sabotageEffect).toBe("funkstille");
      // Jump the mission to the pending kontakt action.
      store().setMission({ ...store().mission!, stage: "kontakt" });
      useGameStore.setState({ ganovePosition: "schlosspark" });
      store().ganoveAction();
      const offered = store().mission!;
      expect(offered.stage).toBe("wahl");
      expect(offered.pendingChoice).toEqual({ sabotageNode: "rathaus", effect: "funkstille" });
      expect(offered.offeredEffect).toBe("funkstille");
    }
    // Continue the last game to the sabotage action — the fixed effect
    // is what gets applied.
    store().chooseMissionPath("sabotage");
    store().endDetectivePhase();
    useGameStore.setState({ ganovePosition: "rathaus" });
    const actionRound = store().round;
    store().ganoveAction();
    const s = store();
    expect(s.mission!.appliedEffect).toBe("funkstille");
    expect(s.mission!.stage).toBe("flucht");
    expect(s.hintSilenceUntilRound).toBe(actionRound + muenster.settings.eventDefaults.cycle);
  });

  it("draws the effect from the map's pool for a case without the field", () => {
    // "diebstahlserie-altstadt" fixes no effect — the seeded draw applies.
    for (const seed of [1, 2, 3]) {
      reset();
      store().startGame(muenster, seed, {
        mission: { type: "case", id: "diebstahlserie-altstadt" },
      });
      expect(store().mission!.targets.sabotageEffect).toBeUndefined();
      store().setMission({ ...store().mission!, stage: "kontakt" });
      useGameStore.setState({ ganovePosition: "wienburgpark" });
      store().ganoveAction();
      const offered = store().mission!;
      expect(offered.pendingChoice!.sabotageNode).toBe("stadtwerke");
      expect(muenster.settings.sabotageEffects).toContain(offered.pendingChoice!.effect);
      expect(offered.offeredEffect).toBe(offered.pendingChoice!.effect);
    }
  });
});

describe("surrounded with real action availability", () => {
  beforeEach(reset);

  it("does not count a ganove on the current target node as surrounded", () => {
    startMissionMap();
    ganoveMove("d"); // R1: ganove reaches the diebstahl node
    // Seal both exits of d for the rest of the game.
    store().blockEdge("d", "s", 99);
    store().blockEdge("d", "m1", 99);
    // R2 ganove phase: zero legal moves, but diebstahl is executable
    // at d -> the surrounded check must not fire.
    expect(store().outcome).toBeNull();
    expect(store().getMissionAction()).toBe("diebstahl");
    store().ganoveAction();
    store().moveDetective("p"); // s -> p
    // R3: still zero legal moves and now no executable action at d
    // (stage kontakt) -> genuinely surrounded.
    expect(store().outcome).toBe("surrounded");
  });
});
