# Aufgabenliste – Anforderungsbearbeitung

Branch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-8-deduktion-ki`

**Abweichung:** Es stehen keine Unteragenten zur Verfügung. Alle im Lifecycle als „(Unteragent)" gekennzeichneten Schritte werden vom Lifecycle-Agenten selbst ausgeführt; die Artefakte und Statusmarkierungen folgen den Kommando-Definitionen.

| Status | Schritt | Beschreibung | Artefakt |
|--------|---------|--------------|----------|
| [x] | 1 | Branch-Name ermitteln | – |
| [x] | 2 | Verzeichnisstruktur vorbereiten | `docs/features/{branchname}/` |
| [x] | – | Einstiegspunkt ermitteln (kein Artefakt vorhanden → Schritt 3) | – |
| [ ] | 3 | Anforderung übersetzen (selbst, kein Unteragent) | `requirement.md` |
| [ ] | 4 | Bestandsaufnahme (selbst, kein Unteragent) | `inventory.md`, `inventory/` |
| [ ] | 5 | Umsetzungsplanung (selbst, kein Unteragent) | `plan.md` |
| [ ] | 5a | Offene Punkte prüfen und ggf. Planung wiederholen | `plan.md` (aktualisiert) |
| [ ] | 5b | Plan gegen Anforderung und Testbedarf prüfen (selbst) | `plan-check.md` |
| [ ] | 5c | Planungscommit | – |
| [ ] | 6 | Implementierung (selbst) | Codeänderungen |
| [ ] | 7 | Plan-Review (selbst) | `review.md` |
| [ ] | 8 | Usability-Review (bei UI-Änderungen) | `review-usability.md` |
| [ ] | 9 | Code-Review (selbst) | `review-code.md` |
| [ ] | 10 | Tests ausführen (selbst) | `test-results.md` |
| [ ] | – | Iteration oder Abschluss entscheiden | – |
| [ ] | 11 | Folgeaufgaben dokumentieren (bei Schleifenabbruch) | `continue.md` |
| [ ] | 12 | Dokumentation erstellen (selbst) | `docs/help/` |
| [ ] | 12b | README aktualisieren (selbst) | `README.md` |
| [ ] | 12c | Release Notes aktualisieren (selbst) | `docs/RELEASE_NOTES.md` |
| [ ] | – | Feature-Verzeichnis löschen | – |
| [ ] | – | Commit durchführen | – |
