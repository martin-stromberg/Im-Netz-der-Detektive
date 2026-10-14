# Übersetzte Anforderung: Persistenz & Replay (Entwicklungsschritt 12)

Quelle: Kundenanforderung „Das Spiel — Schritt 12: Persistenz & Replay",
Spezifikation `docs/konzept/content/02-technisches-konzept.md` §8 und §8.1
(OT-34, versorgt OT-23 Balancing-Statistiken).

## Fachliche Zusammenfassung

Drei Bausteine machen das JSONL-Eventlog produktiv nutzbar:

1. **Save/Load:** Laufende Partien können in beiden Spiel-Screens an
   beliebiger Stelle gespeichert werden (Speicherstand = serialisierter
   State-Snapshot + Log + Seed). „Partie fortsetzen" im Hauptmenü stellt
   den exakten Spielzustand wieder her — Runde, Phase, aktiver Detektiv,
   Positionen, Mission (inkl. Stage und `pendingChoice`), Hinweise/Events,
   Kameras, Sperrungen, verbrauchter Polizeifunk (`radioUsed`) und die
   Sabotage-Fenster (`hintSilenceUntilRound`, `falseTrailUntilRound`,
   `tensionValue`). Das Speicherformat trägt ein `schema`-Versionsfeld.
2. **Replay-Player:** Gespeicherte Eventlogs werden deterministisch erneut
   durch die Engine geschickt (Rekonstruktion via `startOptionsFromHeader`
   + schrittweises Re-Ausführen der Aktoreinträge). Die Timeline bietet
   Abspielen/Pause/Schritt vor/Schritt zurück; zwei Perspektiven —
   Ganove-Sicht und Detektiv-Sicht — werden über `visibleTo` auf
   Datenebene gefiltert und nutzen die vorhandenen `MapGraph`-/Panel-
   Komponenten.
3. **Statistiken:** Aus den gespeicherten Logs aggregierte Werte —
   Siegquote je Seite und je Modus, durchschnittliche Partienlänge,
   Hinweise pro Partie, Kameratreffer — plus eine verwaltbare Log-Liste
   (ansehen via Replay, exportieren, löschen; automatische
   `localStorage`-Vorhaltung über `Recorder` FIFO bleibt).

## Betroffene Klassen und Komponenten

### Neue Module (Logik, `src/logic/`)

- `SaveGame.ts` — serialisierbarer `GameSnapshot` (alle Datenfelder des
  `GameState` ohne `map`), `SAVE_SCHEMA_VERSION`, `snapshotGame(state)`,
  `restoreGameData(snapshot)`-Validierung.
- `ReplayPlayer.ts` — Log-Parsing, Identifikation der Aktoreinträge
  (`move`, `action`, `sabotage_offer` mit `chosen`, `radio`),
  schrittweises Re-Ausführen über den Store (`replayTo(step)`),
  Perspektivenfilter `visibleTo`.
- `Statistics.ts` — Aggregation über gespeicherte Logs: Siegquote je
  Seite (Ganove `escaped`/`timeout` vs. Detektive `caught`/`surrounded`,
  Remis separat) und je Modus, Ø Runden, Ø Hinweise, Ø Kameratreffer.

### Erweiterte bestehende Module

- `src/logic/GameIndex.ts` — `ResumeEntry` erhält `schema`-Versionsfeld
  und `mode` (gespielte Perspektive) plus den Snapshot;
  `saveResumeEntry`/`deleteResumeEntry`/`clearResumeEntries`;
  `deleteGameLog` für die Log-Verwaltung (oder in `Recorder.ts`).
- `src/state/gameStore.ts` — `applySnapshot`/`resumeGame`-Methode zum
  Wiederherstellen; optional `playerMode` in `StartGameOptions` +
  Header-`config` (Grundlage für „Siegquote je Modus").
- `src/logic/Recorder.ts` — ggf. `deleteGameLog`/`getGameLog` für die
  Log-Verwaltung.

### Neue/erweiterte UI-Komponenten (`src/components/`)

- `ResumeScreen` oder Auswahl im Menü — „Partie fortsetzen" wird aktiv,
  listet gespeicherte Partien benannt (Karte, Runde, Zeitpunkt).
- `ReplayScreen` — Timeline (Play/Pause/Schritt vor/zurück), Perspektiv-
  Umschalter, `MapGraph` + Chronik je Perspektive.
- `StatsScreen` — aggregierte Statistik-Werte + Log-Verwaltung
  (Replay-Button je Eintrag, Export, Löschen, Alle löschen).
- `GanoveScreen`/`DetektivScreen` — „Partie speichern"-Aktion.
- `MainMenu` — „Partie fortsetzen" aktiv + Zielauswahl.
- `App.tsx`/`menuFlow.ts` — neue Screens `resume`, `replay`.

### Enums/Typen

- `Visibility`/`ViewSide` (existieren); `PlayerMode` existiert bereits
  in `menuFlow.ts`.

### Tests

- Unit-Tests: `SaveGame.test.ts` (Snapshot-Roundtrip, vollständiger
  Zustandsvergleich, verbrauchte Einmal-Fähigkeiten, Schema-Version),
  `ReplayPlayer.test.ts` (Determinismus, Schritt vor/zurück identisch,
  `visibleTo`-Filterung), `Statistics.test.ts` (exakte Werte über
  Log-Fixtures), `GameIndex`-Erweiterungen.
- E2E (Playwright): Speichern→Menü→Fortsetzen; Stats-Liste; Replay mit
  Perspektivwechsel und Timeline.

## Implementierungsansatz

- **Resume:** Snapshot des Daten-Subsets von `GameState` (ohne `map`;
  Karte via `mapId` + `loadMap` neu geladen). Laden = `loadMap` +
  Store-Restore. Einträge unter `RESUME_STORAGE_KEY` in `localStorage`,
  FIFO-begrenzt; gleiche `gameId` ersetzt den älteren Eintrag.
  `schema`-Feld: unbekannte Versionen werden abgelehnt/ignoriert.
- **Replay:** `header` → `startOptionsFromHeader` → `startGame`, dann
  die Aktoreinträge in `seq`-Reihenfolge erneut ausführen
  (`moveGanove`, `moveDetective`, `ganoveAction`, `chooseMissionPath`,
  `useRadio`); engine-emittierte Einträge (`hint`, `event`,
  `edge_unblock`, `sabotage`/`sabotage_offer` ohne `chosen`, `result`)
  entstehen dabei identisch neu. Schritt zurück = deterministisches
  Neuabspielen bis zum vorherigen Schritt.
- **Statistik:** reine Funktionen über `parseLog`/`summarizeLog`;
  Modus-Aggregation über `header.config.playerMode` (neues optionales
  Feld, das die Screens setzen; fehlende Werte bilden eine eigene
  Gruppe, z. B. KI-Partien aus dem Dev-Modus).

## Konfiguration

- Keine neuen Konfigurationseinträge nötig. `localStorage`-Keys:
  `RESUME_STORAGE_KEY` (existiert), `LOG_STORAGE_KEY` (existiert).

## Annahmen (keine echten offenen Fragen)

- „Modus" in „Siegquote je Seite/Modus" = gespielte Perspektive
  (`ganove`-UI, `detektiv`-UI, KI/Dev-Modus) — wird per `playerMode`
  im Log-Header protokolliert; Einträge ohne Feld zählen als `unbekannt`.
- Mehrere Speicherstände sind parallel möglich (FIFO); „Partie
  fortsetzen" listet sie mit Klartext-Bezeichnung zur Auswahl.
- Speichern ist nur aus einer laufenden Partie möglich (kein Save nach
  `outcome`).

## Offene Fragen

Keine — Anforderung und Spec §8/§8.1 decken Ziel und Format ab;
obige Annahmen sind aus dem Bestand ableitbar.
