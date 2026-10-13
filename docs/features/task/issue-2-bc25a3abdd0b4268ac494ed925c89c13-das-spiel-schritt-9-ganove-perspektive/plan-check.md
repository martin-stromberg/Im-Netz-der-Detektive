# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Komplette Partie Mensch-Ganove vs. KI-Detektive von Startaufstellung bis jedem Endzustand | Programmabläufe „Partie-Setup", „Ganove-Zug + Detektivphase", „Endzustände"; `detectiveDriver` eingebunden | `GanoveScreen.test.tsx` (Spawn → Zug → Aktion → Wahl → escaped; abort → draw) + E2E „volle Partie bis Endzustand" | Abgedeckt |
| Ansicht: Position, legale Nachbarknoten, Detektivpositionen, Missionsfortschritt, gesperrte Kanten, Hitze-Badge, Polizeifunk | `MapGraph` (Positionen, legale Ziele, gesperrte Kanten), `MissionPanel`, `HeatBadge`, Funk-Button in `GanoveScreen` | `MapGraph.test.tsx`, `HeatBadge.test.tsx`, `MissionPanel.test.tsx`, `GanoveScreen.test.tsx` | Abgedeckt |
| Illegale Züge werden nicht angeboten | Nur `legalTargets`/`selectableNodeIds` klickbar; Engine validiert zusätzlich | `MapGraph.test.tsx`, `GanoveScreen.test.tsx`, E2E erster Zug | Abgedeckt |
| Keine Kameras/Hinweise/Ereignisse in Ganove-Ansicht | `MapGraph` hat gar keine Kamera-/Hint-Props; Intel-Feed rendert nur `visibleEvents(…, "ganove")` | DOM-Assertions in `GanoveScreen.test.tsx` + E2E-Asymmetrie-Szenario | Abgedeckt |
| Aktionsfluss inkl. Sabotage-Binärwahl; Flucht = Ganove-Sieg | Programmablauf „Missions-Aktionsfluss", `chooseMissionPath` UI | `MissionPanel.test.tsx`, `GanoveScreen.test.tsx`, E2E-Vollpartie | Abgedeckt |
| Benutzerfluss-E2E/Integrationstests grün | Playwright-E2E + jsdom-Flusstests im Plan verankert (Umsetzungsschritte 7–8) | `test:e2e`-Lauf + Vitest | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| Startaufstellung → erster Zug → KI-Detektivphase | Playwright `e2e/ganove.spec.ts` | Abgedeckt |
| Volle Partie bis Endzustand (Mission, Aktionen, ggf. Sabotage-Wahl) | Playwright `e2e/ganove.spec.ts` | Abgedeckt |
| Asymmetrie-Nachweis (keine Kameras/Hinweise im DOM) | Playwright DOM-Assertion | Abgedeckt |
| Polizeifunk einmalig + Abbruch-als-Remis | Playwright | Abgedeckt |
| Tastaturbedienung (Tab/Enter auf Knoten) | Playwright | Abgedeckt |

## Hinweise

- `teststadt` hat keinen `sabotage`-Kategorie-Pool → Binärwahl dort
  nicht generierbar; Sabotage-Wahl wird via Münster-Seed bzw.
  Store-Seeding im jsdom-Test abgedeckt (im Plan implizit über
  „Store-Seeding" der wahl-Stage; E2E-Sabotage nur falls das generierte
  Münster-Spiel eine Wahl erreicht).
- Playwright-Browser bereits erfolgreich installiert — kein
  Fallback auf reine jsdom-Tests nötig.
