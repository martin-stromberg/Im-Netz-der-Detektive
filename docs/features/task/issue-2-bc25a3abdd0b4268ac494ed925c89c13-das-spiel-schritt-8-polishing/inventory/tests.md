# Detail: Tests — Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-15 ~22:05 +0200
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-8-polishing` @ `efbf0d1d299894b6a0bf4393527ef44db8a12915`
- Uncommittete Änderungen im getesteten Stand: nur neue, ungetrackte
  Lifecycle-Artefakte unter `docs/features/…-schritt-8-polishing/` und
  die temporäre `playwright.local.config.ts` (kein Produktivcode).
- Testumgebung: Windows 11, git bash; Node v24.15.0, npm 11.10.0,
  Python 3.13.14; Playwright Chromium. Dev-Server lief bereits auf
  Port 5173 → E2E liefen über temporäre `playwright.local.config.ts`
  (`reuseExistingServer: true`, wird nicht committet).
- Ermittelte Testsuiten und Quellen der Testbefehle: `package.json`
  Scripts (`test`, `coverage`, `lint`, `format:check`, `typecheck`,
  `test:e2e`), `vite.config.ts` (Vitest + v8-Coverage, Threshold
  `lines: 70`), `playwright.config.ts`, `.githooks/*.py` (`--all`).

## Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Vitest + Coverage | `npm run coverage` | Repo-Root | 0 | 617 (53 Dateien) | 0 | 0 | [baseline-coverage.txt](test-results/baseline-coverage.txt) |
| ESLint | `npm run lint` | Repo-Root | 0 | – | 0 | – | [baseline-static.txt](test-results/baseline-static.txt) |
| Prettier | `npm run format:check` | Repo-Root | 0 | – | 0 | – | [baseline-static.txt](test-results/baseline-static.txt) |
| Typecheck | `npm run typecheck` | Repo-Root | 0 | – | 0 | – | [baseline-static.txt](test-results/baseline-static.txt) |
| Git-Hooks | `python .githooks/<check>.py --all --strict` für alle 6 Checks | Repo-Root | je 0 | – | 0 | – | [baseline-hooks.txt](test-results/baseline-hooks.txt) |
| Playwright E2E | `npx playwright test --config playwright.local.config.ts` | Repo-Root | 0 | 39 | 0 | 0 | [baseline-e2e.txt](test-results/baseline-e2e.txt) |
| Build | `npm run build` | Repo-Root | 0 | – | – | – | [baseline-build.txt](test-results/baseline-build.txt) |

Coverage (Linien): **91,44 %** (Threshold `lines: 70` hält).

## Nachgewiesene bestehende Testfehler

Keine — alle Suiten grün im Ausgangslauf.

## Testlücken und Ausführungsprobleme

Keine. Hinweis: Der E2E-Lauf nutzte den bereits laufenden Dev-Server
auf Port 5173 via `reuseExistingServer`; Inhaltlich identische Specs
und Selektoren wie in `playwright.config.ts`.

## Testklassen (für die Audit-Befunde relevant)

- `MapGraph.test.tsx` — SVG-Struktur, `data-*`-Vertrag, Tastatur-
  Roaming
- `MenuScreens.test.tsx`, `MissionSelect.test.tsx`, `SettingsScreen.test.tsx` —
  Menü-Screens
- `DetektivScreen.test.tsx`, `GanoveScreen.test.tsx` — Spielhüllen,
  Legenden (`data-testid="map-legend"`)
- `HeatBadge/PursuitBadge/EventBanner/MissionPanel.test.tsx` — Badge-/
  Panel-Kodierung
- `e2e/design.spec.ts` — Font lokal, Tokens, Pergament-Brett, Plaketten,
  cased Routen + Legenden-Mirror, Edelkarten, Tisch-Komposition
- `e2e/i18n-a11y.spec.ts` — Tastatur-Flow (Tab + Pfeiltasten-Roaming),
  Sprachumschaltung
