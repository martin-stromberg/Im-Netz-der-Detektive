# Bestandsaufnahme: Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-14T01:39 +02:00
- Branch und Commit-ID: `task/…-schritt-11-menue-einstellungen` @ `54769db`
- Uncommittete Änderungen im getesteten Stand: nur Lifecycle-Artefakte
  unter `docs/features/task/…schritt-11…/` (kein Produktivcode)
- Testumgebung: Node v24.15.0, npm 11.10.0, Windows, Vitest 5 +
  jsdom, Playwright (chromium) mit automatischem `vite dev` auf :5173
- Testsuiten: `npm test` (Vitest, 34 Dateien), `npm run test:e2e`
  (Playwright, 2 Spec-Dateien / 12 Tests)

### Testläufe

| Lauf | Befehl | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------|--------------------|-----------|-------------|----------------|--------------|----------|
| 1 | `npm test` | Repo-Wurzel | 0 | 445 | 0 | 0 | [Log](test-results/npm-test-baseline.txt) |
| 2 | `npm run test:e2e` | Repo-Wurzel | 0 | 12 | 0 | 0 | [Log](test-results/e2e-baseline.txt) |

### Nachgewiesene bestehende Testfehler

Keine — beide Läufe ohne Fehlschlag.

### Testlücken und Ausführungsprobleme

Keine. Coverage-Schwelle des Projekts: ≥70 % (`npm run coverage`).

## Bestehende Testklassen (ausgewählt, für diesen Schritt relevant)

### `src/App.test.tsx`
- Rendert `mode-select` ohne Parameter; `?mode=`-Deep-Links;
  Button-Klick führt zu `ganove-screen`/`detektiv-screen` (`idle`).
  → **Muss angepasst werden**, wenn `App.tsx` den Menüfluss erhält.

### `src/components/GanoveScreen.test.tsx` / `DetektivScreen.test.tsx`
- Setup-Fluss (Idle → PickSpawn → Playing), legale/illegale
  Spawn-Angebote, Zug-Ereignisse, Outcome-Anzeige.

### `src/logic/SpawnSystem.test.ts`, `MissionSystem.test.ts`, `mapPack.test.ts`, `mapData.test.ts`, `missionData.test.ts`
- Spawn-Regeln inkl. `minDistanceToDetective`, Missionsvalidierung,
  Schema-/Datentests für Karten- und Missionspakete.

### `src/logic/AiSimulation.test.ts`, `Recorder.test.ts`
- Batch-Lauf und -Aggregation; Log-FIFO, Export, Header-Rekonstruktion.

### `e2e/ganove.spec.ts` (5 Tests), `e2e/detektiv.spec.ts` (7 Tests)
- `?mode=`/`?map=`/`?seed=`/`?mission=` parametrisiert,
  `window.__gameStore` nur lesend.

## Hilfsmethoden

- `loadMap("teststadt")` + explizite `detectivePositions`/`ganovePosition`
  in Komponententests; `resolveMissionOption`/`readParams`/`nextSeed`
  in `gameSetup.ts`.
