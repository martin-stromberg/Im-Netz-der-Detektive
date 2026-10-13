← [Zurück zur Übersicht](index.md)

# Projektinfrastruktur — Beschreibung

## Zweck

Die Projektinfrastruktur sorgt dafür, dass jede Änderung an „Im Netz der
Detektive" automatisch geprüft, gebaut und als Version veröffentlicht wird —
ohne dass Entwickler dafür manuelle Schritte brauchen.

## Funktionsweise

- **Lokale Entwicklung:** Ein Dev-Server liefert die Anwendung im Browser;
  Tests, Formatierung, Linting und Typprüfung lassen sich mit einzelnen
  Befehlen ausführen.
- **Qualitätsgates vor dem Push:** Einmalig aktivierte Git-Hooks prüfen bei
  jedem Commit die Übersetzungsschlüssel, Kartenpakete und den
  Ausschluss von Zufallsquellen in der Spiellogik; vor einem Push wird das
  gesamte Repository geprüft. Direkte Commits und Pushes auf die beiden
  Hauptbranches werden abgelehnt.
- **Automatische Prüfung je Änderungsantrag:** Jeder Pull Request auf den
  Integrationsbranch durchläuft Format-, Sicherheits- und Typprüfungen sowie
  den vollständigen Build samt Tests und einer Mindest-Testabdeckung von
  70 % der Codezeilen.
- **Automatische Vorabversionen:** Jede auf den Integrationsbranch
  übernommene Änderung erzeugt automatisch eine nummerierte
  Release-Candidate-Version mit dem spielbaren Build als Download.
- **Veröffentlichung:** Wird der Integrationsstand auf den Hauptbranch
  übernommen, entsteht automatisch eine reguläre Version; alternativ kann
  eine Version manuell per Tag ausgelöst werden. Fehlt einer bestehenden
  Veröffentlichung das Download-Archiv, wird es automatisch nachgeliefert.

## Beispiele

- Eine Entwicklerin öffnet einen Pull Request auf den Integrationsbranch —
  wenige Minuten später ist sichtbar, ob Formatierung, Tests und
  Abdeckung stimmen.
- Nach dem Merge erscheint automatisch eine Vorabversion, mit der
  Stakeholder den Fortschritt ausprobieren können.

## Einschränkungen

- Die Qualitätsgates greifen nur bei aktivierten Git-Hooks lokal —
  die Aktivierung ist ein einmaliger manueller Schritt je Arbeitskopie.
- Die Pipeline setzt die Branch-Topologie `staging` → `main` voraus;
  direkte Änderungen am Hauptbranch sind nicht vorgesehen.
