# Datenmodell — Bestandsaufnahme

## `LogEntry`
Datei: `src/state/gameStore.ts` (Zeile 123)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `seq` | `number` | Laufende Nummer, von `appendLog` als `log.length + 1` vergeben |
| `round` | `number` | Runde des Eintrags |
| `type` | `string` | Eintragstyp (`header`, `move`, `hint`, `event`, `action`, `sabotage_offer`, `mission_choice`, `sabotage`, `radio`, `result`) |
| `details` | `Record<string, unknown>` (optional) | Gekapselte Nutzdaten — weicht vom flachen Spec-Format (§8) ab; kein `visibleTo` |

## `GameEvent`
Datei: `src/logic/InformationSystem.ts` (Zeile 25)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `kind` | `GameEventKind` | `camera`, `sichtbarkeit`, `hinweis`, `umwelt`, `aktion`, `polizeifunk` |
| `round` | `number` | Runde des Ereignisses |
| `nodeId` | `string` (optional) | Exakter Knoten für `camera`/`sichtbarkeit`/`aktion` |
| `zone` | `string` (optional) | Zonenname für `hinweis` |
| `nodeIds` | `string[]` (optional) | Radius-Region für `hinweis` |
| `edge` | `{ a: string; b: string }` (optional) | Gesperrte Kante für `umwelt` |
| `untilRound` | `number` (optional) | Letzte wirksame Runde einer `umwelt`-Sperrung |
| `visibleTo` | `Visibility` | Sichtbarkeit auf Datenebene |
| `details` | `Record<string, unknown>` (optional) | Freie Nutzdaten (z. B. `hints` bei `polizeifunk`, `action` bei `aktion`) |

## `Camera`
Datei: `src/logic/InformationSystem.ts` (Zeile 43)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `nodeId` | `string` | Kamerastandort |
| `active` | `boolean` | `false` nach `kamera_aus`-Sabotage |

## `BlockedEdge`
Datei: `src/logic/Movement.ts` (Zeile 14)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `a` / `b` | `string` | Endknoten der gesperrten Kante |
| `untilRound` | `number` | Letzte gesperrte Runde (inklusive) |

## `Mission` (Store-Laufzeitmodell)
Datei: `src/state/gameStore.ts` (Zeile 81)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `id` | `string` | `"random"`, `"custom"` oder Fall-ID |
| `name` / `story` | `string` (optional) | Anzeigedaten benannter Fälle |
| `targets` | `MissionTargets` | Gezogene Zielknoten (Ganoven-Wissen) |
| `stage` | `MissionStage` | `diebstahl` → `kontakt` → `wahl`/`sabotage`/`flucht` |
| `pendingChoice` | `{ sabotageNode: string; effect: SabotageEffect } \| null` | Offene Binärwahl nach `kontakt` |
| `offeredEffect` / `appliedEffect` | `SabotageEffect \| null` | Angebotener bzw. ausgeführter Effekt |

## `StartGameOptions`
Datei: `src/state/gameStore.ts` (Zeile 130)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `detectiveCount` | `number` (optional) | Anzahl Detektive (Default: `suggested`) |
| `detectivePositions` / `ganovePosition` | `string[]` / `string` (optional) | Explizite Starts (validiert) |
| `roundLimit` | `number \| null` (optional) | Rundenlimit, `null` = unbegrenzt |
| `cameraCount` / `radioHintCount` / `edgeBlockRounds` | `number` (optional) | Overrides im `[min,max]`-Korridor |
| `cameraProtectedNodes` | `string[]` (optional) | Zusätzliche Kamera-Ausschlüsse |
| `mission` | `MissionOption` (optional) | `auto`/`random`/`none`/`case`/`custom` |
