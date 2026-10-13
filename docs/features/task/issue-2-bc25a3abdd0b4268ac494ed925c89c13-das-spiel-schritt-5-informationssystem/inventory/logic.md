# Bestandsaufnahme: Logik (`src/logic/`)

## `mapPack.ts`
Datei: `src/logic/mapPack.ts`

Typen/Funktionen relevant für die Informationsschicht:

| Element | Typ | Zweck |
|---------|-----|-------|
| `MapSettings` | Interface | Enthält bereits alle Infosystem-Parameter: `cameraCount` (RangeSetting), `radioHintCount` (RangeSetting), `edgeBlockRounds` (RangeSetting), `cameraMinGap` (number), `hintZoneRadius` (number), `eventMode` (`EventMode`), `eventDefaults` (`EventDefaults`), `eventMix` (`EventMix`) |
| `EventDefaults` | Interface | `{ cycle, chance, threshold, perRound }` |
| `EventMix` | Interface | `{ sichtbarkeit, hinweis, umwelt }` |
| `EVENT_MODES` | Konstante | `["cycle", "chance", "tension"]` — wird von `validateMapPack` geprüft |
| `RangeSetting` | Interface | `{ suggested, min, max?, unlimited? }` |
| `validateMapPack` | Funktion | Validiert alle o. g. Felder bereits schemafest |
| `MapNode` | Interface | `id`, `name`, `x`, `y`, `categories`, `zone` — `zone` ist Basis für Zonenhinweise |
| `MapEdge` | Interface | `a`, `b`, `type`, `cost?` |

## `rng.ts`
Datei: `src/logic/rng.ts`

| Element | Typ | Zweck |
|---------|-----|-------|
| `Rng` | Interface | `next()`, `nextInt(min, max)`, `pick(items)`, `shuffle(items)` |
| `createRng` | Funktion | mulberry32, einzige Zufallsquelle; `Math.random()` in `src/logic/` per Git-Hook verboten |

## `Graph.ts`
Datei: `src/logic/Graph.ts`

| Element | Typ | Zweck |
|---------|-----|-------|
| `buildGraph` | Funktion | `MapPack` → `Graph` (Adjazenz, beide Kantentypen) |
| `neighbors` | Funktion | Direkte Nachbarknoten |
| `bfsDistances` | Funktion | BFS-Kantendistanzen von einem Startknoten — Basis für `cameraMinGap` und `hintZoneRadius` |
| `distance` | Funktion | Kantendistanz zwischen zwei Knoten |

## `Movement.ts`
Datei: `src/logic/Movement.ts`

| Element | Typ | Zweck |
|---------|-----|-------|
| `BlockedEdge` | Interface | `{ a, b, untilRound }` — wird von `umwelt`-Ereignissen befüllt |
| `isEdgeBlocked` | Funktion | Prüft Sperrung in einer Runde (unidirektional tolerant) |
| `legalMovesFrom` / `legalGanoveMoves` / `legalDetectiveMoves` | Funktionen | Respektieren `blockedEdges` bereits — Umweltsperrungen wirken automatisch |
| `MoveError` / `MoveRejection` | Klasse/Typ | Fehlerkanal für ungültige Aktionen (`reason`-Codes) |
| `mapEscapeNodeIds` | Funktion | Knoten mit Kategorie `flucht` |

## `MapLoader.ts`
Datei: `src/logic/MapLoader.ts`

| Element | Typ | Zweck |
|---------|-----|-------|
| `loadMap` | Funktion | `loadMap("muenster" \| "luebeck" \| "teststadt")` → validiertes `MapPack` |
| `listMapIds` | Funktion | Bekannte Karten-IDs |

## `SpawnSystem.ts`
Datei: `src/logic/SpawnSystem.ts`

| Element | Typ | Zweck |
|---------|-----|-------|
| `pickDetectiveSpawns` / `pickGanoveSpawn` | Funktionen | Verbrauchen `Rng`-Züge in `startGame` — relevant für die RNG-Strom-Reihenfolge bei der Kameraplatzierung |
| `detectiveSpawnChoices` / `ganoveSpawnChoices` | Funktionen | Erlaubte Spawnmengen |
| `SpawnError` | Klasse | Fehler bei illegalen Startpositionen |

## Kartendaten (`src/data/maps/`)

- `muenster.json`: 59 Knoten, 101 Kanten; `eventMode: "tension"`,
  `eventDefaults {cycle:4, chance:0.25, threshold:40, perRound:10}`,
  `eventMix {0.25/0.45/0.30}`, `cameraMinGap:2`, `hintZoneRadius:2`,
  `cameraCount.suggested:8`, `radioHintCount.suggested:5`,
  `edgeBlockRounds.suggested:3`.
- `luebeck.json`: 22 Knoten, 39 Kanten; `eventMode: "cycle"`,
  `eventDefaults {cycle:3, chance:0.3, threshold:30, perRound:8}`,
  `eventMix {0.15/0.45/0.40}`, `cameraMinGap:1`, `hintZoneRadius:1`.
- `teststadt.json`: 10 Knoten, 13 Kanten (Fixture); `eventMode:
  "tension"`, Defaults wie Münster (`cycle:4`, `chance:0.25`,
  `threshold:40`, `perRound:10`), `eventMix {0.25/0.45/0.30}`,
  `cameraMinGap:2`, `hintZoneRadius:2`, `cameraCount.suggested:8`
  (auf 10 Knoten mit `minGap` 2 nur begrenzt erfüllbar — wichtig für
  Testannahmen).
