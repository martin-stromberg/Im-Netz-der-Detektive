# Aufgabenliste – Anforderungsbearbeitung

Branch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-14-endabnahme-polishing`
Basisbranch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel`

**Abweichung:** Keine Unteragenten verfügbar — alle Schritte werden vom Lifecycle-Agenten selbst ausgeführt.

| Status | Schritt | Beschreibung | Artefakt |
|--------|---------|--------------|----------|
| [x] | 1 | Branch-Name ermitteln | – |
| [x] | 2 | Verzeichnisstruktur vorbereiten | `docs/features/{branchname}/` |
| [x] | – | Einstiegspunkt ermitteln | – |
| [x] | 3 | Anforderung übersetzen | `requirement.md` |
| [x] | 4 | Bestandsaufnahme | `inventory.md` |
| [x] | 5 | Umsetzungsplanung | `plan.md` |
| [x] | 5a | Offene Punkte prüfen | `plan.md` |
| [x] | 5b | Plan gegen Anforderung und Testbedarf prüfen | `plan-check.md` |
| [x] | 5c | Planungscommit | `be449b6` |
| [x] | 6 | Implementierung | Codeänderungen (KI-Balancing, E2E-Fixes, CI-Jobs, Assets) |
| [x] | 7 | Plan-Review (bedingt) | `review.md` |
| [x] | 8 | Usability-Review | `review-usability.md` |
| [x] | 9 | Code-Review | `review-code.md` |
| [x] | 10 | Tests ausführen | `test-results.md` |
| [x] | – | Iteration oder Abschluss entscheiden | Abschluss — keine Iteration nötig |
| [–] | 11 | Folgeaufgaben dokumentieren | kein Schleifenabbruch — kein `continue.md` |
| [x] | 12 | Dokumentation erstellen | `docs/help/spiel-engine/balancing-bericht.md` |
| [x] | 12b | README aktualisieren | `README.md` |
| [x] | 12c | Release Notes aktualisieren | `docs/RELEASE_NOTES.md` |
| [x] | – | Feature-Verzeichnis löschen | Entscheidung: bleibt erhalten (Projektkonvention — alle bisherigen Schritt-Verzeichnisse liegen ebenfalls unter `docs/features/`) |
| [x] | – | Commit durchführen | `9e466ac` |
