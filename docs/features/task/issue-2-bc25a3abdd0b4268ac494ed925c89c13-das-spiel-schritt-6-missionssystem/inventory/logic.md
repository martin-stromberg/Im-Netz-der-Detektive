# Bestandsaufnahme: Logik

## `Graph.ts`

- `buildGraph(map)`, `neighbors`, `bfsDistances(graph, from)` → `Map<nodeId, dist>`, `distance(graph, from, to)` (0 identisch, `Infinity` unerreichbar). BFS-Kantendistanz ist die vereinbarte Metrik — alle Missionskriterien darauf abbildbar.

## `rng.ts`

- `createRng(seed)` → `{ next, nextInt, pick, shuffle }`; `mixSeed(seed, round)` für deterministische Rundenströme. `Math.random` in `src/logic/` per Hook verboten.

## `MapLoader.ts`

- `loadMap(id)`, `listMapIds()` über `import.meta.glob("../data/maps/*.json", { eager: true })` — Vorlage für den `MissionLoader` (gleiches Muster auf `src/data/missions/`).

## `CameraSystem.ts`

- `placeCameras(graph, rng, count, minGap, protectedNodeIds = [])` — Ausschlussliste fertig; Missionsziele müssen beim Aufruf in `startGame` ergänzt werden.
- `triggeredCamera(cameras, nodeId)`, `deactivateAll(cameras)` (`kamera_aus`).

## `EreignisEngine.ts`

- `rollTrigger(mode, round, tensionValue, defaults, rng)` — 3 Modi.
- `drawEventType(mix, rng)` → `sichtbarkeit|hinweis|umwelt`.
- `zoneHint(position, map, graph, radius)` → `{zone, nodeIds}` — für `falsche_spur` wiederverwendbar (Hinweis auf anderen Knoten → konsistente falsche Zone).
- `pickBlockableEdge` mit Konnektivitätscheck.

## `InformationSystem.ts`

- `HINT_EVENT_KINDS` (inkl. `aktion`), `HEAT_WEIGHTS` (`aktion: 2`), `heatLevel` (3-Runden-Fenster), `visibleEvents/visibleCameras` (Sichtbarkeitsfilter), `radioHintSummary`, `revealedGanovePosition`.

## `Movement.ts`

- `legalGanoveMoves`, `legalDetectiveMoves`, `validateGanoveMove`, `validateDetectiveMove`, `isEdgeBlocked`, `mapEscapeNodeIds(map)` (alle `flucht`-Knoten — wird durch Missions-Fluchtknoten ersetzt).
- `MoveRejection`: `no_game`, `game_over`, `wrong_phase`, `not_active_detective`, `stay_forbidden`, `not_adjacent`, `blocked_edge`, `occupied`, `no_action_available`, `already_used` — erweiterbar um Missions-Gründe.
- `MoveError(reason, message)`.

## `SpawnSystem.ts`

- `pickDetectiveSpawns`, `pickGanoveSpawn`, `detectiveSpawnChoices`, `ganoveSpawnChoices` — laufen vor der Missionsgenerierung; der Ganoven-Startknoten geht in das `routeBudget`-Kriterium ein.

## `gameStore.ts` (Ablauf)

- `startGame`: `rng = createRng(seed)` → `resolveSpawnPositions` → `resolveRoundLimit`/`resolveRangeSetting`/`resolveCameraProtectedNodes` → `placeCameras` → `set` (u. a. `escapeNodeIds: mapEscapeNodeIds(map)`) → Header-Log → `checkGanoveSurrounded`. Missionsauflösung gehört zwischen Spawn und Kameras.
- `moveGanove`: `requireRunningGame("ganove")` → `validateGanoveMove` → Position setzen → `escapeNodeIds.includes(target)` → `escaped`; sonst `runCameraCheck` + `runEventRoll` → Phase `detektive`.
- `ganoveAction`: benötigt `ganoveCanAct`; loggt `action`; `runEventRoll`; Phase `detektive` — Effekt-Logik kommt hier hin.
- `checkGanoveSurrounded`: feuert bei `legalGanoveMoves === 0 && !ganoveCanAct` — muss `executableMissionAction` berücksichtigen.
- `completeDetectivePhase`: Timeout → `round+1`, `unblockExpiredEdges`, `checkGanoveSurrounded`.
- `runEventRoll`: `createRng(mixSeed(seed, round))` → `rollTrigger` → `emitRoundEvent` (`emitUmwelt` sperrt Kante beidseitig sichtbar). Eingriffspunkt für `funkstille`/`falsche_spur`.
- `useRadio`, `deactivateCameras`, `getHeatLevel`, `setEscapeNodeIds`, `setGanoveCanAct`, `setMission`, `addEvent`, `appendLog`, `setCameras`, `blockEdge`.
