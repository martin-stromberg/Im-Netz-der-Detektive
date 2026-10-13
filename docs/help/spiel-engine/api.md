← [Zurück zur Übersicht](index.md)

# Spiel-Engine — API

## Übersicht

Die Engine besteht aus reinen Funktionsmodulen unter `src/logic/` und
dem Zustand-Store unter `src/state/`. Alle Module sind React-frei und
deterministisch; Zufall kommt ausschließlich aus `createRng(seed)`
(`Math.random()` ist in `src/logic/` per Git-Hook verboten).

## Authentifizierung

Keine — lokale Modul-API.

## Rate Limiting

Keine.

## Endpunkte / Methoden

### `rng.ts` — `createRng(seed: number): Rng`

**Beschreibung:** Erzeugt den zentralen Seeded-RNG (mulberry32).
Gleicher `seed` → identische Folge.

**Rückgabe:**

| Typ | Beschreibung |
|-----|--------------|
| `Rng` | `{ next(): number`, `nextInt(minInclusive, maxExclusive): number`, `pick<T>(items): T`, `shuffle<T>(items): T[] }` |

**Fehler:**

| Exception | Ursache |
|-----------|---------|
| `RangeError` | `nextInt` mit leerem Bereich; `pick` auf leerer Liste |

### `mapPack.ts` — `validateMapPack(data: unknown): MapPack`

**Beschreibung:** Validiert Roh-JSON vollständig gegen das
Kartenpaket-Schema (Spiegel von `.githooks/map-schema-check.py`) und
gibt es als `MapPack` getypt zurück.

**Fehler:**

| Exception | Ursache |
|-----------|---------|
| `MapValidationError` | beliebige Schema-Verletzung; `errors` enthält **alle** Funde im Format `pfad: meldung` |

### `MapLoader.ts` — `loadMap(id: string): MapPack`

**Beschreibung:** Lädt das gebündelte Paket `src/data/maps/<id>.json`
(synchron, via `import.meta.glob`) und validiert es.

**Fehler:**

| Exception | Ursache |
|-----------|---------|
| `MapValidationError` | unbekannte `id` (Meldung enthält `listMapIds()`); Schema-Verletzung des Pakets |

### `MapLoader.ts` — `listMapIds(): string[]`

**Beschreibung:** Sortierte IDs aller gebündelten Kartenpakete.

### `Graph.ts` — `buildGraph(map: MapPack): Graph`

**Beschreibung:** Ungerichteter, ungewichteter Graph aus `edges[]`
(`cost` reserviert/ignoriert).

### `Graph.ts` — `neighbors(graph, nodeId): string[]`

**Beschreibung:** Direkte Nachbar-IDs; leer für unbekannte Knoten.

### `Graph.ts` — `bfsDistances(graph, from): Map<string, number>`

**Beschreibung:** BFS-Kantendistanzen zu allen erreichbaren Knoten;
`from` → `0`, Unerreichbare/Unbekannte fehlen.

### `Graph.ts` — `distance(graph, from, to): number`

**Beschreibung:** Kantendistanz; `0` bei identischen Knoten,
`Infinity` bei Nichterreichbarkeit oder unbekannten IDs.

### `SpawnSystem.ts`

| Methode | Beschreibung |
|---------|--------------|
| `spawnSequence(map, detectiveCount?)` | Platzierreihenfolge: alle Detektive vor `"ganove"` |
| `detectiveSpawnChoices(map)` | Kandidaten für Detektive (`choice` → `nodes`/`zones`, sonst alle Knoten) |
| `ganoveSpawnChoices(map, detectivePositions)` | Kandidaten für den Ganoven, um `minDistanceToDetective` (BFS) gefiltert |
| `pickDetectiveSpawns(map, rng, count)` | deterministische Vergabe ohne Wiederholung (Pool füllt sich bei Bedarf nach) |
| `pickGanoveSpawn(map, rng, detectivePositions)` | deterministischer Ganoven-Start; `SpawnError` bei leerer Kandidatenmenge |
| `assignSpawns(map, rng, detectiveCount?)` | vollständige Aufstellung in `spawnSequence`-Reihenfolge |

**Fehler:**

| Exception | Ursache |
|-----------|---------|
| `SpawnError` | `choice` ohne auflösbare Kandidaten; kein Ganoven-Kandidat erfüllt `minDistanceToDetective`; vom Store übergebene Position verletzt die Startregeln |

### `useGameStore` (`src/state/gameStore.ts`) — State-Felder

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `map` | `MapPack \| null` | geladenes Kartenpaket |
| `round` | `number` | aktuelle Runde, Start `1` |
| `phase` | `"ganove" \| "detektive"` | aktive Rundenphase |
| `activeDetectiveIndex` | `number` | Zugindex innerhalb der Detektivphase |
| `ganovePosition` | `string \| null` | Knoten-ID des Ganoven |
| `detektivePositions` | `string[]` | Knoten-IDs der Detektive |
| `mission` | `Mission \| null` | `{ id, targetNodes, currentStepIndex }` |
| `events` | `GameEvent[]` | eingetragene Ereignisse/Hinweise |
| `cameras` | `Camera[]` | `{ nodeId, active }` |
| `blockedEdges` | `BlockedEdge[]` | `{ a, b, untilRound }` (inklusive) |
| `eventMode` | `EventMode` | `cycle`/`chance`/`tension` |
| `tensionValue` | `number` | Spannungswert für `tension`-Modus |
| `seed` | `number` | Seed der laufenden Partie |
| `log` | `LogEntry[]` | sequenziertes Aktionsprotokoll |

### `useGameStore` — Actions

| Action | Wirkung |
|--------|---------|
| `startGame(map, seed, options?)` | setzt Map/Seed/`eventMode`, vergibt Startpositionen (explizite `detectivePositions`/`ganovePosition` werden gegen `SpawnSystem` validiert, fehlende per `createRng(seed)` ergänzt) und schreibt den `header`-Logeintrag |
| `resetGame()` | setzt den kompletten Daten-Zustand zurück |
| `appendLog({ round, type, details? })` | hängt einen `LogEntry` mit auto-`seq` an |
| `endGanovePhase()` | `phase` → `detektive`, `activeDetectiveIndex` → `0` (No-Op außerhalb) |
| `advanceDetective()` | `activeDetectiveIndex` +1 (nur in `detektive`-Phase) |
| `endDetectivePhase()` | `phase` → `ganove`, `round` +1 (No-Op außerhalb) |
| `setMission(mission)` | Mission setzen/löschen |
| `addEvent(event)` | Ereignis an `events` anhängen |
| `setCameras(nodeIds)` | Kameras (aktiv) auf Knoten setzen |
| `blockEdge(a, b, untilRound)` | Kante bis `untilRound` sperren |
| `unblockExpiredEdges()` | abgelaufene Sperrungen (`untilRound < round`) entfernen |
| `setTension(value)` | `tensionValue` setzen |
| `setEventMode(mode)` | `eventMode` setzen |

**Beispiel (headless):**

```ts
const map = loadMap("teststadt");
useGameStore.getState().startGame(map, 42);
useGameStore.getState().endGanovePhase();
useGameStore.getState().endDetectivePhase(); // round === 2
```
