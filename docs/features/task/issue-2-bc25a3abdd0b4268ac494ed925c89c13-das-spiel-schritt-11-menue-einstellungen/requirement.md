# Übersetzte Anforderung: Menü, Einstellungen, Szenario-Auswahl, Startaufstellung (Schritt 11)

## Fachliche Zusammenfassung

Der temporäre Modus-Switcher in `App.tsx` wird durch den vollständigen
Anwendungsrahmen ersetzt: Ein zustandsgesteuerter Menüfluss (kein
Router-Paket) führt von Hauptmenü über Karten-Auswahl (Münster, Lübeck,
weitere Städte „in Vorbereitung"), Modus-Auswahl (Ganove, Detektiv,
Dev-Modus KI-vs.-KI), kartenbegrenzten Einstellungen und
Missions-Auswahl (Fall / zufällig / spielerdefiniert) in den
Startaufstellungs-Flow und den Spielstart. „Partie fortsetzen" und
„Statistiken/Replay" werden als Menüeinträge mit vorgesehener
Eintragstruktur angelegt (Befüllung in Schritt 12). Optional kommen
lokal eingebettete, KI-generierte Rasterillustrationen zum Einsatz.

## Betroffene Klassen und Komponenten

- **UI-Komponenten (neu):** `MainMenu`, `MapSelect`, `ModeSelect`,
  `SettingsScreen`, `MissionSelect` (inkl. `CustomMissionPicker`),
  `DevModeScreen`, `StatsScreen`, gemeinsamer Setup-/`PendingGameConfig`-Typ.
- **Bestehende UI-Komponenten (angepasst):** `App.tsx` (Zustandsfluss
  statt Modus-Switcher; `?mode=`/`?map=`/`?seed=`/`?mission=` bleiben als
  Dev-/E2E-Deep-Link bestehen), `GanoveScreen`, `DetektivScreen`
  (Startkonfiguration per Props statt nur URL-Parametern; `autoStart`;
  Spawn-Wahl missionsscharf gefiltert).
- **Logik (neu/angepasst):**
  - `gameStore.ts`: `StartGameOptions` um `eventMode` und
    `eventDefaults`-Override (Ereignismodus + Kadenz) erweitert;
    effektive Werte in State und Log-`header.config`.
  - `SpawnSystem.ts`: missionsscharfe Ganoven-Spawnmenge
    (`ganoveSpawnChoicesForMission` / `pickGanoveSpawnForMission`) —
    bei `case`/`custom`-Missionen werden zusätzlich zu
    `minDistanceToDetective` nur Positionen angeboten, die die
    Generierungskriterien erfüllen.
  - `GameIndex` (neu): `GameSummary`-Eintragstruktur +
    `listGameSummaries()` über `Recorder.listGameLogs`/`parseLog`
    (Grundlage für Fortsetzen/Statistik in Schritt 12).
  - `gameSetup.ts`: Settings-/Kadenz-Hilfsfunktionen.
- **Datenmodell/Config:** keine neuen JSON-Pakete; `en.json`/`de.json`
  erhalten paritätische neue Schlüssel.
- **Assets (optional):** `src/assets/` — lokal eingebettete
  Rasterillustrationen (Pollinations.ai-Download, keine Hotlinks) mit
  dokumentiertem Prompt/Lizenz-Hinweis; Fallback: SVG/Vektor-Artwork.
- **Tests:** Vitest-Komponenten-/Logiktests für die neuen Module;
  Playwright-E2E `e2e/menu.spec.ts` für die Menüflüsse; bestehende
  `App.test.tsx` muss an den neuen Menüfluss angepasst werden;
  bestehende `?mode=`-E2E-Specs müssen weiter grün laufen.

## Implementierungsansatz

- **Navigation:** einfacher Zustandsfluss in `App.tsx`
  (`menu → map → mode → settings → mission → game`, plus `dev` und
  `stats`), konsistent zum bestehenden State-basierten Ansatz — kein
  Router-Paket.
- **Spielstart:** Der Menüfluss sammelt eine `PendingGameConfig`
  (`mapId`, `seed`, `StartGameOptions`, `mode`) und reicht sie an
  `GanoveScreen`/`DetektivScreen`; dort ersetzt sie die bisherigen
  Idle-Defaults, der vorhandene Spawn-Pick-View wird wiederverwendet
  (detektivseitig interaktiv bei `choice`/`free`, automatisch bei
  `random`; ganovenseitig interaktiv bei `choice`/`free`, automatisch
  bei `random` oder wenn der Ganove KI-gesteuert ist).
- **Einstellungen:** Formularwerte werden gegen die
  `{suggested, min, max}`-Bereiche des geladenen `MapPack` begrenzt;
  `roundLimit` bietet „unbegrenzt" nur bei `settings.roundLimit.unlimited`.
  `eventMode` (cycle/chance/tension) und eine Kadenzangabe werden in
  einen `eventDefaults`-Override übersetzt.
- **Missions-Auswahl:** Fälle aus `loadMissionSet(map)` mit Name +
  `story`; „zufällig" (`"random"`) und „spielerdefiniert" mit
  `validateCustomTargets`-Live-Prüfung; Karten ohne Missionsset bieten
  nur zufällig/spielerdefiniert/keine.
- **Dev-Modus:** `DevModeScreen` startet `runAiBatch` +
  `summarizeBatch` und zeigt die Outcome-Verteilung; Aufzeichnung
  läuft über den bestehenden Auto-Persist-Pfad (`saveGameLog`).
- **i18n:** Alle Menütexte über `t()`-Keys in `de.json`/`en.json`
  (Hook `i18n-check.py` erzwingt Parität).

## Konfiguration

Keine neuen Konfigurationsdateien. Spieleinstellungen sind
partienbezogen (pro Spielstart über `StartGameOptions`), die erlaubten
Bereiche kommen aus dem Kartenpaket. Persistent bleibt vorerst nur das
bestehende Game-Log-FIFO (`Recorder`).

## Offene Fragen

- „Partie fortsetzen": In Schritt 11 existiert noch keine
  Mid-Game-Persistenz — der Menüeintrag wird mit „in Vorbereitung"
  dargestellt (Annahme: bewusst so gewollt, da Schritt 12 befüllt).
- „Kadenz" wird als „ein Ereignis alle ~N Runden" interpretiert und je
  nach Ereignismodus auf `cycle`, `chance = 1/N` bzw.
  `threshold = N · perRound` abgebildet (Annahme).
- KI-generierte Rasterassets: abhängig von Erreichbarkeit und Qualität
  von Pollinations.ai; bei Scheitern SVG-Fallback und Token-Bedarf für
  Schritt 14 dokumentieren (Annahme laut Auftrag).
