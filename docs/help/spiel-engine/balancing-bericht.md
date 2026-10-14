# Balancing-Bericht (Schritt 14 — Endabnahme & Polishing)

Kalibrierung der KI-vs.-KI-Balance über `npm run sim` (headless,
deterministisch je Seed). Zielkorridor laut Anforderung: **~40–50 %
Ganoven-Siege** und **~50/50 Sabotage-Abwägung** auf der Referenzkarte
Münster über ≥ 100 Seeds.

## Ausgangslage (Baseline)

100 Partien, Seeds 1–100, Karte Münster, unveränderte Defaults
(4 Detektive, 8 Kameras, Rundenlimit 30, `SAFE_ACTION_GAP = 2`):

| Outcome | Anteil |
|---------|--------|
| caught | 84 % |
| surrounded | 10 % |
| timeout | 6 % |
| escaped | **0 %** |

Diagnose aus den Eventlogs: (1) `SAFE_ACTION_GAP = 2` ließ den
Ganoven nur bei Abstand ≥ 2 agieren — auf den engen Eingriffsradien
der Karte praktisch nie; er kreiste endlos zwischen sicheren Knoten
(z. B. schlosspark ↔ schlossplatz) bis Timeout oder Umzingelung.
(2) Die Detektiv-KI agierte perfekt: jede Runde deckungsoptimal auf
die Live-Deduktion — kein menschlicher Fehleranteil.

## Kalibrierung (Auswahl der wirksamen Schritte)

| Schritt | Maßnahme | Ergebnis (100 Seeds) |
|---------|----------|----------------------|
| 1 | Ganove-Heuristik: `EVADE_DISTANCE` 2→1, `MOVE_SAFE_GAP` 3→2, `RADIO_HEAT_THRESHOLD` 3→1, Hitze-Veto auf Aktionen entfernt | 0 % escaped |
| 2 | Anti-Oszillation (`cameFromNodeId`-Rückwärtsmalus) + fortschrittsorientierter Zug-Pool (progress → safe → beliebig), Flucht-Endspiel priorisiert Fortschritt | 7 % escaped |
| 3 | Gefahrenbewusste Dijkstra-Routenwahl | verworfen — Odyseeen, RangeError-Fix (`Infinity`→Klemme), kein Gewinn |
| 4 | Kartendaten: Detektive 4→3, Kameras 8→4, Rundenlimit 30→40, `hintZoneRadius` 2→3, Event-Threshold 40→50 (Takt ~5 Runden), `cycle` 4→5, Event-Mix auf Umwelt-lastig (0.15/0.40/0.45), Missionsgeometrie `minGap` 3→2 / `maxGap` 8→5, Generierungs-`sabotageDetour` 4→8 | ~35–44 % escaped |
| 5 | Detektiv-KI realistisch fehlerhaft: `DETECTIVE_INTEL_LAG = 3` (Trupp steuert auf die Deduktion von vor 3 Runden, nicht die Live-Lage) + `DETECTIVE_RANDOM_MOVE_CHANCE = 0.95` (Patrouillen-Anteil mit Momentum — kein Sofort-Umkehren via `previousPositions`) | 44–53 % escaped |
| 6 | `SABOTAGE_ACCEPT_DETOUR = 3` in `GanoveAI` (eigene Akzeptanzschwelle enger als das Generierungsbudget 8) + kritisch-Hitze-Klausel entfernt | **~48 % escaped, ~50 % Annahme** |

`minDistanceToDetective` 3→4 wurde getestet und zurückgenommen: bei
voller Detektivbesetzung aller fünf Fix-Spawnknoten bliebe dem Ganoven
kein legaler Start (SpawnError) — verletzt den erlaubten
Detektivzahlbereich 2–6.

## Endergebnis (committeter Stand)

Münster, jeweils 100 Partien, vier unabhängige Seed-Batches:

| Seeds | escaped | caught | Sabotage-Annahme | Radio | Ø Runden | Ø Hinweise | Ø Kameras |
|-------|---------|--------|------------------|-------|----------|------------|-----------|
| 1–100 | 47 % | 53 % | 47 % | 87 % | 12–14 | ~3.4 | ~0.5 |
| 101–200 | 47 % | 53 % | 46 % | 84 % | | | |
| 201–300 | 50 % | 50 % | 55 % | 93 % | | | |
| 301–400 | 50 % | 50 % | 54 % | 88 % | | | |

**Gesamt über 400 Seeds: ~48 % Ganoven-Siege, ~50 % Sabotage-Annahme —
beide Zielkorridore erreicht.**

Lübeck (Karte unverändert): 47 % escaped bei 100 % Sabotage-Annahme —
die Inselkarte erzeugt ausschließlich billige Umwege (kleines
Netz), daher greift die Akzeptanzschwelle nicht. Dokumentierte
Abweichung; Outcome-Verteilung passt.

## Geänderte Stellschrauben (final)

- `src/logic/GanoveAI.ts`: `EVADE_DISTANCE = 1`, `MOVE_SAFE_GAP = 2`,
  `RADIO_HEAT_THRESHOLD = 1`, `SABOTAGE_ACCEPT_DETOUR = 3` (neu),
  Hitze-Veto auf Aktionen entfernt, Anti-Oszillation
  (`cameFromNodeId`), Fortschritts-Pool-Logik, Kamera-Malus in der
  Zugbewertung verstärkt, Endspiel priorisiert Fortschritt.
- `src/logic/DetectiveAI.ts`: `DETECTIVE_INTEL_LAG = 3`,
  `DETECTIVE_RANDOM_MOVE_CHANCE = 0.95` mit Patrouillen-Momentum
  (`previousPositions` im `DetectiveView`).
- `src/data/maps/muenster.json`: Vorschläge Detektive 3, Kameras 4,
  Rundenlimit 40, `hintZoneRadius` 3, Event-Threshold 50 / `cycle` 5,
  Event-Mix 0.15/0.40/0.45, `missionRules` `minGap` 2 / `maxGap` 5 /
  `sabotageDetour` 8 (Routenbudgets unverändert 18/22).
- `src/logic/AiSimulation.ts`: Views um `cameFromNodeId` /
  `previousPositions` ergänzt; `observe` deckt jetzt auch Radio- und
  Wahl-Züge ab (Test-Harness-Fix).

## Grenzen / Anmerkungen

- Die Metrik misst KI-gegen-KI. Der E2E-„Clicker" (einfache
  Fortschritts-Heuristik, agiert sofort bei jeder Missionaktion)
  entkommt häufiger — ein geübter menschlicher Ganove wird eher
  gewinnen als verlieren; der Trupp bleibt aber mit 3 statt 4
  Detektiven und voller Deduktion ein spürbarer Gegner.
- Erhöhte `DETECTIVE_RANDOM_MOVE_CHANCE` modelliert Fehleranteil
  (Patrouille statt perfekter Verfolgung); die Lage-Trägheit
  (`INTEL_LAG`) bildet die Verzögerung zwischen Funk und Karte ab.
- Seed-Streuung liegt bei ±3 Prozentpunkten über 100er-Batches.
