# Logik — Bestand

## `advanceRound`

Datei: `src/logic/placeholder.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `advanceRound(round: number): number` | export | Platzhalter-Logik: gibt `round + 1` zurück; explizit als Gerüst markiert, das in späteren Schritten ersetzt wird |

Wird aufgerufen von: `useGameStore.advanceRound` (`src/state/gameStore.ts`).
Getestet von: `src/logic/placeholder.test.ts`.

## `t` (i18n-Helper)

Datei: `src/i18n/index.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `t(key: TranslationKey, params?): string` | export | Liefert de-Text zu Schlüssel, ersetzt `{name}`-Platzhalter aus `params` |

## Verzeichnisstruktur `src/`

- `src/components/` — `PlaceholderPanel.tsx` (+ CSS-Modul), rendert
  `t("app.placeholder")`.
- `src/logic/` — nur `placeholder.ts` + Test; alle Engine-Module aus
  spec §5 fehlen noch.
- `src/state/` — `gameStore.ts` + Test.
- `src/data/maps/` — leer (`.gitkeep`).
- `src/App.tsx`, `src/main.tsx`, `src/App.test.tsx`.

## Spezifikations-Referenz

`docs/konzept/content/02-technisches-konzept.md` §5 nennt die
Modul-Verantwortlichkeiten; für diesen Schritt relevant:

| Modul | Verantwortung laut Spec | Bestand |
|-------|--------------------------|---------|
| `MapLoader.ts` | `loadMap(id)`, Validierung gegen MapPack-Typ | fehlt |
| `rng.ts` | einzige Zufallsquelle, Seeded-RNG (z. B. mulberry32) | fehlt |
| `SpawnSystem.ts` | choice/free/random + Mindestabstand | fehlt |
| `GameState` | Felder §3, imperative Actions, headless | teilweise (`round`) |
| Graph-Hilfsfunktionen | Nachbarschaften, BFS-Distanzen (im spec §2-Verzeichnis nicht separat gelistet; von Movement/MissionEngine/Deduction konsumiert) | fehlt |
