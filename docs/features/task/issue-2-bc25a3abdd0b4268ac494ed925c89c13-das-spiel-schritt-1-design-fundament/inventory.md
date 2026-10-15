# Bestandsaufnahme: Schritt 1 — Design-Fundament (Theme, Schmuckschrift, Farbvariablen)

Analysiert wurden Styling-Infrastruktur (`src/**/*.module.css`, `src/main.tsx`,
`index.html`), Asset-Verwaltung (`src/assets/`) und die Test-/Hook-Landschaft,
bezogen auf die Anforderung eines globalen `theme.css` mit CSS Custom
Properties, einer lokal eingebetteten OFL-Schmuckschrift und der
`var()`-Umstellung des Shared-Themes.

## Zusammenfassung

- **Kein globales CSS vorhanden:** `src/main.tsx` importiert nur `App` und den
  Store; `index.html` bindet keine Stylesheets ein. Alle Styles liegen in 10
  CSS-Modulen (`*.module.css`).
- **Shared-Theme:** `GanoveScreen.module.css` (394 Zeilen) ist die faktische
  Theme-Datei — 13 Komponenten importieren sie als `shared` und nutzen u. a.
  `.screen`, `.title`, `.panelHeading`, `.panel`, `.primaryButton`,
  `.secondaryButton`, `.dangerButton`, `.legend*`. Ein dokumentierter
  WCAG-AA-Kommentarblock (Zeilen 1–27) listet gemessene Kontrastpaarungen.
- **Palette:** 24 eindeutige Hex-Farben + 9 rgb()/rgba()-Werte über alle
  Module verteilt; alle hardcodiert, keine Custom Properties.
- **Typografie:** Kein `font-family`/`@font-face` im gesamten `src/` —
  überall Systemschrift. `src/assets/fonts/` existiert nicht.
- **Assets:** `src/assets/ASSETS.md` dokumentiert die KI-generierten JPEGs;
  ein Font-Eintrag fehlt.
- **Test-Ausgangszustand:** `npm test` 597/597 grün, `lint`, `typecheck`,
  `format:check`, i18n- und no-hardcoded-strings-Hook jeweils Exit 0 —
  Details in [Tests](inventory/tests.md).

## Details

- [UI / Styles](inventory/ui.md) — CSS-Module, Palette, Heading-Klassen, Nutzung
- [Assets](inventory/assets.md) — vorhandene Assets, ASSETS.md, Font-Quelle
- [Tests](inventory/tests.md) — Test-Ausgangszustand und betroffene Tests
