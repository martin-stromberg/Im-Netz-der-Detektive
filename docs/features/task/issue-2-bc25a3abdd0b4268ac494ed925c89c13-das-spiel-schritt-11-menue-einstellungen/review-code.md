# Code-Review — Schritt 11: Anwendungsrahmen

Review der Änderungen gegen die Anforderung (statebasierter Fluss,
Informationsasymmetrie, Determinismus, Engine-Reuse, Regelkonformität,
Persistenz-Vorbereitung, Asset-Einbettung).

## Geprüfte Dateien

- `src/App.tsx` (+ `.module.css`, `.test.tsx`) — kompletter Umbau zum Zustandsfluss
- `src/components/MainMenu.tsx`, `MapSelect.tsx`, `ModeSelect.tsx`,
  `SettingsScreen.tsx`, `MissionSelect.tsx`, `DevModeScreen.tsx`,
  `StatsScreen.tsx`, `menuFlow.ts`, `Menu.module.css` — neu
- `src/components/GanoveScreen.tsx`, `DetektivScreen.tsx` — erweitert
  (`options`, `startImmediately`, `onExit`, Missionsfilter im Spawn)
- `src/logic/GameIndex.ts` — neu (Summary-/Resume-Strukturen)
- `src/logic/SpawnSystem.ts` — `ganoveSpawnChoicesForMission`,
  `pickGanoveSpawnForMission`
- `src/logic/MissionLoader.ts` — `resolveFixedTargets`
- `src/logic/Recorder.ts` — `eventMode`/`eventDefaults` im Header-Replay
- `src/state/gameStore.ts` — Ereignis-Optionen, Missionsfilter-Spawn,
  Header-Config
- `src/i18n/de.json`/`en.json` — +68 Keys, paritätisch
- `src/assets/` — 3 JPEGs + `ASSETS.md`
- `e2e/menu.spec.ts`, `src/logic/GameIndex.test.ts`,
  `src/state/gameStore.events.test.ts`, `src/components/menuFlow.test.ts`,
  `MenuScreens.test.tsx`, `SettingsScreen.test.tsx`,
  `MissionSelect.test.tsx`, plus Erweiterungen in
  `SpawnSystem.test.ts`/`MissionLoader.test.ts`/`Recorder.test.ts`

## Explizite Prüfpunkte

- **Determinismus:** Alle Spawn-Draws laufen über den Spiel-RNG
  (`createRng(seed)` / `aiRng`); `ganoveSpawnChoicesForMission` filtert
  die bestehende deterministische Kandidatenliste — kein zusätzlicher
  Zufallsstrom. Kein `Math.random` unter `src/logic` (Hook-geprüft). ✅
- **Korrekte Spawn-Reihenfolge:** `resolveSpawnPositions` setzt weiter
  Detektive zuerst, Ganove zuletzt; interaktive Pfade bleiben
  `choice`/`free`, `random` vollautomatisch (im Ganove-Screen direkt,
  im Detektiv-Screen unverändert über `pickDetectiveSpawns`). ✅
- **Missionsfilter am richtigen Punkt:** Der Filter gilt nur bei
  *gezogener* Position und nur mit festen Zielen (`resolveFixedTargets`
  → `null` bei `auto`/`random`/`none`); explizit gesetzte Positionen
  (Menü-Pick, Rekonstruktion) werden nicht gefiltert — die
  Validierung bleibt bei `resolveMission`/`validateCustomTargets`. ✅
- **Rekonstruktion unverändert:** `resolvedMission`/`resolvedCameras`
  laufen weiter ohne Draws; `startOptionsFromHeader` reicht die neuen
  `eventMode`/`eventDefaults`-Felder durch (bitgleiche Logs getestet). ✅
- **Asymmetrie:** Kein neuer Datenfluss, der `ganovePosition` oder
  gezogene `mission.targets` in die Detektiv-Sicht leakt;
  `DetektivScreen` erhält die Kriterien-Auslosung nur als fertige
  Position im Store. Menü-Pfade nutzen `startGame` unverändert. ✅
- **Dev-Modus:** `DevModeScreen` ruft ausschließlich
  `runAiBatch`/`summarizeBatch`/`loadMap`/`listMapIds` auf — keine
  neue Simulationslogik; Aufzeichnung übernimmt `saveGameLog` im
  bestehenden `Recorder`-Pfad. ✅
- **Einstellungen:** Alle Optionen werden gegen die
  `RangeSetting`-Korridore des ausgewählten Map-Pakets validiert;
  `roundLimit: null` ist nur bei `roundLimit.unlimited` erreichbar,
  `unlimited`-Checkbox fehlt sonst komplett. ✅
- **i18n:** 203 Keys je Katalog, paritätisch; kein hartcodierter
  Anzeigetext in den neuen Komponenten (nur `data-testid`/aria-Keys). ✅
- **Assets:** drei JPEGs lokal unter `src/assets/` gebündelt
  (Vite-Import, statisch); keine externen Requests zur Laufzeit;
  Prompts/Lizenz in `ASSETS.md` dokumentiert. ✅
- **Layering:** `GameIndex` importiert `MissionOption`-Typen aus
  `state/gameStore` (type-only) — dasselbe Muster wie bereits
  `MissionLoader`; keine neue Laufzeit-Abhängigkeit logic↔state. ✅

## Befunde und Auflösung

| # | Befund | Status |
|---|---|---|
| C1 | `MapSelect` importierte `MapValidationError` aus `MapLoader` statt `mapPack` | **behoben** |
| C2 | `SettingsScreen` deklarierte Setter für `radioHintCount`/`edgeBlockRounds`, ohne die Felder zu rendern | **behoben** — `RangeField`s ergänzt |
| C3 | `GameIndex.summarizeLog` nutzte einen brüchigen `as`-Cast auf `LogEntry[]` | **behoben** — `records.find((e) => e.type === "header")` direkt auf den geparsten Records |
| C4 | `MissionSelect` gab `sabotage: null` in `MissionOption` durch (Typ `string \| undefined`) | **behoben** — Normalisierung `?? undefined` |
| C5 | Leere `""`-Sentinel für „ohne Sabotage" wäre in `MissionTargets` gelandet | **behoben** — Sentinel nur intern im Picker; Ausgabe normalisiert zu `null`/`undefined` |
| C6 | Tote CSS-Klassen `modeGrid`/`modeHint` in `App.module.css` | **behoben** — entfernt |
| C7 | `useEffect` für `startImmediately` referenziert `beginSetup` ohne Deps (ESLint-`exhaustive-deps`) | **dokumentiert** — Guard per `useRef`, StrictMode-sicher; `eslint-disable` mit Kommentar |
| C8 | `App.tsx` rendert `MainMenu` als Fallback in unerreichbaren Zuständen (`map === null`) | **bewusst** — defensiver Fallback statt Crash, deckt alle `switch`-Zweige ab |

## Restrisiken / bewusste Entscheidungen

- `DevModeScreen` läuft den Batch synchron — Batch ≤ 25 auf ≤ 59
  Knoten ist subsekundär; bei größeren Maps wäre Chunking/Worker
  nötig (Polishing).
- `StatsScreen` zeigt noch keine Replay-Navigation — die
  `GameSummary`-Struktur ist fertig, der Abspieler ist Schritt 12.
- `main.tsx`/`index.html` unverändert — der Menüfluss ersetzt nur die
  App-Shell, Deep-Links bleiben kompatibel.
- `MapSelect` kuratiert `MENU_MAP_IDS` hart — ein generischer
  „listMapIds minus Fixtures"-Filter wäre möglich, aber die
  Kuratierung verhindert das unbeabsichtigte Auftauchen neuer
  Datenpakete im Menü.

## Ergebnis

**Keine Befunde offen** — alle gefundenen Punkte sind behoben oder als
hinnehmbare/bewusste Entscheidungen dokumentiert.
