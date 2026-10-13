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
