# Tasks: Engine-Grundgerüst (Kartenpakete, Graph, RNG, Startaufstellung, State)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Engine | `src/logic/rng.ts` mit `createRng` (mulberry32) anlegen | Erledigt | `rng.test.ts` (Determinismus, Wertebereiche, pick/shuffle) |
| 2 | Engine | `src/logic/mapPack.ts` mit `MapPack`-Typen anlegen | Erledigt | `mapPack.test.ts` (gültiges Paket passiert) |
| 3 | Engine | `validateMapPack` + `MapValidationError` in `mapPack.ts` implementieren | Erledigt | `mapPack.test.ts` (14 Tests: Pflichtfelder, Kantentypen, Referenzen, Ranges, Settings) |
| 4 | Engine | `src/logic/Graph.ts` mit `buildGraph`/`neighbors`/`bfsDistances`/`distance` anlegen | Erledigt | `Graph.test.ts` (BFS-Distanzen, bidirektionale Nachbarn, Infinity-Fälle) |
| 5 | Daten | `src/data/maps/teststadt.json` (gültige Fixture-Karte) anlegen | Erledigt | `MapLoader.test.ts` (`loadMap("teststadt")`), `map-schema-check.py --all` |
| 6 | Engine | `src/logic/MapLoader.ts` mit `loadMap`/`listMapIds` anlegen | Erledigt | `MapLoader.test.ts` |
| 7 | Engine | `src/logic/SpawnSystem.ts` mit Spawn-Funktionen + `SpawnError` anlegen | Erledigt | `SpawnSystem.test.ts` (19 Tests: Modi, Reihenfolge, Mindestabstand, Determinismus) |
| 8 | State | `gameStore.ts` um State-Felder + Typen + Actions erweitern | Erledigt | `gameStore.test.ts` (Initialzustand, startGame, Actions) |
| 9 | State | `advanceRound`-Action durch Phasenmaschine ersetzen | Erledigt | `gameStore.test.ts` („walks ganove phase -> detektive phase -> next round") |
| 10 | Cleanup | `placeholder.ts` + `placeholder.test.ts` entfernen | Erledigt | `npm test` grün ohne die Dateien |
| 11 | Tests | `rng.test.ts` schreiben | Erledigt | 9 Tests grün |
| 12 | Tests | `mapPack.test.ts` schreiben | Erledigt | 14 Tests grün |
| 13 | Tests | `MapLoader.test.ts` schreiben | Erledigt | 3 Tests grün |
| 14 | Tests | `Graph.test.ts` schreiben | Erledigt | 7 Tests grün |
| 15 | Tests | `SpawnSystem.test.ts` schreiben | Erledigt | 19 Tests grün |
| 16 | Tests | `gameStore.test.ts` erweitern/anpassen | Erledigt | 13 Tests grün |
