# Bestandsaufnahme — Datenmodell

## `GameState` (Zustand-Store)

Datei: `src/state/gameStore.ts`

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `map` | `MapPack \| null` | Geladenes Kartenpaket der laufenden Partie |
| `round` | `number` | Aktuelle Runde, Start 1 |
| `phase` | `GamePhase` | `"ganove" \| "detektive"` |
| `activeDetectiveIndex` | `number` | Index des ziehenden Detektivs in `detektivePositions` |
| `ganovePosition` | `string \| null` | Aktueller Knoten des Ganoven |
| `detektivePositions` | `string[]` | Knoten der Detektive (D1→Dn = Arrayreihenfolge) |
| `mission` | `Mission \| null` | Missionszustand (`id`, `targetNodes`, `currentStepIndex`) |
| `events` | `GameEvent[]` | Hinweise/Ereignisse (`kind`, `round`, `nodeId?`, `zone?`, `visibleTo`) |
| `cameras` | `Camera[]` | `nodeId` + `active` |
| `blockedEdges` | `BlockedEdge[]` | `{a, b, untilRound}` — gesperrt bis einschließlich `untilRound` |
| `eventMode` | `EventMode` | `"cycle" \| "chance" \| "tension"` |
| `tensionValue` | `number` | Spannungswert für `eventMode` `tension` |
| `seed` | `number` | Partie-Seed (Determinismus/Replay) |
| `log` | `LogEntry[]` | `{seq, round, type, details?}` — JSONL-artiges Eventlog (§8) |

**Fehlende Felder für diesen Schritt:** `outcome` (Spielergebnis),
`roundLimit` (effektives Rundenlimit bzw. `null` = unbegrenzt),
Fluchtpunkt-Auflösung, Ganoven-Aktionsverfügbarkeit (Hook).

## `MapPack` / `MapNode` / `MapEdge` / `MapSettings`

Datei: `src/logic/mapPack.ts`

| Typ | Relevante Eigenschaften | Zweck |
|-----|-------------------------|-------|
| `MapPack` | `id`, `nodes`, `edges`, `spawnRules`, `settings` | Kartenpaket |
| `MapNode` | `id`, `categories: NodeCategory[]`, `zone` | `categories` enthält `flucht` → Fluchtpunkte |
| `MapEdge` | `a`, `b`, `type: EdgeType`, `cost?` | `weg`/`fahrt`; 1 Zug = 1 Kante |
| `MapSettings` | `roundLimit: RangeSetting` u. a. | `suggested`-Default; `unlimited: true` erlaubt „unbegrenzt" |

## `BlockedEdge`

Datei: `src/state/gameStore.ts` — `{a, b, untilRound}`; Sperrung gilt in
beide Richtungen, für beide Seiten. Entsteht später über `blockEdge`
(Ereignisengine) — die Bewegungsprüfung muss sie bereits berücksichtigen.
