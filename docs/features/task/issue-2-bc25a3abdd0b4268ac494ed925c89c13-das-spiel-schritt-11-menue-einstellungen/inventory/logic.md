# Bestandsaufnahme: Logik und State

## `useGameStore` (`src/state/gameStore.ts`)

| Methode | Zweck |
|---------|-------|
| `startGame(map, seed, options?)` | Löst Spawns (`resolveSpawnPositions`), `roundLimit`, `cameraCount`, `radioHintCount`, `edgeBlockRounds`, Mission (`resolveMission`), Kameras auf; schreibt `header`-Logeintrag mit `config` |
| `resetGame`, `moveGanove`, `moveDetective`, `ganoveAction`, `chooseMissionPath`, `abortAsDraw`, `useRadio`, `getLegalGanoveMoves`, `getLegalDetectiveMoves`, `getMissionAction`, `getMissionStructure`, `exportGameLog` | laufende Partie |
| `setEventMode(mode)` | Hook, `eventMode` im laufenden State |

`StartGameOptions`-Felder (Stand): `detectiveCount`, `detectivePositions`,
`ganovePosition`, `roundLimit` (`null` = unbegrenzt, nur bei
`settings.roundLimit.unlimited`), `cameraCount`, `cameraProtectedNodes`,
`radioHintCount`, `edgeBlockRounds`, `mission`, `resolvedMission`,
`resolvedCameras`, `gameId`.
**Nicht** konfigurierbar: `eventMode`, `eventDefaults` — `runEventRoll`
liest `map.settings.eventDefaults` und `state.eventMode` direkt.

Fehlertypen: `GameConfigError` (Bereichsverletzungen, unbekannte
Missionsoption, Kriterienverletzung bei `case`/`custom`),
`MissionGenerationError`, `SpawnError`, `MoveError`.

## `MapLoader` / `mapPack` (`src/logic/`)

`listMapIds(): string[]` (muenster, luebeck, teststadt),
`loadMap(id): MapPack` (wirft `MapValidationError`), `validateMapPack`.
`MapPack.settings`: `detectiveCount`, `cameraCount`, `roundLimit`
(optional `unlimited: true`), `radioHintCount`, `edgeBlockRounds` als
`RangeSetting {suggested, min, max?}`; `eventMode`, `eventDefaults`,
`eventMix`, `missionRules`, `sabotageEffects`, `cameraMinGap`,
`hintZoneRadius`. `SpawnRules`: `detectives`/`ganove` je `{mode:
choice|free|random, nodes?, zones?, minDistanceToDetective?}`,
`order: "detektive_first"`.

## `SpawnSystem` (`src/logic/SpawnSystem.ts`)

`detectiveSpawnChoices(map)`, `ganoveSpawnChoices(map,
detectivePositions)` (filtert `minDistanceToDetective` per BFS),
`pickDetectiveSpawns(map, rng, count)` (Refill-Pool erlaubt
Mehrfachbelegung), `pickGanoveSpawn(map, rng, detectivePositions)`
(`SpawnError` bei leerer Menge), `spawnSequence`, `assignSpawns`.
**Fehlt:** Filterung der Ganoven-Spawns gegen Missionskriterien.

## `MissionSystem` / `MissionLoader` (`src/logic/`)

`generateMission` (Rejection Sampling), `missionCriteriaViolations(
graph, rules, targets, start)` (Codes: `min_gap:*`, `max_gap:*`,
`flucht_kontakt_gap`, `flucht_diebstahl_gap`, `sabotage_detour`,
`route_budget`, `route_budget_sabotage`; `start` darf `null` sein),
`validateCustomTargets(map, graph, targets, start)` (Kategorien +
Kriterien, Liste von Fehlertexten), `caseTargets(entry)`,
`nodesByCategory(map, category)`, `MissionCase {id, name, story,
diebstahl, kontakt, sabotage?, sabotageEffect?, flucht}`.
`loadMissionSet(map)` (wirft `MissionValidationError`, wenn kein Set),
`hasMissionSet(mapId)`, `listMissionSetIds()`, `getMissionCase(set, id)`.

## `AiSimulation` (`src/logic/AiSimulation.ts`)

`runAiGame(map, seed, options?): SimGameResult`, `runAiBatch(map,
seeds, options?)`, `summarizeBatch(results): BatchSummary`
(`outcomes`, `avgRounds`, `minRounds`, `maxRounds`, `avgHints`,
`avgCamerasTriggered`, `sabotageAcceptanceRate`, `radioUsageRate`).
Nutzt ausschließlich Store-Aktionen; Logs landen via `saveGameLog`
automatisch im FIFO.

## `Recorder` (`src/logic/Recorder.ts`)

`LOG_STORAGE_KEY`, `MAX_STORED_LOGS` (10), `serializeLog`,
`parseLog(jsonl)`, `headerFromLog`, `startOptionsFromHeader(header)
→ {mapId, seed, options}`, `listGameLogs(storage?)`, `saveGameLog(log,
{storage?, maxLogs?})`, `clearGameLogs`, `exportGameLog`. Keine
Mid-Game-Persistenz, keine Index-/Zusammenfassungsfunktion.

## `i18n` (`src/i18n/`)

`t(key, params?)` liest `de.json`; `en.json` spiegelgleiche
Schlüsselmenge (Hook `i18n-check.py`). Aktuell ~113 Keys.

## RNG

`createRng(seed)`, `mixSeed` (`src/logic/rng.ts`) — einzige
Zufallsquelle; `Math.random` in `src/logic` per Hook verboten.
