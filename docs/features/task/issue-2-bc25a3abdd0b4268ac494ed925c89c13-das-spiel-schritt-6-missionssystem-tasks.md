# Tasks: Missionssystem (Schritt 6)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `src/logic/MissionSystem.ts`: Typen `MissionKind`, `MissionTargets`, `MissionStage`, `MissionCase`, `MissionSet`, Fehler `MissionGenerationError`/`MissionValidationError`, Konstanten | Offen | — |
| 2 | Logik | `MissionSystem.ts`: `missionCriteriaViolations` (minGap, maxGap, routeBudget(+3), routeBudgetSabotage, Flucht-Abstände ≥4/≥3, sabotageDetour) | Offen | — |
| 3 | Logik | `MissionSystem.ts`: `generateMission` (Rejection-Sampling, leerer Sabotage-Pool → `null`, `MissionGenerationError`) | Offen | — |
| 4 | Logik | `MissionSystem.ts`: `validateCustomTargets`, `validateMissionSet`, `missionTargetIds`, `missionStructure`, `executableMissionAction`, `drawSabotageEffect`, `sabotageDuration` | Offen | — |
| 5 | Logik | `src/logic/MissionLoader.ts`: `loadMissionSet`, `listMissionSetIds`, `getMissionCase` | Offen | — |
| 6 | Daten | `src/data/missions/muenster.json`: ≥2 benannte Fälle mit Story, für alle Spawns gültig | Offen | — |
| 7 | Logik | `Movement.ts`: `MoveRejection` um `mission_choice_pending`, `no_mission_choice` | Offen | — |
| 8 | State | `gameStore.ts`: `Mission`-Interface (targets/stage/pendingChoice/appliedEffect), `MissionOption`-Union, Felder `hintSilenceUntilRound`/`falseTrailUntilRound` | Offen | — |
| 9 | State | `gameStore.ts` `startGame`: `resolveMission` (auto/random/none/case/custom), `escapeNodeIds` missionsgebunden, `cameraProtectedNodes` ∪ Missionsziele | Offen | — |
| 10 | State | `gameStore.ts` `ganoveAction`: Aktionsableitung, `aktion`-Spur-Event, Stufenfortschritt, Effektziehung beim Kontakt, Effektanwendung bei Sabotage | Offen | — |
| 11 | State | `gameStore.ts`: `chooseMissionPath`, `getMissionAction`, `moveGanove` (pendingChoice-Guard + Flucht-Gating), `checkGanoveSurrounded` mit `executableMissionAction` | Offen | — |
| 12 | State | `gameStore.ts` `runEventRoll`: `hintSilenceUntilRound` unterdrückt hinweis/sichtbarkeit, `falseTrailUntilRound` verfälscht hinweis-Zone | Offen | — |
| 13 | Tests | `src/logic/MissionSystem.test.ts` | Offen | — |
| 14 | Tests | `src/logic/MissionLoader.test.ts` | Offen | — |
| 15 | Tests | `src/logic/missionData.test.ts` (Fälle-Integrität) | Offen | — |
| 16 | Tests | `src/state/gameStore.mission.test.ts` | Offen | — |
| 17 | Tests | `gameStore.rounds.test.ts`/`gameStore.endings.test.ts`/`gameStore.test.ts` anpassen | Offen | — |
| 18 | QS | `npm run build && npm test && npm run coverage && npm run lint` grün | Offen | — |
