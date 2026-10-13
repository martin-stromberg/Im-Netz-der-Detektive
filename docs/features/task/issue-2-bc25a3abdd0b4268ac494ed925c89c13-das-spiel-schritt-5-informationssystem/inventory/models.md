# Bestandsaufnahme: Modelle / State (`src/state/gameStore.ts`)

## `GameEvent`
Datei: `src/state/gameStore.ts`

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| `kind` | `string` | Freies Typkennzeichen (bisher nur `"camera"` in Tests benutzt) |
| `round` | `number` | Runde des Ereignisses |
| `nodeId?` | `string` | Optionaler Knotenbezug |
| `zone?` | `string` | Optionaler Zonenbezug |
| `visibleTo` | `"detectives" \| "both"` | **Fehlt:** `"ganove"` (für Polizeifunk) |

## `Camera`

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| `nodeId` | `string` | Kamerastandort |
| `active` | `boolean` | Bereits für die spätere Sabotage vorgesehen |

## `LogEntry`

| Eigenschaft | Typ | Beschreibung |
|-------------|-----|--------------|
| `seq` | `number` | Laufende Nummer |
| `round` | `number` | Runde |
| `type` | `string` | Frei (`"header"`, `"move"`, `"action"`, `"hint"`, `"result"` bereits verwendet) |
| `details?` | `Record<string, unknown>` | Freie Nutzdaten |

## `GameState` — vorhandene Felder und Actions (Auswahl)

| Element | Typ | Beschreibung |
|---------|-----|--------------|
| `events` | `GameEvent[]` | Ereignis-/Hinweischronik |
| `cameras` | `Camera[]` | Wird in `startGame` **nicht** befüllt (`[]`) |
| `blockedEdges` | `BlockedEdge[]` | Wirkt bereits auf `legalMoves*` |
| `eventMode` | `EventMode` | Initial `map.settings.eventMode` |
| `tensionValue` | `number` | Spannungsbalken, bisher ungenutzt |
| `addEvent` | Action | Hängt ein `GameEvent` an |
| `setCameras` | Action | Setzt Kamera-Knoten (alle `active: true`) |
| `blockEdge` | Action | Fügt `BlockedEdge` hinzu |
| `unblockExpiredEdges` | Action | Entfernt abgelaufene Sperrungen am Rundenende |
| `setTension` / `setEventMode` | Action | Imperative Setter |
| `moveGanove` | Action | Einschubstelle: Fluchtprüfung → `phase: "detektive"` — hier greift die Kamera-/Ereignisprüfung |
| `ganoveAction` | Action | Einschubstelle der Aktionsrunde (Aktions-Spur kommt in Schritt 6) |
| `startGame` | Action | Spawn-Auflösung über `createRng(seed)` in `resolveSpawnPositions`; RNG-Strom kann für Kameraplatzierung weitergenutzt werden |
| `StartGameOptions` | Interface | `detectiveCount?`, `detectivePositions?`, `ganovePosition?`, `roundLimit?` — Vorbild für die neuen Overrides |
| `resolveRoundLimit` | interne Funktion | Vorbild für Bereichsvalidierung via `GameConfigError` |

## Nicht vorhanden

- `radioUsed`-Flag, `useRadio()`, `deactivateCameras()`,
  `getHeatLevel()`
- Kameraplatzierung, Kameraauslösung, Ereignis-Roll, Zonen-/Umwelt-/
  Sichtbarkeits-Events, Hitze-Berechnung, `visibleTo: "ganove"`
