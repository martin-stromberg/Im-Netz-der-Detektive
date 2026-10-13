# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Kameraplatzierung: Mindestabstand + Ausschlussliste über viele Seeds; Auslösung → exakter Knoten-Hinweis nur für Detektive | `placeCameras` (BFS-Mindestabstand, `cameraProtectedNodes`), `triggeredCamera` in `moveGanove`, `visibleTo: "detectives"` | `placeCameras`-Suite (~50 Seeds, 2 Karten), Store-Test Kameraauslösung, Asymmetrie-Test | Abgedeckt |
| Drei Auslösemodi mit spezifizierter Kadenz | `rollTrigger` (cycle modulo / chance per rng / tension Akkumulation+Reset) | `rollTrigger`-Suite: deterministisch, statistisch (±5 %), garantierte 4-Runden-Kadenz | Abgedeckt |
| Typmischung ~25/45/30; Umwelt ohne Zerteilung/letzte freie Kante | `drawEventType` (gewichtet), `pickBlockableEdge` (Konnektivitäts-Check) | `drawEventType`-Verteilungstest, `pickBlockableEdge`-Suite über Seeds | Abgedeckt |
| Kein Live-Positions-Leak außer verfallendem Sichtbarkeitsereignis; Hinweise nur detektivsichtig | `revealedGanovePosition` nur in Auslöserunde; `visibleTo`-Modell + `visibleEvents` | `revealedGanovePosition`-Suite, `visibleEvents`-Suite, Integrationstest | Abgedeckt |
| Polizeifunk 1×/Partie, letzte N Hinweise inkl. Kameratreffer | `useRadio` + `radioUsed` + `radioHintSummary` | `radioHintSummary`-Suite, Store-Test (zweite Nutzung wirft) | Abgedeckt |
| Hitze-Level exakt nach Gewichtungstabelle, 3-Runden-Fenster | `heatLevel` mit `HEAT_WEIGHTS` inkl. `aktion: 2` | `heatLevel`-Suite inkl. Fenster-Grenzfälle | Abgedeckt |
| Automatisierte Asymmetrie-Prüfung | `visibleEvents`/`visibleCameras` + `visibleTo` erweitert um `"ganove"` | Ganovensicht-Test über gespielte Partie in `gameStore.info.test.ts` | Abgedeckt |
| `deactivateAll()` für Sabotage vorgesehen | `deactivateCameras`-Action + `deactivatedCameras` | `CameraSystem`-Suite + Store-Test | Abgedeckt |
| Timeline: Checks nach Ganove-Zug, Hinweise vor Detektivzügen sichtbar | Schritt 3/4 in `moveGanove` vor `phase:"detektive"` | Store-Integrationstest (Hinweis vorhanden in Phase `detektive`) | Abgedeckt |
| Aktions-Spur-Gewicht jetzt im Modell verankert | `GameEventKind` enthält `"aktion"`, `HEAT_WEIGHTS.aktion = 2` | `heatLevel`-Test mit synthetischem `aktion`-Event | Abgedeckt |
| Coverage ≥70 %, kein `Math.random`, deterministisch | `Rng` überall, `mixSeed` | Bestehender Hook + QS-Lauf (Task 22) | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| — | Kein UI-Benutzerfluss in dieser Anforderung (headless Engine; UI folgt in späteren Schritten); Store-Integrationstests sind der Funktionsnachweis | Nicht erforderlich mit Begründung |

## Hinweise

- `teststadt`-Kartenparameter (`cameraCount.suggested: 8` bei 10 Knoten,
  `cameraMinGap: 2`) sind absichtlich knapp — der Plan sieht
  Best-Effort-Platzierung vor; Tests dürfen die Invarianz (Abstand,
  Ausschluss) fordern, nicht die volle Anzahl.
- `GameEvent`/`Camera` ziehen nach `InformationSystem.ts` (re-export aus
  `gameStore.ts`), um Zirkelimporte zu vermeiden — bestehende Imports
  bleiben kompatibel.
