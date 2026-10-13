← [Zurück zur Übersicht](index.md)

# Spieloberfläche — Ablauf für Anwender

Dieser Ablauf beschreibt zuerst den **Ganove-Modus** und danach den
**Detektiv-Modus** — die Moduswahl erfolgt vorläufig über die
Startauswahl oder `?mode=ganove` bzw. `?mode=detektiv`.

# Ganove-Modus

## Voraussetzungen

Keine — die Anwendung im Browser öffnen genügt.

## Schritt-für-Schritt-Anleitung

### 1. Partie beginnen

Auf der Startansicht „Neue Partie" wählen. Die Detektive werden
automatisch auf der Karte platziert (blaue nummerierte Marker).

### 2. Startpunkt wählen

Einen der grün markierten Orte anklicken oder per Tab-Taste fokussieren
und Eingabe drücken. Orte ohne Markierung sind nicht erlaubt (zu nah an
einem Detektiv).

### 3. Runde für Runde spielen

- Bist du am Zug, wähle einen grün markierten Nachbarort — jeder Zug
  ist genau eine Kante (`Weg` durchgezogen, `Fahrt` gestrichelt).
- Danach ziehen die Detektive automatisch weiter.
- Stehst du auf dem aktuellen Missionsziel, kannst du stattdessen
  „Aktion ausführen" wählen.
- Gesperrte Straßen (ausgegraut, mit Sperrzeichen) sind für beide
  Seiten unpassierbar, bis die Sperrung abläuft.

> **Hinweis:** Der Hitze-Badge zeigt die Fahndungsaktivität — je
> höher, desto näher sind dir die Detektive auf der Spur.

### 4. Sabotage-Entscheidung

Nach dem Kontakt mit dem Informanten wähle **endgültig**: das
Sabotageziel anlaufen (mit dem genannten Effekt) oder direkt die
Flucht antreten.

### 5. Ende

Die Partie endet mit Festnahme, Umzingelung, erfolgreicher Flucht oder
dem Rundenlimit — oder du beendest sie selbst über „Als Remis beenden".
Über „Neue Partie" startest du erneut.

## Ergebnis

Eine vollständig gespielte Partie mit verständlicher Endanzeige.

## Barrierefreiheit

- Alle auswählbaren Orte sind per Tab-Taste erreichbar und per
  Eingabe/Leertaste wählbar.
- Der Hitze-Indikator zeigt Icon **und** Text; Marker, Kantentypen,
  Sperrungen und Ziele sind form- bzw. musterkodiert, nicht nur per
  Farbe.
- Eine Legende unter der Karte erklärt alle Symbole.

---

# Detektiv-Modus

## Schritt-für-Schritt-Anleitung

### 1. Modus und Partie beginnen

„Detektive" in der Startauswahl wählen (oder direkt
`?mode=detektiv` öffnen), dann „Neue Partie".

### 2. Trupp aufstellen

Der Reihe nach für jeden Detektiv (D1 → Dn) einen der markierten
legalen Orte wählen — Klick oder Tab + Eingabe. Wo der Ganove
startet, bleibt verdeckt.

### 3. Runde für Runde spielen

- Die Detektive ziehen nacheinander (D1 → Dn); der aktive Detektiv
  ist markiert und seine legalen Zielorte grün eingekreist.
- Nach dem letzten Detektiv zieht der KI-Ganove automatisch — danach
  ist wieder D1 an der Reihe.
- Lies die **Hinweis-Chronik** (rechte Seitenleiste): Kameras,
  Sichtungen, Bereichshinweise und Straßensperrungen mit Runde und
  Ort/Zone.
- Die blauen Rauten (Overlay „Mögliche Positionen") zeigen, wo der
  Ganove nach aktueller Deduktion noch sein kann — eng die
  Detektive um diese Menge.
- Eigene Verdachtsorte hältst du im Modus „Marker setzen" als
  Stecknadeln fest und kommentierst sie in der Markerliste.

> **Hinweis:** Die Missionsstruktur zeigt, welchen Schritt der
> Ganove gerade spielt und wie groß der jeweilige Zielpool ist —
> der konkrete Zielort bleibt geheim.

### 4. Ende

Festnahme, Umzingelung, Flucht des Ganoven oder Rundenlimit — oder
„Als Remis beenden" mit Bestätigung. Über „Neue Partie" geht es
erneut los.

## Ergebnis

Eine vollständig gespielte Partie aus Detektivsicht — mit Chronik,
Deduktions-Overlay und eigenen Markern, ohne jemals den Ganoven oder
seine Missionsziele zu sehen.

## Barrierefreiheit

- Alle wählbaren Orte sind per Tab erreichbar und per
  Eingabe/Leertaste aktivierbar.
- Kameras, Zonen, Kategorien, Marker, Overlay und Sperrungen sind
  form- und/oder musterkodiert — nicht nur per Farbe (Legende unter
  der Karte).
