# Bestandsaufnahme — Datenmodell- und Zustandstypen

## `GameEvent` (`src/logic/InformationSystem.ts`)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `kind` | `GameEventKind` | `camera` \| `sichtbarkeit` \| `hinweis` \| `umwelt` \| `aktion` \| `polizeifunk` |
| `round` | `number` | Runde, in der das Ereignis ausgelöst wurde |
| `nodeId` | `string?` | Exakter Knoten für `camera`/`sichtbarkeit`/`aktion` |
| `zone` | `string?` | Zonenname für `hinweis` („im Bereich X") |
| `nodeIds` | `string[]?` | Operativer Ball um die wahre Position (`hinweis`, Radius `hintZoneRadius`) |
| `edge` | `{a,b}?` | Gesperrte Kante für `umwelt` |
| `untilRound` | `number?` | Letzte Runde der `umwelt`-Sperre |
| `visibleTo` | `Visibility` | `detectives` \| `ganove` \| `both` — Filterung auf Datenebene |
| `details` | `Record?` | Freiform-Payload (z. B. `action` bei `aktion`, `hints` bei `polizeifunk`) |

Constraint-Gehalt für die Deduktion: `camera`/`aktion` = exakter Knoten
zu `round` (bei `aktion` zusätzlich „hat die Runde verharrt");
`sichtbarkeit` = exakter Knoten live in `round`; `hinweis` = Position in
`round` ∈ `nodeIds`; `umwelt` = Kante `edge` bis `untilRound` für beide
Seiten gesperrt (schränkt Übergänge ein); `polizeifunk` trägt keine
Positionsconstraint, ist ohnehin nur `ganove`-sichtbar.

## `Camera` (`src/logic/InformationSystem.ts`)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `nodeId` | `string` | Knoten der Kamera |
| `active` | `boolean` | `false` nach `kamera_aus`-Sabotage |

## `Mission` (`src/state/gameStore.ts`)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `targets` | `MissionTargets` | Gezogene Zielknoten — **nur ganovenseitig** bekannt |
| `stage` | `MissionStage` | `diebstahl` → `kontakt` → `wahl` → `sabotage` → `flucht` |
| `pendingChoice` | `{sabotageNode, effect} \| null` | Offene Binärwahl nach `kontakt`; blockiert `moveGanove` |
| `offeredEffect` | `SabotageEffect \| null` | Angebotener Effekt (ganovenseitig) |
| `appliedEffect` | `SabotageEffect \| null` | Ausgeführter Effekt (ganovenseitig) |

## `GameState` (`src/state/gameStore.ts`) — relevante Felder

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `round` / `phase` / `activeDetectiveIndex` | `number` / `GamePhase` / `number` | Rundenmotor-Zustand |
| `ganovePosition` | `string \| null` | **Nur ganovenseitig sichtbar** |
| `detektivePositions` | `string[]` | Für beide Seiten exakt sichtbar |
| `events` | `GameEvent[]` | Vollständige Ereignischronik (Sicht via `visibleEvents`) |
| `cameras` / `blockedEdges` | `Camera[]` / `BlockedEdge[]` | Kameras detektivsichtbar; Sperrungen beidseitig |
| `mission` | `Mission \| null` | Ziele nur ganovenseitig; Struktur via `missionStructure` |
| `roundLimit` / `outcome` | `number \| null` / `GameOutcome \| null` | Zeitlimit bzw. `caught`/`surrounded`/`escaped`/`timeout`/`draw` |
| `escapeNodeIds` | `string[]` | Aktive Fluchtknoten |
| `radioUsed` / `hintSilenceUntilRound` / `falseTrailUntilRound` | `boolean` / `number` / `number` | Funk-Einmaligkeit und Sabotage-Fenster |
| `log` | `LogEntry[]` | JSONL-Eventlog (Spec §8) |

Relevante Actions für den Sim-Treiber: `startGame`, `moveGanove`,
`ganoveAction`, `chooseMissionPath`, `moveDetective`,
`endDetectivePhase`, `useRadio`, `getLegalGanoveMoves`,
`getLegalDetectiveMoves`, `getMissionAction`, `getMissionStructure`,
`getHeatLevel`, `abortAsDraw`, `resetGame`.

Wichtige Automatismen im Store: `moveGanove` führt Kameracheck +
Ereigniswurf aus und wechselt in die Detektivphase; der Zug des letzten
Detektivs (`activeDetectiveIndex === length-1`) schließt die Runde via
`completeDetectivePhase` (Timeout-Prüfung, Rundeninkrement,
`unblockExpiredEdges`, Umzingelungsprüfung). `ganoveAction` erzeugt bei
Missionsaktionen den `aktion`-Spurhinweis und kann `pendingChoice`
setzen; `chooseMissionPath` löst die Binärwahl auch während der
Detektivphase auf.
