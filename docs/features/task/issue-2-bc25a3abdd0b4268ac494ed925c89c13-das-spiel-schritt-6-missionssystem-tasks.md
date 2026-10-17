# Tasks: Missionssystem (Schritt 6)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `src/logic/MissionSystem.ts`: Typen `MissionKind`, `MissionTargets`, `MissionStage`, `MissionCase`, `MissionSet`, Fehler `MissionGenerationError`/`MissionValidationError`, Konstanten | Erledigt | `MissionSystem.test.ts` (alle Suites nutzen die Typen) |
| 2 | Logik | `MissionSystem.ts`: `missionCriteriaViolations` (minGap, maxGap, routeBudget(+3), routeBudgetSabotage, Flucht-Abstände ≥4/≥3, sabotageDetour) | Erledigt | `missionCriteriaViolations`-Suite in `MissionSystem.test.ts` |
| 3 | Logik | `MissionSystem.ts`: `generateMission` (Rejection-Sampling, leerer Sabotage-Pool → `null`, `MissionGenerationError`) | Erledigt | `generateMission`-Suite (Seed-Schleifen muenster/luebeck/teststadt) |
| 4 | Logik | `MissionSystem.ts`: `validateCustomTargets`, `validateMissionSet`, `missionTargetIds`, `missionStructure`, `executableMissionAction`, `drawSabotageEffect`, `sabotageDuration` | Erledigt | jeweilige Suites in `MissionSystem.test.ts` |
| 5 | Logik | `src/logic/MissionLoader.ts`: `loadMissionSet`, `listMissionSetIds`, `getMissionCase` | Erledigt | `MissionLoader.test.ts` (5 Tests) |
| 6 | Daten | `src/data/missions/muenster.json`: ≥2 benannte Fälle mit Story, für alle Spawns gültig | Erledigt | `missionData.test.ts` (Kriterien für jeden Knoten als Start) |
| 7 | Logik | `Movement.ts`: `MoveRejection` um `mission_choice_pending`, `no_mission_choice` | Erledigt | `gameStore.mission.test.ts` (pending-Blockade, `no_mission_choice`) |
| 8 | State | `gameStore.ts`: `Mission`-Interface, `MissionOption`-Union, Felder `hintSilenceUntilRound`/`falseTrailUntilRound` | Erledigt | `gameStore.test.ts` Initial-State, `gameStore.mission.test.ts` |
| 9 | State | `gameStore.ts` `startGame`: `resolveMission` (auto/random/none/case/custom), `escapeNodeIds` missionsgebunden, `cameraProtectedNodes` ∪ Missionsziele | Erledigt | `startGame mission resolution`-Suite |
| 10 | State | `gameStore.ts` `ganoveAction`: Aktionsableitung, `aktion`-Spur-Event, Stufenfortschritt, Effektziehung beim Kontakt, Effektanwendung bei Sabotage | Erledigt | `mission order and action rounds`-, `sabotage effects`-Suites |
| 11 | State | `gameStore.ts`: `chooseMissionPath`, `getMissionAction`, `moveGanove` (pendingChoice-Guard + Flucht-Gating), `checkGanoveSurrounded` mit `executableMissionAction` | Erledigt | `binary choice`-, `surrounded`-Suites |
| 12 | State | `gameStore.ts` `runEventRoll`: Stille-/Falschspur-Fenster | Erledigt | `funkstille`-, `falsche_spur`-Tests in `gameStore.mission.test.ts` |
| 13 | Tests | `src/logic/MissionSystem.test.ts` | Erledigt | 33 Tests grün |
| 14 | Tests | `src/logic/MissionLoader.test.ts` | Erledigt | 5 Tests grün |
| 15 | Tests | `src/logic/missionData.test.ts` (Fälle-Integrität) | Erledigt | 4 Tests grün |
| 16 | Tests | `src/state/gameStore.mission.test.ts` | Erledigt | 21 Tests grün |
| 17 | Tests | `gameStore.rounds.test.ts`/`gameStore.endings.test.ts`/`gameStore.test.ts` angepasst | Erledigt | alle 3 Dateien grün |
| 18 | QS | `npm run build && npm test && npm run coverage && npm run lint` grün | Erledigt | Build ✓, 272 Tests ✓, Coverage 93,73 % Lines, Lint ✓ |
