/**
 * Aggregated statistics over the retained logs (spec section 8.1):
 * win rate per side and per played mode, average game length, hints
 * per game and camera hits — asserted exactly over known fixtures.
 */
import { describe, expect, it } from "vitest";
import { aggregateStatistics, logStats } from "./Statistics";
import { serializeLog } from "./Recorder";
import type { LogEntry } from "../state/gameStore";

function header(gameId: string, playerMode?: "ganove" | "detektiv"): LogEntry {
  return {
    seq: 0,
    round: 0,
    type: "header",
    gameId,
    mapId: "teststadt",
    seed: 1,
    config: playerMode === undefined ? {} : { playerMode },
    mission: null,
    cameras: [],
    starts: { detectives: ["a"], ganove: "z" },
  };
}

function result(
  outcome: string,
  rounds: number,
  hintsTotal: number,
  camerasTriggered: number,
): LogEntry {
  return {
    seq: 99,
    round: rounds,
    type: "result",
    outcome,
    rounds,
    hintsTotal,
    camerasTriggered,
    visibleTo: "both",
  };
}

const FIXTURES = [
  // ganove played, escaped, 10 rounds, 4 hints, 2 camera hits
  serializeLog([header("g-1", "ganove"), result("escaped", 10, 4, 2)]),
  // detektiv played, caught, 6 rounds, 2 hints, 0 hits
  serializeLog([header("g-2", "detektiv"), result("caught", 6, 2, 0)]),
  // AI game (no playerMode), draw, 5 rounds
  serializeLog([header("g-3"), result("draw", 5, 0, 0)]),
  // unfinished game — no result line, contributes nothing
  serializeLog([header("g-4", "ganove")]),
  // damaged content
  "not json{{{",
];

describe("logStats", () => {
  it("reads mode, outcome and metrics from header + result", () => {
    expect(logStats(FIXTURES[0])).toEqual({
      mode: "ganove",
      outcome: "escaped",
      rounds: 10,
      hintsTotal: 4,
      camerasTriggered: 2,
    });
  });

  it("returns null for unfinished, damaged or header-less logs", () => {
    expect(logStats(FIXTURES[3])).toBeNull();
    expect(logStats(FIXTURES[4])).toBeNull();
    expect(logStats(serializeLog([result("caught", 3, 0, 0)]))).toBeNull();
  });

  it("treats a missing or unknown playerMode as 'unbekannt'", () => {
    expect(logStats(FIXTURES[2])?.mode).toBe("unbekannt");
    const stray = serializeLog([
      { ...header("g-x"), config: { playerMode: "ki" } },
      result("escaped", 4, 1, 1),
    ]);
    expect(logStats(stray)?.mode).toBe("unbekannt");
  });
});

describe("aggregateStatistics", () => {
  it("aggregates exact totals over the fixtures", () => {
    const stats = aggregateStatistics(FIXTURES);
    expect(stats.total.games).toBe(3);
    expect(stats.total.ganoveWins).toBe(1);
    expect(stats.total.detectiveWins).toBe(1);
    expect(stats.total.draws).toBe(1);
    expect(stats.total.winRateGanove).toBeCloseTo(1 / 3);
    expect(stats.total.winRateDetectives).toBeCloseTo(1 / 3);
    expect(stats.total.avgRounds).toBeCloseTo(21 / 3);
    expect(stats.total.avgHints).toBeCloseTo(6 / 3);
    expect(stats.total.avgCameras).toBeCloseTo(2 / 3);
  });

  it("splits the same metrics per played mode", () => {
    const stats = aggregateStatistics(FIXTURES);
    const ganove = stats.byMode.ganove;
    expect(ganove.games).toBe(1);
    expect(ganove.winRateGanove).toBe(1);
    expect(ganove.winRateDetectives).toBe(0);
    expect(ganove.avgRounds).toBe(10);
    expect(ganove.avgHints).toBe(4);
    expect(ganove.avgCameras).toBe(2);

    const detektiv = stats.byMode.detektiv;
    expect(detektiv.games).toBe(1);
    expect(detektiv.winRateGanove).toBe(0);
    expect(detektiv.winRateDetectives).toBe(1);
    expect(detektiv.draws).toBe(0);

    const unbekannt = stats.byMode.unbekannt;
    expect(unbekannt.games).toBe(1);
    expect(unbekannt.draws).toBe(1);
    expect(unbekannt.winRateGanove).toBe(0);
  });

  it("returns null rates/averages for empty groups", () => {
    const stats = aggregateStatistics([]);
    expect(stats.total.games).toBe(0);
    expect(stats.total.winRateGanove).toBeNull();
    expect(stats.total.avgRounds).toBeNull();
    expect(stats.byMode.ganove.games).toBe(0);
    expect(stats.byMode.detektiv.winRateDetectives).toBeNull();
  });
});
