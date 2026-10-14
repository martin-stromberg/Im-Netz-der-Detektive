# Usability-Review — Menü, Einstellungen, Szenario-Auswahl (Schritt 11)

Review aus Anwendersicht: kompletter Weg Hauptmenü → Kartenwahl →
Moduswahl → Einstellungen → Missionswahl → Aufstellung → laufendes
Spiel, beide Perspektiven, plus Dev-Modus und Statistik/Repläy-
Ansicht. Geprüft in DE auf den echten Karten Münster und Lübeck,
inkl. Tastaturbedienung (Tab + Enter auf SVG-Knoten) und den
Fehlerzuständen.

## Beobachteter Ablauf

1. **Hauptmenü:** Titelbild, „Neue Partie" prominent, „Partie
   fortsetzen" deaktiviert **mit sichtbarem Hinweistext** (nicht nur
   Tooltip), „Statistiken & Replays" führt zur Liste.
2. **Kartenwahl:** Aktive Karten als Karten mit Keyart, Namen und
   Tagline; Hamburg/Köln als ausgegraute „In Vorbereitung"-Platzhalter
   mit Hinweis — klar unterscheidbar, keine irreführende Klickbarkeit.
3. **Moduswahl:** Drei gleichwertige Karten (Ganove/Detektiv/Dev) mit
   Einzeiler-Funktionsbeschreibung; Dev-Modus trägt ein „Dev"-Badge
   und erklärt sich als Balancing-Werkzeug.
4. **Einstellungen:** Jedes Feld beschriftet, erlaubter Bereich und
   Vorschlagswert als Hinweiszeile; „Unbegrenzt" erscheint nur auf
   Münster (Karte erlaubt es), fehlt auf Lübeck vollständig; bei
   ungültigen Werten bleibt die Ansicht stehen und listet die
   betroffenen Felder als Text.
5. **Missionswahl:** Fälle zeigen Name und die komplette Mini-Story
   auf der Karte; „Spielerdefiniert" führt Schritt für Schritt über
   die Karte (nur passende Kategorien sind klickbar), Sabotage ist
   überspringbar; Kriterienverstöße erscheinen als lesbare Hinweise
   (z. B. „Der Fluchtpunkt liegt zu nah am Kontakt-Ort"), nicht als
   interne Codes.
6. **Aufstellung:** Bestehende Spawn-Views der Spielmodi werden
   wiederverwendet (Detektive vor Ganove, nur legale Kandidaten
   klickbar, Ganove-Kandidaten respektieren Mindestabstand **und**
   Missionskriterien — es gibt keine toten Klicks auf ungültige
   Kandidaten, sie werden gar nicht angeboten).
7. **Zurück/Abbruch:** Jede Auswahlebene hat „Zurück"; nach dem
   Spielende führt „Zum Hauptmenü" sauber zurück (Store wird
   zurückgesetzt).
8. **Dev-Modus:** Karte, Batch-Größe und Start-Seed wählbar; Ergebnis
   als Ausgangsverteilung plus Kennzahlenzeile; Hinweis, dass alle
   Partien aufgezeichnet wurden.
9. **Statistiken:** Tabelle (Partie, Karte, Seed, Ausgang, Runden)
   mit Leerzustand und Hinweis, dass Replay-Abspielen in einem
   späteren Schritt folgt.

## Geprüfte Anforderungen

- **Keine internen Identifier:** Städte, Fälle, Modi und Kriterien-
  Fehler erscheinen als benannte Texte; Custom-Mission-Ziele werden
  auf der Karte gewählt, nie per ID-Eingabe. ✅
- **Alle Auswahloptionen verständlich:** Jede Schaltfläche/Karte trägt
  Titel + Funktionshinweis; deaktivierte Elemente erklären sich
  (Badge/Hinweis). ✅
- **Asymmetrie unverändert:** Menüfluss füttert nur `startGame`;
  Detektiv-Sicht sieht weiterhin keine `data-ganove`-/
  `data-mission-target`-Marker (E2E-geprüft in den Bestandstests). ✅
- **DE/EN-Parität:** alle neuen Menü-/Fehlertexte über `t()`,
  maschinell paritätisch. ✅
- **Feedback bei Fehlern:** Einstellungen listen die ungültigen
  Felder namentlich; Custom-Mission listet Kriterienverstöße
  menschenlesbar; „Fortsetzen"-Button der Custom-Mission bleibt bis
  zur gültigen Auswahl deaktiviert. ✅

## Befunde

| # | Befund | Bewertung |
|---|---|---|
| U1 | „Partie fortsetzen" wirkte als deaktivierter Button ohne Erklärung | **behoben** — sichtbarer Hinweistext `menu.resumeHint` unter dem Button |
| U2 | Custom-Mission-Fehler zeigten rohe Validierungscodes (`criteria: min_gap:…`) | **behoben** — `customErrorText` mappt alle Kriteriencodes auf i18n-Texte; nur nicht-maschinelle Restmeldungen fallen durch |
| U3 | Dev-Modus: synchroner Batch blockiert kurz die UI („Läuft …"-Zustand nicht sichtbar) | hinnehmbar — Batch ≤ 25 Partien auf ≤ 59 Knoten läuft subsekundär; asynchrones Laden wäre Schritt-14-Polishing |
| U4 | „Neue Partie" am Spielende startet wieder den idle-Startbildschirm statt direkt denselben Flow | hinnehmbar — bewusstes Verhalten (Konfigurationswechsel darf vom Start aus neu gewählt werden); „Zum Hauptmenü" existiert zusätzlich |

## Ergebnis

**Keine Befunde offen** — alle gefundenen Punkte sind behoben oder als
hinnehmbare Übergangsentscheidungen dokumentiert.
