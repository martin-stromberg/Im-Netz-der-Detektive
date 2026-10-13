# Abnahmeprüfung – Entwicklungsschritt 7

**Prüfgegenstand:** Branch
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-7-eventlog`
(HEAD `98e1b50`) gegen `project-plan.md` §Schritt 7 sowie
`02-technisches-konzept.md` §8/§8.1. Geprüft: `src/logic/Recorder.ts`,
`src/state/gameStore.ts` (Log-Format), `src/logic/Recorder.test.ts`,
`src/state/gameStore.log.test.ts`; Diff gegen Basis-Branch: nur
`src/logic/Recorder.ts` + `src/state/gameStore.ts` + Tests + Doku.

## Ergebnis

**Status:** Abweichungen gefunden

## Abweichungen

- [ ] **Zustandsrekonstruktion via `startOptionsFromHeader` weicht vom
  Original ab, sobald Spawns per RNG gezogen wurden — also im
  Normalfall jeder Partie ohne explizite Positionen.**
  `startGame` zieht Detectives (`pickDetectiveSpawns`, `SpawnSystem.ts:93`)
  und Ganove (`pickGanoveSpawn`, `SpawnSystem.ts:115`) aus dem einen
  gemeinsamen RNG-Stream, danach Mission (`generateMission`,
  `gameStore.ts:521`) und Kameras (`placeCameras` → `rng.shuffle`,
  `gameStore.ts:945`). `startOptionsFromHeader` (`Recorder.ts:97-120`)
  liefert die aufgezeichneten `starts` als explizite
  `detectivePositions`/`ganovePosition` zurück — `resolveSpawnPositions`
  (`gameStore.ts:332-356`) überspringt dann die Spawn-Züge, sodass
  Missions- und Kameraziehung an einer verschobenen RNG-Position
  erfolgen. Eigener Sweep (je 10 Seeds auf teststadt/luebeck/muenster,
  `mission: "auto"`, ohne Positionsvorgaben): **29/30 Rekonstruktionen
  divergieren** — stets andere Kameras, auf luebeck/muenster häufig auch
  eine komplett andere Mission (z. B. muenster/Seed 1: Original-Ziele
  `{diebstahl: st_mauritz_kirche, kontakt: geistviertel, flucht:
  weseler_strasse, sabotage: rathaus}` vs. rekonstruiert `{schloss,
  aasee_terrassen, kinderhaus, stadtwerke}`). Auch teil-explizite Starts
  (nur `detectivePositions` gesetzt) betroffen: der Ganove-Spawn-Zug
  fehlt dann im rekonstruierten Lauf. Der eigene Test
  (`gameStore.log.test.ts:244-285`) deckt nur den voll-expliziten Start
  ab und maskiert den Defekt. Das Akzeptanzkriterium „die
  Zustandsrekonstruktion aus Header + Seed stimmt mit dem
  Originalzustand überein" ist damit für den Standardpfad nicht
  erfüllt. Abmildernd: Der Header trägt die *aufgelösten* `mission`-
  und `cameras`-Werte vollständig — die Log-Daten sind korrekt und
  verlustfrei; es fehlt jedoch jeder Codepfad, der sie anwendet
  (`startGame` kennt keine Kamera-Option; die Mission ließe sich nur
  über `mission: {type:"custom", targets}` pinnen, was den
  RNG-Positionsversatz nicht behebt). Mögliche Korrekturrichtungen:
  getrennte RNG-Stränge je Zweck (`mixSeed(seed, salt)`) oder
  gleichartige Ziehungen (draw-and-discard) auch bei expliziten
  Positionen.

## Hinweise

**Verifikationsläufe (selbst ausgeführt, Arbeitsbaum sauber):**

- `npm test` — 22 Dateien, 309 Tests, alle grün.
- `npm run coverage` — Statements 93,74 %, Lines 93,36 %, Branches
  88,42 %, Functions 99,55 % (≥ 70 % weit übertroffen; `Recorder.ts`
  86,2 % Lines — unbelegte Zeilen sind ausschließlich DOM-Zweige:
  `localStorage`-Zugriffsfehler `:133`, Anchor-Download `:200-205`,
  `Blob`-Fallback `:217`).
- `npm run build` — erfolgreich (`tsc --noEmit` + `vite build`).
- `npm run lint` — ohne Befund. `npm run typecheck` — ohne Befund.

**Prüfnachweise je Akzeptanzkriterium:**

1. **Valides JSONL:** Eigene Partie auf `teststadt` (Seed 42, KI-lose
   Greedy-Züge, `mission: "auto"`) per temporärem Vitest-Snippet
   gespielt und das Log konkret inspiziert: 116 Zeilen, jede einzeln
   parsebar. Zeile 1 = `header` **ohne** `seq`/`round` mit allen
   Pflichtfeldern (`gameId: "g-42"`, `mapId`, `seed: 42`, `config` mit
   allen effektiven Startwerten inkl. Missionsoption, `mission` mit
   aufgelösten targets, `cameras`, `starts`); Events `seq` 1..115
   lückenlos sequenziell mit `round`/`type`/`actor`/`visibleTo`;
   Abschluss `{"seq":115,"type":"result","outcome":"timeout","rounds":30,
   "hintsTotal":20,"camerasTriggered":15}`. Format deckt sich mit dem
   §8-Beispiel (inkl. `"draw"` via `abortAsDraw`, testbelegt
   `gameStore.log.test.ts:287-305`). Volle Partie berührt alle Typen:
   `move`, `hint` (camera/sichtbarkeit/hinweis/aktion), `event`
   (umwelt), `action`, `sabotage_offer` ×2, `sabotage`, `radio`,
   `edge_unblock`, `result`.
2. **Bitgleichheit:** Selbst nachgewiesen — zwei komplette Partien mit
   Seed 77 und identischen Eingaben erzeugen bytegleiche
   `serializeLog`-Ausgaben und identische Endzustände; `gameId` ist
   deterministisch (`g-{seed}`) oder Eingabe. RNG bleibt einzige
   Zufallsquelle (`createRng`/`mixSeed`, Missionsziehungen gesalzen via
   `MISSION_RNG_SALT`, `gameStore.ts:440-444`). → Teil „bitgleich"
   erfüllt; Teil „Rekonstruktion" siehe Abweichung oben.
3. **`visibleTo`:** Alle Einträge tragen einen gültigen Wert
   (`detectives`/`ganove`/`both`); Stichprobe im echten Log:
   Kamera-Hinweis `{"type":"hint","kind":"camera","node":"e",
   "visibleTo":"detectives"}` ✓, Ganove-Zug `visibleTo:"ganove"` ✓,
   Detektiv-Zug `visibleTo:"both"` ✓, `umwelt`-`event` und
   `edge_unblock` `visibleTo:"both"` ✓, `action`/`sabotage_offer`/
   `sabotage`/`radio` `visibleTo:"ganove"` ✓, `header`/`result`
   `visibleTo:"both"` ✓ — entspricht der §1-Asymmetrie und den in
   `business-rules.md:432` dokumentierten Regeln; zudem erschöpfend
   testbelegt (`gameStore.log.test.ts:193-220`).
4. **Export & Persistenz:** `exportGameLog` (`Recorder.ts:215-226`)
   baut einen `application/x-ndjson`-`Blob` und gibt ihn an eine
   injizierbare Download-Senke; DOM-Default = Anchor-Klick, no-op ohne
   `document`. Store-Action `exportGameLog()` (`gameStore.ts:1015`)
   verdrahtet. `localStorage`-FIFO über `StorageLike`-Adapter
   (`Recorder.ts:28-32`), `MAX_STORED_LOGS = 10` (`:22`),
   `LOG_STORAGE_KEY`-Key; korrupte Inhalte lesen als leere Liste
   (`readLogStrings`, `:142-156`), Quota-/Zugriffsfehler werden
   geschluckt (`:178-182`), headless ist `defaultStorage()` = `null`
   → no-op ohne Crash (`finish` bleibt werfend-frei, testbelegt
   `:453-461`). Auto-Persist der letzten N Logs in `finish()`
   (`gameStore.ts:597`) — über „Sitzungen" hinweg inherent durch
   localStorage.
5. **`result`-Metriken:** `finish` (`gameStore.ts:579-598`) schreibt
   `outcome` (alle fünf Enden inkl. `draw`), `rounds` (Runden bis
   Fang/Flucht/Timeout), `hintsTotal` (Anzahl `HINT_EVENT_KINDS`-
   Events: camera/sichtbarkeit/hinweis/aktion,
   `InformationSystem.ts:64-69`), `camerasTriggered` — auswertbare
   Zahlen für Balancing-Aggregation gemäß §8.1.
6. **`sabotage_offer` zweiteilig:** Dokumentierte Abweichung
   (`changes.log:17`, `api.md:269`, `business-rules.md`), Umsetzung:
   Angebot beim Kontakt (`offered`+`node`, `gameStore.ts:876-882`),
   Wahl später (`offered`+`node`+`chosen`, `:1190-1199`). Bewertung:
   **vertretbar** — die Spec-Zeile komprimiert Angebot und Wahl in ein
   Beispiel, spielmechanisch liegen sie zeitlich auseinander (die Wahl
   kann Runden nach dem Angebot fallen); der zweite Record trägt die
   volle Spec-Form inkl. `chosen`. Für Replay/Balancing ist die
   zeitliche Trennung sogar präziser.
7. **Scope:** Diff enthält keinen Replay-Player (Schritt 12), keinen
   UI-Button, keine Komponenten-Änderungen — nur Engine, Recorder,
   Tests, Doku. Kein `Math.random()` in den neuen Pfaden.

**Einschränkungen/Anmerkungen (keine Abweichungen):**

- `LogInput` erlaubt per Indexsignatur ein mitgegebenes `seq`, das die
  Zählung in `appendLog` überschreiben würde (`gameStore.ts:1008-1010`)
  — interne Aufrufer nutzen das nie; rein defensiver Hinweis.
- `config.detectiveCount` wird im Header aufgezeichnet, von
  `startOptionsFromHeader` aber nicht zurückgespielt — funktional
  äquivalent, da `detectivePositions` die Anzahl impliziert.
- `eventMode` steht in `config`, ist aber keine `StartGameOptions`-
  Eingabe (kartenabgeleitet) — Rekonstruktion benötigt es nicht.
