# Bestandsaufnahme: Informationssystem (Schritt 5)

Analyse des bestehenden Codes bezogen auf die Informationsschicht
(Kameras, Ereignisse, Hinweise, Polizeifunk, Hitze-Indikator) aus
`requirement.md`.

## Zusammenfassung

- **Vorhanden:** das gesamte Karten-Settings-Modell (`cameraCount`,
  `cameraMinGap`, `hintZoneRadius`, `eventMode`, `eventDefaults`,
  `eventMix`, `radioHintCount`, `edgeBlockRounds` in
  `src/logic/mapPack.ts` sowie befüllt in allen drei Kartenpaketen),
  der deterministische `Rng` (`src/logic/rng.ts`, mulberry32),
  Graph-/BFS-Grundfunktionen (`src/logic/Graph.ts`), `BlockedEdge` +
  `isEdgeBlocked` (`src/logic/Movement.ts`), die State-Felder `events`,
  `cameras`, `blockedEdges`, `eventMode`, `tensionValue`, `log` inkl.
  imperativer Setter (`addEvent`, `setCameras`, `blockEdge`,
  `unblockExpiredEdges`, `setTension`, `setEventMode`) und der komplette
  Rundenmotor mit den Einschubstellen `moveGanove`/`ganoveAction`.
- **Fehlend:** `CameraSystem.ts`, `EreignisEngine.ts` und jede
  Informationsverteilung/Hitze-Logik (in `02-technisches-konzept.md` §5
  bereits als Module vorgesehen). `GameEvent.visibleTo` kennt bisher nur
  `"detectives" | "both"` — `"ganove"` fehlt. Keine Kameraplatzierung in
  `startGame` (`cameras` bleibt `[]`), keine Ereignis-/Hinweisprüfung im
  Rundenmotor, kein Polizeifunk, kein Hitze-Indikator.
- **Test-Ausgangszustand:** `npm test` auf Commit `07d1fad` — 163 Tests
  in 12 Dateien, alle bestanden, kein bekannter Fehlschlag. Details:
  [tests.md](inventory/tests.md), Nachweis:
  `inventory/test-results/baseline-npm-test.txt`.

## Details

- [Logik](inventory/logic.md) — `mapPack.ts`, `rng.ts`, `Graph.ts`,
  `Movement.ts`, `MapLoader.ts`, `SpawnSystem.ts`
- [Modelle / State](inventory/models.md) — `gameStore.ts` (Typen,
  Felder, Actions), `mapPack.ts` (Einstellungsmodell)
- [Enums](inventory/enums.md) — `EventMode`, `GamePhase`, `GameOutcome`,
  Map-Enums
- [Tests](inventory/tests.md) — Test-Ausgangszustand und bestehende
  Testdateien
