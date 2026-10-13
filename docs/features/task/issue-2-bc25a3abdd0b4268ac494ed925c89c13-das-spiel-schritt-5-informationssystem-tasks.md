# Tasks: Informationssystem (Schritt 5)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `mixSeed(seed, round)` in `src/logic/rng.ts` | Erledigt | indirekt über alle Ereignis-Integrationstests (`gameStore.info.test.ts`) |
| 2 | Logik | `src/logic/CameraSystem.ts`: `placeCameras` (RNG + `cameraMinGap`-BFS + Ausschlussliste) | Erledigt | `placeCameras`-Suite in `CameraSystem.test.ts` |
| 3 | Logik | `CameraSystem.ts`: `triggeredCamera`, `deactivateAll` | Erledigt | `triggeredCamera`/`deactivateAll`-Suites |
| 4 | Logik | `src/logic/EreignisEngine.ts`: `rollTrigger` (cycle/chance/tension inkl. Spannungsreset) | Erledigt | `rollTrigger`-Suite in `EreignisEngine.test.ts` |
| 5 | Logik | `EreignisEngine.ts`: `drawEventType` (gewichteter `eventMix`-Zug) | Erledigt | `drawEventType`-Suite |
| 6 | Logik | `EreignisEngine.ts`: `zoneHint` (Zone + BFS-Ball `hintZoneRadius`) | Erledigt | `zoneHint`-Suite |
| 7 | Logik | `EreignisEngine.ts`: `pickBlockableEdge` mit Konnektivitäts-/Isolations-Check | Erledigt | `pickBlockableEdge`-Suite |
| 8 | Logik | `src/logic/InformationSystem.ts`: Typen `GameEvent`, `GameEventKind`, `Camera`, `RadioHint`, `HeatLevel`, `HINT_EVENT_KINDS`, `HEAT_WEIGHTS` | Erledigt | `InformationSystem.test.ts` (alle Suites nutzen die Typen) |
| 9 | Logik | `InformationSystem.ts`: `visibleEvents`, `visibleCameras` (Asymmetrie-Sichten) | Erledigt | `visibleEvents`/`visibleCameras`-Suites |
| 10 | Logik | `InformationSystem.ts`: `radioHintSummary` (letzte N Hinweise inkl. Kamera) | Erledigt | `radioHintSummary`-Suite |
| 11 | Logik | `InformationSystem.ts`: `heatLevel` (Gewichtung + 3-Runden-Fenster + 4 Stufen), `revealedGanovePosition` (1-Runden-Verfall) | Erledigt | `heatLevel`-, `revealedGanovePosition`-Suites |
| 12 | State | `gameStore.ts`: `GameEvent` erweitern (`visibleTo: "ganove"`, `edge`, `untilRound`, `nodeIds`, `details`), `kind` → `GameEventKind` | Erledigt | `gameStore.info.test.ts` (Asymmetrie, Eventfelder) |
| 13 | State | `gameStore.ts`: neue Felder `radioUsed`, `radioHintCount`, `edgeBlockRounds`; `StartGameOptions` + `GameConfigError`-Validierung | Erledigt | `honours the cameraCount override and validates the corridor`, Initial-State-Test |
| 14 | State | `gameStore.ts`: `startGame` — RNG-Strom weiterreichen + `placeCameras` + Header-Log `cameras` | Erledigt | `startGame camera placement`-Suite |
| 15 | State | `gameStore.ts`: `moveGanove` — Kameraprüfung + `runEventRoll` vor Phasenwechsel; `ganoveAction` — `runEventRoll` | Erledigt | `camera triggering`-, `event engine in the round timeline`-Suites |
| 16 | State | `gameStore.ts`: Actions `useRadio`, `deactivateCameras`, `getHeatLevel`; `MoveRejection` um `already_used` | Erledigt | `police radio`-, `heat indicator`-, `camera triggering`-Suites |
| 17 | Tests | `src/logic/CameraSystem.test.ts` | Erledigt | 8 Tests grün |
| 18 | Tests | `src/logic/EreignisEngine.test.ts` | Erledigt | 10 Tests grün |
| 19 | Tests | `src/logic/InformationSystem.test.ts` | Erledigt | 12 Tests grün |
| 20 | Tests | `src/state/gameStore.info.test.ts` (Integration inkl. Asymmetrie-Nachweis) | Erledigt | 15 Tests grün |
| 21 | Tests | `gameStore.test.ts` Initial-State-Assertions ergänzen | Erledigt | `starts with the documented initial state` |
| 22 | QS | `npm run build && npm test && npm run coverage && npm run lint` grün | Erledigt | Build ✓, 208 Tests ✓, Coverage 92,84 % Lines, Lint ✓ |
