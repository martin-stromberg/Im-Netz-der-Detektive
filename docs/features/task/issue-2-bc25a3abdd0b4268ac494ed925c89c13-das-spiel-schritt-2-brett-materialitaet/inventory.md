# Bestandsaufnahme: Schritt 2 — Brett-Materialität (Pergament, Papprand, Tischschatten)

Analysiert wurden die SVG-Kartenkomponente `MapGraph`, ihre Hintergrund-Ebene `MapBackdrop`, die Landmark-Glyphen, die Legenden in den Spiel-Screens sowie die Design-Tokens in `theme.css` — bezogen auf die Anforderung, die Kartenfläche in ein physikalisch wirkendes Pergament-Spielbrett zu verwandeln.

## Zusammenfassung

- `MapGraph` (`src/components/MapGraph.tsx`) rendert ein `<svg className={styles.map} viewBox={map.viewBox} data-testid="map-graph">` mit vier `data-layer`-Gruppen in fester Reihenfolge: `board` (via `MapBackdrop`, nur bei vorhandenen Features), `edges`, `landmarks`, `nodes`, `markers`. Es gibt aktuell **keine** Papierfläche — `.map` hat nur `background: var(--color-inset-bg)` (dunkel) und 1-px-`border`.
- `theme.css` stellt aus Schritt 1 bereits die Brettspiel-Tokens bereit (`--color-paper`, `--color-paper-aged`, `--color-ink`, `--color-ink-soft`, `--color-cardboard`, `--color-cardboard-edge`, `--color-table`, `--color-table-edge`, `--shadow-board`) — sie werden noch **nirgends** verbraucht.
- `MapBackdrop` zeichnet `board.features` (Stile `water`, `park`, `rail`, `street`, `block`) mit dunkler Comic-Palette (`--color-feature-*`), die auf eine helle Papierfläche umgetönt werden muss.
- Alle Kartenfarben in `MapGraph.module.css` sind für dunklen Grund kalibriert (`--color-text-muted`-Labels, helle Statusfarben `--color-amber`, `--color-green`, `--color-escape`, `--color-pin`, `--color-possible`, `--color-detective-light`). Auf Papier `#e8dcc0` wären sie großteils nicht AA-konform → dunkle Tinten-Varianten nötig.
- Mehrere Tokens werden **zweigeteilt** benötigt: dieselben Farbfamilien erscheinen auch als Legenden-Swatches auf dunklen Panels in `GanoveScreen.module.css`/`DetektivScreen.module.css` — dort müssen die Swatches lesbar bleiben (Papier-Chip-Hintergrund), während die Karte dunkle Tinten nutzt.
- `landmarks.tsx` nutzt warme Füllfarben mit dunklen Outlines (`#10141c`-Strokes, Palette `P`) — auf Papier bereits lesbar; voraussichtlich keine Änderung.
- Keine Logik-/Datenänderung nötig: keine Änderung an `mapPack.ts`, Karten-JSONs, Props oder `data-*`-Attributen.
- Test-Ausgangszustand: **alle Suiten grün** — Vitest 597 Tests / 53 Dateien, tsc, ESLint, Prettier, String-/i18n-/Map-Schema-/Math.random-Checks sowie die Playwright-Design-Suite (3 Tests). Details: [Tests](inventory/tests.md).

## Details

- [Komponenten und Karten-Rendering](inventory/components.md)
- [Styling und Tokens](inventory/styles.md)
- [Tests](inventory/tests.md)
