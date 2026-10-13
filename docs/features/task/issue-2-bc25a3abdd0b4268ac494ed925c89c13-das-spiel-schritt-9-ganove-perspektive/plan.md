# Umsetzungsplan: Ganove-Perspektive (Primärmodus, Schritt 9)

## Übersicht

Der Primärmodus „Mensch als Ganove gegen KI-Detektive" wird vollständig
spielbar: geteilte SVG-Kartenkomponente `MapGraph`, Ganoven-Bildschirm
`GanoveScreen` mit Startaufstellung, Spielphase und Endzuständen, ein
store-eingebundener deterministischer KI-Detektiv-Treiber
(`detectiveDriver`), alle Texte über i18n (DE/EN paritätisch), dunkles
Krimi-Thema via CSS-Modulen. Engine (`gameStore`) bleibt unverändert
führend — die UI löst nur aus.

## Designentscheidungen

| Komponente / Bereich | Gewählter Ansatz | Begründung |
|----------------------|-----------------|------------|
| KI-Detektiv-Treiber | `useGameStore.subscribe` in `src/state/detectiveDriver.ts` (`installDetectiveDriver()`), synchroner Loop `chooseDetectiveMove` + `moveDetective` mit `aiRng(seed, round, index+1)` | „UI löst nur aus, Engine regelt": reagiert auf jede Phasen-Transition (auch store-interne), deterministisch wie `AiSimulation`, headless testbar; React-`useEffect` in `GanoveScreen` installiert/entfernt ihn nur |
| `detectiveStarts` für `buildDetectiveView` | aus Log-Header `log[type==="header"].starts.detectives` | kein neuer State nötig; bit-identisch zur Sim-Konvention |
| SVG-Karte | eine `MapGraph`-Komponente mit props-gesteuerter Sicht (Ganove-Marker/Missionsziele optional; Kameras/Hinweise gibt es als Prop gar nicht) | Asymmetrie strukturell erzwungen statt gefiltert; wiederverwendbar für Schritt 10 |
| Startaufstellung | Detektive automatisch per `pickDetectiveSpawns` (KI-wählbar), Ganove wählt auf der Karte aus `ganoveSpawnChoices` | Anforderung erlaubt beide Detektiv-Varianten; Wahl-UI für Detektive kommt mit Menü in Schritt 11 |
| Missionsoption | `mission: "random"` mit Fallback `"auto"` bei `MissionGenerationError` | „generierte Mission" gefordert; Fallback verhindert Startfehler auf Karten ohne Ziehung |
| Seed-Erzeugung | UI-seitig `Date.now()`-basiert, überschreibbar via URL `?seed=` und Prop | `Math.random`-Verbot gilt nur für `src/logic/`; URL-Param sichert deterministische E2E |
| E2E | Playwright (`@playwright/test`, Chromium bereits installiert) mit `webServer` = Vite-Dev-Server; Store unter `window.__gameStore` nur in `import.meta.env.DEV` exponiert | echte Browser-E2E für den Benutzerfluss; Dev-only-Exposure = keine Produktions-Angriffsfläche |
| Komponententests | Vitest + jsdom (per-Datei-Pragma) + Testing Library | präzise DOM-Assertions (Asymmetrie, illegale Züge), schnell, deckt Coverage |
| Remis-Abbruch | Inline-Bestätigung (Button → „Ja/Nein"), kein `window.confirm` | testbar in jsdom/Playwright, konsistenter Stil |

## Programmabläufe

### Partie-Setup (Startaufstellung)

1. `App` rendert `GanoveScreen`. Ist `map === null` und kein lokaler
   Setup-State → Startansicht mit Titel/Intro + „Neue Partie".
2. „Neue Partie" → `loadMap(mapId)` (Default `muenster` bzw. `?map=`),
   Seed (`?seed=`/Prop/`Date.now()`), `pickDetectiveSpawns(map,
   createRng(seed), suggested)` → lokaler Setup-State; Ansicht
   „Ganove-Startpunkt wählen": `MapGraph` zeigt Detektiv-Marker +
   `selectableNodeIds = ganoveSpawnChoices(map, detectivePositions)`.
3. Klick/Enter auf einen erlaubten Knoten → `startGame(map, seed,
   { detectivePositions, ganovePosition, mission: "random" })`;
   `MissionGenerationError` → Retry mit `mission: "auto"`.

Beteiligte: `GanoveScreen`, `MapGraph`, `MapLoader`, `SpawnSystem`,
`gameStore.startGame`.

### Ganove-Zug + automatische Detektivphase

1. `phase === "ganove"` → `getLegalGanoveMoves()` liefert `MoveTarget`s;
   `MapGraph` markiert genau diese Knoten als klickbar (`legalTargets`).
2. Klick/Enter → `moveGanove(nodeId)`; Store setzt `phase:
   "detektive"` (bzw. `outcome` bei Flucht).
3. `detectiveDriver`-Subscription sieht `phase === "detektive"` →
   `driveDetectivePhase()`: Schleife über `activeDetectiveIndex` mit
   `chooseDetectiveMove(buildDetectiveView(state, detectiveStarts),
   index, state.getLegalDetectiveMoves(), aiRng(seed, round, index+1))`
   + `moveDetective` bis `phase` wechselt oder `outcome` gesetzt.
4. UI rendert neue Detektivpositionen / Runde / ggf. Endzustand.

Beteiligte: `MapGraph`, `GanoveScreen`, `detectiveDriver`,
`DetectiveAI`, `AiSimulation.buildDetectiveView`/`aiRng`, `gameStore`.

### Missions-Aktionsfluss inkl. Sabotage-Binärwahl

1. `getMissionAction()` ≠ `null` (Ganove steht auf aktuellem Ziel) →
   Button „Aktion ausführen" → `ganoveAction()` (Zugzwang-Exception).
   Weiterziehen bleibt über legale Knoten möglich.
2. Nach `kontakt`-Aktion mit `targets.sabotage !== null` →
   `mission.stage === "wahl"`, `pendingChoice` gesetzt → in der
   nächsten Ganove-Phase zeigt `MissionPanel` die Binärwahl:
   „Sabotage {effekt} am {Knotenname}" vs. „Direkte Flucht {Knotenname}"
   → `chooseMissionPath("sabotage" | "flucht")` (endgültig).
3. Bei `stage === "sabotage"` ist `targets.sabotage` das aktuelle Ziel;
   dort `ganoveAction()` → `stage: "flucht"`; bei `flucht` endet
   Betreten von `escapeNodeIds` mit `escaped`.

Beteiligte: `MissionPanel`, `GanoveScreen`, `gameStore`.

### Polizeifunk + Intel-Feed

1. Button „Polizeifunk abhören" (einmalig) → `useRadio()`; danach
   `radioUsed` → Button deaktiviert.
2. Ganove-sichtbare Events (`visibleEvents(events, "ganove")`) werden
   als Intel-Feed gerendert: `umwelt` → „Kante gesperrt bis Runde n",
   `polizeifunk` → Liste der gemeldeten Hinweise (`kind`, `round`,
   `nodeId`/`zone` als Klarname). Nichts anderes existiert
   ganovenseitig — Kameras/Hinweis-Events können nicht durchsickern.

### Endzustände + Abbruch

1. `outcome !== null` → Ergebnis-Overlay mit lokalisiertem Text je
   `GameOutcome` + „Neue Partie" → `resetGame()` + Setup-State leeren.
2. Laufendes Spiel: „Als Remis beenden" → Inline-Bestätigung →
   `abortAsDraw()` → `outcome === "draw"`.

## Neue Klassen / Komponenten

| Artefakt | Typ | Zweck |
|----------|-----|-------|
| `src/components/MapGraph.tsx` | React-Komponente | SVG-Karte: Knoten (Kreis+Klarname), Kanten (`weg`/`fahrt` unterscheidbar), gesperrte Kanten (ausgegraut + Sperr-Glyphe), Detektiv-Marker (Form + Nummer), Ganove-Marker (Form), Missions-/Flucht-Marker, klickbare legale Ziele/Spawn-Knoten (Tab/Enter) |
| `src/components/MapGraph.module.css` | CSS-Modul | Kartenstil, dunkles Thema |
| `src/components/HeatBadge.tsx` | React-Komponente | Hitze-Badge: SVG-Icon + Textstufe (4 Stufen, nicht nur Farbe) |
| `src/components/HeatBadge.module.css` | CSS-Modul | Badge-Stil |
| `src/components/MissionPanel.tsx` | React-Komponente | Schrittfolge mit Status, aktuelles Ziel (Klarname), Sabotage-Binärwahl |
| `src/components/MissionPanel.module.css` | CSS-Modul | Panel-Stil |
| `src/components/GanoveScreen.tsx` | React-Komponente | Orchestriert idle → pickSpawn → playing → outcome; Statusbar, Intel-Feed, Funk-/Abbruch-Buttons |
| `src/components/GanoveScreen.module.css` | CSS-Modul | Layout, dunkles Krimi-Thema |
| `src/state/detectiveDriver.ts` | Modul | `detectiveStartsFromLog`, `driveDetectivePhase`, `installDetectiveDriver` |
| `playwright.config.ts` | Konfiguration | Chromium-Projekt, `webServer` auf `vite dev` |
| `e2e/ganove.spec.ts` | E2E-Tests | kompletter Benutzerfluss |
| `src/test/setup.ts` | Test-Setup | jest-dom-Matcher, `IS_REACT_ACT_ENVIRONMENT`, Store-Reset pro Test |

## Änderungen an bestehenden Klassen/Dateien

### `src/App.tsx` / `src/App.module.css`

- Rendert `GanoveScreen` statt `PlaceholderPanel`; Shell-Styling
  (dunkler Hintergrund).

### `src/main.tsx`

- DEV-only: `window.__gameStore = useGameStore` (E2E-Instrumentierung,
  `import.meta.env.DEV`).

### `src/logic/AiSimulation.ts`

- `aiRng` wird exportiert (bisher privat) — einzige Änderung.

### `src/i18n/de.json` / `src/i18n/en.json`

- Neue Schlüssel: `game.new`, `game.round`, `game.roundLimit`,
  `game.phase.ganove`, `game.phase.detektive`, `game.setup.title`,
  `game.setup.intro`, `game.setup.pickSpawn`,
  `heat.label`, `heat.ruhig`, `heat.aktiv`, `heat.erhoeht`,
  `heat.kritisch`, `mission.title`, `mission.step.diebstahl`,
  `mission.step.kontakt`, `mission.step.sabotage`, `mission.step.flucht`,
  `mission.currentTarget`, `mission.none`, `mission.action.execute`,
  `mission.action.diebstahl`, `mission.action.kontakt`,
  `mission.action.sabotage`, `mission.choice.title`,
  `mission.choice.sabotage`, `mission.choice.flucht`,
  `mission.choice.final`, `effect.kamera_aus`, `effect.funkstille`,
  `effect.falsche_spur`, `radio.button`, `radio.used`,
  `radio.empty`, `intel.title`, `intel.umwelt`, `intel.empty`,
  `hint.kind.camera`, `hint.kind.sichtbarkeit`, `hint.kind.hinweis`,
  `hint.kind.aktion`, `outcome.title`, `outcome.caught`,
  `outcome.surrounded`, `outcome.escaped`, `outcome.timeout`,
  `outcome.draw`, `abort.button`, `abort.confirm`, `abort.yes`,
  `abort.no`, `map.ariaLabel`, `node.moveTo`, `node.spawnHere`,
  `marker.ganove`, `marker.detective`, `marker.escape`.

### `src/App.test.tsx`

- Ersetzt `renderToString`-Assertions auf Platzhalter durch
  Shell-/Startansicht-Assertions (jsdom oder SSR-tauglich).

### `vite.config.ts`

- `test.exclude` um `e2e/**` erweitern (Playwright-Specs nicht unter
  Vitest), `setupFiles: ["src/test/setup.ts"]`.

### `tsconfig.json`

- `include` um `"e2e"`, `"playwright.config.ts"` erweitern.

### `package.json`

- Script `"test:e2e": "playwright test"`; devDependencies bereits
  installiert (`@playwright/test`, `@testing-library/react`,
  `-user-event`, `-dom`, `jsdom`, `@testing-library/jest-dom` [neu]).

### `.gitignore`

- `playwright-report/` ergänzen (`test-results/` ist bereits drin).

## Datenbankmigrationen

Keine.

## Validierungsregeln

| Feld / Objekt | Regel | Fehlerfall |
|---------------|-------|------------|
| `MapGraph`-Interaktion | nur `legalTargets`/`selectableNodeIds` sind klick-/fokussierbar | illegale Ziele nicht angeboten (Engine validiert zusätzlich) |
| Ganove-Spawn | nur `ganoveSpawnChoices` wählbar | `SpawnError` durch `startGame` (defensiv) |
| Funk-Button | `radioUsed` → deaktiviert | `MoveError already_used` (defensiv) |
| `onNodeSelect` | `moveGanove`/`startGame` in try/catch | Fehler als Statusmeldung, kein Crash |

## Seiteneffekte und Risiken

- **`App.test.tsx`:** muss angepasst werden (Shell ändert sich).
- **`aiRng`-Export:** keine Verhaltensänderung.
- **Driver-Synchronität:** Detektivphase läuft synchron im
  Subscription-Callback — Reentrancy-Guard (`driving`-Flag) nötig;
  lange Karten bleiben performant (<1 ms pro Zug).
- **StrictMode-Doppelmount:** `installDetectiveDriver` über
  `useEffect`-Cleanup sicher.
- **jsdom-Tests:** Store ist global — Setup-Datei setzt `resetGame()`
  pro Test (isolation).
- **Prettier-Hook:** `npm run format` vor Commit.

## Umsetzungsreihenfolge

1. **Testinfrastruktur** — Voraussetzungen: devDeps installiert.
   `@testing-library/jest-dom` installieren; `src/test/setup.ts`,
   `vite.config.ts` (`setupFiles`, `exclude e2e`), `tsconfig.include`,
   `playwright.config.ts`, `.gitignore`, `package.json`-Script.
2. **`aiRng` exportieren + `detectiveDriver.ts`** — Voraussetzungen:
   keine. Tests: Driver-Einheitstests (headless).
3. **i18n-Schlüssel** — `de.json`/`en.json` paritätisch.
4. **`MapGraph`** — Voraussetzungen: i18n. Komponente + CSS + Test.
5. **`HeatBadge`, `MissionPanel`** — Voraussetzungen: i18n.
6. **`GanoveScreen` + `App`-Umbau** — Voraussetzungen: 2–5, Treiber.
7. **Komponenten-/Flusstests** (jsdom) — Voraussetzungen: 1–6.
8. **Playwright-E2E** — Voraussetzungen: 1, 6, `window.__gameStore`.
9. **Qualitätsläufe** — `build`, `test`, `coverage` (≥70 %), `lint`,
   `test:e2e`, `format`.

## Tests

### Neue Tests

| Test | Testdatei | Was wird geprüft |
|------|-----------|-------------------|
| `detectiveDriver.test.ts` | `src/state/` | `driveDetectivePhase` zieht alle Detektive deterministisch (gleiche Seeds → gleiche Züge), `installDetectiveDriver` reagiert auf Phasenwechsel, Reentrancy-Guard, `detectiveStartsFromLog` aus Header |
| `MapGraph.test.tsx` | `src/components/` | rendert alle Knoten/Kanten, `fahrt`-Markierung, gesperrte Kanten geformtkodiert, legale Ziele klickbar + Tastatur (Enter), illegale nicht klickbar, Detektiv-/Ganove-Marker, keinerlei Kamera-Elemente |
| `HeatBadge.test.tsx` | `src/components/` | 4 Stufen je mit Icon + Text, nicht nur Farbe |
| `MissionPanel.test.tsx` | `src/components/` | Schrittfolge/Status, aktuelles Ziel, Binärwahl rendert beide Optionen + Callback |
| `GanoveScreen.test.tsx` | `src/components/` | Flüsse: Neue Partie → Spawn-Wahl (nur legale) → Spielzug (KI läuft durch, Positionen ändern sich) → Aktion am Ziel → Sabotage-Wahl → Flucht → `escaped`; Funk einmalig; Abbruch → `draw`; Asymmetrie-Assertion auf gerendertem DOM (keine Kamera-/Hinweis-Elemente) |
| `App.test.tsx` (angepasst) | `src/` | Shell + Startansicht |

### Betroffene bestehende Tests

| Test / Testklasse | Grund |
|-------------------|-------|
| `src/App.test.tsx` | Shell zeigt `GanoveScreen` statt Platzhalter |

### E2E-Tests (primärer Funktionsnachweis)

Playwright, `e2e/ganove.spec.ts`, Dev-Server als `webServer`,
deterministisch via `?map=…&seed=…`; Treiber läuft synchron —
Erwartungen ohne Timing-Races; Store-Introspektion via
`page.evaluate` auf `window.__gameStore` (nur für Wegfindung per
BFS auf `map.edges`/`blockedEdges`/Positionen — alle Aktionen
erfolgen über echte DOM-Klicks auf `data-node-id`-Elemente/Buttons).

| Priorität | Szenario | Testdatei | Abgedecktes Akzeptanzkriterium | Warum E2E nötig |
|-----------|----------|-----------|-------------------------------|------------------|
| Pflicht | Neue Partie → Spawn-Auswahl → erster Zug → automatische Detektivphase | `e2e/ganove.spec.ts` | Partie von Startaufstellung spielbar; legale Züge angeboten | kompletter Benutzerfluss im echten Browser |
| Pflicht | Volle Partie bis Endzustand (adaptive Missionsverfolgung inkl. Aktionen und ggf. Sabotage-Wahl) | `e2e/ganove.spec.ts` | jeder Endzustand erreichbar; Aktionsfluss regelkonform | Nachweis Durchspielbarkeit |
| Pflicht | Asymmetrie: kein Kamera-Icon/keine Hinweis-Elemente im gerenderten DOM | `e2e/ganove.spec.ts` | keine Kameras/Hinweise/Ereignisse | DOM-Nachweis im echten Browser |
| Pflicht | Polizeifunk einmalig + Abbruch-als-Remis | `e2e/ganove.spec.ts` | Funk-Button, Remis-Option | sichtbarer Benutzerfluss |
| Pflicht | Tastatur: Knoten per Tab+Enter wählbar | `e2e/ganove.spec.ts` | Bedienbarkeit Kerninteraktion | A11y-Forderung |

Bestehende E2E-Tests: keine vorhanden — keine Anpassung nötig.

## Offene Punkte

Keine.
