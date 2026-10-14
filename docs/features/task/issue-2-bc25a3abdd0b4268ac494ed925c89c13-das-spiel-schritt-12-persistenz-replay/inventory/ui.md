# UI — Persistenz & Replay

## `App.tsx`
Datei: `src/App.tsx`

State-Maschine `menu → map → mode → settings → mission → game` plus
`dev` und `stats`. `PendingGameConfig` `{mapId, mode, seed?, options}`
übergibt die Auswahl an die Screens; `exitToMenu` ruft `resetGame`.
Deep-Links `?mode=ganove|detektiv` bleiben unverändert.
**Betroffen:** neue Screens `resume` (Speicherstand-Auswahl) und
`replay` (Replay-Player) müssen in die Maschine eingehängt werden;
`MenuScreen` in `menuFlow.ts` erweitern.

## `MainMenu.tsx`
Datei: `src/components/MainMenu.tsx`

- `menu-resume`-Button: aktuell `disabled={!resumable}` per
  `listResumeEntries()` — wird automatisch aktiv, sobald Einträge
  existieren. **Fehlt:** `onClick`-Navigation zum Resume-Flow.
- `menu-stats`-Button: navigiert zu `stats`.
- Hinweis-Text `menu.resumeHint` muss auf die neue Bedeutung
  angepasst werden (Einträge vorhanden vs. nicht).

## `StatsScreen.tsx`
Datei: `src/components/StatsScreen.tsx`

Stub: Tabelle `stats-table` mit `listGameSummaries` (Partie, Karte,
Seed, Ausgang, Runden) + `stats-empty` + `stats.replayHint`.
**Fehlt:** aggregierte Statistik-Werte, Verwaltungsaktionen je Eintrag
(ansehen/Replay, exportieren, löschen) und „Alle löschen".

## `GanoveScreen.tsx` / `DetektivScreen.tsx`
Dateien: `src/components/`

Props `mapId?`, `seed?`, `options?`, `startImmediately?`, `onExit?`,
`autoDetectives?`/`autoGanove?` — liefern den laufenden Spielzustand aus
`useGameStore`. Beide besitzen `abort-button`/`abort-confirm` und
`exit-to-menu` im `OutcomeView`.
**Fehlt:** „Partie speichern"-Aktion in der laufenden Ansicht
(nur solange `outcome === null`); nach dem Fortsetzen muss der Screen
im „playing"-View stehen (Map+State kommen aus dem Store — kein
Setup-Flow nötig, wenn der Snapshot direkt geladen wird). Der
Resume-Pfad muss daher **vor** dem Idle-Fall greifen.

## `MapGraph.tsx`
Datei: `src/components/MapGraph.tsx`

Vollständig parametrisierte SVG-Karte (`data-testid="map-graph"`):
`detectivePositions`, `ganovePosition` (nur Ganove-Sicht), `cameras`
(nur Detektiv-Sicht), `blockedEdges`, `missionTargets`,
`escapeNodeIds`, `possibleNodeIds`, `activeDetectiveIndex`,
`showCategories`/`showZones`, Selektions-Props. Reicht für beide
Replay-Perspektiven ohne Erweiterung.

## `MissionPanel.tsx`, `HeatBadge.tsx`
Vorhandene Panels für Mission/Hitze — in den Replay-Perspektiven
wiederverwendbar (Ganove-Sicht: `MissionPanel` + `HeatBadge`;
Detektiv-Sicht: Missionsstruktur + Chronik).

## `menuFlow.ts`
`MenuScreen`-Union, `PendingGameConfig`, `MENU_MAP_IDS`,
`EVENT_CADENCE_*`. Neue Screens ergänzen die Union.

## i18n
`src/i18n/de.json` + `en.json` müssen paritätisch bleiben
(Hook `i18n-check.py`). Bestehende Schlüssel `menu.*`, `stats.*`,
`outcome.*` vorhanden; neue Keys für Speichern/Fortsetzen/Replay/
Statistik nötig.
