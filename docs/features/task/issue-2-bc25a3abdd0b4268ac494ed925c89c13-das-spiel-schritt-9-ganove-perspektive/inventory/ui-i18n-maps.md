# UI-Bestand, i18n und Kartenpakete

## UI-Bestand

- `src/App.tsx` — Shell: `<main>` mit Titel/Untertitel/Runde +
  `PlaceholderPanel`. Test `src/App.test.tsx` nutzt
  `renderToString` (SSR-string, kein DOM).
- `src/components/PlaceholderPanel.tsx` (+ `.module.css`) — einzige
  vorhandene Komponente; ersetzungskandidat.
- `src/main.tsx` — `createRoot` + `StrictMode`, Element `#root` in
  `index.html`.
- `src/App.module.css`, `src/components/PlaceholderPanel.module.css` —
  CSS-Module-Konvention: co-located, `styles.<klasse>`.
- Kein vorhandenes Auswahl-/Lookup-UI-Muster — die Anforderung braucht
  Auswahl von Kartensknoten (Klick/Tastatur auf SVG-Knoten); dafür gibt
  es keinen Bestand, `MapGraph` wird neu gebaut.

## i18n

- `src/i18n/index.ts` — `t(key, params?)`, `TranslationKey = keyof
  typeof de`; immer DE-Katalog (`de.json`) als Quelle.
- `de.json`/`en.json` — aktuell nur `app.title`, `app.subtitle`,
  `app.round`, `app.placeholder`.
- `.githooks/i18n-check.py` — jeder `t("…")`-Schlüssel muss in allen
  Katalogen existieren (Parität DE/EN); ungenutzte Schlüssel sind
  erlaubt.

## Kartenpakete

- `muenster.json` — 59 Knoten, 101 Kanten, `viewBox "0 0 1000 800"`;
  Kategorien: diebstahl 17, kontakt 32, flucht 7, sabotage 6;
  `spawnRules.detectives.mode = "choice"` (5 Knoten),
  `spawnRules.ganove.mode = "free"`, `minDistanceToDetective: 3`.
- `luebeck.json` — 22 Knoten, 39 Kanten (Validierungskarte).
- `teststadt.json` — 10 Knoten, 13 Kanten, `viewBox "0 0 100 100"`,
  Detektiv-`choice` auf `a`/`i`/`j` (3 Kandidaten — `detectiveCount`
  max. 3 sinnvoll), keine `sabotage`-Kategorie (d. h. generierte
  Missionen haben `sabotage: null` → kein `pendingChoice`).
- `src/data/missions/muenster.json` — 2 benannte Fälle (nur für
  `mission: {type:"case"}`).

## Styling-Konventionen / Qualitäts-Hooks

- CSS-Module, dunkles Thema ist neu anzulegen (kein Bestand).
- pre-commit: `i18n-check.py`, `map-schema-check.py`,
  `no-math-random-check.py` (nur `src/logic/`), `no-stub-check.py`
  (Warnung), `component-usage-check.py` (Warnung: verwaiste `.tsx`),
  Prettier-Check gestagte Dateien.
- ESLint: `eslint.config.js` (typescript-eslint + react-hooks +
  react-refresh + prettier-config).
