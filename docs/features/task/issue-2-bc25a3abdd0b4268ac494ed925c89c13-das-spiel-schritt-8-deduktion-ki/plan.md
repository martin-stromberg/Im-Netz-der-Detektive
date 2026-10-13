# Umsetzungsplan: Deduktion & KI (Schritt 8)

## Übersicht

Drei neue Logikmodule unter `src/logic/` — `Deduction.ts` (Menge aller
mit den Hinweisen konsistenten Ganoven-Positionen), `DetectiveAI.ts`
(Truppensteuerung aller Detektive) und `GanoveAI.ts` (Missionsverfolgung
mit Aktions-Timing, Polizeifunk, Sabotage-Binärwahl) — plus ein headless
KI-vs.-KI-Treiber `AiSimulation.ts` und ein CLI-Batchskript
`scripts/sim.ts` (`npm run sim`). Kleinere Erweiterung an `Movement.ts`
(blockungsbewusste BFS-Distanzen, von Deduktion und beiden KIs geteilt).
Keine UI-Änderungen, keine Änderungen am Store-Verhalten.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| Deduktions-Modell | Vorwärtsfilterung über Rundensets: `S(0)` = Spawn-Prior; `S(r)` = ein legaler Ganoven-Schritt (ungesperrte Kante; Verharren nur in `aktion`-Runden) von `S(r-1)`, geschnitten mit den Constraints aller detektivsichtbaren Events der Runde r | Reine Funktion über `(map, events, cameras, detectiveStarts, round)` — liefert exakt die Menge der Positionen, zu denen ein konsistenter Positionsverlauf existiert; vergangene Hinweise beschränken spätere Runden über die Übergangskette (Maximalreichweite); identisch für UI-Overlay und KI nutzbar |
| Negativ-Constraint Kameras | In Runden ohne `camera`- und ohne `aktion`-Event liegt die wahre Position nicht auf einer aktiven Kamera (Betreten löst deterministisch aus) | Zulässige detektivseitige Schlussfolgerung (Kameras sind detektivseitig bekannt); verstärkt die Eingrenzung messbar |
| Info-Trennung KIs | Dedizierte View-Objekte `DetectiveView`/`GanoveView` werden vom Aufrufer (Treiber/Store-Adapter) aus `visibleEvents`/`visibleCameras`/`missionStructure` gebaut; die KI-Module erhalten keinen Store und kein `Mission`-Objekt mit `targets` (DetectiveView enthält nur `MissionStructureStep[]`) | Struktureller Leck-Schutz: verbotene Informationen (Ganovenposition, gezogene Zielknoten) sind im Typ der Detektiv-KI nicht vorhanden |
| Detektiv-KI-Heuristik | Pro aktivem Detektiv: Zugwahl über Minimierung von `Σ_{b∈B} dist(nächsterDetektiv→b)` (Einkreisung/Abdeckung der Belief-Menge B aus `Deduction`), Tiebreak über Nähe zum letzten Hinweisort, dann BFS-Distanz, dann `Rng.pick` auf der Bestmenge | Decken statt Hinterherlaufen entsteht aus der Summenmetrik; deterministisch via injiziertem `Rng` |
| Ganove-KI-Heuristik | BFS-Routing zum aktuellen Missionsziel (blockungsbewusst); Zielknoten werden gefiltert: kein Landen auf Knoten in Distanz ≤1 eines Detektivs (Fang droht sofort), solange Alternativen existieren; Aktion nur wenn min. Detektivdistanz ≥2 und Hitze ≠ `kritisch` (Deadline-Ausnahme bei knappem Restbudget); Radio einmalig bei Hitze ≥ `erhoeht`; Sabotage annehmen, wenn Umweg ≤ `missionRules.sabotageDetour` und Hitze ≠ `kritisch` | Erfüllt die geforderten Teilheuristiken mit minimaler, deterministischer Regelmenge |
| Sim-Ausführung | `scripts/sim.ts` wird via `vite build --ssr` (eigene `vite.sim.config.ts`, `dist-sim/`) zu einem Node-ESM-Bundle gebaut und ausgeführt | `MapLoader`/`MissionLoader` nutzen `import.meta.glob` — läuft nicht unter plain `node`; Vite-SSR-Build ist mit vorhandenen Dependencies offline lauffähig (verifiziert) |
| Treiber-Ort | `src/logic/AiSimulation.ts` — treibt `useGameStore` über `getState()`/`resetGame()` | Store ist ausdrücklich headless-fähig; Logik→State-Import nur für dieses Dev-Modul (Recorder importiert bereits Typen aus dem Store) |
| Batch-Statistik | Aggregation ausschließlich aus den JSONL-Logeinträgen (`result`, `hint`, `sabotage_offer` mit `chosen`, `radio`) | Schritt 14 (Balancing-Kalibrierung) kann dieselbe Aggregation direkt auf geschriebene Logdateien anwenden |

## Programmabläufe

### Deduktion: mögliche Positionen berechnen

1. `deducePossiblePositions(map, events, cameras, detectiveStarts, round)`:
   - `S(0)` = `ganoveSpawnChoices(map, detectiveStarts)` (öffentliche
     Spawn-Regeln + eigene Startpositionen).
   - Für t = 1..round: Übergang `S(t)` = Knoten mit Vorgänger in `S(t-1)`
     über eine in t ungesperrte Kante (`umwelt`-Events mit
     `round < t && untilRound >= t` schränken ein — die in t erzeugte
     Sperre gilt erst ab t für Detektive, nicht für den Ganovenzug in t).
     Enthält t ein `aktion`-Event, ist `S(t)` stattdessen `S(t-1)` ∩
     {Aktionsknoten} (Verharren). Anschließend Schnitt mit den
     Constraints der Runde t: `camera`/`sichtbarkeit`/`aktion` →
     `{nodeId}`, `hinweis` → `nodeIds`, Negativ-Kamera (kein
     `camera`-Event in t und Move-Runde → keine aktive Kamera).
2. Ergebnis: sortierte Knotenliste (leere Menge bei verfälschter Spur
   möglich — dokumentiert).

Beteiligte Klassen/Komponenten: `Deduction.ts`, `Graph.ts`,
`SpawnSystem.ts`, `Movement.ts` (`isEdgeBlocked`), `InformationSystem.ts` (Typen).

### Detektiv-KI: Zug für den aktiven Detektiv wählen

1. `buildDetectiveView(state, detectiveStarts)` (im Treiber): filtert
   `visibleEvents(events, "detectives")`, `visibleCameras`,
   `missionStructure`, `blockedEdges`, `detektivePositions`, `round`.
2. `chooseDetectiveMove(view, detectiveIndex, legalMoves, rng)`:
   - `B` = `deducePossiblePositions(...)`; leer → Fallback `B` =
     `nodeIds` des jüngsten `hinweis`/letzten Orts-Events, sonst alle
     Knoten der Karte.
   - Bewerte jedes `legalMoves`-Ziel m: `coverage(m)` = Summe über
     `b∈B` der minimalen blockungsbewussten Distanz aller
     Detektivpositionen (mit m für den aktiven) zu b; Tiebreaks:
     Distanz m→letzter Hinweisort, minimale Distanz m→B, Knoten-id.
   - `rng.pick` über die Bestmenge; Treiber ruft `moveDetective`.

Beteiligte: `DetectiveAI.ts`, `Deduction.ts`, `Movement.ts`, `rng.ts`.

### Ganove-KI: Ganovenphase spielen

1. `buildGanoveView(state)` (Treiber): volle `mission`,
   `ganovePosition`, `detektivePositions`, `visibleEvents(events, "ganove")`,
   `blockedEdges`, `getHeatLevel()`, `getLegalGanoveMoves()`,
   `getMissionAction()`, `escapeNodeIds`, `roundLimit`.
2. `chooseSabotagePath(view, rng)` → `"sabotage" | "flucht"`: Umweg
   `dist(kontakt→sabotage)+dist(sabotage→flucht)−dist(kontakt→flucht)` ≤
   `missionRules.sabotageDetour` und Hitze ≠ `kritisch` → sabotage.
3. `shouldUseRadio(view)` → `!radioUsed && heat.score >= 3` (ab `erhoeht`).
4. `chooseGanoveTurn(view, rng)`:
   - `missionAction` vorhanden und sicher (minDetDist ≥ 2, Hitze ≠
     `kritisch`, oder Restrunden ≤ Restarbeit) → `{type:"action"}`.
   - Sonst Zug: Zielknoten je `stage` (`diebstahl`/`kontakt`/`sabotage`/
     `flucht`; ohne Mission nächster `escapeNodeIds`-Knoten);
     `legalMoves` nach (Detektiv-Distanz ≤1 vermeiden, Distanz zum Ziel,
     bekannte ausgelöste Kameras meiden, `rng.pick` auf Bestmenge).

Beteiligte: `GanoveAI.ts`, `Graph.ts`, `Movement.ts`, `MissionSystem.ts`,
`InformationSystem.ts`, `rng.ts`.

### KI-vs.-KI-Partie und Batch

1. `runAiGame(map, seed, options)`:
   `resetGame()` → `startGame(map, seed, options.startOptions)` →
   Schleife bis `outcome !== null`: Ganovenphase — pendingChoice via
   `chooseMissionPath`, einmalig `useRadio`, dann `ganoveAction` oder
   `moveGanove`; Detektivphase — je aktivem Index `moveDetective`.
   Safety-Cap `maxRounds` (Default `roundLimit ?? 120`) → `abortAsDraw()`.
   Rückgabe: `{seed, outcome, rounds, log, hintsTotal, camerasTriggered,
   sabotageOffered, sabotageAccepted, radioUsed}`.
2. `runAiBatch(map, seeds, options)` → `SimGameResult[]`.
3. `summarizeBatch(results)` → Outcome-Verteilung, Ø/Min/Max Runden,
   Ø Hinweise, Ø Kameratreffer, Sabotage-Annahmequote, Radio-Quote.
4. `scripts/sim.ts`: CLI `--map` (Default `muenster`), `--games`/`--seed-start`
   bzw. `--seeds a-b`, `--out <dir>` (Default: keine Logdateien, nur
   stdout-Summary; mit `--out` je Partie eine `*.jsonl`-Datei).
   `package.json`: `"sim": "vite build --config vite.sim.config.ts && node dist-sim/sim.mjs"`.

Beteiligte: `AiSimulation.ts`, `useGameStore`, `DetectiveAI.ts`,
`GanoveAI.ts`, `Recorder.ts` (`serializeLog`), `scripts/sim.ts`,
`vite.sim.config.ts`, `package.json`.

## Neue Klassen / Dateien

| Datei | Typ | Zweck |
|-------|-----|-------|
| `src/logic/Deduction.ts` | Modul (reine Funktionen) | `deducePossiblePositions`, `DeductionInput`, `lastHintAnchor` |
| `src/logic/DetectiveAI.ts` | Modul | `DetectiveView`, `chooseDetectiveMove` |
| `src/logic/GanoveAI.ts` | Modul | `GanoveView`, `GanoveTurn`, `chooseGanoveTurn`, `chooseSabotagePath`, `shouldUseRadio` |
| `src/logic/AiSimulation.ts` | Modul | `runAiGame`, `runAiBatch`, `summarizeBatch`, `SimGameResult`, `BatchSummary`, `buildDetectiveView`, `buildGanoveView` |
| `scripts/sim.ts` | CLI-Entry | Argument-Parsing, Kartenwahl, Batchlauf, Log-Dateien, stdout-Summary |
| `vite.sim.config.ts` | Build-Konfiguration | SSR-Bundle `dist-sim/sim.mjs` für `npm run sim` |
| `src/logic/Deduction.test.ts` | Test | Deduktions-Korrektheit (skriptierte Szenarien) |
| `src/logic/DetectiveAI.test.ts` | Test | Zugwahl, Einkreisung, Info-Trennung |
| `src/logic/GanoveAI.test.ts` | Test | Routing, Aktions-Timing, Radio, Sabotage-Wahl |
| `src/logic/AiSimulation.test.ts` | Test | Batch-Läufe, Determinismus, Endbedingungen, Aggregation |
| `scripts/sim.test.mjs` | Test | CLI-Parsing + Batch-Run über die gebaute Logik |

## Änderungen an bestehenden Klassen

### `Movement.ts` (Modul)

- **Neue Funktion:** `bfsOpenDistances(graph, from, blockedEdges, round)` —
  wie `bfsDistances`, aber ohne in `round` gesperrte Kanten; genutzt von
  Deduktion (Übergänge) und beiden KIs (Routenwahl).
- **Neue Funktion:** `openNeighbors(ctx-ähnliche Parameter)` — nicht nötig,
  `legalMovesFrom` existiert bereits.

### `package.json`

- **Neues Script:** `"sim"` — SSR-Build + Node-Ausführung (siehe Ablauf 4).

### `.gitignore`

- **Neuer Eintrag:** `dist-sim/` (Sim-Build-Output).

## Datenbankmigrationen

Keine.

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `deducePossiblePositions`-Input | `round >= 0`; unbekannte Knoten in Events werden ignoriert | leere Menge bzw. `[]` bei leerem Graph |
| CLI-Argumente (`scripts/sim.ts`) | `--map` muss gebündelte Karte sein; `--games`/`--seed-start` positive Ganzzahlen | Exit 1 mit Fehlertext auf stderr |
| `chooseDetectiveMove`/`chooseGanoveTurn` | leere `legalMoves` | Fehler `MoveError`-analog (kann im regulären Spiel nicht auftreten: Zugzwang prüft der Store; defensiv `never`/`throw`) |

## Konfigurationsänderungen

| Eintrag | Typ | Standardwert | Zweck |
|---------|-----|--------------|-------|
| `DETECTIVE_*`/`GANOVE_*`-Konstanten in den KI-Modulen | Konstanten | siehe Heuristiken oben | Balancing-Parameter (Schritt 14) |
| `maxRounds` in `runAiGame` | Option | `roundLimit ?? 120` | Safety-Cap für unbegrenzte Partien → `draw` |

## Seiteneffekte und Risiken

- **`Movement.ts`:** neue additive Funktion — keine bestehende Signatur
  geändert, keine bestehenden Tests betroffen.
- **`vite.sim.config.ts`/`dist-sim/`:** zusätzlicher Build-Output,
  getrennt von `dist/`; `vite build` (App) unberührt.
- **`scripts/`:** eslint-Konfiguration deckt aktuell nur `*.mjs` in
  `scripts/` als Node-Globals ab — `scripts/sim.ts` läuft über das
  gebaute Bundle; Lint deckt TS-Datei unter `scripts/` über die
  allgemeinen TS-Regeln ab (keine Browser-Globals nötig — `process`
  etc. ggf. über `node:`-Imports oder eslint-Anpassung; prüfen).
- **Store:** unverändert — `AiSimulation` nutzt nur öffentliche Actions.

## Umsetzungsreihenfolge

1. **`Movement.ts`: `bfsOpenDistances` ergänzen** (blockungsbewusste BFS)
   - Voraussetzungen: keine.
2. **`Deduction.ts`** — Vorwärtsfilterung + Constraints + Negativ-Kamera
   - Voraussetzungen: Schritt 1.
3. **`Deduction.test.ts`** — skriptierte Szenarien auf `teststadt`:
   exakte Mengen, Monotonie, tatsächliche Position immer enthalten,
   Kamera-Rückwirkung über Runden (Maximalreichweite), `aktion`-
   Verharren, `umwelt`-Übergangssperre, Spawn-Prior.
   - Voraussetzungen: Schritt 2.
4. **`DetectiveAI.ts` + `DetectiveAI.test.ts`**
   - Voraussetzungen: Schritt 2.
5. **`GanoveAI.ts` + `GanoveAI.test.ts`**
   - Voraussetzungen: Schritt 1.
6. **`AiSimulation.ts` + `AiSimulation.test.ts`** — Einzelpartien +
   Batch über `teststadt`/`luebeck`, Determinismus (gleicher Seed →
   gleiches Log), reguläre Endbedingungen, Info-Trennungs-Nachweis
   (Typelevel: `DetectiveView` hat kein `ganovePosition`/`targets`;
   Laufzeit-Sweep: Belief-Menge enthält echte Position in
   unverfälschten Partien).
   - Voraussetzungen: Schritte 4+5.
7. **`vite.sim.config.ts`, `scripts/sim.ts`, `package.json`-Script,
   `.gitignore`** — `npm run sim` verifizieren.
   - Voraussetzungen: Schritt 6.
8. **Coverage ≥70 %, `npm run build`, `npm test`, `npm run lint` grün.**

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `deducePossiblePositions` ohne Hinweise = Spawn-Prior | `Deduction.test.ts` | `S(0..1)`-Verhalten, Übergangskette |
| Exakter Kamera-Hinweis in Runde t ⇒ Menge = {Knoten}, und beschränkt Runde t+k via Maximalreichweite | `Deduction.test.ts` | Konsistenz über vergangene Runden |
| `hinweis`-Ball ⊆ Constraint; `sichtbarkeit`/`aktion` pinnt Knoten | `Deduction.test.ts` | Alle Constraint-Arten |
| `aktion`-Runde erlaubt Verharren; ohne `aktion` kein Verharren | `Deduction.test.ts` | Positionsverlauf statt Punktmenge |
| `umwelt`-Sperre schränkt Übergänge in den betroffenen Runden ein | `Deduction.test.ts` | Zeitabhängige Kantenregel |
| Negativ-Kamera: Runde ohne `camera`/`aktion` schließt aktive Kameraknoten aus | `Deduction.test.ts` | Schlussfolgerung aus Nicht-Auslösung |
| Tatsächliche Position stets enthalten (gespielte Szenarien, mehrere Seeds); Menge wächst mit Hinweisen nie fälschlich über Constraints hinaus (monoton verfeinernd relativ zur Historie) | `Deduction.test.ts` + `AiSimulation.test.ts` | Akzeptanzkriterium 1 |
| `chooseDetectiveMove` wählt legalen Zug; bei Singleton-Belief steuern alle Detektive darauf zu; verteilte Belief-Menge → unterschiedliche Zielrichtungen (Abdeckung sinkt) | `DetectiveAI.test.ts` | Akzeptanzkriterium 2 (Druck) |
| `DetectiveView` trägt keine `ganovePosition`/Zielknoten — kompiliert nur mit detektivsichtbarer Sicht; Test beweist: KI-Zug ändert sich nicht, wenn `ganovePosition`/Missionstargets heimlich variiert werden | `DetectiveAI.test.ts` | Akzeptanzkriterium „kein Informations-Leak" |
| `chooseGanoveTurn`: nähert Missionsziel, führt Aktion am Ziel aus, verweigert Aktion bei angrenzendem Detektiv / `kritisch`-Hitze; `chooseSabotagePath` Umweg-Regel; `shouldUseRadio` | `GanoveAI.test.ts` | Akzeptanzkriterium 3 |
| `runAiGame` beendet regulär; `runAiBatch` über N Seeds reproduzierbar (gleiches Log bitgleich); `summarizeBatch` zählt Outcomes/Metriken korrekt; Belief-True-Position-Invarianz im Batch | `AiSimulation.test.ts` | Akzeptanzkriterien 3+4 |
| CLI: `--map/--games/--seed-start/--seeds/--out` parsen; Fehlerfälle | `scripts/sim.test.mjs` | Skript-Robustheit |

### Betroffene bestehende Tests

Keine — `Movement.ts` wird nur additiv erweitert.

### E2E-Tests (primärer Funktionsnachweis)

Die Anforderung betrifft keinen über UI oder Nutzeraktion erreichbaren
Ablauf: Der KI-vs.-KI-Modus ist ein headless Dev-Werkzeug ohne
Benutzerfluss im UI-Sinne (kein `*.tsx`, keine Interaktion). Der
„Benutzerfluss" des Dev-Tools — `npm run sim` spielt Batch-Partien und
schreibt Logs — wird durch `AiSimulation.test.ts` (Batch über den echten
Store, reguläre Endbedingungen, reproduzierbare Logs) und die tatsächliche
Ausführung von `npm run sim` als Abschlusskriterium nachgewiesen. Eine
E2E-Test-Infrastruktur existiert im Projekt nicht.

## Offene Punkte

Keine.
