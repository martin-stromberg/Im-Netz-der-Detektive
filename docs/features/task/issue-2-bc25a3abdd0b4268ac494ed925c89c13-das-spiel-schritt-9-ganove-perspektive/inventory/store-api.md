# Store-API und Phasenmaschine

Quelle: `src/state/gameStore.ts` (Zustand-Store `useGameStore`).

## State-Felder (für die UI relevant)

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `map` | `MapPack \| null` | geladenes Kartenpaket (`null` = kein Spiel) |
| `round` | `number` | aktuelle Runde (Start: 1) |
| `phase` | `"ganove" \| "detektive"` | wer am Zug ist |
| `activeDetectiveIndex` | `number` | laufender Detektiv in der Detektivphase |
| `ganovePosition` | `string \| null` | eigener Knoten |
| `detektivePositions` | `string[]` | exakte Detektivpositionen (ganovensichtig) |
| `mission` | `Mission \| null` | volle Mission inkl. `targets`, `stage` (`diebstahl`/`kontakt`/`wahl`/`sabotage`/`flucht`), `pendingChoice: {sabotageNode, effect} \| null`, `offeredEffect`, `appliedEffect` |
| `events` | `GameEvent[]` | Chronik mit `visibleTo` (`detectives`/`ganove`/`both`) |
| `cameras` | `Camera[]` | Kamera-Liste — **nie** an die Ganove-UI geben |
| `blockedEdges` | `BlockedEdge[]` | `{a, b, untilRound}` |
| `outcome` | `GameOutcome \| null` | `caught`/`surrounded`/`escaped`/`timeout`/`draw` |
| `roundLimit` | `number \| null` | Zeitlimit (`null` = unbegrenzt) |
| `escapeNodeIds` | `string[]` | Fluchtknoten (missionsgebunden oder alle `flucht`) |
| `radioUsed` | `boolean` | Polizeifunk schon genutzt |
| `radioHintCount` | `number` | effektive Funk-Tiefe |
| `seed`, `log`, `tensionValue`, `eventMode`, … | | Logging/Replay |

## Actions

- `startGame(map, seed, options?)` — `options.detectivePositions`,
  `ganovePosition` validieren explizite Starts (`SpawnError`);
  `mission` (`"auto"`/`"random"`/`"none"`/`{type:"case"|"custom"}`),
  `roundLimit`, `detectiveCount`, `cameraCount`, `radioHintCount`,
  `edgeBlockRounds`. Wirft `GameConfigError` bei Konflikten.
  Startet in `phase: "ganove"`, prüft sofort `surrounded`.
- `moveGanove(target)` — validiert (`MoveError`: `stay_forbidden`,
  `not_adjacent`, `blocked_edge`, `occupied`, `mission_choice_pending`),
  setzt `phase: "detektive"`; Flucht-Feld in `flucht`-Stage →
  `finish("escaped")`; löst intern Kamera-Check + Eventwurf aus.
- `ganoveAction()` — Aktionsrunde am Missionsziel (sonst `MoveError`
  `no_action_available`); `kontakt`-Aktion setzt `pendingChoice`;
  danach `phase: "detektive"`.
- `chooseMissionPath("sabotage" | "flucht")` — beantwortet
  `pendingChoice` (phasenunabhängig, während laufendem Spiel).
- `useRadio()` — einmalig (`MoveError` `already_used`), erzeugt
  `polizeifunk`-Event (`visibleTo: "ganove"`, `details.hints:
  RadioHint[]` mit `kind`, `round`, `nodeId?`, `zone?`).
- `abortAsDraw()` — `finish("draw")`, jederzeit im laufenden Spiel.
- `resetGame()` — zurück in den Leerzustand (`map: null`).
- `getLegalGanoveMoves(): MoveTarget[]` — `{nodeId, edgeType}`;
  `[]` außerhalb der Ganove-Phase. Filtert Detektivknoten, gesperrte
  Kanten und Nicht-Nachbarn.
- `getMissionAction(): MissionKind | null` — ausführbare Missionsaktion
  an der aktuellen Position (`diebstahl`/`kontakt`/`sabotage`).
- `getMissionStructure()` — Detektivsicht (ohne Zielknoten), für die
  Ganove-UI nicht nötig.
- `getHeatLevel(): { level: HeatLevel; score: number }` — Stufen
  `ruhig`/`aktiv`/`erhoeht`/`kritisch`.

## Phasenmaschine (relevant für den KI-Treiber)

- `moveGanove`/`ganoveAction` enden mit `set({ phase: "detektive",
  activeDetectiveIndex: 0 })` — synchroner Übergang.
- `moveDetective(target)` zieht den aktiven Detektiv; Fang-Check nach
  **jedem** Einzelzug (`caught`); letzter Detektiv →
  `completeDetectivePhase()`: Timeout-Check → `phase: "ganove"`,
  `round + 1`, `unblockExpiredEdges()`, Umzingelungs-Check
  (`surrounded`).
- Der Store treibt die Detektive **nicht** selbst — `AiSimulation`
  zeigt das Driver-Pattern (`chooseDetectiveMove` + `moveDetective` in
  einer Schleife, `aiRng(seed, round, index+1)`).
- `pendingChoice` blockiert `moveGanove` (`mission_choice_pending`),
  nicht die Detektivphase; die Wahl ist in der nächsten Ganove-Phase
  fällig.
- `finish()` schreibt die `result`-Logzeile und persistiert via
  `Recorder.saveGameLog` (localStorage-No-Op headless).
