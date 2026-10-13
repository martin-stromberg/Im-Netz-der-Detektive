← [Zurück zur Übersicht](index.md)

# Spiel-Engine — Beschreibung

## Zweck

Die Spiel-Engine bildet die technische Basis des Spiels — komplett ohne
Benutzeroberfläche. Sie sorgt dafür, dass jede Partie auf den gleichen,
überprüfbaren Regeln aufbaut: Die Stadtkarte wird als Kartenpaket
geladen und auf Vollständigkeit geprüft, Wege und Entfernungen sind
einheitlich berechenbar, Zufallsentscheidungen sind reproduzierbar, und
die Startaufstellung folgt den Regeln der jeweiligen Karte.

## Funktionsweise

- **Kartenpakete:** Jede Stadt liegt als eigenes Paket vor — mit Orten
  (Knoten), Wegen (Kanten der Typen `weg`/`fahrt`), Startregeln und
  karteneigenen Einstellwerten. Ungültige oder unvollständige Pakete
  werden abgelehnt und jeder einzelne Fehler wird benannt — fehlende
  Pflichtfelder ebenso wie ungültige Kantentypen oder Verweise auf
  nicht vorhandene Orte.
- **Wegenetz:** Die Engine beantwortet die Fragen „welche Orte sind
  direkt erreichbar?" und „wie viele Wege liegen zwischen zwei Orten?"
  — Letzteres als kürzeste Kantendistanz (Breitensuche), die Basis für
  Missionsprüfung, Zonenhinweise und Startabstände.
- **Reproduzierbarer Zufall:** Alle Zufallsentscheidungen laufen über
  einen zentralen, seedbaren Zufallsgenerator. Derselbe Startwert
  (Seed) erzeugt immer dieselbe Folge — Voraussetzung für Replays,
  Simulationen (KI gegen KI) und spätere Multiplayer-Synchronisation.
- **Startaufstellung:** Die Karte bestimmt pro Seite einen Startmodus:
  `choice` (Auswahl aus erlaubten Orten/Zonen), `free` (alle Orte mit
  Mindestabstand zu den Detektiven) oder `random` (Vergabe per Zufall).
  Die Detektive werden immer zuerst platziert, der Ganove als Letzter;
  Startpunkte unterhalb des Mindestabstands werden nie angeboten.
- **Spielzustand:** Ein zentraler Zustandsspeicher hält Runde, Phase,
  Positionen, Mission, Ereignisse, Kameras, gesperrte Kanten,
  Ereignismodus, Spannungswert, Seed und das Aktionsprotokoll — und
  lässt sich vollständig ohne Oberfläche steuern.

## Beispiele

- Ein neues Kartenpaket, dessen Kante auf einen nicht definierten Ort
  zeigt, wird beim Laden abgewiesen — die Meldung nennt die
  fehlerhafte Kante und die fehlende Orts-ID.
- Zwei Programmläufe mit Seed `42` erzeugen exakt dieselbe
  Startaufstellung und dieselbe Zufallsfolge; andere Seeds führen zu
  anderen Aufstellungen.
- Eine Karte mit `minDistanceToDetective: 3` bietet dem Ganoven nur
  Startpunkte an, die mindestens drei Kanten von jedem platzierten
  Detektiv entfernt liegen.

## Einschränkungen

- Bewegung, Missionslogik, Kameras/Ereignisse im Spielablauf und KI
  sind noch nicht Teil der Engine — sie bauen auf diesem Grundgerüst
  in späteren Entwicklungsschritten auf.
- Der Zustand speichert bereits Mission, Ereignisse, Kameras und
  gesperrte Kanten; die Logik, die diese Felder befüllt, folgt später.
