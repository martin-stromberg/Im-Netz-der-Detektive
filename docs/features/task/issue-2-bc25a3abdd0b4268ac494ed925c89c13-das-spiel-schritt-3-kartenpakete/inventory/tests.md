# Tests: Bestand und Ausgangszustand

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-13T17:12:41Z (UTC)
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-3-kartenpakete` @ `cdda671b4d851638b2acf7c441a17e4b01496920`
- Uncommittete Änderungen im getesteten Stand: keine (nur untracked Lifecycle-Artefakte unter `docs/features/`, kein Einfluss auf Tests)
- Testumgebung und Runtime-/SDK-Versionen: Node v24.15.0, npm 11.10.0, Python 3.13.14, Vitest 5.0.4, Windows (Git Bash)
- Ermittelte Testsuiten und Quellen der Testbefehle: `npm test` (`vitest run`, `package.json`); `python .githooks/map-schema-check.py --all --strict` (Pre-Commit-Hook)

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Baseline | `npm test` | Repo-Root | 0 | 92 (8 Dateien) | 0 | 0 | [Log](test-results/npm-test-baseline.txt) |
| Baseline | `python .githooks/map-schema-check.py --all --strict` | Repo-Root | 0 | 1 Paket valide | 0 | – | [Log](test-results/map-schema-check-baseline.txt) |

### Nachgewiesene bestehende Testfehler

Keine — alle 92 Tests und der Hook-Lauf waren im Ausgangszustand erfolgreich.

### Testlücken und Ausführungsprobleme

- Keine Strukturmetrik-Tests für reale Kartenpakete vorhanden (wird mit
  dieser Anforderung geschlossen).
- Kein Test der Missionskriterien-Erfüllbarkeit (wird mit dieser
  Anforderung geschlossen).
- `MapLoader.test.ts` prüft bisher nur `teststadt` — `loadMap("muenster")`
  und `loadMap("luebeck")` sind ungetestet.

## Testklassen (bestehend, relevant)

### `MapLoader.test.ts` (`src/logic/`)
- `loads and validates the bundled teststadt package` — Loader-End-to-End
- `rejects an unknown map id and names the available packages` — Fehlerfall
- `lists the bundled map packages` — `listMapIds` enthält `teststadt`

### `mapPack.test.ts` (`src/logic/`)
- 19 Tests: Schema-Positive/-Negative (Pflichtfelder, Ranges, Referenzen,
  Spawn-Modi, Settings-Gruppen)

### `Graph.test.ts` (`src/logic/`)
- 7 Tests: `buildGraph`, `neighbors`, `bfsDistances`, `distance` inkl.
  `Infinity`-Fälle

### `SpawnSystem.test.ts` (`src/logic/`)
- 19 Tests: Spawn-Modi, `minDistanceToDetective`, Reihenfolge, Determinismus

### `rng.test.ts` / `gameStore.test.ts` / `App.test.tsx`
- Nicht direkt betroffen; `rng`/`gameStore` bleiben unverändert.

## Hilfsmethoden

Keine kartenspezifischen Test-Hilfsmethoden vorhanden; die Fixture-Karte
`src/data/maps/teststadt.json` dient als Referenzformat.
