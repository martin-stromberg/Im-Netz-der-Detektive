# Umsetzungsplan: Menü, Einstellungen, Szenario-Auswahl, Startaufstellung (Schritt 11)

## Übersicht

Der temporäre `?mode=`-Switcher in `App.tsx` wird durch einen
zustandsgesteuerten Menüfluss ersetzt: Hauptmenü → Karten-Auswahl →
Modus-Auswahl → Einstellungen (kartenbegrenzt) → Missions-Auswahl →
Startaufstellung → Spiel. Zusätzlich ein Dev-Modus (KI-vs.-KI-Batch mit
Zusammenfassung), eine Statistik-/Replay-Ansicht auf Basis der
bestehenden Log-FIFO und die Eintragstruktur für „Partie fortsetzen"
(Befüllung in Schritt 12). Die bestehenden URL-Parameter bleiben als
Dev-/E2E-Deep-Link erhalten.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|------------------|------------|
| Navigation | Zustandsfluss (`Screen`-Union in `App.tsx`), kein Router | Projekt hat kein Routing; einfachstes konsistentes Mittel laut Auftrag |
| Spawn-Flow | Bleibt in `GanoveScreen`/`DetektivScreen`; Menü reicht eine `PendingGameConfig` per Props (`options`, `startImmediately`, `onExit`) | Bestehende Pick-Views und `MapGraph`-Selektion werden wiederverwendet statt eine dritte Spawn-UI zu bauen |
| Interaktive vs. automatische Aufstellung | Die **Spielerseite** wählt interaktiv bei `choice`/`free`, die KI-Seite wird immer gelost; `random` ist für beide Seiten automatisch | `choice`/`free` der Gegenseite kann der Spieler fachlich nicht setzen (geheime/Gegner-Positionen); spiegelt bisheriges Verhalten und Spec §3 |
| Missionsscharfe Ganoven-Spawns | `SpawnSystem.ganoveSpawnChoicesForMission` / `pickGanoveSpawnForMission` filtern Kandidaten zusätzlich gegen `missionCriteriaViolations`, wenn die Mission feste Ziele hat (`case`/`custom`/`resolvedMission`); `startGame` wendet denselben Filter beim Auto-Draw an | Verhindert `GameConfigError` nach der Wahl und crashende `runAiGame`-Aufrufe mit `case`-Missionen; „unerlaubte Positionen werden nicht angeboten" |
| Ereignismodus + Kadenz | `StartGameOptions.eventMode` + `StartGameOptions.eventDefaults` (Partial, über `map.settings.eventDefaults` gemerged); effektive Werte landen in `state.eventDefaults` und `header.config` | Kadenz „ein Ereignis alle ~N Runden" wird modusabhängig auf `cycle`/`chance`/`threshold` abgebildet; Replays brauchen die effektiven Werte im Header |
| Dev-Modus | `DevModeScreen` als Batch-Auslöser: Karte + Batch-Größe wählen, `runAiBatch` + `summarizeBatch`, Ergebnis-Übersicht | Auftrag erlaubt „beobachtet" oder „Batch-Auslöser" — Batch ist einfacher und liefert die geforderte Outcome-Verteilung |
| Fortsetzen/Statistik | `GameIndex.ts` mit `GameSummary` (aus gespeicherten Logs) + `ResumeEntry`-Struktur (reserviert, bis Schritt 12 Mid-Game-Saves schreibt); Menüeintrag „Partie fortsetzen" disabled, „Statistiken" listet fertige Partien | Eintragstruktur jetzt vorhanden, ohne Persistenz-Scope von Schritt 12 vorzugreifen |
| Kartenliste | `MENU_MAP_IDS = ["muenster", "luebeck"]` kuratiert + Platzhalter-Karten „in Vorbereitung"; `teststadt` bleibt reine Test-Fixture | Weitere Städte dürfen nur als „in Vorbereitung" erscheinen; Fixture-Karte gehört nicht ins Produktivmenü |
| Spielerdefinierte Mission | `MissionSelect` mit `CustomMissionPicker` auf `MapGraph`: Rollen nacheinander per Klick (`diebstahl → kontakt → flucht`, `sabotage` optional überspringbar); nur Knoten der passenden Kategorie sind selektierbar; `validateCustomTargets(map, graph, targets, null)` liefert Live-Fehler | Kriterien, die vom Ganoven-Start abhängen (`route_budget`), werden beim Spawn-Flow durch die obige Filterung erzwungen — konsistent zur Spec |

## Programmabläufe

### Neue Partie (Happy Path)

1. `MainMenu` → „Neue Partie" → `MapSelect` (Münster/Lübeck aktiv,
   weitere Karten disabled „in Vorbereitung").
2. `ModeSelect` → `ganove` | `detektiv` | `dev`.
3. `dev`: `DevModeScreen` (Batch-Konfiguration + Lauf + Zusammenfassung).
4. `ganove`/`detektiv`: `SettingsScreen` liest `loadMap(mapId).settings`,
   zeigt Bereiche `min–max` mit `suggested` vorausgewählt; `roundLimit`
   bietet „unbegrenzt" nur bei `unlimited: true`; `eventMode` +
   Kadenz-Eingabe; Validierung lehnt Werte außerhalb der Korridore ab.
5. `MissionSelect`: Fall (Name + `story` aus `loadMissionSet`, nur bei
   `hasMissionSet`), „Zufällig", „Spielerdefiniert" (`CustomMissionPicker`),
   „Ohne Mission".
6. `App` setzt `screen = "game"` und rendert `GanoveScreen` bzw.
   `DetektivScreen` mit `config`/`startImmediately`/`onExit`.
7. Spawn-Flow im Screen: Detektive zuerst (interaktive Picks bei
   Spieler-Detektiv + `choice`/`free`, sonst `pickDetectiveSpawns`),
   danach Ganove (interaktive Wahl aus
   `ganoveSpawnChoicesForMission`-Kandidaten bei Spieler-Ganove +
   `choice`/`free`, sonst `pickGanoveSpawnForMission`-Draw; bei
   `random` komplett automatisch).
8. `startGame` mit allen Optionen → Playing-View; `onExit` führt
   zurück ins Hauptmenü (`resetGame` + `screen = "menu"`).

### Statistik-View

`StatsScreen` ruft `listGameSummaries()` auf (liest das FIFO via
`Recorder.listGameLogs` + `parseLog`) und zeigt je Eintrag `gameId`,
Karte, Seed, Ausgang, Runden — leerer Zustand wird textlich erklärt.

### Dev-Modus

`DevModeScreen`: Karte aus `MENU_MAP_IDS` (oder alle via `listMapIds` —
Entscheidung: alle gebündelten Karten inkl. `teststadt`, da Dev-Tool),
Batch-Größe (10/25/50), Start-Seed (Zahl, Default 1). Klick auf
„Batch starten" → `runAiBatch(map, seeds)` → `summarizeBatch` →
Outcome-Tabelle + Kennzahlen + Hinweis auf die Log-Aufzeichnung.

## Neue Klassen

| Klasse/Datei | Typ | Zweck |
|--------------|-----|-------|
| `src/components/MainMenu.tsx` | UI-Komponente | Hauptmenü: Neue Partie, Partie fortsetzen (disabled), Statistiken/Replays |
| `src/components/MapSelect.tsx` | UI-Komponente | Karten-Auswahl (aktiv + „in Vorbereitung") |
| `src/components/ModeSelect.tsx` | UI-Komponente | Modus-Auswahl (Ganove/Detektiv/Dev) |
| `src/components/SettingsScreen.tsx` | UI-Komponente | Kartenbegrenztes Einstellungs-Formular |
| `src/components/MissionSelect.tsx` | UI-Komponente | Fall-/Zufalls-/Custom-/Keine-Mission-Auswahl inkl. `CustomMissionPicker` |
| `src/components/DevModeScreen.tsx` | UI-Komponente | KI-vs.-KI-Batch-Auslöser + `BatchSummary`-Anzeige |
| `src/components/StatsScreen.tsx` | UI-Komponente | Liste gespeicherter Partie-Summaries |
| `src/components/menuFlow.ts` | Hilfsmodul | `Screen`-Union, `PendingGameConfig`, `MENU_MAP_IDS`, `FORTHCOMING_MAPS`, Kadenz-Mapping `cadenceToEventDefaults` |
| `src/logic/GameIndex.ts` | Logikmodul | `GameSummary`, `listGameSummaries`, `ResumeEntry`, `listResumeEntries` (Struktur für Schritt 12) |
| `src/assets/` | Assets | Optionale Rasterillustrationen + `ASSETS.md` (Prompt/Lizenz) — nur bei erfolgreichem Pollinations-Download |

## Änderungen an bestehenden Klassen

### `App.tsx`

- Ersetzt den Modus-Switcher durch den `Screen`-Zustandsfluss;
  `?mode=ganove|detektiv` bleibt Deep-Link direkt in den Screen
  (unverändertes Setup-Verhalten für E2E).

### `GanoveScreen` (`src/components/GanoveScreen.tsx`)

- **Neue Props:** `options?: StartGameOptions`, `startImmediately?: boolean`, `onExit?: () => void`.
- `beginSetup` nutzt `options` (Mission, `detectiveCount`) vor
  URL-Parametern; bei `spawnRules.ganove.mode === "random"` direkter
  `pickGanoveSpawnForMission`-Draw + `startGame` statt Pick-View.
- `PickSpawnView` bietet `ganoveSpawnChoicesForMission` (Kriterienfilter).
- `startGame`-Optionen mergen `setup.options`; Outcome/Sidebar zeigen
  „Zum Hauptmenü" via `onExit`.

### `DetektivScreen` (`src/components/DetektivScreen.tsx`)

- **Neue Props:** `options?: StartGameOptions`, `startImmediately?: boolean`, `onExit?: () => void`.
- `detectiveCount` aus `options` statt fest `suggested`; bei
  `case`/`custom`-Missionen expliziter `ganovePosition` aus
  `pickGanoveSpawnForMission` (sonst Store-Draw wie bisher).
- „Zum Hauptmenü" via `onExit`.

### `useGameStore` (`src/state/gameStore.ts`)

- `StartGameOptions`: + `eventMode?: EventMode`, + `eventDefaults?: Partial<EventDefaults>`.
- `GameState`: + `eventDefaults: EventDefaults` (effektive Defaults).
- `startGame`: validiert `eventMode` (`EVENT_MODES`) und gemergte
  `eventDefaults` (positive Zahlen, `cycle` int ≥ 1, `chance` ∈ (0,1]);
  `GameConfigError` bei Verletzung; `header.config` protokolliert
  effektives `eventMode` + `eventDefaults`.
- `resolveSpawnPositions`: Ganoven-Kandidaten werden bei fester Mission
  (`resolveFixedTargets`) über `ganoveSpawnChoicesForMission` gefiltert.
- `runEventRoll` liest `state.eventDefaults` statt `map.settings.eventDefaults`.

### `SpawnSystem` (`src/logic/SpawnSystem.ts`)

- **Neue Funktionen:** `ganoveSpawnChoicesForMission(map, detectivePositions, targets?)`,
  `pickGanoveSpawnForMission(map, rng, detectivePositions, targets?)` —
  Kriterienfilter via `missionCriteriaViolations` (neuer Import aus
  `MissionSystem`).

### `MissionLoader` (`src/logic/MissionLoader.ts`)

- **Neue Funktion:** `resolveFixedTargets(map, mission): MissionTargets | null` —
  `case` → `caseTargets(getMissionCase(...))`, `custom` → `MissionTargets`
  aus Option, sonst `null` (zeichnet nichts).

### `Recorder` (`src/logic/Recorder.ts`)

- `startOptionsFromHeader`: + `eventMode`, + `eventDefaults` Durchreichung.

### `gameSetup.ts` (`src/components/gameSetup.ts`)

- Hilfsfunktionen: `cadenceToEventDefaults(mode, cadence, base)` und
  `eventCadenceOf(mode, defaults)` (Anzeige-Vorschlag).

### i18n (`src/i18n/de.json`, `en.json`)

- Alle neuen Menü-/Settings-/Missions-/Dev-/Stats-Texte, paritätisch.

### `App.test.tsx`

- Anpassung an Menüfluss (Menü statt `mode-select`; `?mode=`-Deep-Links
  bleiben getestet).

## Datenbankmigrationen

Keine (Browser-Spiel, kein DB-Schema; `localStorage`-Keys bleiben
bestehen, `ResumeEntry`-Key ist neu angelegt aber unbefüllt).

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| Settings-Formular | jeder Range-Wert ganzzahlig in `[min, max]` | Eingabe wird nicht angenommen / Fehlermeldung |
| `roundLimit` | `null` („unbegrenzt") nur wenn `settings.roundLimit.unlimited === true`; sonst `[min, max]` | Option gar nicht angeboten; `GameConfigError` beim Start |
| `eventMode` | einer von `cycle\|chance\|tension` | `GameConfigError` |
| `eventDefaults` (gemerged) | `cycle` int ≥1, `chance` ∈ (0,1], `threshold`/`perRound` > 0 | `GameConfigError` |
| Custom-Mission | Kategorie passend + `validateCustomTargets`-Kriterien (gegen `start: null` live, gegen echten Start via Spawn-Filter) | nicht selektierbare Knoten + Fehlerliste |
| Ganoven-Spawn | `ganoveSpawnChoicesForMission` (mind. `minDistanceToDetective`, plus Kriterien bei fester Mission) | Position nicht angeboten; `SpawnError` bei leerer Menge |

## Konfigurationsänderungen

Keine.

## Seiteneffekte und Risiken

- **`header.config`:** bekommt `eventMode` + `eventDefaults` neu — die
  Rekonstruktion (`startOptionsFromHeader`) reicht beide durch;
  bestehende Logs ohne die Felder rekonstruieren weiter korrekt
  (optionale Felder).
- **Ganoven-Spawn-Draw bei fester Mission:** ändert die Kandidatenmenge
  → andere Draws für dieselbe Seed bei `case`/`custom` (vorher
  potenziell crashend — Verhaltensänderung ist erwünscht).
- **Bestehende E2E-Specs:** hängen am `?mode=`-Pfad — bleibt erhalten,
  Risiko gering.
- **Coverage ≥ 70 %:** neue Komponenten/Logik bekommen Vitest-Tests.

## Umsetzungsreihenfolge

1. **`GameIndex.ts`** (Summaries + ResumeEntry-Struktur) — Voraussetzung: keine.
2. **`SpawnSystem`-Erweiterung** (`ganoveSpawnChoicesForMission`, `pickGanoveSpawnForMission`) — Voraussetzung: keine.
3. **`MissionLoader.resolveFixedTargets`** — Voraussetzung: keine.
4. **`gameStore`-Erweiterung** (`eventMode`/`eventDefaults`-Optionen, State-Feld, Header-Config, Spawn-Filter via `resolveFixedTargets`) — Voraussetzungen: Schritte 2–3.
5. **`Recorder.startOptionsFromHeader`** — Voraussetzung: Schritt 4 (Header-Felder).
6. **i18n-Keys** — Voraussetzung: keine.
7. **`menuFlow.ts` + Menü-Komponenten** (`MainMenu`, `MapSelect`, `ModeSelect`, `SettingsScreen`, `MissionSelect`, `DevModeScreen`, `StatsScreen`) — Voraussetzungen: Schritte 1, 6.
8. **`App.tsx`-Zustandsfluss** — Voraussetzung: Schritt 7.
9. **Screen-Anpassungen** (`GanoveScreen`, `DetektivScreen`: `options`/`startImmediately`/`onExit`, Mission-Filter im Pick) — Voraussetzungen: Schritte 2–4.
10. **Assets (optional):** Pollinations-Download, Sichtprüfung, `src/assets/` + `ASSETS.md`; sonst Dokumentation des Fallbacks — Voraussetzung: keine.
11. **Unit-/Komponententests** für 1–9 — parallel zu den Schritten.
12. **E2E `e2e/menu.spec.ts`** — Voraussetzungen: Schritte 7–9.

## Tests

### Neue Tests

| Test / Hilfsmethode | Testklasse | Was wird geprüft |
|---------------------|------------|-------------------|
| `listGameSummaries` parsed FIFO-Logs zu Summaries | `src/logic/GameIndex.test.ts` | gameId/mapId/seed/outcome/rounds, ungültige Einträge übersprungen, leere Storage |
| `ganoveSpawnChoicesForMission` | `src/logic/SpawnSystem.test.ts` (Erweiterung) | min-Distance-Filter + Kriterienfilter bei festen Targets, ungefiltert ohne Targets |
| `resolveFixedTargets` | `src/logic/MissionLoader.test.ts` (Erweiterung) | case→targets, custom→targets, random/none→null, Fehler bei unbekanntem Fall |
| `startGame` `eventMode`/`eventDefaults` | `src/state/gameStore.*.test.ts` (neu `gameStore.events.test.ts`) | Override wirkt, ungültige Werte → `GameConfigError`, Header-Config enthält effektive Werte, `startOptionsFromHeader` reicht durch |
| Spawn-Filter in `startGame` | obige Testdatei | `case`-Mission mit Auto-Draw wählt nur kriterienkonforme Positionen |
| `SettingsScreen` | `src/components/SettingsScreen.test.tsx` | Bereiche aus Map-Settings, `unlimited` nur wo erlaubt, ungültige Werte verweigert, Vorschläge vorausgewählt |
| `MissionSelect`/`CustomMissionPicker` | `src/components/MissionSelect.test.tsx` | Fälle mit Name+Story, Custom-Picks nur passende Kategorien, `validateCustomTargets`-Fehler sichtbar |
| `MainMenu`/`MapSelect`/`ModeSelect`/`StatsScreen`/`DevModeScreen` | `src/components/MenuScreens.test.tsx` | Einträge/Disabling, „in Vorbereitung", Stats-Liste, Dev-Batch löst `runAiBatch` aus und zeigt Summary |
| `App`-Fluss | `src/App.test.tsx` (angepasst) | Menü → Karte → Modus → Settings → Mission → Spiel; `?mode=` Deep-Link unverändert |
| `cadenceToEventDefaults` | `src/components/gameSetup.test.ts` (neu) | Mapping je Modus |

### Betroffene bestehende Tests

| Test / Testklasse | Grund der Anpassung |
|-------------------|---------------------|
| `src/App.test.tsx` | `mode-select` entfällt zugunsten des Hauptmenüs |
| `src/logic/Recorder.test.ts` | `startOptionsFromHeader` deckt zusätzliche Header-Felder ab (Bestehende Tests bleiben gültig) |

### E2E-Tests (primärer Funktionsnachweis)

| Priorität | Szenario | Testdatei | Akzeptanzkriterium | Warum E2E |
|-----------|----------|-----------|--------------------|-----------|
| Pflicht | Menü → Karte (Münster) → Modus Ganove → Settings → Zufalls-Mission → Ganove-Spawn-Pick → Spiel läuft | `e2e/menu.spec.ts` | Auswahl führt korrekt in den Spielstart | kompletter Benutzerfluss |
| Pflicht | Gleicher Fluss als Detektiv mit Fall-Auswahl (Name + Story sichtbar) → Detektiv-Picks → Spiel läuft | `e2e/menu.spec.ts` | Fall mit Name + Mini-Story; Spawn-Flow Detektive zuerst | Benutzerfluss |
| Pflicht | Einstellungen: „unbegrenzt" bei Münster angeboten, bei Lübeck nicht; Werte außerhalb des Korridors nicht wählbar | `e2e/menu.spec.ts` | Bereichsbegrenzung + unbegrenzt | sichtbare Validierung |
| Pflicht | Spielerdefinierte Mission: nur kategorieschlußige Knoten wählbar, Kriterienfehler werden angezeigt | `e2e/menu.spec.ts` | Custom-Validierung | sichtbare Validierung |
| Pflicht | Weitere Städte disabled „in Vorbereitung" | `e2e/menu.spec.ts` | Karten-Auswahl | Sichtbarkeitsregel |
| Pflicht | Dev-Modus: Batch läuft, Outcome-Verteilung sichtbar | `e2e/menu.spec.ts` | Dev-Modus | Benutzerfluss |
| Pflicht | Statistik: Einträge oder leerer Zustand; „Partie fortsetzen" disabled | `e2e/menu.spec.ts` | Menüeinträge/Persistenz-Vorgriff | Sichtbarkeit |
| Pflicht | `?mode=ganove`/`?mode=detektiv` Deep-Link startet weiterhin direkt | bestehende Specs | Rückwärtskompatibilität | geschützter Bestand |

## Offene Punkte

Keine.
