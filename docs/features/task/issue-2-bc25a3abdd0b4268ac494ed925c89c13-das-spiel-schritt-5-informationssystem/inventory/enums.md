# Bestandsaufnahme: Enums / Wertmengen

## `EventMode`
Datei: `src/logic/mapPack.ts` (als `EVENT_MODES`), re-exportiertes Literal in `gameStore.ts`

| Wert | Bedeutung |
|------|-----------|
| `cycle` | Ereignis alle `eventDefaults.cycle` Runden |
| `chance` | Ereignis mit `eventDefaults.chance`-Wahrscheinlichkeit pro Runde |
| `tension` | Spannungsbalken `+eventDefaults.perRound`/Runde, Auslösung bei `>= threshold`, Reset |

## `GamePhase` / `GameOutcome`
Datei: `src/state/gameStore.ts`

| Wert | Bedeutung |
|------|-----------|
| `ganove` / `detektive` | Rundenphasen — Info-Checks laufen am Übergang `ganove` → `detektive` |
| `caught` / `surrounded` / `escaped` / `timeout` / `draw` | Endzustände; nach `outcome !== null` finden keine Info-Checks mehr statt |

## `GameEvent.visibleTo` (Wertemenge)
Datei: `src/state/gameStore.ts`

| Wert | Bedeutung |
|------|-----------|
| `detectives` | Nur Detektive (vorhanden) |
| `both` | Beide Seiten (vorhanden — für Umweltsperrungen) |
| `ganove` | **Fehlt** — wird für den Polizeifunk benötigt |

## `NodeCategory` / `EdgeType` / `SpawnMode` / `SabotageEffect`
Datei: `src/logic/mapPack.ts`

Bereits vollständig definiert; `SabotageEffect` enthält `kamera_aus`
(Ziel für `deactivateAll()`) und `funkstille`/`falsche_spur` (spätere
Schritte).
