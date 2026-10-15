# Übersetzte Anforderung — Schritt 6: Kartenartige Panels und UI-Elemente

**Projekt:** Finales Brettspiel-Design (`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel`), Entwicklungsschritt 6 von 8.
**Basisbranch:** `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel`

## Fachliche Zusammenfassung

Alle UI-Flächen des Spiels erhalten eine einheitliche „Spielkarten-Haptik":
Panels, Karten, Buttons, Badges, Hinweis- und Bestätigungsflächen,
Statistik-Boxen, Formular-Inputs, Tabellen, Perspektiv-Umschalter und
Splash-Overlays werden als dunkle „Edelkarten" auf dem Spieltisch
gestaltet — mit mehrschichtigem Kartenrand (Border + Inset-Line/Outline),
konsistenten Radien, Tischschatten und optionaler dezenter Ecken-Prägung.
Die Umsetzung erfolgt ausschließlich CSS-seitig in den bestehenden
CSS-Modulen; DOM-Struktur, Klassennamen und `data-*`-Attribute bleiben
unverändert (Testvertrag).

**Belegter Kontext (Nutzerentscheidung):** „Pergament-Brett + dunkle
Umgebung" — nur das Spielbrett ist Pergament; alle Panels bleiben dunkel
(Edelkarten auf dem dunklen Tisch um das helle Brett herum).

## Betroffene Klassen und Komponenten

### CSS-Module (ausschließliche Änderungsfläche)

- `src/components/GanoveScreen.module.css` — Shared-Theme, das von fast
  allen Screens über `shared`-Import genutzt wird: `.panel`,
  `.panelHeading`, `.primaryButton`, `.secondaryButton`, `.dangerButton`,
  `.confirm`, `.notice`, `.splash` + `.splash_*`-Varianten.
- `src/components/Menu.module.css` — `.card` (Auswahl-Karten),
  `.statBox`, `.fieldGrid`-Inputs (`.numberInput`, `.selectInput`,
  `.rangeInput`), `.summaryTable`, `.perspectiveToggle`, `.badge`.
- `src/components/MissionPanel.module.css` — `.panel`, `.heading`,
  `.choiceButton`, `.choice`.
- `src/components/HeatBadge.module.css` — `.badge` + `.level_*`.
- `src/components/PursuitBadge.module.css` — `.badge` + `.level_*`.
- `src/components/EventBanner.module.css` — `.banner` + `.tone_*`.
- `src/theme.css` — Design-Tokens; bei Bedarf neue „Edelkarten"-Tokens
  ergänzen (z. B. Kartenrand-/Präge-Farben, abgestufte Schatten).
- `src/components/DetektivScreen.module.css` — ergänzende Klassen der
  Detektiv-Perspektive (`.commentInput`, `.removeButton`), soweit sie
  zur Kartenhaptik gehören.

### Explizit NICHT betroffen

- Keine `.tsx`-Änderungen: DOM-Struktur, Klassennamen, `data-testid`,
  `data-view`, `data-heat-level`, `data-pursuit-level` usw. sind
  Testvertrag und bleiben unverändert.
- Brett-Rendering (`MapGraph.module.css`, `MapBackdrop.module.css`,
  `boardPieces.module.css`): Bereits in Schritten 2–5 gestaltet; das
  Pergament-Brett bleibt wie es ist.
- Keine neuen sichtbaren Strings (i18n-/Hardcoded-Checks müssen grün
  bleiben).

## Designvorgaben (aus der Anforderung)

1. **Dunkle Edelkarte:** Panels/Karten bleiben dunkel
   (`--color-panel-bg`-Familie), wirken aber wie physische Karten:
   mehrschichtiger Rand (äußere Border + Inset-Line/Outline als
   „Kartenkante"), konsistente Radien, Schatten („Karte liegt auf dem
   Tisch"), optional dezente Ecken-Prägung.
2. **Headings** in der Schmuckschrift aus Schritt 1
   (`--font-display` / IM Fell English) — teilweise bereits vorhanden,
   auf allen Panel-Headings vereinheitlichen.
3. **Buttons** dürfen leicht „metallisch/embossed" wirken (Gradient +
   Rand + Schatten), müssen aber Farbcodierung und Text beibehalten.
4. **Badges** (`HeatBadge`, `PursuitBadge`) bleiben
   `role="status"`-Pills, bekommen denselben Kartenlook; Symbolglyphen
   und Level-Farbcodierung (ruhig → kritisch) bleiben form- UND
   farbkodiert.
5. **Legenden-Swatches nicht brechen** (Papier-Chips in `.legendItem
   svg` und die `legend*`-Klassen bleiben funktionsfähig).
6. **Reduced motion** respektieren (bestehende
   `prefers-reduced-motion`-Regeln beibehalten, keine neuen
   bewegungsbasierten Effekte ohne Abschaltung).
7. **Kontraste ≥ WCAG AA** (4.5:1 Text), im Header-Kommentar der
   geänderten CSS-Module dokumentiert.

## Akzeptanzkriterien

- Panels, Karten, Buttons und Badges zeigen einheitliche Kartenhaptik
  (Rand, Schatten, Materialität) auf allen Screens.
- `:focus-visible`- und Hover-Zustände unverändert; Zielgrößen nicht
  verkleinert; Kontraste ≥ AA dokumentiert.
- Keine neuen sichtbaren Strings (i18n-/Hardcoded-Checks grün);
  `data-testid`/`data-view`/`data-heat-level`/`data-pursuit-level` etc.
  unverändert; Vitest/Playwright grün.

## Konfiguration

Keine — das Design ist fest verdrahtet über `theme.css`-Tokens.

## Offene Fragen

Keine — die Anforderung benennt Zielklassen, Design-Parameter und
Randbedingungen eindeutig.
