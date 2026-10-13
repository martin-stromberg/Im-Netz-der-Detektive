← [Zurück zur Übersicht](index.md)

# Spieloberfläche — Beschreibung

Zwei spielbare Perspektiven teilen sich diese Dokumentation:
**Ganove-Modus** (Mensch als Ganove) und **Detektiv-Modus** (Mensch
als Detektivtrupp). Die Moduswahl erfolgt vorläufig über die
Startauswahl oder `?mode=` — das endgültige Menü folgt in Schritt 11.

# Ganove-Modus — Beschreibung

## Zweck

Der Ganove-Modus lässt dich als **Ganove** gegen die KI-Detektive
spielen: Du erfüllst eine Mission (Diebstahl → Kontakt → ggf. Sabotage
→ Flucht) über das Wegenetz einer Stadt, während die Detektive dich
anhand ihrer Hinweise einkreisen.

## Funktionsweise

- **Startaufstellung:** Nach „Neue Partie" beziehen die Detektive ihre
  Positionen — danach wählst du deinen Startpunkt aus den markierten,
  legalen Orten (mit Mindestabstand zu den Detektiven).
- **Karte:** Die Stadtkarte zeigt alle Orte mit Klarnamen, Wege als
  Linien und schnelle „Fahrten" als gestrichelte Linien, gesperrte
  Straßen ausgegraut mit Sperrzeichen, die Detektive als nummerierte
  Marker, deine eigene Position und deine Missionsziele als
  Form-Symbole. Eine Legende unter der Karte erklärt alle Zeichen.
- **Ziehen:** In deinem Zug wählst du einen grün markierten
  Nachbarort — pro Zug genau eine Kante, Stehenbleiben ist nicht
  erlaubt. Danach ziehen die Detektive automatisch.
- **Mission:** Die Seitenleiste zeigt die feste Schrittfolge mit
  Status und das aktuelle Ziel. Am Zielort kannst du die Aktion
  ausführen — oder weiterziehen. Nach dem Kontakt bietet der
  Informant eine Sabotage an: Die Wahl zwischen Sabotageziel und
  direkter Flucht ist endgültig.
- **Hitze-Indikator:** Das Badge „Polizeiaufmerksamkeit" zeigt mit
  Symbol und Text in vier Stufen, wie aktiv die Fahndung gerade ist.
- **Polizeifunk:** Einmalig pro Partie hörst du den Funk der Detektive
  ab und erfährst die letzten Hinweise.
- **Ende:** Die Partie endet durch Festnahme, Umzingelung, deine
  Flucht, das Rundenlimit oder ein Remis (aktiv beendbar über „Als
  Remis beenden" mit Bestätigung).

## Beispiele

- Du stehst auf dem Diebstahl-Zielort: Neben dem Weiterziehen erscheint
  die Schaltfläche „Diebstahl ausführen".
- Nach dem Informanten-Treffen entscheidest du: Sabotage „Funkstille"
  am Stadtwerk — oder direkt zum Fluchtpunkt.

## Einschränkungen

- Der Ganove sieht **keine** Kameras und **keine** Hinweise der
  Detektive — das ist gewollte Informationsasymmetrie; der Polizeifunk
  ist der einzige Einblick (einmalig).
- Karten- und Konfigurationsauswahl (Stadt, Detektivzahl, Zeitlimit,
  feste Fälle) folgt mit dem Menü in einem späteren Schritt — aktuell
  startet eine Partie mit den Standardwerten der Karte Münster und
  einer generierten Mission.

---

# Detektiv-Modus — Beschreibung

## Zweck

Der zweite Spielmodus kehrt die Perspektive um: Du führst den ganzen
**Detektivtrupp** gegen den KI-Ganoven — einkreisen, Hinweise lesen
und den unsichtbaren Gegner deduktiv eingrenzen.

## Funktionsweise

- **Moduswahl (vorläufig):** Ohne URL-Parameter wählst du beim Start
  zwischen den beiden Spielmodi; `?mode=detektiv` öffnet diesen Modus
  direkt. Das endgültige Menü folgt in Schritt 11.
- **Startaufstellung:** Nach „Neue Partie" verteilst du deine
  Detektive Posten für Posten (D1 → Dn) auf die markierten legalen
  Kandidaten — der Startort des Ganoven wird verdeckt gezogen und nie
  angezeigt. Karten mit `random`-Aufstellung weisen die Posten
  automatisch zu.
- **Karte:** Du siehst die komplette Stadtkarte: alle Orte mit
  Klarnamen und Ortskategorien (Diebstahl-/Kontakt-/Flucht-/Sabotage-
  Pool als Flaggensymbol), Zonen als farbige Grundflächen (Legende
  nennt die Zonennamen), Wege und Fahrten, gesperrte Straßen mit
  Sperrzeichen, deine Detektive als nummerierte Marker und alle
  Kameras — aktive als gefülltes Symbol, sabotierte gestrichen. Den
  Ganoven siehst du **nie**.
- **Ziehen:** Die Detektive ziehen in fester Reihenfolge D1 → Dn;
  der aktive Detektiv ist hervorgehoben, seine legalen Zielorte grün
  markiert und klick-/tastaturbedienbar. Nach dem letzten Detektiv
  zieht der KI-Ganove automatisch (die Anzeige zeigt „Der Ganove
  zieht …") — der Fang wird nach jedem einzelnen Detektivzug geprüft.
- **Hinweis-Chronik:** Jeder detektivsichtbare Hinweis landet
  chronologisch in der Chronik — mit Rundenbadge, Art (Kamera,
  Sichtung, Bereichshinweis, Aktions-Spur, Straßensperrung) und Ort
  bzw. Zone.
- **Eigene Marker:** Im „Marker setzen"-Modus legst du per Klick
  Stecknadel-Marker auf beliebige Orte und kommentierst sie in der
  Liste — deine Notizen bleiben über die ganze Partie bestehen und
  gehen nicht in den Spielverlauf ein.
- **„Mögliche Positionen"-Overlay:** Die blauen Rauten zeigen exakt
  die Menge an Orten, auf denen der Ganove laut Deduktionsmodell
  noch sein kann — dieselbe Berechnung, mit der die KI-Detektive
  arbeiten. Ein-/ausschaltbar, mit Zähler.
- **Missionsstruktur:** Die Seitenleiste zeigt die Schrittfolge mit
  Status und jeweils der Größe des Zielpools — welchen Ort der
  Ganove gezogen hat, bleibt verborgen.
- **Ende:** Festnahme, Umzingelung, Flucht des Ganoven, Rundenlimit
  oder Remis — jeder Endzustand wird verständlich angezeigt.

## Einschränkungen

- Die Asymmetrie gilt umgekehrt: Zielorte der Mission, Position des
  Ganoven und seine Sichtdaten existieren auf dieser Oberfläche nicht.
- Einzelne Detektive können nicht „stehenbleiben" (Zugzwang) und
  bewegen sich nur über eine Kante pro Zug.
