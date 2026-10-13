import { describe, expect, it } from "vitest";
import {
  HINT_EVENT_KINDS,
  heatLevel,
  radioHintSummary,
  revealedGanovePosition,
  visibleCameras,
  visibleEvents,
  type GameEvent,
} from "./InformationSystem";

const events: GameEvent[] = [
  { kind: "camera", round: 2, nodeId: "f", visibleTo: "detectives" },
  { kind: "hinweis", round: 3, zone: "altstadt", nodeIds: ["a", "b"], visibleTo: "detectives" },
  { kind: "umwelt", round: 4, edge: { a: "a", b: "b" }, untilRound: 6, visibleTo: "both" },
  {
    kind: "sichtbarkeit",
    round: 5,
    nodeId: "g",
    visibleTo: "detectives",
  },
  { kind: "polizeifunk", round: 5, visibleTo: "ganove", details: { hints: [] } },
];

describe("visibleEvents — data-level asymmetry", () => {
  it("gives detectives every event including world blocks", () => {
    expect(visibleEvents(events, "detectives")).toHaveLength(4);
  });

  it("gives the ganove only ganove-visible and shared events — never hints", () => {
    const ganoveEvents = visibleEvents(events, "ganove");
    expect(ganoveEvents.map((event) => event.kind)).toEqual(["umwelt", "polizeifunk"]);
    for (const event of ganoveEvents) {
      expect(["ganove", "both"]).toContain(event.visibleTo);
      expect(HINT_EVENT_KINDS).not.toContain(event.kind);
    }
  });
});

describe("visibleCameras", () => {
  const cameras = [
    { nodeId: "a", active: true },
    { nodeId: "c", active: false },
  ];

  it("shows every camera to the detectives", () => {
    expect(visibleCameras(cameras, "detectives")).toEqual(cameras);
  });

  it("shows no camera at all to the ganove", () => {
    expect(visibleCameras(cameras, "ganove")).toEqual([]);
  });
});

describe("radioHintSummary", () => {
  it("returns the last N hints with kind and round, including camera hits", () => {
    const summary = radioHintSummary(events, 2);
    expect(summary).toEqual([
      { kind: "hinweis", round: 3, nodeId: undefined, zone: "altstadt" },
      { kind: "sichtbarkeit", round: 5, nodeId: "g", zone: undefined },
    ]);
    expect(radioHintSummary(events, 1)).toEqual([
      { kind: "sichtbarkeit", round: 5, nodeId: "g", zone: undefined },
    ]);
  });

  it("excludes umwelt and polizeifunk (no hints, no future events)", () => {
    const summary = radioHintSummary(events, 10);
    expect(summary.map((hint) => hint.kind)).toEqual(["camera", "hinweis", "sichtbarkeit"]);
  });

  it("returns all hints when fewer than N exist", () => {
    expect(radioHintSummary(events, 99)).toHaveLength(3);
  });
});

describe("revealedGanovePosition", () => {
  it("reveals the node only during the round the event fired", () => {
    expect(revealedGanovePosition(events, 5)).toBe("g");
    expect(revealedGanovePosition(events, 6)).toBeNull();
    expect(revealedGanovePosition(events, 4)).toBeNull();
  });
});

describe("heatLevel", () => {
  it("maps the weighted sum to the four levels", () => {
    expect(heatLevel([], 5)).toEqual({ level: "ruhig", score: 0 });
    expect(heatLevel([{ kind: "hinweis", round: 5, visibleTo: "detectives" }], 5)).toEqual({
      level: "aktiv",
      score: 1,
    });
    expect(heatLevel([{ kind: "camera", round: 5, visibleTo: "detectives" }], 5)).toEqual({
      level: "aktiv",
      score: 2,
    });
    expect(
      heatLevel(
        [
          { kind: "sichtbarkeit", round: 5, nodeId: "x", visibleTo: "detectives" },
          { kind: "hinweis", round: 5, zone: "y", visibleTo: "detectives" },
        ],
        5,
      ),
    ).toEqual({ level: "erhoeht", score: 4 });
    expect(
      heatLevel(
        [
          { kind: "sichtbarkeit", round: 5, nodeId: "x", visibleTo: "detectives" },
          { kind: "camera", round: 5, nodeId: "z", visibleTo: "detectives" },
        ],
        5,
      ),
    ).toEqual({ level: "kritisch", score: 5 });
  });

  it("counts only the last 3 rounds including the current one", () => {
    const camera = { kind: "camera", round: 5, nodeId: "f", visibleTo: "detectives" } as const;
    expect(heatLevel([camera], 7).score).toBe(2); // round 5 inside [5..7]
    expect(heatLevel([camera], 8).score).toBe(0); // round 5 outside [6..8]
  });

  it("already weighs action traces (+2) for the mission step", () => {
    expect(
      heatLevel([{ kind: "aktion", round: 4, nodeId: "c", visibleTo: "detectives" }], 4),
    ).toEqual({ level: "aktiv", score: 2 });
  });

  it("ignores umwelt and polizeifunk (no position information)", () => {
    expect(
      heatLevel(
        [
          { kind: "umwelt", round: 4, edge: { a: "a", b: "b" }, visibleTo: "both" },
          { kind: "polizeifunk", round: 4, visibleTo: "ganove" },
        ],
        4,
      ).score,
    ).toBe(0);
  });
});
