← [Zurück zur Übersicht](../index.md)

# Spieloberfläche

Die spielbare Oberfläche in zwei Perspektiven:

- **Ganove-Modus** (Schritt 9): ein Mensch spielt den Ganoven gegen
  die KI-Detektive — SVG-Karte, Missionsfortschritt, Hitze-Indikator,
  Polizeifunk und alle Endzustände.
- **Detektiv-Modus** (Schritt 10): ein Mensch führt den ganzen
  Detektivtrupp gegen den KI-Ganoven — vollständige Stadtkarte mit
  Kameras, Zonen und Ortskategorien, Hinweis-Chronik, kommentierbaren
  Spielermarkern, dem „Mögliche Positionen"-Overlay aus dem
  Deduktionsmodell und der Missionsstruktur mit Zielpools (die
  gezogenen Zielorte bleiben verborgen).

## Moduswahl (vorläufig)

Beide Modi sind über die vorläufige Moduswahl erreichbar: Ohne
URL-Parameter erscheint beim Start eine Auswahl zwischen „Ganove" und
„Detektive"; `?mode=ganove` bzw. `?mode=detektiv` wählt direkt. Das
endgültige Menü folgt in Entwicklungsschritt 11.

## Inhalt

- [Beschreibung](beschreibung.md)
- [Ablauf für Anwender](ablauf-anwender.md)
- [Technischer Ablauf](ablauf-technisch.md)
