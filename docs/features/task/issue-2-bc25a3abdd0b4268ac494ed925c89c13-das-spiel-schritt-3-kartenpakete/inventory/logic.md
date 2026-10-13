# Logik: Loader, Graph, Spawn-System

## `MapLoader`
Datei: `src/logic/MapLoader.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `listMapIds()` | export | Sortierte IDs aller gebündelten Pakete (aus `import.meta.glob("../data/maps/*.json", eager)`) |
| `loadMap(id)` | export | Lädt Paket aus der Registry, wirft `MapValidationError` bei unbekannter ID oder Schema-Verletzung; ruft `validateMapPack` |

Kein Hartcodieren: Neue `*.json` unter `src/data/maps/` werden automatisch
Teil der Registry.

## `Graph`
Datei: `src/logic/Graph.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `buildGraph(map)` | export | Ungerichtete Adjazenzliste aus `map.edges` (beide Kantentypen gleich behandelt, `cost` ignoriert) |
| `neighbors(graph, nodeId)` | export | Direkte Nachbarn eines Knotens |
| `bfsDistances(graph, from)` | export | BFS-Kantendistanzen zu allen erreichbaren Knoten |
| `distance(graph, from, to)` | export | Kantendistanz; `Infinity` bei Unerreichbarkeit |

BFS-Distanz ist das Metrik-Maß für Spawn-Regeln, Missionsgenerierung und
Zonenhinweise — Grundlage der geplanten Struktur-/Missionskriterien-Tests.

## `SpawnSystem`
Datei: `src/logic/SpawnSystem.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `detectiveSpawnChoices(map)` | export | Kandidaten aus `spawnRules.detectives` (`nodes`/`zones`-Auflösung) |
| `ganoveSpawnChoices(map, detPos)` | export | Kandidaten gefiltert um `minDistanceToDetective` (BFS) |
| `spawnSequence(map, count?)` | export | Reihenfolge `detektive_first` |
| `pickDetectiveSpawns(map, rng, count)` | export | Seeded-Ziehung ohne Zurücklegen (Pool-Refill erlaubt) |
| `pickGanoveSpawn(map, rng, detPos)` | export | Ziehung aus distanzgefilterten Kandidaten, `SpawnError` bei leerem Pool |
| `assignSpawns(map, rng, count?)` | export | Vollständige Startaufstellung |

Relevanz für die Karten: Bei `ganove.mode: "free"` mit
`minDistanceToDetective: 3` muss der Graph für jede realistische
Detektivaufstellung noch Kandidaten übrig lassen — wird durch
Durchmesser/Dichte der Karte sichergestellt (Test).

## `mapPack` (Validator)
Datei: `src/logic/mapPack.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `validateMapPack(data)` | export | Schema-Validierung, wirft `MapValidationError` mit `errors[]` |
| `MapValidationError` | export | Fehlerklasse mit aggregierter `errors`-Liste |

Gespiegelt in `.githooks/map-schema-check.py` (Python, `--all --strict`).

## Bestehende Kartendaten
Datei: `src/data/maps/teststadt.json` — 10-Knoten-Fixture, deckt alle
Schemafelder ab (Referenzformat für die neuen Pakete).
