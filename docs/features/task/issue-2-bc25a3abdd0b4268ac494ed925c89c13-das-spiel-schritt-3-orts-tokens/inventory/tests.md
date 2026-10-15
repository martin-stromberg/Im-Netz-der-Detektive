# Bestandsaufnahme: Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-15T19:58:49+02:00
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-3-orts-tokens`, HEAD `9dfec1d`
- Uncommittete Änderungen im getesteten Stand: nur Lifecycle-Artefakte unter `docs/features/` (kein Produktivcode)
- Testumgebung und Runtime-/SDK-Versionen: Windows, Node.js v24.15.0, Vitest (jsdom), Playwright 1.64.0 (Chromium)
- Ermittelte Testsuiten und Quellen der Testbefehle: `package.json` — `npm test` → `vitest run`; `npm run test:e2e` → `playwright test` (dev server auf Port 5173)

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Vitest-Baseline | `npx vitest run` | Repo-Root | 0 | 600 (53 Dateien) | 0 | 0 | [vitest-baseline.log](test-results/vitest-baseline.log) |
| Playwright-Baseline | `npx playwright test --config=playwright.reuse.config.ts` (Reuse des laufenden Dev-Servers auf :5173, Basisconfig unverändert) | Repo-Root | 0 | 33 | 0 | 0 | [playwright-baseline.log](test-results/playwright-baseline.log) |

### Nachgewiesene bestehende Testfehler

Keine — beide Suiten vollständig grün.

### Testlücken und Ausführungsprobleme

Der erste Playwright-Lauf mit der Basisconfig scheiterte am belegten Port 5173
(`reuseExistingServer: false`); die Wiederholung nutzte eine temporäre Config
`playwright.reuse.config.ts` mit `reuseExistingServer: true` gegen denselben
Worktree-Dev-Server — kein Testfehler, nur Setup-Hinweis.

## Testklassen

### `MapGraph.test.tsx` (`src/components/MapGraph.test.tsx`)

- `renders every node with its clear name and every edge` — `[data-node-id]`, Labels, `[data-edge]`
- `marks fahrt edges differently from weg edges` — `data-edge-type`
- `greys out blocked edges and marks them with a barrier glyph` — `data-blocked`, `data-block-glyph`
- `offers legal targets as clickable, keyboard-operable nodes` — `role`, `tabindex`, `aria-label`, Click/Enter/Space
- `does not offer non-legal nodes for selection`
- `renders detective markers … and the ganove marker only when given` — `data-detective`, `data-ganove`
- `marks mission targets, the current target and escape points by shape` — `data-mission-target`, `data-escape-node`
- `renders spawn choices via selectableNodeIds` — `data-selectable`
- `renders no camera elements or hint artifacts` — Info-Leak-Vertrag
- `renders camera glyphs with an active flag and a strike when inactive` — `data-camera(-active)`
- `renders category badges and zone halos on demand` — `data-category`, `data-zone`
- `highlights the active detective marker` — `data-active-detective`
- `renders marker pins and the deduction overlay ring` — `data-marker`, `data-possible`
- `offers markable nodes as keyboard-operable marker toggles` — `data-markable`
- `roams between interactive nodes with the arrow keys` — Fokus-Roaming
- `renders a parchment board face beneath every data layer` — defs/Filter/Gradient, Layer-Reihenfolge
- `keeps defs ids unique when several maps share a document` — `filter[id]`, `radialGradient[id]`, alle `url(#…)`-Referenzen auflösbar
- `keeps the data-layer order intact` — `["board","edges","landmarks","nodes","markers"]`
- `renders the comic board layer and landmark glyphs` — `pointer-events="none"` auf Dekor-Layern

### `GanoveScreen.test.tsx` / `DetektivScreen.test.tsx`

Testen u. a. `map-legend`-Testid und Legenden-Einträge; keine pixelgenauen
Swatch-Assertions.

### E2E (`e2e/`)

- `design.spec.ts` — Theme-Tokens auf `:root`, Pergament-Brett (defs,
  `data-layer="board"`), Label-Luminanz < 0.4 (AA-Proxy)
- `ganove.spec.ts` — `data-selectable`, `data-legal-target`, Klickfluss
- `detektiv.spec.ts` — `data-selectable`, `data-node-id`, Marker-Fluss,
  Tastatur
- `i18n-a11y.spec.ts` — Pfeiltasten-Roaming + Enter, Fokus auf
  `data-legal-target`
- `menu.spec.ts`, `persistenz.spec.ts` — indirekt (Legende/Map sichtbar)

## Hilfsmethoden

### `loadMap` (`src/logic/MapLoader.ts`)
- `loadMap("teststadt")` — Testkarte mit wenigen Knoten für die Komponententests
