# Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-14 ~23:48 (lokale Zeit, UTC+2)
- Branch und Commit-ID:
  `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-9-ganove-perspektive`
  @ `7e5f0839e2e9920b5d2875e0444ac1bb40ed5ff0`
- Uncommittete Änderungen im getesteten Stand: `package.json` +
  `package-lock.json` (neue devDependencies für Komponenten-/E2E-Tests:
  `@playwright/test`, `@testing-library/react`, `-user-event`, `-dom`,
  `jsdom`) sowie das neue Verzeichnis `docs/features/…schritt-9…/`
  (Artefakte). Keine Änderungen an `src/`.
- Testumgebung: Node v24.15.0, npm 11.10.0, Windows (Git Bash),
  Vitest 5.0.4, Coverage-Provider v8 (Schwelle: lines ≥ 70 %).
- Ermittelte Testsuiten/Quellen: `package.json` → `npm test`
  (`vitest run`), `npm run coverage` (`vitest run --coverage`),
  `npm run lint`, `npm run build` (`tsc --noEmit && vite build`).

## Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| 1 | `npm test` | Repo-Root | 0 | 380 (27 Dateien) | 0 | 0 | [Log](test-results/baseline-npm-test.txt) |
| 2 | `npm run coverage` | Repo-Root | 0 | 380 | 0 | 0 | [Log](test-results/baseline-coverage.txt) |

## Nachgewiesene bestehende Testfehler

Keine — beide Baseline-Läufe vollständig grün.

## Testlücken und Ausführungsprobleme

- Playwright-E2E: `@playwright/test` installiert, Chromium +
  Headless-Shell erfolgreich heruntergeladen (`npx playwright install
  chromium` — kein Netzwerkproblem). Playwright-Tests laufen separat
  (`npx playwright test`, eigener Runner, nicht in `npm test`
  enthalten; Vitest-Include greift nur `src/**` bzw. `*.test.*` —
  E2E-Specs unter `e2e/` werden von Vitest nicht aufgesammelt, da nur
  `src/`-Testsuites existieren; ggf. `include` explizit belassen).
- Vorhandene UI-Tests nutzen `renderToString` (kein DOM). Für
  Benutzerfluss-Tests wird jsdom als Vitest-Umgebung pro Datei
  aktiviert (`// @vitest-environment jsdom`).

## Testklassen (bestehend, für diesen Schritt relevant)

### `src/state/gameStore*.test.ts`
- `gameStore.test.ts` — `startGame`-Optionen, Phasen, Move-Validierung
- `gameStore.rounds.test.ts` — Rundenablauf, Umzingelung, Zugzwang
- `gameStore.mission.test.ts` — Missionsstufen, `pendingChoice`,
  Sabotage-Effekte
- `gameStore.info.test.ts` — `useRadio`, Hitze, Sichtbarkeiten
- `gameStore.endings.test.ts` — alle `GameOutcome`-Pfade
- `gameStore.log.test.ts` — Logformat, Rekonstruktion aus Header

### `src/logic/AiSimulation.test.ts`
- `runAiGame`-Deterministik, `buildDetectiveView`/`buildGanoveView`
  Informationsasymmetrie

### `src/App.test.tsx`
- Rendert Titel/Untertitel/Runde via `renderToString` — **wird durch
  den Umbau der Shell angepasst werden müssen** (PlaceholderPanel
  entfällt).

## Hilfsmethoden

- `loadMap("teststadt")` — kleine Fixture-Karte für Store-/UI-Tests
  (10 Knoten, `choice`-Detektivstarts `a`/`i`/`j`, `free`-Ganove mit
  `minDistanceToDetective: 3`, keine `sabotage`-Kategorie).
