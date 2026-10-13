# Bestandsaufnahme — Enums / Wertemengen

## `GamePhase`

Datei: `src/state/gameStore.ts`

| Wert | Bedeutung |
|------|-----------|
| `"ganove"` | Ganovenphase (ein Zug oder Aktionsrunde) |
| `"detektive"` | Detektivphase (jeder Detektiv einzeln, D1→Dn) |

## `EdgeType` (`EDGE_TYPES`)

Datei: `src/logic/mapPack.ts`

| Wert | Bedeutung |
|------|-----------|
| `"weg"` | Dichte lokale Kante |
| `"fahrt"` | Fernverbindung (Bus/Bahn) — beide Typen sind reguläre Züge |

## `NodeCategory` (`NODE_CATEGORIES`)

Datei: `src/logic/mapPack.ts`

| Wert | Bedeutung |
|------|-----------|
| `"diebstahl"` | Missionskategorie Diebstahl |
| `"kontakt"` | Missionskategorie Kontakt |
| `"sabotage"` | Missionskategorie Sabotage |
| `"flucht"` | Fluchtpunkt-Knoten (basis für die Flucht-Endbedingung) |

## `EventMode`, `SpawnMode`, `SabotageEffect`

Datei: `src/logic/mapPack.ts` — für diesen Schritt nur indirekt relevant
(`eventMode` Feld existiert im Store; Spawn-Modi steuern `startGame`).

## Neu in diesem Schritt: `GameOutcome`

Wertemenge `"caught" \| "surrounded" \| "escaped" \| "timeout" \| "draw"` —
deckt sich mit `result.outcome` des Eventlog-Formats
(`02-technisches-konzept.md` §8, inkl. `"draw"` für Remis).
