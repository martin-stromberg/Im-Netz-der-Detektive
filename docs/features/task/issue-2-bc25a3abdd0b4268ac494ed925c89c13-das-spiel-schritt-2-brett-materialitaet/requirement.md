# Übersetzte Anforderung — Schritt 2: Brett-Materialität (Pergament, Papprand, Tischschatten)

Projekt: „Finales Brettspiel-Design" für „Im Netz der Detektive" (React + TypeScript + Vite, SVG-Kartenrendering). Schritt 1 (`theme.css`-Tokens, Schmuckschrift) ist fertig und gemergt; dieser Schritt verwandelt die Kartenfläche in ein physikalisch wirkendes Spielbrett.

## Fachliche Zusammenfassung

Die `.map`-Fläche der gemeinsamen SVG-Komponente `MapGraph` (`data-testid="map-graph"`, `viewBox` aus dem `MapPack`) soll wie ein gedrucktes Spielbrett aussehen, das auf einem dunklen Tisch liegt: hell getönte Pergament-/Papierfläche mit prozeduraler Körnung (SVG-`<defs>`: `feTurbulence`-Noise plus dezente Vignette per `radialGradient`), kräftiger mehrstufiger Pappen-/Holzrand und `box-shadow` auf `.map`-Ebene. Parallel wird die `MapBackdrop`-Palette (`water`/`park`/`rail`/`street`/`block`) sowie alle auf der Karte gezeichneten Markierungen (Ortslabels, Kanten, Blockade-Kreuz, Kategorie-/Missions-Glyphen, Zonen-Halos, Kamera-Glyphen, Detektiv-/Ganove-Marker, Legenden-Swatches) auf die helle Papierfläche umgetönt, damit WCAG AA weiterhin erfüllt ist. Stilrichtung: detektivisch-vintage (alte Stadt-/Pergamentkarte), abgestimmt auf die warmen `landmarks.tsx`-Farben und das Noir-Artwork. Da alle Perspektiven (Ganove, Detektiv, Replay×2, `MissionSelect`-Custom-Picker) dieselbe `MapGraph`-Komponente nutzen, wirkt die Änderung überall automatisch.

## Betroffene Klassen und Komponenten

- `src/theme.css` — bestehende Brettspiel-Tokens verwenden (`--color-paper`, `--color-paper-aged`, `--color-ink`, `--color-ink-soft`, `--color-cardboard`, `--color-cardboard-edge`, `--color-table`, `--color-table-edge`, `--shadow-board`); fehlende kartenbezogene Tinten-Tokens ergänzen. Die `--color-feature-*`-Tokens (nur vom MapBackdrop verbraucht) werden auf die Brett-Tönung umgestellt.
- `src/components/MapGraph.tsx` — SVG-`<defs>` (Grain-Filter, Vignette-Gradient) und Papier-Grundfläche unterhalb der bestehenden Layer einfügen; Zonen-Halo-Tönung ggf. auf Papier anpassen. **Keine** Änderung an Props, `data-*`-Attributen, Hit-Areas, `viewBox`, Layer-Reihenfolge (`data-layer="board"` … `"markers"`).
- `src/components/MapGraph.module.css` — `.map` erhält Pappen-/Holzrand (mehrstufig) und Drop-Shadow; sämtliche Kartenfarben (Edges, Labels, Glyphen, Marker) auf dunkle Tinten-Farben für helles Papier umstellen.
- `src/components/MapBackdrop.module.css` — `feature_water`/`feature_park`/`feature_rail`/`feature_street`/`feature_block` an die Brett-Tönung anpassen (Geographie bleibt lesbar).
- `src/components/landmarks.tsx` — warme Farben + dunkle Outlines sind papier-tauglich; nur falls zu grell, leicht abdunkeln (vermutlich keine Änderung nötig).
- `src/components/GanoveScreen.module.css`, `src/components/DetektivScreen.module.css` — Legenden-Swatches (`legendWeg`, `legendFahrt`, `legendEscape`, `legendDetective`, `legendGanove`, `legendTargetDot/Ring`, `legendCamera*`, `legendPin`, `legendDiamond`, `legendCategory`) müssen farblich zur neuen Karte passen; da sie auf dunklen Panels liegen, brauchen sie einen hellen Swatch-Hintergrund (Papier-Chip), damit die dunklen Tintenfarben lesbar bleiben.
- Tests: `src/components/MapGraph.test.tsx` (strukturelle Assertions bleiben bestehen), E2E `e2e/design.spec.ts` ggf. um Brett-Assertions erweitern.

## Implementierungsansatz

- Rein präsentational: CSS-Module + SVG-Dekoration in `MapGraph`; keine Logik-, Daten- oder Props-Änderung.
- Papierfläche als `<rect>`-Gruppe direkte Kinder des `<svg>` **vor** `<MapBackdrop>` (kein neuer `data-layer`, damit die `data-layer`-Struktur unverändert bleibt): Grundfläche `--color-paper`, Grain-`<rect>` mit `feTurbulence`-Filter, Vignette-`<rect>` mit `radialGradient`. Filter-/Gradient-IDs über `useId()` eindeutig machen (Replay rendert zwei Instanzen im selben Dokument).
- `.map`: `background: var(--color-paper)`, kräftiger `border` in `--color-cardboard`, mehrstufiger Rand + Schatten über `box-shadow` (Außenkante `--color-cardboard-edge`, Papier-Innenkante `--color-paper-aged`, `--shadow-board` als Dropshadow), moderate `border-radius`.
- Neue Kartentinte-Tokens in `theme.css` (z. B. `--color-map-weg`, `--color-map-fahrt`, `--color-map-legal`, `--color-map-accent`, `--color-map-danger`, `--color-map-escape`, `--color-map-pin`, `--color-map-possible`, `--color-map-ganove`, `--color-map-detective-*`), mit dokumentierten Kontrasten gegen `--color-paper`. Die bestehenden Shared-Tokens (`--color-amber`, `--color-green`, `--color-detective-light`, …) bleiben für die dunklen Panels unverändert.
- Legenden-Swatches: SVGs erhalten Papier-Chip-Hintergrund und nutzen die Karten-Tokens, damit Legende und Brett farblich übereinstimmen.
- `prefers-reduced-motion`-Verhalten unverändert (keine neuen Animationen; bestehende Guards bleiben).

## Konfiguration

Keine neue Konfiguration. Alle Werte über CSS-Custom-Properties in `theme.css`.

## Akzeptanzkriterien (aus Kundenanforderung)

1. Papier-Textur, Pappenrand und Schlagschatten sind auf allen `MapGraph`-Einsätzen sichtbar (Ganove, Detektiv, Replay×2, MissionSelect).
2. `data-layer`-Struktur, `data-testid="map-graph"`, `viewBox`, `data-board-style` und sämtliche Knoten-/Kanten-Attribute unverändert.
3. Ortslabels, Zonen-Halos und Overlay-Glyphen erfüllen weiterhin WCAG AA; Blockade-Kreuz und Kategorien bleiben formkodiert erkennbar.
4. Keine neuen sichtbaren Strings; keine Logik-/Datenänderung; Tests und `map-schema-check` grün; `prefers-reduced-motion` unverändert.

## Offene Fragen

Keine — die Stilrichtung (helles Pergament-Brett auf dunkler Umgebung) und die Token-Namen sind durch den Projektkontext und Schritt 1 vorgegeben; konkrete Farbwerte werden anhand der WCAG-AA-Kontraste gegen `--color-paper` gewählt und im Plan fixiert.
