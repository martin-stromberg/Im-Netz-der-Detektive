# Im Netz der Detektive — Konzept-Übersicht

Asymmetrisches Verfolgungsspiel: Ein verdeckter Ganove zieht durch ein Wegenetz von Münster,
während offen spielende Detektive ihn anhand von Hinweisen und Ereignissen eingrenzen.

**Quellen:** `issue.md` (Brainstorming: Spielkonzept, Neue Erkenntnisse, Technische Vorgaben)

## Status-Legende

| Status | Bedeutung |
|---|---|
| festgelegt | Entschieden und im Konzept dokumentiert |
| kalibrieren | Festgelegte Startwerte, Feintuning via Playtests/Eventlog |

## Status nach Bereich

| Bereich | Status | Kernentscheidung |
|---|---|---|
| Grundidee / Asymmetrie | festgelegt | Ganove sieht Detektive; Detektive sehen Missionsstruktur, nie Zielknoten |
| Spielfeld (Graph, Münster) | festgelegt | ~50 Knoten, handgebaut, Kantentypen weg/fahrt, Kategorien + Zonen |
| Bewegung / Rundenablauf | festgelegt | Ganove zuerst, dann D1–D4; Zugzwang; besetzte Knoten tabu |
| Kamerasystem | festgelegt | 8 Kameras, dauerhaft, exakter Knoten + Runde, missionsziel-frei |
| Ereignissystem | festgelegt | 3 Modi (Default: Spannungsbalken); Sichtbarkeit live-exakt, Umwelt beidseitig |
| Hinweissystem | festgelegt | „Wo er war, nie wo er ist" — exakt nur vergangenheitsbezogen |
| Polizeifunk | festgelegt | 1×/Partie, letzte 5 Hinweise inkl. Kameras |
| Missionssystem | festgelegt | Feste Reihenfolge; Sabotage = optionales Informant-Angebot; messbare Generierungskriterien |
| Prototyp-Modi | festgelegt | Mensch-Ganove vs. KI **und** Mensch-Detektive vs. KI-Ganove; KI-vs.-KI als Dev-Modus |
| Ganove-Feedback | festgelegt | Hitze-Indikator (4 Stufen aus Hinweisaktivität, kein Info-Leak) |
| Deduktions-Werkzeuge | festgelegt | Hinweis-Chronik, Marker, „Mögliche Positionen"-Overlay |
| Startaufstellung | festgelegt | Spawn-Modi choice/free/random pro Map, Mindestabstand, Ganove wählt zuletzt |
| Spielende | festgelegt | Fang/Umzingelung/Flucht; Zeitlimit einstellbar (Map-Vorschlag 30, auch unbegrenzt); Remis bei vorzeitigem Beenden |
| Technik-Stack | festgelegt | React 18 + Vite + TypeScript, Zustand, CSS-Module, JSONL-Eventlog |
| Persistenz | festgelegt | Save/Load (Snapshot+Seed) + Replay-Player aus Eventlog |
| Szenarien | festgelegt | „Fälle" = benannte vordefinierte Missionen mit Mini-Story pro Karte |
| Lokalisierung/A11y/Audio | festgelegt | i18n DE/EN, farbenblind-sicher, Tastatur, Sound-Dramaturgie |
| Weitere Städte | festgelegt | MapPack-Architektur; Münster + Lübeck-Validierungskarte; Kandidatenliste |
| Einstellungen | festgelegt | Map-Vorschläge + erlaubte Bereiche, im Menü überschreibbar (Detektive, Kameras, Zeitlimit, Kadenz …) |
| Balancing | kalibrieren | Startwerte in `04-balancing.md`; Ziel: ~40–50 % Ganove-Siegquote |
| Multiplayer | später | WebSockets/SignalR; Vorbereitung via headless Store + Seed-RNG |

## Dokumente

1. **Spielkonzept** — vollständiges Regelwerk
2. **Technisches Konzept** — Architektur, Stack, Kartenpaket-Format, Eventlog
3. **Offene Themen** — Checkliste (alle entschieden, Entscheidungen dokumentiert)
4. **Balancing** — Startwerte und Kalibrierungsmetriken

## Nächste Schritte

- **Projekt scaffolden** (Vite + React + TS) nach `02-technisches-konzept.md`
- **Münster-Karte bauen**: ~50 Knoten mit echten Orten, Kategorien, Zonen
- **Lübeck-Validierungskarte** anlegen (klein, unbalanciert — testet den MapLoader)
- Nach ersten Partien: Balancing über Eventlog-Metriken kalibrieren
