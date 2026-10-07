# Balancing-Startwerte

> Alle Werte sind **Startwerte für Playtests** (OT-23), kalibriert über die
> Partie-Aufzeichnung (JSONL-Eventlog, OT-22). Annahme: ~50-Knoten-Karte,
> Ø-Knotengrad 3–4, Graph-Durchmesser ~10.

## Parameter

| Parameter | Startwert | Begründung |
|---|---|---|
| Rundenzahl (Zeitlimit) | **30** *(Map-Vorschlag, einstellbar bis „unbegrenzt")* | Kürzeste Missionsroute ~15–18 Züge, mit Sabotage ~20–22 → ~8–10 Runden Reserve für Katz-und-Maus, aber kein Zeitstellen. „Unbegrenzt": nur Fang/Flucht entscheidet — Detektive verlieren die Zeitgewinn-Bedingung |
| Kameraanzahl | **8** (~15 %) | ~3–5 Auslösungen/Partie — Dauerdruck ohne Hinweis-Feuerwerk |
| Kamera-Verteilung | Mindestabstand 2 Kanten, Missionsziele ausgeschlossen | Keine unfairen Todeszonen per Zufall |
| Detektive | **4** (Testbereich 3–5) | ~9 % direkte Knotenabdeckung + Hinweise; bewährter Sweetspot (FoD-Referenz) |
| Ereignismodus (Default) | **Spannungsbalken** +10/Runde, Schwelle 40 | Garantierte Kadenz ~alle 4 Runden, kein Zufalls-Leerlauf |
| Alternativen | Zyklus = 4; Wahrscheinlichkeit = 25 % | Einstellbar wie konzipiert |
| Ereignis-Mischung | Sichtbarkeit 25 % / Hinweis 45 % / Umwelt 30 % | Sichtbarkeit selten und stark (~2/Partie) |
| Umweltsperrung | 1 Kante, 3 Runden, beidseitig | Spürbar, aber nie isolierend |
| Polizeifunk | letzte 5 Hinweise, 1×/Partie | Momentaufnahme statt Orakel |
| Sabotage-Umweg | ≤ +4 Kanten vs. Direktweg | Sonst ist Ablehnung immer dominant |

## Hinweis-Budget pro Partie (Kohärenzrechnung)

| Quelle | Erwartete Menge | Qualität |
|---|---|---|
| Sichtbarkeitsereignisse | ~2 | exakt, live |
| Kameraauslösungen | ~3–5 | exakt, historisch |
| Aktions-Spuren | 3–4 | exakt, vor Detektivzügen sichtbar |
| Zonen-Hinweise | ~3–4 | Zone (Radius ~2 Kanten) |
| Umwelt | ~2 | keine Positionsinfo |

→ **~10 „harte" Anker über 30 Runden ≈ alle 3 Runden einer.** Das spiegelt
Scotland Yards Reveal-Kadenz, ergänzt um Missions-Deduktion: Die feste
Reihenfolge macht aus jeder Spur eine Prognose auf die Flugrichtung.

## Map-abhängige Einstellungen (entschieden, OT-26)

Jede Karte deklariert pro Parameter einen **Vorschlagswert** und einen
**erlaubten Bereich**; das Menü überschreibt innerhalb des Bereichs.
Begründung: Diese Werte skalieren mit Kartengröße und -topologie — eine
enge Inselkarte verträgt weniger Detektive und eine kürzere Ereigniskadenz
als ein weites Stadtnetz. Die Detektivzahl wirkt so zusätzlich als
Schwierigkeitsregler.

| Parameter | Münster-Vorschlag | Bereich | Skaliert mit |
|---|---|---|---|
| Detektivzahl | 4 | 2–6 | Knotenzahl, Knotengrad |
| Kameraanzahl | 8 | 0–15 | Knotenzahl (~15 %) |
| Zeitlimit | 30 | ≥ 15 oder unbegrenzt | Missionsrouten-Länge |
| Polizeifunk-Tiefe | 5 Hinweise | 3–10 | Hinweisdichte |
| Kantensperr-Dauer | 3 Runden | 1–6 | Knotengrad (Ausweichoptionen) |
| Ereignismodus/-kadenz | Spannung +10, Schwelle 40 | je Modus | Partienlänge |
| Ereignis-Mischung | 25/45/30 | fest je Map | Topologie (Chokepoints → mehr Umwelt) |
| Missions-Regeln | minGap 3, maxGap 8, Budget 18/22 | fest je Map | Graph-Durchmesser |
| Hinweis-Zonenradius | 2 Kanten | fest je Map | Zonengröße |
| Sabotage-Effekt-Pool | alle drei | fest je Map | z. B. Kamerazahl |
| Start-Mindestabstand Ganove↔Detektiv | 3 Kanten | fest je Map | Graph-Durchmesser |
| Hitze-Schwellen (0/2/4/5) | ruhig/aktiv/erhöht/kritisch | fest je Map | Hinweisdichte |

**Schwierigkeits-Presets** bündeln später Overrides innerhalb dieser
Bereiche (leicht/normal/schwer) — die Map-Bereiche bleiben die harte
Grenze.

Global (nicht map-abhängig) bleiben die reinen Regeln: Rundenstruktur,
Fangbedingung, Hinweis-Grundsatz, Sabotage-Binärwahl, Zugzwang.

## Designabsicht

Die Detektive gewinnen durch **Kombinieren** von Ankern + Zielpools, nicht
durch Hinweis-Flut. Der Ganove gewinnt durch Timing (Aktionen nur bei
lockerem Netz) und das einmalige Gegenmittel Polizeifunk.

## Kalibrierung

Nach jedem Playtest/Simulationslauf aus dem Eventlog messen:

- `outcome`-Verteilung (Ziel: Ganove ~40–50 % Siegquote)
- Runden bis Fang / bis Flucht
- Hinweise pro Partie, Kameratreffer
- Häufigkeit Sabotage-Annahme (Ziel: echte 50/50-Abwägung)
