# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Komplette Partie Mensch-Detektive vs. KI-Ganove von Startaufstellung bis zu jedem Endzustand | `ganoveDriver` + `DetektivScreen` (idle→pickSpawns→playing→outcome); `moveDetective`-Fluss mit Fangprüfung im Store; Outcome-Panel | `DetektivScreen.test.tsx` (Zugfluss, Outcome), E2E „Komplette Partie bis outcome" | Abgedeckt |
| Hinweis-Chronik mit Typ, Ort/Zone, Runde, vollständig + chronologisch | Chronik-Panel aus `visibleEvents(…,"detectives")` mit Runde/Typ/Ort-Zone, inkl. `umwelt` | jsdom-Test auf Eintragsinhalte; E2E „Chronik wächst" | Abgedeckt |
| Marker setzbar, kommentierbar, über Runden erhalten | Marker-Modus (alle Knoten selektierbar) + Markerliste mit Kommentar-Input; UI-State überlebt Runden | jsdom + E2E „Marker setzen+kommentieren+über Runden" | Abgedeckt |
| Overlay zeigt exakt die Deduktions-Menge | `deducePossiblePositions` direkt als Datenquelle, keine eigene Logik | jsdom-Vergleich `[data-possible]`-IDs === Engine-Set; E2E-Vergleich via importierter `Deduction.ts` | Abgedeckt |
| Nie Ganove, nie gezogene Missionszielknoten; Kameras nur hier | Konstruktiv: `ganovePosition`/`mission.targets` nie an `MapGraph`; nur `visibleEvents/visibleCameras(detectives)` + `getMissionStructure()` | jsdom-Asymmetrie-Test (`[data-ganove]`,`[data-mission-target]` = 0); E2E-Asymmetrie; Ganove-E2E prüft `[data-camera]` = 0 | Abgedeckt |
| Benutzerfluss-E2E + jsdom grün | `e2e/detektiv.spec.ts` (7 Pflicht-Szenarien) + jsdom-Suite | Schritt 10 Testlauf | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Startaufstellung (Detektive wählen, Ganove-Start verborgen) | Setup-Test in `detektiv.spec.ts` | Abgedeckt |
| Vollständige Partie bis Endzustand | Vollspiel-Test (deterministischer Seed) | Abgedeckt |
| Hinweis-Chronik | Chronik-Test | Abgedeckt |
| Overlay = Deduktions-Menge | Overlay-Test mit Engine-Vergleich | Abgedeckt |
| Marker + Kommentare + Persistenz über Runden | Marker-Test | Abgedeckt |
| Sichtbarkeitsregeln (kein Ganove, keine Zielknoten, Kameras) | Asymmetrie-Test | Abgedeckt |
| Tastaturbedienung | Tab+Enter-Test | Abgedeckt |

## Hinweise

- `e2e/ganove.spec.ts` erhält `&mode=ganove` an den `page.goto`-Aufrufen —
  bewusste, dokumentierte Anpassung durch den param-losen Modus-Dialog.
- `App.test.tsx` wird angepasst (Modus-Auswahl ist neuer Einstieg).
