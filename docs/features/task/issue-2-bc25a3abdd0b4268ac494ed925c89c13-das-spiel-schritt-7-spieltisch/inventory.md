# Bestandsaufnahme: Spieltisch (Schritt 7)

Bestandsaufnahme der UI-/Stylesheet-Struktur für die Anforderung „Spieltisch" — die Gesamtkomposition aller Screens als einheitlicher Spieltisch (Tischfläche, gerahmtes Spiellayout, Kartenpanels), ausschließlich per CSS.

## Zusammenfassung

- **Alle 12 Screens** teilen bereits dieselbe Grundfläche: `shared.screen` aus `GanoveScreen.module.css` (`.screen`, Zeilen 45–58) — aktuell `bg-noir.jpg` unter einem 93–97 %-Dunkeloverlay in `--color-screen-overlay-soft/strong` auf `--color-screen-bg`. Eine Änderung an `.screen` überführt alle Screens gleichzeitig.
- **Spiellayout** (`.layout` = `.mapArea` + `.sidebar`, GanoveScreen.module.css Zeilen 97–228): nur `GanoveScreen`, `DetektivScreen` und `ReplayScreen` nutzen es — beide Partie-Perspektiven plus Replay-Boards. Heute: schmuckloser Flex-Container (`gap: 16px`), keine Rahmung; `.sidebar` ist eine einfache Panel-Spalte (`flex: 0 0 320px`, `gap: 12px`).
- **Overlay-Stack in `.mapArea`:** `.mapArea` ist `position: relative`; `::after` zeichnet die Verfolgungs-Vignette (inset box-shadow, `pointer-events: none`, letztes Kind → über Brett + Splash), `EventBanner .stack` trägt `z-index: 5`, `.splash` ist absolut ohne z-index.
- **Bereits vorhandene Brettspiel-Materialität** (Schritte 1–6): Pergament-Brett mit 7-px-Kartonrand + `--shadow-board` (`MapGraph.module.css` `.map`), Edelkarten-Anatomie `--card-face`/`--card-rim`/`--shadow-card`/`--radius-card` auf `.panel`/`.card`/`.statBox`/`.confirm`/`.notice`/Badges/MissionPanel/EventBanner, Schmuckschrift `--font-display` auf `.title`/`.panelHeading`/`.cardTitle`/`.statHeading`, Tisch-Tokens `--color-table`/`--color-table-edge` bereits definiert aber **noch ungenutzt**.
- **Verbleibende Flat-Dark-Reste:** `.perspectiveToggle` (flacher Pill mit `background: var(--color-screen-bg)` auf den Buttons), `.cardImage` (nur `border-radius`, Fallback-Fläche `--color-screen-bg`), `.shell` in `App.module.css` (`--color-screen-bg`), `.screen` selbst (flache Dark-Box unter Overlay).
- **Testvertrag:** `data-view`/`data-testid`-Träger und DOM-Hierarchie werden von Vitest (617 Tests) und Playwright (37 Tests) abgesichert; E2E-Designspecs prüfen konkrete Computed Styles (Brett-Anatomie, Karten-Anatomie, Fonts, Tokens) — keine davon betrifft `.screen`-Hintergrund, `.layout`, `.sidebar` oder `.perspectiveToggle`.
- **Test-Ausgangszustand:** Vitest 617/617 grün, Playwright 37/37 grün, `tsc --noEmit` und `eslint` fehlerfrei — siehe [Tests](inventory/tests.md).
- **Dev-Server:** läuft dauerhaft auf Port 5173; die E2E-Suite wird über eine temporäre `playwright.local.config.ts` (`reuseExistingServer: true`) ausgeführt — wird nach jedem Lauf gelöscht, nicht committet.

## Details

- [UI-Struktur und Styles](inventory/ui.md)
- [Tests](inventory/tests.md)
