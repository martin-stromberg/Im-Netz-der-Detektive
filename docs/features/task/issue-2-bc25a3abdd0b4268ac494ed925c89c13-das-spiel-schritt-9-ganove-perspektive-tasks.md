# Tasks: Ganove-Perspektive (Schritt 9)

| # | Bereich | Aufgabe | Status | Testnachweis |
|---|---------|---------|--------|--------------|
| 1 | Infrastruktur | `@testing-library/jest-dom` installieren; `src/test/setup.ts` anlegen | Erledigt | `GanoveScreen.test.tsx` u. a. laufen unter jsdom |
| 2 | Infrastruktur | `vite.config.ts`: `setupFiles` + `exclude e2e/**` | Erledigt | `npm test` sammelt keine Playwright-Specs |
| 3 | Infrastruktur | `tsconfig.json`: `e2e`/`playwright.config.ts` in `include` | Erledigt | `npm run build` (tsc) deckt e2e ab |
| 4 | Infrastruktur | `playwright.config.ts` + `test:e2e`-Script + `.gitignore`-Eintrag | Erledigt | `npm run test:e2e` |
| 5 | Logik | `aiRng` in `AiSimulation.ts` exportieren | Erledigt | `detectiveDriver.test.ts` (Deterministik) |
| 6 | Logik | `src/state/detectiveDriver.ts`: `detectiveStartsFromLog`, `driveDetectivePhase`, `installDetectiveDriver` | Erledigt | `detectiveDriver.test.ts` |
| 7 | Tests | `detectiveDriver.test.ts` | Erledigt | 8 Tests grün |
| 8 | i18n | Alle neuen Schlüssel in `de.json`/`en.json` paritätisch | Erledigt | `i18n-check.py` im Hook |
| 9 | UI | `MapGraph.tsx` + `MapGraph.module.css` | Erledigt | `MapGraph.test.tsx` (9 Tests) |
| 10 | UI | `HeatBadge.tsx` + `HeatBadge.module.css` | Erledigt | `HeatBadge.test.tsx` (5 Tests) |
| 11 | UI | `MissionPanel.tsx` + `MissionPanel.module.css` | Erledigt | `MissionPanel.test.tsx` (5 Tests) |
| 12 | UI | `GanoveScreen.tsx` + `GanoveScreen.module.css` | Erledigt | `GanoveScreen.test.tsx` (12 Tests) |
| 13 | UI | `App.tsx`/`App.module.css` umbauen; `main.tsx` DEV-Store-Exposition; `PlaceholderPanel` entfernt | Erledigt | `App.test.tsx` |
| 14 | Tests | `MapGraph.test.tsx` | Erledigt | 9 Tests grün |
| 15 | Tests | `HeatBadge.test.tsx`, `MissionPanel.test.tsx` | Erledigt | 10 Tests grün |
| 16 | Tests | `GanoveScreen.test.tsx` (Benutzerfluss jsdom) | Erledigt | 12 Tests grün |
| 17 | Tests | `App.test.tsx` anpassen | Erledigt | 2 Tests grün |
| 18 | E2E | `e2e/ganove.spec.ts` (alle Pflichtszenarien) | Erledigt | 5 Playwright-Tests grün |
| 19 | Qualität | `npm run build && npm test && npm run coverage && npm run lint && npm run test:e2e` grün; `npm run format` | Erledigt | `test-results.md` |
