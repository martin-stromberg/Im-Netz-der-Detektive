# Umsetzungsplan: Eventlog / Aufzeichnung (Schritt 7)

## Übersicht

Das interne `log` des `useGameStore` wird auf das flache JSONL-Format aus
Spec §8 gehoben (`visibleTo` auf jedem Eintrag, `gameId`+`config` im
Header, Balancing-Metriken im `result`, Ablauf von Kantensperrungen als
eigenes Event). Das neue Modul `src/logic/Recorder.ts` serialisiert das
Log als JSONL, exportiert es als Datei (Blob-Download hinter
DOM-Grenze), hält die letzten N Partien in `localStorage` (FIFO,
injizierbarer Storage) und bildet den Header zur Zustandsrekonstruktion
auf `StartGameOptions` ab. Beim Partieende (`finish()`) wird das Log
automatisch persistiert. Die Engine bleibt headless und deterministisch.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| `LogEntry`-Struktur | Flache Felder + Indexsignatur (`[field: string]: unknown`); `appendLog` nimmt `LogInput` (ohne `seq`) entgegen | Spec-Beispiel §8 ist flach (`{"seq":1,"round":1,"type":"move","actor":…}`); die `details`-Kapselung entfällt vollständig — „konsistent führen" würde zwei Formate parallel ziehen |
| Header-`seq`/`round` | Header ist die einzige Zeile ohne `seq`/`round` in der Serialisierung; intern trägt er `seq: 0` | Spec-Beispiel: Header ohne `seq`, Events starten bei `seq: 1` — exakte Formattreue |
| `gameId` | `StartGameOptions.gameId`, Default `g-${seed}` | Determinismus: gleicher Seed + gleiche Eingaben müssen ein bitgleiches Log liefern — ein `localStorage`-Zähler wäre nicht input-deterministisch |
| `config` im Header | Effektive Auflösung aller Startparameter inkl. `mission`-**Option** (nicht nur das Ergebnis) und `cameraProtectedNodes` | Rekonstruktion: `startGame` mit denselben Optionen reproduziert den exakten Anfangszustand inkl. `mission.id`-Herkunft (`"random"`/`"custom"`/Fall-ID) |
| `sabotage_offer` vs. Wahl | Zwei Einträge: `sabotage_offer` beim Kontakt (`offered`, `node`), zweiter `sabotage_offer` bei der Wahl mit zusätzlichem `chosen` | Spec-Beispiel `{"type":"sabotage_offer","offered":"falsche_spur","chosen":true}` vereint beide Felder; die Engine trennt Angebot (kontakt-Aktion) und endgültige Wahl (`chooseMissionPath`) zeitlich — zwei Records desselben Typs bilden beide Zeitpunkte ab, der zweite entspricht exakt dem Spec-Feldsatz |
| `visibleTo` auf Header/`result` | `"both"` auf allen Zeilen inkl. Header/`result` | Akzeptanzkriterium verlangt `visibleTo` auf allen Events; einheitliche Belegung macht die Perspektiven-Filterung trivial; Spec-Beispiel listet Pflichtfelder, schließt Zusatzfelder nicht aus |
| `visibleTo` der Einträge | `move`(ganove)=`ganove`, `move`(detective)=`both`, `hint`/`event`=`GameEvent.visibleTo`, `action`/`sabotage*`/`radio`=`ganove`, `header`/`result`/`edge_unblock`=`both` | §1-Asymmetrie: Detektive sehen den Ganoven nicht (sein Zug bleibt verborgen), der Ganove sieht alle Detektivpositionen exakt; `umwelt` ist Weltzustand für beide |
| Browser-Grenze | Injektion: `StorageLike`-Interface + `download`-Callback als optionale Parameter; Defaults greifen nur bei vorhandenem `window`/`document` | Store bleibt headless; Vitest-Node-Umgebung hat kein DOM — Tests injizieren Fakes |
| Auto-Persist | `finish()` ruft `Recorder.saveGameLog(log)` auf — no-op ohne `localStorage` | „Automatisch vorhalten" ist fachlich Teil des Partieendes; der Store orchestriert, der Recorder kapselt die Browsergrenze |
| Kantensperr-Ablauf | `edge_unblock`-Eintrag pro abgelaufener Kante in `unblockExpiredEdges` | „Kantensperrungen + Ablauf" ist gefordert; Ablauf war bisher nicht protokolliert |
| Modulort | `src/logic/Recorder.ts` (Spec §2/§5); `LogEntry`/`LogInput` bleiben in `gameStore.ts`, Recorder importiert sie nur als Typen | Spec-Modulliste; keine Laufzeit-Zirkularität (Recorder → gameStore nur `import type`) |

## Programmabläufe

### Partie aufzeichnen (laufendes Spiel)

1. `startGame` löst wie bisher Spawns → Limits → Mission → Kameras auf,
   zusätzlich `gameId` (`options.gameId` oder `g-${seed}`) und das
   `config`-Objekt (effektive Werte: `detectiveCount`, `roundLimit`,
   `cameraCount`, `radioHintCount`, `edgeBlockRounds`, `eventMode`,
   `mission` (Option), `cameraProtectedNodes`).
2. `appendLog` schreibt den `header`-Eintrag (`seq: 0`, intern) mit
   `gameId`, `mapId`, `seed`, `config`, `mission` (aufgelöst:
   `id`, `name`, `targets` bzw. `null`), `cameras` (Knoten-IDs),
   `starts` (`detectives`/`ganove`), `visibleTo: "both"`.
3. Jede Store-Aktion schreibt flache Einträge mit `visibleTo`:
   `move`, `hint`/`event` (via `emitInfoEvent`, inkl. `node`,
   `zone`, `nodeIds`, `edge`, `untilRound`, plus `action` aus
   `event.details` für `aktion`), `action`, `sabotage_offer` (2×:
   Angebot, Wahl mit `chosen`), `sabotage`, `radio`, `edge_unblock`.
4. `finish(outcome)` zählt `hintsTotal` (`events` mit
   `HINT_EVENT_KINDS`) und `camerasTriggered` (`kind === "camera"`),
   schreibt `result` (`outcome`, `rounds`, `hintsTotal`,
   `camerasTriggered`, `visibleTo: "both"`) und ruft
   `saveGameLog(get().log)` → Auto-Persist (no-op ohne `localStorage`).

Beteiligte Klassen/Komponenten: `useGameStore`, `InformationSystem`
(`HINT_EVENT_KINDS`), `Recorder`.

### Export („Partie exportieren")

1. Aufrufer (später UI, jetzt Store-Action `exportGameLog()`) ruft
   `Recorder.exportGameLog(log, { filename?, download? })`.
2. `serializeLog` erzeugt den JSONL-String; daraus wird ein
   `Blob` (`application/x-ndjson`) gebaut.
3. `download` (Default: DOM-Anker-Klick, nur wenn `document` und
   `URL.createObjectURL` existieren) löst den Dateidownload aus;
   der `Blob` wird zurückgegeben.

Beteiligte Klassen/Komponenten: `Recorder`, `useGameStore`.

### FIFO-Persistenz der letzten N Partien

1. `saveGameLog(log, { storage?, maxLogs? })` serialisiert das Log,
   liest das JSON-Array unter `LOG_STORAGE_KEY` aus dem Storage
   (Default: `window.localStorage`, gehärtet gegen
   `SecurityError`/fehlendes `window` → `null` = no-op), hängt an,
   schneidet auf die letzten `maxLogs` (Default `MAX_STORED_LOGS = 10`)
   zu und schreibt zurück.
2. `listGameLogs(storage?)` liefert die gespeicherten JSONL-Strings
   (älteste → neueste); `clearGameLogs(storage?)` entfernt den Schlüssel.
3. Korrupte/parsebare-unmögliche Storage-Inhalte werden als leere Liste
   behandelt (nie werfen).

Beteiligte Klassen/Komponenten: `Recorder`.

### Zustandsrekonstruktion aus Header + Seed

1. `headerFromLog(log)` liefert den `header`-Eintrag.
2. `startOptionsFromHeader(header)` bildet `config`/`starts` auf
   `StartGameOptions` ab (`detectivePositions`, `ganovePosition`,
   `roundLimit`, `cameraCount`, `radioHintCount`, `edgeBlockRounds`,
   `cameraProtectedNodes`, `mission` = `config.mission`) und gibt
   `mapId`/`seed` zurück.
3. `startGame(loadMap(mapId), seed, options)` reproduziert denselben
   Anfangszustand (Positionen, Kameras, Mission inkl. `id`/Herkunft,
   Limits) — Testnachweis für Determinismus.

Beteiligte Klassen/Komponenten: `Recorder`, `MapLoader`, `useGameStore`.

## Neue Klassen

| Klasse | Typ | Zweck |
|--------|-----|-------|
| `Recorder.ts` (`src/logic/`) | Modul (reine Funktionen) | `serializeLog`/`serializeLogEntry` (JSONL), `headerFromLog`, `startOptionsFromHeader`, `saveGameLog`, `listGameLogs`, `clearGameLogs`, `exportGameLog`; Konstanten `LOG_STORAGE_KEY`, `MAX_STORED_LOGS`; Interfaces `StorageLike`, `DownloadOptions`/`PersistOptions` |

## Änderungen an bestehenden Klassen

### `LogEntry` / neu `LogInput` (Datenmodell, `src/state/gameStore.ts`)

- **Entfernt:** `details`-Kapselung.
- **Neu:** Indexsignatur `[field: string]: unknown` für flache
  Event-Felder; `visibleTo?: Visibility`.
- **Neu:** `LogInput` = `LogEntry` ohne `seq` (Parametertyp von
  `appendLog`).

### `StartGameOptions` (`src/state/gameStore.ts`)

- **Neue Eigenschaft:** `gameId?: string` — Deterministische
  Partiekennung im Header; Default `g-${seed}`.

### `useGameStore` (`src/state/gameStore.ts`)

- **Geänderte Methode `appendLog`:** Parametertyp `LogInput`;
  `seq`-Vergabe: `header` → `0`, sonst Anzahl Nicht-Header-Einträge + 1;
  Eintrag wird als `{ seq, ...input }` abgelegt (Feldreihenfolge
  `seq`, `round`, `type`, … für die Serialisierung).
- **Geänderte Methode `startGame`:** Header-Eintrag im neuen Format
  (`gameId`, `config`, …); `resolveCameraProtectedNodes`-Ergebnis wird
  gehoben und in `config` + `protectedNodes` wiederverwendet.
- **Geänderte interne `finish`:** `result`-Eintrag mit `outcome`,
  `rounds`, `hintsTotal`, `camerasTriggered`, `visibleTo: "both"`;
  danach `saveGameLog`.
- **Geänderte interne `emitInfoEvent`:** flache Felder inkl. `node`,
  `nodeIds`, `action` (aus `event.details`), `visibleTo`.
- **Geänderte Methoden `moveGanove`/`moveDetective`/`ganoveAction`/
  `chooseMissionPath`/`useRadio`/`applySabotageEffect` (intern)/
  `advanceMission` (intern):** Logeinträge flach + `visibleTo` gemäß
  Tabelle oben; `mission_choice` entfällt zugunsten des zweiten
  `sabotage_offer` mit `chosen`.
- **Geänderte Methode `unblockExpiredEdges`:** schreibt pro entfernter
  Kante einen `edge_unblock`-Eintrag (`edge`, `visibleTo: "both"`).
- **Neue Methode `exportGameLog()`:** delegiert an
  `Recorder.exportGameLog(get().log)`; Rückgabe `Blob | null`.

## Datenbankmigrationen

Keine (kein Persistenzschema außer `localStorage`-Schlüssel,
siehe Konfiguration).

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `storage`-Inhalt | Muss JSON-Array von Strings sein | Ungültig → als leere Liste behandeln |
| `headerFromLog` | Log ohne `header`-Eintrag | `undefined` zurückgeben |
| `startOptionsFromHeader` | `header.type !== "header"` | `TypeError` werfen |

## Konfigurationsänderungen

| Eintrag | Typ | Standardwert | Zweck |
|---------|-----|--------------|-------|
| `Recorder.LOG_STORAGE_KEY` | `const string` | `"im-netz-der-detektive:game-logs"` | `localStorage`-Schlüssel |
| `Recorder.MAX_STORED_LOGS` | `const number` | `10` | FIFO-Grenze N |
| `StartGameOptions.gameId` | `string` (optional) | `g-${seed}` | Partiekennung im Header |

## Seiteneffekte und Risiken

- **Bestehende Tests:** alle `details`-Assertions auf `log`-Einträgen
  brechen (gameStore.test/rounds/endings/info/mission) — werden im
  Zuge der Umstellung angepasst (siehe Tests).
- **Sichtbarkeitsregeln:** `visibleTo` auf Logeinträgen darf die
  §1-Asymmetrie nicht verletzen (Ganoven-`move` ist `ganove`-sichtbar,
  nicht `both`); Fehler würden später in die Perspektiven-Wiedergabe
  leaken — abgesichert durch gezielte Tests.
- **`unblockExpiredEdges` als öffentlicher Hook:** das Logging dort
  feuert auch bei direktem Testaufruf — bewusst so (Ablauf ist ein
  Spielvorgang); Nebenwirkung: ein `edge_unblock`-Eintrag kann bei
  manuellen `blockEdge`-Aufrufen entstehen — dokumentiertes
  Test-Hook-Verhalten.
- **Blob im Node-Test:** Node ≥18 kennt `Blob` global;
  `URL.createObjectURL`/`document` fehlen → Default-Downloader no-opt,
  Export liefert trotzdem den `Blob` (testbar via `blob.text()`).

## Umsetzungsreihenfolge

1. **`LogInput`/`LogEntry` umstellen und Store-Logstellen migrieren**
   - Voraussetzungen: keine
   - Beschreibung: `LogInput` einführen, `LogEntry` flach machen,
     `appendLog`-Seq-Regel (header→0), alle `appendLog`-Aufrufstellen
     auf flache Felder + `visibleTo` umstellen, `mission_choice` →
     zweiter `sabotage_offer` mit `chosen`, `emitInfoEvent` erweitern
     (`node`, `nodeIds`, `action`), `unblockExpiredEdges` loggt
     `edge_unblock`.

2. **`Recorder.ts` anlegen**
   - Voraussetzungen: Schritt 1 (LogEntry-Format)
   - Beschreibung: Serialisierung (Header ohne `seq`/`round`, Events in
     Feldreihenfolge `seq`,`round`,`type`,…), `headerFromLog`,
     `startOptionsFromHeader`, `StorageLike` + `defaultStorage()`,
     `saveGameLog`/`listGameLogs`/`clearGameLogs` (FIFO, N=10),
     `exportGameLog` (Blob + injizierbarer Download).

3. **`finish()`-Metriken + Auto-Persist + `exportGameLog`-Store-Action**
   - Voraussetzungen: Schritte 1–2
   - Beschreibung: `result` um `hintsTotal`/`camerasTriggered`/
     `visibleTo` erweitern, `saveGameLog` nach dem `result`-Eintrag,
     `exportGameLog` im `GameState`-Interface + Implementierung.

4. **Bestehende Tests an das neue Log-Format anpassen**
   - Voraussetzungen: Schritt 1
   - Beschreibung: `details:`-Assertions flach ziehen,
     `log[0].details?.cameras` → `log[0].cameras`, Header-Erwartungen
     (`seq: 0`), `mission_choice`-Bezüge prüfen/ersetzen.

5. **Neue Tests schreiben**
   - Voraussetzungen: Schritte 1–3
   - Beschreibung: `Recorder.test.ts` + `gameStore.log.test.ts` gemäß
     Testplan.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft / bereitgestellt? |
|--------------------|------------|-------------------------------------|
| `serializeLog produces spec-format lines` | `Recorder.test.ts` | Header-Zeile ohne `seq` mit `gameId`/`mapId`/`seed`/`config`/`mission`/`cameras`/`starts`; Events mit `seq`/`round`/`type`; `result` mit `outcome`/`rounds`/`hintsTotal`/`camerasTriggered`; jede Zeile einzeln parsebar |
| `serializeLog field order matches spec example` | `Recorder.test.ts` | Erste Token der Zeilen (`{"type":"header"`, `{"seq":1,"round":1,"type":"move"`) |
| `same seed + same inputs → identical JSONL` | `gameStore.log.test.ts` | Zwei komplett gespielte Partien (gleiche Seeds/Züge) → `serializeLog`-Strings bitgleich |
| `reconstruct start state from header + seed` | `gameStore.log.test.ts` | `startOptionsFromHeader(headerFromLog(log))` → `startGame` → Positionen, Kameras, Mission, Limits identisch |
| `every event carries correct visibleTo` | `gameStore.log.test.ts` | Volle Partie: `move`(ganove)=`ganove`, `move`(detective)=`both`, Hinweise=`detectives`, `umwelt`/`edge_unblock`/`header`/`result`=`both`, `action`/`sabotage*`/`radio`=`ganove`; kein Eintrag ohne `visibleTo` |
| `full game log contains all event types` | `gameStore.log.test.ts` | Gescriptete Partie mit Kameratreffer, Ereignis, `umwelt`-Sperre + Ablauf, Aktions-Spur, Sabotage-Angebot + -Wahl, Polizeifunk, `result` — alle Typen vorhanden, `seq` monoton 1..n |
| `result carries balancing metrics` | `gameStore.log.test.ts` | `hintsTotal` = Anzahl `HINT_EVENT_KINDS`-Events, `camerasTriggered` = Anzahl `camera`-Events, `rounds` = Endrunde; für `caught`- und `draw`-Ende |
| `edge_unblock entries on expiry` | `gameStore.log.test.ts` | `blockEdge` + Rundenvorschub → `edge_unblock` mit `edge`/`untilRound`-Kontext, `visibleTo:"both"` |
| `saveGameLog keeps last N (FIFO)` | `Recorder.test.ts` | Fake-`StorageLike`: nach N+1 Saves sind genau N Einträge drin, älteste entfernt; lesen/schreiben korrekt |
| `saveGameLog is a no-op without storage` | `Recorder.test.ts` | `storage: null` → kein Fehler, kein Effekt |
| `corrupt storage content is treated as empty` | `Recorder.test.ts` | `getItem` liefert Nicht-JSON/kein Array → Save funktioniert, `listGameLogs` = `[]` |
| `listGameLogs returns oldest→newest` | `Recorder.test.ts` | Reihenfolge nach mehreren Saves |
| `exportGameLog returns Blob + calls downloader` | `Recorder.test.ts` | `blob.text()` == `serializeLog(log)`; injizierter `download`-Spy erhält Blob+Dateiname; Default ohne DOM wirft nicht |
| `startOptionsFromHeader maps mission options` | `Recorder.test.ts` | `auto`/`none`/`case`/`custom`-Header → korrekte `MissionOption`; Nicht-Header → `TypeError` |
| `auto-save on finish` | `gameStore.log.test.ts` | Mit injiziertem Storage ist nach `finish` das vollständige Log inkl. `result` persistiert (Storage-Injektion via `defaultStorage`-Grenze: Test setzt `globalThis.localStorage`-Fake bzw. `window`-Shim) |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `gameStore.test.ts` (`header log entry`, `increasing seq`) | `details`→flach; Header ohne `seq`/`round` in Serialisierung, intern `seq: 0`; Header-Felder erweitert |
| `gameStore.rounds.test.ts` (`move`/`action`-Assertions) | `details:{actor,from,to,edgeType,nodeId}` → flach (`node` statt `nodeId`) |
| `gameStore.endings.test.ts` (5× `result`) | `details:{outcome,rounds}` → flach + neue Metrikfelder |
| `gameStore.info.test.ts` (`records cameras in the header log`, `hint`-Log) | `log[0].details?.cameras` → `log[0].cameras`; `hint`-Eintrag flach |
| `gameStore.mission.test.ts` (`result`, ggf. `sabotage_offer`/`mission_choice`-Bezüge) | flaches Format; zweiter `sabotage_offer` statt `mission_choice` |

### E2E-Tests (primärer Funktionsnachweis)

Keine — die Anforderung berührt keinen über UI erreichbaren
Benutzerfluss: Es existiert noch keine Spiel-UI (Schritt 7 ist reine
Engine/Persistenz). Der „Partie exportieren"-Mechanismus ist eine
programmatische Funktion (`exportGameLog`), der UI-Button folgt in
einem späteren UI-Schritt; seine Browser-Wirkung ist hinter der
injizierbaren Download-Grenze gekapselt und wird per Spy-Test
nachgewiesen.

## Offene Punkte

Keine.
