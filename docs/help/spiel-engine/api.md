← [Zurück zur Übersicht](index.md)

# Spiel-Engine — API

## Übersicht

Die Engine besteht aus reinen Funktionsmodulen unter `src/logic/` und
dem Zustand-Store unter `src/state/`. Alle Module sind React-frei und
deterministisch; Zufall kommt ausschließlich aus `createRng(seed)`
(`Math.random()` ist in `src/logic/` per Git-Hook verboten).

## Authentifizierung

Keine — lokale Modul-API.

## Rate Limiting

Keine.

## Endpunkte / Methoden

### `rng.ts` — `createRng(seed: number): Rng`

**Beschreibung:** Erzeugt den zentralen Seeded-RNG (mulberry32).
Gleicher `seed` → identische Folge.

**Rückgabe:**

| Typ | Beschreibung |
|-----|--------------|
| `Rng` | `{ next(): number`, `nextInt(minInclusive, maxExclusive): number`, `pick<T>(items): T`, `shuffle<T>(items): T[] }` |

**Fehler:**

| Exception | Ursache |
|-----------|---------|
| `RangeError` | `nextInt` mit leerem Bereich; `pick` auf leerer Liste |

### `mapPack.ts` — `validateMapPack(data: unknown): MapPack`

**Beschreibung:** Validiert Roh-JSON vollständig gegen das
Kartenpaket-Schema (Spiegel von `.githooks/map-schema-check.py`) und
gibt es als `MapPack` getypt zurück.

**Fehler:**

| Exception | Ursache |
|-----------|---------|
| `MapValidationError` | beliebige Schema-Verletzung; `errors` enthält **alle** Funde im Format `pfad: meldung` |

### `MapLoader.ts` — `loadMap(id: string): MapPack`

**Beschreibung:** Lädt das gebündelte Paket `src/data/maps/<id>.json`
(synchron, via `import.meta.glob`) und validiert es.

**Fehler:**

| Exception | Ursache |
|-----------|---------|
| `MapValidationError` | unbekannte `id` (Meldung enthält `listMapIds()`); Schema-Verletzung des Pakets |

### `MapLoader.ts` — `listMapIds(): string[]`

**Beschreibung:** Sortierte IDs aller gebündelten Kartenpakete.

### `Graph.ts` — `buildGraph(map: MapPack): Graph`

**Beschreibung:** Ungerichteter, ungewichteter Graph aus `edges[]`
(`cost` reserviert/ignoriert).

### `Graph.ts` — `neighbors(graph, nodeId): string[]`

**Beschreibung:** Direkte Nachbar-IDs; leer für unbekannte Knoten.

### `Graph.ts` — `bfsDistances(graph, from): Map<string, number>`

**Beschreibung:** BFS-Kantendistanzen zu allen erreichbaren Knoten;
`from` → `0`, Unerreichbare/Unbekannte fehlen.

### `Graph.ts` — `distance(graph, from, to): number`

**Beschreibung:** Kantendistanz; `0` bei identischen Knoten,
`Infinity` bei Nichterreichbarkeit oder unbekannten IDs.

### `SpawnSystem.ts`

| Methode | Beschreibung |
|---------|--------------|
| `spawnSequence(map, detectiveCount?)` | Platzierreihenfolge: alle Detektive vor `"ganove"` |
| `detectiveSpawnChoices(map)` | Kandidaten für Detektive (`choice` → `nodes`/`zones`, sonst alle Knoten) |
| `ganoveSpawnChoices(map, detectivePositions)` | Kandidaten für den Ganoven, um `minDistanceToDetective` (BFS) gefiltert |
| `pickDetectiveSpawns(map, rng, count)` | deterministische Vergabe ohne Wiederholung (Pool füllt sich bei Bedarf nach) |
| `pickGanoveSpawn(map, rng, detectivePositions)` | deterministischer Ganoven-Start; `SpawnError` bei leerer Kandidatenmenge |
| `assignSpawns(map, rng, detectiveCount?)` | vollständige Aufstellung in `spawnSequence`-Reihenfolge |

**Fehler:**

| Exception | Ursache |
|-----------|---------|
| `SpawnError` | `choice` ohne auflösbare Kandidaten; kein Ganoven-Kandidat erfüllt `minDistanceToDetective`; vom Store übergebene Position verletzt die Startregeln |

### `Movement.ts` — Bewegungsregeln (rein, deterministisch)

`MoveContext` = `{ graph, round, blockedEdges, ganovePosition,
detektivePositions }`; `MoveTarget` = `{ nodeId, edgeType }`.

| Methode | Beschreibung |
|---------|--------------|
| `isEdgeBlocked(a, b, blockedEdges, round)` | `true`, wenn die Kante `a`–`b` in `round` gesperrt ist (`untilRound >= round`, beide Richtungen) |
| `legalMovesFrom(ctx, nodeId)` | ungesperrte Nachbarziele inkl. `edgeType`; eigener Knoten nie enthalten (Zugzwang) |
| `legalGanoveMoves(ctx)` | `legalMovesFrom` abzüglich Detektiv-besetzter Knoten |
| `legalDetectiveMoves(ctx, detectiveIndex)` | `legalMovesFrom` des Detektivs — besetzte Knoten bleiben legal (Teilen); `[]` bei ungültigem Index |
| `validateGanoveMove(ctx, target)` | liefert `MoveTarget` oder wirft `MoveError` (`stay_forbidden`/`not_adjacent`/`blocked_edge`/`occupied`) |
| `validateDetectiveMove(ctx, detectiveIndex, target)` | wie oben plus `not_active_detective`; ohne `occupied` |
| `mapEscapeNodeIds(map)` | IDs aller Knoten mit Kategorie `flucht` |

`MoveError.reason` ist ein maschinenlesbarer `MoveRejection`-Code
(`no_game`, `game_over`, `wrong_phase`, `not_active_detective`,
`stay_forbidden`, `not_adjacent`, `blocked_edge`, `occupied`,
`no_action_available`, `already_used`).

### `CameraSystem.ts` — Kameraplatzierung und -auslösung (rein)

| Methode | Beschreibung |
|---------|--------------|
| `placeCameras(graph, rng, count, minGap, protectedNodeIds?)` | verteilt bis zu `count` Kameras; jede hält `minGap` BFS-Kanten Abstand zu allen anderen; `protectedNodeIds` sind tabu; bestmögliche Platzierung bei knapper Karte |
| `triggeredCamera(cameras, nodeId)` | aktive Kamera auf `nodeId` oder `undefined` |
| `deactivateAll(cameras)` | Kopie mit allen Kameras `active: false` (Sabotage-Hook `kamera_aus`) |

### `EreignisEngine.ts` — Auslösemodi und Ereignistypen (rein)

| Methode | Beschreibung |
|---------|--------------|
| `rollTrigger(mode, round, tensionValue, defaults, rng)` | `{ fires, tensionValue }` — `cycle`: `round % cycle === 0`; `chance`: `next() < chance`; `tension`: `+perRound`, Auslösung `>= threshold`, Reset |
| `drawEventType(mix, rng)` | gewichteter Typzug: `"sichtbarkeit" \| "hinweis" \| "umwelt"` |
| `zoneHint(position, map, graph, radius)` | `{ zone, nodeIds }` — Zone des Ganove-Knotens + BFS-Ball im Radius; `null` bei unbekannter Position |
| `pickBlockableEdge(graph, edges, blockedEdges, round, rng)` | zufällige Kante, deren Sperrung den Restgraphen (abzüglich aktiver Sperren) zusammenhängend lässt; `null`, wenn keine Kandidatin existiert |

### `MissionSystem.ts` — Missionen (rein, deterministisch)

Typen: `MissionKind` (`diebstahl`/`kontakt`/`sabotage`/`flucht`),
`MissionStage` (`diebstahl`/`kontakt`/`wahl`/`sabotage`/`flucht`),
`MissionTargets` (`sabotage: string | null`), `MissionCase`
(`id`, `name`, `story`, Ziel-IDs, optionales `sabotageEffect`),
`MissionSet`, `MissionStructureStep`. Konstanten: `ACTION_ROUNDS` (3),
`FLUCHT_MIN_KONTAKT_GAP` (4), `FLUCHT_MIN_DIEBSTAHL_GAP` (3),
`GENERATION_MAX_ATTEMPTS`. Fehler: `MissionGenerationError`,
`MissionValidationError` (`errors[]`).

| Methode | Beschreibung |
|---------|--------------|
| `nodesByCategory(map, category)` | Pool aller Knoten mit Kategorie |
| `missionTargetIds(targets)` | gesetzte Ziel-IDs (für Kamera-Ausschluss) |
| `missionCriteriaViolations(graph, rules, targets, start)` | `string[]` der Verstöße (`min_gap`/`max_gap`/`flucht_*_gap`/`sabotage_detour`/`route_budget*`), `[]` = konform |
| `generateMission(map, graph, start, rng, maxAttempts?)` | Rejection-Sampling bis Kriterien erfüllt; `MissionGenerationError` bei leerem Pool/Budget |
| `validateCustomTargets(map, graph, targets, start)` | Befundliste (Kategorie, Duplikate, Kriterien); `[]` = gültig |
| `validateMissionSet(data, map)` | Schema-Prüfung eines Missionsets → `MissionSet` oder `MissionValidationError` |
| `caseTargets(entry)` | `MissionCase` → `MissionTargets` |
| `executableMissionAction(mission, position)` | ausführbare `MissionKind` an Position/Stufe oder `null` |
| `missionStructure(mission)` | detektivsichere Stufenliste `{kind, status}` — niemals Knoten-IDs |
| `drawSabotageEffect(map, rng)` | Effekt aus `settings.sabotageEffects` |
| `sabotageDuration(map)` | Fensterlänge = `eventDefaults.cycle` |

### `MissionLoader.ts` — Fallsammlungen (rein)

| Methode | Beschreibung |
|---------|--------------|
| `loadMissionSet(map)` | lädt `src/data/missions/<map.id>.json` synchron und validiert es; `MissionValidationError` bei fehlendem/ungültigem Set |
| `listMissionSetIds()` | IDs aller gebündelten Sets |
| `hasMissionSet(mapId)` | ob ein Set gebündelt ist |
| `getMissionCase(set, caseId)` | Fall auflösen; `MissionValidationError` nennt verfügbare IDs |

### `InformationSystem.ts` — Verteilung, Funk, Hitze (rein)

Typen: `GameEvent` (`kind`, `round`, `nodeId?`, `zone?`, `nodeIds?`,
`edge?`, `untilRound?`, `visibleTo`, `details?`), `GameEventKind`
(`camera`/`sichtbarkeit`/`hinweis`/`umwelt`/`aktion`/`polizeifunk`),
`Camera`, `RadioHint`, `HeatLevel` (`ruhig`/`aktiv`/`erhoeht`/`kritisch`),
`Visibility` (`detectives`/`ganove`/`both`).

| Methode | Beschreibung |
|---------|--------------|
| `visibleEvents(events, side)` | Events mit `visibleTo ∈ {side, "both"}` — datenseitige Asymmetrie |
| `visibleCameras(cameras, side)` | alle für `detectives`, `[]` für `ganove` |
| `radioHintSummary(events, count)` | letzte `count` Events aus `HINT_EVENT_KINDS` (`camera`, `sichtbarkeit`, `hinweis`, `aktion`) als `RadioHint[]` |
| `revealedGanovePosition(events, round)` | `nodeId` eines `sichtbarkeit`-Events nur in seiner Auslöserunde, sonst `null` |
| `heatLevel(events, round)` | `{ level, score }` — `HEAT_WEIGHTS`-Summe (`hinweis` 1, `camera` 2, `aktion` 2, `sichtbarkeit` 3) über die letzten `HEAT_WINDOW` (3) Runden → `ruhig`/`aktiv`/`erhoeht`/`kritisch` |

### `useGameStore` (`src/state/gameStore.ts`) — State-Felder

| Feld | Typ | Bedeutung |
|------|-----|-----------|
| `map` | `MapPack \| null` | geladenes Kartenpaket |
| `round` | `number` | aktuelle Runde, Start `1` |
| `phase` | `"ganove" \| "detektive"` | aktive Rundenphase |
| `activeDetectiveIndex` | `number` | Zugindex innerhalb der Detektivphase |
| `ganovePosition` | `string \| null` | Knoten-ID des Ganoven |
| `detektivePositions` | `string[]` | Knoten-IDs der Detektive |
| `mission` | `Mission \| null` | `{ id, name?, story?, targets, stage, pendingChoice, offeredEffect, appliedEffect }` — `targets` ist Ganove-Wissen |
| `events` | `GameEvent[]` | eingetragene Ereignisse/Hinweise |
| `cameras` | `Camera[]` | `{ nodeId, active }` |
| `blockedEdges` | `BlockedEdge[]` | `{ a, b, untilRound }` (inklusive) |
| `eventMode` | `EventMode` | `cycle`/`chance`/`tension` |
| `tensionValue` | `number` | Spannungswert für `tension`-Modus |
| `seed` | `number` | Seed der laufenden Partie |
| `log` | `LogEntry[]` | das JSONL-Eventlog in Arbeit — flache Einträge `{seq, round, type, visibleTo, …}` (Header trägt `seq: 0`); Serialisierung via `Recorder.serializeLog` |
| `outcome` | `GameOutcome \| null` | `caught`/`surrounded`/`escaped`/`timeout`/`draw`; `null` solange die Partie läuft |
| `roundLimit` | `number \| null` | effektives Rundenlimit; `null` = unbegrenzt |
| `escapeNodeIds` | `string[]` | Fluchtpunkte — mit Mission genau `[mission.targets.flucht]`, ohne Mission alle `flucht`-Kategorie-Knoten; manuell via `setEscapeNodeIds` |
| `ganoveCanAct` | `boolean` | Hook für generische Aktionsverfügbarkeit; Missionsaktionen laufen über `executableMissionAction` |
| `hintSilenceUntilRound` | `number` | `funkstille`-Fenster (inkl.): keine hinweisgebenden Ereignisse bis zu dieser Runde |
| `falseTrailUntilRound` | `number` | `falsche_spur`-Fenster (inkl.): Zonen-Hinweise werden verfälscht |
| `radioUsed` | `boolean` | Polizeifunk bereits abgehört (1×/Partie) |
| `radioHintCount` | `number` | effektive Funk-Tiefe (aus `settings.radioHintCount` bzw. Option) |
| `edgeBlockRounds` | `number` | effektive `umwelt`-Sperrdauer in Runden |

### `useGameStore` — Actions

| Action | Wirkung |
|--------|---------|
| `startGame(map, seed, options?)` | setzt Map/Seed/`eventMode`, vergibt Startpositionen (explizite `detectivePositions`/`ganovePosition` werden gegen `SpawnSystem` validiert, fehlende per `createRng(seed)` ergänzt), löst `roundLimit` aus `options.roundLimit` bzw. `settings.roundLimit.suggested` auf (`null` nur bei `unlimited`), löst `cameraCount`/`radioHintCount`/`edgeBlockRounds` gegen die Map-Korridore auf (`GameConfigError`), löst `options.mission` auf (`"auto"` Standard, `"random"`, `"none"`, `{type:"case",id}`, `{type:"custom",targets}`), platziert die Kameras via `placeCameras` (`cameraProtectedNodes` ∪ Missionsziele bleiben frei), initialisiert `escapeNodeIds` missionsgebunden (mit Mission: `[targets.flucht]`; ohne: Kategorie `flucht`), schreibt den `header`-Logeintrag (`gameId` aus `options.gameId` bzw. `g-{seed}`, `mapId`, `seed`, `config` mit allen effektiven Werten, `mission` inkl. `story`, `cameras`, `starts`) und prüft die initiale Umzingelung. Rekonstruktionspfad: `options.resolvedMission` (`RecordedMission \| null`) und `options.resolvedCameras` (`string[]`) übernehmen die aufgezeichneten Werte wörtlich — keine RNG-Züge, `GameConfigError` bei unbekannten Knoten |
| `useRadio()` | Polizeifunk: hängt ein `polizeifunk`-Event (`visibleTo: "ganove"`) mit den letzten `radioHintCount` Hinweisen (inkl. Kameratreffern) an; `MoveError "already_used"` beim zweiten Aufruf |
| `deactivateCameras()` | setzt alle Kameras `active: false` (Sabotage-Hook) |
| `getHeatLevel()` | `{ level, score }` des Hitze-Indikators (3-Runden-Fenster, gewichtet — ohne Hinweisinhalte) |
| `resetGame()` | setzt den kompletten Daten-Zustand zurück |
| `resumeGame(map, snapshot, log)` | „Partie fortsetzen": stellt einen gespeicherten Spielstand wieder her — `map` aus `loadMap(entry.mapId)`, `snapshot` (`GameStateSnapshot` = alle Datenfelder außer `map`/`log`) und das geparste Log des `ResumeEntry`; fehlende Felder fallen auf `initialData()` zurück |
| `appendLog(entry)` | hängt einen flachen `LogInput`-Eintrag (`{round, type, visibleTo, …}`) mit auto-`seq` an (`header` → `seq: 0`, sonst laufende Nummer der Ereignisse) |
| `exportGameLog()` | „Partie exportieren": liefert das Log als `Blob` (`application/x-ndjson`) und löst — sofern ein DOM vorhanden ist — den Datei-Download aus (`Recorder.exportGameLog`) |
| `moveGanove(target)` | validierter Ganovenzug (`MoveError` bei Regelverstoß; `mission_choice_pending` bei offener Binärwahl); Missions-Fluchtpunkt in `stage "flucht"` → `outcome "escaped"`, sonst Kameraprüfung + Ereignis-Roll, dann Detektivphase |
| `moveDetective(target)` | Zug des aktiven Detektivs; Sofort-Fangprüfung (`outcome "caught"` mitten in der Phase); letzter Detektiv → Rundenende |
| `ganoveAction()` | Missions-Aktionsrunde (Zugzwang-Ausnahme): `executableMissionAction` am freigegebenen Zielknoten — Ganove bleibt stehen und fangbar, `aktion`-Spur-Event vor der Detektivphase, Stufenfortschritt (Kontakt → Sabotage-Angebot mit gezogenem Effekt; Sabotage → Effektanwendung) |
| `chooseMissionPath(choice)` | beantwortet das Sabotage-Angebot endgültig (`"sabotage"`/`"flucht"`); `MoveError "no_mission_choice"` ohne offene Wahl |
| `getMissionAction()` | aktuell ausführbare Missionsaktion (Ganove-Sicht) oder `null` |
| `getMissionStructure()` | detektivsichere Missionsstruktur `{kind, status}[]` — nie Zielknoten-IDs |
| `abortAsDraw()` | beendet die laufende Partie als `outcome "draw"` |
| `getLegalGanoveMoves()` / `getLegalDetectiveMoves()` | legale Ziele (`MoveTarget[]`) des Ganoven / des aktiven Detektivs; `[]` außerhalb der jeweiligen Phase oder nach Spielende |
| `setEscapeNodeIds(ids)` | überschreibt die Fluchtpunktliste (missionsgebundene Flucht); `GameConfigError` bei unbekannten IDs |
| `setGanoveCanAct(flag)` | Missionssystem-Hook für die Aktionsverfügbarkeit |
| `endGanovePhase()` | `phase` → `detektive`, `activeDetectiveIndex` → `0` (No-Op außerhalb) |
| `advanceDetective()` | `activeDetectiveIndex` +1 (nur in `detektive`-Phase) |
| `endDetectivePhase()` | Rundenende-Sequenz: Timeout (`round >= roundLimit` → `outcome "timeout"`), sonst `round` +1, Kanten-Ablauf, Umzingelungsprüfung |
| `setMission(mission)` | Mission setzen/löschen |
| `addEvent(event)` | Ereignis an `events` anhängen |
| `setCameras(nodeIds)` | Kameras (aktiv) auf Knoten setzen |
| `blockEdge(a, b, untilRound)` | Kante bis `untilRound` sperren |
| `unblockExpiredEdges()` | abgelaufene Sperrungen (`untilRound < round`) entfernen |
| `setTension(value)` | `tensionValue` setzen |
| `setEventMode(mode)` | `eventMode` setzen |

**Beispiel (headless):**

```ts
const map = loadMap("teststadt");
useGameStore.getState().startGame(map, 42);
useGameStore.getState().moveGanove("c");          // Ganovenphase Runde 1
useGameStore.getState().moveDetective("b");       // D1
useGameStore.getState().moveDetective("h");       // letzter Detektiv -> Runde 2
// ... bis outcome !== null: "caught" | "surrounded" | "escaped" | "timeout" | "draw"
```

### `Recorder.ts` — JSONL-Eventlog, Export, Persistenz

**Beschreibung:** Aufzeichnung gemäß `02-technisches-konzept.md` §8.
`useGameStore.log` ist ein event-sourced Log: eine `header`-Zeile
(`gameId`, `mapId`, `seed`, `config`, `mission`, `cameras`, `starts`),
danach sequenzierte Events (`seq`, `round`, `type`, `visibleTo`, …) für
Startaufstellung, Züge (inkl. `edgeType`), Kameraauslösungen,
Ereignisse je Typ (`sichtbarkeit`/`hinweis`/`umwelt`), Ablauf von
Kantensperrungen (`edge_unblock`), Aktionsausführungen und -Spuren,
Sabotage-Angebot und -Wahl (`sabotage_offer`, die Wahl trägt `chosen`),
Polizeifunk-Einsatz (`radio`) — abgeschlossen von einer `result`-Zeile
mit `outcome` (inkl. `"draw"`) und Balancing-Metriken (`rounds`,
`hintsTotal`, `camerasTriggered`). Gleicher Seed + gleiche Eingaben →
bitgleiches Log.

Die Browsergrenze ist injizierbar: `localStorage`- und Download-Zugriffe
laufen nur, wenn `window`/`document` existieren, oder über übergebene
Implementierungen (`StorageLike`, `LogDownloader`).

| Methode / Konstante | Beschreibung |
|---------------------|--------------|
| `serializeLog(log)` / `serializeLogEntry(entry)` | Log bzw. Eintrag als JSONL — `header` ohne `seq`/`round` |
| `parseLog(jsonl)` | JSONL-Text zurück in Eintrags-Objekte |
| `headerFromLog(log)` | der `header`-Eintrag oder `undefined` |
| `startOptionsFromHeader(header)` | `{mapId, seed, options}` — `startGame`-Eingaben für die Rekonstruktion des Anfangszustands; die aufgezeichneten `mission`/`cameras` werden als `resolvedMission`/`resolvedCameras` wörtlich übernommen (keine RNG-Neuziehung, identischer Zustand für alle Spawn-/Missionskombinationen); `TypeError` bei Nicht-Header |
| `saveGameLog(log, {storage?, maxLogs?})` | hängt die serialisierte Partie an den `localStorage`-Bestand (FIFO, `MAX_STORED_LOGS` = 10); `null` ohne Storage; Schreibfehler werden geschluckt |
| `listGameLogs(storage?)` | vorgehaltene JSONL-Logs, älteste → neueste |
| `getGameLog(index, storage?)` | einzelnes JSONL an Position `index` der `listGameLogs`-Reihenfolge (Replay-Zugriff); `null` außerhalb des Bereichs |
| `deleteGameLog(index, storage?)` | entfernt das Log an Position `index` (`gameId` ist nicht eindeutig, daher positionsbasiert); No-Op außerhalb des Bereichs |
| `clearGameLogs(storage?)` | entfernt den Bestand (`LOG_STORAGE_KEY`) |
| `exportGameLog(log, {filename?, download?})` | `Blob` (`application/x-ndjson`) + Download-Auslösung (Default: DOM-Anker); Dateiname `im-netz-der-detektive-{gameId}.jsonl` |
| `LOG_STORAGE_KEY` | `"im-netz-der-detektive:game-logs"` |

**Auto-Persist:** `finish()` (Partieende) ruft `saveGameLog` auf — die
letzten N Partien bleiben sitzungsübergreifend verfügbar, ohne dass
headless Läufe etwas schreiben. `startGame`-Option `autoPersist: false`
unterdrückt den Schreibzugriff für diese eine Partie — der Replay-Pfad
(`replayTo`) nutzt ihn, damit ein abgespieltes Log nicht als Duplikat
erneut im FIFO landet; `startGame`/`resetGame`/`resumeGame` stellen den
Normalzustand wieder her.

### `SaveGame.ts` — Speicherstand (Snapshot + Log + Seed)

**Beschreibung:** „Partie speichern/fortsetzen" (`02-technisches-
konzept.md` §8.1): Ein `ResumeEntry` friert eine laufende Partie als
versionierten Datensatz ein — `schema` (`SAVE_SCHEMA_VERSION`),
`gameId`, `mapId`, `seed`, gespielte `mode`-Perspektive,
`options` (aus dem Header rekonstruiert), `savedAt`, das Log als
JSONL und den `GameStateSnapshot` (alle `GameData`-Felder außer `map`
und `log`; `map` wird beim Fortsetzen via `loadMap` erneut geladen).

| Methode / Konstante | Beschreibung |
|---------------------|--------------|
| `SAVE_SCHEMA_VERSION` | Formatversion des `ResumeEntry`; unbekannte Versionen werden beim Listen klar abgelehnt |
| `snapshotGame(state)` | tiefe JSON-Kopie des Datenbestands ohne `map`/`log` — kein Aliasing mit dem Live-Zustand |
| `gameIdOf(state)` | `gameId` aus dem Log-Header (`null` ohne Header) |
| `buildResumeEntry(state, mode, savedAt?)` | kompletter `ResumeEntry` aus dem Live-State; `null` ohne laufende Partie (`map === null`) oder nach `outcome` |
| `isValidResumeEntry(entry)` | strukturelle Validierung: Schema-Match plus Pflichtfelder des Snapshots (`round`, `phase`, `activeDetectiveIndex`, `detektivePositions`, `events`, `cameras`, `blockedEdges`, `seed`) |
| `resumeLogEntries(entry)` | geparstes Log des Eintrags — Header-Zeile erhält die In-Memory-Defaults `seq: 0`/`round: 0` zurück (bitgleicher Zustand) |

### `GameIndex.ts` — Log-Index und Resume-Verwaltung

**Beschreibung:** Menü-Datenschicht über dem `Recorder`-FIFO
(`listGameSummaries`, `summarizeLog`) plus die Speicherstand-
Verwaltung unter `RESUME_STORAGE_KEY`.

| Methode / Konstante | Beschreibung |
|---------------------|--------------|
| `listResumeEntries(storage?)` | gespeicherte Stände, neueste zuerst — nur Einträge der aktuellen `SAVE_SCHEMA_VERSION` mit gültigem Snapshot |
| `saveResumeEntry(entry, storage?)` | Upsert per `gameId` (erneutes Speichern ersetzt den alten Stand), FIFO-Limit `MAX_RESUME_ENTRIES` = 10; Einträge fremder Schema-Versionen bleiben beim Schreiben erhalten |
| `deleteResumeEntry(gameId, storage?)` | entfernt genau den Eintrag mit dieser `gameId`; Fremd-Schema-Einträge bleiben erhalten |
| `clearResumeEntries(storage?)` | entfernt alle Speicherstände |
| `RESUME_STORAGE_KEY` | `"im-netz-der-detektive:resume-entries"` |

### `ReplayPlayer.ts` — deterministisches Abspielen (rein)

**Beschreibung:** Spielt ein aufgezeichnetes JSONL-Log deterministisch
durch die Engine erneut: `openReplay` rekonstruiert den Start aus dem
Header (`mapId` + `seed` + aufgezeichnete `mission`/`cameras`/
`config`), ein Replay-Schritt ist ein **Aktoreintrag** (`move`,
`action`, `sabotage_offer` mit `chosen`, `radio`) — engine-seitige
Einträge entstehen beim Neuabspielen identisch von selbst. Schritt
zurück = Neuabspielen bis `n-1` (Determinismus statt Inversen).
Der `ReplayDriver` ist ein Interface (`getState()` mit den
Store-Aktionen) — `useGameStore` erfüllt es strukturell, das Modul
bleibt headless.

| Methode / Typ | Beschreibung |
|---------------|--------------|
| `openReplay(jsonl)` | `{entries, start, actions}` — `ReplayError` ohne verwertbaren Header |
| `isReplayAction(entry)` / `replayActions(entries)` | Aktoreinträge in `seq`-Reihenfolge — ein Schritt je Eintrag |
| `replayTo(driver, map, source, stepCount)` | `resetGame` + `startGame` aus der Header-Rekonstruktion (mit `autoPersist: false` — kein erneuter Log-Schreibzugriff) + die ersten `stepCount` Aktoreinträge (geklemmt auf `[0, actions.length]`; Stop bei `outcome`) |
| `ReplayDriver` | Store-Oberfläche des Abspielers — `useGameStore` kompatibel |

### `Statistics.ts` — aggregierte Statistiken (rein)

**Beschreibung:** Balancing-Kennzahlen über den Log-Bestand —
Siegquote je Seite und je gespieltem Modus
(`header.config.playerMode`: `"ganove"`/`"detektiv"`; fehlende Werte
laufen unter `"unbekannt"`), Ø Partienlänge, Ø Hinweise und Ø
Kameratreffer. Unfertige (kein `result`) oder beschädigte Logs
fallen heraus.

| Methode / Typ | Beschreibung |
|---------------|--------------|
| `aggregateStatistics(jsonls)` | `{ total, byMode }` — `StatsBucket` je Gruppe (`games`, Siege/Remis, `winRate*`, `avgRounds`/`avgHints`/`avgCameras`; `null` bei leerer Gruppe) |
| `logStats(jsonl)` | Einzelbeitrag eines Logs (`mode`, `outcome`, `rounds`, `hintsTotal`, `camerasTriggered`) oder `null` |

### `Deduction.ts` — mögliche Ganoven-Positionen (rein, deterministisch)

**Beschreibung:** Gemeinsames Deduktionsmodell für Detektiv-KI und
spätere UI-Overlays (`02-technisches-konzept.md` §5). Aus allen
detektivsichtbaren Hinweisen wird die Menge der Ganoven-Positionen
errechnet, für die eine vollständig konsistente **Positionshistorie**
existiert — nicht nur punktweise Mengen-Schnitte: jede Position muss
über Kantenzüge aus einem Vorgänger der Vor-Runde erreichbar sein, ein
Kameratreffer aus Runde 3 begrenzt Runde 5 also über die
Maximalreichweite. Nur `detectives`-/`both`-sichtbare Events werden
gewertet.

| Methode / Typ | Beschreibung |
|---|---|
| `DeductionInput` | `{map, detectiveStarts, events, cameras, round, detectiveHistory?, detectivePositions?}` |
| `deducePossiblePositions(input)` | sortierte Knoten-IDs — alle Positionen mit konsistenter Historie bis `round` |
| `lastHintAnchor(events)` | jüngstes positionsgebendes `GameEvent` (`camera`/`sichtbarkeit`/`aktion`/`hinweis`) — `nodeId` bzw. Zonenball `nodeIds` als Steueranker für die KI; `null`, solange nichts Positionsgebendes existiert |

**Regeln:** `camera`/`sichtbarkeit`/`aktion` pinnen die Position auf den
Knoten der Runde; `hinweis` schneidet mit dem Zonenball; `umwelt`
sperrt Kanten ab der Folgerunde; eine Bewegungsrunde ohne Kameratreffer
schließt aktive Kameraknoten aus (Negativ-Schluss — bei `aktion`-Runden
entfällt er, ein Verharren auf einer Kamera feuert nicht erneut);
Runden ohne `aktion` erzwingen einen Kantenzug (Zugzwang); belegte
Detektivknoten sind ausgeschlossen. `falsche_spur` erzeugt bewusst ein
gefälschtes Bild — die Korrektheitsgarantie gilt für unverfälschte
Beobachtungen.

### `Movement.ts` — `bfsOpenDistances`

**Beschreibung:** Ergänzt `bfsDistances` um blockungsbewusste BFS ohne
Besetzungsfilter — für Deduktion und KI-Routing auf vergangene Runden.

| Methode | Beschreibung |
|---|---|
| `bfsOpenDistances(graph, from, blockedEdges, round)` | `Map<nodeId, kantenDistanz>`; Startknoten → `0`; Kanten mit `isEdgeBlocked(…, round)` werden nicht traversiert; unerreichbare Knoten fehlen |

### `DetectiveAI.ts` — koordinierter Detektiv-Trupp (rein)

**Beschreibung:** Eine KI-Instanz steuert **alle** Detektive.
`DetectiveView` ist der strukturell gefilterte Blick: detektivsichtbare
Events/Kameras, Sperrungen, eigene Positionen, Missions*struktur* (nur
Stufen-Stati — nie Zielknoten, nie die Ganoven-Position).
`chooseDetectiveMove` minimiert die Abdeckung der aktuellen
Glaubensmenge: für jeden Kandidatenzug wird die Summe der
Mindestdistanzen aller Detektive zu allen möglichen Positionen gebildet
— das verteilt den Trupp automatisch auf verschiedene Regionen
(Einkreisung statt Einzelverfolgung). Zusätzliche Kriterien: letzter
Hinweisanker und kleine Fangdistanz. Bei leerer Menge (widersprüchliche
Hinweise, z. B. `falsche_spur`) steuert die KI auf den jüngsten
Hinweisbereich.

| Methode / Typ | Beschreibung |
|---|---|
| `DetectiveView` | `{map, round, detectiveStarts, detektivePositions, blockedEdges, events, cameras, missionStructure}` |
| `chooseDetectiveMove(view, index, legalMoves, rng)` | Zielknoten-ID aus `legalMoves`; `RangeError` bei leerer Liste |

### `GanoveAI.ts` — missionsführende Ganove-KI (rein)

**Beschreibung:** `GanoveView` ist die ganovenseitige Wahrheit: eigene
Position, Detektivpositionen, Mission samt Zielen, eigene Events (Funk),
Hitze, Fluchtpunkte — keine detektivseitigen Geheimnisse.
`chooseGanoveTurn` entscheidet `move`/`action`: eine Aktion feuert nur
bei sicherem Mindestabstand (`SAFE_ACTION_GAP`) und Hitze unter
`kritisch` — es sei denn, das Rundenbudget erzwingt die Deadline. Züge
halten `MOVE_SAFE_GAP`, wo möglich; im Evade-Modus (Detektiv im
`EVADE_DISTANCE`-Umkreis oder `kritisch`) maximieren sie Mindestabstand,
vermeiden Funk-bekannte Kameras und bevorzugen Knoten mit überlebenden
Auswegen; auf `sabotage`/`flucht` wird committed. `chooseSabotagePath`
wägt den BFS-Umweg gegen `sabotageDetour`, `shouldUseRadio` feuert den
einmaligen Polizeifunk ab `RADIO_HEAT_THRESHOLD`.

| Methode / Typ | Beschreibung |
|---|---|
| `GanoveView` | `{map, round, roundLimit, ganovePosition, detektivePositions, mission, events, blockedEdges, heatLevel, heatScore, radioUsed, escapeNodeIds, legalMoves, missionAction}` |
| `GanoveTurn` | `{type: "move", target} \| {type: "action"}` |
| `chooseGanoveTurn(view, rng)` | Zug oder Aktionsrunde; `RangeError` ohne legale Option |
| `chooseSabotagePath(view)` | `"sabotage" \| "flucht"` — Binärwahl des Informanten |
| `shouldUseRadio(view)` | Funk-Einsatzbedingung (Hitze ≥ `erhoeht`, einmalig) |
| `SAFE_ACTION_GAP` / `MOVE_SAFE_GAP` / `EVADE_DISTANCE` / `RADIO_HEAT_THRESHOLD` | Heuristik-Konstanten |

### `AiSimulation.ts` + `scripts/sim.ts` — KI-vs.-KI-Batchsimulation

**Beschreibung:** Headless-Treiber (`02-technisches-konzept.md` §7):
spielt vollständige Partien auf dem gemeinsamen Store — Phase für Phase
über `pendingChoice`/`phase` — bis zu den regulären Endbedingungen
(`abortAsDraw` als Sicherheitsnetz). Beide KIs teilen denselben
deterministischen RNG-Strom (`mixSeed(seed ^ 0xa11ce5, round, index)`),
sodass jeder Seed eine bitidentische Partie samt Eventlog erzeugt.

| Methode / Typ | Beschreibung |
|---|---|
| `buildDetectiveView(state, detectiveStarts)` | gefilterte Sicht für `DetectiveAI` |
| `buildGanoveView(state)` | gefilterte Sicht für `GanoveAI` |
| `runAiGame(map, seed, options?)` | eine Partie → `SimGameResult`; `options.observe` liest jeden Zwischenzustand (Tests) |
| `runAiBatch(map, seeds, options?)` | Partien über eine Seed-Liste → `SimGameResult[]` |
| `summarizeBatch(results)` | `BatchSummary`: Outcome-Verteilung, Ø/min/max-Runden, Hinweise/Kameras pro Partie, Sabotage-Annahmequote (`null` ohne Angebot), Radio-Quote |
| `AiGameOptions` | `{startOptions?, maxRounds?, observe?}` |
| `SimGameResult` | `{seed, outcome, rounds, log, hintsTotal, camerasTriggered, sabotageOffers, sabotageAccepted, radioUsed}` — Metriken aus dem Eventlog |
| `BatchSummary` | `{games, outcomes, avgRounds, minRounds, maxRounds, avgHints, avgCamerasTriggered, sabotageAcceptanceRate, radioUsageRate}` |

**CLI:** `npm run sim` baut `dist-sim/sim.mjs` (SSR-Bundle via
`vite.sim.config.ts`) und führt `scripts/sim.ts` aus — Optionen
`--map`, `--games`, `--seed-start`, `--seeds` (Range/Liste),
`--detectives`, `--round-limit`, `--mission`, `--out` (JSONL-Logs je
Partie). Die Zusammenfassung geht auf stdout.
