# Enums / Union-Typen — Bestandsaufnahme

## `GameEventKind`
Datei: `src/logic/InformationSystem.ts`

| Wert | Bedeutung |
|------|-----------|
| `camera` | Kamera am Ganoven-Knoten ausgelöst (nur Detektive) |
| `sichtbarkeit` | Ganoven-Position für die laufende Runde exakt (nur Detektive) |
| `hinweis` | Zonenhinweis mit Radius-Region (nur Detektive) |
| `umwelt` | Kantensperrung (beide Seiten) |
| `aktion` | Missions-Aktions-Spur am Tatort (nur Detektive) |
| `polizeifunk` | Funk-Report an den Ganoven (nur Ganove) |

## `Visibility` / `ViewSide`
Datei: `src/logic/InformationSystem.ts`

| Wert | Bedeutung |
|------|-----------|
| `detectives` | Nur Detektivseite |
| `ganove` | Nur Ganovenseite |
| `both` | Beide Seiten |

## `GameOutcome`
Datei: `src/state/gameStore.ts`

| Wert | Bedeutung |
|------|-----------|
| `caught` | Detektiv landet auf dem Ganoven-Knoten |
| `surrounded` | Ganove ohne legalen Zug und ohne Aktion |
| `escaped` | Ganove erreicht (missionsgebundenen) Fluchtknoten |
| `timeout` | Rundenlimit erreicht |
| `draw` | Vorzeitiges Beenden via `abortAsDraw()` (OT-29) |

## `EventMode`
Datei: `src/state/gameStore.ts` bzw. `mapPack.ts`

| Wert | Bedeutung |
|------|-----------|
| `cycle` | Ereignis alle N Runden |
| `chance` | Ereignis mit Wahrscheinlichkeit pro Runde |
| `tension` | Ereignis bei vollem Spannungsbalken |

## `EventTypeKind`
Datei: `src/logic/EreignisEngine.ts`

| Wert | Bedeutung |
|------|-----------|
| `sichtbarkeit` / `hinweis` / `umwelt` | Die drei würfelbaren Ereignistypen (25/45/30) |

## `SabotageEffect`
Datei: `src/logic/mapPack.ts`

| Wert | Bedeutung |
|------|-----------|
| `kamera_aus` | Alle Kameras dauerhaft deaktiviert |
| `funkstille` | Hinweis-Ereignisse für `sabotageDuration` Runden unterdrückt |
| `falsche_spur` | Zonenhinweise für das Fenster falsch-konsistent gefälscht |

## `EdgeType`
Datei: `src/logic/mapPack.ts`

| Wert | Bedeutung |
|------|-----------|
| `weg` | Dichte lokale Kante |
| `fahrt` | Fernverbindung |
