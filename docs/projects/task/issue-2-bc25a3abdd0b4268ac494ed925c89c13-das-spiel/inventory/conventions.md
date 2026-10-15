# Detail: Tests, Checks & Design-Einschränkungen

## Test-Infrastruktur

### Unit/Integration — Vitest

- `vite.config.ts`: `setupFiles: ["src/test/setup.ts"]`, Coverage
  `provider: v8`, `include: src/**/*.{ts,tsx}`, **Threshold
  `lines: 70`** — der Threshold muss nach Redesign weiterhin halten.
- DOM-Tests: Pragma `// @vitest-environment jsdom` in der ersten
  Zeile der Testdatei (Konvention — kein globales `environment`).
- `@testing-library/react` + `jest-dom`; `fireEvent`/`userEvent`.
- `src/test/setup.ts`: `IS_REACT_ACT_ENVIRONMENT`, `cleanup()`,
  `useGameStore.resetGame()`, `useUiPrefs`-Reset + localStorage-Eintrag
  löschen — neue globale Zustände ggf. hier zurücksetzen.
- Co-located Tests: `*.test.ts(x)` neben der Quelldatei
  (~50 Testdateien unter `src/`).

### E2E — Playwright (`e2e/`)

- Specs: `ganove.spec.ts`, `detektiv.spec.ts`, `menu.spec.ts`,
  `i18n-a11y.spec.ts`, `persistenz.spec.ts`.
- `playwright.config.ts`: nur Chromium, `baseURL localhost:5173`,
  Dev-Server wird automatisch gestartet (`npm run dev -- --port 5173`),
  `trace: retain-on-failure`.
- Determinismus über URL-Parameter `?map=`, `?seed=`, `?mission=`,
  `?autoDetectives` (siehe `gameSetup.readParams`/`GanoveScreen`-
  Kommentar).
- `window.__gameStore` (nur in DEV-Builds exponiert, `main.tsx`) wird
  nur zum **Lesen** des Zustands (Routenplanung) genutzt; alle Aktionen
  laufen über echte DOM-Interaktion.
- `i18n-a11y.spec.ts` prüft u. a. Sprachumschaltung und Tastatur-
  Navigation (`data-node-id`-Fokus) — direkter A11y-Vertrag.

## Selektor-Vertrag (muss beim Redesign erhalten bleiben)

Struktur-Attribute, auf die Tests/E2E matchen (Auswahl):

- Layer/Map: `data-testid="map-graph"`, `data-layer` (board/edges/
  landmarks/nodes/markers), `data-edge`, `data-edge-type`,
  `data-blocked`, `data-block-glyph`, `data-board-style`,
  `data-landmark`
- Knoten: `data-node-id`, `data-legal-target`, `data-selectable`,
  `data-markable`, `data-possible`, `data-zone`, `data-category`,
  `data-mission-target`, `data-escape-node`, `data-camera`,
  `data-camera-active`, `data-marker`
- Figuren: `data-detective`, `data-active-detective`, `data-ganove`
- Screens/Panels: `data-testid` (z. B. `ganove-screen`,
  `detektiv-screen`, `main-menu`, `map-card-<id>`, `outcome-panel`,
  `event-banner-stack`, `mission-current-target`, `round-indicator`,
  `phase-indicator`, `map-legend`, `abort-confirm`, …),
  `data-view`, `data-outcome`, `data-pursuit`, `data-pursuit-level`,
  `data-heat-level`, `data-mission-step`, `data-step-status`,
  `data-choice`, `data-hint-event`, `data-marker-item`,
  `data-radio-report`

Regel: Neue visuelle Elemente dürfen diese Attribute nicht verlieren;
reine Deko-Elemente bitte ohne kollidierende Selektoren ergänzen.

## Git-Hooks (`.githooks/`, Python 3)

Installation: `.githooks/install-hooks.sh` / `.cmd`.

| Check | Modus | Blockierend? | Für Design-Code relevant |
|-------|-------|--------------|--------------------------|
| `i18n-check.py` | staged / `--all` | ja | Jeder `t("key")` muss in `de.json` **und** `en.json` existieren; Kataloge müssen paritätisch sein |
| `no-hardcoded-strings-check.py` | staged / `--all` | ja | Kein JSX-Text mit Buchstaben, keine String-Literale in `aria-label`, `aria-description`, `placeholder`, `alt`, `title`. Reine Symbol-Glyphen (`×`, `—`, `◀`, `✓` o. ä.) erlaubt; Escape-Hatch: Zeile mit `i18n-allow`-Kommentar |
| `map-schema-check.py` | staged / `--all` | ja | Kartenpakete validieren (u. a. `board.features`, `landmark`-IDs) |
| `no-math-random-check.py` | staged / `--all` | ja | `Math.random()` verboten — `createRng(seed)` nutzen |
| `no-stub-check.py` | staged (Warnung) / `--all --strict` (pre-push) | pre-push | Keine „not implemented"-Throws, keine TODO-only-Bodies |
| `component-usage-check.py` | staged (Warnung) / `--all --strict` (pre-push) | pre-push | PascalCase-`.tsx`-Komponenten müssen referenziert werden (keine Waisen) |
| Prettier | staged Dateien | ja | `npm run format` |

Branch-Schutz: direkte Commits/Pushes auf `main`/`staging` blockiert.

## Verhaltens-Contracts für das Redesign

1. **Keine Info-Leaks:** `MapGraph` besitzt bewusst keine Props für
   gegnerische Informationen (Kameras → Detektiv, Ganove-Position/
   Missionsziele/Fluchtpunkte → Ganove). Neue Deko darf keine
   verdeckten Zustände rendern; `visibleEvents`/`visibleCameras`
   bleiben der Datenfilter.
2. **Farbe nie alleiniges Merkmal:** Bestehende Praxis — jede
   Statusunterscheidung trägt Form/Icon/Label/Muster (Kanten-Muster,
   Blockade-Kreuz, Badge-Formen, Kamera-Strike, Balken-Icon,
   Durchstreichung). Neue Tokens/Figuren **zusätzlich** über
   Form/Symbol/Label differenzieren (Akzeptanzkriterium 4).
3. **Interaktionsflächen nicht verkleinern:** unsichtbare `.hitArea`
   (r=14) muss größer bleiben als die sichtbare Token-Geometrie;
   `pointer-events`-Konvention (nur Hit-Area fängt Zeiger) beibehalten
   — Deko nie klickbar machen.
4. **Tastatur:** `role="button"`, `tabIndex`, `aria-label` und das
   Pfeiltasten-Roaming (`nodeRefs`, `nextInteractiveNode`) erhalten;
   `:focus-visible`-Styling (amber Outline/Ring) auf neuen Elementen.
5. **Reduced Motion:** `@media (prefers-reduced-motion: reduce)` für
   jede neue Animation/Transition (Muster in MapGraph-, GanoveScreen-,
   EventBanner-Modulen).
6. **i18n:** jeder neue sichtbare Text über `t()` in beiden Katalogen
   (`src/i18n/de.json`, `en.json`); reine Deko `aria-hidden`.
7. **Assets lokal:** Fonts/Texturen unter `src/assets/` (Vite-Build-
   Einbindung), Lizenz + Herkunft in `src/assets/ASSETS.md`; kein
   CDN/Hotlink (Akzeptanzkriterium 7; `dist` darf keine externen
   Referenzen enthalten).
8. **Keine Regel-/Logik-Änderungen:** Redesign beschränkt sich auf
   Darstellung; `logic/`/`state/` bleiben unverändert (Nicht-Ziele).
9. **Performance/Stack:** keine neuen Laufzeit-Dependencies;
   React 18 + Zustand + Vite bleibt; keine Router-/Stack-Umstellung.
10. **Kontrast:** dokumentierte WCAG-AA-Paare im Header von
    `GanoveScreen.module.css` (≥ 4,5:1) — neue Text-/Panel-Paare auf
    diesem Niveau halten und ggf. die Kommentar-Tabelle ergänzen.
