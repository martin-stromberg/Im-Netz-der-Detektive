# Kartenpaket-Schema — Bestand (Hook-Definition)

Der Pre-Commit-/Pre-Push-Hook `.githooks/map-schema-check.py`
validiert `src/data/maps/*.json` und definiert damit die
verbindliche Schema-Grammatik, die der Laufzeit-Validator spiegeln
muss. Quelle: Hook-Datei selbst + `02-technisches-konzept.md` §4
(Beispielpaket „muenster").

## Top-Level-Pflichtfelder

| Feld | Regel |
|------|-------|
| `id` | nicht-leerer String |
| `name` | nicht-leerer String |
| `tagline` | im Spec-Beispiel vorhanden (Hook: nicht als Pflicht geprüft) |
| `viewBox` | nicht-leerer String |
| `nodes` | nicht-leeres Array |
| `edges` | nicht-leeres Array |
| `spawnRules` | Objekt, Pflicht |
| `settings` | Objekt, Pflicht |

## `nodes[]`-Eintrag

| Feld | Regel |
|------|-------|
| `id` | nicht-leerer String, **eindeutig** |
| `name` | nicht-leerer String |
| `x`, `y` | Zahl |
| `categories` | nicht-leeres Array; Werte ⊆ `diebstahl`/`kontakt`/`sabotage`/`flucht` |
| `zone` | nicht-leerer String |

## `edges[]`-Eintrag

| Feld | Regel |
|------|-------|
| `a`, `b` | vorhandene Node-IDs (Referenzintegrität) |
| `type` | `weg` oder `fahrt` |
| `cost` | optional, Zahl (reserviert) |

## `spawnRules`

| Feld | Regel |
|------|-------|
| `order` | muss `"detektive_first"` sein |
| `detectives` | Pflicht; `mode` ∈ `choice`/`free`/`random`; `choice` verlangt nicht-leere `nodes[]`-Liste gültiger Node-IDs oder `zones[]`-Liste; `minDistanceToDetective` optional, Zahl |
| `ganove` | Pflicht; gleiche Regeln |

## `settings`

| Feld | Regel |
|------|-------|
| `detectiveCount`, `cameraCount`, `radioHintCount`, `edgeBlockRounds` | Range-Objekt `{ suggested, min, max }`; `suggested` ∈ `[min, max]`, `min ≤ max` |
| `roundLimit` | Range-Objekt; darf statt `max` `unlimited: true` tragen |
| `cameraMinGap`, `hintZoneRadius` | Zahl |
| `eventMode` | `cycle`/`chance`/`tension` |
| `eventDefaults` | `{ cycle, chance, threshold, perRound }`, alle Zahlen |
| `eventMix` | `{ sichtbarkeit, hinweis, umwelt }`, alle Zahlen |
| `missionRules` | `{ minGap, maxGap, routeBudget, routeBudgetSabotage, sabotageDetour }`, alle Zahlen |
| `sabotageEffects` | nicht-leeres Array; Werte ⊆ `kamera_aus`/`funkstille`/`falsche_spur` |

## Weitere relevante Hook-Regeln

- `no-math-random-check.py`: `Math.random()` in `src/logic/**` ist ein
  harter Fehler (pre-commit staged, pre-push ganzes Verzeichnis).
- `no-stub-check.py`: „not implemented"-Throws, nur-throw-Rümpfe und
  TODO-only-Bodies sind in pre-push blockierend.
- `component-usage-check.py`: erzeugt bei ungenutzten Komponenten
  Befunde (pre-push blockierend) — `PlaceholderPanel` wird aktuell von
  `App.tsx` genutzt.
- `i18n-check.py`: de/en-Schlüsselparität.
