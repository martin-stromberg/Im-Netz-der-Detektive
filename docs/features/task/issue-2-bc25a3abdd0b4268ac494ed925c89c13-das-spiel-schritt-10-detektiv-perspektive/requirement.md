# Übersetzte Anforderung: Detektiv-Perspektive (Entwicklungsschritt 10)

## Fachliche Zusammenfassung

Der zweite Spielmodus aus `01-spielkonzept.md` §6 (OT-30) wird vollständig
spielbar: Der Mensch steuert den kompletten Detektivtrupp (D1→Dn in fester
Reihenfolge) gegen den KI-Ganoven (`GanoveAI`). Dafür wird eine neue
React-Oberfläche `DetektivScreen` gebaut, die die geteilte `MapGraph`-Komponente
in der Detektiv-Perspektive nutzt (volle Karte inkl. Ortskategorien/Zonen,
Kamera-Icons, eigene Positionen, gesperrte Kanten — der Ganove bleibt
unsichtbar) und die drei Deduktions-Werkzeuge aus `01-spielkonzept.md` §6
(OT-31) anbietet: Hinweis-Chronik, manuelle Marker mit Kommentaren und das
„Mögliche-Positionen"-Overlay auf Basis von `deducePossiblePositions`.
Die Missionsstruktur (Reihenfolge + Status) wird angezeigt, niemals die
gezogenen Zielknoten.

## Betroffene Klassen und Komponenten

### Neu zu erstellen

- `src/components/DetektivScreen.tsx` — DetektiveUI: Setup-Ansicht
  (Detektiv-Startplätze wählen bzw. auto bei `mode: "random"`), Spielansicht,
  Endansicht. Löst ausschließlich Store-Aktionen aus.
- `src/components/DetektivScreen.module.css` — dunkles Krimi-Theme analog
  `GanoveScreen.module.css`.
- `src/state/ganoveDriver.ts` — store-gebundener Treiber für die KI-Ganove
  (analog `detectiveDriver.ts`): beantwortet `pendingChoice` via
  `chooseSabotagePath`, zapft via `shouldUseRadio`, spielt via
  `chooseGanoveTurn` über `buildGanoveView`; RNG über `aiRng(seed, round, 0)`.
- `src/components/DetektivScreen.test.tsx` — jsdom-Tests.
- `src/state/ganoveDriver.test.ts` — Treiber-Tests.
- `e2e/detektiv.spec.ts` — Benutzerfluss-E2E-Tests (Playwright).

### Zu erweitern

- `src/components/MapGraph.tsx` + `MapGraph.module.css` — neue optionale Props
  für die Detektiv-Perspektive: Kamera-Icons (`cameras`), Ortskategorien-
  Badges/Zonen (`showCategories`/`showZones`), aktiven Detektiv
  (`activeDetectiveIndex`), Marker-Pins (`markedNodeIds`) und das
  „Mögliche-Positionen"-Overlay (`possibleNodeIds`). Rückwärtskompatibel —
  die Ganove-Ansicht bleibt unverändert (keine Kamera-Prop ⇒ strukturell
  keine Kameras sichtbar).
- `src/App.tsx` — minimaler temporärer Modus-Switcher (Auswahl
  Ganove/Detektiv; wird in Schritt 11 durch das richtige Menü ersetzt).
- `src/i18n/de.json` + `src/i18n/en.json` — neue Schlüssel, paritätisch
  (Hook `i18n-check.py` erzwingt Parität).
- `src/App.test.tsx` — ggf. Anpassung wegen Modus-Auswahl.

## Implementierungsansatz

- Rundenmaschine bleibt vollständig im `useGameStore`: Die UI ruft nur
  `moveDetective`, `abortAsDraw`, `resetGame`, `startGame`. Nach dem letzten
  Detektivzug wechselt die Phase automatisch zu `ganove` —
  `installGanoveDriver` spielt dann die KI-Züge (Zugzwang-Ausnahmen:
  `ganoveAction` bei Missionsaktion, `chooseMissionPath` bei
  `pendingChoice`, `useRadio` bei `shouldUseRadio`).
- Informationsasymmetrie konstruktiv: Die Detektiv-Ansicht filtert Ereignisse
  ausschließlich über `visibleEvents(events, "detectives")` (inkl.
  `visibleTo: "both"`), Kameras über `visibleCameras(…, "detectives")` und
  übergibt `ganovePosition`/`mission.targets` niemals an `MapGraph`.
  Die Missionsstruktur kommt aus `getMissionStructure()` (keine Knoten-IDs).
- Overlay: `deducePossiblePositions` aus `Deduction.ts` mit
  `detectiveStarts` aus `detectiveStartsFromLog(log)`, aktuellen
  `detektivePositions`, `round` und den Detektiv-sichtbaren
  Ereignissen/Kameras — exakt die Engine-Menge, keine UI-eigene
  Deduktionslogik.
- Marker/Kommentare: detektivseitiger UI-State im `DetektivScreen`
  (Map von Knoten-ID → Kommentar), wandert nicht ins Eventlog; bleibt
  über Runden bestehen, Reset bei neuer Partie.
- Startaufstellung: `spawnRules.detectives.mode` steuert den Setup-Fluss —
  `choice`/`free`: Spieler wählt D1→Dn nacheinander aus den legalen
  Kandidaten (`detectiveSpawnChoices` bzw. alle Knoten); `random`:
  automatische Ziehung via `pickDetectiveSpawns`. Der KI-Ganove-Start wird
  nie angezeigt (`startGame` ohne `ganovePosition`).
- Moduswahl: temporärer Switcher in `App.tsx` — `?mode=detektiv|ganove`
  URL-Parameter, ohne Parameter eine einfache Zwei-Buttons-Auswahl.
- i18n: alle neuen Texte über Schlüssel, de/en paritätisch. Tastatur:
  alle Klicks auch per Tab+Enter (MapGraph stellt `role="button"` bereit).
  Farbe+Form: Kamera-Glyph, Marker-Pin, Overlay-Ring als eigenständige
  Formen, nicht nur Farbcodierung.

## Konfiguration

Keine neue Konfiguration. Bestehende `?map=`/`?seed=`/`?mission=`-URL-
Parameter werden analog `GanoveScreen` unterstützt; neu `?mode=`.

## Offene Fragen

Keine — Moduswahl-Switcher ist durch die Vorgabe („minimaler temporärer
Modus-Switcher, wird in Schritt 11 ersetzt") gedeckt; Marker-State ist per
Vorgabe frei wählbar (UI-State gewählt).
