# Bestandsaufnahme: Assets

## Vorhandene Assets unter `src/assets/`

| Datei | Typ | Verwendung |
|-------|-----|------------|
| `ASSETS.md` | Doku | Lizenz-/Herkunftsdoku der Rasterassets |
| `bg-noir.jpg` | JPEG | Hintergrundtextur (Referenz in `GanoveScreen.module.css` Z. 36) |
| `title-noir.jpg` | JPEG | Titelbild Hauptmenü |
| `map-muenster.jpg`, `map-luebeck.jpg` | JPEG | Kartenkarten |
| `case-diebstahlserie-altstadt.jpg`, `case-kurier-am-hafen.jpg` | JPEG | Fallkarten |
| `caseArt.ts` | TS | Zuordnung Fall → Bild |

`src/assets/fonts/` existiert **nicht**; es gibt keine Font-Dateien im Repo
und keine `font-family`-/`@font-face`-Deklaration in `src/`.

## Font-Bezugsquelle (geprüft 2026-10-15, Netz verfügbar)

- **„IM Fell English"** ist über Google Fonts verfügbar (SIL Open Font
  License). Die CSS-API
  `https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap`
  liefert zwei `@font-face`-Blöcke (latin-Subset):
  - Regular 400: `https://fonts.gstatic.com/s/imfellenglish/v14/Ktk1ALSLW8zDe0rthJysWrnLsAzHEKOY.woff2`
  - Italic 400: `https://fonts.gstatic.com/s/imfellenglish/v14/Ktk3ALSLW8zDe0rthJysWrnLsAzHFZOafYs.woff2`
  - Schriftschnitt-Version laut URL-Pfad: `v14`. Die Familie existiert nur
    in Weight 400 (regular + italic).
- Fallback laut Projekt-Kontext: „Playfair Display" (ebenfalls OFL, Google
  Fonts) — nicht nötig, da IM Fell English abrufbar ist.

## Lizenzlage

SIL Open Font License 1.1 erlaubt Einbettung, Weitergabe und Nutzung in
Software; verpflichtend ist die Lizenzangabe/-dokumentation (erfolgt in
`ASSETS.md`). Google-Fonts-WOFF2-Dateien sind die von den Urhebern
bereitgestellten Binaries — lokale Ablage ist lizenzkonform.
