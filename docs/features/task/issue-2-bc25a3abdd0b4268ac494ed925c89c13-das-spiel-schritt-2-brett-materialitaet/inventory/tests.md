# Bestandsaufnahme — Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-15, ~19:30 MESZ (UTC+2)
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-2-brett-materialitaet` @ `79cd761` (= Basisbranch-Spitze `task/issue-2-…-das-spiel`)
- Uncommittete Änderungen im getesteten Stand: keine Quellcodeänderungen; nur neue Lifecycle-Artefakte unter `docs/features/…schritt-2-brett-materialitaet/` (untracked)
- Testumgebung: Windows, Node v24.15.0, npm 11.10.0, Python 3.13.14, Playwright 1.64.0 (Chromium 1248 installiert)
- Ermittelte Testsuiten und Quellen der Testbefehle: `package.json` Scripts (`test` → `vitest run`, `typecheck` → `tsc --noEmit`, `lint` → `eslint .`, `format:check` → `prettier --check .`, `check:strings` → `no-hardcoded-strings-check.py`, `test:e2e` → `playwright test`); Git-Hooks `.githooks/pre-commit` (i18n-, Strings-, Map-Schema-, Math.random-, Stub-, Component-Usage-Checks, Prettier auf gestagte Dateien); `vite.config.ts` Coverage-Threshold `lines: 70` (v8).

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Vitest | `npm test` | Repo-Root | 0 | 597 (53 Dateien) | 0 | 0 | [baseline-npm-test.txt](test-results/baseline-npm-test.txt) |
| Typecheck | `npm run typecheck` | Repo-Root | 0 | – | 0 | – | [baseline-typecheck.txt](test-results/baseline-typecheck.txt) |
| Lint | `npm run lint` | Repo-Root | 0 | – | 0 | – | [baseline-lint.txt](test-results/baseline-lint.txt) |
| Format | `npm run format:check` | Repo-Root | 0 | – | 0 | – | [baseline-format.txt](test-results/baseline-format.txt) |
| Strings | `npm run check:strings` | Repo-Root | 0 | 21 tsx geprüft | 0 | – | [baseline-strings.txt](test-results/baseline-strings.txt) |
| i18n | `python .githooks/i18n-check.py` | Repo-Root | 0 | 2 Kataloge in Parität | 0 | – | [baseline-i18n.txt](test-results/baseline-i18n.txt) |
| Map-Schema | `python .githooks/map-schema-check.py` | Repo-Root | 0 | – | 0 | – | [baseline-map-schema.txt](test-results/baseline-map-schema.txt) |
| Math.random | `python .githooks/no-math-random-check.py` | Repo-Root | 0 | – | 0 | – | [baseline-math-random.txt](test-results/baseline-math-random.txt) |
| E2E Design | `npx playwright test e2e/design.spec.ts` | Repo-Root | 0 | 3 | 0 | 0 | [baseline-e2e-design.txt](test-results/baseline-e2e-design.txt) |

### Nachgewiesene bestehende Testfehler

Keine — alle ausgeführten Läufe sind fehlerfrei.

### Testlücken und Ausführungsprobleme

- Übrige Playwright-Specs (`ganove.spec.ts`, `detektiv.spec.ts`, `menu.spec.ts`, `i18n-a11y.spec.ts`, `persistenz.spec.ts`) wurden im Baseline-Lauf nicht vollständig ausgeführt (nur `design.spec.ts` als karten-/designnächste Suite); sie werden im Abschluss-Testlauf (Schritt 10) vollständig ausgeführt.
- Coverage-Lauf (`npm run coverage`) wurde in der Baseline nicht separat ausgeführt; Threshold `lines ≥ 70 %` ist konfiguriert.

## Testklassen (kartenrelevant)

### `MapGraph.test.tsx` (`src/components/`)
- `renders every node with its clear name and every edge` — `[data-node-id]`/`[data-edge]`-Zählung und Namenstexte
- `marks fahrt edges differently from weg edges` — `data-edge-type`
- `greys out blocked edges and marks them with a barrier glyph` — `data-blocked`, `data-block-glyph`
- `offers legal targets as clickable, keyboard-operable nodes` — `role`, `tabindex`, `aria-label`, Klick/Tastatur
- `renders detective markers … ganove marker only when given` — `data-detective`, `data-ganove`
- `marks mission targets, the current target and escape points by shape` — `data-mission-target`, `data-escape-node`
- `renders spawn choices via selectableNodeIds`, `does not offer non-legal nodes`
- `renders no camera elements or hint artifacts` — Perspektiven-Asymmetrie
- `renders camera glyphs with an active flag and a strike when inactive` — `data-camera*`
- `renders category badges and zone halos on demand` — `data-category`, `data-zone`
- `highlights the active detective marker` — `data-active-detective`
- `renders marker pins and the deduction overlay ring` — `data-marker`, `data-possible`
- `offers markable nodes …`, `roams between interactive nodes with the arrow keys` — Tastatur
- `renders the comic board layer and landmark glyphs when the pack provides them` — `data-board-style`, `data-landmark`, `pointer-events` der Deko-Layer

### E2E (`e2e/`)
- `design.spec.ts` — Design-Fundament (Font, `:root`-Tokens, keine externen Font-Requests); erweiterbar um Brett-Assertions
- `ganove.spec.ts`, `detektiv.spec.ts` — Spielflüsse der beiden Perspektiven (introspektieren `window.__gameStore`, URL-Params `?map=&seed=`)
- `menu.spec.ts`, `i18n-a11y.spec.ts`, `persistenz.spec.ts` — Menüfluss, i18n/A11y, Save/Replay

## Hilfsmethoden

### `loadMap` (`src/logic/MapLoader.ts`)
- `loadMap("teststadt")` — lädt die Testkarte mit bekannten Knoten `a`–`i` (u. a. `h` = „Prinzipalmarkt"), 1 Fahrt-Kante; **kein** `board`-Objekt → `data-layer="board"` entsteht nur über im Test injizierte Features.
