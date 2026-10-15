# Bestandsaufnahme: Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-15 21:14–21:20 (lokale Zeit, UTC+2)
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-6-panels` @ `51870239002f215e37ddf12c8e64fdb7e459b5de`
- Uncommittete Änderungen im getesteten Stand: nur untracked
  `docs/features/…schritt-6-panels/` (Lifecycle-Artefakte, kein Code)
- Testumgebung und Runtime-/SDK-Versionen: Node v24.15.0, npm 11.10.0,
  Python 3.13.14, Windows (git bash); Playwright gegen bereits laufenden
  Vite-Dev-Server auf `http://localhost:5173` (Temp-Config
  `playwright.local.config.ts` mit `reuseExistingServer: true`, da
  `playwright.config.ts` `reuseExistingServer: false` + `strictPort`
  nutzt)
- Ermittelte Testsuiten und Quellen der Testbefehle: `package.json`
  scripts (`test` = vitest run, `lint`, `format:check`, `typecheck`,
  `check:strings`, `test:e2e` = playwright), `.githooks/i18n-check.py`

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
| ---- | ------------------- | ------------------ | --------- | ----------- | -------------- | ------------ | -------- |
| Vitest | `npm test` | Repo-Root | 0 | 617 (53 Dateien) | 0 | 0 | [baseline-npm-test.txt](test-results/baseline-npm-test.txt) |
| ESLint | `npm run lint` | Repo-Root | 0 | – | 0 | – | [baseline-lint.txt](test-results/baseline-lint.txt) |
| Prettier | `npm run format:check` | Repo-Root | 0 | – | 0 | – | [baseline-format.txt](test-results/baseline-format.txt) |
| tsc | `npm run typecheck` | Repo-Root | 2 | – | 4 Compile-Fehler | – | [baseline-typecheck.txt](test-results/baseline-typecheck.txt) |
| String-Check | `npm run check:strings` | Repo-Root | 0 | – | 0 | – | [baseline-strings.txt](test-results/baseline-strings.txt) |
| i18n-Check | `python .githooks/i18n-check.py --all` | Repo-Root | 0 | – | 0 | – | [baseline-i18n.txt](test-results/baseline-i18n.txt) |
| Playwright | `npx playwright test --config=playwright.local.config.ts` | Repo-Root | 0 | 36 | 0 | 0 | [baseline-e2e.txt](test-results/baseline-e2e.txt) |

### Nachgewiesene bestehende Testfehler

| Test-ID inkl. Testfall | Suite / Dateipfad | Fehlerbild / Fehlermeldung | Lauf und Nachweis |
| ---------------------- | ----------------- | -------------------------- | ----------------- |
| `tsc --noEmit` Kompilierung | `src/components/MapGraph.test.tsx` Zeilen 40, 49, 63, 64 | `error TS2339: Property 'baseVal' does not exist on type 'string'` — `className` ist für SVG-Elemente als `string` typisiert; Test nutzt `className.baseVal` | tsc-Lauf, [baseline-typecheck.txt](test-results/baseline-typecheck.txt) |

Hinweis: `npm run build` (`tsc --noEmit && vite build`) scheitert an
denselben vorab existierenden Fehlern; Vitest und Playwright sind davon
nicht betroffen und laufen grün.

### Testlücken und Ausführungsprobleme

- Playwright musste gegen den bereits laufenden Dev-Server laufen
  (`reuseExistingServer`), weil Port 5173 belegt war — inhaltlich
  identisch, da der Server dasselbe Repo live ausliefert.
- Keine Coverage-Messung im Baseline-Lauf (CI nutzt `npm run coverage`;
  für CSS-only-Änderungen nicht aussagekräftig, Schwellenwert 70 %
  lines ist projektweit konfiguriert).

## Testklassen

### `src/components/MapGraph.test.tsx`

- `className.baseVal`-Assertions auf SVG-Edges (verursacht die
  preexisting tsc-Fehler).

### `e2e/design.spec.ts` (Playwright)

- „theme custom properties are defined on :root" — prüft
  `--color-screen-bg`, `--color-panel-bg`, `--color-paper`, `--color-ink`,
  `--font-display` auf konkrete Werte (Token-Änderungen an diesen fünf
  Tokens würden den Test brechen).
- Board-/Token-/Routen-/Meeple-Anatomie (Schritte 2–5) — prüft u. a.
  `getComputedStyle` auf Border, Shadow, Stroke, `prefers-reduced-motion`.

### Weitere E2E-Spezifikationen

- `e2e/menu.spec.ts`, `e2e/detektiv.spec.ts`, `e2e/ganove.spec.ts`,
  `e2e/i18n-a11y.spec.ts`, `e2e/persistenz.spec.ts` — Benutzerflüsse über
  `data-testid`/`role`/Tastaturfokus; CSS-only-Änderungen betreffen sie
  nur über sichtbare Layout-Brüche (Zielgrößen, `:focus-visible`).

## Hilfsmethoden

Keine neuen Hilfsmethoden nötig — CSS-only-Schritt.
