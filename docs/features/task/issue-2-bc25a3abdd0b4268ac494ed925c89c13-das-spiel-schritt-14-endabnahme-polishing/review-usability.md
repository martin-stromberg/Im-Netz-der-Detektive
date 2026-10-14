# Usability-Review (Schritt 8)

Perspektive: Endanwender (Deutsch/Englisch, Maus + Tastatur).

## Geprüfte Änderungen

1. **Hintergrundtextur `bg-noir.jpg`** (alle Screens, unter 93–97 %
   Dunkel-Overlay):
   - Kontrast: dokumentierte WCAG-Werte in `GanoveScreen.module.css`
     gelten weiterhin — die Overlay-Deckkraft hält den effektiven
     Hintergrund im gemessenen Bereich (#0c0f16-dominant).
   - Lesbarkeit: Map-Graph, Panels und Fokusrahmen (#f5d76e-Outline)
     bleiben klar abgesetzt; die Textur trägt nur Atmosphäre.
   - Performance: 52 KB JPEG, `cover fixed` — kein Layout-Shift.
2. **Fall-Artworks in der Fallauswahl** (`MissionSelect`):
   - `<img alt="…">` lokalisiert (`mission.caseArtAlt`, de + en).
   - Fälle ohne Artwork rendern weiterhin textbasiert — keine
     Voraussetzung für spielbare Fälle.
   - `aspect-ratio 16/9` via `.cardImage` — kein Springen beim Laden.
   - Tastatur: Karte bleibt ein Button, Fokus-Outline unverändert.
3. **Balancing spürbar**: KI-gegen-KI ~48 % Ganove-Siege; der Trupp
   patrouilliert (Momentum statt Zittern) und reagiert mit Lage-
   Verzögerung — wirkt menschlicher, nicht „kaputt". Vorschlagswerte
   Münster (3 Detektive, 4 Kameras, Limit 40) bleiben über die
   Einstellungen in erlaubten Grenzen anpassbar.

## Offene Punkte

- Keine. `npm run check:strings` grün, keine hartkodierten Strings,
  beide Sprachen vollständig.
