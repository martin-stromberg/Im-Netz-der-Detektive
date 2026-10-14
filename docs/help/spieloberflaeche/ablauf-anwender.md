← [Zurück zur Übersicht](index.md)

# Spieloberfläche — Ablauf für Anwender

Dieser Ablauf beschreibt zuerst den **Menüfluss** (für beide
Perspektiven gemeinsam), dann den **Ganove-Modus** und danach den
**Detektiv-Modus**. Die Entwickler-Einstiege `?mode=ganove` bzw.
`?mode=detektiv` bleiben für Tests erhalten.

# Menüfluss

## Schritt-für-Schritt-Anleitung

### 1. Hauptmenü

- **Neue Partie** startet den Auswahlfluss.
- **Partie fortsetzen** ist vorbereitet, aber deaktiviert, bis laufende
  Partien gespeichert werden (folgt in einem späteren Schritt).
- **Statistiken & Replays** listet die aufgezeichneten Partien
  (Karte, Seed, Ausgang, Runden) — das Abspielen folgt später.

### 2. Karte wählen

Münster und Lübeck sind spielbar; Hamburg und Köln sind als „In
Vorbereitung" markiert und nicht wählbar.

### 3. Modus wählen

„Ganove" (du fliehst), „Detektiv" (du führst den Trupp) oder der
„Dev-Modus" (KI gegen KI als Balancing-Werkzeug mit Batch-Auswertung).

### 4. Einstellungen

Alle Werte liegen in den erlaubten Korridoren der Karte — die
Vorschläge sind vorausgewählt: Detektiv- und Kameraanzahl,
Rundenlimit (mit „Unbegrenzt" nur auf Karten, die es erlauben —
z. B. Münster), Polizeifunk-Tiefe, Sperrdauer, Ereignismodus
(Im Takt / Zufällig / Spannung) und die Ereignis-Kadenz. Ungültige
Werte werden beim Weitergehen namentlich beanstandet.

### 5. Mission wählen

- **Fall:** ein benannter, handgebauter Fall mit Mini-Story (falls die
  Karte welche mitbringt).
- **Zufalls-Mission:** die Ziele werden regelkonform gelost.
- **Spielerdefiniert:** Diebstahl → Kontakt → Fluchtpunkt (plus
  optionale Sabotage) werden direkt auf der Karte gewählt — nur Orte
  der passenden Kategorie sind wählbar, und die Mission wird gegen
  die Kriterien geprüft, bevor sie übernommen werden kann.
- **Ohne Mission:** freie Flucht über jeden Fluchtpunkt.

### 6. Startaufstellung

Danach geht es in den gewählten Modus — die Aufstellung folgt den
Kartenregeln: Detektive zuerst, Ganove zuletzt; bei „Zufall" wird
automatisch aufgestellt.

---

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

„Detektiv" in der Moduswahl wählen (oder direkt `?mode=detektiv`
öffnen) — die Aufstellung folgt nach den Einstellungen und der
Missionswahl.

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
