← [Zurück zur Übersicht](index.md)

# Kartenpakete — Beschreibung

## Zweck

Jede Stadt, auf der gespielt werden kann, liegt als eigenes Kartenpaket
vor. Ein Paket beschreibt das Wegenetz aus echten Orten (Knoten) und
Verbindungen (Kanten), die Startregeln für Ganove und Detektive sowie
alle Einstellwerte, die mit der Kartengröße und -form zusammenhängen —
von der empfohlenen Detektivzahl bis zur Dauer von Straßensperrungen.
Neue Städte lassen sich ohne Programmänderung nachrüsten: ein neues
Paket genügt.

## Funktionsweise

- **Münster (Hauptkarte):** 59 echte, wiedererkennbare Orte — Domplatz,
  Prinzipalmarkt, Schloss, Aasee, Hauptbahnhof, Stadthafen, Kreuzviertel
  und weitere — angeordnet in der realen relativen Lage der Stadt:
  Innenstadt zentral, Schlosspark westlich, Aasee südwestlich, Hafen
  südlich, Hauptbahnhof südöstlich, Nordstadt im Norden. 101
  Verbindungen, überwiegend normale Wege, ergänzt um wenige schnelle
  Bus-/Bahn-Achsen (etwa Hauptbahnhof ↔ Domplatz ↔ Hafen).
- **Lübeck (Validierungskarte):** die kompakte Altstadtinsel mit nur 22
  Orten — Holstentor, Marienkirche, Rathaus, Dom, Burgtor, Salzspeicher,
  Buddenbrookhaus u. a. Brücken bilden natürliche Engpässe; vier
  Fluchtpunkte auf kleiner Fläche machen die Karte bewusst unausgewogen.
  Sie dient als Gegenprobe: Laden und Spielbarkeit müssen auch bei
  einem strukturell völlig anderen Paket funktionieren.
- **Ortskategorien:** Jeder Ort trägt eine oder mehrere Kategorien —
  `diebstahl`, `kontakt`, `sabotage` oder `flucht`. Sie bestimmen, an
  welchen Orten der Ganove welche Missionsziele verfolgen kann.
- **Zonen:** Orte sind Stadtvierteln/Bereichen zugeordnet (z. B.
  `innenstadt`, `schlosspark`, `aasee` in Münster; `westend`, `nord`,
  `mitte`, `sued` in Lübeck). Zonen sind die Grundlage für grobe
  Orts-Hinweise.
- **Startregeln:** Die Detektive werden zuerst platziert, der Ganove
  zuletzt — in Münster mit einem Mindestabstand von drei Wegen, in
  Lübeck mit nur zwei (Teil der kleineren, schärferen Karte).
- **Karteneigene Einstellwerte:** Jede Karte schlägt Werte vor und
  legt den erlaubten Bereich fest — z. B. Münster: 4 Detektive
  (2–6 erlaubt), 8 Kameras (0–15), Zeitlimit 30 Runden (ab 15 oder
  unbegrenzt). Lübeck wählt bewusst andere, engere Werte.

## Beispiele

- Eine Flucht in Münster kann über den Hauptbahnhof, den Fernbusbahnhof,
  den Hafenpier oder die Autobahnabfahrten Nord (A43) und Süd
  (Hiltrup) laufen — sieben echte Ausfallrichtungen am Kartenrand.
- Auf der Lübecker Insel führen die wenigen Brücken beim Holstentor
  (Westen), Burgtor (Norden) und Mühlentor (Süden) ins Freie — wer die
  Engpässe kontrolliert, begrenzt die Flucht.

## Einschränkungen

- Die Karten sind handgefertigt und topografisch angenähert — keine
  maßstabsgenaue Geografie, aber erkennbare reale Anordnung.
- Karten-Auswahl und Spielfeld-Darstellung folgen in späteren
  Entwicklungsschritten; die Pakete liegen derzeit dem Spielkern als
  Datengrundlage vor.
