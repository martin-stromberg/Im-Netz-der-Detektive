# Projektplan-Prüfung — Finales Brettspiel-Design „Im Netz der Detektive"

Geprüft: `project-plan.md` gegen `requirement.md` (vollständig, inkl.
Nicht-Ziele und Akzeptanzkriterien) sowie gegen den Kontext aus
`inventory.md` und den Detailanlagen.

## Ergebnis

**Status:** Projektplan vollständig

## Abgleich Anforderung ↔ Entwicklungsschritte

| # | Anforderung | Abgedeckt durch | Abdeckung |
|---|-------------|-----------------|-----------|
| 1 | Materialität (Papier/Pappe, Rahmen, Tischschatten) | Schritt 2 (feTurbulence-Körnung, Pappenrand, Drop-Shadow, MapBackdrop-Anpassung) | voll |
| 2 | Meeple-Figuren (Volumen, Schatten, Zugehörigkeit) | Schritt 4 (boardPieces.tsx, Silhouette + Farbe + Beschriftung) | voll |
| 3 | Orts-Tokens/Plaketten (Prägung, Rand, Symbol) | Schritt 3 (Fassung/Rand, radialGradient, Form-Differenzierung) | voll |
| 4 | Routen als gezeichnete Wege | Schritt 5 (konturierte Wege, Muster statt dasharray) | voll |
| 5 | Schmuckschrift lokal, Lizenz, kein CDN | Schritt 1 (WOFF2 src/assets/fonts/, @font-face, OFL, ASSETS.md) | voll |
| 6 | Kartenartige Panels | Schritt 6 (Shared-Theme + Badge-/Panel-/Menu-Module) | voll |
| 7 | Rahmen-/Tisch-Komposition | Schritt 7 (Tischfläche, gerahmte Einheit, alle Screens) | voll |
| 8 | Konsistenz über alle Screens | Schritt 7 (Überführung) + Schritt 8 (Audit) | voll |

Alle Bereiche (SVG-Rendering, Panels/Layout, Assets, i18n, Tests),
Abläufe (Ablauf unverändert, keine Info-Leaks, Zielgrößen erhalten),
Konfiguration (keine neuen Deps, Configs wirksam, ASSETS.md) und die
sieben Akzeptanzkriterien der Anforderung sind je mindestens einem
Schritt zugeordnet und über dessen Akzeptanzkriterien messbar.

## Abhängigkeitsprüfung

- 1 → 2 → {3, 4, 5}; 1 → 6; {2, 6} → 7; {3, 4, 5, 7} → 8
- Alle Verweise nur auf frühere Schritte, zyklenfrei; Schritt 8 hängt
  transitiv von allen ab. Übersichtstabelle stimmt mit Schrittkörpern
  überein. Jede Schrittbeschreibung ist als Lifecycle-Eingabe brauchbar.
- Nutzerentscheidung „Pergament-Brett + dunkle Umgebung" ist in den
  Schritten 2 (helle Karte), 6 (dunkle Edelkarten), 7 (dunkle Tisch-
  fläche) konsistent reflektiert.

## Fehlende oder unvollständige Punkte

Keine.

## Hinweise (nicht blockierend)

1. Schritte 7/8 halten eine optionale Raster-Asset-Klausel, obwohl die
   Tischtextur-Entscheidung als erledigt gilt — harmlose Fallback.
2. Nicht-Ziel „kein Merge/Push/PR" steht nicht im Plan —
   Rahmenbedingung, kein Umsetzungsrisiko.
3. Save/Load + Sprachwechsel indirekt über die bestehenden E2E-Specs
   abgesichert (Grün-Gebot).
4. Screenshot-Review (nach Schritt 7) ist Workflow-Vermerk ohne eigene
   Akzeptanzkriterien — bei Bedarf in Schritt 8 verankern.
