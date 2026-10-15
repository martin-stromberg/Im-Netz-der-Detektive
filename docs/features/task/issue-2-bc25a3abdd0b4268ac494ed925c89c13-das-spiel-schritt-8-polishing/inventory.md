# Bestandsaufnahme: Schritt 8 — Konsistenz-Endabnahme und Polishing

Analysiert wurde der komplette Design-Stand nach den gemergten
Schritten 1–7 (theme.css-Tokens, IM Fell English lokal, Pergament-Brett
mit Papprand + Schatten, Orts-Plaketten-Tokens, Meeple-Figuren, cased
Routen, Edelkarten-Panels, Tisch-Komposition) gegen die Checkliste in
`docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/inventory/conventions.md`.

## Zusammenfassung

- **Screens:** Alle 12 Screens/Komponenten konsumieren die Theme-Module
  (`shared` aus `GanoveScreen.module.css`, `Menu.module.css` bzw. eigene
  Module); kein Screen im „nackten" Vor-Design-Stil. Keine Inline-Hex-
  Styles außer dokumentierten Glyph-Paletten (`landmarks.tsx`,
  `boardPieces.tsx`).
- **Legenden:** `MapLegend` (`GanoveScreen.tsx:103`) und
  `DetectiveMapLegend` (`DetektivScreen.tsx:111`) spiegeln die finalen
  Formen: cased-Route-Swatches (`legendWegCasing`/`legendFahrtCasing` +
  Papierkern), Meeple-Miniaturen via `DetectivePiece`/`GanovePiece`,
  Plaketten-Swatch (`legendTargetDot/Ring/Inner`), Kamera/Pin/Diamant/
  Kategorie-Glyphen identisch zur Karte.
- **Form+Farbe:** HeatBadge (Signalbalken + Text), PursuitBadge
  (schrumpfender Ring/Punkt + Text), EventBanner (Glyphen `ℹ ◆ ▲ ✓` +
  Ton), Splash (`splash_<outcome>` Farbe + 2-px-Border + Text),
  Mission-Steps (`✓ ▶ ○` + Durchstreichung), blockierte Kanten
  (unterbrochener Kern + X-Glyph).
- **Motion:** Alle Animationen (`edge-flash`, `markerMove`-Transition,
  `pursuit-pulse`, `splash-in`, `banner-in`) besitzen
  `prefers-reduced-motion`-Blöcke. **Befund:** die
  `box-shadow`-Transition auf `.mapArea::after`
  (`GanoveScreen.module.css:147`) ist im Reduce-Block nicht abgedeckt.
- **Fokus:** **Befund** — drei `:focus-visible`-Regeln entfernen die
  Outline und signalisieren Fokus nur über eine Farbänderung:
  `.primaryButton` (GanoveScreen.module.css:310–313, nur Background-
  Swap), `.numberInput`/`.selectInput` (Menu.module.css:131–134, nur
  Border-Recolor), `.removeButton` (DetektivScreen.module.css:144–147,
  nur Border-Recolor). Vergleichselemente (`.secondaryButton`,
  `.dangerButton`, `.card`, `.rangeInput`, `.choiceButton`,
  `.commentInput`, SVG-Knoten via `tokenRim`) haben einen sichtbaren
  amber Outline/Ring — die Konvention ist „amber Outline/Ring".
- **Kontrast-Tabellen:** `theme.css`-Header dokumentiert alle Token-
  Paare inkl. Edelkarte- und Board-Paare. **Befund:** das Input-Paar
  `--color-text` auf `--color-inset-bg` (`.numberInput`,
  `.selectInput`, `.commentInput`; gemessen ≈ 16,1:1) fehlt in den
  Tabellen von `theme.css` und `GanoveScreen.module.css`.
- **Verträge:** `MapGraphProps` hat keine gegnerischen Daten-Props
  (`cameras`, `missionTargets`, `escapeNodeIds`, `ganovePosition`
  werden nur perspektivisch korrekt gefüttert: `DetektivScreen`
  übergibt weder `ganovePosition`/`missionTargets`/`escapeNodeIds`,
  `GanoveScreen` übergibt keine `cameras`; `MissionSelect` nur
  `selectableNodeIds`). `data-*`-Selektoren der Checkliste sind alle
  vorhanden. Kein `Math.random()` (Hook + Grep). i18n-Parität:
  de.json = en.json = 271 Keys.
- **Build/Assets:** `npm run build` grün; `dist` enthält nur eine
  externe Zeichenkette (Reacts eingebaute `error-decoder.html`-URL in
  einem Error-String — kein Request) und die beiden WOFF2-Fonts lokal
  unter `dist/assets/`. `ASSETS.md` dokumentiert alle Rasterassets +
  IM Fell English (OFL) — vollständig.

Test-Ausgangszustand: Vitest 617/617 grün (Lines-Coverage 91,44 %,
Threshold 70 %), alle 6 Git-Hook-Checks im `--all --strict`-Modus grün,
Playwright-E2E 39/39 grün — Nachweis in [Tests](inventory/tests.md).

## Details

- [UI/Styling-Auditfläche](inventory/ui.md)
- [Tests](inventory/tests.md)
