# Umsetzungsplan: Informationssystem (Schritt 5)

## Übersicht

Die Informationsschicht (`01-spielkonzept.md` §4) wird als reine
Logikmodule unter `src/logic/` gebaut und in `src/state/gameStore.ts`
an den vorgesehenen Einschubstellen verdrahtet: Kameraplatzierung +
Kameraauslösung, drei Ereignis-Auslösemodi mit drei Ereignistypen,
Asymmetrie-Sichten, Polizeifunk und Hitze-Indikator.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Timeline-Stelle der Info-Checks | In `moveGanove` und `ganoveAction` **nach** Flucht-/Endprüfung und **vor** `phase: "detektive"` | `01-spielkonzept.md` §3.1: „Kamera-, Ereignis- und Hinweisprüfung laufen intern sofort ab"; neue Hinweise liegen damit vor den Detektivzügen derselben Runde vor. Bei `escaped`/`caught` läuft nichts mehr (Partie vorbei). |
| RNG für Rundenereignisse | Pro Runde abgeleitet: `createRng(mixSeed(seed, round))` aus `rng.ts` | Store bleibt serialisierbar (SaveGame, OT-34); gleiche Seed+Runde → gleiche Ereignisse; kein `Math.random`. Kameraplatzierung nutzt dagegen den Spawn-RNG-Strom in `startGame` (Seed-Deterministik wie bisher). |
| Modulaufteilung | `CameraSystem.ts` (Platzierung+Auslösung), `EreignisEngine.ts` (Modi, Typzug, Ereignisproduktion inkl. sicherer Kantenwahl), `InformationSystem.ts` (Sichtbarkeitsfilter, Polizeifunk, Hitze) | Spiegelt `02-technisches-konzept.md` §5 (`CameraSystem`, `EreignisEngine`) und trennt „Erzeugung" von „Verteilung". |
| Zonen-Hinweisregion | `GameEvent` trägt `zone` = Zone des aktuellen Ganove-Knotens („im Bereich X") **und** `nodeIds` = BFS-Ball um die tatsächliche Position im Radius `hintZoneRadius` | Deckt beide Anforderungsformulierungen ab: zonenbasierte Anzeige + exakt prüfbare Region; Deduktions-Werkzeug kann die Region direkt nutzen. Kein RNG nötig. |
| Umwelt-Kantenwahl | `rng.shuffle` über alle Kanten; erste Kandidatin, die (a) nicht bereits gesperrt ist und (b) den Restgraphen (Map-Kanten minus aktuell gesperrte) zusammenhängend lässt | Ein einziger Konnektivitäts-Check via BFS subsumiert „nie letzte freie Kante eines Knotens" und „keine Graph-Zerteilung". Findet sich keine Kandidatin, verfällt das Ereignis folgenlos (kein Event). |
| `sichtbarkeit`-Verfall | Event bleibt in `events` (Chronik), aber `revealedGanovePosition(events, round)` liefert den Knoten nur solange `event.round === round` | „Verfällt nach der Runde" ohne Datenverlust für Replay/Chronik. |
| Hitze-Modell | Reine Funktion `heatLevel(events, round)` → `{ level, score }`; zählt nur `kind`+`round`, kein Inhalt; Gewicht `aktion: 2` bereits eingebaut | Kein Info-Leak konstruktionsbedingt; Aktions-Spuren zählen automatisch, sobald Schritt 6 sie emittiert. |
| Asymmetrie datenseitig | `visibleTo` wird um `"ganove"` erweitert; Filter-Funktionen `visibleEvents(events, side)` / `visibleCameras(cameras, side)` liefern pro Seite nur Erlaubtes | Anforderung „nicht erst in der Anzeige": die Ganovensicht ist eine eigenständige, testbare Funktion, die strukturell keine Kameras/Hinweise enthält. |
| `cameraCount`/`edgeBlockRounds`/`radioHintCount` Overrides | `StartGameOptions`-Erweiterung mit Bereichsvalidierung wie `roundLimit` (`GameConfigError`) | Menü-Overrides sind spezifiziert (OT-26); die Validierungsinfrastruktur existiert schon. |
| `kind`-Wertemenge | Neuer Union-Typ `GameEventKind`: `"camera" \| "sichtbarkeit" \| "hinweis" \| "umwelt" \| "aktion" \| "polizeifunk"` | „aktion" ist der zukünftige Aktions-Spur-Typ (Schritt 6) und muss schon für die Hitze-Gewichtung existieren. |

## Programmabläufe

### Spielstart mit Kameras

1. `startGame` erzeugt `createRng(seed)` und reicht ihn an
   `resolveSpawnPositions` weiter (Signatur intern geändert — gleiche
   Zugreihenfolge wie bisher).
2. Anschließend `placeCameras(graph, rng, count, minGap, protectedIds)`:
   `rng.shuffle` über die Kandidaten (alle Knoten minus
   `cameraProtectedNodes`); ein Knoten wird nur gewählt, wenn seine
   BFS-Distanz zu jeder bereits gesetzten Kamera `>= cameraMinGap` ist.
   Ergebnis: bis zu `count` Kameras (weniger, wenn die Karte nicht mehr
   zulässt) → `cameras` im State (`active: true`), im Header-Log als
   `cameras`-Feld (Replay-Rekonstruktion, Eventlog-Format §8).

### Ganovenzug mit Informationsschicht (`moveGanove`)

1. `validateGanoveMove` → Position setzen → `move`-Logeintrag
   (bestehend).
2. `escapeNodeIds`-Prüfung → ggf. `finish("escaped")` (bestehend; danach
   keine Info-Checks mehr).
3. Kameraprüfung: `triggeredCamera(cameras, ganovePosition)` — aktive
   Kamera auf dem Zielknoten → `addEvent({kind:"camera", round,
   nodeId, visibleTo:"detectives"})` + `hint`-Logeintrag.
4. Ereignis-Roll: `rollTrigger(mode, round, tensionValue, defaults, rng)`
   liefert `{ fires, tensionValue }` (`tension` akkumuliert nur im
   `tension`-Modus und resettet beim Auslösen). Bei `fires`:
   `drawEventType(mix, rng)` → je Typ ein `GameEvent` erzeugen:
   - `sichtbarkeit`: `{kind:"sichtbarkeit", round, nodeId:
     ganovePosition, visibleTo:"detectives"}`
   - `hinweis`: `{kind:"hinweis", round, zone: zoneOf(ganove), nodeIds:
     bfsBall, visibleTo:"detectives"}`
   - `umwelt`: `pickBlockableEdge(...)` → `blockEdge(a, b,
     untilRound = round + edgeBlockRounds - 1)` + `{kind:"umwelt",
     round, edge:{a,b}, untilRound, visibleTo:"both"}`; ohne Kandidatin
     kein Event.
   Jede Auslösung erzeugt zusätzlich einen `hint`- bzw.
   `event`-Logeintrag.
5. `phase: "detektive"`, `activeDetectiveIndex: 0` (bestehend).

### Aktionsrunde (`ganoveAction`)

Wie bisher, plus Schritt 4 (Ereignis-Roll). Keine Kameraprüfung — der
Ganove betritt keinen neuen Knoten (Betreten ≠ Verharren).

### Polizeifunk (`useRadio`)

1. Laufende Partie erforderlich (`requireRunningGame`), `radioUsed ===
   false` — sonst `MoveError("already_used")` (neuer `MoveRejection`-
   Wert).
2. `radioHintSummary(events, radioHintCount)` liefert die letzten N
   Ereignisse mit hinweisgebendem `kind` (`camera`, `sichtbarkeit`,
   `hinweis`, `aktion`) als `{kind, round, nodeId?, zone?}` — incl.
   Kameratreffer, ohne unentdeckte Kameras und ohne `umwelt`.
3. `radioUsed: true`; `addEvent({kind:"polizeifunk", round,
   visibleTo:"ganove", details:{hints}})` + `radio`-Logeintrag.

### Hitze-Indikator

`getHeatLevel()` → `heatLevel(events, round)`: Summe der Gewichte aller
Events deren `round >= round - 2` (3-Runden-Fenster inkl. laufender
Runde): `hinweis` 1, `camera` 2, `aktion` 2, `sichtbarkeit` 3; sonst 0.
Level: 0 `ruhig`, 1–2 `aktiv`, 3–4 `erhoeht`, ≥5 `kritisch`.

### Asymmetrie-Sichten

- `visibleEvents(events, "detectives")`: `visibleTo` ∈ {detectives, both}
- `visibleEvents(events, "ganove")`: `visibleTo` ∈ {ganove, both}
- `visibleCameras(cameras, "detectives")`: alle; `…, "ganove"`: `[]`
  (Ausnahme Polizeifunk — der transportiert ausgelöste Kameras als
  Hinweisdaten im `polizeifunk`-Event, nicht als Kameraobjekte).

## Neue Klassen / Module

| Klasse | Typ | Zweck |
|--------|-----|-------|
| `src/logic/CameraSystem.ts` | Modul (reine Funktionen) | `placeCameras`, `triggeredCamera`, `deactivatedCameras` |
| `src/logic/EreignisEngine.ts` | Modul (reine Funktionen) | `rollTrigger`, `drawEventType`, `zoneHint`, `pickBlockableEdge`, `isConnected` (intern) |
| `src/logic/InformationSystem.ts` | Modul (reine Funktionen) | `visibleEvents`, `visibleCameras`, `radioHintSummary`, `heatLevel`, `revealedGanovePosition`, `HINT_EVENT_KINDS`, `HEAT_WEIGHTS` |
| `GameEventKind` | Typ-Union in `gameStore.ts` | `"camera" \| "sichtbarkeit" \| "hinweis" \| "umwelt" \| "aktion" \| "polizeifunk"` |
| `HeatLevel` | Typ-Union in `InformationSystem.ts` | `"ruhig" \| "aktiv" \| "erhoeht" \| "kritisch"` |
| `RadioHint` | Interface in `InformationSystem.ts` | `{kind, round, nodeId?, zone?}` |

## Änderungen an bestehenden Klassen

### `gameStore.ts` (State-Modul)

- **Geänderte Typen:** `GameEvent.kind` → `GameEventKind`;
  `GameEvent.visibleTo` → `"detectives" | "ganove" | "both"`; neue
  optionale Felder `edge?: {a: string; b: string}`,
  `untilRound?: number`, `nodeIds?: string[]`,
  `details?: Record<string, unknown>`.
- **Neue State-Felder:** `radioUsed: boolean` (init `false`),
  `radioHintCount: number`, `edgeBlockRounds: number` (beide aus
  `settings.*.suggested` bzw. Optionen).
- **Erweitert:** `StartGameOptions` um `cameraCount?: number`,
  `cameraProtectedNodes?: string[]`, `radioHintCount?: number`,
  `edgeBlockRounds?: number`; `resolveRangeSetting`-Helper
  (Verallgemeinerung von `resolveRoundLimit`) für die Bereichsprüfung.
- **Neue Actions:** `useRadio()`, `deactivateCameras()`,
  `getHeatLevel()`.
- **Geänderte Actions:** `startGame` (RNG-Strom weiterreichen,
  Kameraplatzierung, Header-Log mit `cameras`), `moveGanove`
  (Kameraprüfung + Ereignis-Roll vor Phasenwechsel), `ganoveAction`
  (Ereignis-Roll). Interne Hilfsfunktion `runEventRoll(rng)` im
  Store-Closure.

### `rng.ts`

- **Neue Funktion:** `mixSeed(seed, round): number` — deterministische
  Seed-Ableitung pro Runde (z. B. `(seed + Math.imul(round,
  0x9e3779b9)) >>> 0`).

## Datenbankmigrationen

Keine.

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `options.cameraCount` | Ganzzahl im Bereich `cameraCount.[min,max]` | `GameConfigError` |
| `options.cameraProtectedNodes` | Jede ID existiert auf der Karte | `GameConfigError` |
| `options.radioHintCount` / `edgeBlockRounds` | Ganzzahl im jeweiligen Bereich | `GameConfigError` |
| `useRadio` | Nur laufende Partie, `radioUsed === false` | `MoveError` (`no_game`/`game_over`/`already_used`) |

## Konfigurationsänderungen

Keine — alle Parameter stammen aus den Kartenpaket-`settings` (bereits
vorhanden und validiert).

## Seiteneffekte und Risiken

- **`resolveSpawnPositions`-Signatur:** interne Funktion, bekommt den
  RNG von außen — gleiche Zugfolge wie vorher, Tests bleiben grün.
- **Neue State-Felder:** der „documented initial state"-Test in
  `gameStore.test.ts` muss um `radioUsed`, `radioHintCount`,
  `edgeBlockRounds` ergänzt werden.
- **`startGame` auf `teststadt`:** `cameraCount.suggested = 8` bei 10
  Knoten und `cameraMinGap 2` ist nicht voll erfüllbar —
  `placeCameras` platziert bestmöglich (Invarianz bleibt: Abstand +
  Ausschlussliste); bestehende Tests prüfen `cameras` bisher nicht.
- **Log-Typen:** neue Einträge `"hint"`, `"event"`, `"radio"` — der
  freie `type`-String erlaubt das ohne Schemaänderung.

## Umsetzungsreihenfolge

1. **`rng.ts`: `mixSeed` hinzufügen**
   - Voraussetzungen: keine.
2. **`src/logic/CameraSystem.ts` anlegen**
   - Voraussetzungen: `Graph.ts`, `rng.ts`, `mapPack.ts` (vorhanden).
3. **`src/logic/EreignisEngine.ts` anlegen**
   - Voraussetzungen: `Graph.ts`, `rng.ts`, `mapPack.ts`, `Movement.ts`
     (`BlockedEdge`/`isEdgeBlocked`).
4. **`src/logic/InformationSystem.ts` anlegen**
   - Voraussetzungen: `GameEvent`-Typ (wird in Schritt 5 erweitert —
     Datei importiert ihn aus `gameStore`; Alternativ: Typen in
     `InformationSystem.ts` definieren und im Store importieren.
     **Entscheidung:** `GameEvent`, `GameEventKind`, `Camera` werden in
     `InformationSystem.ts` definiert und in `gameStore.ts`
     importiert/re-exportiert — kein Zirkelimport, da
     `InformationSystem` den Store nicht kennt).
5. **`gameStore.ts` erweitern** (Typen, Felder, Optionen, Actions,
   Info-Checks in `moveGanove`/`ganoveAction`/`startGame`)
   - Voraussetzungen: Schritte 1–4.
6. **Tests schreiben** (siehe unten)
   - Voraussetzungen: Schritte 2–5.
7. **QS-Lauf:** `npm run build && npm test && npm run coverage &&
   npm run lint`
   - Voraussetzungen: Schritt 6.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `placeCameras`-Suite | `CameraSystem.test.ts` | Mindestabstand über ~50 Seeds (muenster+teststadt), Ausschlussliste, Best-Effort-Platzierung, Deterministik gleicher Seed |
| `triggeredCamera`/`deactivatedCameras` | `CameraSystem.test.ts` | Auslösung nur aktive Kamera am Zielknoten; `deactivateAll`-Pfad |
| `rollTrigger`-Suite | `EreignisEngine.test.ts` | `cycle`: exakt `round % X === 0`; `chance`: über 2000 Runden in Toleranz ±5 %; `tension`: exakt alle `ceil(threshold/perRound)` Runden + Reset |
| `drawEventType`-Suite | `EreignisEngine.test.ts` | Verteilung nähert `eventMix` über viele Züge (Toleranz); Deterministik |
| `zoneHint`-Suite | `EreignisEngine.test.ts` | `zone` = Zone des Ganove-Knotens; `nodeIds` = exakt der BFS-Ball im Radius |
| `pickBlockableEdge`-Suite | `EreignisEngine.test.ts` | Über alle Seeds/Karten: nie bereits gesperrte Kante, Restgraph bleibt zusammenhängend (kein isolierter Knoten, keine Zerteilung); `null` bei unlösbarer Karte |
| `heatLevel`-Suite | `InformationSystem.test.ts` | Exakte Gewichtungstabelle + 3-Runden-Fenster-Grenzen (ältere Runden zählen nicht); `aktion`-Gewicht vorhanden |
| `visibleEvents`/`visibleCameras`-Suite | `InformationSystem.test.ts` | Ganovensicht: keine Kameras, keine hinweisgebenden Events (`camera`/`hinweis`/`sichtbarkeit`), nur `both`/`ganove` |
| `radioHintSummary`-Suite | `InformationSystem.test.ts` | Letzte N Hinweise mit Typ+Runde, enthält Kameratreffer, kein `umwelt`, keine Zukunft |
| `revealedGanovePosition`-Suite | `InformationSystem.test.ts` | Nur in der Auslöserunde live, danach `null` |
| Store-Integration | `gameStore.info.test.ts` | `startGame` platziert Kameras (Abstand/Ausschluss/Deterministik); `moveGanove` auf Kamera → Detektiv-Hinweis mit Knoten+Runde; Ereigniskadenz im `tension`-Modus über mehrere Runden; `hinweis`-Events nur `detectives`; `umwelt` blockiert für `edgeBlockRounds` Runden und ist `both`-sichtbar; `useRadio` einmalig + Inhalt; `deactivateCameras`; `getHeatLevel`; Ganovensicht-Asymmetrie über eine gespielte Partie |
| Initial-State-Ergänzung | `gameStore.test.ts` | `radioUsed`, `radioHintCount`, `edgeBlockRounds` |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `gameStore.test.ts` „starts with the documented initial state" | Neue State-Felder |
| ggf. `startGame`-Tests | `cameras` jetzt befüllt — bestehende Assertions bleiben gültig, keine Änderung erwartet |

### E2E-Tests (primärer Funktionsnachweis)

Die Anforderung betrifft ausschließlich die headless Engine — es gibt
keinen UI-Benutzerfluss (die App-Shell zeigt weiterhin nur den
Platzhalter; UI für Kameras/Hinweise/Hitze kommt in späteren
Entwicklungsschritten). Store-Integrationstests über
`useGameStore.getState()` decken den kompletten Ablauf Spielzug →
Hinweis → Sicht ab und sind der vollständige Funktionsnachweis.

## Offene Punkte

Keine.
