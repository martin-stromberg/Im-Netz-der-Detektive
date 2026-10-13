# Umsetzungsplan: Detektiv-Perspektive (Schritt 10)

## Übersicht

Neue `DetektivScreen`-Komponente (DetektiveUI) mit KI-Ganove-Treiber,
Erweiterung der geteilten `MapGraph`-Komponente um detektivseitige Render-Props
(Kameras, Kategorien/Zonen, aktiver Detektiv, Marker-Pins, Positions-Overlay)
sowie ein minimaler temporärer Modus-Switcher in `App.tsx`. Die Rundenmaschine
bleibt vollständig in `useGameStore`; Deduktion läuft ausschließlich über
`deducePossiblePositions`.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| KI-Ganove-Anbindung | Store-Subscription (`installGanoveDriver`) exakt nach Muster `installDetectiveDriver`; Züge via `buildGanoveView` + `aiRng(seed, round, 0)` | Gleiche Draws wie `runAiGame` — bit-identische Deterministik, kein UI-Threading-Code |
| Marker/Kommentare | UI-State im `DetektivScreen` (`Map<nodeId, comment>`) | Detektivseitiger Notiz-State gehört nicht ins Eventlog/den Replay-Pfad; bleibt über Runden erhalten, Reset bei Neustart |
| Asymmetrie | Nur `visibleEvents(…,"detectives")`, `visibleCameras(…,"detectives")`, `getMissionStructure()`; `ganovePosition`/`mission.targets` werden nie an `MapGraph` gereicht | Konstruktive No-Leak-Garantie analog GanoveScreen |
| Kategorien/Zonen auf Karte | Opt-in-Props `showCategories` (Badge-Formen wie Missions-Glyphs) + `showZones` (farbiger Halo-Ring je Zone + Legende) | Farbe+Form: Kategorien als Glyph-Formen, Zonen als Halo + benannte Legende; GanoveScreen unverändert (Props defaulten aus) |
| Missionsstruktur-Anzeige | Neue kleine `MissionStructurePanel`-Sektion im Screen (Statusliste + Pool-Größen je Kategorie) | `MissionPanel` zeigt gezogene Zielknoten — nicht wiederverwendbar ohne Leak; Statusmuster ✓/▶/○ wird übernommen |
| Moduswahl | `?mode=detektiv\|ganove` URL-Param + Zwei-Buttons-Auswahl ohne Param | Minimaler Switcher; Schritt 11 ersetzt ihn durchs Menü |
| Startaufstellung | `mode:"random"` → sofort `pickDetectiveSpawns` + `startGame`; `choice`/`free` → sequentielle Auswahl D1→Dn aus `detectiveSpawnChoices`; Ganove-Start nie gesetzt (verdeckte Ziehung im Store) | Kartengesteuert je `spawnRules.detectives.mode` |

## Programmabläufe

### Spielstart (Detektiv-Perspektive)

1. `App` rendert bei `?mode=detektiv` (oder Auswahl-Button) `DetektivScreen`.
2. `DetektivScreen` (idle) → Klick „Neue Partie": `loadMap`, Seed
   (`?seed=`/`Date.now`), Mission (`?mission=`, Default `random` → Fallback
   `auto` wie GanoveScreen).
3. `spawnRules.detectives.mode === "random"`: `pickDetectiveSpawns` +
   `startGame(map, seed, {detectivePositions, mission})` — keine Auswahl-Ansicht.
4. Sonst: Auswahl-Ansicht — `MapGraph` mit `selectableNodeIds` =
   `detectiveSpawnChoices` (choice: Liste; free: alle Knoten); jeder Pick hängt
   an `picks` an; nach `detectiveCount`-Picks `startGame` mit den Positionen.
5. `useEffect` installiert `installGanoveDriver` — nach `startGame` (Phase
   `ganove`) zieht der KI-Ganove sofort synchron, Phase wechselt zu `detektive`.

### Spielzug-Fluss

1. Phase `detektive`: `getLegalDetectiveMoves()` für `activeDetectiveIndex` →
   `legalTargets` auf der Karte; Klick/Enter → `moveDetective` (Fangprüfung
   im Store). Hinweistext nennt den aktiven Detektiv.
2. Nach dem letzten Detektiv: Store wechselt zu `ganove` (+`round`) →
   Subscription feuert → `driveGanovePhase`: `pendingChoice` →
   `chooseMissionPath(chooseSabotagePath(view))`; `shouldUseRadio` →
   `useRadio`; sonst `chooseGanoveTurn` → `moveGanove`/`ganoveAction` —
   synchron bis Phase `detektive` oder `outcome`.
3. `umwelt`-Sperren erscheinen in Chronik und als Sperr-Glyphs auf der Karte.

### Deduktions-Werkzeuge

- **Chronik:** `visibleEvents(events, "detectives")` chronologisch —
  je Eintrag Runde + Typ-Label + Ort/Zone; `umwelt` mit Kanten-Endpunkten
  und `untilRound`. Keine `ganove`-Events möglich (Datenebene).
- **Overlay:** Checkbox schaltet `possibleNodeIds` =
  `deducePossiblePositions({map, detectiveStarts: detectiveStartsFromLog(log),
  events: visibleEvents(…,"detectives"), cameras: visibleCameras(…,"detectives"),
  round, detectivePositions})`; Anzeige der Trefferzahl.
- **Marker:** Marker-Modus-Toggle → alle Knoten selektierbar, Klick togglet
  Pin; Markerliste mit Kommentar-Eingabe je Knoten + Entfernen.

### Endzustände

`outcome` → Endpanel mit detektivseitigen Texten (caught/surrounded = Sieg,
escaped/timeout = …, draw) + „Neue Partie" (Reset → idle).

## Neue Klassen/Komponenten

| Datei | Typ | Zweck |
|-------|-----|-------|
| `src/components/DetektivScreen.tsx` | React-Komponente | DetektiveUI: idle → pickSpawns → playing/outcome |
| `src/components/DetektivScreen.module.css` | CSS-Modul | Noir-Theme analog GanoveScreen |
| `src/state/ganoveDriver.ts` | Modul | `driveGanovePhase`, `installGanoveDriver` |
| `src/components/DetektivScreen.test.tsx` | Test | jsdom-Tests (Setup, Züge, Werkzeuge, Asymmetrie, Overlay-Exaktheit) |
| `src/state/ganoveDriver.test.ts` | Test | Treiber: no-op, pendingChoice, Radio, Zugfolge, Determinismus |
| `e2e/detektiv.spec.ts` | E2E-Test | Benutzerflüsse (s. unten) |

## Änderungen an bestehenden Komponenten

### `MapGraph` (`src/components/MapGraph.tsx` + `.module.css`)

- **Neue optionale Props (alle mit Defaults, rückwärtskompatibel):**
  - `cameras?: readonly Camera[]` — Kamera-Glyph je Kameraknoten
    (`data-camera`, inaktiv: durchgestrichen — Formkodierung)
  - `showCategories?: boolean` — Kategorie-Badges je Knoten (`data-category`)
  - `showZones?: boolean` — Zonen-Halo-Kreis hinter Knoten (`data-zone`),
    deterministische Hue je Zonenindex
  - `activeDetectiveIndex?: number` — hebt den Marker des aktiven Detektivs
    hervor (`data-active-detective`)
  - `markedNodeIds?: readonly string[]` — Pin-Glyph (`data-marker`)
  - `possibleNodeIds?: readonly string[]` — Overlay-Ring (`data-possible`)
  - `zoneNames?: readonly string[]` — nicht nötig (Zones aus `map.nodes`)

### `App.tsx`

- Rendert Modus-Auswahl (`mode.title` + zwei Buttons `mode.ganove`/
  `mode.detektiv`) wenn kein `?mode=`-Param; sonst direkt den Screen.
  Auswahl via `useState` (kein Routing nötig).

### `src/i18n/de.json` + `src/i18n/en.json`

Neue Schlüssel (paritätisch): `mode.*`, `detektiv.setup.*`, `detektiv.phase.*`,
`detektiv.hint.*`, `tools.*`, `markers.*`, `chronicle.*`, `structure.*`,
`category.*`, `legend.camera|marker|possible|zone|category`,
`detektiv.outcome.*`, `marker.node`, `node.mark`, `camera.ariaLabel`.

### `src/App.test.tsx`

Anpassung: ohne `?mode=` kommt die Auswahl; Ganove-Test wählt
„Als Ganove spielen" bzw. rendert mit gesetztem `mode`-Param —
`window.history.pushState` im Test für `?mode=ganove`.

## Datenbankmigrationen

Keine.

## Validierungsregeln

| Feld | Regel | Fehlerfall |
|------|-------|------------|
| Detektiv-Startpicks | jeder Pick ∈ `detectiveSpawnChoices`; Duplikate erlaubt (Pool-Regeln des Stores) | `SpawnError` → `notice` via `runGuarded` |
| Marker-Kommentar | Freitext, keine Validierung | – |
| `?mode=` | nur `ganove`/`detektiv`; sonst Auswahl | – |

## Konfigurationsänderungen

Keine (URL-Parameter `?mode=` als Dev-/Test-Schalter dokumentiert).

## Seiteneffekte und Risiken

- **MapGraph-Regression (GanoveScreen):** neue Props defaulten alle auf
  „nicht rendern" — Ganove-Ansicht bleibt bit-identisch; `data-camera` darf
  dort nie erscheinen (E2E prüft das bereits).
- **`App.test.tsx`:** bricht ohne Anpassung (erwartet direkten GanoveScreen).
- **`ganoveDriver` in alten Tests:** wird nur via `installGanoveDriver` im
  `DetektivScreen` aktiviert — bestehende Tests unbeeinflusst.
- **`missionChoice` vs. Detektivphase:** `pendingChoice` entsteht während
  Phase `detektive`; Treiber beantwortet es sofort (Reihenfolge wie
  `runAiGame`), blockiert keine Detektivzüge.

## Umsetzungsreihenfolge

1. **`src/state/ganoveDriver.ts`** — Voraussetzungen: `GanoveAI`,
   `AiSimulation.buildGanoveView/aiRng` (vorhanden).
2. **`MapGraph`-Erweiterung** — Voraussetzung: keine.
3. **i18n-Schlüssel de/en** — Voraussetzung: finale Textliste aus 4.
4. **`DetektivScreen` + CSS** — Voraussetzung: 1–3.
5. **`App.tsx` Modus-Switcher** — Voraussetzung: 4.
6. **jsdom-Tests** (`ganoveDriver.test.ts`, `DetektivScreen.test.tsx`,
   `App.test.tsx`-Anpassung, `MapGraph.test.tsx`-Erweiterung) — Voraussetzung: 1–5.
7. **`e2e/detektiv.spec.ts`** — Voraussetzung: 1–5; lauffähig via `npm run dev`.

## Tests

### Neue Tests

| Test | Datei | Was wird geprüft |
|------|-------|------------------|
| `driveGanovePhase` no-op außerhalb Ganove-Phase / bei outcome | `ganoveDriver.test.ts` | State unverändert |
| Ganove-Zug, Radio, `pendingChoice`-Antwort, Determinismus (gleiche Seeds → gleiche Züge wie `runAiGame`) | `ganoveDriver.test.ts` | Treiber-Verhalten |
| Setup-Flow: choice-Auswahl D1→Dn, random-Auto, Start ohne `ganovePosition` | `DetektivScreen.test.tsx` | `data-view`-Wechsel, Store-State |
| Spielzug: legalTargets = `getLegalDetectiveMoves`, Klick → `moveDetective`, aktiver Detektiv wechselt | `DetektivScreen.test.tsx` | DOM + Store |
| Chronik listet nur detectives/both-Events mit Runde+Ort/Zone | `DetektivScreen.test.tsx` | `data-hint-event`-Einträge |
| Overlay exakt = `deducePossiblePositions`-Menge | `DetektivScreen.test.tsx` | `[data-possible]`-IDs === Engine-Set |
| Marker: setzen/togglen, kommentieren, über Runden erhalten | `DetektivScreen.test.tsx` | `data-marker`, Input-Wert |
| Asymmetrie: nie `ganovePosition`-Marker, nie `mission.targets`-Badges, Kameras sichtbar | `DetektivScreen.test.tsx` | `[data-ganove]`/`[data-mission-target]` = 0 |
| Missionsstruktur ohne Zielknoten | `DetektivScreen.test.tsx` | Statusliste, keine Target-IDs im DOM |
| MapGraph neue Props (Kamera-Glyph, Kategorien, Zonen, aktiv, Marker, Overlay) | `MapGraph.test.tsx` | Attribute/Glyphs |
| App-Modusauswahl | `App.test.tsx` | Auswahl + `?mode=` |

### Betroffene bestehende Tests

| Test | Grund |
|------|-------|
| `src/App.test.tsx` | App zeigt jetzt Modus-Auswahl statt direkt GanoveScreen |

### E2E-Tests (primärer Funktionsnachweis)

| Priorität | Szenario | Datei | Akzeptanzkriterium | Warum E2E |
|-----------|----------|-------|--------------------|-----------|
| Pflicht | Setup: Detektive sequentiell wählen (choice), KI-Ganove-Start nie sichtbar | `e2e/detektiv.spec.ts` | Startaufstellung wählbar, Ganove-Start verborgen | Benutzerfluss Auswahl→Spiel |
| Pflicht | Komplette Partie bis `outcome` (Klicks je Detektivzug; KI-Ganove fährt automatisch) | `e2e/detektiv.spec.ts` | Partie Start→Ende durchspielbar | Voller Benutzerfluss |
| Pflicht | Chronik wächst mit Hinweisen (Typ+Ort/Zone+Runde sichtbar) | `e2e/detektiv.spec.ts` | Chronik vollständig/chronologisch | Sichtbares Ergebnis |
| Pflicht | Overlay zeigt `[data-possible]`-Menge (gegen `deducePossiblePositions` im Test verglichen) | `e2e/detektiv.spec.ts` | Overlay = Engine-Menge | Funktionsnachweis Deduktion |
| Pflicht | Marker setzen + kommentieren + über Runden erhalten | `e2e/detektiv.spec.ts` | Marker-Werkzeug | Benutzerfluss Marker |
| Pflicht | Asymmetrie: nie `[data-ganove]`, nie `[data-mission-target]`, Kameras sichtbar | `e2e/detektiv.spec.ts` | Kein Ganove/keine Zielknoten | Sichtbarkeitsregeln |
| Pflicht | Tastatur: Tab+Enter auf legalem Ziel führt Zug aus | `e2e/detektiv.spec.ts` | Tastaturbedienbarkeit | Accessibility |

Bestehende E2E-Tests: `e2e/ganove.spec.ts` muss unverändert grün bleiben —
`?mode=ganove`-Param sichern oder Default beibehalten. **Achtung:** ohne
`mode`-Param zeigt App jetzt die Auswahl — `ganove.spec.ts` navigiert zu
`/?map=…`; entweder Spec um `&mode=ganove` ergänzen oder App ohne Param
beim bisherigen Default (Ganove) belassen und Auswahl nur über Button
erreichbar machen. **Entscheidung:** `ganove.spec.ts` um `&mode=ganove`
ergänzen ist sauberer — Auswahl bleibt der param-lose Einstieg; die 4
`page.goto`-Aufrufe bekommen den Param angehängt.

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `e2e/ganove.spec.ts` (4 `page.goto`) | `?mode=ganove` anhängen — param-lose URL zeigt Moduswahl |

## Offene Punkte

Keine.
