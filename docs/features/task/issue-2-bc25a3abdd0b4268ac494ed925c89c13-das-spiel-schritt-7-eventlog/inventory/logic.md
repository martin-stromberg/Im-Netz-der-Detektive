# Logik — Bestandsaufnahme

## `useGameStore` (Zustand-Store)
Datei: `src/state/gameStore.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `startGame(map, seed, options?)` | public | Löst Spawns → Limits/Overrides → Mission → Kameras auf (eine RNG-Kette `createRng(seed)`), setzt Anfangszustand, schreibt `header`-Logeintrag |
| `appendLog(entry)` | public | Hängt `Omit<LogEntry,"seq">` an, vergibt `seq = log.length + 1` |
| `moveGanove(target)` | public | Validiert via `validateGanoveMove`, loggt `move` (actor/from/to/edgeType), Flucht-Check, Kamera-Check (`runCameraCheck`), Ereigniswurf (`runEventRoll`), Phasenwechsel |
| `moveDetective(target)` | public | Validiert via `validateDetectiveMove`, loggt `move` inkl. `detectiveIndex`, Sofort-Fang (`caught`), sonst `completeDetectivePhase` nach letztem Detektiv |
| `ganoveAction()` | public | Aktionsrunde; loggt `action` (nodeId, missionAction), emittiert `aktion`-Spur-Event, `advanceMission`, Ereigniswurf |
| `chooseMissionPath(choice)` | public | Beantwortet `pendingChoice`; loggt `mission_choice` (choice, effect) |
| `abortAsDraw()` | public | `finish("draw")` |
| `useRadio()` | public | Einmaliger Polizeifunk; `polizeifunk`-Event + `radio`-Logeintrag |
| `blockEdge(a, b, untilRound)` | public | Fügt `BlockedEdge` hinzu (ohne Logeintrag — Sperrung selbst läuft über das `umwelt`-Event) |
| `unblockExpiredEdges()` | public | Filtert abgelaufene Kanten still heraus — **kein Logeintrag für den Ablauf** |
| `addEvent(event)` | public | Hängt `GameEvent` an `events[]` |
| `setEscapeNodeIds`, `setGanoveCanAct`, `setMission`, `setCameras`, `setTension`, `setEventMode`, `deactivateCameras` | public | Test-/System-Hooks |
| `finish(outcome)` (intern) | privat | Setzt `outcome`, loggt `result` mit `{ outcome, rounds }` — **keine Metriken, kein Persist-Hook** |
| `emitInfoEvent(event)` (intern) | privat | `addEvent` + Logeintrag (`hint` bzw. `event` für `umwelt`) mit gekapselten `details` |
| `applySabotageEffect(effect)` (intern) | privat | Wendet `kamera_aus`/`funkstille`/`falsche_spur` an, loggt `sabotage` |
| `advanceMission(action)` (intern) | privat | Stufenfortschritt; loggt `sabotage_offer` nach `kontakt` |
| `runEventRoll()` / `emitRoundEvent()` / `emitUmwelt()` / `emitFalseTrailHint()` (intern) | privat | Ereigniswurf pro Ganoven-Zug über `createRng(mixSeed(seed, round))` |

Publizierte Log-Typen (IST): `header`, `move`, `hint`, `event`,
`action`, `sabotage_offer`, `mission_choice`, `sabotage`, `radio`,
`result`.

## `Recorder.ts`
Datei: — **existiert nicht** (Spec §2/§5: JSONL-Eventlog, Export,
localStorage der letzten N Partien).

## `InformationSystem.ts`

| Funktion | Zweck |
|----------|-------|
| `visibleEvents(events, side)` | Filtert `events[]` nach `visibleTo` (Daten-Asymmetrie) |
| `visibleCameras(cameras, side)` | Kameras nur für Detektive |
| `radioHintSummary(events, count)` | Letzte N Hinweise für den Polizeifunk |
| `revealedGanovePosition(events, round)` | `sichtbarkeit`-Reveal der laufenden Runde |
| `heatLevel(events, round)` | Hitze-Indikator (gewichtete Hinweisaktivität) |
| `HINT_EVENT_KINDS` | `camera`, `sichtbarkeit`, `hinweis`, `aktion` — Basis für `hintsTotal` |
| `HEAT_WEIGHTS` | Gewichte je `GameEventKind` |

## `rng.ts`

| Funktion | Zweck |
|----------|-------|
| `createRng(seed)` | mulberry32-Stream (`next`, `nextInt`, `pick`, `shuffle`) — einzige Zufallsquelle |
| `mixSeed(seed, round)` | Deterministische Runden-Ableitung für Ereignis-/Missions-RNG |

## `CameraSystem.ts`

| Funktion | Zweck |
|----------|-------|
| `placeCameras(graph, rng, count, minGap, protectedNodes)` | Kameraverteilung beim Start |
| `triggeredCamera(cameras, nodeId)` | Ausgelöste aktive Kamera am Knoten |
| `deactivateAll(cameras)` | `kamera_aus`-Sabotage |

## `MissionSystem.ts` (logrelevante Teile)

| Funktion | Zweck |
|----------|-------|
| `drawSabotageEffect(map, rng)` | Zieht Sabotage-Effekt beim `kontakt`-Schritt |
| `sabotageDuration(map)` | Wirkdauer `funkstille`/`falsche_spur` |
| `executableMissionAction(mission, position)` | Ausführbare Missionsaktion am Knoten |

## Browser-Grenze (IST)

- Kein DOM-/`localStorage`-Zugriff in `src/logic/` oder `src/state/`
  vorhanden — die Engine ist vollständig headless.
- Vitest läuft ohne `environment`-Konfiguration im Node-Modus:
  `window`, `document`, `localStorage`, `Blob`, `URL.createObjectURL`
  sind in Tests nicht automatisch verfügbar und müssen injiziert oder
  gemockt werden.
