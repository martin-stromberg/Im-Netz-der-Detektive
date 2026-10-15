# Bestandsaufnahme Detail: Tests

## Test-Ausgangszustand vor der Umsetzung

- Zeitpunkt (mit Zeitzone): 2026-10-15 18:28–18:45 UTC
- Branch und Commit-ID: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-4-spielfiguren` @ `cba68ad`
- Uncommittete Änderungen im getesteten Stand: nur Lifecycle-Artefakte
  unter `docs/features/…schritt-4-spielfiguren/` (kein Produktivcode)
- Testumgebung und Runtime-/SDK-Versionen: Node v24.15.0, npm 11.10.0,
  Vitest 5 (jsdom), Playwright 1.64 (Chromium), Windows 11 / git bash
- Ermittelte Testsuiten und Quellen der Testbefehle: `package.json`
  `scripts.test` (`vitest run`), `scripts.lint` (`eslint .`),
  `scripts.typecheck` (`tsc --noEmit`), `scripts.test:e2e`
  (`playwright test`, `playwright.config.ts` — webServer auf :5173)

### Testläufe

| Lauf | Befehl inkl. Filter | Arbeitsverzeichnis | Exit-Code | Erfolgreich | Fehlgeschlagen | Übersprungen | Nachweis |
|------|--------------------|--------------------|-----------|-------------|----------------|--------------|----------|
| Vitest | `npm test` | Repo-Root | 0 | 606 (53 Dateien) | 0 | 0 | [baseline-npm-test.txt](test-results/baseline-npm-test.txt) |
| ESLint | `npm run lint` | Repo-Root | 0 | – (keine Meldungen) | 0 | – | [baseline-lint.txt](test-results/baseline-lint.txt) |
| TypeScript | `npm run typecheck` | Repo-Root | 0 | – (keine Fehler) | 0 | – | [baseline-typecheck.txt](test-results/baseline-typecheck.txt) |
| Playwright (design) | `npx playwright test e2e/design.spec.ts` | Repo-Root | 0 | 5 | 0 | 0 | [baseline-e2e-design.txt](test-results/baseline-e2e-design.txt) |
| Playwright (alle) | `npx playwright test` | Repo-Root | 0 | 34 | 0 | 0 | [baseline-e2e.txt](test-results/baseline-e2e.txt) |

Hinweis: `playwright.config.ts` nutzt `reuseExistingServer: false`; ein
bereits laufender Dev-Server auf :5173 wurde über eine temporäre lokale
Konfiguration (`playwright.reuse.config.ts`, `reuseExistingServer: true`,
nicht committed) wiederverwendet.

### Nachgewiesene bestehende Testfehler

Keine — alle Suiten grün.

### Testlücken und Ausführungsprobleme

Keine.

## Testklassen (betroffen von dieser Anforderung)

### `src/components/MapGraph.test.tsx`

- `renders detective markers with numbers and the ganove marker only when given` —
  zählt `[data-detective]` (2), `[data-ganove]` nur mit `ganovePosition`.
- `highlights the active detective marker` — `[data-detective="1"]` trägt
  `data-active-detective="true"`, `…="0"` nicht.
- `renders no camera elements or hint artifacts — asymmetric by construction` —
  Asymmetrie-Nachweis.
- `renders each place as a framed plaque token, not a flat dot` —
  Plaketten-Anatomie (Referenzmuster für Figuren-Anatomie-Test).
- `embosses the token face with a defs gradient that resolves` —
  Gradient-Referenzmuster (url(#…)-Auflösung).
- `keeps defs ids unique when several maps share a document` —
  Eindeutigkeit aller `filter[id]`/`radialGradient[id]` +
  `url(#…)`-Auflösbarkeit.
- `Map legend swatches` — `MapLegend` + `DetectiveMapLegend` rendern je
  genau 1× `legendTargetRing/Dot/Inner` (Referenzmuster für
  Figuren-Legenden-Miniaturen).

### `e2e/design.spec.ts`

- `places render as embossed plaque tokens with legend mirror` —
  Browser-Nachweis: Computed Styles (Rim-Stroke, Gradient-Fill,
  Schatten-Opacity), Legenden-Mirror, Fokus-Ring. Referenzmuster für den
  Figuren-E2E-Nachweis (jsdom-Falle: nur E2E prüft reale CSS-Deklaration).

### Weitere berührte Suites

- `src/components/GanoveScreen.test.tsx`, `src/components/DetektivScreen.test.tsx` —
  rendern die Legenden indirekt mit; `[class*='legendTarget*']`-Selektoren
  werden in `MapGraph.test.tsx` verwendet.

## Hilfsmethoden

- `loadMap("teststadt")` (`MapLoader`) — kleine deterministische Testkarte
  für jsdom-Tests.
- E2E-Setup: URL-Parameter `?mode=`, `?map=`, `?seed=`, `?mission=`;
  `window.__gameStore` (nur DEV-Build) für Introspektion.
