# Datenmodell: Kartenpaket-Typen

Alle Typen in `src/logic/mapPack.ts` (Schritt 2, gemergt).

## `MapPack`
Datei: `src/logic/mapPack.ts` (Zeilen 100–109)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `id` | `string` | Paket-Kennung, muss zum Dateinamen `<id>.json` passen (Loader-Pfad) |
| `name` | `string` | Anzeigename |
| `tagline` | `string` (optional) | Untertitel |
| `viewBox` | `string` | SVG-viewBox, z. B. `"0 0 1000 800"` |
| `nodes` | `MapNode[]` | Orte |
| `edges` | `MapEdge[]` | Wege/Fahrten |
| `spawnRules` | `SpawnRules` | Startaufstellung |
| `settings` | `MapSettings` | Map-abhängige Balancing-Werte |

## `MapNode`
Datei: `src/logic/mapPack.ts` (Zeilen 23–30)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `id` | `string` | Eindeutige Knoten-Kennung |
| `name` | `string` | Ortsname |
| `x`, `y` | `number` | Abstrakte SVG-Koordinaten |
| `categories` | `NodeCategory[]` | Missionskategorien, nicht-leer |
| `zone` | `string` | Zone für Zonenhinweise |

## `MapEdge`
Datei: `src/logic/mapPack.ts` (Zeilen 32–38)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `a`, `b` | `string` | Referenzen auf `MapNode.id` |
| `type` | `EdgeType` | `weg` oder `fahrt` |
| `cost` | `number` (optional) | Reserviert, von Engines ungenutzt |

## `SpawnRules` / `SpawnRule`
Datei: `src/logic/mapPack.ts` (Zeilen 40–53)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `detectives` | `SpawnRule` | `mode`: `choice` (mit `nodes`- oder `zones`-Liste), `free`, `random` |
| `ganove` | `SpawnRule` | `mode` + optionales `minDistanceToDetective` (number) |
| `order` | `"detektive_first"` | Fixwert |

## `MapSettings`
Datei: `src/logic/mapPack.ts` (Zeilen 85–98)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `detectiveCount`, `cameraCount`, `radioHintCount`, `edgeBlockRounds`, `roundLimit` | `RangeSetting` | `{suggested, min, max}` — `roundLimit` darf `unlimited: true` statt `max` tragen; `suggested` muss im Bereich liegen |
| `cameraMinGap`, `hintZoneRadius` | `number` | Skalarfelder |
| `eventMode` | `EventMode` | `cycle` \| `chance` \| `tension` |
| `eventDefaults` | `EventDefaults` | `cycle`, `chance`, `threshold`, `perRound` (numbers) |
| `eventMix` | `EventMix` | `sichtbarkeit`, `hinweis`, `umwelt` (numbers) |
| `missionRules` | `MissionRules` | `minGap`, `maxGap`, `routeBudget`, `routeBudgetSabotage`, `sabotageDetour` (numbers) |
| `sabotageEffects` | `SabotageEffect[]` | Subset von `kamera_aus` \| `funkstille` \| `falsche_spur`, nicht-leer |

## Konstanten
- `NODE_CATEGORIES` = `["diebstahl", "kontakt", "sabotage", "flucht"]`
- `EDGE_TYPES` = `["weg", "fahrt"]`
- `SPAWN_MODES` = `["choice", "free", "random"]`
- `EVENT_MODES` = `["cycle", "chance", "tension"]`
- `SABOTAGE_EFFECTS` = `["kamera_aus", "funkstille", "falsche_spur"]`

## Validator
`validateMapPack(data): MapPack` — wirft `MapValidationError` mit aggregierter
`errors`-Liste (`"path: message"`), deckungsgleich zum Hook
`.githooks/map-schema-check.py`.
