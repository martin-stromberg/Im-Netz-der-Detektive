# Aufgabenliste – Anforderungsbearbeitung

Branch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-2-engine-grundgeruest`

> **Abweichung:** Es stehen keine Unteragenten zur Verfügung. Alle
> Unteragenten-Aufträge (translate-requirements, inventory, plan,
> plan-check, implement, review-plan, review-usability, review-code,
> run-tests, update-docs, update-readme, update-release-notes) werden vom
> Lifecycle-Agenten selbst ausgeführt — ausdrücklich vom Skill erlaubt
> („Wichtiger Hinweis vorab" in `lifecycle.md`).

| Status | Schritt | Beschreibung | Artefakt |
|--------|---------|--------------|----------|
| [x] | 1 | Branch-Name ermitteln | – |
| [x] | 2 | Verzeichnisstruktur vorbereiten | `docs/features/{branchname}/` |
| [x] | – | Einstiegspunkt ermitteln (keine Artefakte → Schritt 3) | – |
| [x] | 3 | Anforderung übersetzen (selbst, keine Unteragenten) | `requirement.md` |
| [x] | 4 | Bestandsaufnahme (selbst) | `inventory.md`, `inventory/` |
| [x] | 5 | Umsetzungsplanung (selbst) | `plan.md` |
| [x] | 5a | Offene Punkte prüfen (keine vorhanden) | `plan.md` |
| [x] | 5b | Plan gegen Anforderung und Testbedarf prüfen (selbst) | `plan-check.md` |
| [ ] | 5c | Planungscommit | – |
| [ ] | 6 | Implementierung (selbst) | Codeänderungen |
| [ ] | 7 | Plan-Review (selbst, bedingt) | `review.md` |
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
