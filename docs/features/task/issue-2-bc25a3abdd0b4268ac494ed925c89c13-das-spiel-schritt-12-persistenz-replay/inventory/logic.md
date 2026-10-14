# Logik — Persistenz & Replay

## `useGameStore` (zustand Singleton)
Datei: `src/state/gameStore.ts`

| Methode | Kurzbeschreibung |
|---------|------------------|
| `startGame(map, seed, options)` | Aufstellung inkl. `resolvedMission`/`resolvedCameras`-Rekonstruktionspfad; schreibt `header` |
| `resetGame()` | zurück auf `initialData()` |
| `appendLog(entry)` | seq-Vergabe (header=0) |
| `exportGameLog()` | `exportGameLogFile(get().log)` — Blob-Download |
| `endGanovePhase`/`advanceDetective`/`endDetectivePhase` | Phasenmaschine |
| `moveGanove(target)` | validiert, loggt `move`, Kamera-/Event-Roll, Escape-Check |
| `moveDetective(target)` | validiert, loggt `move`, Fang-Check, Rundenende |
| `ganoveAction()` | Aktionsrunde; loggt `action`; Mission-Advance + `aktion`-Trace |
| `chooseMissionPath(choice)` | beantwortet `pendingChoice`; loggt `sabotage_offer` mit `chosen` |
| `abortAsDraw()` | Remis |
| `useRadio()` | einmaliger Polizeifunk (`radioUsed`); loggt `radio` |
| `finish(outcome)` | intern: loggt `result` + `saveGameLog` (Auto-Persistenz) |
| `setMission`/`setCameras`/`blockEdge`/`unblockExpiredEdges`/`setTension`/`setEventMode`/`setEscapeNodeIds`/`setGanoveCanAct` | Hooks für Engine/Tests |
| `getLegalGanoveMoves`/`getLegalDetectiveMoves`/`getMissionAction`/`getMissionStructure`/`getHeatLevel` | abgeleitete Sichten |

Intern: `MISSION_RNG_SALT`, `missionRng`, `resolveMission`,
`resolveRecordedMission`, `resolveRecordedCameras`,
`resolveSpawnPositions`, `runEventRoll`, `emitInfoEvent` — RNG kommt
ausschließlich aus `createRng(seed)`/`mixSeed(seed, round)`; **kein
`Math.random`** in `src/logic`.

**Fehlt:** Restore-Methode für einen Snapshot (z. B.
`resumeGame`/`applySnapshot`).

## `Recorder.ts`
Datei: `src/logic/Recorder.ts`

| Funktion | Zweck |
|----------|-------|
| `serializeLogEntry`/`serializeLog`/`parseLog` | JSONL (De-)Serialisierung |
| `headerFromLog` | Header eines Logs |
| `startOptionsFromHeader(header)` | `ReconstructedStart` `{mapId, seed, options}` — bit-identischer Wiederaufbau |
| `saveGameLog(log, options?)` | FIFO-Anhang, `maxLogs` (Standard 10), `StorageLike` injizierbar |
| `listGameLogs(storage?)` | gespeicherte JSONL-Strings, älteste→neueste |
| `clearGameLogs(storage?)` | leert die Liste |
| `exportGameLog(log, options?)` | `application/x-ndjson`-Blob + Download-Sink |

`StorageLike`-Interface und `defaultStorage()` vorhanden.
**Fehlt:** einzelnes Löschen (`deleteGameLog`) und Zugriff auf ein
konkretes Log für den Replay (`getGameLog`-Variante).

## `GameIndex.ts`
Datei: `src/logic/GameIndex.ts`

| Funktion | Zweck |
|----------|-------|
| `summarizeLog(jsonl)` | `GameSummary` aus header+result; `null` bei Schrott |
| `listGameSummaries(storage?)` | Summaries, neueste zuerst |
| `listResumeEntries(storage?)` | gespeicherte Resume-Einträge (aktuell leer) |

**Fehlt:** `saveResumeEntry` (FIFO, Ersetzen gleicher `gameId`),
`deleteResumeEntry`, Schema-Filterung.

## `InformationSystem.ts`
Datei: `src/logic/InformationSystem.ts`

`visibleEvents(events, side)`, `visibleCameras(cameras, side)` —
Datenebenen-Filter; `heatLevel`, `radioHintSummary`,
`revealedGanovePosition`, `HINT_EVENT_KINDS`, `HEAT_WEIGHTS`.

## `Deduction.ts`
Datei: `src/logic/Deduction.ts`

`deducePossiblePositions({map, detectiveStarts, events, cameras, round,
detectivePositions, detectiveHistory?})` — dieselbe Deduktion wie in der
Live-Detektivansicht; für die Replay-Detektiv-Perspektive wiederverwendbar.

## `AiSimulation.ts` / Treiber
Dateien: `src/logic/AiSimulation.ts`, `src/state/detectiveDriver.ts`,
`src/state/ganoveDriver.ts`

`runAiGame`/`runAiBatch`/`summarizeBatch`; `aiRng(seed, round, lane)` —
deterministische KI-Züge; `installDetectiveDriver`/`installGanoveDriver`
spielen die jeweilige KI-Phase am Store. `detectiveStartsFromLog(log)`
liest den Spawn-Prior aus dem Header. Wichtig: KI-Entscheidungen stehen
im Log (`move`-Einträge) — Replay braucht die KI **nicht** erneut.

## Sonstiges

- `src/logic/rng.ts`: `createRng`, `mixSeed` — einzige Zufallsquelle.
- `src/logic/MapLoader.ts`: `loadMap(id)`, `listMapIds()` (statisch
  gebundelt via `import.meta.glob`).
- `docs/konzept/content/02-technisches-konzept.md` §8/§8.1: Speicherstand
  = State-Snapshot + Log + Seed (`SaveGame.ts`); `ReplayPlayer.ts` mit
  Play/Pause/Schritt vor/zurück und zwei Perspektiven über `visibleTo`;
  aggregierte Statistiken versorgen OT-23.
