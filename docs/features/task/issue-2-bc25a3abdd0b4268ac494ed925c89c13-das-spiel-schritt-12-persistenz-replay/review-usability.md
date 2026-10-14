# Usability-Review — Persistenz, Replay & Statistiken (Schritt 12)

Review aus Anwendersicht: Speichern in der laufenden Partie (beide
Modi), Fortsetzen über das Hauptmenü, Statistik-Aggregate, Log-
Verwaltung und der Replay-Abspieler — geprüft in DE, inklusive
E2E-Nachweis über die echte Oberfläche.

## Beobachteter Ablauf

1. **Partie speichern:** In beiden Spielmodi steht in der Seitenleiste
   „Partie speichern" — nur solange die Partie läuft (bei beendetem
   Spiel ist die Schaltfläche weg statt deaktiviert). Nach dem Klick
   erscheint die Notice „Spielstand gespeichert." — klare Rückmeldung,
   kein Moduswechsel, kein Dialog.
2. **Partie fortsetzen:** Der Menü-Button ist ohne Spielstand
   deaktiviert und erklärt das im Hinweistext („Kein Spielstand
   vorhanden — speichere eine laufende Partie …"). Mit Ständen führt
   er zur Liste: Jeder Eintrag ist eine Karte mit „{Karte} — als
   Ganove/als Detektive, Runde {n}" plus lokalisierter Speicherzeit.
   Ein Klick startet die Partie nahtlos im passenden Screen (keine
   erneute Aufstellung — der Zustand ist exakt der gespeicherte);
   „Löschen" je Eintrag entfernt nur diesen.
3. **Statistik:** Oben ein Kartenraster „Alle Partien" + je Modus
   (Ganove/Detektive/unbekannt-KI) mit Partienzahl, beiden
   Siegquoten, Remis-Zahl und Ø Runden/Hinweise/Kameratreffer;
   leere Gruppen zeigen „—" statt „0 %" oder „NaN" — keine
   irreführenden Werte. Darunter die Aufzeichnungsliste (neueste
   zuerst) mit verständlichen Ausgängen in Klartext.
4. **Log-Verwaltung:** Je Zeile „Replay", „Exportieren", „Löschen"
   — direkt ausführbar, Effekte sofort sichtbar (Zeile verschwindet,
   Download startet). „Alle Aufzeichnungen löschen" fragt mit
   Ja/Nein-Dialog nach, bevor etwas passiert — kein versehentlicher
   Totalverlust.
5. **Replay-Timeline:** „Schritt zurück"/„Schritt vor" sind am Rand
   deaktiviert (Anfang/Ende), die Positionsanzeige sagt „Startaufstellung"
   bzw. „Zug n von N · Runde k" — jederzeit klar, wo man steht.
   „Abspielen" läuft automatisch und stoppt am aufgezeichneten Ende
   (oder pausiert manuell); das Outcome erscheint als Klartext.
   Beschädigte Aufzeichnungen zeigen eine verständliche Fehlermeldung
   mit „Zurück" statt eines leeren Screens.
6. **Perspektiv-Umschalter:** Zwei zusammenhängende Segmente
   („Ganove-Sicht"/„Detektiv-Sicht") mit `aria-pressed`-Zustand —
   Form, Beschriftung und aktiver Zustand sind eindeutig. Die
   Detektiv-Sicht blendet das Overlay ein-/ausschaltbar und zeigt
   die Kandidatenanzahl; Legenden wechseln mit der Perspektive
   (Ganove-Symbole ↔ Detektiv-Legende), die Chronik nutzt dieselben
   Texte wie der Live-Screen.

## Geprüfte Anforderungen

- **Verständliche Resume-Liste:** Kartenname (Fallback: rohe ID),
  Seite als „als Ganove/als Detektive", Runde, lokalisierte
  Speicherzeit — keine internen IDs, kein Roh-JSON. ✅
- **Timeline bedienbar:** vor/zurück/Abspielen/Pause vollständig
  per Schaltfläche; deaktivierte Zustände an den Rändern; die
  Schrittanzeige benennt Zug + Runde. ✅
- **Keine Fehler-Sackgassen:** defekter Speicherstand → Eintrag
  verschwindet, Liste bleibt; defektes Replay-Log → Hinweistext +
  „Zurück"; „Alle löschen" nur nach Rückfrage. ✅
- **Konsistenz:** Alle neuen Texte via i18n (DE/EN paritätisch);
  Buttons/Legenden/Panels verwenden die bestehenden
  `shared`/`styles`-Klassen — kein visueller Bruch zu den
  Spiel-Screens. ✅
- **Barrierefreiheit:** `aria-pressed` am Perspektiv-Umschalter,
  `data-testid`/`role`-Struktur wie im Bestand; Formkodierung der
  Map-Legenden bleibt erhalten (keine reine Farbcodierung). ✅

## Beobachtungen ohne Änderungsbedarf

- Der Replay teilt die Live-Komponenten (`MapGraph`, `MissionPanel`,
  `HeatBadge`, Legenden) — die Ansicht fühlt sich wie das Spiel an,
  Interaktionen auf der Karte sind bewusst nicht angeboten
  (nur Anzeige): konsistent mit „Abspielen ≠ Spielen".
- „Schritt zurück" spielt intern von vorn — für den Anwender
  unsichtbar und bei kurzen Logs (< 200 Schritte) unmerklich.

## Ergebnis

**Keine Usability-Befunde** — Flüsse sind vollständig, Zustände
verständlich benannt, destruktive Aktionen rückgefragt, Fehlerfälle
geführte statt stille.
