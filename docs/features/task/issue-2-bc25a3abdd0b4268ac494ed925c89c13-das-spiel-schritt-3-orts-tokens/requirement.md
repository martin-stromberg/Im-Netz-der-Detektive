# Übersetzte Anforderung: Orts-Tokens — Knoten als geprägte Plaketten (Schritt 3)

Quelle: Projektschritt 3 „Orts-Tokens" des Projektplans „Finales Brettspiel-Design"
(`docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/project-plan.md`).

## Fachliche Zusammenfassung

Die Orte (Knoten) auf dem Spielbrett werden in `MapGraph` nicht mehr als nackte
flache Kreise (`<circle r="8" className={styles.nodeDot}>`) gerendert, sondern als
plakettenartige Orts-Tokens mit Kartenhaptik: Fassung/Rand (doppelter Ring bzw.
eingefasste Kappe), Volumenprägung über `radialGradient` und ein dezenter
Schlagschatten — wie auf das Pergament-Brett gedruckte/gelegte Kartenplaketten.
Zustände (legal, selektierbar, Fokus) und ggf. Stationstypen differenzieren die
Form zusätzlich — Farbe ist nie das alleinige Unterscheidungsmerkmal. Die
Legenden-Swatches (`MapLegend` in `GanoveScreen.tsx`, `DetectiveMapLegend` in
`DetektivScreen.tsx`) spiegeln die neue Token-Form („gleiche Form = gleiche
Bedeutung").

## Betroffene Klassen und Komponenten

- `src/components/MapGraph.tsx` — Knoten-Rendering (`data-layer="nodes"`):
  `nodeDot`-Kreis wird durch eine Token-Struktur ersetzt; neuer
  `radialGradient` für die Prägung im bestehenden `<defs>`-Block
  (`defsId`-Muster via `useId` beachten).
- `src/components/MapGraph.module.css` — neue Token-Klassen (Fassung, Prägung,
  Schatten, Zustandsvarianten); `nodeDot`-Regeln werden ersetzt;
  `:focus-visible`-Amber-Ring bleibt erhalten.
- `src/components/GanoveScreen.tsx` / `GanoveScreen.module.css` —
  `MapLegend`: Swatches `legendTargetDot`/`legendTargetRing` an die
  Token-Optik anpassen.
- `src/components/DetektivScreen.tsx` / `DetektivScreen.module.css` —
  `DetectiveMapLegend`: Token-Swatch ergänzen/anpassen (gleiche Form = gleiche
  Bedeutung).
- `src/theme.css` — fehlende `--color-map-*`-/`--color-ink*`-Tokens für
  Token-Fassung/-Schatten ergänzen (Tinten-/Sepia-Töne, helles Papier).
- Tests: `src/components/MapGraph.test.tsx` (Token-Struktur, Hit-Area r=14,
  data-*-Vertrag, defs-Eindeutigkeit), `e2e/design.spec.ts` bzw. bestehende
  E2E-Suiten (Token-Optik, Tastatur-Roaming, `:focus-visible`).

## Implementierungsansatz

- Der `<circle className={styles.nodeDot}>` wird durch eine kleine SVG-Gruppe
  (Token) ersetzt: Schatten-Ellipse, Fassungs-/Randring(e), geprägte
  Token-Fläche mit `fill="url(#{defsId}-token…)"`-Gradient. Der
  `radialGradient` kommt in den vorhandenen `<defs>`-Block und folgt dem
  `defsId`-Namensmuster, damit parallele `MapGraph`-Instanzen
  (z. B. `ReplayScreen`) kollisionsfreie IDs haben.
- Die unsichtbare Hit-Area (`<circle r="14" className={styles.hitArea}>`,
  `pointer-events: all`) bleibt unverändert und bleibt das einzige
  pointer-sensitive Element (`.map :where(...)`-Regel bleibt wirksam);
  die sichtbare Token-Geometrie bleibt kleiner als r=14.
- Alle Overlays behalten Position und Funktion: `zoneHalo` (r=13),
  `legalRing` (r=12, gestrichelt), `possibleRing`-Diamant (r=15),
  `categoryBadge`, `cameraGlyph`, `markerPin`, `escapeMarker`,
  `missionBadge`, `nodeLabel` (y = 18).
- Zustände über Form + Farbe: `nodeLegal`/`nodeSelectable` behalten den
  gestrichelten grünen Ring bzw. bekommen zusätzlich einen Rand-Wechsel am
  Token (z. B. perforierte/doppelte Fassung in `--color-map-legal`);
  `nodeCurrentTarget`/`nodeGanoveHere` wirken auf Rand/Füllung des Tokens;
  `.nodeInteractive:focus-visible` behält den Amber-Ring
  (`--color-map-accent`) — jetzt auf der Token-Fassung.
- Keine neuen `data-*`-Attribute entfernen/umbenennen — der bestehende
  Attributvertrag (`data-node-id`, `data-legal-target`, `data-selectable`,
  `data-markable`, `data-possible`, `data-zone`, `data-category`,
  `data-camera(-active)`, `data-marker`, `data-escape-node`,
  `data-mission-target`) bleibt Testvertrag.
- Keine neuen Render-Pfade, die gegnerische Informationen preisgeben
  (Perspektiv-Asymmetrie bleibt konstruktiv erhalten — keine neuen Props).

## Konfiguration

Keine Konfiguration erforderlich — reine Darstellungsänderung.

## Offene Fragen

Keine — die Anforderung enthält die Nutzerentscheidung (Pergament-Brett +
dunkle Umgebung, `--color-paper`/`--color-ink`/`--color-map-*`), das
Farbkodierungsverbot als alleiniges Merkmal und den unveränderten
Attribut-/Hit-Area-Vertrag bereits verbindlich.
