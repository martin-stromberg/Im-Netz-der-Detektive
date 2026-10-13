# Tasks: Rundenablauf und Spielende (Schritt 4)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `src/logic/Movement.ts` anlegen (Typen `MoveContext`, `MoveTarget`, `MoveRejection`, `MoveError`, `BlockedEdge`) | Erledigt | `Movement.test.ts` (alle Suites nutzen die Typen) |
| 2 | Logik | `isEdgeBlocked` + `legalMovesFrom` implementieren | Erledigt | `isEdgeBlocked`, `legalMovesFrom`-Suites in `Movement.test.ts` |
| 3 | Logik | `legalGanoveMoves` + `legalDetectiveMoves` implementieren | Erledigt | `legalGanoveMoves`, `legalDetectiveMoves`-Suites |
| 4 | Logik | `validateGanoveMove` + `validateDetectiveMove` implementieren | Erledigt | `validateGanoveMove`, `validateDetectiveMove`-Suites |
| 5 | Logik | `mapEscapeNodeIds` (Fluchtpunkte aus Kategorie `flucht`) | Erledigt | `mapEscapeNodeIds`-Test |
| 6 | State | `GameOutcome`-Typ + `GameConfigError` + `StartGameOptions.roundLimit` | Erledigt | `startGame roundLimit resolution`-Suite (`gameStore.rounds.test.ts`) |
| 7 | State | Neue Store-Felder `outcome`, `roundLimit`, `escapeNodeIds`, `ganoveCanAct` | Erledigt | `gameStore.test.ts` Initial-State-Test, `startGame escape nodes and outcome fields` |
| 8 | State | `startGame`: `roundLimit`-Auflösung + Validierung, `escapeNodeIds`-Init, initiale Umzingelungsprüfung | Erledigt | `startGame roundLimit resolution`-Suite, `detects a ganove surrounded from the very first round` |
| 9 | State | `moveGanove` (Validierung, Log, Fluchtprüfung, Phasenwechsel) | Erledigt | `moveGanove`-Suite, `escaped`-Suite |
| 10 | State | `moveDetective` (feste Reihenfolge, Sofort-Fangprüfung, Rundenende) | Erledigt | `moveDetective fixed order`-Suite, `caught`-Suite |
| 11 | State | Rundenende-Sequenz in `endDetectivePhase` (Timeout → Runde+1 → Kanten-Ablauf → Umzingelung) | Erledigt | `timeout`-, `surrounded`-Suites; Bestandstest „blocks edges…" |
| 12 | State | `ganoveAction` (Zugzwang-Ausnahme bei `ganoveCanAct`), `abortAsDraw` | Erledigt | `ganoveAction`-Suite, `does not fire while the ganove can act`, `draw`-Suite |
| 13 | State | `getLegalGanoveMoves`/`getLegalDetectiveMoves`, `setEscapeNodeIds`, `setGanoveCanAct` | Erledigt | `getLegalMoves selectors`-, `setEscapeNodeIds`-, `ganoveAction`-Suites |
| 14 | Tests | `src/logic/Movement.test.ts` schreiben | Erledigt | 21 Tests grün |
| 15 | Tests | `src/state/gameStore.rounds.test.ts` schreiben | Erledigt | 20 Tests grün |
| 16 | Tests | `src/state/gameStore.endings.test.ts` schreiben | Erledigt | 11 Tests grün |
| 17 | Tests | `gameStore.test.ts` Initial-State-Assertions ergänzen | Erledigt | `starts with the documented initial state` |
| 18 | QS | `npm run build && npm test && npm run coverage && npm run lint` grün | Erledigt | Build ✓, 163 Tests ✓, Coverage 91,7 % Lines, Lint ✓ |
