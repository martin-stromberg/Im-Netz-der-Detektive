# Übersetzte Anforderung: Schritt 2 — Engine-Grundgerüst

> Quelle: Kundenanforderung Entwicklungsschritt 2 des Projekts
> „Im Netz der Detektive" (siehe `docs/projects/task/issue-2-…/steps.md`).
> Verbindliche Spezifikation: `docs/konzept/content/02-technisches-konzept.md`
> §3 (State), §4 (Kartenpaket-Format), §5 (Modul-Logik) sowie
> `docs/konzept/content/01-spielkonzept.md` §2/§3 (Spielfeld, Startaufstellung).

## Fachliche Zusammenfassung

Der headless-fähige Spielkern des Spiels wird ohne jede UI implementiert.
Der Kern kann **Kartenpakete laden und vollständig validieren**, liefert
**Graph-Grundfunktionen** (Nachbarschaften, BFS-Kantendistanzen), einen
zentralen **deterministischen Seeded-RNG** als einzige Zufallsquelle aller
Engine-Module sowie das **Startaufstellungs-System** gemäß den
`spawnRules` des Kartenpakets (Modi `choice`/`free`/`random`, Reihenfolge
Detektive vor Ganove, `minDistanceToDetective`). Zusätzlich wird der
Zustand-Store um die im technischen Konzept §3 spezifizierten
State-Felder und imperative Actions erweitert — lauffähig ohne React.

## Betroffene Klassen und Komponenten

### Datenmodell / Typen

- `MapPack`-Typsystem (neu, z. B. `src/logic/mapPack.ts` oder
  `src/types/`): `MapNode` (`id`, `name`, `x`, `y`, `categories[]`,
  `zone`), `MapEdge` (`a`, `b`, `type: "weg" | "fahrt"`, optionales
  reserviertes `cost`), `SpawnRules` (`detectives`, `ganove`,
  `order: "detektive_first"`), `SpawnRule` (`mode: "choice" | "free" |
  "random"`, optionale `nodes`/`zones`, optionales
  `minDistanceToDetective`), `Settings` (Range-Objekte
  `{ suggested, min, max }` für `detectiveCount`, `cameraCount`,
  `radioHintCount`, `edgeBlockRounds`; `roundLimit` mit optionalem
  `unlimited`; feste Skalare `cameraMinGap`, `hintZoneRadius`;
  `eventMode: "cycle" | "chance" | "tension"`, `eventDefaults`,
  `eventMix`, `missionRules`, `sabotageEffects`), `MapPack`
  (`id`, `name`, `tagline`, `viewBox`, `nodes[]`, `edges[]`,
  `spawnRules`, `settings`).

### Logikklassen / Services (neu, unter `src/logic/`)

- `rng.ts` — zentraler Seeded-RNG (z. B. `mulberry32`); gleicher Seed →
  identische Folge. Einzige Zufallsquelle; `Math.random()` in
  `src/logic/` ist durch den Hook `no-math-random-check.py` verboten.
- `MapLoader.ts` — `loadMap(id)` lädt ein Kartenpaket aus
  `src/data/maps/`, validiert es vollständig und meldet Fehler
  verständlich (fehlende Pflichtfelder, ungültige Kantentypen,
  Referenzfehler auf nicht vorhandene Knoten-IDs, unbekannte
  Paket-ID). Der Validierer spiegelt das im Hook
  `map-schema-check.py` definierte Schema.
- `Graph.ts` — Nachbarschaftsabfragen (`neighbors(nodeId)`) und
  BFS-Kantendistanzen (`distance(a, b)`, Distanzmatrix) auf dem
  Kartenpaket-Graphen.
- `SpawnSystem.ts` — Startaufstellung: Detektive immer zuerst, Ganove
  zuletzt; `choice` → Angebot der erlaubten Knotenliste,
  `free` → alle Knoten mit Mindestabstand zu bereits platzierten
  Detektiven, `random` → Vergabe per RNG. Kein angebotener
  Ganoven-Startpunkt unterschreitet `minDistanceToDetective`.

### State

- `src/state/gameStore.ts` — Erweiterung des Zustand-Stores um die
  spezifizierten Felder: `round`, `phase` (`"ganove" | "detektive"`),
  `activeDetectiveIndex`, `ganovePosition`, `detektivePositions[]`,
  `mission`, `events[]`, `cameras[]`, `blockedEdges[]`, `eventMode`,
  `tensionValue`, `seed`, `log[]` sowie imperative Actions
  (u. a. Initialisierung aus Kartenpaket + Startaufstellung, Runden-
  und Phasenwechsel, Log-Anhang). Der Store bleibt headless (ohne
  React instanziier- und treibbar).

### Testdaten / Fixtures

- Gültige Test-Kartenpakete unter `src/data/maps/` (für Loader- und
  Spawn-Tests nutzbar; Fixture-Graph mit bekannter BFS-Topologie).

### Tests

- Loader-Tests (gültige Pakete laden; ungültige Pakete mit
  verständlicher Meldung abgelehnt: fehlende Pflichtfelder, ungültige
  Kantentypen, Referenzfehler, unbekannte Map-ID).
- Graph-Tests (Nachbarschaften, BFS-Distanzen auf Fixture-Graph).
- RNG-Tests (Determinismus bei gleichem Seed, Variation bei
  verschiedenen Seeds).
- SpawnSystem-Tests (alle drei Modi, Reihenfolge Detektive-vor-Ganove,
  Mindestabstand eingehalten, deterministische Aufstellung bei
  gleichem Seed).
- Store-Tests (headless instanziierbar und treibbar).

## Implementierungsansatz

- Neues Engine-Modul-Verzeichnis entsteht organisch in `src/logic/`
  (die Scaffold-Datei `placeholder.ts` samt Test wird durch die echte
  Struktur ersetzt).
- Kartenpakete liegen als JSON unter `src/data/maps/` und werden per
  statischem Import/Glob (`import.meta.glob` oder direkter Import)
  eingebunden, damit sie im Build gebündelt sind; `loadMap(id)`
  validiert das Roh-JSON gegen das `MapPack`-Schema und wirft einen
  `MapValidationError` mit klarer Feldliste.
- Der Schema-Abgleich folgt exakt dem Python-Hook
  `map-schema-check.py` (gleiche Pflichtfelder und Wertebereiche), damit
  Hook-Check und Runtime-Validierung konsistent sind.
- Zustand-Store: Zustand `create<…>` mit Datenfeldern + Actions;
  Actions mutieren ausschließlich über `set()`. Headless-Nutzung via
  `useGameStore.getState()` / `setState()` — kein React-Import nötig.
- UI bleibt unverändert: `App.tsx` rendert weiterhin die Shell und
  nutzt `round` aus dem Store; `App.test.tsx` muss grün bleiben.
- Keine neuen sichtbaren UI-Texte → keine neuen i18n-Schlüssel nötig.

## Konfiguration

- Keine neue Konfigurationsebene. Die map-abhängigen Werte sind bereits
  Eigenschaften der Kartenpakete (`settings`); globale Spielregeln
  (Rundenstruktur, Fangbedingungen) sind explizit nicht Teil der Pakete
  und bleiben Konstanten der Engine.

## Akzeptanzkriterien (aus der Kundenanforderung)

1. Gültige Test-Kartenpakete laden fehlerfrei; ungültige Pakete werden
   mit verständlicher Fehlermeldung abgelehnt (fehlende Pflichtfelder,
   ungültige Kantentypen, Referenzfehler).
2. BFS-Distanzen auf Fixture-Graphen nachweisbar korrekt.
3. Gleicher Seed produziert identische Zufallsfolgen und identische
   Startaufstellungen; verschiedene Seeds variieren.
4. Alle drei Spawn-Modi funktionieren; Reihenfolge Detektive-vor-Ganove
   erzwungen; kein angebotener Ganoven-Startpunkt unterschreitet
   `minDistanceToDetective`.
5. Store lässt sich headless (ohne UI) instanziieren und treiben.

## Offene Fragen

- Keine — Format, Feldnamen und Wertebereiche sind durch
  `02-technisches-konzept.md` §4 und den Schema-Hook eindeutig
  vorgegeben. Annahme: `loadMap(id)` deckt nur im Repo gebündelte
  Pakete ab (statischer Import); ein Fetch zur Laufzeit ist nicht
  vorgesehen.
