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

„Partie fortsetzen" und „Statistiken & Replays" sind vollständig
verdrahtet: Laufende Partien lassen sich in beiden Modi über „Partie
speichern" als versionierter Snapshot sichern und exakt wieder
fortsetzen; die Statistikansicht zeigt aggregierte Kennzahlen
(Siegquoten gesamt und je Modus, Ø Runden/Hinweise/Kameratreffer) und
verwaltet die aufgezeichneten Partien (Replay-Abspieler mit Timeline
und beiden `visibleTo`-Perspektiven, Export als JSONL, einzelnes und
komplettes Löschen).
`?mode=ganove`/`?mode=detektiv` bleiben als direkte Entwickler-Einstiege
erhalten.

## Spieltisch (Schritt 7)

Alle Bildschirme — Hauptmenü, Karten-, Modus-, Einstellungs- und
Missionswahl, Dev-Modus, Statistiken, Fortsetzen, Replay,
Anwendungs-Einstellungen und beide Spielbretter — ruhen auf
derselben dunklen Tischfläche. In der Partie liegt das Brett in
einer gerahmten Spieleinlage mit Kartenfach-Seitenleiste und
Zählleiste; auf schmalen Bildschirmen stapelt die Einlage weiter
vertikal.

## Endabnahme (Schritt 8)

Das Design wurde abschließend über alle Bildschirme und Verträge
geprüft: Legenden, Figuren, Tokens und Routen spiegeln die finale
Formensprache, jede Statusinformation ist Form *und* Farbe, jeder
Tastaturfokus trägt einen sichtbaren Ring, sämtliche Bewegungen
respektieren die Reduced-Motion-Einstellung, und alle Assets
(Schriftart IM Fell English, Rasterbilder) sind lokal eingebettet —
dokumentiert in `src/assets/ASSETS.md`.

## Inhalt

- [Beschreibung](beschreibung.md)
- [Ablauf für Anwender](ablauf-anwender.md)
- [Technischer Ablauf](ablauf-technisch.md)
