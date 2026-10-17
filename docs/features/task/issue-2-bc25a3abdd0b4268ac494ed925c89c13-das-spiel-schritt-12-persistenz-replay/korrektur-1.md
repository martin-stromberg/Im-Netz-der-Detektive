# Korrektur 1 — Replay persistiert keine Duplikate mehr

**Quelle:** `docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/acceptance-schritt-12.md`
(einzige Abweichung)

## Befund

`finish()` (`src/state/gameStore.ts`) rief `saveGameLog(get().log)`
bedingungslos auf. `replayTo` (`src/logic/ReplayPlayer.ts`) treibt den
echten `useGameStore` — beim Abspielen bis zum Ende landete das
bit-identische Log erneut in der `game-logs`-FIFO. Folge: Statistik
zählte replays doppelt, wiederholtes Abspielen verdrängte andere Logs.

## Korrektur

- `StartGameOptions.autoPersist?: boolean` (Default `true`) —
  interner Persist-Schalter, landet nicht in der Header-`config`
  (replaytes Log bleibt bit-identisch).
- `gameStore.ts`: Store-internes Flag `persistFinishedLog`. `finish()`
  schreibt nur bei `true`; `startGame` setzt es aus der Option,
  `resetGame`/`resumeGame` stellen den Normalzustand (`true`) wieder
  her — kein Leck-Zustand über den Replay-Kontext hinaus.
- `ReplayPlayer.ts`: `replayTo` startet mit
  `{ ...source.start.options, autoPersist: false }`.
- Prüfung weiterer Schreibpfade: `saveGameLog` wird ausschließlich in
  `finish()` aufgerufen; der Resume-Pfad schreibt nur unter
  `RESUME_STORAGE_KEY` und nur auf explizites „Partie speichern".
- Nebenbei: veralteter Kommentar in `MainMenu.tsx` (Resume-Einträge
  werden inzwischen geschrieben) korrigiert; `docs/help/spiel-engine/
  api.md` um den `autoPersist`-Schalter ergänzt.

## Tests

- `ReplayPlayer.test.ts` — „log persistence during replay": Abspielen
  eines vorgehaltenen Logs bis zum Ende (2×) lässt die FIFO unverändert
  (`listGameLogs` bit-identisch); eine danach gestartete Live-Partie
  persistiert wieder normal (Flag-Reset belegt).
- `gameStore.log.test.ts` — „autoPersist: false suppresses the
  finished-log write (replay path)": Option wirkt direkt, nächste
  reguläre Partie persistiert wieder.
- `e2e/persistenz.spec.ts` — Replay bis zum Outcome ändert die
  `game-logs`-Anzahl und die Statistik-Tabellenzeilen nicht.

## Verifikation

`npm test`, `npm run coverage`, `npm run lint`, `npm run format:check`,
`npm run build`, `npm run test:e2e` — alle grün.
