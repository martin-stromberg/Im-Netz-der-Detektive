# Bestandsaufnahme — Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-13, ca. 19:39 MESZ (UTC+2)
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-4-rundenablauf`, Commit `37df3e05eb8913a1b67e8ff1501de47c99690a35`
- Uncommittete Änderungen im getesteten Stand: nur Lifecycle-Artefakte unter `docs/features/task/…-schritt-4-rundenablauf/` (kein Einfluss auf Tests)
- Testumgebung: Node v24.15.0, npm 11.10.0, Vitest 5.0.4 (v8-Coverage), Windows
- Ermittelte Testsuiten: `package.json` → `npm test` = `vitest run` (9 Testdateien unter `src/` und `scripts/`)

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| 1 | `npm test` | Repo-Root | 0 | 111 | 0 | 0 | [npm-test-baseline.log](test-results/npm-test-baseline.log) |

### Nachgewiesene bestehende Testfehler

Keine — alle 111 Tests erfolgreich.

### Testlücken und Ausführungsprobleme

Keine. Coverage-Schwelle `lines: 70` ist in `vite.config.ts` erzwungen;
der Ausgangslauf erfüllt sie (Coverage-Bericht unter `coverage/`).

## Testklassen (bestehend)

### `src/state/gameStore.test.ts`
- Initiale Store-Felder, `startGame` (inkl. Seed-Determinismus, explizite
  Positionen, `SpawnError`-Fälle), rudimentäre Phasenmaschine,
  `appendLog`, `setMission`/`addEvent`/`setCameras`/`setTension`/
  `setEventMode`, `blockEdge`/`unblockExpiredEdges`, `resetGame`.

### `src/logic/Graph.test.ts`, `MapLoader.test.ts`, `mapPack.test.ts`,
### `SpawnSystem.test.ts`, `rng.test.ts`, `mapData.test.ts`
- Graph-/BFS-Funktionen, Kartenladen und Schema-Validierung, Spawn-Regeln,
  RNG-Determinismus, Strukturmetriken der echten Kartenpakete.

### `src/App.test.tsx`, `scripts/resolve-release-version.test.mjs`
- App-Shell-Rendering, Release-Skript.

## Hilfsmethoden

### Testpartie-Fixture
- `loadMap("teststadt")` — 10-Knoten-Fixture mit `flucht`-Knoten `b`, `d`,
  `g`, Kanten beider Typen, `spawnRules.detectives` = `choice` (`a`,`i`,`j`),
  `spawnRules.ganove` = `free` mit `minDistanceToDetective` 3,
  `roundLimit` `{suggested: 30, min: 15, unlimited: true}`.
- `startGame(map, seed, {detectivePositions, ganovePosition})` — setzt
  explizite, deterministische Ausgangspositionen für skriptgesteuerte
  Partien.
