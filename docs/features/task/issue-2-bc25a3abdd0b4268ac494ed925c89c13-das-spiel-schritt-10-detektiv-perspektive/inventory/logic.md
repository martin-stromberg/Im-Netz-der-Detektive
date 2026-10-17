# Bestandsaufnahme — Logik & State

## `useGameStore` (Zustand-Store)
Datei: `src/state/gameStore.ts`

| Member | Typ | Kurzbeschreibung |
|--------|-----|------------------|
| `map` | `MapPack \| null` | aktives Kartenpaket, `null` vor Spielstart |
| `round`, `phase`, `activeDetectiveIndex` | `number`, `"ganove"\|"detektive"`, `number` | Rundenmaschine; `activeDetectiveIndex` = aktuell ziehender Detektiv (D1→Dn) |
| `detektivePositions` | `string[]` | öffentliche Trupp-Positionen |
| `ganovePosition` | `string \| null` | **ganove-seitig — darf die Detektiv-UI nie rendern** |
| `mission` | `Mission \| null` | inkl. `targets` (gezogene Knoten — ganove-seitig) |
| `events` | `GameEvent[]` | volle Chronik, jedes Event mit `visibleTo` |
| `cameras` | `Camera[]` | `{nodeId, active}` — Detektiv-Wissen |
| `blockedEdges` | `BlockedEdge[]` | öffentlich (`umwelt`) |
| `outcome` | `GameOutcome \| null` | caught/surrounded/escaped/timeout/draw |
| `roundLimit`, `escapeNodeIds`, `radioUsed`, `log`, `seed` | — | Konfiguration/Zustand der Partie |
| `startGame(map, seed, options)` | Action | `detectivePositions` explizit setzbar; ohne `ganovePosition` wird der Ganove-Start verdeckt gezogen |
| `moveDetective(target)` | Action | validiert via `validateDetectiveMove`, Fangprüfung sofort je Zug, nach letztem Detektiv `completeDetectivePhase` → `phase:"ganove"`, `round+1` |
| `getLegalDetectiveMoves()` | Action | `MoveTarget[]` des `activeDetectiveIndex` |
| `getMissionStructure()` | Action | `MissionStructureStep[]` — Status ohne Knoten-IDs |
| `moveGanove`, `ganoveAction`, `chooseMissionPath`, `useRadio` | Actions | für den KI-Treiber |
| `abortAsDraw`, `resetGame`, `appendLog` | Actions | Remis, Neustart, Log |

## `Deduction.ts`
Datei: `src/logic/Deduction.ts`

| Funktion | Beschreibung |
|----------|--------------|
| `deducePossiblePositions(input: DeductionInput): string[]` | Pfadinduktion über Positionshistorien; Input: `map`, `detectiveStarts`, `events` (filtert `visibleTo:"ganove"` intern defensiv), `cameras` (aktive treiben Negativschluss), `round`, optional `detectiveHistory`/`detectivePositions` |
| `lastHintAnchor(events): GameEvent \| null` | letzter positionsführender Hinweis (KI-Hilfe) |

## `InformationSystem.ts`
Datei: `src/logic/InformationSystem.ts`

| Funktion/Typ | Beschreibung |
|--------------|--------------|
| `GameEventKind` | `"camera"\|"sichtbarkeit"\|"hinweis"\|"umwelt"\|"aktion"\|"polizeifunk"` |
| `visibleEvents(events, side)` | nur `visibleTo === side \|\| "both"` — Asymmetrie auf Datenebene |
| `visibleCameras(cameras, side)` | Detektive: alle; Ganove: `[]` |
| `revealedGanovePosition(events, round)` | exakte Position nur in der Runde des `sichtbarkeit`-Events |

## `GanoveAI.ts`
Datei: `src/logic/GanoveAI.ts`

| Funktion/Typ | Beschreibung |
|--------------|--------------|
| `GanoveView` | ganove-seitige Sicht (eigene Position, volle Mission, Detektive, Hitze, legale Züge, `missionAction`) |
| `chooseGanoveTurn(view, rng): GanoveTurn` | `{type:"move",target}` oder `{type:"action"}` |
| `chooseSabotagePath(view): "sabotage"\|"flucht"` | Antwort auf `pendingChoice` |
| `shouldUseRadio(view): boolean` | Funk ab `heatScore ≥ 3`, einmal pro Spiel |

## `AiSimulation.ts`
Datei: `src/logic/AiSimulation.ts`

| Funktion | Beschreibung |
|----------|--------------|
| `buildGanoveView(state): GanoveView` | baut die AI-Sicht aus dem Store (`visibleEvents(…,"ganove")`) |
| `buildDetectiveView(state, detectiveStarts): DetectiveView` | detektiv-seitige Sicht (Struktur, nie Zielknoten) |
| `aiRng(seed, round, lane): Rng` | deterministische AI-Streams; Ganove fährt Lane 0 |

## `detectiveDriver.ts`
Datei: `src/state/detectiveDriver.ts` (Vorbild-Muster für den Ganove-Treiber)

| Funktion | Beschreibung |
|----------|--------------|
| `detectiveStartsFromLog(log): string[]` | Spawn-Prior aus dem `header`-Eintrag (Fallback: aktuelle Positionen) |
| `driveDetectivePhase()` | Schleife: `chooseDetectiveMove`+`moveDetective` bis Phasenwechsel |
| `installDetectiveDriver(): () => void` | Store-Subscription mit Reentrancy-Guard; feuert nur in `phase:"detektive"` |

## `SpawnSystem.ts`
Datei: `src/logic/SpawnSystem.ts`

| Funktion | Beschreibung |
|----------|--------------|
| `detectiveSpawnChoices(map): string[]` | Kandidaten je `spawnRules.detectives.mode` (`choice`: Liste/Zonen, `free`/`random`: alle Knoten) |
| `pickDetectiveSpawns(map, rng, count): string[]` | seeded Ziehung (für `mode:"random"`) |
| `SpawnError` | ungültige Startwahl |

## `Movement.ts` / `MissionSystem.ts` / `MapLoader.ts`

- `legalDetectiveMoves(ctx, index): MoveTarget[]` — `{nodeId, edgeType}`;
  Detektive dürfen Knoten teilen, Zugzwang gilt (kein Verharren).
- `missionStructure(mission): MissionStructureStep[]` — `{kind, status:"erledigt"|"aktuell"|"offen"}`.
- `loadMap(id): MapPack`, `listMapIds()` — `muenster`, `luebeck`, `teststadt`.

Karten-Spawnmodi: `muenster`/`teststadt` → `detectives.mode:"choice"`
(je 5 bzw. 3 Kandidatenknoten), `ganove.mode:"free"` + `minDistanceToDetective`.
