# Tasks: Rundenablauf und Spielende (Schritt 4)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `src/logic/Movement.ts` anlegen (Typen `MoveContext`, `MoveTarget`, `MoveRejection`, `MoveError`, `BlockedEdge`) | Offen | — |
| 2 | Logik | `activeEdgeBlocks`/`isEdgeBlocked` + `legalMovesFrom` implementieren | Offen | — |
| 3 | Logik | `legalGanoveMoves` + `legalDetectiveMoves` implementieren | Offen | — |
| 4 | Logik | `validateGanoveMove` + `validateDetectiveMove` implementieren | Offen | — |
| 5 | Logik | `mapEscapeNodeIds` (Fluchtpunkte aus Kategorie `flucht`) | Offen | — |
| 6 | State | `GameOutcome`-Typ + `GameConfigError` + `StartGameOptions.roundLimit` | Offen | — |
| 7 | State | Neue Store-Felder `outcome`, `roundLimit`, `escapeNodeIds`, `ganoveCanAct` | Offen | — |
| 8 | State | `startGame`: `roundLimit`-Auflösung + Validierung, `escapeNodeIds`-Init, initiale Umzingelungsprüfung | Offen | — |
| 9 | State | `moveGanove` (Validierung, Log, Fluchtprüfung, Phasenwechsel) | Offen | — |
| 10 | State | `moveDetective` (feste Reihenfolge, Sofort-Fangprüfung, Rundenende) | Offen | — |
| 11 | State | Rundenende-Sequenz in `endDetectivePhase` (Timeout → Runde+1 → Kanten-Ablauf → Umzingelung) | Offen | — |
| 12 | State | `ganoveAction` (Zugzwang-Ausnahme bei `ganoveCanAct`), `abortAsDraw` | Offen | — |
| 13 | State | `getLegalGanoveMoves`/`getLegalDetectiveMoves`, `setEscapeNodeIds`, `setGanoveCanAct` | Offen | — |
| 14 | Tests | `src/logic/Movement.test.ts` schreiben | Offen | — |
| 15 | Tests | `src/state/gameStore.rounds.test.ts` schreiben | Offen | — |
| 16 | Tests | `src/state/gameStore.endings.test.ts` schreiben | Offen | — |
| 17 | Tests | `gameStore.test.ts` Initial-State-Assertions ergänzen | Offen | — |
| 18 | QS | `npm run build && npm test && npm run coverage && npm run lint` grün | Offen | — |
