# Datenmodell / State — Bestand

## `GameState` / `useGameStore`

Datei: `src/state/gameStore.ts`

Zustand-Store (`create<GameState>`), kommentiert als bewusst
headless-fähig (keine React-Abhängigkeit jenseits des Hook-Bindings).

| Element | Typ | Beschreibung |
|---------|-----|--------------|
| `round` | `number` | Aktuelle Runde; Start bei 1 |
| `advanceRound()` | Action | Erhöht `round` über `advanceRound()` aus `src/logic/placeholder.ts` |

Verwendet von: `src/App.tsx` (liest `round`),
`src/state/gameStore.test.ts` (Headless-Treiben über
`getState()`/`setState()`).

## Übrige Datenartefakte

| Artefakt | Ort | Bestand |
|----------|-----|---------|
| Kartenpakete | `src/data/maps/` | Leer, nur `.gitkeep` |
| i18n-Schlüssel | `src/i18n/de.json`, `src/i18n/en.json` | `app.title`, `app.subtitle`, `app.round`, `app.placeholder` — paritätisch |
