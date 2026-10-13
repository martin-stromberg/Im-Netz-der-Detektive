# Bestandsaufnahme: Datenmodell

## `MapPack` / `MapSettings` (`src/logic/mapPack.ts`)

- `NODE_CATEGORIES = ["diebstahl", "kontakt", "sabotage", "flucht"]` — Missions-Zielpools.
- `MapNode.categories: NodeCategory[]` — ein Knoten kann mehrere Kategorien tragen (z. B. `hbf` = `flucht`+`kontakt`, `d` in teststadt = `flucht`+`kontakt`).
- `MissionRules` (bereits im Schema, Zeilen 77–83): `minGap`, `maxGap`, `routeBudget`, `routeBudgetSabotage`, `sabotageDetour` — alle als Zahlen validiert (`MISSION_RULE_KEYS`).
- `SABOTAGE_EFFECTS = ["kamera_aus", "funkstille", "falsche_spur"]` + `MapSettings.sabotageEffects: SabotageEffect[]` (Karten-Pool, non-empty validiert).
- `EventDefaults`: `cycle`, `chance`, `threshold`, `perRound` — `cycle` ist der Kandidat für die Sabotage-Dauer N.
- `MapValidationError` mit `errors: readonly string[]` — Muster für aggregierte Validierungsfehler (für `MissionValidationError` wiederverwendbar).

## `Mission` (`src/state/gameStore.ts`, Zeilen 57–62)

```ts
export interface Mission {
  id: string;
  targetNodes: string[];
  currentStepIndex: number;
}
```

Nur ein Hook-Platzhalter — keine Stufen-, Ziel- oder Sabotage-Semantik. Wird durch das echte Missionsdatenmodell ersetzt; einzige Verwendung: `setMission`-Hook und `s.mission === null`-Assertions in `gameStore.test.ts`.

## `GameEvent` (`src/logic/InformationSystem.ts`)

- `GameEventKind` enthält bereits `"aktion"` (Hitze-Gewicht 2 in `HEAT_WEIGHTS`, in `HINT_EVENT_KINDS` gelistet → geht in `radioHintSummary` und `heatLevel` ein).
- `visibleTo: "detectives" | "ganove" | "both"` — Asymmetrie auf Datenebene.
- `details?: Record<string, unknown>` — freie Nutzlast (für `action`-Subtyp der Spur).

## `StartGameOptions` (`src/state/gameStore.ts`, Zeilen 73–93)

Enthält bereits `cameraProtectedNodes?: string[]` (validiert via `resolveCameraProtectedNodes`, bekannte Knoten-IDs Pflicht). Fehlt: `mission`-Option.

## `Camera` (`src/logic/InformationSystem.ts`)

`{ nodeId, active }`; `deactivateAll` in `CameraSystem.ts` liefert deaktivierte Kopie — fertige `kamera_aus`-Mechanik.

## Kartenbestände (`src/data/maps/`)

| Karte | Knoten | diebstahl | kontakt | sabotage | flucht | missionRules |
|-------|--------|-----------|---------|----------|--------|--------------|
| muenster | 59 | 17 | 32 | 6 | 7 | 3/8/18/22/4 |
| luebeck | 22 | 10 | 7 | 2 | 4 | 2/6/10/13/3 |
| teststadt | 10 | 4 | 4 | **0** | 3 | 3/8/18/22/4 |

`teststadt` ohne Sabotage-Pool → Missionsgenerierung muss sabotagefreie Missionen erzeugen können.
