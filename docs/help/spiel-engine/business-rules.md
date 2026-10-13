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
