/**
 * Data integrity checks for the bundled mission sets ("Fälle") under
 * `src/data/missions/` — the mission-set counterpart of `mapData.test.ts`.
 * Every shipped case must be internally valid (schema/categories, done
 * by `loadMissionSet`) AND conform to the generation criteria for every
 * legal ganove spawn, so a chosen case can never reject a start.
 */
import { describe, expect, it } from "vitest";
import { bfsDistances, buildGraph } from "./Graph";
import { loadMap } from "./MapLoader";
import { listMapIds } from "./MapLoader";
import { hasMissionSet, listMissionSetIds, loadMissionSet } from "./MissionLoader";
import { caseTargets, missionCriteriaViolations, missionTargetIds } from "./MissionSystem";

for (const mapId of listMapIds()) {
  if (!hasMissionSet(mapId)) {
    continue;
  }
  describe(`mission set: ${mapId}`, () => {
    const map = loadMap(mapId);
    const graph = buildGraph(map);
    const set = loadMissionSet(map);

    it("ships at least two named cases", () => {
      expect(set.cases.length).toBeGreaterThanOrEqual(2);
      for (const entry of set.cases) {
        expect(entry.name.trim().length).toBeGreaterThan(0);
        expect(entry.story.trim().length).toBeGreaterThan(0);
      }
    });

    it("every case satisfies all BFS criteria for every possible ganove start", () => {
      // A case must stay valid wherever the ganove may spawn — the
      // strictest reading is "every node as start".
      for (const entry of set.cases) {
        const targets = caseTargets(entry);
        for (const node of map.nodes) {
          expect(
            missionCriteriaViolations(graph, map.settings.missionRules, targets, node.id),
            `case ${entry.id} from start ${node.id}`,
          ).toEqual([]);
        }
      }
    });

    it("every case uses distinct, reachable target nodes", () => {
      for (const entry of set.cases) {
        const ids = missionTargetIds(caseTargets(entry));
        expect(new Set(ids).size).toBe(ids.length);
        const reach = bfsDistances(graph, ids[0]);
        for (const id of ids) {
          expect(reach.has(id), `${entry.id}: ${id} unreachable`).toBe(true);
        }
      }
    });
  });
}

describe("mission set coverage", () => {
  it("muenster ships cases", () => {
    expect(listMissionSetIds()).toContain("muenster");
  });
});
