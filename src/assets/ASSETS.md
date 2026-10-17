# Rasterassets (KI-generiert)

Die Bilder in diesem Verzeichnis wurden mit
[Pollinations.ai](https://image.pollinations.ai) generiert (kostenlos,
kein API-Key nötig; bei Rate-Limits helfen Wiederholungen mit Pause)
und sind **lokal eingebettet** — es gibt keine Hotlinks und keine
externen Requests zur Laufzeit.

## Lizenz / Sichtprüfung

- Pollinations.ai gibt generierte Bilder laut Plattform frei zur
  Nutzung heraus (Stand: Abruf 2026-10-14 / Endprüfung Schritt 14).
  Alle Assets wurden nach dem Download gesichtet: gültige JPEGs,
  erwartete Maße, stilistisch konsistent (gemeinsamer Stil-Präfix:
  „noir detective board game illustration, flat stylized art, deep
  blue graphite palette with amber lantern accents, night city
  atmosphere"), keine erkennbaren Fremdlogos oder Wasserzeichen.
- Fallback: Schlägt die Generierung fehl (Rate-Limit/Downtime),
  kann ein Token über `?token=`/`Authorization` (Pollinations) bzw.
  Hugging-Face-Token für alternative Inference-APIs genutzt werden;
  als Notlösung bliebe ein SVG-Platzhalter im Noir-Farbschema —
  nicht nötig, da alle Assets eingebunden sind.

## Dateien und Prompts

| Datei | Verwendung | Prompt (gekürzt) |
|-------|------------|-------------------|
| `title-noir.jpg` | Titelbild im Hauptmenü | „dark detective noir board game title illustration, city map at night, street network nodes and edges, amber lanterns, deep blue graphite palette, flat stylized art" (seed 11, 768×768) |
| `map-muenster.jpg` | Kartenkarte Münster | „noir detective map of a german city at night with cathedral and bicycles, flat illustration, amber and blue" (seed 21, 768×768) |
| `map-luebeck.jpg` | Kartenkarte Lübeck | „noir illustration medieval port city brick gate bridges night flat art amber blue" (seed 31, 768×768) |
| `bg-noir.jpg` | Hintergrundtextur aller Screens (`GanoveScreen.module.css`, unter 93–97 %-Dunkeloverlay) | Stil-Präfix + „subtle dark abstract background texture, faint street map grid lines, very dark muted, minimal contrast" (seed 42, 768×768) |
| `case-diebstahlserie-altstadt.jpg` | Fallkarte „Diebstahlserie in der Altstadt" | Stil-Präfix + „castle courtyard break-in at night, shadowy figure with a lantern near a historic palace, fog" (seed 52, 768×432) |
| `case-kurier-am-hafen.jpg` | Fallkarte „Der Kurier am Hafen" | Stil-Präfix + „harbor district at night, courier handover of files at a pier warehouse, boats and cranes silhouettes, fog" (seed 62, 768×432) |

Generiert am 2026-10-14 über `https://image.pollinations.ai/prompt/…`
(Schritt-14-Ergänzungen mit Retries wegen sporadischem 402-Rate-Limit).

# Schriftarten

Die Schmuckschrift für Titel/Überschriften ist **lokal eingebettet**
(`@font-face` in `src/theme.css`) — keine CDN- oder Hotlink-Requests zur
Laufzeit.

| Font | Dateien | Verwendung |
|------|---------|------------|
| IM Fell English | `fonts/imfellenglish-regular.woff2` (normal 400), `fonts/imfellenglish-italic.woff2` (italic 400) | `--font-display` → `.title`, `.panelHeading`, `.heading`, `.cardTitle`, `.statHeading`, `.markerHeading` |

- **Name:** IM Fell English
- **Quelle:** Google Fonts — CSS-API
  `https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap`,
  WOFF2-Binaries von `fonts.gstatic.com` (latin-Subset), abgerufen am
  2026-10-15. Urheber: Igino Marini (Revival der Fell-Types, Oxford).
- **Version:** v14 (Schriftschnitte regular + italic, nur Weight 400
  verfügbar)
- **Lizenz:** [SIL Open Font License 1.1](https://openfontlicense.org) —
  erlaubt Einbettung und Weitergabe; Lizenztext:
  https://github.com/google/fonts/tree/main/ofl/imfellenglish
