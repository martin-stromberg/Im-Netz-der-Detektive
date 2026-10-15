# Bestandsaufnahme Detail: UI-Komponenten & Styling

## `src/components/MapGraph.tsx` (502 Zeilen)

### Marker-Layer (`data-layer="markers"`, Zeilen 462–499)

**Detektiv-Marker** (Zeilen 463–484):

```tsx
<g
  key={`detective-${index}`}
  style={{ transform: `translate(${node.x}px, ${node.y - NODE_RADIUS - 8}px)` }}
  className={`${styles.detectiveMarker} ${styles.markerMove} ${
    index === activeDetectiveIndex ? styles.detectiveActive : ""}`}
  data-detective={index}
  data-active-detective={index === activeDetectiveIndex ? "true" : undefined}
  aria-label={t("marker.detective", { index: index + 1 })}
>
  <rect x={-6} y={-6} width={12} height={12} rx={2} className={styles.detectiveShape} />
  <text className={styles.markerText} y={3.5} textAnchor="middle">{index + 1}</text>
</g>
```

- `NODE_RADIUS = 8` → Fußpunkt-Versatz `y - 16` (Figur steht auf der
  Plakette, Ursprung des `<g>` liegt 16px über dem Knotenzentrum).

**Ganove-Marker** (Zeilen 486–498): gleiche Struktur, Raute
`M 0 -7 L 6 0 L 0 7 L -6 0 Z` (`ganoveShape`), `data-ganove="true"`,
`aria-label` + `<title>` aus `t("marker.ganove")`.

### defs-Muster (Zeilen 211, 221–253)

`const defsId = `mapboard-${useId().replace(/[^a-zA-Z0-9]/g, "")}` —
liefert eindeutige IDs für `filter#…-grain`, `radialGradient#…-vignette`,
`radialGradient#…-tokenFace`. Gradienten-Stops setzen Farben per
`style={{ stopColor: "var(--token)" }}`, damit CSS-Variablen auflösen.
`tokenFace` wird als `fill`-Attribut referenziert (CSS-State-Regeln dürfen
es überschreiben). Neue Figuren-Gradients müssen dieses Muster
wiederverwenden (Eindeutigkeit bei Doppel-Mount in `ReplayScreen`).

### Pointer-Events-Regel

`.map :where(g, path, circle, rect, line, text, title) { pointer-events: none; }`
(MapGraph.module.css, Zeile 46) — sämtliche Figurenteile sind automatisch
klick-neutral; nur `hitArea`-Kreise fangen Events. Kein extra `pointerEvents`
nötig.

## `src/components/landmarks.tsx` (267 Zeilen) — Glyph-Konvention

- Jede Glyph-Komponente rendert ein `<g>` in einer lokalen Box
  (~36×32), Fußpunkt am Ursprung (Elemente von `y=0` nach oben negativ).
- `LandmarkGlyph` wrappt mit `data-landmark`, `aria-hidden="true"`,
  `focusable="false"`; Platzierung im Aufrufer per
  `transform="translate(node.x, node.y - 4)"`.
- Stil: `S = { stroke: "#10141c", strokeWidth: 1.5, strokeLinejoin: "round" }`,
  flache Warmfarben, kleine Fenster-Akzente `#f5d76e`.

## `src/components/MapGraph.module.css` (314 Zeilen)

Relevante Bestandsklassen:

- `.markerMove` (Zeilen 231–239): `transition: transform 480ms
  cubic-bezier(0.25, 0.8, 0.3, 1)`; `@media (prefers-reduced-motion:
  reduce) { transition: none }` — auf dem äußeren `<g>`.
- `.detectiveMarker .detectiveShape` (241–245): `fill:
  var(--color-detective)`, `stroke: var(--color-map-detective-stroke)`,
  `stroke-width: 1.4`.
- `.detectiveActive .detectiveShape` (249–253): `fill:
  var(--color-map-detective-active)`, `stroke: var(--color-map-accent)`,
  `stroke-width: 2.2` — aktuell nur Farbe/Strichstärke.
- `.ganoveMarker .ganoveShape` (302–306): `fill: var(--color-map-ganove)`,
  `stroke: var(--color-ink)`, `stroke-width: 1.4`.
- `.markerText` (308–313): `fill: var(--color-text)`, `font-size: 9px`,
  `font-weight: 700`.
- `.tokenShadow` (117–120): `fill: var(--color-ink)`,
  `fill-opacity: 0.22` — Muster für Schlagschatten auf Papier.
- `.map`-Regel sorgt dafür, dass Figuren nie Pointer-Events abfangen.

## `src/components/GanoveScreen.tsx` — `MapLegend` (Zeilen 102–151)

Swatches als kleine `<svg>` neben dem Label:

- `legendDetective`: `<svg 12×12><rect x1 y1 w10 h10 rx2>` (Zeile 126).
- `legendGanove`: `<svg 12×12><path M 6 0 L 11 6 L 6 12 L 1 6 Z>`
  (Zeile 132).
- `legendTarget*` (Plakette, Schritt 3): drei konzentrische Kreise —
  Vorbild für „Miniatur = identische Anatomie".

## `src/components/DetektivScreen.tsx` — `DetectiveMapLegend` (109–180)

Nutzt `shared = GanoveScreen.module.css` für die Legend-Klassen;
`legendDetective`-Swatch identisch zum Ganove-Screen (`rect`, Zeile 129).
Kein Ganove-Swatch in der Detektiv-Legende (Asymmetrie).

## `src/components/GanoveScreen.module.css` (Legende, 344–403)

- `.legendItem svg` (346–351): `background: var(--color-paper)`,
  `border: 1px solid var(--color-cardboard)`, `border-radius: 3px` —
  Papier-Chip hinter jedem Swatch.
- `.legendDetective` (370–374): `fill: var(--color-detective)`, `stroke:
  var(--color-map-detective-stroke)`, `stroke-width: 1.4`.
- `.legendGanove` (376–380): `fill: var(--color-map-ganove)`, `stroke:
  var(--color-ink)`, `stroke-width: 1.2`.

## `src/theme.css` — relevante Tokens

`--color-paper #e8dcc0`, `--color-paper-aged #d6c6a0`,
`--color-ink #2b2115`, `--color-ink-soft #57462e`,
`--color-detective #3d5a80`, `--color-detective-active #5a7db0`,
`--color-map-detective-stroke #22334d`, `--color-map-detective-active
#46648f`, `--color-map-ganove #8a5f12`, `--color-map-accent #7d5210`,
`--color-map-legal #2e7a54`, `--color-text #eaf0f8` (Index-Text:
auf dunkler Figur lesbar — Kontrast gegen Detektiv-Blau zu prüfen).

## Wiederverwendbare UI-Muster

- Glyph-Box + Fußpunkt am Ursprung + `aria-hidden` + Transform-Anker:
  `landmarks.tsx`.
- defs-Gradient + `useId`-Prefix + var()-Stops: `MapGraph` `tokenFace`.
- Plaketten-Miniatur = gleiche Anatomie wie Karten-Original:
  `legendTargetRing/Dot/Inner` (Schritt 3) — Blaupause für
  Figuren-Legenden-Miniaturen.
- Schatten-Ellipse auf Papier: `tokenShadow`.
