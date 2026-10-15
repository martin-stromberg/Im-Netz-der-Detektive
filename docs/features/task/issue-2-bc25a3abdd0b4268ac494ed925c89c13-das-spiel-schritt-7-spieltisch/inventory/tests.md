# Bestandsaufnahme: Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-15 ~21:36–21:42 (lokale Zeit, Windows)
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-7-spieltisch` @ `4ca4dcc430f86b98a0456da68a86974e5cf42270`
- Uncommittete Änderungen im getesteten Stand: nur Lifecycle-Artefakte unter `docs/features/…schritt-7-spieltisch/` sowie die temporäre `playwright.local.config.ts` (nicht committed); Quellcode unverändert
- Testumgebung und Runtime-/SDK-Versionen: Node v24.15.0, npm 11.10.0, Vitest (jsdom) über `npm test`, Playwright Chromium über `npx playwright test`
- Ermittelte Testsuiten und Quellen der Testbefehle: `package.json` scripts (`test` = `vitest run`, `test:e2e` = `playwright test`, `typecheck`, `lint`), `playwright.config.ts` (webServer `reuseExistingServer: false`)
- **Hinweis Playwright:** Ein Dev-Server läuft dauerhaft auf Port 5173 (`reuseExistingServer: false` würde scheitern). Die Suite läuft deshalb über eine temporäre `playwright.local.config.ts` ohne `webServer`-Block (`reuseExistingServer` implizit über fehlende Server-Konfiguration) — Projektentscheid aus dem Schritt-7-Briefing; Datei wird nach den Läufen gelöscht, nicht committed.

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Baseline Vitest | `npm test` | Repo-Root | 0 | 617 (53 Dateien) | 0 | 0 | [baseline-vitest.txt](test-results/baseline-vitest.txt) |
| Baseline Typecheck | `npm run typecheck` | Repo-Root | 0 | – | – | – | [baseline-typecheck.txt](test-results/baseline-typecheck.txt) |
| Baseline Lint | `npm run lint` | Repo-Root | 0 | – | – | – | [baseline-lint.txt](test-results/baseline-lint.txt) |
| Baseline Playwright | `npx playwright test --config=playwright.local.config.ts` | Repo-Root | 0 | 37 | 0 | 0 | [baseline-playwright.txt](test-results/baseline-playwright.txt) |

### Nachgewiesene bestehende Testfehler

Keine — alle Suiten grün.

### Testlücken und Ausführungsprobleme

- Playwright läuft gegen den bereits laufenden Dev-Server (siehe Hinweis oben); die Standard-`playwright.config.ts` würde in dieser Umgebung einen eigenen Server auf 5173 starten wollen und an `strictPort`/`reuseExistingServer: false` scheitern — Infrastrukturbedingung, kein Testfehler.
- Die E2E-Suite deckt den Design-Vertrag bereits breit ab (`e2e/design.spec.ts`: Brett-Anatomie, Plaques, Routen, Figuren, Karten-/Panel-Anatomie, Fonts, Tokens); für die neue Tischkomposition (`.screen`-Tischfläche, `.layout`-Rahmung, `.sidebar`-Stapel, `.perspectiveToggle`) existiert noch kein E2E-Nachweis — im Plan vorzusehen.

## Testklassen (relevante Bereiche)

### `src/App.test.tsx`
- Screen-Wechsel Menü → Karte → Modus → Einstellungen → Mission → Spiel; testid-basiert

### `src/components/MenuScreens.test.tsx`
- Rendering aller Menü-Screens, Kartenlisten, Disabled-States; testid-basiert

### `src/components/GanoveScreen.test.tsx`, `DetektivScreen.test.tsx`, `ReplayScreen.test.tsx`, `MapGraph.test.tsx`
- `data-view`-Zustände, Brett-Rendering, Overlay-/Event-Logik; testid-/attributbasiert

### `e2e/*.spec.ts`
- `design.spec.ts` — Design-Tokens, Brett- und Karten-Anatomie via Computed Styles
- `menu.spec.ts` — kompletter Menüfluss
- `ganove.spec.ts`, `detektiv.spec.ts` — Spielflüsse inkl. Verfolgungs-Vignette (`data-pursuit`)
- `persistenz.spec.ts` — Resume, Statistiken, Replay (inkl. `perspectiveToggle`)
- `i18n-a11y.spec.ts` — Sprachumschaltung (`.perspectiveToggle` als language-toggle), Tastaturfluss, Audio-Prefs

## Hilfsmethoden

### `src/test/`
- Setup-/Fixture-Helfer für Vitest (jsdom-Umgebung, Store-Reset)

### `e2e/menu.spec.ts`
- `openMenu`, `toMissionSelect`, `pickFirstSelectable` — wiederverwendbare Flow-Helfer
