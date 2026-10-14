# Abnahmeprüfung – Entwicklungsschritt 14

## Ergebnis

**Status:** Anforderung vollständig erfüllt

## Abweichungen

- [ ] Keine.

## Hinweise

**Prüfumfang:** Diff `task/...-das-spiel...HEAD` (35 Dateien, u. a.
`.github/workflows/{pr-staging-ci,staging-ci}.yml`,
`docs/help/spiel-engine/balancing-bericht.md`, `src/logic/{GanoveAI,DetectiveAI,
AiSimulation}.ts`, `src/data/maps/muenster.json`, `src/assets/*`, `e2e/*`,
`scripts/sim.ts`). Alle Kommandos lokal auf dem Schritt-Branch ausgeführt.

### 1. E2E in CI verdrahtet, lokal grün — erfüllt

- `pr-staging-ci.yml` und `staging-ci.yml` enthalten jeweils einen Job
  `e2e (playwright, best-effort)` mit `continue-on-error: true`,
  `npx playwright install --with-deps chromium`, `npm run test:e2e` und
  Trace-/Artefakt-Upload (`if: always()`, `test-results/`, 14 Tage
  Retention). Der Job hängt korrekt an `detect-backmerge` und blockiert
  weder PR noch Prerelease (`version` benötigt ihn nicht) — vorlagenkonform.
- Lokal: `npm run test:e2e` → **29/29 Tests grün** (Chromium, 17 s),
  inkl. kompletter Partien beider Seiten, Save/Load, Replay, Statistik,
  Sprachwechsel, Tastaturbedienung und Asymmetrie-Assertions.

### 2. Balancing-Verteilung selbst nachgemessen — Korridor bestätigt

- `node dist-sim/sim.mjs --map muenster --games 100 --seed-start 1`:
  **47 % escaped / 53 % caught, Sabotage-Annahme 47 %, Radio 87 %** —
  reproduziert die Berichtszeile „Seeds 1–100" exakt (47/53/47/87).
  Berichtszahlen sind also mit dem committeten Stand nachvollziehbar.
- Eigener frischer Batch `seeds 401–450` (50 Partien): 38 % escaped,
  54 % Sabotage-Annahme — 38 % liegt 2 pp unter dem Korridor, aber
  innerhalb der statistischen Streuung bei n=50 (SE ≈ 7 pp; der Bericht
  dokumentiert selbst ±3 pp über 100er-Batches). Über die im Bericht
  genannten Seeds sind 47–50 % verifiziert → Korridor erreicht.
- Karten-Defaults `muenster.json` alle innerhalb der Paket-Bereiche:
  `detectiveCount` 3 ∈ [2,6], `cameraCount` 4 ∈ [0,15],
  `roundLimit` 40 ≥ 15, `radioHintCount` 5 ∈ [3,10],
  `edgeBlockRounds` 3 ∈ [1,6]. Loader validiert `suggested ∈ [min,max]`
  erzwungen (`src/logic/mapPack.ts:186–191`); UI lehnt Bereichsverletzungen
  ab (E2E `menu.spec.ts:92` grün).
- Skalarfelder ohne min/max (`hintZoneRadius` 3, `eventDefaults`,
  `eventMix`, `missionRules` inkl. `sabotageDetour` 8) sind „fest je Map"-
  Werte; ihre Anpassung ist durch Schritt-14-Mandat („einstellbare
  Parameter werden nachjustiert") gedeckt und im Bericht begründet. Der
  Spezifikations-Startwert „Sabotage-Umweg ≤ +4" (`04-balancing.md`)
  wurde auf 8 angehoben — dessen Zweck (Ablehnung darf nicht dominant
  werden) ist mit gemessener ~50/50-Annahme erfüllt; vertretbare,
  dokumentierte Kalibrierung.
- Kleinigkeit ohne Befundwirkung: `muenster.json` endet ohne
  abschließenden Zeilenumbruch; `prettier --check` besteht dennoch.

### 3. Keine spielblockierenden Fehler, reproduzierbare Builds — erfüllt

- `npm test`: **581/581 Tests grün** (50 Dateien). `npm run coverage`:
  **91,9 % Lines** (Stmts 92,3 %, Branch 84,8 %) — weit über 70 %.
- `npm run lint`, `npm run typecheck`, `npm run build`: fehlerfrei.
- Reproduzierbarkeit empirisch: zwei aufeinanderfolgende `npm run build`
  erzeugen identische Asset-Hashes (`diff` der `dist/assets/`-Listings
  leer). Kein `Math.random()` in `src/logic`/`src/state`.
- RC-Prerelease-Pfad: `staging-ci` `version`/`prerelease`-Jobs unverändert
  vorhanden (e2e nur additiv); tatsächlicher RC entsteht erst nach Merge —
  Mechanik verdrahtet, Lauf selbst nicht vom Branch aus prüfbar.

### 4. Rasterassets lokal, dokumentiert, valide — erfüllt

- 6 JPEGs in `src/assets/` (Titelbild, 2 Stadtbilder, Hintergrundtextur,
  2 Fall-Artworks), alle per `file` als gültige baseline-JPEGs verifiziert
  (768×768 bzw. 768×432), alle im `vite build`-Output enthalten.
- Keine Hotlinks: `grep "https?://" src/` findet nur Dokumentations-URLs
  in `ASSETS.md`; Einbindung ausschließlich via ES-Import/CSS-`url()`
  (`caseArt.ts`, `MissionSelect.tsx`, `GanoveScreen.module.css` und die
  bereits vorhandenen Menü-/Kartenverwendungen).
- `src/assets/ASSETS.md` dokumentiert Quelle (Pollinations.ai, Datum,
  Seeds, Maße), gekürzte Prompts inkl. gemeinsamem Stil-Präfix sowie
  Sicht-/Lizenzprüfung — Kriterium „Prompts/Lizenz dokumentiert" erfüllt.

### 5. Dokumentierte Grenzen — vertretbar

- „Menschlicher Ganove >50 %-Chance": als qualifizierte Annahme im Bericht
  begründet (KI-vs.-KI-Metrik, E2E-Clicker entkommt häufiger, 3 Detektive
  mit voller Deduktion bleiben Gegner) — plausibel, kein Widerspruch.
- „Lübeck Sabotage-Annahme 100 %": als dokumentierte Abweichung begründet
  (Inselkarte erzeugt nur billige Umwege; Lübeck ist die bewusst
  unbalancierte Validierungskarte). Eigene Messung (50 Partien, Seeds
  1–50): **52 % escaped, 100 % Annahme** — bestätigt den Bericht.
  Vertretbar, da der Zielkorridor auf der Referenzkarte Münster gilt.

### 6. Asymmetrie intakt — erfüllt

- E2E-Assertions laufen und sind grün: „the ganove start stays hidden"
  (`detektiv.spec.ts:122`), „hint chronicle grows; nothing leaks"
  (`detektiv.spec.ts:248`), Replay „detective view hides the ganove"
  (`persistenz.spec.ts:174`).

### Einschränkungen

- Die 400-Seed-Gesamtreihe des Berichts wurde nicht vollständig
  nachgefahren; verifiziert wurden Seeds 1–100 (exakte Reproduktion) sowie
  zwei unabhängige 50er-Batches auf Münster und Lübeck.
- CI-Lauf des neuen `e2e`-Jobs selbst liegt außerhalb des lokalen
  Prüfumfangs (Workflow-Syntax und Verdrahtung geprüft, lokale Suite grün).
