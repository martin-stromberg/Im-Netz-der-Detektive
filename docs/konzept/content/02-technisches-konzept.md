# Technisches Konzept — React-Umgebung

> Konsolidierte Fassung der technischen Vorgaben aus `issue.md`,
> ergänzt um die getroffenen Entscheidungen (OT-04, OT-17, OT-18, OT-20, OT-22).

## 1. Projektbasis (entschieden, OT-20)

- **React 18+** mit **TypeScript** — Graph-/State-/Eventlog-Modelle profitieren
  direkt von Typen; Vite unterstützt TS nativ.
- **Vite** als Build-Tool.
- Modulstruktur nach Feature-Slices.

## 2. Verzeichnisstruktur

```
/src
  /components
    MapGraph.tsx
    GanoveUI.tsx
    DetektiveUI.tsx
    EventPanel.tsx
    MissionPanel.tsx
  /logic
    Movement.ts
    EreignisEngine.ts
    MissionEngine.ts
    CameraSystem.ts
    DetectiveAI.ts
    GanoveAI.ts       (Sim-Modus + Detektiv-Perspektive)
    Deduction.ts      (mögliche Positionen aus Hinweisen)
    SpawnSystem.ts    (choice/free/random + Mindestabstand)
    Recorder.ts
    ReplayPlayer.ts   (Eventlog → Timeline-Wiedergabe)
    SaveGame.ts       (State-Snapshot + Log, Resume)
    MapLoader.ts
    rng.ts            (zentraler Seeded-RNG)
  /state
    GameState.ts
  /data
    /maps
      muenster.json
      luebeck.json    (Validierungskarte, unbalanciert)
    actions.json
  App.tsx
  main.tsx
```

## 3. State-Management (entschieden, OT-20)

- **Zustand** — ein kohärenter Store mit imperativen Actions
  (Zug → Kamera prüfen → Ereignis würfeln). Entscheidend: Der Store läuft
  **headless** — die KI-vs.-KI-Simulation treibt denselben Store ohne UI.
- Globaler State enthält:
  - `round`, `phase` ("ganove" | "detektive"), `activeDetectiveIndex`
  - `ganovePosition`, `detektivePositions[]`
  - `mission`, `events[]`, `cameras[]`, `blockedEdges[]`
  - `eventMode` (cycle | chance | tension), `tensionValue`
  - `seed`, `log[]`

## 4. Kartenmodell / Kartenpakete (entschieden, OT-17/OT-18)

Karten sind **Kartenpakete** (`/src/data/maps/<stadt>.json`), geladen via
`MapLoader.loadMap(id)`:

```json
{
  "id": "muenster",
  "name": "Münster",
  "tagline": "Jagd durch die Fahrradstadt",
  "viewBox": "0 0 1000 800",
  "nodes": [
    { "id": "hbf",      "name": "Hauptbahnhof", "x": 780, "y": 620,
      "categories": ["flucht", "kontakt"], "zone": "bahnhofsviertel" },
    { "id": "domplatz", "name": "Domplatz",     "x": 480, "y": 400,
      "categories": ["diebstahl"], "zone": "innenstadt" }
  ],
  "edges": [
    { "a": "hbf", "b": "domplatz", "type": "weg" },
    { "a": "hbf", "b": "hafen",    "type": "fahrt" }
  ],
  "spawnRules": {
    "detectives": { "mode": "choice", "nodes": ["hbf", "domplatz", "polizei"] },
    "ganove":     { "mode": "free", "minDistanceToDetective": 3 },
    "order": "detektive_first"
  },
  "settings": {
    "detectiveCount":  { "suggested": 4,  "min": 2,  "max": 6 },
    "cameraCount":     { "suggested": 8,  "min": 0,  "max": 15 },
    "roundLimit":      { "suggested": 30, "min": 15, "unlimited": true },
    "radioHintCount":  { "suggested": 5,  "min": 3,  "max": 10 },
    "edgeBlockRounds": { "suggested": 3,  "min": 1,  "max": 6 },
    "cameraMinGap":    2,
    "hintZoneRadius":  2,
    "eventMode":       "tension",
    "eventDefaults":   { "cycle": 4, "chance": 0.25, "threshold": 40, "perRound": 10 },
    "eventMix":        { "sichtbarkeit": 0.25, "hinweis": 0.45, "umwelt": 0.30 },
    "missionRules":    { "minGap": 3, "maxGap": 8, "routeBudget": 18,
                         "routeBudgetSabotage": 22, "sabotageDetour": 4 },
    "sabotageEffects": ["kamera_aus", "funkstille", "falsche_spur"]
  }
}
```

- `categories` = Pool für die MissionEngine; `zone` = Basis für Zonenhinweise;
  `x`/`y` = abstraktes Koordinatensystem für direktes SVG-Rendering.
- Pflichtfelder pro Paket: Graph, `spawnRules`, `settings`.
- **Spawn-Modi (OT-28):** `choice` (Liste erlaubter Knoten/Zonen) ·
  `free` (alle Knoten + `minDistanceToDetective`) · `random` (Zufall).
  Reihenfolge immer: Detektive zuerst, Ganove zuletzt (bei Wahl-Modi).
- **Map-abhängige Einstellungen (OT-26):** Alles, was mit Kartengröße oder
  Topologie skaliert, liegt in `settings` als `{ suggested, min, max }` —
  die Map liefert Vorschlag und erlaubten Bereich, das Menü überschreibt
  innerhalb davon. `roundLimit.unlimited: true` erlaubt „unbegrenzt"
  (nur Fang/Flucht entscheidet). Skalarfelder ohne Bereich
  (`cameraMinGap`, `hintZoneRadius`, `missionRules`, `eventMix`,
  `sabotageEffects`) sind feste Eigenschaften der Karte.
- Reine Spielregeln bleiben **global** (nicht im Paket): Rundenstruktur,
  Fangbedingungen, Hinweis-Grundsatz, Sabotage-Binärwahl.
- Münster: ~50 Knoten, Kantentypen `weg`/`fahrt`, `cost`-Feld reserviert.
- `MapGraph` rendert SVG: Knoten, Kanten, Detektiv-Icons, Kamera-Icons
  (nur Detektivansicht), gesperrte Kanten ausgegraut; Ganove nur in der
  GanoveUI sichtbar.

## 5. Modul-Logik

| Modul | Verantwortung |
|---|---|
| `Movement.ts` | `validateMove()` (Nachbarknoten, besetzte/gesperrte Ziele filtern), `applyMove()`, `legalMoves()`, `canActHere()` |
| `CameraSystem.ts` | `placeCameras()` — Abstand ≥ 2 Kanten, Missionsziele ausgeschlossen; `isCameraTriggered()`; `deactivateAll()` (Sabotage) |
| `EreignisEngine.ts` | Drei Auslösemodi; Typmischung 25/45/30; Kantensperrung mit Isolation-Check; Funkstille-Effekt |
| `MissionEngine.ts` | Generierung per Kategorie + BFS-Kriterien; feste Reihenfolge; Sabotage-Angebot; Aktions-Spur |
| `DetectiveAI.ts` | KI-Steuerung der 4 Detektive (Heuristik: letzter Hinweis + Einkreisung); auch KI-Ganove für Sim-Modus |
| `Recorder.ts` | JSONL-Eventlog, Export, localStorage der letzten N Partien |
| `MapLoader.ts` | `loadMap(id)`, Validierung gegen MapPack-Typ |
| `rng.ts` | **Einzige Zufallsquelle** — Seeded-RNG (z. B. mulberry32). Kein `Math.random()` in Engines (Replay-/Multiplayer-Fähigkeit) |

## 6. UI-Aufteilung

| GanoveUI | DetektiveUI |
|---|---|
| Eigene Position + Nachbarknoten | Karte inkl. Ortskategorien |
| Detektivpositionen | Eigene Positionen |
| Missionsfortschritt, „Aktion ausführen"-Button am Zielknoten | **Hinweis-Chronik** (Typ, Ort/Zone, Runde) |
| Gesperrte Kanten | Gesperrte Kanten |
| **Hitze-Indikator** (Icon + Text, 4 Stufen) | **Deduktions-Tools**: Marker, „Mögliche Positionen"-Overlay |
| Polizeifunk-Button (1×) | Missionsstruktur (ohne Zielknoten) |

## 7. Kommunikation / Betriebsmodi (entschieden, OT-04)

- **Prototyp (OT-30):** zwei Spielmodi — Mensch als Ganove vs.
  KI-Detektive (Primär) **und** Mensch als Detektivtrupp vs. KI-Ganove.
- **Dev-Modus:** KI-vs.-KI-Simulation mit Aufzeichnung (Balancing-Werkzeug).
- **Später:** WebSockets oder SignalR für Multiplayer; dafür bleiben
  Engines deterministisch und der Store headless-fähig.

## 8. Aufzeichnung (entschieden, OT-22)

JSONL-Eventlog, event-sourced, vollständig rekonstruierbar via Seed:

```jsonl
{"type":"header","gameId":"g-0042","mapId":"muenster","seed":12345,"config":{...},"mission":{...},"cameras":[...],"starts":{...}}
{"seq":1,"round":1,"type":"move","actor":"ganove","from":"x","to":"y","edgeType":"weg"}
{"seq":2,"round":1,"type":"hint","kind":"camera","node":"domplatz","visibleTo":"detectives"}
{"seq":9,"round":4,"type":"action","actor":"ganove","action":"theft","node":"schloss"}
{"seq":10,"round":4,"type":"sabotage_offer","offered":"falsche_spur","chosen":true}
{"seq":88,"round":21,"type":"result","outcome":"caught","rounds":21,"hintsTotal":14,"camerasTriggered":5}
```

- Zweck: **Balancing-Analyse** (primär) + Replay/Debugging (sekundär).
  Kein KI-Training-Ziel — aber das Format präjudiziert nichts.
- `result`-Summary enthält die Balancing-Metriken (Runden bis Fang,
  Hinweise/Partie, Kameratreffer).
- Export: „Partie exportieren"-Button (Blob-Download) + Auto-Speicherung
  der letzten N Logs in `localStorage`.
- `result.outcome` kennt zusätzlich `"draw"` (OT-29 Remis bei
  vorzeitigem Beenden).

### 8.1 Persistenz & Replay (entschieden, OT-34)

- **Save/Load:** Der Zustand-Store ist serialisierbar; Speicherstand =
  State-Snapshot + Log + Seed (`SaveGame.ts`). „Partie fortsetzen" im Menü.
- **Replay-Player (`ReplayPlayer.ts`):** Header + Events werden erneut
  deterministisch durch die Engines geschickt — Timeline mit
  Abspielen/Pause/Schritt vor/zurück; zwei Perspektiven (Ganove-Sicht /
  Detektiv-Sicht, gesteuert über `visibleTo`). Dient Balancing-Analyse
  und dem Feature „Schau dir deine Flucht an".
- **Statistiken:** Aus den Eventlogs aggregierte Werte — Siegquote,
  Partienlänge, Hinweise/Partie, Kameratreffer (versorgt OT-23).

## 9. Styling (entschieden, OT-20)

- **CSS-Module** (Vite-eingebaut, co-located, null Konfiguration).
  Kein Tailwind: Der visuelle Kern ist SVG, das profitiert nicht von
  Utility-Klassen; Panels sind einfache Listen. Fokus: Funktion.

## 10. Build & Deployment

- Vite Dev Server für lokale Entwicklung
- Produktion: statischer Build (`vite build`)
- Hosting: Netlify, Vercel oder eigener Server

## 11. Lokalisierung, Barrierefreiheit, Audio (entschieden, OT-35)

- **i18n von Beginn an:** alle Texte über Schlüssel (DE/EN), keine
  hartkodierten Strings in Komponenten — wichtig für internationale
  Städte (Amsterdam, Salzburg …).
- **Barrierefreiheit:** Icons/Overlays nie nur farbkodiert (Farbenblind-
  Modus via Form/Label), vollständige Tastaturbedienung, ausreichende
  Kontraste. Gilt auch für Hitze-Indikator und Deduktions-Overlays.
- **Audio:** dezente Sound-Dramaturgie als Spannungskanal für den Ganoven
  (Stufenanstieg des Hitze-Indikators, „Polizeiaktivität"-Ambient) —
  ersetzt das fehlende Sichtbarkeits-Feedback atmosphärisch.

## 12. Erweiterbarkeit

- Städte = Kartenpakete (Graph + spawnRules + balancing), siehe §4
- Missionssets, Ereignistypen als JSON
- Kameralogik, RNG, Recorder modular
- Doc-Viewer (Repo-Root): statische Markdown-Anzeige der `docs/`
