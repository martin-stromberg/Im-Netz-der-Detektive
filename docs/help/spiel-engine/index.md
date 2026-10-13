# Spiel-Engine

Der headless-fähige Spielkern von „Im Netz der Detektive": lädt und
validiert Kartenpakete, stellt Graph-Grundfunktionen (Nachbarschaften,
BFS-Kantendistanzen) bereit, liefert den zentralen deterministischen
Zufallszahlengenerator, das Startaufstellungs-System und den
React-frei nutzbaren Zustand-Store samt komplettem Rundenmotor —
Zwei-Phasen-Runden mit fester Detektivreihenfolge, Zugzwang,
Fangprüfung nach jedem Einzelzug und allen fünf Endbedingungen — plus
die komplette Informationsschicht: Kameraplatzierung und -auslösung,
drei Ereignis-Auslösemodi mit drei Ereignistypen, datenseitige
Sichtbarkeitsasymmetrie, einmaliger Polizeifunk und der 4-stufige
Hitze-Indikator. Darauf aufbauend das Missionssystem: regelbasierte
Generierung der Ziele (Diebstahl → Kontakt → Binärwahl Sabotage/Flucht)
mit per BFS prüfbaren Kriterien, Aktionsrunden mit Spur-Hinweisen, dem
Sabotage-Angebot des Informanten mit drei wirksamen Effekten,
missionsgebundener Flucht sowie vordefinierten benannten „Fällen" als
JSON-Missionssets pro Karte.

## Inhalt

- [Beschreibung](beschreibung.md)
- [Technischer Ablauf](ablauf-technisch.md)
- [API](api.md)
- [Business Rules](business-rules.md)
