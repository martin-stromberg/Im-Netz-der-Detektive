# Bestandsaufnahme — Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-15, ca. 20:54–21:10 (lokale Zeit, UTC+2)
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-5-routen` @ `494267e54a51e82d64648e8554dce2ed3ae2ff00`
- Uncommittete Änderungen im getesteten Stand: nur Artefakte dieser Bestandsaufnahme unter `docs/features/…schritt-5-routen/` plus die Laufzeit-Hilfsdatei `playwright.local.config.ts` (`reuseExistingServer: true`, da bereits ein vite-Devserver auf :5173 lief); kein Produktivcode geändert.
- Testumgebung und Runtime-/SDK-Versionen: Windows, Node v24.15.0, npm (package-lock), Vitest (jsdom), Playwright Chromium.
- Ermittelte Testsuiten und Quellen der Testbefehle: `package.json` → `scripts.test` (`vitest run`), `scripts.test:e2e` (`playwright test`), `scripts.typecheck`, `scripts.lint`, `scripts.format:check`, `scripts.check:strings`.

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Baseline Unit/Component | `npm test` (`vitest run`) | Repo-Root | 0 | 614 (53 Dateien) | 0 | 0 | [baseline-npm-test.txt](test-results/baseline-npm-test.txt) |
| Baseline E2E | `npx playwright test --config playwright.local.config.ts` | Repo-Root | 0 | 35 | 0 | 0 | [baseline-e2e.txt](test-results/baseline-e2e.txt) |
| Baseline Checks | `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run check:strings` | Repo-Root | 0 | — | — | — | [baseline-checks.txt](test-results/baseline-checks.txt) |

Hinweis E2E: `playwright.config.ts` hat `reuseExistingServer: false`; ein bereits laufender vite-Devserver (dieses Repos) belegte :5173. Die Baseline lief daher über die temporäre `playwright.local.config.ts` gegen genau diesen Devserver (DEV-Build, `__gameStore` verfügbar).

### Nachgewiesene bestehende Testfehler

Keine — alle 649 Tests (614 Vitest + 35 Playwright) bestanden im Ausgangslauf.

### Testlücken und Ausführungsprobleme

Keine. `npm test` läuft ohne Coverage-Flag (Coverage via `npm run coverage` möglich, für die Bestandsaufnahme nicht erforderlich).

## Testklassen (kantenrelevant)

### `MapGraph.test.tsx` (`src/components/`)

- `renders every node with its clear name and every edge` — prüft `[data-edge]`-Anzahl = `map.edges.length` (Testvertrag DOM-Struktur).
- `marks fahrt edges differently from weg edges` — prüft `[data-edge-type="fahrt"]` = 1, `[data-edge-type="weg"]` = Rest (teststadt: 13 Kanten, davon 1 `fahrt` `f–g`).
- `greys out blocked edges and marks them with a barrier glyph` — prüft `[data-blocked="true"]` + `[data-block-glyph="f-g"]`; expired block bleibt frei.
- `keeps the data-layer order intact` — Layer-Reihenfolge `board, edges, landmarks, nodes, markers`.
- `keeps defs ids unique when several maps share a document` — `useId`-Korrektheit (zwei `MapGraph`-Instanzen).
- `describe("Map legend swatches")` — Legenden-Plaketten- und Figuren-Swatches (`legendTargetRing/Dot/Inner`, `data-piece`); **keine** direkten Assertions auf `legendWeg`/`legendFahrt`.

### `GanoveScreen.test.tsx` (`src/components/`)

- Umwelt-Sperrung → `[data-edge="a-b"] [class*="edgeFlash"]` nicht null (Testvertrag `edgeFlash`-Klasse auf der Kante).

### `e2e/design.spec.ts`

- `map renders as a parchment board …` — Brettfläche, Körnung, Vignette, Label-Kontrast.
- `places render as embossed plaque tokens with legend mirror` — Token-Anatomie + Legenden-Spiegelung.
- `game pieces stand as shaded meeples …` — Figuren-Anatomie, `markerMove`-Transition, Reduced-Motion (`transitionDuration 0s`), Amber-Fahne.
- Keine kantenspezifischen E2E-Assertions bisher.

## Hilfsmethoden

- `loadMap("teststadt")` (`src/logic/MapLoader.ts`) — deterministisches Testkartenpack (13 Kanten, 1× `fahrt`).
- `isEdgeBlocked(a, b, blockedEdges, round)` (`src/logic/Movement.ts`) — Block-Status inkl. `untilRound`.
- `startPlaying(...)`-Helper in `GanoveScreen.test.tsx` — treibt den Screen in den Spielzustand für `flashEdges`.
