# Bestandsaufnahme: Kartenartige Panels und UI-Elemente (Schritt 6)

Analysiert wurden die CSS-Module und Komponenten, die laut `requirement.md`
die Kartenhaptik erhalten sollen, sowie der Test-Ausgangszustand des
Projekts.

## Zusammenfassung

- `src/theme.css` stellt bereits alle benötigten Design-Tokens bereit:
  dunkle Panel-Palette (`--color-panel-bg`, `--color-surface-raised`,
  `--color-border`), Brettspiel-Tokens (`--color-cardboard`,
  `--color-cardboard-edge`, `--color-paper`, `--color-ink`), Schatten
  (`--shadow-panel`, `--shadow-board`) und die Schmuckschrift
  (`--font-display` = IM Fell English, lokal eingebettet seit Schritt 1).
- `GanoveScreen.module.css` ist das faktische Shared-Theme: 12 Screens
  importieren es als `shared`. `.panel`, `.panelHeading`, Buttons,
  `.confirm`, `.notice`, `.splash*` sind vorhanden — aber flach
  (1px-Border, kein Schatten, keine Kartenhaptik).
- `Menu.module.css` enthält die Menü-/Auswahl-Flächen (`.card`,
  `.statBox`, `.fieldGrid`-Inputs, `.summaryTable`, `.perspectiveToggle`),
  ebenfalls flach. `.heading`-artige Headings nutzen teils schon
  `var(--font-display)`.
- Komponenten-Module `MissionPanel`, `HeatBadge`, `PursuitBadge`,
  `EventBanner` existieren mit `role="status"`/`aria-live`-Semantik und
  `data-*`-Attributen (Testvertrag) — Pills/Banner sind ebenfalls flach.
- Das Brett (`MapGraph`, `MapBackdrop`, `boardPieces`) wurde in den
  Schritten 2–5 bereits mit Pergament-/Plaketten-/Meeple-Optik gestaltet
  und liefert das gestalterische Vorbild (mehrschichtiger Rand via
  Border + `box-shadow`-Ring, Fassungs-/Präge-Metapher).
- Kein CSS-Modul deklariert aktuell `box-shadow` auf Panels (nur
  `.banner` in EventBanner hat `box-shadow`), keine Outline/Inset-Lines.

Test-Ausgangszustand: Vitest 617/617 grün, Playwright 36/36 grün,
lint/format/strings/i18n grün — **aber** `npm run typecheck` mit 4
vorab existierenden Fehlern in `src/components/MapGraph.test.tsx`
(preexisting, siehe [Tests](inventory/tests.md)).

## Details

- [UI-Flächen und CSS-Module](inventory/ui.md)
- [Tests](inventory/tests.md)
