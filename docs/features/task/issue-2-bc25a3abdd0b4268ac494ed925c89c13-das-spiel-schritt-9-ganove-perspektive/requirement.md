# Übersetzte Anforderung — Schritt 9: Ganove-Perspektive (Primärmodus)

Quelle: Kundenanforderung Entwicklungsschritt 9 von 14, Projekt „Im Netz
der Detektive". Fachliche Basis: `docs/konzept/content/01-spielkonzept.md`
§1 (Informationsasymmetrie), `docs/konzept/content/02-technisches-konzept.md`
§4 (Kartenmodell/`MapGraph`), §6 (UI-Aufteilung GanoveUI), §9 (CSS-Module),
§11 (i18n, Barrierefreiheit).

## Fachliche Zusammenfassung

Der primäre Spielmodus wird vollständig spielbar: Ein menschlicher
Spieler übernimmt den **Ganoven** und spielt gegen die KI-Detektive
(`DetectiveAI`). Die React-Oberfläche zeigt eine SVG-Kartenansicht des
Kartenpakets (`viewBox`/Knotenkoordinaten), alle ganovenseitigen
Informationen (eigene Position, legale Züge, exakte Detektivpositionen,
Missionsfortschritt, gesperrte Kanten, Hitze-Indikator, einmaliger
Polizeifunk) und den kompletten Missions-Aktionsfluss inklusive der
endgültigen Sabotage-Binärwahl. Nach jedem Ganove-Zug läuft die
KI-Detektivphase automatisch und deterministisch durch
(`chooseDetectiveMove`), ausgelöst über den Store — die UI regelt nichts
selbst.

Kritische Nicht-Anforderung (Asymmetrie): Die Ganoven-Ansicht zeigt
**keine** Kamera-Icons, **keine** Hinweise und **keine** Ereignisse der
Detektiv-Seite; nachweisbar auf gerendertem DOM.

## Betroffene Klassen und Komponenten

### Neue UI-Komponenten (`src/components/`)

- `MapGraph.tsx` (+ `MapGraph.module.css`) — geteilte SVG-Kartenkomponente:
  `viewBox` aus dem `MapPack`, Knoten als beschriftete Kreise (Klarnamen),
  Kanten als Linien (`fahrt` visuell unterscheidbar von `weg`), gesperrte
  Kanten ausgegraut und zusätzlich geformtkodiert (A11y), Detektiv-Marker,
  Ganoven-Marker nur in der Ganoven-Ansicht, hervorgehobene legale
  Zielknoten, Knoten tastaturbedienbar (`tabIndex`, Enter/Space).
- `GanoveScreen.tsx` (+ `GanoveScreen.module.css`) — der komplette
  Ganoven-Bildschirm: Startaufstellung, Spielphase, Endzustand.
- `HeatBadge.tsx` (+ `HeatBadge.module.css`) — Hitze-Indikator als Badge
  mit Icon **und** Text (nicht nur Farbe), 4 Stufen
  (`ruhig`/`aktiv`/`erhoeht`/`kritisch` aus `getHeatLevel()`).
- `MissionPanel.tsx` (+ `MissionPanel.module.css`) — Missionsfortschritt:
  Schrittfolge Diebstahl → Kontakt → Wahl/Flucht, aktuelles Ziel mit
  Knoten-Klarname, Sabotage-Binärwahl bei `pendingChoice`.
- `PlaceholderPanel.tsx` — entfällt (durch `GanoveScreen` ersetzt).

### State-Treiber (`src/state/`)

- `detectiveDriver.ts` — `installDetectiveDriver()` abonniert den
  `useGameStore` und treibt bei `phase === "detektive"` die
  KI-Detektivzüge via `chooseDetectiveMove` + `moveDetective`
  deterministisch (gleiche `aiRng`-Konvention wie `AiSimulation`);
  Reentrancy-geschützt.

### Bestehende Artefakte (wiederverwendet, ggf. minimal erweitert)

- `src/state/gameStore.ts` — alle benötigten Actions vorhanden
  (`startGame`, `moveGanove`, `ganoveAction`, `chooseMissionPath`,
  `useRadio`, `abortAsDraw`, `getLegalGanoveMoves`, `getMissionAction`,
  `getHeatLevel`, `resetGame`).
- `src/logic/AiSimulation.ts` — `buildDetectiveView`, `aiRng`
  (exportieren für Wiederverwendung durch den Treiber).
- `src/logic/DetectiveAI.ts` — `chooseDetectiveMove`.
- `src/logic/SpawnSystem.ts` — `detectiveSpawnChoices`,
  `ganoveSpawnChoices`, `pickDetectiveSpawns`.
- `src/logic/MapLoader.ts` — `loadMap("muenster")`.
- `src/logic/InformationSystem.ts` — `visibleEvents(events, "ganove")`,
  `RadioHint`.
- `src/i18n/de.json` / `en.json` — alle neuen UI-Texte paritätisch.
- `src/App.tsx` — rendert `GanoveScreen` statt Platzhalter.
- `src/App.test.tsx` — an neue Shell anpassen.

### Tests / E2E

- Vitest-Komponententests (`@testing-library/react` + jsdom) für
  MapGraph, GanoveScreen-Flüsse, Treiber.
- Playwright-E2E (`@playwright/test` + `playwright.config.ts`,
  `e2e/`-Verzeichnis, Vite-`webServer`) für den kompletten Benutzerfluss
  im echten Browser.

## Implementierungsansatz

- Startaufstellung: Detektive zuerst per Seed-RNG platziert
  (`pickDetectiveSpawns` — „KI-wählbar"-Variante), danach wählt der
  Spieler den Ganoven-Startpunkt aus `ganoveSpawnChoices` (Klick/Tastatur
  auf hervorgehobene Knoten); `startGame` erhält beide explizit
  (`detectivePositions`, `ganovePosition`) plus `mission: "random"`
  (Fallback `"auto"` bei `MissionGenerationError`).
- Spielphase: legalen Zielknoten klicken → `moveGanove`; am Zielknoten
  alternativ „Aktion ausführen" → `ganoveAction`; bei `pendingChoice`
  die Binärwahl → `chooseMissionPath`; Zugzwang wird durch die Engine
  erzwungen (keine „Stehenbleiben"-Option in der UI).
- KI-Treiber: Store-Subscription (nicht React-Timer) — jede Transition
  nach `phase === "detektive"` führt alle Detektivzüge synchron aus;
  `detectiveStarts` aus dem Log-Header (`starts.detectives`).
- Polizeifunk: Button einmalig (`useRadio`, danach `radioUsed` →
  deaktiviert); die `polizeifunk`-Event-Payload (`details.hints`) wird
  als Hinweisliste angezeigt.
- Endzustände: `outcome` (`caught`/`surrounded`/`escaped`/`timeout`/
  `draw`) als verständliche Anzeige + „Neue Partie"; Abbruch-als-Remis
  via `abortAsDraw` hinter Bestätigung.
- Alle Texte ausschließlich über `t("…")`-Schlüssel in `de.json`/`en.json`
  (Parität per `i18n-check.py` erzwungen).

## Konfiguration

Keine neuen Konfigurationseinträge. Standardkonfiguration = Map-Vorschläge
(`settings.*.suggested`); Karte „muenster" als Default.

## Akzeptanzkriterien (aus der Anforderung)

1. Komplette Partie Mensch-Ganove vs. KI-Detektive von Startaufstellung
   bis zu jedem Endzustand durchspielbar.
2. Ansicht enthält: eigene Position + legale Nachbarknoten,
   Detektivpositionen, Missionsfortschritt, gesperrte Kanten,
   Hitze-Badge, Polizeifunk-Button.
3. Illegale Züge werden in der UI nicht angeboten.
4. Ganoven-Ansicht zeigt nachweisbar weder Kameras noch
   Hinweise/Ereignisse (Test-Nachweis auf gerendertem DOM).
5. Aktionsfluss inkl. Sabotage-Binärwahl bedienbar und regelkonform;
   Flucht endet als Ganove-Sieg.
6. Benutzerfluss-E2E-/Integrationstests laufen grün.

## Offene Fragen

Keine — alle Punkte sind aus Spec und Bestand ableitbar (volles Menü und
Map-Auswahl folgen erst in Schritt 11; Seed-Erzeugung erfolgt UI-seitig
ohne `Math.random`-Verbot, da außerhalb `src/logic/`).
