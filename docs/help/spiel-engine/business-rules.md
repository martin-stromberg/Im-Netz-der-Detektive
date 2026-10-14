← [Zurück zur Übersicht](index.md)

# Spiel-Engine — Business Rules

## Kartenpaket-Validierung

**Beschreibung:** Jedes Kartenpaket muss das Schema aus
`02-technisches-konzept.md` §4 vollständig erfüllen — derselbe
Regelsatz, den der Git-Hook `map-schema-check.py` beim Commit erzwingt.
Die Laufzeit-Validierung ist die zweite Enforcer-Stelle, damit Pakete
auch zur Laufzeit (z. B. aus zukünftigen Quellen) sauber geprüft sind.

**Bedingungen:**
- Pflichtfelder: `id`, `name`, `viewBox` (nicht-leere Strings),
  `nodes`/`edges` (nicht-leere Arrays), `spawnRules`, `settings`.
- Knoten-`id`s eindeutig; `categories` ⊆
  `diebstahl`/`kontakt`/`sabotage`/`flucht`, nicht leer.
- Kanten-`a`/`b` müssen vorhandene Knoten referenzieren; `type` ∈
  `weg`/`fahrt`; `cost` optional (reserviert).
- `settings`-Range-Objekte `{suggested, min, max}` mit
  `min ≤ suggested ≤ max`; `roundLimit` darf `unlimited: true` tragen.

**Verhalten:**
- Wenn alles valide: Paket wird als `MapPack` zurückgegeben.
- Sonst: `MapValidationError` mit **allen** Verstößen in
  `pfad: meldung`-Form — nie nur der erste Fehler.

**Umsetzung:** `validateMapPack` in `mapPack.ts`.

## Deterministischer Zufall

**Beschreibung:** Engine-Code darf ausschließlich den zentralen
Seeded-RNG nutzen — Voraussetzung für Replays, KI-Simulation und
spätere Multiplayer-Synchronisation.

**Verhalten:**
- Gleicher Seed → identische `next()`-Folge und identische
  Startaufstellungen.
- `Math.random()` in `src/logic/` ist verboten (Git-Hook blockiert).

**Umsetzung:** `createRng` (mulberry32) in `rng.ts`; RNG wird in die
Konsumenten injiziert (`assignSpawns`, `startGame`).

## Startaufstellung — Reihenfolge und Mindestabstand

**Beschreibung:** Die Platzierungsreihenfolge ist strukturell fixiert:
alle Detektive zuerst, der Ganove als Letzter. Der Ganove sieht die
platzierten Detektive also immer, bevor sein Startpunkt bestimmt wird.

**Verhalten:**
- `spawnRules.order` ist schematisch auf `"detektive_first"` fixiert.
- Wenn `minDistanceToDetective` gesetzt: ein Ganoven-Kandidat ist nur
  zulässig, wenn seine BFS-Kantendistanz zu **jedem** platzierten
  Detektiv ≥ dem Wert ist — in allen Modi (`choice`, `free`,
  `random`). Positionen unterhalb werden nie angeboten.
- Unerreichbare Knoten zählen als unendlich weit entfernt und bleiben
  zulässig.
- Bleibt kein Kandidat übrig, wirft `pickGanoveSpawn` einen
  `SpawnError`.

**Umsetzung:** `spawnSequence`, `ganoveSpawnChoices`, `assignSpawns`
in `SpawnSystem.ts`.

## Kantendistanzen

**Beschreibung:** Entfernungen auf dem Spielfeld sind ausschließlich
BFS-Kantenzählungen — Grundlage für Missionskriterien, Zonenhinweise
und den Spawn-Mindestabstand.

**Verhalten:**
- `weg`- und `fahrt`-Kanten zählen gleich (1 Zug = 1 Kante);
  `cost` ist reserviert und wird nicht gewichtet.
- `distance(a, a)` = `0`; unerreichbare oder unbekannte Knoten →
  `Infinity`.

**Umsetzung:** `buildGraph`, `bfsDistances`, `distance` in `Graph.ts`.

## Bewegungsregeln (Rundenablauf)

**Beschreibung:** Ein Zug ist immer genau eine Kante — `weg` und `fahrt`
sind gleichwertig. Zugzwang gilt für alle: niemand darf freiwillig
stehen bleiben; die einzige Ausnahme ist die Aktionsrunde des Ganoven.

**Bedingungen:**
- Ziel muss ein Nachbarknoten über eine ungesperrte Kante sein.
- Gesperrte Kanten (`blockedEdges`, `untilRound` inklusive) sind für
  beide Seiten unpassierbar.
- Detektiv-besetzte Knoten sind für den Ganoven illegale Ziele;
  Detektive dürfen Knoten teilen.
- Es gibt keine Fangprüfung auf Kanten — nur auf Zielknoten.

**Verhalten:**
- `validateGanoveMove`/`validateDetectiveMove` liefern `MoveError` mit
  `reason` (`stay_forbidden`, `not_adjacent`, `blocked_edge`,
  `occupied`, `not_active_detective`) statt stiller Ablehnung.

**Umsetzung:** `Movement.ts` (`validateSharedMove`, `isEdgeBlocked`,
`legalMovesFrom`); Store-Actions `moveGanove`/`moveDetective`.

## Fang — Sofortprüfung nach jedem Einzelzug

**Beschreibung:** Nach jedem einzelnen Detektivzug wird geprüft, ob der
Detektiv auf dem Ganoven-Knoten gelandet ist — die Partie endet sofort
(`outcome "caught"`, Detektiv-Sieg), auch wenn weitere Detektive noch
nicht gezogen haben.

**Umsetzung:** `moveDetective` in `gameStore.ts`.

## Umzingelung

**Beschreibung:** Hat der Ganove zu Beginn seiner Phase keinen legalen
Zug **und** keine ausführbare Aktion, gilt er als umzingelt
(`outcome "surrounded"`, Detektiv-Sieg). Die Prüfung läuft beim
Übergang in jede Ganovenphase — auch direkt nach `startGame`.

**Bedingungen:**
- „Kein legaler Zug" berücksichtigt besetzte Knoten und gesperrte
  Kanten.
- „Keine ausführbare Aktion" fragt den Hook `ganoveCanAct` ab — den
  das Missionssystem befüllt (konservativ `false`).

**Umsetzung:** `checkGanoveSurrounded` in `gameStore.ts`.

## Flucht

**Beschreibung:** Erreicht der Ganove einen freien Fluchtpunkt, gewinnt
er (`outcome "escaped"`). Fluchtpunkte stehen in `escapeNodeIds` —
initial alle Knoten der Kategorie `flucht`, per `setEscapeNodeIds` für
die missionsgebundene Flucht überschreibbar. Ein besetzter Fluchtpunkt
ist nur ein illegales Zugziel (`occupied`), keine dauerhafte Sperre.

**Umsetzung:** `moveGanove` + `mapEscapeNodeIds`/`escapeNodeIds`.

## Zeitlimit

**Beschreibung:** `roundLimit` begrenzt die Rundenzahl (Default:
`settings.roundLimit.suggested` der Karte, überschreibbar pro Partie
innerhalb `min`/`max`). Läuft das Limit ohne Flucht ab, gewinnen die
Detektive (`outcome "timeout"`). `roundLimit: null` („unbegrenzt", nur
bei `unlimited: true` der Karte) deaktiviert die Zeitbedingung — dann
entscheiden nur Fang/Umzingelung oder Flucht.

**Umsetzung:** `resolveRoundLimit` + `completeDetectivePhase` in
`gameStore.ts`.

## Remis

**Beschreibung:** Eine laufende Partie kann vorzeitig als Unentschieden
gewertet werden (`outcome "draw"`, zählt in der Statistik als Remis).

**Umsetzung:** `abortAsDraw` in `gameStore.ts`; `result.outcome`
entspricht dem Eventlog-Format (`02-technisches-konzept.md` §8).

## Kameras

**Beschreibung:** Beim Spielstart werden `cameraCount` Kameras per RNG
verteilt — mit Mindestabstand `cameraMinGap` Kanten untereinander und
ohne die Ausschlussliste `cameraProtectedNodes` (öffentliche Regel:
Missionsziele sind kamerafrei).

**Bedingungen:**
- Die Abstandsregel gilt als BFS-Kantendistanz `>= cameraMinGap`.
- Kameras sind dauerhaft aktiv und lösen bei **jedem Betreten** durch
  den Ganoven aus (Betreten ≠ Verharren: eine Aktionsrunde auf einem
  Kameraknoten löst nicht erneut aus).
- Der Hinweis enthält den exakten Knoten und die Auslöserunde —
  ausschließlich `visibleTo: "detectives"`.
- Der Ganove erfährt Kamerapositionen nie; die einzige Ausnahme ist
  der Polizeifunk (ausgelöste Kameras als Hinweisdaten).
- `deactivateCameras` (Sabotage `kamera_aus`) schaltet alle Kameras
  für den Rest der Partie aus.
- Kann die Karte die gewünschte Anzahl unter den Regeln nicht
  hergeben, wird bestmöglich platziert (Invarianzen gelten immer).

**Umsetzung:** `placeCameras`, `triggeredCamera`, `deactivateAll` in
`CameraSystem.ts`; Verdrahtung in `startGame`/`moveGanove`.

## Ereignisse — Auslösemodi und Typen

**Beschreibung:** Pro Ganovenzug läuft genau eine Ereignisprüfung; der
Modus steht in `settings.eventMode` bzw. `eventMode`, die Kadenz in
`eventDefaults`, die Typmischung in `eventMix`.

**Bedingungen:**
- `cycle`: Auslösung exakt in Runden `round % cycle === 0`.
- `chance`: Auslösung mit Wahrscheinlichkeit `chance` pro Runde.
- `tension`: `tensionValue += perRound` pro Runde; bei `>= threshold`
  Auslösung und Reset auf 0 — garantierte Kadenz
  `ceil(threshold / perRound)` Runden.
- Typzug gewichtet nach `eventMix` (`sichtbarkeit`/`hinweis`/`umwelt`);
  Ganovenaktionen sind **keine** Zufallsereignisse.
- `sichtbarkeit`: exakter aktueller Knoten — gilt nur die laufende
  Runde und verfällt danach (`visibleTo: "detectives"`).
- `hinweis`: zonenbasiert („im Bereich X") — Zone des tatsächlichen
  Ganove-Knotens plus operative Region = BFS-Ball im Radius
  `hintZoneRadius` (`visibleTo: "detectives"`).
- `umwelt`: sperrt eine zufällige Kante für `edgeBlockRounds` Runden —
  beidseitig sichtbar und wirksam (`visibleTo: "both"`). Eine Kante
  wird nur gesperrt, wenn der Restgraph danach zusammenhängend bleibt:
  nie die letzte freie Kante eines Knotens, nie eine Zerteilung.

**Umsetzung:** `rollTrigger`, `drawEventType`, `zoneHint`,
`pickBlockableEdge` in `EreignisEngine.ts`; `runEventRoll` in
`gameStore.ts` (läuft nach `moveGanove` und `ganoveAction`, vor der
Detektivphase — neue Hinweise sind den Detektiven vor ihren Zügen
sichtbar).

## Hinweis-Grundsatz und Asymmetrie

**Beschreibung:** Hinweise zeigen, wo der Ganove *war* — nie, wo er
*ist*. Exakte Knotenangaben nur vergangenheitsbezogen (Kamera:
Knoten + Auslöserunde; Aktions-Spur: Tatort). Die einzige
Live-Ausnahme ist das `sichtbarkeit`-Ereignis der laufenden Runde.
Die Sichtbarkeit ist datenseitig verankert (`visibleTo` auf jedem
`GameEvent`), nicht erst in der Anzeige.

**Bedingungen:**
- Hinweisgebende Ereignisse (`camera`, `sichtbarkeit`, `hinweis`,
  `aktion`) werden nur mit `visibleTo: "detectives"` erzeugt.
- Weltzustandsänderungen (`umwelt`) sind `visibleTo: "both"` — der
  Ganove muss umplanen können.
- `visibleCameras(cameras, "ganove")` ist strukturell leer.

**Umsetzung:** `visibleEvents`, `visibleCameras` in
`InformationSystem.ts`.

## Polizeifunk

**Beschreibung:** Der Ganove darf einmal pro Partie den Polizeifunk
abhören und erhält die letzten `radioHintCount` Hinweise mit Typ und
Runde — inklusive Kameraauslösungen (und damit implizit deren
Positionen). Nicht enthalten: unentdeckte Kameras, kommende Ereignisse.

**Bedingungen:**
- Zweiter Aufruf wirft `MoveError "already_used"`.
- Der Funkbericht ist selbst ein `GameEvent` mit
  `visibleTo: "ganove"` — die Detektive erfahren das Abhören nicht.

**Umsetzung:** `useRadio` + `radioUsed` in `gameStore.ts`,
`radioHintSummary` in `InformationSystem.ts`.

## Hitze-Indikator

**Beschreibung:** „Polizeiaufmerksamkeit" zeigt dem Ganoven, *wie viel*
die Detektive gerade wissen — gewichtete Hinweisaktivität der letzten
3 Runden: Zonen-Hinweis +1, Kamera +2, Aktions-Spur +2,
Sichtbarkeitsereignis +3.

**Bedingungen:**
- Stufen: `score` 0 → `ruhig`, 1–2 → `aktiv`, 3–4 → `erhoeht`,
  ≥5 → `kritisch`.
- Kein Info-Leak: das Modell kennt nur gewichtete Zähler pro Runde,
  niemals Hinweisinhalte — Rückgabe ausschließlich `{ level, score }`.
- `umwelt` und `polizeifunk` tragen keine Positionsinformation und
  zählen mit Gewicht 0.
- Die Aktions-Spur (`aktion` +2) ist bereits gewichtet und zählt
  automatisch, sobald das Missionssystem solche Hinweise erzeugt.

**Umsetzung:** `heatLevel`, `HEAT_WEIGHTS`, `HEAT_WINDOW` in
`InformationSystem.ts`; Store-Selector `getHeatLevel`.

## Missions-Generierung — BFS-Kriterien

**Beschreibung:** Die Zielknoten einer Mission werden aus den
Kategorien-Pools der Karte (`diebstahl`/`kontakt`/`sabotage`/`flucht`)
gezogen und müssen **alle** folgenden, per BFS-Kantendistanz messbaren
Kriterien erfüllen — sonst wird die Ziehung verworfen
(Rejection-Sampling). Die Prüfung gilt für Generierung, benannte
„Fälle" und spielerdefinierte Missionen gleichermaßen.

**Bedingungen** (Korridore aus `settings.missionRules`):
- **Paarweiser Mindestabstand:** jedes Zielpaar ≥ `minGap` Kanten.
- **Aufeinanderfolge:** `d→k`, `k→f`, `k→s`, `s→f` jeweils ≤ `maxGap`
  (und ≥ `minGap`, durch die Paarregel abgedeckt).
- **Routen-Budget:** `Start→d→k→f` + `ACTION_ROUNDS` (3) ≤
  `routeBudget`; mit Sabotage `Start→d→k→s→f` + 3 ≤
  `routeBudgetSabotage`.
- **Flucht-Abstände:** `k→f` ≥ 4 (`FLUCHT_MIN_KONTAKT_GAP`), `d→f` ≥ 3
  (`FLUCHT_MIN_DIEBSTAHL_GAP`).
- **Sabotage-Umweg:** `k→s + s→f` ≤ `k→f + sabotageDetour`.
- **Eindeutigkeit:** kein Knoten trägt zwei Missionsrollen.

**Verhalten:**
- `generateMission` zieht und prüft, bis eine konforme Ziehung
  gefunden ist; nach `GENERATION_MAX_ATTEMPTS` ohne Erfolg folgt
  `MissionGenerationError`. Fehlt ein Pflicht-Pool
  (diebstahl/kontakt/flucht), ist der Fehler sofort fällig; ein leerer
  `sabotage`-Pool ist dagegen legal (`targets.sabotage === null` →
  kein Sabotage-Angebot).
- `auto` (Standard) fängt den Fehler und läuft missionslos weiter;
  `random` lässt ihn durchschlagen; `case`/`custom` lehnen invalide
  Ziele mit `MissionValidationError`/`GameConfigError` und allen
  Kriteriencodes ab.

**Umsetzung:** `missionCriteriaViolations`, `generateMission`,
`validateCustomTargets` in `MissionSystem.ts`; `resolveMission` in
`gameStore.ts`.

## Missions-Ablauf — feste Reihenfolge und Aktionsrunden

**Beschreibung:** Die Mission folgt zwingend der Kette
Diebstahl → Kontakt → Binärwahl (Sabotage *oder* Flucht). Betreten
eines Zielknotens ist keine Aktion — erst am freigegebenen Ziel der
laufenden Stufe kann der Ganove eine Aktionsrunde ausführen.

**Bedingungen:**
- Die Aktion ersetzt den Zug der Runde: der Ganove bleibt stehen und
  voll fangbar (Fangprüfung in der folgenden Detektivphase gilt).
- Jede ausgeführte Aktion erzeugt sofort ein `aktion`-Spur-Event mit
  exaktem `nodeId` + `details.action`, `visibleTo: "detectives"` — vor
  den Detektivzügen derselben Runde; Gewicht +2 in der Hitze.
- Nur die Aktion des **aktiven** Schritts ist ausführbar
  (`executableMissionAction`); die Umzingelungsprüfung zählt diese
  als legalen Zug.
- Nach `kontakt` mit `targets.sabotage !== null` liegt das
  Sabotage-Angebot (`pendingChoice` + `offeredEffect`); Ganovenzug
  und -aktion sind bis zur Beantwortung gesperrt
  (`mission_choice_pending`). `chooseMissionPath` ist endgültig
  (`no_mission_choice` ohne offene Wahl).
- Das Kontakt-Spur-Event verrät die Wahl nicht (kein Effekt, keine
  Knoten-IDs im Event).
- Ohne Sabotage-Pool geht die Mission vom Kontakt direkt in
  `stage "flucht"`.

**Umsetzung:** `ganoveAction`, `chooseMissionPath`, `advanceMission`
in `gameStore.ts`; `executableMissionAction`, `missionStructure` in
`MissionSystem.ts`.

## Sabotage-Effekte

**Beschreibung:** Der Informant bietet ein Sabotageziel mit einem
Effekt aus `settings.sabotageEffects` an. Standard ist der per Seed
gezogene Zufallszug (`missionRng`) — ein Fall-Katalog darf den Effekt
über `sabotageEffect` fest vorgeben; der fixierte Effekt hat dann
Vorrang vor dem Zufallszug. Die Sabotage wird als eigene
Missionsaktion am Sabotageziel ausgeführt; `wahl` und `flucht` haben
keine Aktion.

**Bedingungen:**
- `kamera_aus`: alle Kameras `active: false` — sofort und bis
  Partieende.
- `funkstille`: `hintSilenceUntilRound = round + sabotageDuration` —
  bis dahin erzeugt der Ereignis-Roll keine `hinweis`-/
  `sichtbarkeit`-Ereignisse (`umwelt` läuft weiter, Trigger feuern
  normal).
- `falsche_spur`: `falseTrailUntilRound` analog — `hinweis`-Ereignisse
  liefern eine garantiert andere Zone samt konsistentem Köder-Ball;
  formal ein normaler Zonen-Hinweis, nur falsch.
- `sabotageDuration` = `settings.eventDefaults.cycle` der Karte.
- `offeredEffect` ist Ganove-Wissen: beim Kontakt wird ein fixierter
  `sabotageEffect` des Falls (`targets.sabotageEffect`) verwendet —
  der Fall hat Vorrang; ohne Feld zieht `missionRng(seed, round)` aus
  dem Pool der Karte (eigener Salt `MISSION_RNG_SALT`).

**Umsetzung:** `applySabotageEffect`, `emitRoundEvent`,
`emitFalseTrailHint` in `gameStore.ts`.

## Missionsgebundene Flucht

**Beschreibung:** Mit Mission ist genau der gezogene
`flucht`-Zielknoten der Fluchtpunkt — `escapeNodeIds` enthält nur
ihn, die Flucht gelingt ausschließlich in `stage "flucht"` und per
normalem Zug (keine Aktionsrunde am Fluchtpunkt).

**Bedingungen:**
- Frühes Betreten des Missions-Fluchtknotens (Stufe < `flucht`) ist
  ein normaler Zug ohne `escaped`.
- Ohne Mission (`auto`-Fallback oder `none`) bleiben alle
  `flucht`-Kategorie-Knoten Fluchtpunkte.

**Umsetzung:** `escapeNodeIds`-Init und Flucht-Gating in
`moveGanove`/`startGame`.

## Fallsammlungen („Fälle") und Custom-Missionen

**Beschreibung:** Pro Karte kann `src/data/missions/<mapId>.json`
benannte Szenarien bündeln: `{ mapId, cases: [{ id, name, story,
diebstahl, kontakt, flucht, sabotage?, sabotageEffect? }] }`.
Spielerdefinierte Missionen übergeben dieselben Ziel-IDs.

**Bedingungen:**
- `mapId` muss zur Karte passen; Fall-IDs eindeutig; `id`, `name`,
  `story` nicht-leer; alle Ziel-IDs bekannte Knoten der passenden
  Kategorie; `sabotageEffect` ∈ `settings.sabotageEffects` (fixiertes
  Sabotage-Angebot — Vorrang vor dem Zufallszug, erfordert ein
  `sabotage`-Ziel im Fall).
- Fall- und Custom-Ziele werden zusätzlich gegen die
  Generierungskriterien für den tatsächlichen Start geprüft.
- Münster liefert mindestens zwei Fälle (`diebstahlserie-altstadt`,
  `kurier-am-hafen`) — die Datenintegritätssuite verifiziert jeden
  Fall für jeden möglichen Ganoven-Start.

**Umsetzung:** `validateMissionSet`, `validateCustomTargets` in
`MissionSystem.ts`; `loadMissionSet`, `getMissionCase` in
`MissionLoader.ts`; `missionData.test.ts` als Daten-Guard.

## Missionssichtbarkeit

**Beschreibung:** Detektive kennen die Missionsstruktur und die
öffentlichen Kategorien-Pools — niemals die gezogenen Zielknoten.

**Bedingungen:**
- `getMissionStructure` liefert nur `{ kind, status }` je Schritt —
  keine `targets`.
- Spur-Events tragen den Tatort (`nodeId`) und die Aktionsart, keine
  zukünftigen Ziele; die Binärwahl erscheint nicht in Events.
- `mission` (inkl. `targets`, `pendingChoice`, `offeredEffect`) ist
  Ganove-Wissen — nur das Ganove-Feld; detektivseitige Sichten gehen
  über `missionStructure`.
- Missionszielknoten sind kamerafrei (`cameraProtectedNodes` ∪
  `missionTargetIds`).

**Umsetzung:** `missionStructure` in `MissionSystem.ts`,
`getMissionStructure`/`emitInfoEvent` in `gameStore.ts`.

## Eventlog — Determinismus und Sichtbarkeit

**Beschreibung:** Jede Partie wird als JSONL-Eventlog aufgezeichnet
(`02-technisches-konzept.md` §8): `header`, sequenzierte Events,
abschließendes `result` mit Balancing-Metriken. Das Log ist die
Grundlage für Replay, Statistiken und Balancing — deshalb gelten zwei
harte Regeln.

**Bedingungen:**
- Gleicher `seed` + gleiche Eingaben müssen ein bitgleiches Log
  erzeugen — `gameId` ist deshalb deterministisch (`g-{seed}` oder
  explizit als Eingabe).
- Jeder Eintrag trägt `visibleTo` (`detectives`/`ganove`/`both`) nach
  der §1-Asymmetrie: Ganoven-`move` ist `ganove`-sichtbar,
  Detektiv-`move` `both`; Hinweis-Einträge (`hint`) `detectives`;
  Weltzustand (`umwelt`-`event`, `edge_unblock`) `both`;
  Ganoven-Interna (`action`, `sabotage_offer`, `sabotage`, `radio`)
  `ganove`; `header`/`result` `both`.

**Verhalten:**
- `result` zählt `rounds` (Runden bis Fang/Flucht/Ende), `hintsTotal`
  (Hinweis-Events aus `HINT_EVENT_KINDS`), `camerasTriggered`.
- `finish()` persistiert das Log automatisch (`localStorage`, letzte
  N = `MAX_STORED_LOGS` Partien, FIFO) — headless ohne Storage: no-op.
- `header` genügt zur Rekonstruktion des Anfangszustands:
  `startOptionsFromHeader` bildet `config`/`starts` auf
  `StartGameOptions` ab und übergibt die aufgezeichneten
  `mission`/`cameras` als `resolvedMission`/`resolvedCameras` — die
  aufgelösten Werte werden wörtlich übernommen, sodass die
  Rekonstruktion unabhängig davon ist, wie viele Züge der
  Originalstart dem gemeinsamen Seed-Strom entnommen hat.

**Umsetzung:** `Recorder.ts` (Serialisierung, Export, FIFO-Persistenz)
und die `appendLog`-Aufrufstellen in `useGameStore`.

## Persistenz — Speicherstand, Replay und Statistiken

**Beschreibung:** Laufende Partien lassen sich speichern und später
bitidentisch fortsetzen; abgeschlossene Partien können als Replay
erneut abgespielt und aggregiert ausgewertet werden
(`02-technisches-konzept.md` §8.1).

**Bedingungen:**
- Ein Speicherstand ist `Snapshot + Log + Seed`: `snapshotGame`
  kopiert den kompletten `GameData`-Bestand (inkl. `radioUsed`,
  `hintSilenceUntilRound`, `falseTrailUntilRound`, Kamera- und
  Sperrzustände, `activeDetectiveIndex`, `phase`, `tensionValue`,
  `escapeNodeIds`, `ganoveCanAct`, `roundLimit`, `eventDefaults`) —
  `map` wird über `loadMap(entry.mapId)` neu geladen, das Log reist
  als JSONL im `ResumeEntry` mit. `resumeGame` setzt beides direkt;
  der Zustand nach dem Fortsetzen ist dem gespeicherten gleich
  (vollständiger Datenvergleich in `SaveGame.test.ts`).
- Speichern ist nur bei laufender Partie erlaubt
  (`map !== null && outcome === null`); das Format ist versioniert
  (`SAVE_SCHEMA_VERSION`) — unbekannte Versionen werden beim Listen
  klar abgelehnt statt geraten interpretiert. Beim Schreiben bleiben
  Fremd-Schema-Einträge erhalten (Upsert/FIFO greifen nur auf
  `gameId`-Ebene).
- Replay ist reine Rekonstruktion: `header` + `seed` + die
  Aktoreinträge (`move`, `action`, `sabotage_offer` mit `chosen`,
  `radio`) reichen — Engine-Einträge entstehen beim Neuabspielen
  identisch. `replayTo(n)` ist deterministisch; Schritt zurück =
  Neuabspielen bis `n-1`. `startOptionsFromHeader` reicht auch
  `config.playerMode` durch, damit das abgespielte Log bitgleich
  bleibt.
- Replay-Perspektiven respektieren `visibleTo`: die Detektiv-Sicht
  enthält nie `ganove`-sichtbare Einträge und kein `ganovePosition`
  (Positionsinformation nur über das Deduktions-Overlay).
- Statistiken lesen ausschließlich `header`/`result`: Siegquote je
  Seite und je gespieltem Modus (`config.playerMode`; ohne Feld:
  „unbekannt"), Ø Runden, Ø Hinweise, Ø Kameratreffer. Logs ohne
  `result` zählen nicht.

**Umsetzung:** `SaveGame.ts` (Snapshot, `buildResumeEntry`,
Validierung), `GameIndex.ts` (`RESUME_STORAGE_KEY`,
Upsert+`MAX_RESUME_ENTRIES`-FIFO, `deleteResumeEntry`),
`ReplayPlayer.ts` (`openReplay`, `replayTo`, `ReplayDriver`),
`Statistics.ts` (`aggregateStatistics`), `gameStore.resumeGame`.

## Deduktion — konsistente Positionshistorien

**Beschreibung:** Die Detektivseite errechnet aus allen bekannten
Hinweisen die Menge der möglichen Ganoven-Positionen. Grundlage ist
`01-spielkonzept.md` §6 (Deduktionswerkzeuge): nicht Punktmengen pro
Runde, sondern **Historien** — eine Position zählt nur, wenn sie über
einen Kantenzug (oder `aktion`-Verharren) aus einer Position der
Vor-Runde erreichbar ist.

**Bedingungen:**
- `camera`/`sichtbarkeit`/`aktion` pinnen die Position auf den Knoten
  der jeweiligen Runde; `hinweis` schneidet mit dem gemeldeten
  Zonenball.
- Verharren ist nur mit `aktion`-Spur möglich (Zugzwang).
- Bewegungsrunde ohne Kameratreffer → keine aktive Kamera betreten
  (Negativ-Schluss); in `aktion`-Runden entfällt der Schluss.
- `umwelt`-Sperrungen wirken erst ab der Folgerunde (Ereignis feuert
  nach dem Ganovenzug).
- Detektiv-belegte Knoten sind ausgeschlossen; der Spawn-Prior ist die
  öffentliche `ganoveSpawnChoices`-Menge.
- `falsche_spur` verfälscht bewusst — die Korrektheitsgarantie
  (Ganovenposition nie falsch ausgeschlossen) gilt für unverfälschte
  Hinweise; Monotonie: mehr Hinweise → nie mehr Kandidaten.

**Umsetzung:** `Deduction.ts` (`deducePossiblePositions`,
`lastHintAnchor`).

## KI — Detektiv-Trupp und Ganove

**Beschreibung:** `DetectiveAI` steuert den gesamten Trupp koordiniert;
`GanoveAI` führt die Mission. Beide arbeiten nur auf gefilterten
Sichten — die Informationsasymmetrie aus §1 ist strukturell, nicht
konventionell.

**Bedingungen:**
- `DetectiveView` enthält keine Ganovenposition und keine
  Missionszielknoten (nur `missionStructure` mit Stufen-Stati).
- Detektiv-Heuristik: Summe der Mindestdistanzen über die Glaubensmenge
  minimieren → automatische Aufteilung/Einkreisung; letzter Hinweis als
  Anker; leere Menge → Hinweisbereich ansteuern.
- `GanoveView` sieht Detektivpositionen, eigene Mission, Hitze und
  eigene Events; Kameras sind unbekannt bis der Funk sie meldet.
- Aktion nur bei sicherem Abstand (`SAFE_ACTION_GAP`) und Hitze unter
  `kritisch`, außer die Deadline erzwingt sie; Züge meiden Nähe
  (`MOVE_SAFE_GAP`), bekannte Kameras und ausweglose Knoten; auf der
  letzten Etappe wird committed.
- `chooseSabotagePath` akzeptiert die Sabotage, wenn der BFS-Umweg das
  `sabotageDetour`-Budget einhält und die Hitze nicht `kritisch` ist.
- Beide KIs deterministisch — Zufall nur über den zentralen `Rng`.

**Umsetzung:** `DetectiveAI.ts`, `GanoveAI.ts`.

## KI-vs.-KI-Simulation

**Beschreibung:** Headless-Batchtreiber (`02-technisches-konzept.md` §7
und §8): `runAiGame` spielt eine komplette Partie über den regulären
Store, `runAiBatch` Serien über Seed-Listen, `summarizeBatch`
aggregiert Balancing-Metriken.

**Bedingungen:**
- Jede Partie endet regulär (`caught`/`surrounded`/`escaped`/`timeout`)
  oder als `draw` über das Sicherheitsnetz (`maxRounds`/`MAX_TURNS`).
- Jede Partie erzeugt ein vollständiges JSONL-Eventlog; gleicher Seed →
  bitgleiches Log.
- Aggregation: Outcome-Verteilung, Runden (Ø/min/max), Hinweise/Partie,
  Kameratreffer/Partie, Sabotage-Annahmequote, Radio-Quote.
- CLI: `npm run sim` (`scripts/sim.ts`) mit `--map`, `--games`,
  `--seed-start`/`--seeds`, `--detectives`, `--round-limit`,
  `--mission`, `--out`.

**Umsetzung:** `AiSimulation.ts`, `scripts/sim.ts`,
`vite.sim.config.ts`, `sim`-Script in `package.json`.
