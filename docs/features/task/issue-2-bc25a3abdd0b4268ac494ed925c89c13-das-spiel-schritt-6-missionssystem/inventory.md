# Bestandsaufnahme: Missionssystem (Schritt 6)

Analyse der vorhandenen Engine-Bausteine in `src/logic/` und `src/state/`, bezogen auf die Missionsanforderung (Spec §5, `01-spielkonzept.md`).

## Zusammenfassung

- **Vorhanden und direkt nutzbar:** BFS-Metrik (`Graph.bfsDistances`/`distance`), Seed-RNG inkl. `mixSeed`, Kategorie-Pools in den Kartenpaketen (`diebstahl`/`kontakt`/`sabotage`/`flucht`), `settings.missionRules` + `settings.sabotageEffects` bereits im Schema validiert, `cameraProtectedNodes`-Parameter in `placeCameras` und `StartGameOptions`, `deactivateAll`/`deactivateCameras` für `kamera_aus`, `aktion`-Event-Typ mit Hitze-Gewicht 2 bereits in `HEAT_WEIGHTS` verankert, `setEscapeNodeIds`/`setGanoveCanAct`/`setMission`/`ganoveAction`-Hooks im Store, Umzingelungsprüfung mit Aktionsverfügbarkeit als Prüfpunkt.
- **Fehlt:** Missionsdatenmodell (nur Hook-Interface), Generierung mit BFS-Kriterien + Rejection-Sampling, Stufenlogik (Diebstahl → Kontakt → Binärwahl), Aktionsausführung mit Spur-Event, Sabotage-Angebot mit Effektziehung und Effektanwendung (`funkstille`, `falsche_spur` haben noch keine Mechanik), missionsgebundener `escapeNodeIds`, Fälle-Missionssets (`src/data/missions/` existiert nicht), Loader + Validierung für Missionssets, spielerdefinierte Missionsvalidierung.
- **Beachten:** `teststadt.json` hat **keine** `sabotage`-Kategorie-Knoten (Pool leer) — Generierung muss `sabotage: null` tolerieren; `luebeck.json` hat nur 2 Sabotageknoten.

Test-Ausgangszustand: **208 Tests / 16 Dateien, alle grün**; Coverage 93,06 % Lines (≥ 70 % Schwelle). Nachweis: `inventory/test-results/baseline-vitest.txt`, `baseline-coverage.txt`, Details in [Tests](inventory/tests.md).

## Details

- [Datenmodell](inventory/models.md)
- [Logik](inventory/logic.md)
- [Tests](inventory/tests.md)
