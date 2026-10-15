# Umsetzungsplan: Spieltisch (Schritt 7, „Finales Brettspiel-Design")

## Übersicht

Alle zwölf Screens werden auf eine gemeinsame „Spieltisch"-Komposition gebracht — ausschließlich über CSS (`theme.css`, `App.module.css`, `GanoveScreen.module.css`, `Menu.module.css`). `.screen` wird zur dunklen Tischfläche (`bg-noir`-Textur + Tisch-Gradienten über den vorhandenen Tokens `--color-table`/`--color-table-edge`), `.layout` wird zur gerahmten Spieleinlage (Holz-/Kartonrand + vertiefte Fläche), die `.sidebar` zum Kartenfach, in dem die Edelkarten-Panels als Stapel liegen. Reste der flachen Dark-Box-Optik (`.perspectiveToggle`, `.cardImage`, `.shell`) werden in dasselbe Materialsystem überführt. DOM-Hierarchie, `data-view`- und `data-testid`-Träger bleiben unverändert.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Tischfläche `.screen` | `bg-noir.jpg` als Texturbasis + dreistufiger CSS-Gradient: warmer Filz-Schimmer oben, dunkle Tischkanten-Vignette, `--color-table`/`--color-table-edge`-Schleier (~90–95 % Deckung) | Projektentscheid: kein neues Raster-Asset; die ~90 %+ Deckung hält die in `theme.css` dokumentierten Kontrastpaarungen auf `--color-table` gültig |
| Rahmung `.layout` | Vertiefte Spieleinlage: `--color-cardboard`-Rand + `--color-cardboard-edge`-Schnittkante + `inset`-Schatten + gravierte Innenlinie | „Gerahmte Einheit" wörtlich: Brett wirft `--shadow-board` auf die Einlage (steht auf dem Tisch), derselbe Materialwortschatz wie Brett- und Kartenrims |
| `.sidebar` als Kartenstapel | Flaches vertieftes Ablagefach (subtiler Inset-Schatten + feine Innenlinie), die Edelkarten-Panels liegen als Stapel darin | Liest als Kartenfach in der Spieleinlage; verlangt keine DOM-Änderung und funktioniert bei beliebiger Panel-Anzahl |
| `.statusBar` | Schmale vertiefte „Zählleiste" (Inset-Fläche, `width: fit-content`) | Runde/Phase/Badges liegen als Zählleiste auf dem Tisch statt frei zu schweben — Teil des einheitlichen Systems |
| `.perspectiveToggle` | Vertiefte Schalterplatte (`--color-inset-bg` + Inset-Schatten) mit geprägtem Messing-Segment (selber Amber-Gradient wie `.primaryButton`) | Explizit gefordertes Restyling; formkodiert „aktiv" über geprägte Fläche statt flacher Farbfläche |
| `.cardImage` | Kartonrand + Schnittkante + Außenschatten (bedruckte Bildplatte), Fallback-Fläche `--color-inset-bg` | Entfernt den letzten flachen Rest auf Menü-/Kartenkarten |
| Neue Tokens | Keine — alle Flächen aus vorhandenen Tokens (`--color-table*`, `--color-cardboard*`, `--color-inset-bg`, `--color-card-line`, `--color-amber*`) komponiert | Token-Set aus Schritt 1 ist vollständig; neue Tokens nur für wirklich neue Farben |
| `--color-screen-overlay-soft/strong` | Tokens bleiben in `theme.css` stehen (werden von `.screen` nicht mehr referenziert) | Dokumentierte Palette; Entfernen wäre eine unverbundene Aufräumänderung |

## Programmabläufe

Keine Programmabläufe — rein deklarative CSS-Änderung. Die betroffenen Renderpfade zur Verifikation:

### Screen-Aufbau (alle Screens)

1. `App` rendert `<main className={styles.shell}>` mit dem aktiven Screen.
2. Jeder Screen rendert `shared.screen` als Wurzel (`data-testid`-Träger).
3. Nach der Änderung zeigt `.screen` die Tischfläche (Textur + Tisch-Gradienten), `.shell` die Tischkante als Overscroll-Fläche.

Beteiligte Dateien: `src/App.module.css`, `src/components/GanoveScreen.module.css`

### Spiellayout (Ganove-/Detektiv-/Replay-`playing`)

1. `GanoveScreen`/`DetektivScreen`/`ReplayScreen` rendern `shared.layout` mit `shared.mapArea` (Brett + `EventBanner` + `.splash` + `MapLegend`) und `shared.sidebar` (Panels + Buttons).
2. `.layout` trägt den Einlage-Rahmen; `.sidebar` das vertiefte Kartenfach.
3. Overlay-Stack in `.mapArea` bleibt: Brett (Fluss) < `.splash` (absolut) < `::after`-Vignette (absolut, letztes Kind) < `EventBanner .stack` (`z-index: 5`).

Beteiligte Dateien: `src/components/GanoveScreen.module.css` (`.layout`, `.mapArea`, `.sidebar`, `@media (max-width: 900px)` unverändert)

### Menü-Flächen

`Menu.module.css`: `.perspectiveToggle` (Schalterplatte + Messing-Segment), `.cardImage` (gerahmte Bildplatte). `MainMenu` behält Titelbild + Schmuckschrift-Titel (bereits `shared.title`).

## Neue Klassen

Keine — ausschließlich Änderungen an bestehenden CSS-Klassen.

## Änderungen an bestehenden Klassen

### `.screen` (`GanoveScreen.module.css`)

- **Geänderter `background`:** Textur-Basis `url("../assets/bg-noir.jpg")` bleibt, darüber: `radial-gradient` warmer Filz-Schimmer (oben mitte), `radial-gradient` Tischkanten-Vignette → Schwarz/`--color-table-edge`, `linear-gradient` Tisch-Schleier `rgb(25 20 17 / 90%)` → `rgb(14 11 9 / 95%)`.
- **Geänderter `background-color`:** `--color-screen-bg` → `--color-table`.
- Padding/`min-height`/Farbe unverändert.

### `.shell` (`App.module.css`)

- **Geänderter `background`:** `--color-screen-bg` → `--color-table-edge` (Tischkante als Overscroll-Fläche).

### `.layout` (`GanoveScreen.module.css`)

- **Neu:** `padding: 14px`, `border: 3px solid var(--color-cardboard)`, `border-radius: 16px`, `background`: zweistufiger dunkler Einlage-Gradient (Licht-Schimmer + Tiefschwarz-Braun), `box-shadow`: `0 0 0 2px var(--color-cardboard-edge)` (Schnittkante), `inset 0 2px 12px rgb(0 0 0 / 55%)` (Vertiefung), `inset 0 0 0 1px var(--color-card-line)` (Innenlinie).

### `.mapArea` (`GanoveScreen.module.css`)

- Unverändert (transparente Bühne für Brett + Overlays; `::after`-Vignette und z-index-Stack werden nicht angefasst).

### `.sidebar` (`GanoveScreen.module.css`)

- **Neu:** `padding: 10px`, `border-radius: var(--radius-card)`, `background: linear-gradient(180deg, rgb(0 0 0 / 26%), rgb(0 0 0 / 14%))`, `box-shadow: inset 0 1px 8px rgb(0 0 0 / 55%), inset 0 0 0 1px rgb(255 255 255 / 4%)` — vertieftes Kartenfach.

### `.statusBar` (`GanoveScreen.module.css`)

- **Neu:** `width: fit-content`, `padding: 6px 12px`, `border-radius: 8px`, `background: linear-gradient(180deg, rgb(0 0 0 / 28%), rgb(0 0 0 / 14%))`, `box-shadow: inset 0 1px 5px rgb(0 0 0 / 50%), inset 0 0 0 1px rgb(255 255 255 / 4%)` — vertiefte Zählleiste.

### `.perspectiveToggle` (`Menu.module.css`)

- **Geändert:** `border-radius: 6px → 8px`, neu `background: var(--color-inset-bg)`, `box-shadow`: `0 0 0 1px var(--color-cardboard-edge)`, `inset 0 1px 4px rgb(0 0 0 / 55%)`, `0 2px 5px rgb(0 0 0 / 40%)` — Schalterplatte.
- `.perspectiveToggle button`: `background: var(--color-screen-bg)` → `transparent`, `color: var(--color-detective-light)` → `var(--color-text-muted)`.
- `.perspectiveToggle button[aria-pressed="true"]`: `background` → Amber-Gradient (wie `.primaryButton`), `color` → `var(--color-inset-bg)`, neu `font-weight: 700` + `inset`-Highlight.

### `.cardImage` (`Menu.module.css`)

- **Neu:** `border: 1px solid var(--color-cardboard)`, `box-shadow: 0 0 0 1px var(--color-cardboard-edge), 0 4px 10px rgb(0 0 0 / 45%)`; `background` → `var(--color-inset-bg)` (Fallback-Fläche).

### `@media (max-width: 900px)` (`GanoveScreen.module.css`)

- Unverändert — `.layout` stapelt vertikal, `.sidebar` volle Breite (Rahmen und Fach greifen im gestapelten Zustand weiter).

## Datenbankmigrationen

Keine.

## Validierungsregeln

Keine.

## Konfigurationsänderungen

Keine.

## Seiteneffekte und Risiken

- **Kontrast:** Tisch-Schleier bleibt ≥ 90 % deckend — die in `theme.css` dokumentierten Paarungen auf `--color-table` bleiben gültig; Text liegt zudem fast vollständig auf Panels/Karten.
- **Brett-Breite:** `.layout`-Padding + Rand verkleinern die verfügbare `.mapArea`-Breite geringfügig — die SVG skaliert (`width: 100%`), kein Funktionsverlust.
- **`.statusBar` `fit-content`:** Umbruchverhalten bei schmalen Viewports bleibt über `flex-wrap` erhalten; nur in `playing`-Views aktiv.
- **Replay/Detektiv** nutzen dasselbe `shared.layout` — erhalten die Rahmung automatisch (Anforderung: „beide Boards auf dem Tisch").
- **`CustomMissionPicker`** rendert `MapGraph` innerhalb einer `.panel` auf einem Menü-Screen — Brett liegt dort als Vorschau auf der Karte; keine Änderung nötig.
- **`--color-screen-overlay-soft/strong`** werden unreferenziert, bleiben aber als dokumentierte Tokens bestehen.

## Umsetzungsreihenfolge

1. **Tischfläche: `.screen` + `.shell`**
   - Voraussetzungen: keine (Tokens existieren)
   - Beschreibung: `.screen`-Hintergrund in `GanoveScreen.module.css` auf die Tisch-Komposition umstellen; `.shell` in `App.module.css` auf `--color-table-edge`; Kommentarblöcke aktualisieren.

2. **Gerahmte Einlage: `.layout` + `.sidebar` + `.statusBar`**
   - Voraussetzungen: Schritt 1 (gemeinsames Tokensystem)
   - Beschreibung: Rahmenanatomie auf `.layout`, Kartenfach auf `.sidebar`, Zählleiste auf `.statusBar` in `GanoveScreen.module.css`; `@media 900px` unangetastet lassen.

3. **Flache Reste: `.perspectiveToggle` + `.cardImage`**
   - Voraussetzungen: keine
   - Beschreibung: In `Menu.module.css` die Schalterplatte + Messing-Segment sowie die gerahmte Bildplatte umsetzen.

4. **E2E-Nachweis in `e2e/design.spec.ts`**
   - Voraussetzungen: Schritte 1–3
   - Beschreibung: Neuer Testblock „game table composition" (siehe Tests).

5. **Verifikationsläufe**
   - Voraussetzungen: Schritte 1–4; laufender Dev-Server auf 5173 **oder** temporäre `playwright.local.config.ts` (wird danach gelöscht, nicht committed)
   - Beschreibung: `npm test`, `npm run typecheck`, `npm run lint`, `npx playwright test --config=playwright.local.config.ts`.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `game table composition` (describe-Block in `e2e/design.spec.ts`) | Playwright `design fundament` | (a) `main-menu` und `ganove-screen` teilen dieselbe Tischfläche: `background-image` enthält `bg-noir`, `background-color` = `rgb(25, 20, 17)` (`--color-table`); (b) `.layout`-Rahmung: `border-color` = `rgb(107, 83, 53)` (`--color-cardboard`), `border-width` ≥ 2, `box-shadow` enthält `inset`; `.sidebar`-Kartenfach: `box-shadow` enthält `inset`; (c) `.perspectiveToggle`: gedrückter Button trägt Amber-Gradient (`background-image` enthält `gradient`), Container `inset`-Schatten; (d) Overlay-Stack: `EventBanner .stack` `z-index` = 5 und `::after` der `mapArea` ist gerendert (`content` ≠ `none`); (e) responsiv: bei 800-px-Viewport `flex-direction: column` auf `.layout` |

### Betroffene bestehende Tests

Keine — keine Signaturen, kein Verhalten, keine DOM-Struktur ändert sich; die bestehenden Computed-Style-Assertions betreffen Brett-, Karten-, Token-, Figuren- und Button-Anatomie, nicht die geänderten Flächen.

### E2E-Tests (primärer Funktionsnachweis)

Der geänderte Benutzerfluss ist rein visuell; der Funktionsnachweis „Menü → Setup → Partie → Auswertung/Replay läuft durch" wird durch die bestehenden Fluss-Specs (`menu.spec.ts`, `ganove.spec.ts`, `detektiv.spec.ts`, `persistenz.spec.ts`, `i18n-a11y.spec.ts`) erbracht, die unverändert grün bleiben müssen. Der neue Design-Block belegt die Tischkomposition selbst.

| Priorität | Szenario | Testdatei / Testklasse | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
|-----------|----------|------------------------|-------------------------------|-------------------|
| Pflicht | Tischfläche identisch auf Menü- und Spiel-Screen | `e2e/design.spec.ts` › `game table composition` | „Jeder Screen wirkt wie derselbe Spieltisch" | Computed Styles nur im Browser prüfbar |
| Pflicht | `.layout` gerahmt, `.sidebar` Kartenfach, Brett darauf | `e2e/design.spec.ts` › `game table composition` | „gerahmte Einheit … Brett steht visuell auf dem Tisch, Sidebar als Kartenstapel" | Layout-Anatomie nur via Computed Style prüfbar |
| Pflicht | `.perspectiveToggle` neu gestylt | `e2e/design.spec.ts` › `game table composition` | „`.perspectiveToggle` neu gestylt" | Computed Styles nur im Browser prüfbar |
| Pflicht | Overlay-Stack (Banner über Vignette) + responsive Stapelung | `e2e/design.spec.ts` › `game table composition` | „Overlay-Stack … bleibt korrekt geschichtet", „responsive Stapelung bleibt" | z-index-/Media-Query-Verhalten nur im Browser prüfbar |
| Pflicht | Menü → Setup → Partie → Auswertung/Replay unverändert | bestehend: `menu.spec.ts`, `ganove.spec.ts`, `detektiv.spec.ts`, `persistenz.spec.ts` | „laufen unverändert durch" | Regressionsschutz des Benutzerflusses |

Anpassungen bestehender E2E-Tests: Keine.

## Offene Punkte

Keine.
