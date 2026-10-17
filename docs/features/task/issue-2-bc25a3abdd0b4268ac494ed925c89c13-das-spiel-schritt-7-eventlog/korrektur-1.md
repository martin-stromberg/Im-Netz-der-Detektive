# Korrektur 1 – Zustandsrekonstruktion nutzt aufgezeichnete `mission`/`cameras`

## Anlass

Abnahmeprüfung `docs/projects/task/issue-2-bc25a3abdd0b4268ac49-4ed925c89c13-das-spiel/acceptance-schritt-7.md`
(Abweichung 1):

- `startGame` zieht Spawns (`pickDetectiveSpawns`/`pickGanoveSpawn`),
  Mission (`generateMission`) und Kameras (`placeCameras` →
  `rng.shuffle`) aus **einem** gemeinsamen RNG-Strom.
- `startOptionsFromHeader` lieferte die aufgezeichneten `starts` als
  explizite Positionen zurück — die Spawn-Züge wurden in der
  Rekonstruktion übersprungen, Mission und Kameras liefen dadurch an
  verschobener RNG-Position.
- Eigenes Sweep des Prüfers (je 10 Seeds auf teststadt/luebeck/muenster,
  `mission: "auto"`): **29/30 Rekonstruktionen divergierten** (stets
  andere Kameras, häufig andere Mission). Auch teils-explizite Starts
  waren betroffen.
- Der Header trug die aufgelösten `mission`/`cameras`-Werte bereits
  vollständig — es fehlte nur der Codepfad, der sie anwendet.

## Korrektur

`src/state/gameStore.ts`:

- Neuer Typ `RecordedMission` (`{id, name?, story?, targets}`) — die
  Form, die der `header`-Eintrag unter `mission` aufzeichnet.
- `StartGameOptions` erhält `resolvedMission?: RecordedMission | null`
  und `resolvedCameras?: readonly string[]` — der Rekonstruktionspfad;
  beide haben Vorrang vor `resolveMission`/`placeCameras` und führen
  **keine** RNG-Züge aus. Die `mission`-Option bleibt parallel für die
  `config`-Provenienz im Header bestehen.
- `resolveRecordedMission` baut den `Mission`-Zustand via
  `newMissionState` wörtlich aus dem Satz (`null` = Partie ohne
  Mission, deckt `"none"` und nicht generiertes `"auto"` ab);
  `resolveRecordedCameras` erzeugt aktive `Camera`-Objekte aus den
  aufgezeichneten Knoten-IDs. Beide prüfen die Knoten-IDs gegen die
  Karte (`GameConfigError` bei unbekannten IDs); Missionskriterien
  werden nicht erneut geprüft — sie galten bei Aufzeichnung. Ein
  fallfixiertes `targets.sabotageEffect` (`kurier-am-hafen`) reist in
  den Targets unverändert mit und befüllt später `pendingChoice` wie
  im Original.
- Der Header zeichnet `mission` nun als `{id, name, story, targets}`
  (zuvor ohne `story`) — nur so ist auch der Fall-Story-Anteil des
  `Mission`-Zustands verlustfrei rekonstruierbar. `undefined`-Felder
  entfallen in der JSON-Serialisierung wie gehabt.

`src/logic/Recorder.ts`:

- `startOptionsFromHeader` füllt `options.resolvedMission` aus
  `header.mission` (`?? null`) und `options.resolvedCameras` aus
  `header.cameras` (`?? []`) — Rekonstruktion ist damit per Definition
  identisch zum Original und unabhängig von RNG-Strom-Positionen.

`docs/help/spiel-engine/api.md`, `docs/help/spiel-engine/business-rules.md`,
`changes.log` — Dokumentation der Optionen und der Rekonstruktionsregel.

## Tests

`src/state/gameStore.log.test.ts` — neuer Block „state reconstruction
from header + seed (real maps)" (16 Tests): je Seeds 1–10 auf
teststadt/luebeck/muenster vergleicht `reconstruct()` den Zustand nach
`startOptionsFromHeader` + `startGame` mit dem Original
(Positionen, `mission` inkl. `story`/`targets`, `cameras`,
`escapeNodeIds`, Limits) und die serialisierte `header`-Zeile
(bitgleich):

- vollständig gezogener Start (`mission: "auto"`, keine Positionen) —
  der zuvor in 29/30 Fällen divergente Normalpfad;
- gemischte Spawns: explizite Detektive + gezogener Ganove und
  gezogene Detektive + expliziter Ganove;
- `mission: "none"` (Header-`mission: null`), `mission: "random"`
  (Seeds ohne konforme Mission werfen weiter
  `MissionGenerationError` — kein Header, nichts zu rekonstruieren),
  Fälle `diebstahlserie-altstadt`/`kurier-am-hafen` (inkl. `story` und
  `sabotageEffect`) und eine `custom`-Mission.

Der bisherige nur-voll-explizite Rekonstruktionstest bleibt bestehen.
`src/logic/Recorder.test.ts` prüft die neuen Optionsfelder inkl.
`resolvedMission: null`.

## Verifikation (lokal, Branch task/…-schritt-7-eventlog)

| Befehl | Ergebnis |
| --- | --- |
| `npm test` | Exit 0 — 22 Dateien / 326 Tests grün (vorher 309) |
| `npm run coverage` | Exit 0 — Statements 93,93 %, Branches 88,79 %, Lines 93,55 %, Functions 99,56 % (≥ 70 %) |
| `npm run lint` | Exit 0 — keine Findings |
| `npm run format:check` | Exit 0 — „All matched files use Prettier code style!" |
| `npm run build` | Exit 0 — `tsc --noEmit` + `vite build` erfolgreich |
