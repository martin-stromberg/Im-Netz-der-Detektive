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
  Ereignismodus, Spannungswert, Seed, Spielergebnis, Rundenlimit,
  Fluchtpunkte und das Aktionsprotokoll — und lässt sich vollständig
  ohne Oberfläche steuern.
- **Rundenablauf:** Jede Runde hat zwei Phasen. Zuerst zieht der
  Ganove auf einen legalen Nachbarort — oder nutzt seine Aktionsrunde
  (einzige Ausnahme vom Zugzwang, vorgesehen für das Missionssystem).
  Danach zieht jeder Detektiv einzeln in fester Reihenfolge. Ein Zug
  ist immer genau eine Kante — egal ob Weg oder Fahrt — und
  stehenbleiben ist verboten. Von Detektiven besetzte Orte sind für
  den Ganoven tabu; Detektive dürfen sich einen Ort teilen. Gesperrte
  Kanten sind für beide Seiten unpassierbar.
- **Spielende:** Die Engine erkennt alle fünf Enden: **Fang** (ein
  Detektiv beendet seinen Zug auf dem Ganoven-Ort — die Partie endet
  sofort mitten in der Detektivphase), **Umzingelung** (der Ganove hat
  zu Beginn seiner Phase keinen legalen Zug und keine ausführbare
  Aktion), **Flucht** (der Ganove erreicht einen freien Fluchtpunkt),
  **Zeitlimit** (Ablauf ohne Flucht — abschaltbar per „unbegrenzt")
  und **Remis** (vorzeitiger Abbruch als Unentschieden).

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

- Die Aktionsrunde des Ganoven ist strukturell vorgesehen (Prüfpunkt
  `ganoveCanAct` + `ganoveAction`), ihre fachlichen Effekte folgen erst
  mit dem Missionssystem — ebenso die missionsgebundene Flucht, die
  über `setEscapeNodeIds` an die vorhandene Fluchtpunkt-Prüfung
  anschließt.
- Missionslogik, Kameras/Ereignisse im Spielablauf und KI sind noch
  nicht Teil der Engine — sie bauen auf dem Rundenmotor in späteren
  Entwicklungsschritten auf.
- Der Zustand speichert bereits Mission, Ereignisse und Kameras; die
  Logik, die diese Felder befüllt, folgt später.
