# Datenmodelle & Datenpakete

## `MissionCase` (Interface)

Datei: `src/logic/MissionSystem.ts` (Zeilen 60–75)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `id` | `string` | Fall-Kennung |
| `name` | `string` | Anzeigename — **deutsches Daten-Literal, sichtbar in `MissionSelect`** |
| `story` | `string` | Mini-Geschichte — **deutsches Daten-Literal, sichtbar in `MissionSelect`** |
| `diebstahl` | `string` | Zielknoten |
| `kontakt` | `string` | Zielknoten |
| `flucht` | `string` | Zielknoten |
| `sabotage` | `string?` | optionaler Zielknoten |
| `sabotageEffect` | `SabotageEffect?` | fixierter Sabotageeffekt |

Schema-Validierung (`validateMissionSet`, Zeile ~340): verlangt `id`, `name`, `story` als non-empty Strings.

Datenbestand: `src/data/missions/muenster.json` — 2 Fälle (`diebstahlserie-altstadt`, `kurier-am-hafen`) mit deutschem `name`/`story`. Lübeck/Teststadt haben kein Set (`hasMissionSet` → false).

## `MissionSet` (Interface)

Datei: `src/logic/MissionSystem.ts` (Zeilen 77–81) — `{ mapId: string; cases: MissionCase[] }`

## `MapPack` (Interface)

Datei: `src/logic/mapPack.ts` (Zeilen ~100–103)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `name` | `string` | Kartenname — Eigenname („Münster"), sichtbar in `MapSelect`/`ResumeScreen`/Titeln |
| `tagline` | `string?` | Werbezeile — **deutsches Daten-Literal** („Jagd durch die Fahrradstadt"), sichtbar in `MapSelect` |
| `nodes[].name` | `string` | Ortsnamen — Eigennamen, bleiben Daten |
| `settings` | `MapSettings` | Korridore `{suggested,min,max}` je Option |

## `Mission` (Interface)

Datei: `src/state/gameStore.ts` (Zeilen ~74–93)

| Eigenschaft | Typ | Beschreibung / Zweck |
|-------------|-----|----------------------|
| `id` | `string` | `"random"`, `"custom"` oder Fall-ID |
| `name?` | `string` | aus `MissionCase.name` übernommen — landet im Log-Header (`header.mission`) |
| `story?` | `string` | aus `MissionCase.story` übernommen — landet im Log-Header |

`newMissionState(choice.id, targets, entry.name, entry.story)` (gameStore ~Zeile 628) kopiert die Literale; `missionFromHeader` (~Zeile 704) stellt sie beim Replay wieder her. Die aufgezeichneten Texte bleiben Daten — die UI zeigt `name`/`story` nur in `MissionSelect` an (vor Spielstart, nicht aus dem Log).

## `RecordedMission` (Log-Header)

Datei: `src/state/gameStore.ts` (~Zeilen 126–140) — `{ id, targets, name?, story? }`; wird von `startOptionsFromHeader` gelesen.

## `StartGameOptions` (Interface)

Datei: `src/state/gameStore.ts` (~Zeilen 169–232) — Spieloptionen aus dem Menüfluss (`detectiveCount`, `roundLimit`, `mission`, `playerMode`, `resolvedMission`, …). **Keine UI-Einstellungen** (Sprache/Audio) — bewusst getrennt vom Spielzustand.

## `StorageLike` (Interface)

Datei: `src/logic/Recorder.ts` (~Zeilen 30–43) — minimaler Storage-Vertrag (`getItem`/`setItem`/`removeItem`), kompatibel zu `localStorage`; `resolveStorage` in `GameIndex.ts` (~Zeilen 108–118) löst `undefined` → `window.localStorage`, `null` → deaktiviert. Etabliertes Muster für die neue UI-Einstellungs-Persistenz.
