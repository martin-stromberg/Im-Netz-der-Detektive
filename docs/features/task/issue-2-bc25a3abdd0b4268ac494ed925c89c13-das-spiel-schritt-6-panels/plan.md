# Umsetzungsplan: Kartenartige Panels und UI-Elemente (Schritt 6)

## Übersicht

Alle UI-Flächen erhalten reine CSS-Änderungen zur dunklen
„Edelkarten"-Haptik: mehrschichtiger Kartenrand (Border aus
`--color-cardboard` + Inset-Line + äußerer Kantenring aus
`--color-cardboard-edge`), Tischschatten, konsistente Radien und dezente
Ecken-Prägung. Buttons wirken metallisch/embossed (Gradient + Innenlicht
+ Schatten). Kein `.tsx`-Eingriff — Klassennamen, DOM und `data-*` bleiben
Testvertrag.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
| -------------------- | ---------------- | ---------- |
| Kartenrand-Anatomie | `border` (Kartenband) + `box-shadow`-Schichten: `inset 0 0 0 1px` (gravierte Innenlinie), `0 0 0 1px` (äußere Schnittkante), Tischschatten | Folgt exakt der Brett-Technik aus `MapGraph.module.css .map` (Border + `0 0 0`-Ring + Schatten); kein Layout-Eingriff, keine Pseudo-Elemente nötig |
| Ecken-Prägung | Vier dezente `radial-gradient`-Corner-Highlights als zusätzlicher `background`-Layer, `pointer-events`-frei | Pseudo-Elemente (`::before`/`::after`) wären auf `.panel` riskant (Stacking, vorhandene `::after`-Nutzung auf `.mapArea`); reine Hintergrund-Gradients sind DOM-neutral |
| Kartenfläche | Subtiler Vertikal-Gradient (helleres Top → `--color-panel-bg`) als Karton-Schimmer; Panels bleiben dunkel | Nutzerentscheidung „Pergament-Brett + dunkle Umgebung" — nur leichter Glanz statt Papierfläche |
| Kartenrand-Farben | Wiederverwendung `--color-cardboard` / `--color-cardboard-edge` | Dieselbe Material-Fassung wie der Brettrahmen — Karten und Brett bilden eine Einheit |
| Neue Tokens | `--color-card-line`, `--color-card-face-top`, `--color-amber-deep`, `--color-surface-deep`, `--color-danger-surface-deep`, `--shadow-card`, `--radius-card` | Nur dort neue Tokens, wo kein passender existiert; Werte werden im `theme.css`-Header mit Kontrasten dokumentiert |
| Radien | Neuer Token `--radius-card: 10px` für Kartenflächen (panel/card/statBox/banner/splash/confirm/notice); Controls (Buttons, Inputs, Toggle) bleiben bei 6px, Badges bleiben 999px-Pills | „Konsistente Radien" innerhalb der Flächenfamilie; Zielgrößen unverändert |
| Embossed Buttons | `linear-gradient`-Fläche + `inset 0 1px 0` Top-Licht + `inset 0 -1px 0` Bodenschatten + Drop-Shadow; Hover-/Focus-Regeln unverändert | Metallic-Look ohne die bestehenden Zustandsverträge (Farbwechsel, Amber-Outline) anzutasten |
| Inputs | Vertiefter „Karten-Slot": `--color-inset-bg` + `inset`-Schatten + dunklerer Rand; `:focus-visible` bleibt | Eingaben lesen sich als Einschub in die Karte |
| `.notice` / `.confirm` | Mini-Karten mit Danger-Coding: `.notice` behält die linke 4px-Danger-Leiste (Form-Cue) + Kartenrand/Schatten; `.confirm` wird solide Danger-Karte (Rand + Inset + Schatten + Danger-getönte Fläche) | Farb-/Form-Coding der Warnflächen bleibt, Haptik wird angeglichen |
| E2E-Nachweis | Neuer Test in `e2e/design.spec.ts` — gleiche Spec-Familie wie die bisherigen Design-Schritte | CSS-Materialität ist nur im echten Browser prüfbar (getComputedStyle); jsdom kann keine Layout-Effekte |

## Programmabläufe

Keine — reine Stylesheet-Änderungen, kein Laufzeitverhalten.

## Neue Klassen

Keine neuen CSS-Klassen, keine neuen TS/TSX-Artefakte — nur neue
Custom Properties in `theme.css` und neu gestaltete Deklarationen
bestehender Klassen.

| Element | Typ | Zweck |
| ------- | --- | ----- |
| `--color-card-line` | Token | Helle gravierte Innenlinie der Edelkarte (`rgb(232 220 192 / 16%)`) |
| `--color-card-face-top` | Token | Oberer Gradient-Stop der Kartenfläche (`#1b2332`) |
| `--color-amber-deep` | Token | Dunkler Amber für Primary-Button-Kante/Gradient (`#b8852f`) |
| `--color-surface-deep` | Token | Dunkler Gradient-Stop Secondary-Button (`#151b28`) |
| `--color-danger-surface-deep` | Token | Dunkler Gradient-Stop Danger-Button (`#381b1e`) |
| `--shadow-card` | Token | Tischschatten der Edelkarte (`0 2px 6px …, 0 6px 18px …`) |
| `--radius-card` | Token | Einheitsradius der Kartenflächen (`10px`) |

## Änderungen an bestehenden Klassen

### `src/theme.css`

- **Neue Tokens:** siehe Tabelle oben; Header-Kommentar um die neuen
  Kontrast-Messwerte ergänzen (Kartenfläche, Button-Flächen).

### `GanoveScreen.module.css` (Shared-Theme)

- `.panel`: Card-Anatomie — Gradient-Fläche, `border: 1px solid var(--color-cardboard)`,
  `border-radius: var(--radius-card)`, `box-shadow: inset-Line + outer
  ring var(--color-cardboard-edge) + var(--shadow-card)`, Ecken-Prägung
  via radial-gradients.
- `.panelHeading`: bleibt `var(--font-display)` (bereits vorhanden) —
  keine Änderung nötig.
- `.primaryButton`: Amber-Gradient (`amber-bright → amber → amber-deep`),
  Border `amber-deep`, Inset-Licht + Drop-Shadow.
- `.secondaryButton`: Surface-Gradient, Border `detective` (behalten),
  Inset-Licht + Drop-Shadow.
- `.dangerButton`: Danger-Gradient (`danger-surface-hover → danger-surface
  → danger-surface-deep`), Border `danger` (behalten), Inset + Shadow.
- `.confirm`: solide Danger-Karte — `border: 1px solid var(--color-danger)`,
  getönter Hintergrund `var(--color-danger-surface)` (weich via
  rgba/Token), Inset-Line + Shadow, Radius `--radius-card`.
- `.notice`: `border-left: 4px solid var(--color-danger)` (Form-Cue
  behalten, verstärkt) + restlicher Kartenrand `var(--color-cardboard)`,
  Inset-Line + Shadow, Radius `--radius-card`.
- `.splash` + `.splash_*`: Radius auf `--radius-card`, Farbborder
  behalten, äußerer Kantenring + starker Tischschatten (Overlay schwebt
  über dem Brett) ergänzen.
- Header-Kommentar: Kontrast-Nachweise der neuen Flächen ergänzen.
- `.legendItem svg`-Swatches und `legend*`-Klassen: unverändert.

### `Menu.module.css`

- `.card`: gleiche Card-Anatomie wie `.panel` (Border/Ring/Inset/Shadow/
  Radius); `:hover`-/`::focus-visible`-Regeln (Border amber, Outline)
  unverändert — Hover färbt weiter nur die sichtbare Borderkante.
- `.statBox`: gleiche Card-Anatomie.
- `.fieldGrid`-Inputs (`.numberInput`, `.selectInput`): Inset-Look
  (`inset-bg` + innerer Schatten + `cardboard-edge`-Rand);
  `:focus-visible` bleibt.
- `.rangeInput`: unverändert (`accent-color` reicht).
- `.summaryTable`: äußerer Kartenrand (`border` cardboard) +
  `var(--shadow-card)`; Zellraster bleibt.
- `.perspectiveToggle`: Kartenrahmen (cardboard-Border + Shadow);
  Buttons unverändert (`aria-pressed`-Coding bleibt).
- `.badge`: Mini-Pill mit Inset-Line + kleinem Schatten.
- `.cardImage`: Radius an `--radius-card`-Innenkante angleichen (6px
  bleibt — liegt innerhalb der Karte, kein Konflikt).

### `MissionPanel.module.css`

- `.panel`: Card-Anatomie wie shared `.panel`.
- `.heading`: unverändert (font-display bereits gesetzt).
- `.choiceTitle`: `font-family: var(--font-display)` ergänzen
  (Headings in Schmuckschrift).
- `.choiceButton`: Embossed-Look analog `secondaryButton`.
- `.choice`: Trenner bleibt.

### `HeatBadge.module.css` / `PursuitBadge.module.css`

- `.badge`: Pill-Form behalten; Kartenrand (cardboard-Border +
  Inset-Line + kleiner Schatten `0 1px 4px`).
- `.level_*`: Farbcodierung unverändert; kritische Stufen behalten
  `border-color: danger` (überschreibt weiterhin die Kartenkante —
  Form+Farbe).
- Glyphen-Klassen: unverändert.

### `EventBanner.module.css`

- `.banner`: Kartenrand (Border auf cardboard-Basis, Inset-Line, äußerer
  Ring) + vorhandenen Schatten durch `var(--shadow-card)`-Stapel ersetzen
  (Banner schwebt — Schatten bleibt weich); `tone_alarm`-Border-Coding
  behalten (siegt weiter über den Kartenrand via spezifischerer Regel —
  sicherstellen, dass `.tone_alarm` nach `.banner` deklariert bleibt).

### `DetektivScreen.module.css`

- `.commentInput`: Inset-Look analog `numberInput`.
- `.removeButton`: kleiner Embossed-Look (Surface-Gradient + Danger-Text
  + Schatten); Hover/Focus unverändert.
- Marker-/Legend-Klassen: unverändert.

## Datenbankmigrationen

Keine.

## Validierungsregeln

Keine.

## Konfigurationsänderungen

Keine — nur neue CSS-Custom-Properties in `theme.css`.

## Seiteneffekte und Risiken

- **`e2e/design.spec.ts` „theme custom properties"**: prüft nur die fünf
  Alttokens auf exakte Werte — neue Tokens ändern daran nichts.
- **`box-shadow` auf `.panel`/`.card`**: Playwright-Tests lesen
  `boxShadow` nur auf dem Board (`.map`) — kein Konflikt.
- **`overflow: hidden` in `.perspectiveToggle`**: schneidet die äußere
  `0 0 0 1px`-Schattenkante — dort Schatten bewusst ohne äußeren Ring
  bzw. Ring via `outline` zeichnen.
- **`.notice` mit `border-left`**: die linke Danger-Leiste überschreibt
  gezielt nur eine Seite des Kartenrands — spezifitätsneutral, da
  `border-left` nach `border` deklariert wird.
- **jsdom-Fallstrick**: es werden keine neuen Klassen referenziert —
  alle geänderten Selektoren existieren bereits und werden in den
  `.tsx`-Dateien unverändert genutzt.
- **Hover auf `.card`**: `border-color`-Tausch auf Amber wirkt weiter —
  der äußere Kantenring bleibt dunkel, das ist gewollt (Karte leuchtet
  am Rand auf).

## Umsetzungsreihenfolge

1. **Tokens in `theme.css` ergänzen + Kontraste dokumentieren**
   - Voraussetzungen: Keine
   - Beschreibung: Neue `--color-card-*`/`-deep`/`--shadow-card`/
     `--radius-card`-Tokens; Header-Kommentar um Messwerte erweitern.

2. **Shared-Theme `GanoveScreen.module.css` umgestalten**
   - Voraussetzungen: Schritt 1 (Tokens)
   - Beschreibung: `.panel`, `.panelHeading` (Doku), Buttons, `.confirm`,
     `.notice`, `.splash*`.

3. **`Menu.module.css` umgestalten**
   - Voraussetzungen: Schritt 1
   - Beschreibung: `.card`, `.statBox`, Inputs, `.summaryTable`,
     `.perspectiveToggle`, `.badge`.

4. **Komponenten-Module umgestalten**
   - Voraussetzungen: Schritt 1
   - Beschreibung: `MissionPanel`, `HeatBadge`, `PursuitBadge`,
     `EventBanner`, `DetektivScreen` (Inputs/Remove-Button).

5. **E2E-Nachweis in `e2e/design.spec.ts` ergänzen**
   - Voraussetzungen: Schritte 2–4
   - Beschreibung: Neuer Test „panels and controls share the dark-card
     look" — Kartenrand/Schatten auf Panel+Card, Embossed-Button,
     Badge-Pill, Display-Font-Heading, unveränderter Fokusring.

6. **Verifikation**
   - Voraussetzungen: Schritt 5
   - Beschreibung: `npm test`, `npx playwright test`, `npm run lint`,
     `npm run format:check`, `npm run check:strings`,
     `python .githooks/i18n-check.py --all` ausführen.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
| ------------------- | ---------- | ---------------------------------- |
| `panels, cards, buttons and badges share the dark-card look` | `e2e/design.spec.ts` | Panel+Card: Border, Radius, box-shadow mit inset-Linie + äußerem Ring + Drop-Shadow; Primary-Button: Gradient + Schatten; HeatBadge: Pill-Radius + Schatten + `data-heat-level`; Card-Fokus: Amber-Outline unverändert |

### Betroffene bestehende Tests

Keine — CSS-only ohne Strukturvertrag-Bruch; `className.baseVal`-tsc-Fehler
in `MapGraph.test.tsx` sind preexisting und bleiben unangetastet.

### E2E-Tests (primärer Funktionsnachweis)

| Priorität | Szenario | Testdatei / Testklasse | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
| --------- | -------- | ---------------------- | ------------------------------ | ------------------- |
| Pflicht | Edelkarten-Haptik auf Spiel-Screen (Panel, Button, Badge) | `e2e/design.spec.ts` | Einheitliche Kartenhaptik: Rand, Schatten, Materialität | `getComputedStyle` braucht echten Browser; jsdom rendert keine Schatten/Gradienten |
| Pflicht | Edelkarten-Haptik auf Menü-Screen (Card) + Fokusring unverändert | `e2e/design.spec.ts` | Kartenhaptik + `:focus-visible` unverändert | Tastaturfokus (`:focus-visible`) ist nur per Tab realistisch auslösbar |

Welche bestehenden E2E-Tests müssen angepasst werden? Keine.

## Offene Punkte

Keine.
