# Bestandsaufnahme — Styling und Tokens

## `src/theme.css` (Schritt-1-Ergebnis)

`:root` definiert die dunkle Noir-Palette plus unverbrauchte Brettspiel-Tokens:

| Token | Wert | Status |
|-------|------|--------|
| `--color-paper` | `#e8dcc0` | unverbraucht |
| `--color-paper-aged` | `#d6c6a0` | unverbraucht |
| `--color-ink` | `#2b2115` | unverbraucht |
| `--color-ink-soft` | `#57462e` | unverbraucht |
| `--color-cardboard` | `#6b5335` | unverbraucht |
| `--color-cardboard-edge` | `#4a3823` | unverbraucht |
| `--color-table` | `#191411` | unverbraucht |
| `--color-table-edge` | `#0e0b09` | unverbraucht |
| `--shadow-board` | `0 12px 40px rgb(0 0 0 / 55%)` | unverbraucht |
| `--font-display` | `"IM Fell English", …` (lokale woff2, `@font-face`) | verbraucht (Headings) |

Dokumentierte Kontraste im Kommentarkopf: `--color-ink` auf `--color-paper` 11.6:1, `--color-ink-soft` auf `--color-paper` 6.6:1, `--color-paper` auf `--color-cardboard(-edge)` 5.3/6.5:1.

Kartenrelevante Bestandstokens (dunkler Grund kalibriert):

| Token | Wert | Verbraucht in |
|-------|------|----------------|
| `--color-edge-route` | `#4a5568` | `MapGraph.module.css` (`.edge`), `GanoveScreen.module.css` (`.legendWeg`, `.splash_draw`-Border) |
| `--color-route-fahrt` | `#7a6a4f` | `MapGraph.module.css` (`.edgeFahrt`), `GanoveScreen.module.css` (`.legendFahrt`) |
| `--color-edge-blocked` | `#3a3f4a` | `MapGraph.module.css`, `DetektivScreen.module.css` (`.removeButton`-Border) |
| `--color-escape` | `#7fb8d4` | `MapGraph.module.css` (`.escapeMarker`, `.mission_flucht`), `GanoveScreen.module.css` (`.legendEscape`), `EventBanner.module.css` |
| `--color-pin` | `#b48ad4` | `MapGraph.module.css` (`.markerPin`, `.mission_kontakt`), `DetektivScreen.module.css` (`.legendPin`) |
| `--color-possible` | `#d4a94f` | `MapGraph.module.css` (`.possibleRing`), `DetektivScreen.module.css` (`.legendDiamond`) |
| `--color-detective` | `#3d5a80` | `MapGraph.module.css` (`.detectiveShape`), `GanoveScreen.module.css` (`.legendDetective`, Rahmen) |
| `--color-detective-light` | `#9db8d9` | `MapGraph.module.css`, `DetektivScreen.module.css` (Texte, `.legendCamera*`), `GanoveScreen.module.css` |
| `--color-detective-active` | `#5a7db0` | nur `MapGraph.module.css` |
| `--color-amber` / `--color-amber-bright` | `#e8b45a` / `#f5d76e` | viele Screens + `MapGraph` (Ganove-Fill, Fokusring, `edgeFlash`, `mission_diebstahl`, `legendGanove`, `legendCategory`) |
| `--color-green` / `--color-green-bright` | `#7fd4a8` / `#a8e8c8` | viele Screens + `MapGraph` (legale Ziele, Hover) |
| `--color-danger` | `#d98c8c` | viele Screens + `MapGraph` (`.blockGlyph`, `.mission_sabotage`, `.cameraStrike`) |
| `--color-text-muted` | `#8a94a6` | u. a. `.nodeLabel` (10-px-Labels) |
| `--color-text-secondary` | `#c8d0dc` | u. a. `.nodeDot`-Fill |
| `--color-inset-bg` | `#10141c` | u. a. `.map`-Background, Outlines (`nodeDot`-Stroke, `ganoveShape`-Stroke, `markerPin`-Stroke) |
| `--color-surface-hover` | `#243050` | u. a. `.cameraBody`-Fill |
| `--color-feature-*` (7 Stück) | dunkle Comic-Werte | nur `MapBackdrop.module.css` |

## `src/components/MapGraph.module.css`

- `.map`: `background: var(--color-inset-bg)`, `border: 1px solid var(--color-border)`, `border-radius: 8px` — **kein** Schatten, kein Brett-Look.
- `.map :where(g, path, circle, rect, line, text, title) { pointer-events: none }` — neue `<rect>`s sind automatisch klick-neutral; Hit-Area bleibt `pointer-events: all`.
- Alle Status-/Glyph-Farben via `var()` auf die oben gelisteten Tokens; Formkodierung (Dash-Pattern, Kreuz, Diamant, Flagge) über `stroke-dasharray`/`d`-Attributen.
- `edge-flash`-Keyframe (3400 ms) und `markerMove`-Transition sind jeweils mit `@media (prefers-reduced-motion: reduce)` abgeschaltet.

## `src/components/MapBackdrop.module.css`

Füllungen/Strokes je `feature_*`-Klasse aus den `--color-feature-*`-Tokens; `rail` gestrichelt (`8 4`), `street` runde Caps, `water`/`park`/`block` gefüllt mit Outline.

## Kontrastlage (gemessen an `--color-paper` `#e8dcc0`, L ≈ 0.72)

Aktuelle Werte auf Papier (Richtwerte): `--color-text-muted` ≈ 2.8:1 (Labels — AA-Fail), `--color-amber` ≈ 1.7:1, `--color-green` ≈ 1.7:1, `--color-escape` ≈ 1.9:1, `--color-pin` ≈ 2.2:1, `--color-possible` ≈ 2.0:1, `--color-danger` ≈ 2.4:1, `--color-amber-bright` ≈ 1.4:1, `--color-detective` ≈ 4.9:1 (ok), `--color-detective-light` ≈ 2.0:1, `--color-edge-route` ≈ 4.6:1 (ok, aber bläulich — Sepia passt besser), `--color-text` auf `--color-detective` ≈ 6:1 (Marker-Ziffer ok).

→ Neue dunkle Karten-Tokens nötig; Shared-Tokens bleiben für dunkle Panels unverändert.
