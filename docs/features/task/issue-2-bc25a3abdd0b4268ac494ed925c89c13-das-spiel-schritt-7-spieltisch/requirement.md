# Übersetzte Anforderung: Spieltisch (Schritt 7, „Finales Brettspiel-Design")

## Fachliche Zusammenfassung

Die bisher entwickelten Brettspiel-Elemente (helles Pergament-Brett, Edelkarten-Panels, Schmuckschrift) werden zu einer einheitlichen „Spieltisch"-Komposition zusammengeführt: Die Screen-Grundfläche wird zur dunklen Tischfläche (bestehende `bg-noir`-Textur plus CSS-Gradienten über den Tokens `--color-table`/`--color-table-edge`), das Spiellayout (`.layout` aus `.mapArea` und `.sidebar`) wird als gerahmte Einheit gestaltet — das Brett steht sichtbar auf dem Tisch, die Seitenleiste liest sich als Kartenstapel. Dieses System gilt anschließend für **alle** Screens: `MainMenu`, `MapSelect`, `MissionSelect`, `ModeSelect`, `SettingsScreen`, `DevModeScreen`, `StatsScreen`, `ResumeScreen`, `ReplayScreen` und `AppSettingsScreen`. Die Umsetzung erfolgt ausschließlich über CSS — DOM-Hierarchie, `data-view`- und `data-testid`-Attribute bleiben unverändert (Testvertrag).

## Akzeptanzkriterien

1. Jeder Screen wirkt wie derselbe „Spieltisch": gleiche Tischfläche, Kartenpanels, Schmuckschrift-Titel, konsistente Ränder/Schatten — kein Rest alter flacher Dark-Box-Optik.
2. Menü → Setup → Partie → Auswertung/Replay laufen unverändert durch; der Overlay-Stack (EventBanner, Outcome-Splash, Verfolgungs-Vignette `.mapArea::after`) bleibt korrekt geschichtet.
3. `data-view`, alle `data-testid`s und die responsive Stapelung (Breakpoint 900 px, vertikales Stapeln) bleiben erhalten; Vitest und Playwright inklusive der E2E-Menüspecs sind grün.

## Betroffene Klassen und Komponenten

- **CSS-Module (Hauptarbeit):**
  - `src/theme.css` — ggf. neue Tokens für Tischfläche/Tischrand und Rahmenanatomie (z. B. Holzrand-/Filzeinlage-Gradienten als wiederverwendbare Token-Listen analog `--card-face`/`--card-rim`)
  - `src/components/GanoveScreen.module.css` — `.screen` (Tischfläche), `.layout` (gerahmte Einheit), `.mapArea` (Brett auf dem Tisch, Overlay-Stack), `.sidebar` (Kartenstapel); Basis-Modul, dessen Klassen alle Screens über `shared` nutzen
  - `src/components/Menu.module.css` — `.perspectiveToggle` (neu gestylt), `.cardImage` (gerahmte Bildfläche), ggf. Menü-Komposition
  - `src/App.module.css` — `.shell` als Tisch-Hintergrund hinter allen Screens
  - `src/components/DetektivScreen.module.css`, `EventBanner.module.css`, `MissionPanel.module.css`, `HeatBadge.module.css`, `PursuitBadge.module.css`, `MapBackdrop.module.css`, `boardPieces.module.css` — nur soweit nötig für Konsistenz (Overlay-Stack!)
- **TSX-Komponenten:** keine strukturellen Änderungen — `data-view`/`data-testid`-Träger und DOM-Hierarchie sind Testvertrag
- **Assets:** kein neues Raster-Asset (Projektentscheid — CSS-Gradient + bestehende `bg-noir`-Textur); `src/assets/ASSETS.md` bleibt unverändert
- **Tests:** bestehende Vitest-/Playwright-Suiten müssen unverändert grün bleiben; neue E2E-Nachweise für die Tischkomposition kommen in `e2e/design.spec.ts`

## Implementierungsansatz

- `.screen` in `GanoveScreen.module.css` (von allen Screens als `shared.screen` genutzt) wird zur Tischfläche: `bg-noir.jpg` bleibt Texturbasis, darüber Gradienten in `--color-table`/`--color-table-edge` (Vignette zum Rand, warme Tischmitte).
- `.layout` erhält eine Rahmen-/Einlege-Anatomie (Holz- bzw. Kartonrand, Einlegefläche, konsistente Abstände), sodass `.mapArea` (Brett mit bestehendem Pergamentrand + `--shadow-board`) und `.sidebar` (Edelkarten-Panels als Kartenstapel/Ablagefach) als Einheit lesen.
- Der z-index-Stack in `.mapArea` wird geprüft: `EventBanner` (z-index 5), `.splash` und die `::after`-Verfolgungs-Vignette müssen über dem Brett schweben.
- `.perspectiveToggle` in `Menu.module.css` wird im neuen Kartenlook gestylt.
- Keine neuen Komponenten, keine neuen Klassen im TSX, keine Logikänderungen.

## Konfiguration

Keine — reine CSS-/Token-Arbeit, keine neuen Einstellungen.

## Offene Fragen

Keine — der Projekt-Kontext beantwortet die einzige Design-Frage (Tischfläche per CSS-Gradient + `bg-noir`, kein neues Raster-Asset) bereits als Projektentscheid.
