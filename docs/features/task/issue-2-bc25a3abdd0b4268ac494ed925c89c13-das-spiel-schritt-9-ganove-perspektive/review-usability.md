# Usability-Review

## Ergebnis

**Status:** Keine Befunde

(Vorheriger Durchlauf: `review-usability.1.md` — beide Befunde wurden
umgesetzt: Handlungshinweis `play-hint` in der Seitenleiste inkl.
„…oder Aktion am Zielort"-Variante, und eine Form-/Linien-Legende
`map-legend` unter der Karte für Weg/Fahrt/Fluchtpunkt/Detektiv/eigene
Position/Ziel.)

## Geprüfte Interaktionen

- „Neue Partie" starten → unauffällig
- Ganove-Startpunkt aus legalen Optionen wählen → unauffällig
- Ziehen per Klick/Tastatur → unauffällig (Handlungszeile +
  markierte Ziele, Tab/Enter möglich)
- „Aktion ausführen" am Zielknoten vs. Weiterziehen → unauffällig
  (Hinweiszeile benennt beide Optionen)
- Sabotage-Binärwahl (endgültig) → unauffällig
- Polizeifunk einmalig → unauffällig
- Als Remis beenden → unauffällig
- Endzustände verstehen → unauffällig
- Hitze-Indikator → unauffällig (Icon + Text, nicht nur Farbe)
- Kartenlesbarkeit → unauffällig (Legende erklärt Linien/Marker/Formen)
- Interne Kennungen → unauffällig (überall Klarnamen)

## Geprüfte Dateien

- `src/components/GanoveScreen.tsx`
- `src/components/MapGraph.tsx`
- `src/components/MissionPanel.tsx`
- `src/components/HeatBadge.tsx`
- `src/App.tsx`
