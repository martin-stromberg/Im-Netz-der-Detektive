# Bestandsaufnahme: UI-Komponenten und Navigation

## `App` (`src/App.tsx`)

Temporärer Modus-Switcher: `?mode=ganove|detektiv` oder ein
Zwei-Button-Wähler (`data-testid="mode-select"`). Wird in diesem
Schritt durch den echten Menüfluss ersetzt; die URL-Parameter bleiben
als Dev-/E2E-Deep-Link erhalten.

## `GanoveScreen` (`src/components/GanoveScreen.tsx`)

| Element | Beschreibung |
|---------|--------------|
| Props | `mapId?`, `seed?`, `autoDetectives?` (Test-Hook) |
| `IdleView` | Titel + „Neue Partie"-Button (`data-view="idle"`) |
| `PickSpawnView` | Detektive bereits gesetzt (auto-draw), Ganove wählt aus `ganoveSpawnChoices` (`data-view="pickSpawn"`, `selectableNodeIds`) |
| `OutcomeView` | `data-testid="outcome-panel"`, `data-outcome` |
| `beginSetup` | `loadMap(mapId ?? ?map= ?? "muenster")`, Seed aus Prop/`?seed=`/`nextSeed()`, `pickDetectiveSpawns`, `resolveMissionOption(?mission=)` |
| `pickSpawn` | `startGame` mit expliziten Positionen; `MissionGenerationError` → Fallback `mission: "auto"` |
| Spielfläche | `MapGraph` + `MissionPanel` + Intel-Feed + `useRadio` + `abortAsDraw` |

## `DetektivScreen` (`src/components/DetektivScreen.tsx`)

| Element | Beschreibung |
|---------|--------------|
| Props | `mapId?`, `seed?`, `autoGanove?` (Test-Hook) |
| `IdleView` | `data-view="idle"`, Intro-Text |
| `PickSpawnsView` | interaktives Setzen aller Detektive bei `choice`/`free`; bei `random` Auto-Draw und direkter Start |
| Spielfläche | `MapGraph` mit `showCategories`/`showZones`, Chronik, Marker, Mögliche-Positionen-Overlay, Missionsstruktur |

## `MapGraph` (`src/components/MapGraph.tsx`)

SVG-Karte mit `selectableNodeIds` (klickbar, `role="button"`,
`data-selectable`), `legalTargets`, `missionTargets`, `escapeNodeIds`,
`cameras`, `markableNodeIds`/`markedNodeIds`, `possibleNodeIds`,
`detectivePositions`, `activeDetectiveIndex`, `onNodeSelect`.

## `MissionPanel`, `HeatBadge`

Bestehende Spiel-HUD-Elemente; für den Menüfluss nicht relevant.

## `gameSetup.ts` (`src/components/gameSetup.ts`)

`readParams()`, `resolveMissionOption(raw)` (`auto|random|none|case:<id>`),
`nextSeed()` (Zeit-Fallback-Seed).

## Styles

`GanoveScreen.module.css` stellt das Noir-Theme (`screen`, `panel`,
`primaryButton`, `secondaryButton`, `notice`, `legend`, …);
`DetektivScreen` importiert es als `shared`. `App.module.css` enthält
`shell` + `modeGrid`/`modeHint` für den alten Switcher.

## E2E-Nutzung

`e2e/ganove.spec.ts` (5 Tests) und `e2e/detektiv.spec.ts` (7 Tests)
steuern über `?mode=…&map=teststadt&seed=…&mission=…` und lesen
`window.__gameStore` (nur DEV). Diese Parameter müssen erhalten bleiben.
