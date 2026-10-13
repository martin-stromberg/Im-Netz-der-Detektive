# Umsetzungsplan: Engine-Grundgerüst (Kartenpakete, Graph, RNG, Startaufstellung, State)

## Übersicht

Implementierung des headless-fähigen Spielkerns ohne UI: `MapPack`-
Typsystem mit Laufzeit-Validierung, `MapLoader.loadMap(id)`,
Graph-Grundfunktionen (Nachbarschaft, BFS-Distanzen), zentraler
Seeded-RNG (`rng.ts`), `SpawnSystem` (choice/free/random,
Detektive-vor-Ganove, Mindestabstand) und Erweiterung des
`useGameStore` um alle in `02-technisches-konzept.md` §3 spezifizierten
State-Felder mit imperativen Actions. Scaffold-Dateien
`placeholder.ts`/`placeholder.test.ts` werden durch die echte
Engine-Struktur ersetzt; `App.tsx`/`App.test.tsx` bleiben funktional
unverändert (Shell rendert weiter `Runde 1`).

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Kartenpaket-Binding | Statisches `import.meta.glob("../data/maps/*.json", { eager: true, import: "default" })` im `MapLoader` | Pakete werden in den Build gebündelt (kein Fetch), `loadMap(id)` ist synchron; Vitest verarbeitet `import.meta.glob` nativ. Laufzeit-Nachladen ist nicht gefordert. |
| Validierung | `validateMapPack(data: unknown)` in `mapPack.ts`, spiegelt exakt den Hook `map-schema-check.py`; sammelt **alle** Fehler und wirft `MapValidationError` mit Feldliste | „Verständliche Fehlermeldung" wird durch aggregierte, pfadgenaue Meldungen erfüllt; ein Schema, zwei Enforcer (Hook + Laufzeit) bleiben konsistent. |
| Graph | Ungerichteter ungewichteter Graph aus `edges[]`; `cost` reserviert (ignoriert). BFS liefert Kantendistanzen (`number`, `Infinity` bei Nichterreichbarkeit) | Spec §2: Kanten sind Wege zwischen Orten ohne Richtungsangabe; BFS-Kantendistanzen sind das geforderte Maß für Missions-/Spawn-Kriterien. |
| RNG | `createRng(seed)` (mulberry32) mit `next()`, `nextInt(minInclusive, maxExclusive)`, `pick()`, `shuffle()` — Interface-Typ `Rng`, überall injizierbar | Spec §5 nennt mulberry32 explizit; Injektion statt Singleton hält Engine-Module deterministisch testbar und den Store seedbar. |
| SpawnSystem | Reine Funktionen: `detectiveSpawnChoices(map)`, `ganoveSpawnChoices(map, detektivePositionen)`, `assignSpawns(map, rng, detectiveCount)`; `choice` akzeptiert `nodes` und `zones` (Zonen → Knotenmenge); Ganoven-Kandidaten werden in **jedem** Modus nach `minDistanceToDetective` gefiltert | „Positionen unterhalb Mindestabstand werden nie angeboten" gilt modusübergreifend; reine Funktionen lassen Store und UI (später) dieselbe Quelle nutzen. |
| Store-Erweiterung | `useGameStore` behält `create<GameState>`; neue Felder als Daten + Actions als `set()`-Mutatoren; spawn-Validierung delegiert an `SpawnSystem` | Bestehende Konvention (Schritt 1) bleibt; Store bleibt React-frei treibbar. |
| `mission`/`events`/`cameras`/`blockedEdges`-Typen | Minimale strukturierte Interfaces in `gameStore.ts` (`Mission`, `GameEvent`, `Camera`, `BlockedEdge`, `LogEntry`) | Felder sind Pflichtbestand des States; inhaltliche Engines kommen erst in Schritten 5/6 — Struktur nur so weit typisieren, wie §3/§8 sie festlegen. |

## Programmabläufe

### Kartenpaket laden und validieren

1. `loadMap(id)` sucht im Map-Registry (`import.meta.glob`) nach `<id>.json`.
2. Unbekannte ID → `MapValidationError` („unknown map id", Liste verfügbarer IDs).
3. Gefundene Rohdaten → `validateMapPack(data)` prüft alle Pflichtfelder,
   Wertebereiche und Referenzen; bei Verletzungen `MapValidationError`
   mit sämtlichen Funden.
4. Valides Paket wird als `MapPack` zurückgegeben.

Beteiligte: `MapLoader.loadMap`, `validateMapPack`, `MapValidationError`.

### BFS-Distanzen

1. `buildGraph(map)` erzeugt Adjazenzliste aus `edges[]` (beide Richtungen).
2. `bfsDistances(graph, from)` läuft Queue-BFS und liefert `Map<nodeId, dist>`.
3. `distance(map|graph, a, b)` greift auf die Distanz zu (`Infinity` bei
   Nichterreichbarkeit, `0` bei `a === b`).
4. `neighbors(graph, nodeId)` liefert die direkten Nachbar-IDs.

Beteiligte: `Graph.buildGraph`, `Graph.bfsDistances`, `Graph.distance`, `Graph.neighbors`.

### Deterministischer Zufall

1. `createRng(seed)` initialisiert den internen 32-Bit-Zustand aus `seed`.
2. `next()` liefert Float `[0, 1)`; `nextInt(min, maxExclusive)` ganze Zahl;
   `pick(items)` wählt Element; `shuffle(items)` liefert neue,
   deterministisch permutierte Kopie.
3. Gleiche Seeds → identische Folgen; verschiedene Seeds → unterschiedliche
   Folgen (mit ausreichender Wahrscheinlichkeit, durch Test abgesichert).

Beteiligte: `rng.createRng`, Konsument `SpawnSystem.assignSpawns`, `gameStore.startGame`.

### Startaufstellung

1. `spawnSequence(map)` erzwingt `order: "detektive_first"` → Sequenz
   `N × "detective"`, dann `"ganove"`.
2. `detectiveSpawnChoices(map)`: `choice` → `nodes` ∪ Knoten der `zones`;
   `free`/`random` → alle Knoten.
3. `ganoveSpawnChoices(map, detektivePositionen)`: Kandidaten wie bei
   Detektiven, zusätzlich Filter `bfsDist ≥ minDistanceToDetective` zu
   **jedem** platzierten Detektiv (nur wenn `minDistanceToDetective`
   gesetzt). Leere Menge → `MapValidationError`-artiger `SpawnError`.
4. `assignSpawns(map, rng, count)`: je Modus per `rng.pick` (Detektive ohne
   Wiederholung aus ihren Kandidaten), Ganove zuletzt aus gefilterten
   Kandidaten → `{ detectivePositions, ganovePosition }`, deterministisch
   zum Seed.

Beteiligte: `SpawnSystem.*`, `Graph.*`, `Rng`.

### Spielzustand initialisieren und treiben (headless)

1. `startGame(map, seed, options?)` setzt `map`, `seed`, `eventMode` aus
   `settings`, `round = 1`, `phase = "ganove"`, `tensionValue = 0`,
   leere `events`/`cameras`/`blockedEdges`/`log`.
2. Positionen: explizite `detectivePositions`/`ganovePosition` in
   `options` werden gegen `SpawnSystem` validiert (Reihenfolge
   Detektive → Ganove, Mindestabstand); fehlende Angaben werden per
   `createRng(seed)` + `assignSpawns` ergänzt → identische
   Startaufstellung bei gleichem Seed.
3. `appendLog(entry)` hängt einen `LogEntry` an `log`.
4. Phasenaktionen: `endGanovePhase()` → `phase = "detektive"`,
   `activeDetectiveIndex = 0`; `advanceDetective()` erhöht den Index;
   `endDetectivePhase()` → `phase = "ganove"`, `round + 1`.
5. Mutatoren `setMission`, `addEvent`, `setCameras`, `blockEdge` /
   `unblockExpiredEdges(round)`, `setTension`, `setEventMode` liefern die
   imperativen Eingriffe für spätere Engine-Schritte.

Beteiligte: `useGameStore`, `SpawnSystem`, `rng.createRng`, `MapPack`.

## Neue Module

| Datei | Typ | Zweck |
|-------|-----|-------|
| `src/logic/rng.ts` | Modul | `createRng(seed)` (mulberry32), Typ `Rng` |
| `src/logic/mapPack.ts` | Modul | `MapPack`-Typsystem, Schema-Konstanten, `MapValidationError`, `validateMapPack()` |
| `src/logic/MapLoader.ts` | Modul | `loadMap(id)`, `listMapIds()` — Registry über `src/data/maps/*.json` |
| `src/logic/Graph.ts` | Modul | `buildGraph`, `neighbors`, `bfsDistances`, `distance` |
| `src/logic/SpawnSystem.ts` | Modul | `detectiveSpawnChoices`, `ganoveSpawnChoices`, `spawnSequence`, `assignSpawns`, `SpawnError` |
| `src/data/maps/teststadt.json` | Kartenpaket-Fixture | Kleine gültige Testkarte (~10 Knoten, `weg`/`fahrt`) für Loader-, Graph- und Spawn-Tests |

## Änderungen an bestehenden Dateien

### `src/state/gameStore.ts` (Store)

- **Neue Felder:** `map: MapPack | null`, `phase: "ganove" | "detektive"`,
  `activeDetectiveIndex: number`, `ganovePosition: string | null`,
  `detektivePositions: string[]`, `mission: Mission | null`,
  `events: GameEvent[]`, `cameras: Camera[]`,
  `blockedEdges: BlockedEdge[]`, `eventMode: EventMode`,
  `tensionValue: number`, `seed: number`, `log: LogEntry[]`
- **Neue Typen (exportiert):** `Mission`, `GameEvent`, `Camera`,
  `BlockedEdge`, `LogEntry`, `EventMode`, `GamePhase`
- **Neue Actions:** `startGame`, `appendLog`, `endGanovePhase`,
  `advanceDetective`, `endDetectivePhase`, `setMission`, `addEvent`,
  `setCameras`, `blockEdge`, `unblockExpiredEdges`, `setTension`,
  `setEventMode`, `resetGame`
- **Geändert:** `advanceRound` — wird durch `endDetectivePhase`
  (Rundenfortschritt mit Phasenwechsel) ersetzt; die alte Action
  entfällt, da die Runde phasengebunden ist. `gameStore.test.ts` wird
  entsprechend angepasst.

### `src/logic/placeholder.ts` / `src/logic/placeholder.test.ts`

- **Entfernt** — durch die echte Engine-Struktur ersetzt (vom Auftrag
  ausdrücklich erlaubt). `advanceRound` im Store benötigt den
  Placeholder-Import nicht mehr.

## Datenbankmigrationen

Keine.

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `MapPack` Top-Level | `id`, `name`, `viewBox` nicht-leere Strings; `nodes`/`edges` nicht-leere Arrays; `spawnRules`/`settings` Objekte | `MapValidationError` mit allen Funden |
| `nodes[]` | `id` eindeutiger nicht-leerer String; `name`/`zone` nicht-leer; `x`/`y` Zahlen; `categories` ⊆ diebstahl/kontakt/sabotage/flucht, nicht-leer | `MapValidationError` |
| `edges[]` | `a`/`b` referenzieren vorhandene Node-IDs; `type` ∈ `weg`/`fahrt`; `cost` optional Zahl | `MapValidationError` (Referenzfehler verständlich benannt) |
| `spawnRules` | `order === "detektive_first"`; `detectives`/`ganove` mit `mode` ∈ choice/free/random; `choice` verlangt `nodes` (gültige IDs, nicht-leer) oder `zones`; `minDistanceToDetective` optional Zahl | `MapValidationError` |
| `settings` | Range-Objekte `{suggested,min,max}` mit `min ≤ suggested ≤ max` für `detectiveCount`,`cameraCount`,`radioHintCount`,`edgeBlockRounds`; `roundLimit` alternativ `unlimited: true`; Skalare `cameraMinGap`,`hintZoneRadius` Zahlen; `eventMode` ∈ cycle/chance/tension; `eventDefaults`/`eventMix`/`missionRules` Zahlenfelder; `sabotageEffects` ⊆ kamera_aus/funkstille/falsche_spur | `MapValidationError` |
| `loadMap(id)` | ID muss im Registry vorhanden sein | `MapValidationError` „unknown map id … (available: …)" |
| `startGame`-Positionen | Detektivpositionen ⊆ `detectiveSpawnChoices`; Ganovenposition ∈ `ganoveSpawnChoices` (Mindestabstand) | `SpawnError` |

## Konfigurationsänderungen

Keine.

## Seiteneffekte und Risiken

- **`gameStore.test.ts`:** `advanceRound`-Action entfällt → Test wird
  angepasst (Rundenfortschritt via `endGanovePhase`/`endDetectivePhase`).
  `App.test.tsx` bleibt unverändert grün (liest nur `round`, Start 1).
- **`App.tsx`:** nutzt weiterhin `round` + `PlaceholderPanel` — keine
  Änderung nötig; `component-usage-check` bleibt sauber.
- **Hook `map-schema-check.py`:** `teststadt.json` wird bei Commits
  validiert → Fixture muss das volle Schema erfüllen.
- **`import.meta.glob`:** funktioniert unter Vite-Build und Vitest;
  `tsc --noEmit` benötigt Vite-Client-Typen (`vite-env.d.ts` vorhanden).
- **Coverage:** Engine-Module erhalten umfangreiche Tests — 70-%-Schwelle
  unproblematisch.

## Umsetzungsreihenfolge

1. **`src/logic/rng.ts`** — Voraussetzungen: keine. Seeded-RNG-Modul.
2. **`src/logic/mapPack.ts`** — Voraussetzungen: keine. Typen +
   `validateMapPack` + `MapValidationError` (Schema = Hook-Spiegel).
3. **`src/logic/Graph.ts`** — Voraussetzungen: `mapPack.ts` (Typen).
4. **`src/logic/MapLoader.ts`** — Voraussetzungen: `mapPack.ts`,
   `teststadt.json` (Registry braucht mindestens ein Paket).
5. **`src/data/maps/teststadt.json`** — Voraussetzungen: `mapPack.ts`
   (Schema-Vorgaben). Muss Hook-Schema erfüllen.
6. **`src/logic/SpawnSystem.ts`** — Voraussetzungen: `mapPack.ts`,
   `Graph.ts`, `rng.ts`.
7. **`src/state/gameStore.ts` erweitern** — Voraussetzungen:
   `mapPack.ts`, `SpawnSystem.ts`, `rng.ts`.
8. **`placeholder.ts`/`placeholder.test.ts` entfernen,
   `gameStore.test.ts` anpassen** — Voraussetzungen: Schritt 7.
9. **Engine-Tests schreiben** (rng, mapPack, MapLoader, Graph,
   SpawnSystem, gameStore) — Voraussetzungen: Schritte 1–8.
10. **`npm run build && npm test && npm run coverage && npm run lint`**
    — Abschlussprüfung.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testdatei | Was wird geprüft |
|---------------------|-----------|------------------|
| `rng.test.ts` | `src/logic/` | gleicher Seed → identische `next()`-Folge; verschiedene Seeds → verschiedene Folgen; `nextInt`-Grenzen; `pick` aus Menge; `shuffle` deterministisch + Inhalt gleich |
| `mapPack.test.ts` | `src/logic/` | gültiges Paket passiert; fehlende Pflichtfelder (`nodes`, `edges`, `spawnRules`, `settings`, `id`) → `MapValidationError` mit Feldname; ungültiger Kantentyp; Kanten-Referenz auf unbekannte Node-ID; doppelte Node-ID; `spawnRules.order` falsch; `choice` ohne `nodes`/`zones`; Range `suggested` außerhalb `[min,max]`; `roundLimit.unlimited` akzeptiert; ungültige `sabotageEffects`; ungültige `categories` |
| `MapLoader.test.ts` | `src/logic/` | `loadMap("teststadt")` liefert validen `MapPack`; `listMapIds` enthält `teststadt`; `loadMap("unbekannt")` → verständlicher Fehler inkl. verfügbarer IDs |
| `Graph.test.ts` | `src/logic/` | `neighbors` bidirektional; `bfsDistances`/`distance` auf Fixture-Graph mit bekannten Distanzen (inkl. `fahrt`-Kante); `distance(a,a) = 0`; unerreichbarer Knoten → `Infinity` |
| `SpawnSystem.test.ts` | `src/logic/` | `spawnSequence` = Detektive vor Ganove; `detectiveSpawnChoices` bei `choice`/`free`/`random`; `ganoveSpawnChoices` filtert unter `minDistanceToDetective`; `assignSpawns` deterministisch bei gleichem Seed, variiert bei verschiedenen; `random`-Modus vergibt Positionen; leere Ganoven-Kandidaten → `SpawnError` |
| `gameStore.test.ts` (erweitert) | `src/state/` | Initialzustand; `startGame` setzt Felder + deterministische Aufstellung; explizite Positionen validiert (ungültig → `SpawnError`); Phasenmaschine `endGanovePhase`→`advanceDetective`→`endDetectivePhase` (round +1); `appendLog`; `blockEdge`/`unblockExpiredEdges`; `addEvent`; `resetGame` |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `src/state/gameStore.test.ts` | `advanceRound`-Action entfällt → Rundenfortschritt über Phasenmaschine testen |
| `src/logic/placeholder.test.ts` | Entfällt mit `placeholder.ts` (echte Struktur ersetzt Scaffold) |

### E2E-Tests (primärer Funktionsnachweis)

**Nicht erforderlich.** Die Anforderung ist explizit UI-frei
(„headless-fähiger Spielkern … ohne jede UI"); es gibt keinen neuen
oder geänderten Benutzerfluss. Die App-Shell bleibt unverändert und ist
durch den bestehenden `App.test.tsx` abgesichert. Alle
Akzeptanzkriterien betreffen Engine- und Store-Verhalten, das per
Unit-/Integrationstests ohne UI vollständig und primär nachweisbar ist.

## Offene Punkte

Keine.
