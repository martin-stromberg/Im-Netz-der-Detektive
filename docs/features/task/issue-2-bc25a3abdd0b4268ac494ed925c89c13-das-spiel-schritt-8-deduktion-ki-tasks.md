# Tasks: Deduktion & KI (Schritt 8)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Logik | `bfsOpenDistances` in `Movement.ts` ergänzen (blockungsbewusste BFS) | Offen | — |
| 2 | Deduktion | `src/logic/Deduction.ts` anlegen: `DeductionInput`, `deducePossiblePositions`, `lastHintAnchor` | Offen | — |
| 3 | Deduktion | `Deduction.test.ts`: Spawn-Prior, Übergangskette/Maximalreichweite | Offen | — |
| 4 | Deduktion | `Deduction.test.ts`: Constraints `camera`/`sichtbarkeit`/`aktion`/`hinweis`/`umwelt`, Verharren nur mit `aktion`, Negativ-Kamera | Offen | — |
| 5 | Detektiv-KI | `src/logic/DetectiveAI.ts`: `DetectiveView`, `chooseDetectiveMove` (Abdeckung + Hinweisanker) | Offen | — |
| 6 | Detektiv-KI | `DetectiveAI.test.ts`: legale Züge, Konvergenz auf Singleton, Einkreisung, Info-Trennung | Offen | — |
| 7 | Ganove-KI | `src/logic/GanoveAI.ts`: `GanoveView`, `chooseGanoveTurn`, `chooseSabotagePath`, `shouldUseRadio` | Offen | — |
| 8 | Ganove-KI | `GanoveAI.test.ts`: Routing, Aktions-Timing (Hitze/Nähe), Radio, Sabotage-Binärwahl | Offen | — |
| 9 | Simulation | `src/logic/AiSimulation.ts`: `runAiGame`, `runAiBatch`, `summarizeBatch`, View-Builder | Offen | — |
| 10 | Simulation | `AiSimulation.test.ts`: reguläre Endbedingungen, Reproduzierbarkeit je Seed, Belief-Invarianz, Aggregation | Offen | — |
| 11 | Skript | `vite.sim.config.ts` + `scripts/sim.ts` + `sim`-Script in `package.json` + `dist-sim/` in `.gitignore` | Offen | — |
| 12 | Skript | `scripts/sim.test.mjs`: CLI-Parsing/Fehlerfälle | Offen | — |
| 13 | Qualität | `npm run build`, `npm test`, `npm run coverage` (≥70 %), `npm run lint`, `npm run sim` grün | Offen | — |
