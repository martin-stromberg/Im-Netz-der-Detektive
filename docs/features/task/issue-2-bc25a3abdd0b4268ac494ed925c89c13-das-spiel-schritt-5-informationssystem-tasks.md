# Tasks: Informationssystem (Schritt 5)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `mixSeed(seed, round)` in `src/logic/rng.ts` | Offen | — |
| 2 | Logik | `src/logic/CameraSystem.ts`: `placeCameras` (RNG + `cameraMinGap`-BFS + Ausschlussliste) | Offen | — |
| 3 | Logik | `CameraSystem.ts`: `triggeredCamera`, `deactivatedCameras` | Offen | — |
| 4 | Logik | `src/logic/EreignisEngine.ts`: `rollTrigger` (cycle/chance/tension inkl. Spannungsreset) | Offen | — |
| 5 | Logik | `EreignisEngine.ts`: `drawEventType` (gewichteter `eventMix`-Zug) | Offen | — |
| 6 | Logik | `EreignisEngine.ts`: `zoneHint` (Zone + BFS-Ball `hintZoneRadius`) | Offen | — |
| 7 | Logik | `EreignisEngine.ts`: `pickBlockableEdge` mit Konnektivitäts-/Isolations-Check | Offen | — |
| 8 | Logik | `src/logic/InformationSystem.ts`: Typen `GameEvent`, `GameEventKind`, `Camera`, `RadioHint`, `HeatLevel`, `HINT_EVENT_KINDS`, `HEAT_WEIGHTS` | Offen | — |
| 9 | Logik | `InformationSystem.ts`: `visibleEvents`, `visibleCameras` (Asymmetrie-Sichten) | Offen | — |
| 10 | Logik | `InformationSystem.ts`: `radioHintSummary` (letzte N Hinweise inkl. Kamera) | Offen | — |
| 11 | Logik | `InformationSystem.ts`: `heatLevel` (Gewichtung + 3-Runden-Fenster + 4 Stufen), `revealedGanovePosition` (1-Runden-Verfall) | Offen | — |
| 12 | State | `gameStore.ts`: `GameEvent` erweitern (`visibleTo: "ganove"`, `edge`, `untilRound`, `nodeIds`, `details`), `kind` → `GameEventKind` | Offen | — |
| 13 | State | `gameStore.ts`: neue Felder `radioUsed`, `radioHintCount`, `edgeBlockRounds`; `StartGameOptions` + `GameConfigError`-Validierung für `cameraCount`, `cameraProtectedNodes`, `radioHintCount`, `edgeBlockRounds` | Offen | — |
| 14 | State | `gameStore.ts`: `startGame` — RNG-Strom weiterreichen + `placeCameras` + Header-Log `cameras` | Offen | — |
| 15 | State | `gameStore.ts`: `moveGanove` — Kameraprüfung + `runEventRoll` vor Phasenwechsel; `ganoveAction` — `runEventRoll` | Offen | — |
| 16 | State | `gameStore.ts`: Actions `useRadio`, `deactivateCameras`, `getHeatLevel`; `MoveRejection` um `already_used` | Offen | — |
| 17 | Tests | `src/logic/CameraSystem.test.ts` | Offen | — |
| 18 | Tests | `src/logic/EreignisEngine.test.ts` | Offen | — |
| 19 | Tests | `src/logic/InformationSystem.test.ts` | Offen | — |
| 20 | Tests | `src/state/gameStore.info.test.ts` (Integration inkl. Asymmetrie-Nachweis) | Offen | — |
| 21 | Tests | `gameStore.test.ts` Initial-State-Assertions ergänzen | Offen | — |
| 22 | QS | `npm run build && npm test && npm run coverage && npm run lint` grün | Offen | — |
