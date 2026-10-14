# Bestandsaufnahme: Daten — Kartenpakete und Missionssets

## Kartenpakete (`src/data/maps/`)

| id | name | tagline | spawnRules.detectives | spawnRules.ganove | settings-Korridore |
|----|------|---------|-----------------------|-------------------|--------------------|
| `muenster` | Münster | „Jagd durch die Fahrradstadt" | `choice` nodes: hbf, domplatz, aegidiimarkt, mauritztor, kreuztor | `free`, minDistance 3 | detektive 2–6 (sugg. 4), kameras 0–15 (sugg. 8), rundlimit min 15 + `unlimited` (sugg. 30), funk 3–10 (sugg. 5), sperre 1–6 (sugg. 3), eventMode `tension` |
| `luebeck` | Lübeck | „Flucht über die Brücken der Altstadtinsel" | `choice` zones: mitte, sued | `free`, minDistance 2 | detektive 3–6 (sugg. 5), kameras 0–10 (sugg. 6), rundlimit 10–30 (sugg. 20, **kein** `unlimited`), funk 2–8 (sugg. 4), sperre 1–4 (sugg. 2), eventMode `cycle` |
| `teststadt` | Teststadt | Fixture | `choice` nodes: a, i, j | `free`, minDistance 3 | wie muenster — **nur für Tests/E2E gedacht, nicht fürs Menü** |

Alle Pakete enthalten `settings.eventDefaults {cycle, chance,
threshold, perRound}` und `eventMix`, `missionRules {minGap, maxGap,
routeBudget, routeBudgetSabotage, sabotageDetour}`, `sabotageEffects`.

Beide Spielekarten besitzen alle vier Kategorie-Pools
(`diebstahl`, `kontakt`, `sabotage`, `flucht`) — `random`- und
`custom`-Missionen sind überall generierbar/validierbar.

## Missionssets (`src/data/missions/`)

| mapId | Fälle |
|-------|-------|
| `muenster` | 2 (`diebstahlserie-altstadt`, …) mit `id`, `name`, `story`, festen `diebstahl`/`kontakt`/`sabotage`/`flucht`-Zielen |
| `luebeck` | **kein Set** — `hasMissionSet("luebeck")` = `false`, `loadMissionSet` wirft `MissionValidationError` |

## Persistenz (`localStorage`)

`Recorder` hält die letzten 10 fertigen Logs (JSONL-Strings) unter
`im-netz-der-detektive:game-logs`. Ein Log-`header` enthält `gameId`,
`mapId`, `seed`, `config`, `mission`, `cameras`, `starts`; der
`result`-Eintrag `outcome`, `rounds`, `hintsTotal`, `camerasTriggered`.
Kein `savedAt`-Zeitstempel, kein Mid-Game-Save — „Partie fortsetzen"
ist in Schritt 12 vorgesehen.

## Assets

`src/assets/` existiert noch nicht; aktuell ausschließlich
SVG/CSS-Artwork (`MapGraph`, Legenden). Keine externen Requests zur
Laufzeit.
