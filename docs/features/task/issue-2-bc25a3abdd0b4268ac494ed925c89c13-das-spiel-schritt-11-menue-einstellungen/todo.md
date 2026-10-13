# Aufgabenliste – Anforderungsbearbeitung

Branch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-11-menue-einstellungen`

> **Abweichung vom Skill:** Dieser Lauf hat keine Unteragenten — alle
> Kommandoschritte (translate-requirements, inventory, plan, plan-check,
> implement, review-plan, review-usability, review-code, run-tests,
> update-docs, update-readme, update-release-notes) werden vom
> Lifecycle-Agenten selbst ausgeführt und in denselben Artefakten
> dokumentiert.

| Status | Schritt | Beschreibung | Artefakt |
|--------|---------|--------------|----------|
| [x] | 1 | Branch-Name ermitteln | – |
| [x] | 2 | Verzeichnisstruktur vorbereiten | `docs/features/{branchname}/` |
| [x] | – | Einstiegspunkt ermitteln (keine Artefakte → Schritt 3) | – |
| [x] | 3 | Anforderung übersetzen (selbst ausgeführt) | `requirement.md` |
| [x] | 4 | Bestandsaufnahme (selbst ausgeführt) | `inventory.md`, `inventory/` |
| [x] | 5 | Umsetzungsplanung (selbst ausgeführt) | `plan.md` |
| [x] | 5a | Offene Punkte prüfen — Abschnitt leer | `plan.md` (aktualisiert) |
| [x] | 5b | Plan gegen Anforderung und Testbedarf prüfen (selbst ausgeführt) — `Plan vollständig` | `plan-check.md` |
| [ ] | 5c | Planungscommit | – |
| [ ] | 6 | Implementierung (selbst ausgeführt) | Codeänderungen |
| [ ] | 7 | Plan-Review (selbst ausgeführt, bedingt) | `review.md` |
| [ ] | 8 | Usability-Review (selbst ausgeführt, UI-Änderungen) | `review-usability.md` |
| [ ] | 9 | Code-Review (selbst ausgeführt) | `review-code.md` |
| [ ] | 10 | Tests ausführen (selbst ausgeführt) | `test-results.md` |
| [ ] | – | Iteration oder Abschluss entscheiden | – |
| [ ] | 11 | Folgeaufgaben dokumentieren (bei Schleifenabbruch) | `continue.md` |
| [ ] | 12 | Dokumentation erstellen (selbst ausgeführt) | `docs/help/` |
| [ ] | 12b | README aktualisieren (selbst ausgeführt) | `README.md` |
| [ ] | 12c | Release Notes aktualisieren (selbst ausgeführt) | `docs/RELEASE_NOTES.md` |
| [ ] | – | Feature-Verzeichnis löschen | – |
| [ ] | – | Commit durchführen | – |
