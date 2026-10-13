# Plan-Review

## Ergebnis

**Status:** Vollständig umgesetzt

## Umgesetzte Planelemente

- [x] `src/logic/rng.ts` (Modul) — `createRng(seed)` (mulberry32) mit `next()`, `nextInt(min,max)`, `pick()`, `shuffle()`; Interface `Rng` exportiert
- [x] `src/logic/mapPack.ts` (Modul) — `MapPack`-Typsystem (`MapNode`, `MapEdge`, `SpawnRule`, `SpawnRules`, `RangeSetting`, `EventDefaults`, `EventMix`, `MissionRules`, `MapSettings`), Schema-Konstanten (`NODE_CATEGORIES`, `EDGE_TYPES`, `SPAWN_MODES`, `EVENT_MODES`, `SABOTAGE_EFFECTS`), `MapValidationError` mit `errors`-Liste, `validateMapPack(data)` als Hook-Spiegel von `map-schema-check.py`
- [x] `src/logic/Graph.ts` (Modul) — `buildGraph`, `neighbors`, `bfsDistances`, `distance` (ungerichtet, ungewichtet; `Infinity` bei Nichterreichbarkeit, `0` bei `a===b`)
- [x] `src/logic/MapLoader.ts` (Modul) — `loadMap(id)` via `import.meta.glob`-Registry, `listMapIds()`, `MapValidationError` bei unbekannter ID inkl. Liste verfügbarer Pakete
- [x] `src/logic/SpawnSystem.ts` (Modul) — `detectiveSpawnChoices`, `ganoveSpawnChoices` (modusübergreifender `minDistanceToDetective`-BFS-Filter), `spawnSequence` (Detektive vor Ganove), `pickDetectiveSpawns`, `pickGanoveSpawn`, `assignSpawns`, `SpawnError`; `choice` unterstützt `nodes` und `zones`
- [x] `src/data/maps/teststadt.json` (Kartenpaket-Fixture) — gültige 10-Knoten-Karte mit `weg`/`fahrt`, vollem `settings`-Block; besteht `map-schema-check.py --all`
- [x] `src/state/gameStore.ts` — alle spezifizierten Felder (`map`, `round`, `phase`, `activeDetectiveIndex`, `ganovePosition`, `detektivePositions`, `mission`, `events`, `cameras`, `blockedEdges`, `eventMode`, `tensionValue`, `seed`, `log`); exportierte Typen `Mission`, `GameEvent`, `Camera`, `BlockedEdge`, `LogEntry`, `EventMode`, `GamePhase`, `StartGameOptions`; Actions `startGame`, `resetGame`, `appendLog`, `endGanovePhase`, `advanceDetective`, `endDetectivePhase`, `setMission`, `addEvent`, `setCameras`, `blockEdge`, `unblockExpiredEdges`, `setTension`, `setEventMode`
- [x] `advanceRound`-Action entfernt, Rundenfortschritt über `endDetectivePhase` (phase → `ganove`, `round + 1`)
- [x] `src/logic/placeholder.ts` + `src/logic/placeholder.test.ts` entfernt
- [x] Tests: `rng.test.ts` (9), `mapPack.test.ts` (14), `MapLoader.test.ts` (3), `Graph.test.ts` (7), `SpawnSystem.test.ts` (19), `gameStore.test.ts` erweitert (13) — 86 Tests grün, Coverage 87,93 % Zeilen (Schwelle 70 %)

## Offene Aufgaben

— (Status `Vollständig umgesetzt`)

## Hinweise

- `assignSpawns` ruft intern `pickDetectiveSpawns` + `pickGanoveSpawn` in
  der `spawnSequence`-Reihenfolge auf (Detektive zuerst, Ganove zuletzt).
- Explizite Positionen in `startGame` werden gegen die gleichen
  `SpawnSystem`-Kandidatenfunktionen validiert wie die Auto-Vergabe —
  keine zweite Validierungsquelle.
