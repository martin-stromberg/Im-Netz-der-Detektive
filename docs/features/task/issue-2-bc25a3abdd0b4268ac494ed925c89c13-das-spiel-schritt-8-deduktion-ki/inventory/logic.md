# Bestandsaufnahme — Logikmodule

## `Graph` (`src/logic/Graph.ts`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `buildGraph(map)` | exportiert | Ungerichteter Graph aus `MapPack.edges` |
| `neighbors(graph, nodeId)` | exportiert | Direkte Nachbarknoten |
| `bfsDistances(graph, from)` | exportiert | BFS-Kantendistanzen (Map) |
| `distance(graph, from, to)` | exportiert | Kantendistanz, `Infinity` bei Nichterreichbarkeit |

## `Movement` (`src/logic/Movement.ts`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `legalMovesFrom(ctx, nodeId)` | exportiert | Ungesperrte Nachbarn (Zugzwang: nie der eigene Knoten) |
| `legalGanoveMoves(ctx)` | exportiert | Wie oben, minus detektivbesetzte Knoten |
| `legalDetectiveMoves(ctx, i)` | exportiert | Detektiv i: ungesperrte Nachbarn (Teilen erlaubt) |
| `isEdgeBlocked(a, b, blockedEdges, round)` | exportiert | Sperrstatus einer Kante in einer Runde |
| `validateGanoveMove` / `validateDetectiveMove` | exportiert | Wirft `MoveError` bei illegalen Zügen |
| `mapEscapeNodeIds(map)` | exportiert | Alle `flucht`-Knoten |

## `InformationSystem` (`src/logic/InformationSystem.ts`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `visibleEvents(events, side)` | exportiert | Datenseitiger Sichtfilter |
| `visibleCameras(cameras, side)` | exportiert | Ganove erhält nie `Camera`-Objekte |
| `radioHintSummary(events, count)` | exportiert | Letzte N Hinweise (Polizeifunk-Inhalt) |
| `revealedGanovePosition(events, round)` | exportiert | `sichtbarkeit`-Aufdeckung, nur gültig in der Auslöserunde |
| `heatLevel(events, round)` | exportiert | Hitze-Level + Score (Fenster 3 Runden, gewichtet) |

Konstanten: `HINT_EVENT_KINDS`, `HEAT_WEIGHTS`, `HEAT_WINDOW`.

## `EreignisEngine` (`src/logic/EreignisEngine.ts`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `rollTrigger(mode, round, tension, defaults, rng)` | exportiert | Auslösemodi cycle/chance/tension |
| `drawEventType(mix, rng)` | exportiert | Typziehung nach `eventMix` |
| `zoneHint(position, map, graph, radius)` | exportiert | `hinweis`-Inhalt (Zone + BFS-Ball) |
| `pickBlockableEdge(...)` | exportiert | `umwelt`-Kantensperre mit Konnektivitätsprüfung |

## `MissionSystem` (`src/logic/MissionSystem.ts`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `executableMissionAction(mission, position)` | exportiert | Ausführbare MissionKind am Knoten |
| `missionStructure(mission)` | exportiert | Detektivsicht: Schritte + Status, keine Knoten |
| `missionCriteriaViolations(...)` / `generateMission` / `validateCustomTargets` | exportiert | Generierungs-/Prüflogik |
| `drawSabotageEffect(map, rng)` | exportiert | Zufallsziehung des Angebots |
| `sabotageDuration(map)` | exportiert | Wirkdauer `funkstille`/`falsche_spur` |
| `missionTargetIds(targets)` / `nodesByCategory(map, cat)` / `caseTargets(entry)` | exportiert | Hilfsfunktionen |

Konstanten: `MISSION_KINDS`, `ACTION_ROUNDS=3`,
`FLUCHT_MIN_KONTAKT_GAP=4`, `FLUCHT_MIN_DIEBSTAHL_GAP=3`.

## `CameraSystem` (`src/logic/CameraSystem.ts`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `placeCameras(graph, rng, count, minGap, protected)` | exportiert | Platzierung mit Mindestabstand + Schutzliste |
| `triggeredCamera(cameras, nodeId)` | exportiert | Aktive Kamera am Knoten |
| `deactivateAll(cameras)` | exportiert | `kamera_aus`-Effekt |

## `SpawnSystem` (`src/logic/SpawnSystem.ts`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `ganoveSpawnChoices(map, detektivePositions)` | exportiert | Legale Ganoven-Spawns (inkl. `minDistanceToDetective`) — **Deduktions-Prior** |
| `detectiveSpawnChoices` / `pickDetectiveSpawns` / `pickGanoveSpawn` / `assignSpawns` / `spawnSequence` | exportiert | Spawn-Ziehung |

## `Recorder` (`src/logic/Recorder.ts`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `serializeLog` / `serializeLogEntry` / `parseLog` | exportiert | JSONL-Log (Spec §8) |
| `headerFromLog` / `startOptionsFromHeader` | exportiert | Rekonstruktion aus Header+Seed |
| `saveGameLog` / `listGameLogs` / `clearGameLogs` / `exportGameLog` | exportiert | Persistenz hinter injizierbaren Browser-Grenzen (no-op headless) |

## `rng` (`src/logic/rng.ts`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `createRng(seed)` | exportiert | mulberry32 — einzige Zufallsquelle |
| `mixSeed(seed, round)` | exportiert | Rundenweise Seed-Ableitung |

## `gameStore` (`src/state/gameStore.ts`)

Zustand-Store, headless-fähig (kein React-Zwang). Automatismen: Fangprüfung
nach jedem Detektivzug, Umzingelungsprüfung zu Ganovenphasen-Beginn,
Timeout am Rundenende, Kameracheck + Ereigniswurf nach `moveGanove`,
`aktion`-Spurhinweis + Missionsfortschritt in `ganoveAction`.

## `MapLoader` / `MissionLoader` (`src/logic/`)

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `loadMap(id)` / `listMapIds()` | exportiert | Validierte Kartenpakete via `import.meta.glob` |
| `loadMissionSet(map)` / `getMissionCase(set, id)` / `hasMissionSet(mapId)` | exportiert | Missions-„Fälle" via `import.meta.glob` |

**Einschränkung:** `import.meta.glob` ist ein Vite-Feature — plain
`node` kann die Engine nicht direkt laden. Für `npm run sim` wird ein
Vite-SSR-Bundle des CLI-Einstiegs benötigt (oder ein Lauf über Vitest).
