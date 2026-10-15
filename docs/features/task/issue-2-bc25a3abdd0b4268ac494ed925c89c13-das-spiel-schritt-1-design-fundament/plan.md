# Umsetzungsplan: Schritt 1 — Design-Fundament (Theme, Schmuckschrift, Farbvariablen)

## Übersicht

Einrichtung eines globalen Design-Token-Fundaments: `src/theme.css` mit
`:root`-Custom-Properties (Bestandspalette unverändert + neue
Brettspiel-Tokens), lokal eingebettete WOFF2-Schmuckschrift „IM Fell
English" (SIL OFL) für Titel/Überschriften, schrittweise `var()`-Umstellung
aller CSS-Module — ohne Änderung an Klassennamen, `data-*`-Attributen,
TSX-Struktur, sichtbaren Strings oder Spiellogik.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Token-Träger | Globales (nicht-modulares) `src/theme.css`, Import in `main.tsx` | CSS-Module scopen Klassen; `:root`-Custom-Properties und `@font-face` gehören global. Vite bündelt `import "./theme.css"` automatisch. |
| Token-Namenschema | `--color-*` (semantisch: `--color-screen-bg`, `--color-panel-bg`, …) + `--font-display`, `--shadow-*` | Semantische Rollen statt Farbnamen — spätere Schritte (Pergament-Brett, Panels) nutzen dieselben Rollen; entspricht gängiger Design-Token-Praxis. |
| Farbige Alpha-Varianten | Eigene Tokens mit Alpha-Suffix (z. B. `--color-danger-a70` für `rgb(217 140 140 / 70%)`) | Kein hex8/#rgba-Umrechnungsrisiko; Werte bleiben exakt identisch; CSS-`rgb(from …)`-Syntax wird vermieden (Kompatibilität, Lesbarkeit). |
| Schrift-Einbettung | `@font-face` in `theme.css`, WOFF2 unter `src/assets/fonts/`, `font-display: swap`, Stack `--font-display: "IM Fell English", Georgia, "Times New Roman", serif` | Google-Fonts-Binary (fonts.gstatic.com, OFL) lokal ablegen → kein CDN-/Hotlink-Request zur Laufzeit; Fallback-Stack Systemserifen. |
| Schrift-Anwendung | `font-family: var(--font-display)` nur auf Heading-Klassen (`.title`, `.panelHeading`, `.heading`, `.statHeading`, `.cardTitle`, `.markerHeading`) | Anforderung: Fließtext bleibt Systemschrift. |
| Brettspiel-Tokens | Neue `:root`-Tokens: Papier (`--color-paper`, `--color-paper-aged`, `--color-ink`, `--color-ink-soft`), Pappe (`--color-cardboard`, `--color-cardboard-edge`), Tisch (`--color-table`, `--color-table-edge`), Schatten (`--shadow-panel`, `--shadow-board`) | Projekt-Kontext „Pergament-Brett auf dunklem Tisch": helles Papier-Token wird erst in Folgeschritten für Kartenflächen verwendet; Umgebung bleibt dunkel. Tokens werden jetzt definiert, in diesem Schritt noch nicht an Flächen verdrahtet (außer dokumentierten Kontrastpaarungen). |
| var()-Umstellung | Vollständig in `GanoveScreen.module.css` und allen weiteren Modulen für jede Farbe, die einen Token hat | „Wo sinnvoll" = überall, wo derselbe Farbwert einen Token besitzt; Struktur/Klassen/Selektoren unverändert. |

## Programmabläufe

### Font-Download und -Einbettung

1. WOFF2-Dateien „IM Fell English" (regular, italic; latin-Subset, v14)
   von fonts.gstatic.com nach `src/assets/fonts/` laden:
   `imfellenglish-regular.woff2`, `imfellenglish-italic.woff2`.
2. `@font-face`-Blöcke in `theme.css` mit `src: url("./assets/fonts/…")`
   und `font-display: swap`.
3. `--font-display`-Token definieren; Heading-Klassen in den CSS-Modulen
   erhalten `font-family: var(--font-display)`.

Beteiligte Artefakte: `src/theme.css`, `src/assets/fonts/*`,
`GanoveScreen.module.css`, `Menu.module.css`, `MissionPanel.module.css`,
`DetektivScreen.module.css`.

### Theme-Tokens und Umstellung

1. `src/theme.css` anlegen: `:root`-Block mit allen Bestands-Tokens
   (Werte unverändert aus den Modulen) + neue Brettspiel-Tokens +
   WCAG-AA-Kontrast-Kommentar (analog `GanoveScreen.module.css` Z. 1–27,
   ergänzt um neue Papier-Paarungen).
2. `import "./theme.css";` in `src/main.tsx` (vor `App`-Import).
3. In jedem CSS-Modul Farbliterale durch `var(--token)` ersetzen —
   1:1-Ersetzung, keine Selektor-/Klassenänderung. Bestehender
   WCAG-Kommentar in `GanoveScreen.module.css` bleibt (verweist
   ergänzend auf `theme.css`).

Beteiligte Artefakte: `src/theme.css`, `src/main.tsx`, alle
`*.module.css`-Dateien.

### Dokumentation der Assets

1. `src/assets/ASSETS.md` um Abschnitt „Schriftart" ergänzen: Name
   (IM Fell English), Quelle (Google Fonts / fonts.gstatic.com-URL,
   Abrufdatum), Lizenz (SIL Open Font License 1.1), Version (v14,
   Schriftschnitte regular+italic, latin-Subset).

## Neue Dateien

| Datei | Typ | Zweck |
|-------|-----|-------|
| `src/theme.css` | Globales Stylesheet | `:root`-Tokens, `@font-face`, WCAG-Kommentar |
| `src/assets/fonts/imfellenglish-regular.woff2` | Binär-Asset | Schmuckschrift regular |
| `src/assets/fonts/imfellenglish-italic.woff2` | Binär-Asset | Schmuckschrift italic |
| `e2e/design.spec.ts` | Playwright-E2E | Funktionsnachweis: Schmuckschrift angewendet, keine externen Font-Requests |

## Änderungen an bestehenden Dateien

### `src/main.tsx`
- Neuer Import `import "./theme.css";` (oberster Import; Kommentar-Konvention beibehalten).

### `src/components/GanoveScreen.module.css` (Shared-Theme)
- Alle Farbliterale → `var(--color-…)`; `rgba(12,15,22,…)`-Overlay → `--color-screen-overlay-*`-Tokens.
- `.title` und `.panelHeading` erhalten `font-family: var(--font-display)`.
- WCAG-Kommentar bleibt, Hinweis auf `theme.css` als Token-Quelle.

### `src/components/Menu.module.css`
- Farbliterale → `var()`; `.cardTitle`, `.statHeading` → `font-family: var(--font-display)`.

### `src/components/DetektivScreen.module.css`
- Farbliterale → `var()`; `.markerHeading` → `font-family: var(--font-display)`.

### `src/components/MissionPanel.module.css`
- Farbliterale → `var()`; `.heading` → `font-family: var(--font-display)`.

### `src/components/EventBanner.module.css`, `HeatBadge.module.css`, `PursuitBadge.module.css`, `MapGraph.module.css`, `MapBackdrop.module.css`, `App.module.css`
- Farbliterale → `var()` (keine Schrift-Änderung: keine Headings).

### `src/assets/ASSETS.md`
- Font-Eintrag (Name, Quelle, Lizenz, Version).

## Token-Mapping (Bestand, Auszug — vollständige Liste in theme.css)

`#0c0f16 → --color-screen-bg` · `#161b26 → --color-panel-bg` ·
`#10141c → --color-inset-bg` · `#2a3240 → --color-border` ·
`#eaf0f8 → --color-text` · `#c8d0dc → --color-text-secondary` ·
`#8a94a6 → --color-text-muted` · `#e8b45a → --color-amber` ·
`#f5d76e → --color-amber-bright` · `#7fd4a8 → --color-green` ·
`#d98c8c → --color-danger` · `#3d5a80 → --color-detective` ·
`#9db8d9 → --color-detective-light` · `#1d2534 → --color-surface-raised` ·
`#243050 → --color-surface-hover` · `#4a2326 → --color-danger-surface` ·
`#5c2c30 → --color-danger-surface-hover` · `#f0c8c8 → --color-danger-text` ·
`#e88a7a → --color-danger-error` · `#4a5568 → --color-edge-route` ·
`#3a3f4a → --color-edge-blocked` · `#7a6a4f → --color-route-fahrt` ·
`#7fb8d4 → --color-escape` · `#b48ad4 → --color-pin` ·
`#d4a94f → --color-possible` · `#e8a05a → --color-heat-raised` ·
`#a8e8c8 → --color-green-bright` · `#5a7db0 → --color-detective-active` ·
`#3a4152 → --color-bar-dim` · MapBackdrop-Features → `--color-feature-*`.

Neue Tokens (nur definiert, Verwendung in Folgeschritten):
`--color-paper`, `--color-paper-aged`, `--color-ink`, `--color-ink-soft`,
`--color-cardboard`, `--color-cardboard-edge`, `--color-table`,
`--color-table-edge`, `--shadow-panel`, `--shadow-board`.

## Datenbankmigrationen

Keine.

## Validierungsregeln

Keine.

## Konfigurationsänderungen

Keine.

## Seiteneffekte und Risiken

- **Visuelles Rendering:** `var()`-Auflösung ist bei identischen Werten
  pixelgleich; Risiko minimal. `@font-face` verändert Heading-Metriken
  (Zeilenhöhe/Umbruch) — akzeptiert und gewünscht.
- **Prettier:** Neue CSS/TSX-Änderungen müssen `format:check` bestehen
  (pre-commit-Hook prüft gestagte Dateien).
- **E2E:** `data-*` und Texte unverändert → bestehende Playwright-Specs
  bleiben gültig.

## Umsetzungsreihenfolge

1. **Fonts herunterladen und ablegen**
   - Voraussetzungen: Netz (verifiziert); `src/assets/` vorhanden.
   - Beschreibung: `src/assets/fonts/` anlegen; beide WOFF2-Dateien von
     fonts.gstatic.com laden; Dateiintegrität prüfen (WOFF2-Magic `wOF2`).
2. **`src/theme.css` erstellen**
   - Voraussetzungen: Schritt 1 (für `@font-face`-URLs).
   - Beschreibung: `@font-face` (regular+italic), `:root`-Token-Block
     (Bestand + neue Tokens), WCAG-AA-Kommentarblock mit gemessenen
     Kontrasten (Bestandswerte übernehmen, neue Paarungen berechnen).
3. **`theme.css` in `main.tsx` importieren**
   - Voraussetzungen: Schritt 2.
4. **`GanoveScreen.module.css` auf `var()` + Schmuckschrift umstellen**
   - Voraussetzungen: Schritt 2.
5. **Übrige Module auf `var()` (+ Headings auf Schmuckschrift) umstellen**
   - Voraussetzungen: Schritt 2.
6. **`ASSETS.md` Font-Eintrag**
   - Voraussetzungen: Schritt 1.
7. **E2E-Spec `e2e/design.spec.ts` schreiben**
   - Voraussetzungen: Schritte 2–5.
   - Beschreibung: Hauptmenü + Spielscreen laden; computed `font-family`
     von Titel enthält „IM Fell English"; Request-Listener belegt, dass
     keine fonts.gstatic.com/googleapis.com-Anfrage ausgelöst wird;
     `:root`-Tokens lesbar.
8. **Verifikation:** `npm test`, `npm run lint`, `npm run typecheck`,
   `npm run format:check`, Hook-Checks, `npm run test:e2e`.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `headings use the display font` | `e2e/design.spec.ts` | Computed `font-family` von `h1` im Hauptmenü und im Ganove-Screen enthält „IM Fell English" |
| `no external font requests` | `e2e/design.spec.ts` | Request- interception: keine Anfrage an fonts.googleapis.com / fonts.gstatic.com beim Laden |
| `theme tokens are defined` | `e2e/design.spec.ts` | `getComputedStyle(documentElement)` liefert nicht-leere `--color-screen-bg`, `--color-paper`, `--font-display` |

### Betroffene bestehende Tests

Keine — Suite prüft Verhalten/Struktur, keine CSS-Werte; Klassennamen und
`data-*` bleiben unverändert.

### E2E-Tests (primärer Funktionsnachweis)

| Priorität | Szenario | Testdatei | Abgedecktes Akzeptanzkriterium | Warum E2E nötig ist |
|-----------|----------|-----------|-------------------------------|---------------------|
| Pflicht | Schmuckschrift auf Titeln sichtbar (computed font-family) | `e2e/design.spec.ts` | AK 2 (Schrift sichtbar auf allen Screens) | Nur ein Browser rendert `@font-face`/computed style — Vitest/jsdom kann das nicht nachweisen |
| Pflicht | Kein externer Font-Request | `e2e/design.spec.ts` | AK 2 (kein CDN/Hotlink) | Nur im echten Browser-Netzwerk nachweisbar |
| Pflicht | Tokens auf `:root` aktiv | `e2e/design.spec.ts` | AK 1 (Custom Properties verwendet) | Nachweis, dass `theme.css` tatsächlich geladen wird |

Bestehende E2E-Tests angepasst: Keine.

## Offene Punkte

Keine.
