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

### `Movement.ts` — Bewegungsregeln (rein, deterministisch)

`MoveContext` = `{ graph, round, blockedEdges, ganovePosition,
detektivePositions }`; `MoveTarget` = `{ nodeId, edgeType }`.

| Methode | Beschreibung |
|---------|--------------|
| `isEdgeBlocked(a, b, blockedEdges, round)` | `true`, wenn die Kante `a`–`b` in `round` gesperrt ist (`untilRound >= round`, beide Richtungen) |
| `legalMovesFrom(ctx, nodeId)` | ungesperrte Nachbarziele inkl. `edgeType`; eigener Knoten nie enthalten (Zugzwang) |
| `legalGanoveMoves(ctx)` | `legalMovesFrom` abzüglich Detektiv-besetzter Knoten |
| `legalDetectiveMoves(ctx, detectiveIndex)` | `legalMovesFrom` des Detektivs — besetzte Knoten bleiben legal (Teilen); `[]` bei ungültigem Index |
| `validateGanoveMove(ctx, target)` | liefert `MoveTarget` oder wirft `MoveError` (`stay_forbidden`/`not_adjacent`/`blocked_edge`/`occupied`) |
| `validateDetectiveMove(ctx, detectiveIndex, target)` | wie oben plus `not_active_detective`; ohne `occupied` |
| `mapEscapeNodeIds(map)` | IDs aller Knoten mit Kategorie `flucht` |

`MoveError.reason` ist ein maschinenlesbarer `MoveRejection`-Code
(`no_game`, `game_over`, `wrong_phase`, `not_active_detective`,
`stay_forbidden`, `not_adjacent`, `blocked_edge`, `occupied`,
`no_action_available`).

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
| `outcome` | `GameOutcome \| null` | `caught`/`surrounded`/`escaped`/`timeout`/`draw`; `null` solange die Partie läuft |
| `roundLimit` | `number \| null` | effektives Rundenlimit; `null` = unbegrenzt |
| `escapeNodeIds` | `string[]` | Fluchtpunkte (Init: Kategorie `flucht`; Missions-Hook: `setEscapeNodeIds`) |
| `ganoveCanAct` | `boolean` | Missionssystem-Hook: darf der Ganove diese Runde eine Aktion ausführen? |

### `useGameStore` — Actions

| Action | Wirkung |
|--------|---------|
| `startGame(map, seed, options?)` | setzt Map/Seed/`eventMode`, vergibt Startpositionen (explizite `detectivePositions`/`ganovePosition` werden gegen `SpawnSystem` validiert, fehlende per `createRng(seed)` ergänzt), löst `roundLimit` aus `options.roundLimit` bzw. `settings.roundLimit.suggested` auf (`null` nur bei `unlimited`), initialisiert `escapeNodeIds` aus der `flucht`-Kategorie, schreibt den `header`-Logeintrag und prüft die initiale Umzingelung |
| `resetGame()` | setzt den kompletten Daten-Zustand zurück |
| `appendLog({ round, type, details? })` | hängt einen `LogEntry` mit auto-`seq` an |
| `moveGanove(target)` | validierter Ganovenzug (`MoveError` bei Regelverstoß); Fluchtpunkt → `outcome "escaped"`, sonst Detektivphase |
| `moveDetective(target)` | Zug des aktiven Detektivs; Sofort-Fangprüfung (`outcome "caught"` mitten in der Phase); letzter Detektiv → Rundenende |
| `ganoveAction()` | Aktionsrunde (Zugzwang-Ausnahme, erfordert `ganoveCanAct`); Ganove bleibt stehen und fangbar |
| `abortAsDraw()` | beendet die laufende Partie als `outcome "draw"` |
| `getLegalGanoveMoves()` / `getLegalDetectiveMoves()` | legale Ziele (`MoveTarget[]`) des Ganoven / des aktiven Detektivs; `[]` außerhalb der jeweiligen Phase oder nach Spielende |
| `setEscapeNodeIds(ids)` | überschreibt die Fluchtpunktliste (missionsgebundene Flucht); `GameConfigError` bei unbekannten IDs |
| `setGanoveCanAct(flag)` | Missionssystem-Hook für die Aktionsverfügbarkeit |
| `endGanovePhase()` | `phase` → `detektive`, `activeDetectiveIndex` → `0` (No-Op außerhalb) |
| `advanceDetective()` | `activeDetectiveIndex` +1 (nur in `detektive`-Phase) |
| `endDetectivePhase()` | Rundenende-Sequenz: Timeout (`round >= roundLimit` → `outcome "timeout"`), sonst `round` +1, Kanten-Ablauf, Umzingelungsprüfung |
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
useGameStore.getState().moveGanove("c");          // Ganovenphase Runde 1
useGameStore.getState().moveDetective("b");       // D1
useGameStore.getState().moveDetective("h");       // letzter Detektiv -> Runde 2
// ... bis outcome !== null: "caught" | "surrounded" | "escaped" | "timeout" | "draw"
```
