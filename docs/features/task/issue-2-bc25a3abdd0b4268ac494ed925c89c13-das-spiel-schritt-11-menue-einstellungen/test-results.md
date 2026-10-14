# Testergebnisse — Schritt 11: Menü, Einstellungen, Szenario-Auswahl, Startaufstellung

Ausführung am 2026-10-14 auf dem Feature-Branch
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-11-menue-einstellungen`.

## Befehle

| Befehl | Ergebnis |
|---|---|
| `npm run build` (`tsc --noEmit && vite build`) | ✅ grün (0 Fehler, Assets gebündelt, `✓ built in ~117 ms`) |
| `npm test` (`vitest run`) | ✅ **40 Dateien / 494 Tests, alle grün** |
| `npm run coverage` (`vitest run --coverage`) | ✅ **Statements 92,4 % · Branches 84,8 % · Funktionen 96,5 % · Lines 92,0 %** — ≥ 70 %-Vorgabe erfüllt |
| `npm run lint` (`eslint .`) | ✅ 0 Befunde |
| `npm run test:e2e` (`playwright test`) | ✅ **20/20 Tests grün** (12 Bestand + 8 neu, ~6 s) |

## Neue Unit-/Komponententests (48 neue, 445 → 494)

- `src/logic/GameIndex.test.ts` (8): Summaries aus JSONL (header+result,
  Leerstand, kaputte Inhalte → `null`), `listGameSummaries` neueste
  zuerst mit FIFO-/Fehlertoleranz, `listResumeEntries` leer/Filter.
- `src/logic/SpawnSystem.test.ts` (+4): `ganoveSpawnChoicesForMission`
  unverändert ohne Ziele, filtert bei Kriterienverstoß (route_budget),
  wirft `SpawnError` bei leerem Rest, deterministischer Draw.
- `src/logic/MissionLoader.test.ts` (+5): `resolveFixedTargets` für
  `case`/`custom`/`auto`/`random`/`none`/`undefined`, Fehler ohne
  Missionsset und bei unbekannter Fall-ID.
- `src/state/gameStore.events.test.ts` (6): Default-Eventmodus/-Kadenz
  aus der Karte, Override inkl. Header-Config, ungültige Modi/Kadenzen
  (`cycle` 0/1,5 · `chance` 0/>1 · negative `threshold`/`perRound`),
  Zyklus-Feuer alle N Runden, missionsgefilterte Ganove-Spawn-Auslosung
  (erzwungen deterministisch), `SpawnError`-Pfad, expliziter Spawn
  mit Kriterienverstoß → `GameConfigError`.
- `src/components/menuFlow.test.ts` (5): `cadenceToEventDefaults` für
  alle drei Modi, `eventCadenceOf` inkl. Clamping.
- `src/components/SettingsScreen.test.tsx` (5): Vorschlagswerte,
  `unbegrenzt` nur auf Münster, Wertedurchgabe + Kadenz-Mapping,
  Korridorverletzung abgewiesen, Kadenz außerhalb 2–20 abgewiesen.
- `src/components/MissionSelect.test.tsx` (7): Fallliste mit Name +
  Story, kein Fall-Angebot ohne Missionsset, Fall-/Zufalls-/Ohne-
  Auswahl, Kategorie-Picks pro Schritt (nur passende Knoten
  selektierbar), Kriterienverstoß blockiert `custom-confirm`,
  Custom-Targets ohne Sabotage werden übergeben.
- `src/components/MenuScreens.test.tsx` (6): Hauptmenü-Einträge,
  Resume disabled + Hinweis, Kartenkarten aktiv/disabled, `teststadt`
  nicht im Menü, Moduswahl mit Dev-Modus, Statistik-Leerzustand und
  FIFO-Liste, Dev-Batch produziert Summary + Aufzeichnung.
- `src/App.test.tsx` (6): Hauptmenü ohne `?mode`, kompletter Fluss
  Menü → Karte → Modus → Einstellungen → Mission → Spawn-Pick
  (Ganove), Detektiv-Pfad bis `pickSpawns`, Statistik-Navigation,
  `?mode=ganove`/`?mode=detektiv` Deep-Links weiterhin direkt.
- `src/logic/Recorder.test.ts` (+1 Feld): `startOptionsFromHeader`
  reicht `eventMode`/`eventDefaults` durch.

## E2E (`e2e/menu.spec.ts` — 8 neue Szenarien, alle mit echter DOM-Interaktion)

1. Hauptmenü rendert alle drei Einträge; Resume disabled mit Hinweis;
   Titelbild lokal eingebettet (`naturalWidth > 0`).
2. Kartenwahl: Münster + Lübeck aktiviert, Hamburg + Köln disabled,
   `teststadt` nicht sichtbar.
3. Ganove-Fluss komplett: Menü → Münster → Ganove → Einstellungen →
   Zufallsmission → `pickSpawn` → `playing`; Detektiv-Marker vorhanden.
4. Detektiv-Fluss komplett: Münster → Detektiv → Fall-Karte mit Name +
   Story → 4 interaktive Detektiv-Picks → `playing`.
5. Einstellungen: `unbegrenzt` sichtbar auf Münster, fehlt auf Lübeck;
   außerhalb des Korridors → `settings-errors`, kein Weitergehen.
6. Custom-Mission: Picker rendert, nur passende Kategorien selektierbar,
   Kriterienverstoß blockiert die Bestätigung.
7. Dev-Modus: Batch 5 auf `teststadt` → `dev-summary` +
   `dev-metrics` sichtbar.
8. Statistik: leerer Zustand oder Tabelle — je nach Storage.

Bestehende E2E (`detektiv.spec.ts` 7 Tests, `ganove.spec.ts` 5 Tests)
bleiben unverändert grün — die URL-Param-Deep-Links `?mode=…` funktionieren
weiter.

## Befund-Historie (testgetrieben behoben)

- `Recorder`-Test-Update: `eventMode`/`eventDefaults` sind jetzt Teil
  der rekonstruierten `StartGameOptions`.
- `App.test.tsx` komplett neu: die vorherige Startauswahl ist durch den
  Menüfluss ersetzt.
- E2E-Fix: `[data-testid^='case-']` griff den `case-list`-Container
  — gezielte `button`-Auswahl in der Liste.
- ESLint-Reste (`de`-Import, ungenutzte Setter) bereinigt.

## Ergebnis

**Keine Fehler** — alle Pflichtbefehle grün, Abdeckung über Vorgabe,
E2E als primärer Flussnachweis komplett.
