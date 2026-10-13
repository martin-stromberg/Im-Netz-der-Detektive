# Usability-Review

## Ergebnis

**Status:** Befunde vorhanden

## Befunde

### `src/components/GanoveScreen.tsx` (Spielansicht)

- **Erreichbarkeit / Verständlichkeit** — Während der Ganove-Phase steht
  nur „Du bist am Zug" in der Statusleiste. Eine nicht-technische
  Anwenderin erfährt nicht, *was* zu tun ist: dass Zugzwang herrscht und
  ein grün markierter Nachbarort angeklickt (oder per Tastatur gewählt)
  werden muss. Der „Aktion ausführen"-Button am Zielknoten ist zwar
  beschriftet, aber die Alternative „Weiterziehen" ist nirgends
  erklärt.

  Empfehlung: Kurze Handlungszeile in der Seitenleiste/Statuszeile,
  z. B. „Dein Zug: wähle einen markierten Nachbarort" und bei
  verfügbarer Aktion „… oder führe die Aktion am Zielort aus".

### `src/components/MapGraph.tsx` (Kartenansicht)

- **Erreichbarkeit / Fehlende Legende** — Die Karte nutzt Form- und
  Linienkodierung (gestrichelte `fahrt`-Kanten, Fahnen-Symbol für
  Fluchtpunkte, Missions-Badges, nummerierte Detektiv-Marker,
  Ganove-Raute), aber keine Stelle erklärt diese Zeichen. Ein Laie kann
  die gestrichelte Linie nicht als „Fahrt/Schnellverbindung" deuten und
  das Flaggensymbol nicht als Fluchtpunkt.

  Empfehlung: Kompakte Legende unter der Karte oder in der
  Seitenleiste (Linie = Weg, gestrichelte Linie = Fahrt, Fahne =
  Fluchtpunkt, Viereck mit Zahl = Detektiv, Raute = eigene Position).

## Geprüfte Interaktionen

- „Neue Partie" starten → unauffällig (klarer Button, Einleitungstext)
- Ganove-Startpunkt aus legalen Optionen wählen → unauffällig
  (Anweisungstext + nur legale Knoten wählbar, Klarnamen)
- Ziehen per Klick/Tastatur → Befund (fehlende Handlungsanweisung)
- „Aktion ausführen" am Zielknoten vs. Weiterziehen → Befund
  (Alternative nicht erklärt)
- Sabotage-Binärwahl (endgültig) → unauffällig (beide Optionen mit
  Effekt- und Ziel-Klartext, Endgültigkeit benannt)
- Polizeifunk einmalig → unauffällig (deaktiviert + Text nach Nutzung)
- Als Remis beenden → unauffällig (Inline-Bestätigung)
- Endzustände verstehen → unauffällig (klare Texte je Ausgang)
- Hitze-Indikator → unauffällig (Icon + Text, nicht nur Farbe)
- Kartenlesbarkeit (Kantentypen, Marker) → Befund (fehlende Legende)
- Interne Kennungen → unauffällig (überall Klarnamen, keine Ids)

## Geprüfte Dateien

- `src/components/GanoveScreen.tsx`
- `src/components/MapGraph.tsx`
- `src/components/MissionPanel.tsx`
- `src/components/HeatBadge.tsx`
- `src/App.tsx`
