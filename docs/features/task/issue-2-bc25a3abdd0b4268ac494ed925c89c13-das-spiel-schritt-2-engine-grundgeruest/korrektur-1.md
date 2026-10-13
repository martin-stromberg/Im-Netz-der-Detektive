# Korrektur 1 – `spawnRules.*.zones` bei `mode: "choice"` validieren

## Anlass

Abnahmeprüfung `docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/acceptance-schritt-2.md`:

- `spawnRules.detectives`/`spawnRules.ganove` mit `mode: "choice"`:
  `zones` wurde von `validateMapPack` nur auf „ist Array" geprüft —
  `zones: []`, Nicht-String-Einträge und unbekannte Zonenreferenzen
  passierten die Paketvalidierung unbemerkt und schlugen erst zur
  Laufzeit als `SpawnError` (`SpawnSystem.ts`, „resolved to no candidate
  nodes") auf. Dieselbe Lücke bestand im gespiegelten Git-Hook
  `.githooks/map-schema-check.py`.
- Damit war das Akzeptanzkriterium „ungültige Pakete werden mit
  verständlicher Fehlermeldung abgelehnt (… Referenzfehler)" für
  Zonenreferenzen nur eingeschränkt erfüllt.

## Korrektur

`src/logic/mapPack.ts`:

- `checkNodes` sammelt zusätzlich `zoneNames` (alle tatsächlich im Paket
  vorkommenden, nicht-leeren `node.zone`-Werte); `validateMapPack` reicht
  die Menge über `checkSpawnRules` an `checkSpawnRule` durch.
- `checkSpawnRule` prüft bei `mode: "choice"` jetzt beide Listen
  symmetrisch:
  - `nodes`/`zones` vorhanden, aber kein Array →
    „must be an array of node ids" bzw. „must be an array of zone names".
  - Array leer → „must not be empty".
  - Einträge: Nicht-String oder unbekannte Referenz →
    „unknown node id" bzw. „unknown zone" (mit `JSON.stringify`-Wert).
  - Weder `nodes` noch `zones` als Array vorhanden → weiterhin
    „mode "choice" requires a "nodes" or "zones" list".
- Fehler werden wie bisher aggregiert in `MapValidationError.errors`
  („path: message") gemeldet.

`.githooks/map-schema-check.py` (funktional deckungsgleich gespiegelt):

- `validate_map` sammelt `zone_names` aus validen `node.zone`-Werten;
  `check_spawn_rule` erhält `zone_names` und prüft `zones` mit denselben
  Regeln/Fehlertexten wie oben.
- Robustheitsangleichung an die Engine-Validierung: `not isinstance(x,
  str) or`-Guards bei Referenz-/Enum-Checks (`edges[].a/b`,
  `nodes[].categories`, `spawnRules.*.nodes`, `sabotageEffects`), damit
  unhashbare Einträge (Listen/Dicts) wie in der TS-Validierung als
  verständlicher Fehler statt als `TypeError`-Abbruch gemeldet werden.

`src/logic/mapPack.test.ts`: fünf neue Tests — leere `zones`-Liste,
`zones` als Nicht-Array, Nicht-String-Eintrag, unbekannte Zonenreferenz
(für `detectives` und `ganove`) sowie ein gültiges Paket mit `zones`
in beiden `choice`-Regeln.

## Verifikation (lokal, Branch task/…-schritt-2-engine-grundgeruest)

| Befehl | Ergebnis |
| --- | --- |
| `npm test` | Exit 0 — 8 Dateien / 92 Tests grün (vorher 87) |
| `npm run coverage` | Exit 0 — Statements 88,71 %, Branches 82,45 %, Lines 88,1 % (≥ 70 %) |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0 — keine Findings |
| `npm run format:check` | Exit 0 — „All matched files use Prettier code style!" |
| `python .githooks/map-schema-check.py --all --strict` | Exit 0 — „1 all map package(s) valid." |
| Hook auf manipuliertes Paket (`zones: ["nichtda", 42]`, `zones: []`) | Exit 1 mit „unknown zone"/„must not be empty"-Findings |
