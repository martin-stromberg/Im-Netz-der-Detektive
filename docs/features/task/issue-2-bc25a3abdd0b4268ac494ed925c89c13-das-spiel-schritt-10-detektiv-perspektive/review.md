# Plan-Review — Schritt 10: Detektiv-Perspektive

Prüfung der Implementierung gegen `plan.md` (Abschnitte Designentscheidungen,
Programmabläufe, Komponenten, Tests).

## Planpunkt → Umsetzung

| Planpunkt | Stand | Nachweis |
|---|---|---|
| `DetektivScreen` (idle → pickSpawns → playing → outcome) | ✅ umgesetzt | `src/components/DetektivScreen.tsx` |
| `ganoveDriver` spiegelt `detectiveDriver` (KI-Ganove nach letztem Detektivzug, `aiRng(seed, round, 0)`, pendingChoice + Radio im Loop, Reentrancy-Guard) | ✅ umgesetzt | `src/state/ganoveDriver.ts` |
| `MapGraph`-Erweiterung: `cameras`, `showCategories`, `showZones`, `activeDetectiveIndex`, `markedNodeIds`, `markableNodeIds`, `possibleNodeIds` | ✅ umgesetzt | `src/components/MapGraph.tsx` + `.module.css` |
| Vorläufige Moduswahl (`?mode=` + Startauswahl) | ✅ umgesetzt | `src/App.tsx`, i18n `mode.*` |
| Detektiv-Aufstellung: `choice`/`free` wählbar, `random` auto | ✅ umgesetzt | `PickSpawnsView`, `detectiveSpawnChoices`, `pickDetectiveSpawns` |
| Hinweis-Chronik chronologisch mit Art/Ort/Zone/Runde | ✅ umgesetzt | `chronicleText` + `intel`-Feed |
| Marker + Kommentare, persistent, kein Eventlog | ✅ umgesetzt | `markers`-State, Markerliste |
| Overlay exakt aus `deducePossiblePositions` | ✅ umgesetzt | `possibleNodeIds` — Unit-Test und E2E vergleichen wortgleich mit dem Engine-Aufruf |
| Missionsstruktur mit Pools, ohne Ziel-IDs | ✅ umgesetzt | `missionStructure(mission)` + `nodesByCategory` |
| Umwelt-/Kantensperren sichtbar | ✅ umgesetzt | `blockedEdges` + `umwelt`-Chronik-Einträge |
| Alle Endzustände verständlich | ✅ umgesetzt | `OUTCOME_KEY` → `detektiv.outcome.*` |
| Strukturelle Asymmetrie (kein `ganovePosition`, keine `mission.targets` an die Sicht) | ✅ umgesetzt | nur `visibleEvents`/`visibleCameras`/`missionStructure` — E2E belegt 0 `data-ganove`/`data-mission-target` in jeder Runde |
| DE/EN-i18n-Parität | ✅ umgesetzt | 113 Keys je Sprache, maschinell geprüft |
| Neue Unit-/Komponententests | ✅ umgesetzt | `ganoveDriver.test.ts` (8), `DetektivScreen.test.tsx` (10), `MapGraph.test.tsx` (+6), `App.test.tsx` (+2) |
| `e2e/detektiv.spec.ts` mit kompletter Partie | ✅ umgesetzt | 7 Szenarien inkl. Vollspiel bis `timeout` (120 Züge, 13 Chronik-Einträge) |
| Geteilte Setup-Helfer | ✅ umgesetzt | `src/components/gameSetup.ts` (aus `GanoveScreen` extrahiert) |

## Abweichungen vom Plan — alle begründet

1. **`getMissionStructure()`-Selektor → `missionStructure(mission)` im Render:**
   Der Store-Selektor lieferte bei jedem Aufruf ein neues Array und löste
   eine Endlos-Aktualisierung aus (`Maximum update depth exceeded`). Die
   Selektion auf die stabile `mission`-Referenz plus lokaler Ableitung
   ist semantisch identisch. Gefunden durch jsdom-Tests.
2. **Pointer-Events auf der SVG-Karte:** Zonen-Halos/Kategorie-Badges
   vergrößerten die Klick-Bounding-Box; auf der dichten Testkarte
   überdeckten Nachbarknoten den Klickpunkt — Playwright-Actionability
   schlug fehl und echte Klicks hätten auf dichten Karten nahe Knoten
   verfehlen können. Alle Deko-Elemente sind jetzt
   `pointer-events: none`, nur die vorgesehene `hitArea` empfängt Klicks.
   Gefunden durch E2E-Test.
3. **Chronik/Werkzeuge bleiben nach Spielende sichtbar:** Im Plan implizit
   „laufendes Spiel" — die Umsetzung hält Chronik, Missionsstruktur und
   Werkzeuge auch im Endzustand sichtbar (Spielauswertung ist Teil der
   Deduktion); nur Zugeingaben und der Abbruch-Button sind an
   `outcome === null` gebunden. Gefunden durch E2E-Test.
4. **E2E-Missionswahl `random` statt `none`:** Mit `mission=none` flieht
   der KI-Ganove auf der kleinen Testkarte in Runde 1 — für belastbare
   Flusstests nutzt die Spec `mission=random` (deterministisch bis
   `timeout` in Runde 30, 9–22 Hinweise je nach Seed). Die Engine-
   Semantik bleibt unverändert.

## Ergebnis

**Plan vollständig umgesetzt.** Alle gefundenen Abweichungen sind
Korrekturen auf dem Weg zur plan- und anforderungskonformen
Implementierung, jeweils testgetrieben entdeckt und behoben.
