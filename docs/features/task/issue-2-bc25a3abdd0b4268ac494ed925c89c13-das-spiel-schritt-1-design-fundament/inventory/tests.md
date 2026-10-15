# Bestandsaufnahme: Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-15 18:58–19:05 +0200
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-1-design-fundament` @ `5d05a2be2d1d2e459e5ab7522e4053789b42a967`
- Uncommittete Änderungen im getesteten Stand: keine (nur neue, ungetrackte Lifecycle-Artefakte unter `docs/features/…-design-fundament/`)
- Testumgebung und Runtime: Node v24.15.0, npm 11.10.0, Vitest 5.0.4 (jsdom), Windows 11, git bash
- Testsuiten/Befehle aus `package.json` scripts + `.githooks/pre-commit`: `npm test` (vitest run), `npm run lint`, `npm run typecheck`, `npm run format:check`, `python .githooks/i18n-check.py`, `python .githooks/no-hardcoded-strings-check.py --all`; E2E: `npm run test:e2e` (Playwright, `e2e/*.spec.ts`)

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| 1 | `npm test` | Repo-Root | 0 | 597 (53 Dateien) | 0 | 0 | [baseline-npm-test.txt](test-results/baseline-npm-test.txt) |
| 2 | `npm run lint` | Repo-Root | 0 | — | 0 | — | [baseline-lint.txt](test-results/baseline-lint.txt) |
| 3 | `npm run typecheck` | Repo-Root | 0 | — | 0 | — | [baseline-typecheck.txt](test-results/baseline-typecheck.txt) |
| 4 | `npm run format:check` | Repo-Root | 0 | — | 0 | — | [baseline-format.txt](test-results/baseline-format.txt) |
| 5 | `python .githooks/i18n-check.py` | Repo-Root | 0 | — | 0 | — | [baseline-i18n.txt](test-results/baseline-i18n.txt) |
| 6 | `python .githooks/no-hardcoded-strings-check.py --all` | Repo-Root | 0 | — | 0 | — | [baseline-strings.txt](test-results/baseline-strings.txt) |

### Nachgewiesene bestehende Testfehler

Keine — alle ausgeführten Läufe mit Exit-Code 0. Bekannte, nicht blockierende
Ausgaben: React-`act()`-Warnungen in `ReplayScreen.test.tsx` und ein
jsdom-„Not implemented: navigation"-Hinweis in `MenuScreens.test.tsx`
(beide preexisting, Tests bestehen).

### Testlücken und Ausführungsprobleme

- Playwright-E2E (`e2e/*.spec.ts`, 5 Spec-Dateien) wurde in der Baseline
  nicht ausgeführt — kein Code geändert; Ausführung erfolgt im
  Lifecycle-Schritt 10, soweit für diese Anforderung relevant.
- Coverage-Baseline nicht erhoben (nicht erforderlich für CSS/Font-Änderung;
  Coverage-Threshold in `vite.config.ts` bleibt für `npm run coverage`
  wirksam).

## Testklassen (styling-/strukturrelevant)

### `src/components/GanoveScreen.test.tsx`
- Rendert Screens, prüft sichtbare Texte, `data-*`-Attribute und
  Interaktionen — indirekter Vertrag für unveränderte Klassen/Struktur.

### `src/components/DetektivScreen.test.tsx`, `MenuScreens.test.tsx`,
### `MapGraph.test.tsx`, `App.test.tsx`, `MissionPanel.test.tsx` u. a.
- Gleiche Aussage: Tests prüfen Verhalten/Struktur, keine CSS-Werte — die
  `var()`-Umstellung ist für die Suite transparent, sofern Klassennamen und
  `data-*` unverändert bleiben.

## Hilfsmethoden

Keine stylingbezogenen Test-Helper vorhanden; `src/test/setup.ts` richtet
jsdom/Matcher ein.
