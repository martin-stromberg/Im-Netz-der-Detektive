# Logik-Module (KI, Spawn, Mission, Info)

## `src/logic/AiSimulation.ts`

- `buildDetectiveView(state, detectiveStarts): DetectiveView` —
  exportiert; baut die Detektivsicht ausschließlich aus
  `visibleEvents(…, "detectives")`, `visibleCameras`, `blockedEdges`,
  `getMissionStructure()`. Benötigt `detectiveStarts` (Positionen bei
  Spielstart) — im Store nicht als Feld vorhanden, aber im Log-Header
  (`log`-Eintrag `type: "header"`, Feld `starts.detectives`).
- `buildGanoveView(state): GanoveView` — exportiert.
- `aiRng(seed, round, lane): Rng` — **nicht exportiert** (privat);
  `AI_RNG_SALT = 0xa11ce5`, Lane = `detectiveIndex + 1`. Für den
  UI-Treiber zu exportieren (deterministische Gleichkonvention).
- `runAiGame`/`runAiBatch`/`summarizeBatch` — Referenzimplementierung
  des Treibers (store-getrieben, Schleife bis `outcome`).

## `src/logic/DetectiveAI.ts`

- `chooseDetectiveMove(view, detectiveIndex, legalMoves, rng): string`
  — wirft `RangeError` bei leerer `legalMoves`-Liste (kann bei
  laufendem Spiel nicht vorkommen: Zugzwang/Connectivity-Garantie).
- `DetectiveView` — Felder siehe `AiSimulation.buildDetectiveView`.

## `src/logic/SpawnSystem.ts`

- `detectiveSpawnChoices(map): string[]` — Wahl-Knoten der Detektive
  (Münster: `hbf`, `domplatz`, `aegidiimarkt`, `mauritztor`,
  `kreuztor`).
- `ganoveSpawnChoices(map, detectivePositions): string[]` — legale
  Ganove-Starts (`free`-Modus + `minDistanceToDetective`, BFS).
- `pickDetectiveSpawns(map, rng, count): string[]` — KI-/Zufallswahl.
- `pickGanoveSpawn`, `spawnSequence`, `assignSpawns`, `SpawnError`.

## `src/logic/MissionSystem.ts`

- `executableMissionAction(mission, position): MissionKind | null` —
  schon via `getMissionAction()` im Store verdrahtet.
- `MissionTargets` — `{diebstahl, kontakt, flucht, sabotage | null,
  sabotageEffect?}`; `missionTargetIds(targets): string[]`.
- `MissionStage` — `"diebstahl" | "kontakt" | "wahl" | "sabotage" |
  "flucht"`.
- `generateMission` zieht `sabotage` nur bei nichtleerem Pool
  (Teststadt: kein `sabotage`-Kategorie-Pool → kein `pendingChoice`;
  Münster: 6 `sabotage`-Knoten → Binärwahl entsteht).

## `src/logic/InformationSystem.ts`

- `visibleEvents(events, "ganove")` — filtert datenseitig;
  ganovensichtbar sind `umwelt` (`both`) und `polizeifunk` (`ganove`).
- `visibleCameras(cameras, "ganove")` → `[]` — strukturelle Garantie.
- `radioHintSummary`, `RadioHint` (`kind`, `round`, `nodeId?`, `zone?`).
- `heatLevel(events, round)` → `{level, score}`; `HEAT_WINDOW = 3`.
- `GameEventKind`: `camera | sichtbarkeit | hinweis | umwelt | aktion |
  polizeifunk`.

## `src/logic/Movement.ts`

- `MoveTarget { nodeId, edgeType }`, `BlockedEdge { a, b, untilRound }`.
- `legalGanoveMoves`, `isEdgeBlocked`, `MoveError` + `MoveRejection`.
- `mapEscapeNodeIds(map)` — alle `flucht`-Knoten.

## `src/logic/MapLoader.ts` / `mapPack.ts`

- `loadMap(id): MapPack` synchron via `import.meta.glob` (funktioniert
  in Vitest/Vite). `listMapIds()`: `luebeck`, `muenster`, `teststadt`.
- `MapNode { id, name, x, y, categories, zone }`; `MapEdge { a, b,
  type: "weg" | "fahrt" }`; `MapPack.viewBox` (z. B. `"0 0 1000 800"`).

## `src/logic/rng.ts`

- `createRng(seed): Rng` mit `pick`, `mixSeed(seed, round)` — einzige
  erlaubte Zufallsquelle (`no-math-random-check.py` über `src/logic/`).
