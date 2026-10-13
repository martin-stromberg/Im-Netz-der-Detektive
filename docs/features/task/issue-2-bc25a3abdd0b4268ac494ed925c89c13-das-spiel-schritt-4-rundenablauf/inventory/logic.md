# Bestandsaufnahme — Logik

## `useGameStore` (Zustand-Store)

Datei: `src/state/gameStore.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `startGame(map, seed, options?)` | public | Validiert/platziert Spawns über `SpawnSystem`, setzt `map`, `seed`, `eventMode`, Positionen; schreibt `header`-Logeintrag. Optionen: `detectiveCount`, `detectivePositions`, `ganovePosition`. |
| `resetGame()` | public | Setzt den gesamten Datenstand zurück (`initialData()`). |
| `appendLog(entry)` | public | Hängt einen Logeintrag mit fortlaufendem `seq` an. |
| `endGanovePhase()` | public | `ganove` → `detektive`, `activeDetectiveIndex = 0`. Keine Zugprüfung. |
| `advanceDetective()` | public | `activeDetectiveIndex + 1` in Phase `detektive`. Keine Endeprüfung. |
| `endDetectivePhase()` | public | `detektive` → `ganove`, `round + 1`, `activeDetectiveIndex = 0`. Keine Limit-/Umzingelungsprüfung. |
| `setMission(mission)` | public | Setzt `mission` (Struktur aus §5 erst in Folgeschritt). |
| `addEvent(event)` | public | Hängt ein `GameEvent` an. |
| `setCameras(nodeIds)` | public | Setzt `cameras` (alle aktiv). |
| `blockEdge(a, b, untilRound)` | public | Fügt `BlockedEdge` hinzu. |
| `unblockExpiredEdges()` | public | Entfernt Kanten mit `untilRound < round`. |
| `setTension(value)` / `setEventMode(mode)` | public | Setzen von `tensionValue` / `eventMode`. |

Intern: `initialData()` (frischer Datenstand), `resolveSpawnPositions()`
(nutzt `createRng(seed)` + `SpawnSystem`, wirft `SpawnError`).

## `Graph.ts`

Datei: `src/logic/Graph.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `buildGraph(map)` | export | Ungerichtete Adjazenzliste `Map<nodeId, GraphEdge[]>`; `GraphEdge` trägt `nodeId` + `type` (`weg`/`fahrt`). |
| `neighbors(graph, nodeId)` | export | Nachbar-Ids (Kantentyp-agnostisch, enthält beide Typen). |
| `bfsDistances(graph, from)` | export | BFS-Kantendistanzen. |
| `distance(graph, from, to)` | export | Kantendistanz, `Infinity` bei unerreichbar/unbekannt. |

Hinweis für den Rundenmotor: `neighbors`/`GraphEdge` liefern bereits den
Kantentyp je Nachbar — nötig für `move`-Logeinträge (`edgeType`, §8).

## `SpawnSystem.ts`

Datei: `src/logic/SpawnSystem.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `detectiveSpawnChoices(map)` | export | Erlaubte Detektiv-Startknoten (`choice`/`free`/`random`). |
| `ganoveSpawnChoices(map, detPos)` | export | Ganoven-Kandidaten, gefiltert um `minDistanceToDetective` (BFS). |
| `spawnSequence(map, count?)` | export | Reihenfolge `detective`×n, dann `ganove`. |
| `pickDetectiveSpawns(map, rng, count)` | export | Seeded Auslosung ohne Ersatz (Pool füllt sich nach). |
| `pickGanoveSpawn(map, rng, detPos)` | export | Seeded Auslosung, wirft `SpawnError` wenn leer. |
| `assignSpawns(map, rng, count?)` | export | Vollautomatischer Spawn. |
| `SpawnError` | export | Fehlerklasse für Spawn-Verletzungen. |

## `rng.ts`

Datei: `src/logic/rng.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `createRng(seed)` | export | mulberry32-Seeded-RNG: `next`, `nextInt`, `pick`, `shuffle`. Einzige erlaubte Zufallsquelle (`no-math-random`-Hook). |

Der Rundenmotor benötigt keinen Zufall (Züge werden von außen skriptgesteuert
bzw. später von der KI gewählt); die RNG bleibt für Spawn/Events/Mission.

## `MapLoader.ts`

Datei: `src/logic/MapLoader.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `loadMap(id)` | export | Validiertes `MapPack` aus gebündelten JSONs (`import.meta.glob`, synchron/headless). |
| `listMapIds()` | export | Sortierte Liste der Karten-Ids. |

## `mapPack.ts`

Datei: `src/logic/mapPack.ts`

Stellt `MapPack`, `MapNode` (`categories`, `zone`), `MapEdge` (`a`,`b`,`type`),
`RangeSetting` (`suggested`, `min`, `max?`, `unlimited?`), `MapSettings`
(u. a. `roundLimit: RangeSetting`) und `validateMapPack`/`MapValidationError`.
