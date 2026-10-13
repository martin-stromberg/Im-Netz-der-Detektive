# Usability-Review — Detektiv-Perspektive (Schritt 10)

Review aus Anwendersicht: komplette Partie `?mode=detektiv` (Setup →
Truppführung → Werkzeuge → Ende) auf Testkarte und Münster, Tastatur
und Maus, DE-Oberfläche.

## Beobachteter Ablauf

1. **Moduswahl:** Zwei große Schaltflächen „Ganove"/„Detektive" —
   eindeutig, aber ohne Rückweg zur Auswahl innerhalb einer Ansicht
   (akzeptabel als Übergangslösung, echtes Menü in Schritt 11).
2. **Aufstellung:** Fortschrittszeile „Startpunkt für Detektiv 1 von 4
   wählen (markierte Orte)"; bereits gelegte Detektive sind sichtbar,
   der zuletzt gelegte hervorgehoben — Orientierung gut. Nur die
   legalen Kandidaten sind klick-/tastaturbedienbar; alle übrigen
   Orte sind inert.
3. **Zugsteuerung:** Aktiver Detektiv doppelt hervorgehoben
   (Rahmen + Legende), legale Ziele grün eingerahmt und klickbar bzw.
   per Tab + Eingabe wählbar; Phaseanzeige „Detektiv 2 am Zug" /
   „Der Ganove zieht …" macht den Rhythmus klar. Illegale Klicks sind
   schlicht nicht möglich.
4. **Karte:** Zonen-Flächen, Kategorie-Flaggen und Kameras sind auf
   den echten Karten (Münster) gut lesbar; die Legende benennt
   Zonen-Namen und alle Glyphen. Sperrungen sind ausgegraut plus
   Sperrzeichen.
5. **Werkzeuge:** Overlay-Schalter mit Zähler („7 mögliche Orte"),
   Marker-Modus mit klarem Wechselhinweis, Markerliste mit
   Kommentarfeldern direkt unter den Werkzeugen; Chronik mit
   Rundenbadges am Zeilenanfang — chronologisch und einzeilig.
6. **Ende:** Verständlicher Endtext + Rundenangabe; Chronik,
   Missionsstruktur und Werkzeuge bleiben zur Auswertung sichtbar —
   „Neue Partie" startet sauber (Marker werden zurückgesetzt).

## Geprüfte Anforderungen

- **Farbe+Form:** Kameras = Geräte-Glyph (aktiv gefüllt / sabotiert
  durchgestrichen), Kategorien = Flaggen-Pfad, Zonen = Flächen +
  Textlegende, Overlay = Rauten, Marker = Stecknadel, Sperrung =
  Sperrzeichen, aktiver Detektiv = doppelter Ring. ✅
- **Tastatur:** Interaktive Knoten tragen `role="button"`,
  `tabIndex` und Eingabe/Leertaste-Handler; E2E bewegt einen
  Detektiv per Tab + Enter. ✅
- **Verständlichkeit:** Alle Texte über i18n-Keys (DE/EN paritätisch),
  Endzustände in Klartext. ✅
- **Informationssicherheit aus Sicht des Spielers:** Kein Ganove-
  Marker, keine Zielmarkierungen, keine Funkberichte in der Chronik
  — an keiner Stelle der Partie beobachtet; E2E verifiziert es in
  jeder Runde. ✅

## Befunde

| # | Befund | Bewertung |
|---|---|---|
| U1 | Kein Zurücknehmen einer Postenwahl in `pickSpawns` | hinnehmbar — Wahl bewusst, Partiebeginn sofort danach; Menü/Konfiguration kommt in Schritt 11 |
| U2 | Marker-Modus deaktiviert Zugziele ohne optische Degradation der Legal-Marker | behoben — Hinweiszeile wechselt auf „Marker setzen"-Text und der Modusbutton zeigt `aria-pressed` |
| U3 | Dichte Karten: Klicks konnten theoretisch den Nachbarknoten treffen (überlappende Trefferflächen) | behoben — `pointer-events` nur noch auf der `hitArea` des jeweiligen interaktiven Knotens |
| U4 | Chronik verschwand bei Spielende | behoben — Werkzeuge/Chronik bleiben im Endzustand sichtbar |

## Ergebnis

**Bestanden.** Der Modus ist ohne Doku spielbar, Tastatur- und
Formkodierung sind durchgängig; alle gefundenen Punkte sind behoben
oder bewusst als Übergangslösung dokumentiert.
