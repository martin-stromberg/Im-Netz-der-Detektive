# Aufgabenliste – Anforderungsbearbeitung

Branch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-1-scaffold-qualitaet`
Basisbranch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel`

Hinweis: Es stehen keine Unteragenten zur Verfügung — alle in `lifecycle.md`
als Unteragenten-Aufträge beschriebenen Schritte werden vom Hauptagenten selbst
ausgeführt (von `lifecycle.md` ausdrücklich erlaubt). Die Modell-/Slash-Kommando-
Angaben werden als Labels interpretiert; die jeweilige Kommando-Datei unter
`.agents/skills/lifecycle/` enthält die eigentliche Arbeitsanweisung.

| Status | Schritt | Beschreibung | Artefakt |
|--------|---------|--------------|----------|
| [x] | 1 | Branch-Name ermitteln | – |
| [x] | 2 | Verzeichnisstruktur vorbereiten | `docs/features/{branchname}/` |
| [x] | – | Einstiegspunkt ermitteln (keine Artefakte vorhanden → Schritt 3) | – |
| [x] | 3 | Anforderung übersetzen (selbst, kein Unteragent) | `requirement.md` |
| [x] | 4 | Bestandsaufnahme (selbst) | `inventory.md`, `inventory/` |
| [x] | 5 | Umsetzungsplanung (selbst) | `plan.md` |
| [x] | 5a | Offene Punkte prüfen (Abschnitt „Keine") | `plan.md` |
| [x] | 5b | Plan gegen Anforderung und Testbedarf prüfen (selbst) | `plan-check.md` — Plan vollständig |
| [ ] | 5c | Planungscommit | – |
| [ ] | 6 | Implementierung (selbst) | Codeänderungen |
| [ ] | 7 | Plan-Review (selbst) | `review.md` |
| [ ] | 8 | Usability-Review (selbst, bei UI-Änderungen) | `review-usability.md` |
| [ ] | 9 | Code-Review (selbst) | `review-code.md` |
| [ ] | 10 | Tests ausführen (selbst) | `test-results.md` |
| [ ] | – | Iteration oder Abschluss entscheiden | – |
| [ ] | 11 | Folgeaufgaben dokumentieren (bei Schleifenabbruch) | `continue.md` |
| [ ] | 12 | Dokumentation erstellen (selbst) | `docs/help/` |
| [ ] | 12b | README aktualisieren (selbst) | `README.md` |
| [ ] | 12c | Release Notes aktualisieren (selbst) | `docs/RELEASE_NOTES.md` |
| [ ] | – | Feature-Verzeichnis löschen | – |
| [ ] | – | Commit durchführen | – |
