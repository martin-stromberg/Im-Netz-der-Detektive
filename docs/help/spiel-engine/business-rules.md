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
