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
JSON-Missionssets pro Karte. Jede Partie wird vollständig als
JSONL-Eventlog aufgezeichnet (`Recorder`) — über den Seed bitgleich
rekonstruierbar, mit `visibleTo`-Sichtbarkeit je Eintrag,
Balancing-Metriken im Abschluss-Eintrag, Datei-Export und automatischem
Vorhalten der letzten Partien im Browser-Speicher (FIFO). Darauf setzen
Deduktion und KI auf: `Deduction` errechnet aus allen sichtbaren
Hinweisen die Menge konsistenter Ganoven-Positionen (Pfadinduktion über
den Bewegungsverlauf, inklusive Negativ-Schluss durch stille Kameras),
`DetectiveAI` steuert den gesamten Detektiv-Trupp koordiniert
(Abdeckung der Glaubensmenge, Aufteilung/Einkreisung) und `GanoveAI`
führt die Mission mit Hitze- und Abstands-Timing, Polizeifunk-Einsatz
und der Sabotage-Binärwahl. `AiSimulation` treibt beide KIs auf dem
gemeinsamen Store zu vollständigen KI-gegen-KI-Partien —
deterministisch je Seed — und `npm run sim` (`scripts/sim.ts`) spielt
Batch-Serien mit Outcome-Verteilung und Balancing-Metriken.

## Inhalt

- [Beschreibung](beschreibung.md)
- [Technischer Ablauf](ablauf-technisch.md)
- [API](api.md)
- [Business Rules](business-rules.md)
- [Balancing-Bericht](balancing-bericht.md) — Schritt-14-Kalibrierung: Baseline, Stellschrauben und die gemessenen KI-vs.-KI-Outcome-Verteilungen über ≥ 400 Seeds.
