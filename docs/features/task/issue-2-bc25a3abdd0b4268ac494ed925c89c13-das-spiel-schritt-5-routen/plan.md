# Umsetzungsplan: Routen als gezeichnete Kartenwege (Schritt 5)

## Übersicht

Die Kanten in `MapGraph` werden von Drahtlinien zu gezeichneten Kartenwegen: jede Kante bekommt einen dunklen Kontur-Strich („Casing") unter einem hellen/gemusterten Kern-Strich — die klassische Karten-Casing-Technik. `weg` liest als befestigte Straße (Sepia-Fassung + Papierkern), `fahrt` als kräftigere Trasse mit querliegenden „Schwellen" (breitere Fassung + gestrichelter Papierkern mit `butt`-Caps). Blockade, `edgeFlash` und der `data-*`-Vertrag bleiben unverändert; beide Legenden-Swatches spiegeln die neue Zweistrich-Anatomie.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Routen-Anatomie | Zwei übereinanderliegende `<line>` pro Kante: `edgeCasing` (dunkel, breit, `linecap: round`) darunter, semantische Kern-Linie (hell, `edge`-Klassen) darüber | Klassische „cased line"-Kartentechnik; genau die von der Anforderung empfohlene Lesart („heller Grundstrich mit dunkler Kontur"); keine zusätzlichen Koordinatenrechnungen nötig |
| `fahrt`-Muster | Hell gestrichelter Kern (`stroke-dasharray`, `linecap: butt`) auf breiter dunkler Fahrt-Fassung → querliegende „Schwellen" | Ergibt ein Trassen-/Gleismuster (Form + Muster), nicht bloß ein anderes `dasharray` auf einer Drahtlinie; vollständig deterministisch |
| Blockierte Kante | Fassung in `--color-map-blocked` gedimmt + Kern-Muster wird gesprengt (kürzere Striche) + unverändertes `data-block-glyph`-Kreuz | „Unterbrochene Straße" liest über Muster + Form + Farbe; bestehendes Glyph bleibt Testvertrag |
| `edgeFlash` | Bleibt auf der semantischen Kern-Linie (`--color-map-accent`, Opazitäts-Puls); bestehende `@media (prefers-reduced-motion: reduce)`-Regel bleibt | Kein neuer Mechanismus nötig; Amber-Kern auf dunkler Fassung bleibt gut sichtbar |
| Handdrawn-Anmutung | Nur statische Strich-Geometrie (Caps, Fassung, Dash-Muster) — kein `Math.random()`, kein `feTurbulence`-Displacement | Anforderung: deterministisch, performant, Hit-Test-stabil; Kanten fangen ohnehin keine Pointer |
| Farb-Tokens | Keine neuen Tokens: Fassung nutzt `--color-map-weg`/`--color-map-fahrt`, Kern `--color-paper`, Blockierung `--color-map-blocked` | Alle Tokens sind bereits für WCAG AA gegen Papier kalibriert und dokumentiert |
| Legenden-Swatches | Zweite `<line>` (Casing) hinter der bisherigen Linie in beiden Legenden-SVGs; `legendWeg`/`legendFahrt` bleiben Klassen der Kern-Linie, neue `legendWegCasing`/`legendFahrtCasing`-Klassen in `GanoveScreen.module.css` | „Same shape = same meaning" — Projekt-Konvention (Plaketten- und Figuren-Swatches sind bereits echte Miniaturen); `shared`-Import der Detektiv-Legende bleibt unverändert |

## Programmabläufe

### Kante rendern (`MapGraph`, `<g data-layer="edges">`)

1. Für jede `map.edges`-Kante wird weiterhin `<g data-edge="{a}-{b}">` gerendert.
2. Neu: erste `<line>` mit identischen Endpunkten, `aria-hidden="true"`, Klassen `edgeCasing` + (`edgeCasingFahrt` bei `fahrt`) + (`edgeCasingBlocked` bei Blockierung).
3. Unverändert: zweite `<line>` mit `edge edgeWeg|edgeFahrt [edgeBlocked] [edgeFlash]`, `data-edge-type`, `data-blocked` — sie bleibt die semantische Linie (Testvertrag) und trägt jetzt den hellen Kern/die Schwellen.
4. Unverändert: bei Blockierung das `<g data-block-glyph>`-Kreuz an der Kantenmitte.

Beteiligte Klassen/Komponenten: `MapGraph`, `MapGraph.module.css`, `isEdgeBlocked` (unverändert), `flashEdges` (unverändert).

### Legenden-Swatch rendern (`MapLegend`, `DetectiveMapLegend`)

1. Im `weg`-Swatch-SVG wird vor der bestehenden `legendWeg`-Linie eine `legendWegCasing`-Linie mit denselben Endpunkten eingefügt.
2. Im `fahrt`-Swatch-SVG analog eine `legendFahrtCasing`-Linie vor `legendFahrt`.
3. Beide Legenden (`MapLegend` in `GanoveScreen.tsx`, `DetectiveMapLegend` in `DetektivScreen.tsx` via `shared`-Import) erhalten identisches Markup — gleiche Form, gleiche Bedeutung.

Beteiligte Komponenten: `MapLegend`, `DetectiveMapLegend`, `GanoveScreen.module.css`.

## Neue Klassen

Keine (nur neue CSS-Klassen, siehe Änderungen).

## Änderungen an bestehenden Klassen

### `MapGraph` (`src/components/MapGraph.tsx`)

- **Geändertes Rendering im `map.edges.map`:** eine zusätzliche `aria-hidden`-`<line>` (Casing) vor der semantischen Linie; Endpunkte, `key`, `data-edge`, `data-edge-type`, `data-blocked`, `data-block-glyph`, Layer-Reihenfolge und alle weiteren Props unverändert.

### `MapGraph.module.css`

- **Neue Klassen:**
  - `.edgeCasing` — `stroke: var(--color-map-weg); stroke-width: 4.6; stroke-linecap: round;`
  - `.edgeCasingFahrt` — `stroke: var(--color-map-fahrt); stroke-width: 6;` (breitere Trasse)
  - `.edgeCasingBlocked` — `stroke: var(--color-map-blocked); stroke-opacity: 0.55;`
- **Geänderte Klassen:**
  - `.edge` — Basiskern: `stroke: var(--color-paper); stroke-width: 2.2; stroke-linecap: round;` (heller Weg-Kern in dunkler Fassung)
  - `.edgeWeg` — entfällt als eigene Farbregel (Kernfarbe liegt auf `.edge`); Klasse bleibt im Markup für Selektierbarkeit
  - `.edgeFahrt` — `stroke-width: 3.4; stroke-dasharray: 3 4.5; stroke-linecap: butt;` (Papier-Schwellen auf der Fahrt-Fassung)
  - `.edgeBlocked` — Kern-Muster wird gesprengt: `stroke-dasharray: 1.6 3.2;` (+ dezente `stroke-opacity`-Dämpfung); erscheint im Stylesheet **nach** `.edgeFahrt`, damit die Blockierung das Schwellen-Muster übersteuert
  - `.edgeFlash` — unverändert (`--color-map-accent`, `stroke-width: 3.5`, `edge-flash`-Animation, Reduced-Motion-Abschaltung bleibt)
- `.blockGlyph` unverändert.

### `MapLegend` (`src/components/GanoveScreen.tsx`)

- **Markup:** zusätzliche `legendWegCasing`-/`legendFahrtCasing`-`<line>` vor den bestehenden Swatch-Linien (keine neuen sichtbaren Strings — `t("legend.weg")`/`t("legend.fahrt")` unverändert).

### `DetectiveMapLegend` (`src/components/DetektivScreen.tsx`)

- **Markup:** identische Casing-Linien mit `shared.legendWegCasing`/`shared.legendFahrtCasing`.

### `GanoveScreen.module.css`

- **Neue Klassen:** `.legendWegCasing` (`--color-map-weg`, Breite ~4.6, `linecap: round`), `.legendFahrtCasing` (`--color-map-fahrt`, Breite ~5.6, `linecap: round`).
- **Geänderte Klassen:** `.legendWeg` → `stroke: var(--color-paper); stroke-width: 2.2; stroke-linecap: round;`; `.legendFahrt` → `stroke: var(--color-paper); stroke-width: 3.2; stroke-dasharray: 2.6 4; stroke-linecap: butt;`.

## Datenbankmigrationen

Keine.

## Validierungsregeln

Keine.

## Konfigurationsänderungen

Keine.

## Seiteneffekte und Risiken

- **`data-*`-Testvertrag:** `data-edge-type` bleibt exklusiv auf der Kern-Linie — die Vitest-Zählung (`fahrt` = 1, `weg` = 12) bleibt korrekt. Risiko minimal, aber explizit zu prüfen.
- **Z-Order im `<g data-edge>`:** Casing muss vor der Kern-Linie gerendert werden (SVG-Malreihenfolge); das Block-Glyph bleibt ganz oben.
- **ReplayScreen:** rendert zwei `MapGraph`-Instanzen — keine `id`-Referenzen nötig (keine neuen `defs`), daher keine Eindeutigkeitsprobleme.
- **`edgeFlash` auf Kern-Linie:** setzt `stroke-width: 3.5` — bei `fahrt` deckt der Amber-Strich die Schwellen zu (gewollt: Flash dominiert), bei `weg` ersetzt er den hellen Kern farblich. Bestehendes Verhalten bleibt semantisch erhalten.
- **Knoten-Überdeckung:** breitere Fassung (bis 6) ragt weiter unter die Orts-Plaketten (`r=8` + Rand), Knoten überdecken die Kantenenden weiterhin — kein Layout-Bruch.
- **Legenden-SVG-Höhe (8 px):** Fahrt-Fassung 5.6 px + Papier-Schwellen passen weiter in den Chip; `overflow` unverändert.
- **`check:strings`:** keine neuen sichtbaren Strings — unverändert grün erwartet.

## Umsetzungsreihenfolge

1. **Kanten-Rendering `MapGraph.tsx`**
   - Voraussetzungen: Keine.
   - Beschreibung: `aria-hidden`-Casing-`<line>` pro Kante vor der semantischen Linie einfügen (Klassen `edgeCasing`/`edgeCasingFahrt`/`edgeCasingBlocked`).
2. **Kanten-Stile `MapGraph.module.css`**
   - Voraussetzungen: Schritt 1 (Klassennamen).
   - Beschreibung: `.edgeCasing*`-Regeln neu; `.edge`/`.edgeWeg`/`.edgeFahrt`/`.edgeBlocked` auf Kern-/Muster-Rollen umbauen; `.edgeFlash` + Reduced-Motion-Block unverändert lassen.
3. **Legenden-Swatches (`GanoveScreen.tsx`, `DetektivScreen.tsx`, `GanoveScreen.module.css`)**
   - Voraussetzungen: Schritt 2 (gleiche Muster-Logik).
   - Beschreibung: Casing-Linie in beiden `weg`/`fahrt`-Swatch-SVGs; neue/angepasste `legend*`-Klassen.
4. **Vitest-Erweiterungen `MapGraph.test.tsx`**
   - Voraussetzungen: Schritte 1–3.
   - Beschreibung: Assertions für Casing-Struktur (vor Kern, `aria-hidden`), `fahrt`-Casing-Klasse, blockierte Casing-Fassung, Legenden-Zweilinien-Spiegelung; bestehende `data-*`-Assertions bleiben.
5. **E2E-Erweiterung `e2e/design.spec.ts`**
   - Voraussetzungen: Schritte 1–3.
   - Beschreibung: Neuer Test „routes draw as cased map paths …" — Computed Styles von Casing vs. Kern (`weg`/`fahrt`), Schwellen-Dasharray, Legenden-Mirror, Papier-/Tinten-Kontrastbeleg.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `edges draw as cased map routes` | `MapGraph.test.tsx` (describe `MapGraph`) | Jede `[data-edge]`-Gruppe enthält genau eine `edgeCasing`-Linie vor der `[data-edge-type]`-Kern-Linie; Casing ist `aria-hidden`; `fahrt`-Kante trägt `edgeCasingFahrt` |
| `blocked routes keep muted casing and the cross glyph` | `MapGraph.test.tsx` | Bei `blockedEdges` trägt die Casing-Linie `edgeCasingBlocked`, die Kern-Linie `edgeBlocked`, und `data-block-glyph` bleibt |
| `legend swatches mirror the cased route anatomy` | `MapGraph.test.tsx` (describe `Map legend swatches`) | Beide Legenden rendern im `weg`- und `fahrt`-Swatch je zwei Linien (Casing-Klasse vor Kern-Klasse) |
| `routes draw as cased map paths with legend mirror` | `e2e/design.spec.ts` | Computed Styles: `weg`-Fassung breiter als Kern und dunkel (`--color-map-weg`), Kern hell (`--color-paper`); `fahrt`-Fassung breiter als `weg`-Fassung, Kern hat `stroke-dasharray`; Legende enthält Casing- + Kern-Klassen; Reduced-Motion-Regel für `edgeFlash` bleibt im Stylesheet |

### Betroffene bestehende Tests

Keine — alle bestehenden Assertions (`data-edge`, `data-edge-type`, `data-blocked`, `data-block-glyph`, `edgeFlash`-Klasse, Layer-Reihenfolge) bleiben unverändert gültig.

### E2E-Tests (primärer Funktionsnachweis)

Die Anforderung ist eine sichtbare UI-Änderung auf einem bestehenden Benutzerfluss (Kartenansicht im Spiel). Der Funktionsnachweis erfolgt über den neuen Design-E2E-Test in `e2e/design.spec.ts` (dasselbe Muster wie die Schritte 2–4: Brett-Materialität, Plaketten, Meeples).

| Priorität | Szenario | Testdatei / Testklasse | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
|-----------|----------|------------------------|-------------------------------|-------------------|
| Pflicht | Ganove-Spielbrett zeigt Wege als geränderte Papierkern-Routen und Fahrt als breitere Schwellen-Trasse; Legenden-Chips zeigen dasselbe Zweistrich-Bild | `e2e/design.spec.ts` | „Routen wirken wie gezeichnete Wege (Breite, Kontur, Muster)" + „Legenden-Swatches aktualisiert" | Nur im gerenderten Browser sind Computed Styles (Strichbreite, Fassung-vs-Kern, Dasharray, Chip-Hintergrund) verifizierbar |
| Pflicht | Blockierte Fahrt-Kante (`f–g` in teststadt via Vitest; E2E-Struktur via `data-blocked`-Präsenz wo auslösbar) bleibt gemustert + Kreuz-Glyph | `e2e/design.spec.ts` (soweit im E2E deterministisch auslösbar; sonst Vitest-Abdeckung) | „Blockierte Kanten behalten Kreuz-Glyph und erkennbare Musterung" | E2E nur, soweit eine Sperrung deterministisch über die UI auslösbar ist; der restliche Nachweis läuft über Vitest (dort seit jeher abgedeckt) |

Welche bestehenden E2E-Tests müssen angepasst werden? — Keine.

## Offene Punkte

Keine.
