# Tests — Ausgangszustand

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt: 2026-10-14 ~02:52–02:56 UTC
- Branch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-13-i18n-a11y-audio`, Commit `353390f`
- Uncommittete Änderungen im getesteten Stand: nur neue Lifecycle-Artefakte unter `docs/features/task/…-schritt-13-i18n-a11y-audio/` (keine Codeänderungen)
- Testumgebung: Node v24.15.0, npm 11.10.0, Python 3.13.14, Windows (Git Bash); Vitest 5 + jsdom 30, Playwright 1.64 (Chromium)
- Ermittelte Testsuiten: `npm test` (vitest run), `npm run coverage` (vitest --coverage, 70 %-Schwelle), `npm run lint`, `npm run build` (tsc + vite), `npx playwright test` (= `npm run test:e2e`)

### Testläufe

| Lauf | Befehl | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------|--------------------|-----------|-------------|----------------|--------------|----------|
| Unit/Komponente | `npm test` | Repo-Root | 0 | 542 (45 Dateien) | 0 | 0 | [Log](test-results/vitest-baseline.txt) |
| Coverage | `npm run coverage` | Repo-Root | 0 | 542 | 0 | 0 | [Report](test-results/coverage-baseline.txt) |
| Lint | `npm run lint` | Repo-Root | 0 | – | 0 | – | [Log](test-results/lint-baseline.txt) |
| Build | `npm run build` | Repo-Root | 0 | – | 0 | – | [Log](test-results/build-baseline.txt) |
| E2E | `npx playwright test` | Repo-Root | 0 | 26 | 0 | 0 | [Log](test-results/e2e-baseline.txt) |

### Nachgewiesene bestehende Testfehler

Keine — alle Suiten grün.

### Testlücken und Ausführungsprobleme

Keine. Hinweis: Komponententests geben bekannte React-`act()`-Warnungen aus (ReplayScreen), ohne Fehlschlag.

## Testklassen (i18n-/UI-/a11y-relevant)

### `src/App.test.tsx`
- `renders the main menu without a mode parameter` — Hauptmenü inkl. Test-IDs
- `walks menu → map → mode → settings → mission → ganove spawn pick` / `… detektiv flow …` — Menüfluss bis Spawn
- `opens the stats view from the main menu`; `?mode=`-Deep-Links

### `src/components/MenuScreens.test.tsx`
- Menü-, Karten-, Modus-, Statistik-, Dev-Mode- und Resume-Interaktionen (Test-IDs, disabled States)

### `src/components/MissionSelect.test.tsx`
- `offers cases with name and mini story …` — assertet `entry.name`/`entry.story`-Texte (bleibt mit DE-Fallback gültig)
- Kriterien-Fehlertexte über `customErrorText`

### `src/components/MapGraph.test.tsx`
- Rendering, Kantentypen, Sperrmarkierung, Kategorien, `role="button"`/`aria-label` auf interaktiven Knoten, Tastatur (Enter)

### `src/components/HeatBadge.test.tsx`
- 4 Stufen mit Icon-Balken + Text + `role="status"`/`aria-label`

### `src/components/{GanoveScreen,DetektivScreen,ReplayScreen,ResumeScreen,SettingsScreen}.test.tsx`
- Screen-Flüsse, Asymmetrie-Nachweise, Spawn-Picks, Persistenz-Buttons, Einstellungsvalidierung — alle textuellen Asserts lesen `de.json`-Keys (sprachneutral)

### `src/state/*test.ts`, `src/logic/*test.ts`
- Engine-Tests, unberührt von diesem Schritt

## Hilfsmethoden

- `src/test/setup.ts` — jest-dom-Matcher, `cleanup`, `resetGame` pro Test (Erweiterung um UI-Prefs-Reset geplant)
- `e2e/*.spec.ts` — Helper `openMenu`, `toMissionSelect`, `pickFirstSelectable`, `window.__gameStore`-Introspektion

## E2E-Bestand mit Tastaturbezug

- `ganove.spec.ts` ~Z.171: Tab + Enter auf wählbarem Spawn-Knoten
- `detektiv.spec.ts` Z.236: Tab + Enter auf legalem Zugziel bewegt Detektiv
