# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Gültige Test-Kartenpakete laden fehlerfrei | `loadMap` + Registry (`import.meta.glob`), Fixture `teststadt.json` | `MapLoader.test.ts` (loadMap „teststadt", listMapIds) | Abgedeckt |
| Ungültige Pakete mit verständlicher Fehlermeldung abgelehnt (Pflichtfelder, Kantentypen, Referenzfehler) | `validateMapPack` aggregiert pfadgenaue Fehler, `MapValidationError`; Validierungsregeln-Tabelle | `mapPack.test.ts` (fehlende Pflichtfelder, ungültiger Kantentyp, Referenzfehler, doppelte IDs, Range-/Spawn-/Settings-Fehler); `MapLoader.test.ts` (unbekannte ID) | Abgedeckt |
| BFS-Distanzen auf Fixture-Graphen nachweisbar korrekt | `Graph.buildGraph`/`bfsDistances`/`distance` auf ungerichtetem Fixture-Graphen | `Graph.test.ts` (bekannte Distanzen inkl. `fahrt`-Kante, a→a=0, Nichterreichbarkeit) | Abgedeckt |
| Gleicher Seed → identische Zufallsfolgen und identische Startaufstellungen; verschiedene Seeds variieren | `createRng` (mulberry32), `assignSpawns(rng)`, `startGame(map, seed)` | `rng.test.ts` (Determinismus/Variation), `SpawnSystem.test.ts` + `gameStore.test.ts` (identische Aufstellung bei gleichem Seed) | Abgedeckt |
| Alle drei Spawn-Modi funktionieren; Reihenfolge Detektive-vor-Ganove erzwungen | `spawnSequence`/`detectiveSpawnChoices`/`assignSpawns`; `order` als Schema-Pflicht | `SpawnSystem.test.ts` (choice/free/random, Sequenz) | Abgedeckt |
| Kein angebotener Ganoven-Startpunkt unterschreitet `minDistanceToDetective` | `ganoveSpawnChoices` filtert modusübergreifend per BFS-Distanz | `SpawnSystem.test.ts` (Mindestabstand-Filter, leere Kandidaten → `SpawnError`) | Abgedeckt |
| Store headless instanziier- und treibbar | `useGameStore` ohne React-Abhängigkeit, imperative Actions | `gameStore.test.ts` (getState/setState, startGame, Phasenmaschine) | Abgedeckt |

## Fehlende oder unvollständige Testanforderungen

— (Status `Plan vollständig`)

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Kein Benutzerfluss vorhanden | — | Nicht erforderlich mit Begründung: Die Anforderung ist ausdrücklich UI-frei (headless Engine); kein neuer/geänderter UI-Flow. App-Shell bleibt durch bestehenden `App.test.tsx` abgesichert. |

## Fehlende oder unvollständige Planbestandteile

— (Status `Plan vollständig`)

## Hinweise

- Der Laufzeit-Validator muss exakt dem Hook `map-schema-check.py`
  entsprechen (dokumentiert in `inventory/schema.md`), damit
  Commit-Check und Engine-Validierung nicht divergieren.
- `import.meta.glob` erfordert die Vite-Client-Typen
  (`src/vite-env.d.ts` vorhanden) und funktioniert unter Vitest.
