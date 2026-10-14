# Enums & Wertmengen

## `HeatLevel`

Datei: `src/logic/InformationSystem.ts` (Zeile 56)

| Wert | Bedeutung | Schwelle (`heatLevel`) |
|------|-----------|------------------------|
| `ruhig` | keine Hinweisaktivität | score 0 |
| `aktiv` | geringe Aktivität | score 1–2 |
| `erhoeht` | erhöhte Aktivität | score 3–4 |
| `kritisch` | kritische Aktivität | score ≥ 5 |

Verwendet von `HeatBadge` (Icon+Text) — Audio-Signale sollen bei Stufen**anstieg** gestuft auslösen.

## `MissionKind` / `MissionStage` / `NodeCategory`

Datei: `src/logic/MissionSystem.ts` — `diebstahl | kontakt | sabotage | flucht` (+ `wahl` in der Stage). Formkodiert im `MapGraph` (Raute/Quadrat/Dreieck/Flagge) und in den Schrittlisten.

## `GameOutcome`

Datei: `src/state/gameStore.ts` — `caught | surrounded | escaped | timeout | draw`; übersetzt via `outcome.*`/`detektiv.outcome.*`/`stats.outcome.*`.

## `MenuScreen`

Datei: `src/components/menuFlow.ts` — `menu | map | mode | settings | mission | dev | stats | resume | replay | game`; **muss um den App-Einstellungs-Screen erweitert werden.**

## `EventMode` / `SabotageEffect`

`cycle | chance | tension` (`mapPack.ts`); `kamera_aus | funkstille | falsche_spur` — beide vollständig übersetzt.

## Sprachen (neu)

`"de" | "en"` — neuer `Language`-Typ in `src/i18n/` bzw. UI-Store.
