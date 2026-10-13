# Code-Review — Schritt 10: Detektiv-Perspektive

Review der Änderungen gegen die Anforderung (Informationsasymmetrie,
Determinismus, Engine-Reuse, Testbarkeit, Regelkonformität).

## Geprüfte Dateien

- `src/components/DetektivScreen.tsx` (+ `.module.css`, `.test.tsx`) — neu
- `src/state/ganoveDriver.ts` (+ `.test.ts`) — neu
- `src/components/MapGraph.tsx` (+ `.module.css`, `.test.tsx`) — erweitert
- `src/components/gameSetup.ts` — neu (Extraktion aus `GanoveScreen`)
- `src/components/GanoveScreen.tsx` — nur Import-Umstellung
- `src/App.tsx` (+ `.module.css`, `.test.tsx`) — Moduswahl
- `src/i18n/de.json`/`en.json` — paritätisch erweitert
- `e2e/detektiv.spec.ts`, `e2e/ganove.spec.ts`

## Befunde und Auflösung

| # | Befund | Status |
|---|---|---|
| C1 | `useGameStore((s) => s.getMissionStructure())` erzeugt pro Render ein neues Array → zustand-Selector-Schleife (`Maximum update depth exceeded`) | **behoben** — Selektion auf stabile `mission`-Referenz, `missionStructure(mission)` im Render abgeleitet; Test liefert grün |
| C2 | Dekorative SVG-Elemente (Zonen-Halo, Badges, Ringe) fingen Pointer-Events ab und vergrößerten die Knoten-Bounding-Box → Playwright-Actionability und potenzielle Fehlklicks auf dichten Karten | **behoben** — `pointer-events: none` auf allen Deko-Elementen; nur `hitArea` empfängt Klicks |
| C3 | Chronik/Werkzeug-Panels verschwanden bei `outcome !== null` | **behoben** — Panels rendern unabhängig vom Endzustand; nur zuggebundene Bedienelemente sind konditioniert |
| C4 | `mission=none` auf kleiner Karte: KI-Ganove flieht in Runde 1 — E2E-Fluss nicht belastbar | **behoben** — Spec nutzt `mission=random` (deterministischer Langlauf bis `timeout`) |
| C5 | `import.meta.glob` im `MapLoader` läuft nicht im Playwright-Node-Kontext; `node:fs` fehlt im TS-Projekt | **behoben** — Spec importiert `teststadt.json` direkt (`with { type: "json" }`) + `validateMapPack` |
| C6 | `act()`-Warnungen durch `resetGame()` im `afterEach` auf gemounteter Komponente | **behoben** — `act(() => resetGame())` |

## Explizite Prüfpunkte

- **Asymmetrie:** `DetektivScreen` empfängt nirgends `ganovePosition`
  oder `mission.targets`; die Karte bekommt nur
  `visibleCameras(...,"detectives")`, die Chronik nur
  `visibleEvents(...,"detectives")`, die Struktur nur
  `missionStructure(mission)` (enthält per Konstruktion keine IDs).
  `data-ganove`/`data-mission-target` treten in dieser Ansicht im DOM
  nicht auf — Unit- und E2E-verifiziert. ✅
- **Determinismus:** `ganoveDriver` nutzt ausschließlich
  `aiRng(seed, round, 0)` wie `AiSimulation`; kein `Math.random` unter
  `src/logic` (grep-geprüft). ✅
- **Engine-Reuse:** keine Neuimplementierung von Regeln — Bewegung,
  Deduktion, Sichtbarkeit, Missionsstruktur und KI-Entscheidungen
  kommen aus den Bestandsmodulen; `gameSetup.ts` eliminiert die
  Duplikation der Setup-Helfer. ✅
- **Reentrancy/Tear-Down:** `installGanoveDriver` hat denselben
  `driving`-Guard und dieselbe Unsubscribe-Semantik wie
  `detectiveDriver`; der `useEffect`-Return räumt sauber auf. ✅
- **i18n-Parität:** 113/113 Keys, keine Differenz (maschinell). ✅
- **A11y:** `role="button"`+`tabIndex`+Key-Handler nur auf
  interaktiven Knoten; `aria-label` unterscheidet Zug/Spawn/Marker;
  `aria-pressed` auf dem Marker-Toggle. ✅

## Restrisiken / bewusste Entscheidungen

- Der Overlay-Aufruf `deducePossiblePositions` läuft pro Render der
  Spielansicht — auf echten Karten (≤ 59 Knoten) unproblematisch;
  ein `useMemo` wäre eine spätere Optimierung, keine Korrektheitsfrage.
- E2E-Knotenklicks nutzen `dispatchEvent("click")` auf der
  Knoten-Gruppe (Hit-Test auf dichten SVG-Karten ist physikalisch
  mehrdeutig) — dokumentiert in der Spec; echte Nutzerklicks treffen
  die `hitArea`.
- `gameSetup.ts`-Fallback-Pfade (`resolveMissionOption` invalide
  Eingaben) haben reduzierte Einzelabdeckung (~33 % Modul), die
  Gesamtabdeckung liegt bei 92,7 % ≥ 70 %.

## Ergebnis

**Bestanden** — alle Befunde aufgelöst; die Anforderungen
(Asymmetrie, deterministische KI-Phase, Werkzeuge, Endzustände,
i18n, Barrierefreiheit) sind erfüllt.
