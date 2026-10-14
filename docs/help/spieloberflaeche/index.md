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

## Anwendungsrahmen (Schritt 11)

Beide Modi laufen über das vollständige Hauptmenü: „Neue Partie" führt
durch **Kartenwahl** (Münster und Lübeck spielbar, Hamburg und Köln als
„In Vorbereitung" markiert), **Moduswahl** (Ganove, Detektiv oder der
KI-vs.-KI-Dev-Modus mit Batch-Auswertung), kartengebundene
**Einstellungen** (Detektive, Kameras, Rundenlimit inkl. „Unbegrenzt"
wo erlaubt, Polizeifunk-Tiefe, Sperrdauer, Ereignismodus und -Kadenz —
jeweils mit Vorschlagswerten und erlaubten Korridoren) und die
**Missionsauswahl** (benannter Fall mit Mini-Story, Zufallsmission,
spielerdefinierte Mission mit Kategorie-Picks auf der Karte und
Kriterienprüfung, oder freie Flucht ohne Mission). Danach folgt die
Startaufstellung der gewählten Perspektive.

„Partie fortsetzen" und „Statistiken & Replays" nutzen die
persistenzfähige Eintragsstruktur: Die Statistikansicht listet bereits
die aufgezeichneten Partien (neueste zuerst), Fortsetzen bleibt
deaktiviert, bis laufende Partien gespeichert werden (Schritt 12).
`?mode=ganove`/`?mode=detektiv` bleiben als direkte Entwickler-Einstiege
erhalten.

## Inhalt

- [Beschreibung](beschreibung.md)
- [Ablauf für Anwender](ablauf-anwender.md)
- [Technischer Ablauf](ablauf-technisch.md)
