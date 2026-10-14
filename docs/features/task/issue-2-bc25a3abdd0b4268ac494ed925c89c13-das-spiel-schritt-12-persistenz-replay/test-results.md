# Testergebnisse — Schritt 12: Persistenz, Replay & Statistiken

Ausführung am 2026-10-14 auf dem Feature-Branch
`task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel-schritt-12-persistenz-replay`.

## Befehle

| Befehl | Ergebnis |
|---|---|
| `npm run build` (`tsc --noEmit && vite build`) | ✅ grün (0 Fehler, `✓ built in ~117 ms`) |
| `npm test` (`vitest run`) | ✅ **45 Dateien / 539 Tests, alle grün** |
| `npm run coverage` (`vitest run --coverage`) | ✅ **Statements 91,3 % · Branches 83,5 % · Funktionen 94,1 % · Lines 90,8 %** — ≥ 70 %-Vorgabe erfüllt |
| `npm run lint` (`eslint .`) | ✅ 0 Befunde (nach `chronicle.ts`-Extraktion; vorher 1 react-refresh-Warnung, behoben) |
| `npm run typecheck` (`tsc --noEmit`) | ✅ 0 Fehler |
| `npm run format:check` (`prettier --check .`) | ✅ sauber (nach `prettier --write` auf den neuen Dateien) |
| `npm run test:e2e` (`playwright test`) | ✅ **26/26 Tests grün** (21 Bestand + 5 neu, ~14 s) |

## Neue Unit-/Komponententests (494 → 539, +45)

- `src/logic/SaveGame.test.ts` (13): Snapshot-Feldabdeckung ohne
  `map`/`log`, JSON-Deep-Copy (kein Aliasing), `buildResumeEntry`
  (Schema/gameId/options/Log; `null` ohne laufende Partie und nach
  `outcome`), `isValidResumeEntry` (Fremd-Schema, fehlende/kaputte
  Snapshots, malformed Felder), **kompletter `GameData`-Roundtrip**
  (Speichern → Weiterspielen → `resetGame` → `resumeGame` →
  `toEqual` + Log-Bitgleichheit), `radioUsed` bleibt verbraucht
  (`useRadio` wirft erneut), Sabotage-Fenster + deaktivierte Kameras
  + `blockedEdges` überleben den Snapshot, Fortsetzen mitten in der
  Detektivphase mit `activeDetectiveIndex`.
- `src/logic/ReplayPlayer.test.ts` (9): `isReplayAction`-Trennung
  (Aktor- vs. Engine-Einträge, `sabotage_offer` nur mit `chosen`),
  `openReplay` (Header-Rekonstruktion, `ReplayError` ohne Header),
  **Determinismus** (jeder Schrittzustand == beobachteter
  Originalzustand aus dem aufgezeichneten KI-Lauf; Log nach
  Vollabspiel bitgleich), Schritt zurück → vor identisch, Clamping,
  Detektiv-Filter ohne `ganove`-/`polizeifunk`-Einträge,
  `playerMode`-Log bleibt bitgleich (Review-Nachzug C1).
- `src/logic/Statistics.test.ts` (6): `logStats` aus header+result,
  `null` bei unfertig/beschädigt/header-los, `unbekannt` bei
  fehlendem/fremdem `playerMode`, exakte Aggregate über Fixtures
  (Siegquoten ⅓/⅓, Ø 7,0 Runden / 2,0 Hinweise / 0,7 Kameras über
  3 Partien), Aufschlüsselung je Modus, `null`-Werte leerer Gruppen.
- `src/logic/GameIndex.test.ts` (+5): Schema-/Snapshot-Filter beim
  Listen, Upsert pro `gameId` (neueste zuerst, Stand ersetzt),
  `MAX_RESUME_ENTRIES`-FIFO, Einzel-Löschen + `clearResumeEntries`,
  **Fremd-Schema-Erhalt beim Schreiben** (Review-Nachzug C2),
  stille Degradation ohne Storage / bei Schreibfehler.
- `src/logic/Recorder.test.ts` (erweitert): `getGameLog`/
  `deleteGameLog` positionsbasiert, No-op außerhalb des Bereichs,
  Listenstabilität.
- `src/state/gameStore.log.test.ts` (+1): `config.playerMode` im
  Header nur bei gesetztem Wert + Roundtrip über
  `startOptionsFromHeader` (Review-Nachzug C4).
- `src/components/ResumeScreen.test.tsx` (3): Klartext-Liste,
  `onResume` bei Auswahl, Löschen aktualisiert.
- `src/components/ReplayScreen.test.tsx` (4): Startzustand +
  Schritt vor/zurück, Ganove-Marker nur in der Ganove-Sicht,
  Auto-Play bis Outcome, Reset bei Verlassen + Fehleranzeige bei
  kaputtem Log.
- `src/components/MenuScreens.test.tsx` (angepasst): aktiver
  Resume-Button navigiert; Stats-Aggregate und Löschaktionen.

## Neue E2E-Tests (`e2e/persistenz.spec.ts`, 5 Szenarien)

| Szenario | Nachweis |
|---|---|
| Ganove speichern → Reload → fortsetzen | `__gameStore`-Vergleich (Runde, Phase, Positionen, `radioUsed`, `activeDetectiveIndex`, `outcome`) identisch; `data-view="playing"` |
| Detektiv speichern → fortsetzen | Resume landet im `detektiv-screen` mit identischer Trupp-/Zuglage |
| Statistik + Verwaltung | `stats-total` zeigt Zeilenzahl; Einzel-Löschen −1; „Alle löschen" nach Rückfrage leert die Liste |
| Log-Export | `download`-Event, Dateiname `im-netz-der-detektive-*.jsonl` |
| Replay-Timeline + Perspektiven | „Startaufstellung" → „Zug 1" → zurück identisch; `[data-ganove]` in der Detektiv-Sicht stets 0, in der Ganove-Sicht 1; Auto-Play bis `replay-outcome` |

## Regressionen

Keine — die 21 Bestand-E2E-Tests laufen unverändert grün
(`menu.spec.ts` prüft weiterhin den deaktivierten Resume-Button im
leeren Zustand); die 494 Bestand-Unit-Tests sind unverändert grün.
