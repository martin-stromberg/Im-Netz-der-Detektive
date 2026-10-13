# Bestandsaufnahme: Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (UTC): 2026-10-13T18:10:06Z
- Branch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-5-informationssystem`
- Commit-ID: `07d1fad8d14614e0fb9d94c95476bb6ad4519b49`
- Uncommittete Änderungen im getesteten Stand: nur die neu angelegten
  Lifecycle-Artefakte unter `docs/features/task/...` (keine
  Codeänderungen)
- Testumgebung: Node v24.15.0, npm 11.10.0, Vitest 5.0.4 (v8-Coverage),
  Windows/Git-Bash
- Ermittelte Testsuite: `npm test` (`vitest run`) aus `package.json`;
  Coverage via `npm run coverage` (Threshold: 70 % Lines)

### Testläufe

| Lauf | Befehl | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------|--------------------|-----------|-------------|----------------|--------------|----------|
| Baseline | `npm test` | Repo-Root | 0 | 163 | 0 | 0 | [baseline-npm-test.txt](test-results/baseline-npm-test.txt) |

### Nachgewiesene bestehende Testfehler

Keine — alle 163 Tests in 12 Dateien bestanden.

### Testlücken und Ausführungsprobleme

Keine ausgeführten/fehlgeschlagenen Lücken. Coverage wurde im Baseline-
Lauf nicht separat gemessen (`npm run coverage` läuft im selben
Vitest-Setup; Schwellenwert 70 % Lines ist konfiguriert und wurde in
vorherigen Schritten eingehalten — Schritt 4: 91,7 %).

## Testdateien

### `src/logic/mapPack.test.ts` (19 Tests)
- Schema-Validierung der Kartenpaket-Struktur inkl. `settings.eventMix`,
  `settings.eventDefaults`, `eventMode`.

### `src/logic/MapLoader.test.ts` (5 Tests)
- `loadMap`, `listMapIds`, Fehlerfälle.

### `src/logic/rng.test.ts` (9 Tests)
- Deterministik, Wertebereiche, `pick`/`shuffle`.

### `src/logic/SpawnSystem.test.ts` (19 Tests)
- Spawn-Modi und `minDistanceToDetective`.

### `src/logic/Graph.test.ts` (7 Tests)
- `buildGraph`, `neighbors`, `bfsDistances`, `distance`.

### `src/logic/Movement.test.ts` (21 Tests)
- `isEdgeBlocked`, `legalMoves*`, `validate*`, `mapEscapeNodeIds`.

### `src/logic/mapData.test.ts` (17 Tests)
- Strukturmetriken der Karten muenster/luebeck/teststadt.

### `src/state/gameStore.test.ts` (14 Tests)
- Initial-State, `startGame` (Seed-Deterministik, Spawn-Optionen),
  `appendLog`, `setMission`, `addEvent` (verwendet bereits
  `{kind:"camera", visibleTo:"detectives"}`), `setCameras`,
  `setTension`, `setEventMode`, `blockEdge`/`unblockExpiredEdges`.

### `src/state/gameStore.rounds.test.ts` (20 Tests)
- Rundenmaschine: `moveGanove`, `moveDetective` (feste Reihenfolge,
  Fangsofortprüfung), `endDetectivePhase`, `roundLimit`-Auflösung.

### `src/state/gameStore.endings.test.ts` (11 Tests)
- `caught`, `surrounded`, `escaped`, `timeout`, `draw`, `ganoveAction`.

### `src/App.test.tsx` (2 Tests)
- App-Shell-Render.

### `scripts/resolve-release-version.test.mjs` (19 Tests)
- Release-Skript, nicht engine-relevant.

## Hilfsmethoden

- `loadMap("teststadt")` als Standard-Fixture in allen Store-Tests;
  `useGameStore.getState().resetGame()` im `beforeEach`.
- `gameStore.endings.test.ts` enthält eine selbstgebaute Mini-Fixture-
  Karte (Muster für eigene Testmaps).
