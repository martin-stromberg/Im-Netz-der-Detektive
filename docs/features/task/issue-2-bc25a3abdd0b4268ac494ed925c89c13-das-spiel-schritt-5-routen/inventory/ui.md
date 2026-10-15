# Bestandsaufnahme — UI / Komponenten

## `MapGraph` (Kanten-Rendering)

Datei: `src/components/MapGraph.tsx`, Zeilen 269–306 (`<g data-layer="edges">`)

Pro Karte wird gerendert:

```jsx
<g key={`${a}-${b}`} data-edge={`${a}-${b}`}>
  <line
    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
    className={`${styles.edge} ${type === "fahrt" ? styles.edgeFahrt : styles.edgeWeg}
                ${blocked ? styles.edgeBlocked : ""} ${flashing ? styles.edgeFlash : ""}`}
    data-edge-type={edge.type}
    data-blocked={blocked ? "true" : undefined}
  />
  {blocked ? (
    <g className={styles.blockGlyph} data-block-glyph={`${a}-${b}`} aria-hidden="true">
      <line x1={midX-4} y1={midY-4} x2={midX+4} y2={midY+4} />
      <line x1={midX-4} y1={midY+4} x2={midX+4} y2={midY-4} />
    </g>
  ) : null}
</g>
```

- `blocked` via `isEdgeBlocked(edge.a, edge.b, blockedEdges, round)` (`src/logic/Movement.ts`).
- `flashing` via `flashEdges` (`"a|b"`-Schlüssel in beiden Richtungen), gesetzt in `GanoveScreen.tsx:281` (Umwelt-Sperrung).
- Layer-Reihenfolge im SVG (Testvertrag): `board` → `edges` → `landmarks` → `nodes` → `markers`.
- `.map :where(g, path, circle, rect, line, text, title) { pointer-events: none; }` (Zeile 46–48, `MapGraph.module.css`) — Kanten können nicht angeklickt werden; zusätzliche Striche ändern nichts am Hit-Testing.

## `MapGraph.module.css` (Kanten-Stile, Zeilen 50–105)

| Klasse | Ist-Zustand |
|--------|-------------|
| `.edge` | `stroke: var(--color-map-weg); stroke-width: 2;` |
| `.edgeWeg` | `stroke: var(--color-map-weg);` (nur Farbe, 2 px Vollstrich) |
| `.edgeFahrt` | `stroke: var(--color-map-fahrt); stroke-width: 3.5; stroke-dasharray: 10 5;` |
| `.edgeBlocked` | `stroke: var(--color-map-blocked); stroke-opacity: 0.55; stroke-dasharray: 4 4;` |
| `.edgeFlash` | `stroke: var(--color-map-accent); stroke-width: 3.5; animation: edge-flash 3400ms ease-out;` |
| `@keyframes edge-flash` | `stroke-opacity` 1 (0–40 %) → 0,5 (100 %) |
| `@media (prefers-reduced-motion: reduce)` | `.edgeFlash { animation: none; }` (Zeile 95–99) — bereits vorhanden |
| `.blockGlyph line` | `stroke: var(--color-map-danger); stroke-width: 2.5; stroke-linecap: round;` |

Bisher **kein** `stroke-linecap` auf Kanten, keine Casing-/Kern-Struktur, kein eigenes Muster für `fahrt` außer `dasharray`.

## Legenden (Swatches)

### `MapLegend` — `src/components/GanoveScreen.tsx` (Zeilen 102–156)

```jsx
<svg width="26" height="8" aria-hidden="true">
  <line x1="0" y1="4" x2="26" y2="4" className={styles.legendWeg} />
</svg> … legend.weg
<svg width="26" height="8" aria-hidden="true">
  <line x1="0" y1="4" x2="26" y2="4" className={styles.legendFahrt} />
</svg> … legend.fahrt
```

### `DetectiveMapLegend` — `src/components/DetektivScreen.tsx` (Zeilen 110–185)

Identisches Swatch-Markup, Klassen über `shared` (= `GanoveScreen.module.css`, Import Zeile 62).

### `GanoveScreen.module.css` (Zeilen 344–362)

- `.legendItem svg { background: var(--color-paper); border: 1px solid var(--color-cardboard); border-radius: 3px; }` — Papierchip-Untergrund.
- `.legendWeg { stroke: var(--color-map-weg); stroke-width: 2; }`
- `.legendFahrt { stroke: var(--color-map-fahrt); stroke-width: 3.5; stroke-dasharray: 7 4; }`

## Theme-Tokens (`src/theme.css`, Zeilen 124–166)

| Token | Wert | Kontrast vs. `--color-paper` (#e8dcc0) | Bestehende Verwendung |
|-------|------|----------------------------------------|-----------------------|
| `--color-paper` | #e8dcc0 | — | Papierfläche, Legenden-Chips |
| `--color-paper-aged` | #d6c6a0 | — | Token-Rand, gealtertes Papier |
| `--color-ink` | #2b2115 | 11,6:1 | Labels, Token-Rahmen |
| `--color-ink-soft` | #57462e | 6,6:1 | Innenringe, Sekundärlinien |
| `--color-map-weg` | #6b5b43 | 4,7:1 | Weg-Kanten + Legende |
| `--color-map-fahrt` | #7a5228 | 4,9:1 | Fahrt-Achse + Legende |
| `--color-map-blocked` | #8f8060 | ~2,5:1 | gesperrte Kante (bewusst ausgebleicht, Form primär) |
| `--color-map-accent` | #7d5210 | 4,8:1 | Fokusring, edgeFlash |
| `--color-map-danger` | #a03a30 | 4,7:1 | Blockade-Kreuz-Glyph |

## Einsatzstellen von `MapGraph`

- `GanoveScreen.tsx` (Zeile ~592, inkl. `flashEdges`)
- `DetektivScreen.tsx` (Kategorien, Zonen, Kameras, Deduktion)
- `ReplayScreen.tsx` (zwei Instanzen in einem Dokument → `useId`-Korrektheit der `defs` ist Testvertrag)

## Kartenpacks

- `src/data/maps/teststadt.json`: `viewBox "0 0 100 100"`, 13 Kanten — 12× `weg`, 1× `fahrt` (`f–g`); Block-Tests nutzen genau diese `fahrt`-Kante.
- `src/data/maps/muenster.json`, `luebeck.json`: produktive Karten (in E2E genutzt).
