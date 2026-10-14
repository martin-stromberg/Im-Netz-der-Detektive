# Datenmodell — Persistenz & Replay

## `GameState` / `GameData`
Datei: `src/state/gameStore.ts`

| Feld | Typ | Beschreibung / Zweck |
|------|-----|----------------------|
| `map` | `MapPack \| null` | Kartenpaket (reine JSON-Daten, `loadMap(id)` lädt es erneut) |
| `round` | `number` | aktuelle Runde |
| `phase` | `GamePhase` (`"ganove"`/`"detektive"`) | Phasenmaschine |
| `activeDetectiveIndex` | `number` | aktiver Detektiv in der Detektivphase |
| `ganovePosition` | `string \| null` | Ganovenposition (nur Ganove-/Engine-Sicht) |
| `detektivePositions` | `string[]` | Detektivpositionen |
| `mission` | `Mission \| null` | `id`, `name?`, `story?`, `targets`, `stage`, `pendingChoice`, `offeredEffect`, `appliedEffect` — alles JSON-serialisierbar |
| `events` | `GameEvent[]` | Info-Layer-Ereignisse mit `visibleTo` |
| `cameras` | `Camera[]` (`{nodeId, active}`) | Kamerazustand inkl. Deaktivierung |
| `blockedEdges` | `BlockedEdge[]` (`{a,b,untilRound}`) | `umwelt`-Sperrungen |
| `eventMode` / `eventDefaults` | `EventMode` / `EventDefaults` | Ereignisauslösung |
| `tensionValue` | `number` | Tension-Zähler (Hitze-Fenster des Ereignismodus) |
| `seed` | `number` | Spiel-Seed |
| `log` | `LogEntry[]` | vollständiges Eventlog (header+events+result) |
| `outcome` | `GameOutcome \| null` | `null` = laufend |
| `roundLimit` | `number \| null` | effektives Rundenlimit |
| `escapeNodeIds` | `string[]` | Flucht-/missionsgebundene Endpunkte |
| `ganoveCanAct` | `boolean` | Aktionsflag (Test-Hook) |
| `radioUsed` | `boolean` | Polizeifunk einmalig verbraucht |
| `radioHintCount` | `number` | effektive Funk-Tiefe |
| `edgeBlockRounds` | `number` | effektive Sperrdauer |
| `hintSilenceUntilRound` | `number` | `funkstille`-Fenster |
| `falseTrailUntilRound` | `number` | `falsche_spur`-Fenster |

`GameData = Omit<GameState, …Methoden…>` — bereits als Typ vorbereitet;
alle Felder sind JSON-serialisierbar (keine Funktionen, kein `Rng` im
State — RNG wird pro Zug aus `seed`/`round` neu abgeleitet).

## `LogEntry` / `LogInput`
Datei: `src/state/gameStore.ts`

| Eigenschaft | Typ | Zweck |
|-------------|-----|-------|
| `seq` | `number` | 0 für `header`, 1..n für Events |
| `round` | `number` | Spielrunde |
| `type` | `string` | `header`/`move`/`action`/`hint`/`event`/`sabotage_offer`/`sabotage`/`edge_unblock`/`radio`/`result` |
| `visibleTo` | `Visibility` | `detectives`/`ganove`/`both` |
| weitere Felder | `unknown` | `actor`, `from`, `to`, `edgeType`, `kind`, `node`, `zone`, `nodeIds`, `edge`, `untilRound`, `offered`, `chosen`, `action`, `hintCount`, `outcome`, `rounds`, `hintsTotal`, `camerasTriggered`, `gameId`, `mapId`, `seed`, `config`, `mission`, `cameras`, `starts` |

**Aktoreinträge** (durch Spieler/KI ausgelöst, für Replay relevant):
`move` (actor ganove/detective), `action`, `sabotage_offer` **mit**
`chosen`, `radio`. **Engine-Einträge** (werden beim Replay neu erzeugt):
`hint`, `event`, `edge_unblock`, `sabotage`, `sabotage_offer` ohne
`chosen` (Angebot), `result`.

## `ResumeEntry`
Datei: `src/logic/GameIndex.ts`

| Eigenschaft | Typ | Zweck |
|-------------|-----|-------|
| `gameId` | `string` | Partie-Kennung |
| `mapId` | `string` | Karte (für `loadMap`) |
| `seed` | `number` | Seed |
| `options` | `StartGameOptions` | komplette Startkonfiguration |
| `savedAt` | `string` | ISO-8601-Zeitpunkt |
| `log` | `string` | JSONL bis zum Speicherpunkt (ohne `result`) |

**Fehlt für Schritt 12:** `schema` (Versionsfeld — Kundenvorgabe),
`mode` (gespielte Perspektive für die Fortsetzen-Ansicht) und der
**State-Snapshot** (Spec §8.1: „Speicherstand = State-Snapshot + Log +
Seed" — das Feld fehlt in der vorgesehenen Struktur).

`RESUME_STORAGE_KEY = "im-netz-der-detektive:resume-entries"`;
`listResumeEntries` liest die Liste (Filterung auf Pflichtfelder
vorhanden, aktuell immer leer — kein Schreibpfad).

## `GameSummary`
Datei: `src/logic/GameIndex.ts`

`{gameId, mapId, seed, outcome, rounds, hintsTotal, camerasTriggered}` —
aus header+result abgeleitet; **kein Modus/Perspektive-Feld**.

## `MapPack`
Datei: `src/logic/mapPack.ts`

Reine JSON-Daten (`id`, `name`, `viewBox`, `nodes`, `edges`,
`spawnRules`, `settings`) — `loadMap(id)` lädt synchron aus dem Bundle;
die Karte selbst muss nicht im Snapshot liegen (nur `mapId`).

## `GameEvent`, `Camera`, `Visibility`
Datei: `src/logic/InformationSystem.ts`

`visibleTo: "detectives" | "ganove" | "both"` — Datenebenen-Filter via
`visibleEvents`/`visibleCameras`; `HINT_EVENT_KINDS` für
Hinweis-Metriken; `radioHintSummary` für den Polizeifunk.
