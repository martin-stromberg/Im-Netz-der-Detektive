# Bestandsaufnahme — Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-14 00:48 (lokale Zeit)
- Branch und Commit-ID: `task/issue-2-...-schritt-10-detektiv-perspektive` @ `a870f457`
- Uncommittete Änderungen im getesteten Stand: nur neue Lifecycle-Artefakte
  unter `docs/features/.../` (kein Produktivcode)
- Testumgebung: Node v24.15.0, npm 11.10.0, Vitest (jsdom für Komponenten),
  Playwright Chromium
- Ermittelte Testsuiten: `npm test` (vitest, 32 Dateien), `npm run coverage`
  (v8), `npm run test:e2e` (Playwright, `e2e/ganove.spec.ts`)

### Testläufe

| Lauf | Befehl | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------|--------------------|-----------|-------------|----------------|--------------|----------|
| Baseline Unit | `npm test` | Repo-Root | 0 | 419 (32 Dateien) | 0 | 0 | [baseline-npm-test.txt](test-results/baseline-npm-test.txt) |
| Baseline Coverage | `npm run coverage` | Repo-Root | 0 | 419 | 0 | 0 | [baseline-coverage.txt](test-results/baseline-coverage.txt) |

E2E-Baseline: `e2e/ganove.spec.ts` lief in Schritt 9 grün (4 Tests);
wird im Implementierungslauf erneut ausgeführt (Regression).

### Nachgewiesene bestehende Testfehler

Keine — alle 419 Tests grün, keine Fehlschläge nachgewiesen.

### Testlücken und Ausführungsprobleme

Keine in der Baseline. Hinweis: Playwright-E2E benötigt den Dev-Server
(wird automatisch via `webServer` in `playwright.config.ts` gestartet).

## Testklassen (relevant für Schritt 10)

### `src/components/GanoveScreen.test.tsx`
- Setup-Flow (idle → pickSpawn → playing), legale Spawn-Angebote,
  Spielansicht (Position, legale Ziele, Mission, Heat, Radio),
  Asymmetrie-Assertions (keine `[data-camera]`/`[data-hint-event]`).

### `src/components/MapGraph.test.tsx`
- Kantentypen, Sperr-Glyphs, Selektierbarkeit, Marker-Rendering, Tastatur.

### `src/state/detectiveDriver.test.ts`
- `detectiveStartsFromLog`, `driveDetectivePhase` (no-op außerhalb Phase,
  Determinismus, Übergabe zurück an `ganove`), `installDetectiveDriver`.

### `src/logic/Deduction.test.ts`
- `deducePossiblePositions` gegen Engine-Verhalten (Pfadinduktion,
  Negativ-Kameraschluss, `umwelt`, `aktion`, `falsche_spur`).

## Hilfsmethoden / Fixtures

- `loadMap("teststadt")` — kleine deterministische Karte (choice-Spawns a/i/j).
- `startGame(map, seed, options)` mit expliziten `detectivePositions`/
  `ganovePosition`, `cameraCount: 0`, `mission: "none"`, `roundLimit`.
- `window.__gameStore` (DEV) — read-only Introspektion in E2E.
