# Anforderung — Das Spiel (Issue #2)

> Strukturierte Anforderung für das Projekt „Das Spiel" („Im Netz der Detektive").
>
> **Quellen:**
> - `issue.md` — verbindliche Aufgabenstellung (Issue #2)
> - `docs/konzept/content/00-uebersicht.md` — Status aller Design-Entscheidungen
> - `docs/konzept/content/01-spielkonzept.md` — vollständiges Regelwerk
> - `docs/konzept/content/02-technisches-konzept.md` — Architektur, Stack, Kartenpaket-Format, Eventlog
> - `docs/konzept/content/03-offene-themen.md` — Entscheidungsarchiv OT-01 bis OT-36
> - `docs/konzept/content/04-balancing.md` — Startwerte und Kalibrierungsmetriken
> - `refs/ci-workflows-instructions.md` — CI-Pipeline-Vorlage (Pattern-Collection, .NET-basiert)
> - `refs/git-hooks-readme.md` — Git-Hooks-Vorlage (Pattern-Collection, .NET-fokussiert)
>
> **Kennzeichnung:** Aussagen ohne Zusatz sind **[Vorgabe]** — direkt aus den Quellen ableitbar.
> Als **[Annahme]** markierte Punkte sind Interpretationen, die in „Offene Fragen" zu klären sind.

## Ziel

Das asymmetrische Verfolgungsspiel „Im Netz der Detektive" ist gemäß dem
Konzept unter `docs/konzept/` vollständig zu implementieren: Ein verdeckter
Ganove erfüllt eine Mission im Wegenetz von Münster, während offen spielende
Detektive ihn anhand von Hinweisen, Kameras und Ereignissen eingrenzen
[Quelle: `issue.md`, `00-uebersicht.md`, `01-spielkonzept.md` §1].

Umgebungsvorgaben aus `issue.md`:

- Umsetzung mit dem im Konzept festgelegten Stack (React 18 + Vite +
  TypeScript, Zustand, CSS-Module, JSONL-Eventlog).
- Das Ergebnis soll sich als **professionelles Spiel auf „Triple-A-Niveau"**
  zeigen — dieser Qualitätsanspruch ist unscharf und klärungsbedürftig
  (siehe „Akzeptanzkriterien" und „Offene Fragen").
- **Mit jeder Phase des Projekts** entsteht eine **Prerelease-Version auf dem
  `staging`-Branch**, über die Stakeholder den Fortschritt erkennen können.
- Aufbau einer CI-Pipeline nach den Instruktionen der Pattern-Collection
  (`refs/ci-workflows-instructions.md`), adaptiert auf Node/Vite.
- Lokale Git-Hooks nach der Vorlage (`refs/git-hooks-readme.md`) zur
  Qualitätssicherung vor dem Push; eigene projektspezifische Prüfungen sind
  ausdrücklich erwünscht.
- Nicht zugängliche benötigte Zusatztools (z. B. zur Grafikerstellung) sind
  anzufordern.

## Fachliche Anforderungen

### Grundidee und Informationsasymmetrie

1. **FA-01 — Spielprinzip:** Asymmetrisches Verfolgungsspiel: ein verdeckter
   Ganove zieht durch das Wegenetz von Münster und erfüllt eine Mission;
   offen spielende Detektive grenzen ihn über Hinweise, Kameras und
   Ereignisse ein. [Quelle: `01-spielkonzept.md` §1]
2. **FA-02 — Informationsasymmetrie:** Der Ganove sieht eigene Position,
   Nachbarknoten/mögliche Wege, alle Detektivpositionen (exakt),
   Missionsziele und gesperrte Kanten — aber **nie** Kameras, Hinweise oder
   Ereignisse. Die Detektive sehen die Karte vollständig inkl. Ortskategorien/
   Zonen, ihre Positionen, alle Hinweise und Ereignisse sowie die
   Missionsstruktur — aber **nie** die gezogenen Zielknoten und **nie** den
   Ganoven. [Quelle: `01-spielkonzept.md` §1, OT-02/OT-06]

### Spielfeld und Karte

3. **FA-03 — Münster-Graph:** Handgebauter Graph auf realer Topografie,
   ~50 Knoten (Korridor 45–60), ~90–110 Kanten, Ø-Knotengrad 3–4; `cost`-Feld
   reserviert. [Quelle: `01-spielkonzept.md` §2, `02-technisches-konzept.md`
   §4, OT-17]
4. **FA-04 — Kantentypen:** Zwei Typen `weg` (dicht, lokal) und `fahrt`
   (seltene Fernverbindungen); beide Seiten nutzen beide Typen;
   1 Zug = 1 Kante. [Quelle: `01-spielkonzept.md` §2]
5. **FA-05 — Knotenattribute:** Jeder Knoten trägt `categories`
   (diebstahl/kontakt/sabotage/flucht — Pool für die Missionsgenerierung),
   eine `zone` (Basis für Zonenhinweise) und `x`/`y`-Koordinaten für
   SVG-Rendering. [Quelle: `01-spielkonzept.md` §2,
   `02-technisches-konzept.md` §4]

### Startaufstellung und Rundenablauf

6. **FA-06 — Spawn-Modi:** Pro Seite und Map ein Spawn-Modus: `choice`
   (Liste erlaubter Knoten/Zonen), `free` (alle Knoten mit
   `minDistanceToDetective` zu Detektiven) oder `random`. Reihenfolge immer:
   Detektive zuerst, Ganove als Letzter (bei Wahl-Modi); Positionen unterhalb
   des Mindestabstands werden nicht angeboten. [Quelle: `01-spielkonzept.md`
   §3, `02-technisches-konzept.md` §4, OT-28]
7. **FA-07 — Rundenstruktur:** Zwei Phasen pro Runde: Ganovenphase (Zug
   *oder* Aktion am Zielknoten; Kamera-/Ereignis-/Hinweisprüfung intern), dann
   Detektivphase D1→D4 in fester Reihenfolge mit Fangprüfung nach jedem
   Einzelzug. [Quelle: `01-spielkonzept.md` §3, OT-07]
8. **FA-08 — Zugzwang und Blockierung:** Zugzwang für alle (einzige Ausnahme:
   Aktionsrunde des Ganoven); von Detektiven besetzte Knoten sind für den
   Ganoven illegale Ziele (UI filtert sie); mehrere Detektive dürfen denselben
   Knoten teilen; keine Fangprüfung auf Kanten. [Quelle: `01-spielkonzept.md`
   §3, OT-03/OT-07]

### Informationssystem

9. **FA-09 — Kameras:** 8 Kameras (~15 % der Knoten), zufällig verteilt mit
   Mindestabstand 2 Kanten, Missionszielknoten kamerafrei (öffentliche Regel),
   dauerhaft aktiv; Hinweis = exakter Knoten + Auslöserunde, nur für
   Detektive; Ganove erfährt Kamerapositionen nie (Ausnahme: Polizeifunk).
   [Quelle: `01-spielkonzept.md` §4.1, OT-11/OT-12/OT-25]
10. **FA-10 — Ereignis-Auslösemodi:** Drei einstellbare Modi — fester Zyklus
    (Startwert 4), prozentuale Wahrscheinlichkeit (Startwert 25 %),
    Spannungsbalken (Default: +10/Runde, Schwelle 40 → Kadenz ~alle
    4 Runden). [Quelle: `01-spielkonzept.md` §4.2, `04-balancing.md`]
11. **FA-11 — Ereignistypen und -mischung:** Sichtbarkeit (exakter Knoten nur
    für die laufende Runde, ~25 %), Hinweis/Zeuge (zonenbasiert, ~45 %),
    Umwelt (sperrt 1 zufällige Kante für 3 Runden, beidseitig sichtbar und
    wirksam, ~30 %); Engine verhindert Isolation/Graph-Zerteilung und das
    Sperren der letzten Kante eines Knotens; Ganovenaktionen sind **keine**
    Zufallsereignisse. [Quelle: `01-spielkonzept.md` §4.3,
    OT-13/OT-14/OT-16]
12. **FA-12 — Hinweisgrundsatz:** „Hinweise zeigen, wo der Ganove *war* — nie
    wo er *ist*": exakte Knotenangabe nur vergangenheitsbezogen (Kamera,
    Aktions-Spur); Live-Ausnahme nur das Sichtbarkeitsereignis;
    Zonen-Hinweise bleiben grob (Radius ~2 Kanten); nur Detektive sehen
    Hinweise. [Quelle: `01-spielkonzept.md` §4.4, OT-11]
13. **FA-13 — Polizeifunk:** Einmal pro Partie; liefert dem Ganoven die
    letzten 5 Hinweise mit Typ und Runde **inkl. Kameraauslösungen** (implizit
    die Position ausgelöster Kameras); keine unentdeckten Kameras, keine
    kommenden Ereignisse. [Quelle: `01-spielkonzept.md` §4.5, OT-15]
14. **FA-14 — Hitze-Indikator:** 4-stufiger „Polizeiaufmerksamkeits"-Level
    (ruhig/aktiv/erhöht/kritisch) aus gewichteter Hinweisaktivität der letzten
    3 Runden (Zonen-Hinweis +1, Kamera +2, Aktions-Spur +2, Sichtbarkeit +3;
    Schwellen 0/1–2/3–4/≥5); zeigt *wie viel* die Detektive wissen, nie
    *was/woher*; Badge mit Icon + Text (nicht nur Farbe) plus Sound beim
    Stufenanstieg. [Quelle: `01-spielkonzept.md` §4.6, OT-27]

### Missionssystem

15. **FA-15 — Aktionspool:** Diebstähle, Kontakte (Informanten bieten das
    Sabotage-Angebot), Sabotagen (nur optional via Informant), Fluchtpunkte.
    [Quelle: `01-spielkonzept.md` §5.1]
16. **FA-16 — Missionsvarianten und „Fälle":** Vordefiniert /
    zufallsgeneriert nach Regeln / spielerdefiniert; vordefinierte Missionen
    werden als benannte „Fälle" mit Mini-Story (JSON-Missionssets pro Karte)
    ausgeliefert; **feste Reihenfolge** Diebstahl → Kontakt → Binärwahl
    (Sabotage *oder* Flucht). [Quelle: `01-spielkonzept.md` §5.2,
    OT-08/OT-33]
17. **FA-17 — Generierungskriterien (messbar, per BFS prüfbar):**
    Paardistanz aller Missionsziele ≥ 3 Kanten; aufeinanderfolgende Ziele
    3–8 Kanten; kürzeste Route Start→Diebstahl→Kontakt→Flucht +
    3 Aktionsrunden ≤ 18 Züge (mit Sabotage ≤ 22); Fluchtpunkt ≥ 4 Kanten vom
    Kontakt- und ≥ 3 vom Diebstahlziel; Sabotage-Umweg ≤ +4 gegenüber
    Direktweg. [Quelle: `01-spielkonzept.md` §5.2, OT-09]
18. **FA-18 — Aktionsausführung:** Betreten ≠ Aktion; am Zielknoten wählt der
    Ganove „ausführen" (verharren, voll verwundbar) oder Weiterziehen; die
    Aktion erzeugt einen exakten Spur-Hinweis, sichtbar **vor** den
    Detektivzügen derselben Runde; Sabotage-Angebot beim Kontakt ohne
    Extra-Runde; **Flucht = Sieg bei Ankunft** am freien Fluchtpunkt, keine
    Aktionsrunde. [Quelle: `01-spielkonzept.md` §5.3, OT-10/OT-25]
19. **FA-19 — Sabotage-Angebot:** Nach der Kontakt-Aktion zufälliges Angebot
    aus drei Effekten — Kameras deaktivieren (restliche Partie), Funkstille
    (N Runden keine Ereignis-Hinweise), Falsche Spur (irreführende Hinweise);
    **Binärwahl** Sabotageziel *oder* Fluchtpunkt, kein Zurück; der
    Kontakt-Hinweis verrät die Wahl nicht. [Quelle: `01-spielkonzept.md`
    §5.4, OT-01/OT-16]

### Detektive, Spielmodi und Deduktion

20. **FA-20 — Detektivtrupp:** 4 Detektive als eine Steuerinstanz (Prototyp:
    KI); Anzahl ist Balancing-Parameter (Testbereich 3–5); Detektive kennen
    Missionsstruktur und Ziel-Pools, nicht die Zielknoten (Campen auf Zielen
    strukturell ausgeschlossen). [Quelle: `01-spielkonzept.md` §6, OT-05]
21. **FA-21 — Spielmodi:** (a) **Ganoven-Perspektive** (Primärmodus): Mensch
    als Ganove vs. KI-Detektive; (b) **Detektiv-Perspektive**: Mensch steuert
    alle 4 Detektive vs. KI-Ganove; (c) **Dev-Modus**: KI-vs.-KI mit
    Aufzeichnung als Balancing-Werkzeug. Kein Hot-Seat. [Quelle:
    `01-spielkonzept.md` §6, OT-04/OT-30]
22. **FA-22 — Deduktions-Werkzeuge:** Hinweis-Chronik (Typ, Ort/Zone, Runde),
    Marker (Knoten markieren/kommentieren), „Mögliche Positionen"-Overlay
    (alle mit den Hinweisen konsistenten Knoten); die Detektiv-KI nutzt
    intern dieselbe Datenstruktur (`Deduction.ts`). [Quelle:
    `01-spielkonzept.md` §6, OT-31]
23. **FA-23 — KI:** Detektiv-KI mit glaubwürdigem Druck per Heuristik (auf
    letzten Hinweis zusteuern + mögliche Positionen eingrenzen); KI-Ganove
    für Dev-Modus und Detektiv-Perspektive (`GanoveAI.ts`). [Quelle:
    `01-spielkonzept.md` §6, `02-technisches-konzept.md` §5]

### Spielende

24. **FA-24 — Endbedingungen:** (a) **Fang**: Detektiv beendet Zug auf
    Ganoven-Knoten, Sofortprüfung; (b) **Umzingelung**: Ganove hat zu
    Phasenbeginn keinen legalen Zug und keine ausführbare Aktion → Fang;
    (c) **Flucht**: Ganove erreicht freien Fluchtpunkt → Ganove-Sieg
    (besetzter Fluchtpunkt ist nur temporär illegales Ziel); (d)
    **Zeitlimit**: Ablauf ohne Flucht → Detektiv-Sieg, einstellbar inkl.
    „unbegrenzt" (Münster-Vorschlag: 30); (e) **Remis**: vorzeitiger Abbruch
    kann als Unentschieden (`outcome: "draw"`) zählen, nicht als
    Sieg/Niederlage. [Quelle: `01-spielkonzept.md` §7,
    OT-03/OT-09/OT-24/OT-25/OT-29]

### UI-Anforderungen

25. **FA-25 — Zwei UI-Ansichten:** GanoveUI (eigene Position + Nachbarknoten,
    Detektivpositionen, Missionsfortschritt, „Aktion ausführen"-Button,
    gesperrte Kanten, Hitze-Indikator, Polizeifunk-Button) und DetektiveUI
    (Karte inkl. Ortskategorien, eigene Positionen, Hinweis-Chronik,
    Deduktions-Tools, Missionsstruktur ohne Zielknoten, gesperrte Kanten).
    [Quelle: `02-technisches-konzept.md` §6]
26. **FA-26 — Karten-Darstellung:** `MapGraph` rendert SVG: Knoten, Kanten,
    Detektiv-Icons, Kamera-Icons (nur Detektivansicht), gesperrte Kanten
    ausgegraut; der Ganove ist nur in der GanoveUI sichtbar. [Quelle:
    `02-technisches-konzept.md` §4]
27. **FA-27 — Menü und Einstellungen:** Die Map liefert Vorschläge und
    erlaubte Bereiche für alle topologieskalierenden Werte; das Menü
    überschreibt innerhalb dieser Bereiche (Detektivzahl, Kameraanzahl,
    Zeitlimit inkl. „unbegrenzt", Polizeifunk-Tiefe, Sperr-Dauer,
    Ereigniskadenz); Karten-Auswahlmenü zeigt weitere Städte als
    „in Vorbereitung". [Quelle: `01-spielkonzept.md` §2/§8, OT-18/OT-26]

### Persistenz, Eventlog und Replay

28. **FA-28 — JSONL-Eventlog:** Event-sourced Aufzeichnung (Header mit
    gameId/mapId/seed/config/mission/cameras/starts + Events +
    `result`-Summary inkl. Balancing-Metriken und `outcome` inkl. `"draw"`);
    vollständig rekonstruierbar via Seed; **einzige Zufallsquelle** ist der
    zentrale Seeded-RNG (`rng.ts`, kein `Math.random()` in Engines); Export
    per „Partie exportieren"-Button plus Auto-Speicherung der letzten N Logs
    in `localStorage`. [Quelle: `02-technisches-konzept.md` §5/§8, OT-22]
29. **FA-29 — Save/Load, Replay, Statistiken:** Speicherstand =
    State-Snapshot + Log + Seed („Partie fortsetzen"); Replay-Player spielt
    Eventlogs deterministisch ab (Timeline: Abspielen/Pause/Schritt
    vor/zurück, zwei Perspektiven über `visibleTo`); aggregierte Statistiken
    aus Logs (Siegquote, Partienlänge, Hinweise/Partie, Kameratreffer).
    [Quelle: `02-technisches-konzept.md` §8.1, OT-34]

### Technik und Kartenpakete

30. **FA-30 — Technik-Stack:** React 18 + TypeScript + Vite; **Zustand** als
    ein kohärenter, **headless** lauffähiger Store (KI-vs.-KI-Simulation
    treibt denselben Store ohne UI); **CSS-Module** (kein Tailwind);
    Modulstruktur nach Feature-Slices gemäß Verzeichnislayout. [Quelle:
    `02-technisches-konzept.md` §1–§3/§9, OT-20]
31. **FA-31 — Kartenpaket-Format:** Karten sind JSON-Kartenpakete
    (`/src/data/maps/<stadt>.json`) mit Pflichtfeldern Graph, `spawnRules`,
    `settings`, geladen und validiert via `MapLoader.loadMap(id)`;
    map-abhängige Settings als `{ suggested, min, max }` bzw. feste
    Skalarfelder; **nichts hartkodieren** — Multi-Stadt-fähig von Anfang an;
    reine Spielregeln bleiben global. [Quelle: `02-technisches-konzept.md`
    §4, OT-17/OT-18/OT-26]
32. **FA-32 — Karten-Scope:** Eine fertige Karte **Münster** (~50 Knoten mit
    echten Orten, Kategorien, Zonen) plus **Lübeck-Altstadtinsel** als kleine,
    bewusst unbalancierte Validierungskarte zum Test des MapLoaders.
    [Quelle: `00-uebersicht.md`, `01-spielkonzept.md` §8, OT-18]

### Lokalisierung, Barrierefreiheit, Audio

33. **FA-33 — i18n:** Alle Texte über Schlüssel (DE/EN) von Beginn an, keine
    hartkodierten Strings in Komponenten. [Quelle:
    `02-technisches-konzept.md` §11, OT-35]
34. **FA-34 — Barrierefreiheit:** Icons/Overlays nie nur farbkodiert
    (Farbenblind-Modus via Form/Label), vollständige Tastaturbedienung,
    ausreichende Kontraste — gilt auch für Hitze-Indikator und
    Deduktions-Overlays. [Quelle: `02-technisches-konzept.md` §11, OT-35]
35. **FA-35 — Audio:** Dezente Sound-Dramaturgie als Spannungskanal für den
    Ganoven (Stufenanstieg des Hitze-Indikators,
    „Polizeiaktivität"-Ambient). [Quelle: `02-technisches-konzept.md` §11,
    OT-35]

### Balancing

36. **FA-36 — Startwerte und Kalibrierung:** Startwerte aus
    `04-balancing.md` umsetzen; Kalibrierung über Eventlog-Metriken
    (outcome-Verteilung, Runden bis Fang/Flucht, Hinweise/Partie,
    Kameratreffer, Sabotage-Annahmequote); Zielwerte: ~40–50 %
    Ganove-Siegquote, echte ~50/50-Abwägung bei der Sabotage. [Quelle:
    `04-balancing.md`, OT-23]

### CI/CD (verbindlich aus `issue.md`)

37. **FA-37 — Prerelease-Pipeline:** Mit **jeder Projektphase** entsteht eine
    versionierte Prerelease (`vX.Y.Z-rc.N`) auf `staging`. Pipeline nach
    `refs/ci-workflows-instructions.md`, adaptiert auf Node/Vite:
    `staging`→`main`-Branchmodell (beide Branches existieren remote),
    Qualitäts-Gates auf PRs nach `staging`, Versionsbestimmung via
    semantic-release (Conventional Commits, `release.config.js`),
    RC-Prereleases auf Push nach `staging`, automatischer
    Promotion-PR `staging`→`main`, Release auf Push nach `main` bzw.
    manuellen `vX.Y.Z`-Tag inkl. Asset-Repair, automatischer
    Backmerge-PR `main`→`staging`. [Quelle: `issue.md`,
    `refs/ci-workflows-instructions.md` §1–§9]
38. **FA-38 — Quality Gates:** Pro PR: statische Checks (Format, Security-Scan
    blockierend, statische Analyse) und Build&Test in parallelen Jobs inkl.
    Coverage-Report mit Schwellenwert; `verify-pr-source` (nur `staging` nach
    `main`); `no-pending-backmerge`-Gate; wöchentlicher, entkoppelter
    Security-Scan (`schedule`-only). **[Annahme]** Mapping auf Node/Vite:
    Prettier/ESLint/`tsc --noEmit` statt dotnet format/build, `vitest`/
    npm-Test-Runner mit Coverage, `npm audit`/`npm ci` statt
    `dotnet list package --vulnerable`, `vite build`-Artefakt als
    Release-Asset statt .NET-Publish-ZIPs. [Quelle: `issue.md`,
    `refs/ci-workflows-instructions.md` §3–§10]
39. **FA-39 — Git-Hooks:** Lokale Qualitätsprüfungen vor dem Push nach der
    Vorlage `refs/git-hooks-readme.md`: `pre-commit` (Warnstufe auf
    gestagte Dateien) und `pre-push` (strikter Whole-Repo-Audit; blockiert
    direkte Pushes auf `main`/`staging`); Installation via
    `core.hooksPath`/Install-Skripte; die .NET-fokussierten Python-Prüfungen
    sind funktional auf TS/React zu adaptieren; **eigene
    projektspezifische Prüfungen sind ausdrücklich erwünscht** (z. B.
    i18n-Vollständigkeit analog `translation-check.py`,
    Platzhalter-/Stub-Erkennung analog `no-notimplemented-check.py`).
    [Quelle: `issue.md`, `refs/git-hooks-readme.md`]

## Betroffene Bereiche

| Bereich | Art der Änderung | Quelle |
|---|---|---|
| `src/` (neu) | Komplette Neuentwicklung: `components/` (MapGraph, GanoveUI, DetektiveUI, EventPanel, MissionPanel), `logic/` (Movement, EreignisEngine, MissionEngine, CameraSystem, DetectiveAI, GanoveAI, Deduction, SpawnSystem, Recorder, ReplayPlayer, SaveGame, MapLoader, rng), `state/` (GameState), `data/` (maps/*.json, actions.json) | `02-technisches-konzept.md` §2 |
| `src/data/maps/` (neu) | Kartenpakete `muenster.json` + `luebeck.json` | `02-technisches-konzept.md` §4, OT-18 |
| `package.json`, `release.config.js` (neu) | Projekt-Setup, devDependencies inkl. semantic-release-Plugins (conventionalcommits-Preset) | `refs/ci-workflows-instructions.md` §8.4 |
| `.github/workflows/` (neu) | 7 Workflows: `verify-pr-source`, `pr-staging-ci`, `staging-ci`, `staging-to-main-promotion`, `sync-staging-with-main`, `release`, `security-scan` | `refs/ci-workflows-instructions.md` §2–§10 |
| `.github/actions/` (neu) | Composite Actions `build-and-package`, `security-scan` | `refs/ci-workflows-instructions.md` §6 |
| `scripts/resolve-release-version.mjs` (neu) | Release-Versionsauflösung inkl. Prerelease-Guard und Unit-Tests | `refs/ci-workflows-instructions.md` §8.2 |
| `githooks/` (neu) | Lokale Hooks + Install-Skripte + adaptierte Python-Prüfungen | `refs/git-hooks-readme.md` |
| Git-Branches `main`/`staging` | Bereits remote vorhanden; Branch-Protection gemäß Vorlage sicherstellen | `refs/ci-workflows-instructions.md` §1 |
| `docs/` | Konzept-Dokumente als verbindliche Referenz (keine inhaltliche Änderung); bestehender Doc-Viewer (`start-docs.bat`) bleibt funktionsfähig | `02-technisches-konzept.md` §12 |

## Abläufe

### 1. Partie-Setup

1. Karte wählen (Münster; Lübeck als Validierungskarte) → MapLoader lädt und
   validiert das Kartenpaket.
2. Einstellungen prüfen/anpassen (nur innerhalb der Map-Bereiche); Modus und
   Missionstyp wählen (vordefinierter „Fall", generiert, spielerdefiniert).
3. Mission generieren/laden → Generierungskriterien per BFS prüfen.
4. Kameras platzieren (≥ 2 Kanten Abstand, Missionsziele ausgeschlossen).
5. Startaufstellung: Detektive zuerst, Ganove zuletzt gemäß Spawn-Modi mit
   Mindestabstand. [Quelle: `01-spielkonzept.md` §3–§5]

### 2. Rundenablauf

1. **Ganovenphase:** Ganove zieht auf legalen Nachbarknoten *oder* führt am
   Zielknoten die Aktion aus (verharrt, verwundbar). Intern laufen sofort
   Kameraprüfung, Ereignisauslösung (je nach Modus) und Hinweiserzeugung ab —
   der Ganove erhält nur die Bewegungsbestätigung; Aktions-Spur wird vor den
   Detektivzügen sichtbar.
2. **Detektivphase:** Detektive sehen neue Hinweise/Ereignisse, dann zieht
   jeder Detektiv einmal in fester Reihenfolge (D1→D4); **Fangprüfung nach
   jedem Einzelzug** — Treffer beendet die Partie sofort.
3. Phasenübergreifend gelten: Zugzwang, besetzte Knoten für den Ganoven tabu,
   Kantensperrungen wirken beidseitig. [Quelle: `01-spielkonzept.md` §3/§7]

### 3. Missionsablauf (Ganove)

1. **Diebstahl** am Diebstahlziel ausführen → exakter Spur-Hinweis.
2. **Kontakt** am Kontaktziel ausführen → Informant bietet im selben Schritt
   ein Sabotageziel mit zufälligem Effekt an (Kameras aus / Funkstille /
   falsche Spur).
3. **Binärwahl:** Sabotageziel annehmen *oder* direkt zum Fluchtpunkt — kein
   Zurück; bei Sabotage zusätzlicher Umweg + Aktionsrunde + Spur.
4. **Flucht:** Ankunft am freien Fluchtpunkt = sofortiger Ganove-Sieg.
   [Quelle: `01-spielkonzept.md` §5]

### 4. Spielende

- Fang (Detektiv beendet Zug auf Ganoven-Knoten) oder Umzingelung (kein
  legaler Zug + keine Aktion) → Detektiv-Sieg.
- Flucht → Ganove-Sieg. Zeitlimit-Ablauf ohne Flucht → Detektiv-Sieg
  (außer „unbegrenzt": nur Fang/Flucht entscheidet).
- Vorzeitiger Abbruch → kann als Remis (`outcome: "draw"`) gezählt werden.
  [Quelle: `01-spielkonzept.md` §7, OT-29]

### 5. Entwicklungs-/Release-Ablauf (CI)

Feature-Branch → PR auf `staging` → Quality Gates (static checks ∥
build & test, no-pending-backmerge) → Merge → `staging-ci` erzeugt
RC-Prerelease `vX.Y.Z-rc.N` (**Pflicht-Artefakt pro Projektphase**) →
Promotion-PR `staging`→`main` (Draft) → Merge → `release.yml` erzeugt
finale Release mit Assets → Backmerge-PR `main`→`staging` (Merge-Commit!)
hält staging synchron. Wöchentlicher Security-Scan unabhängig davon.
Lokal: `pre-commit`-Warnungen, `pre-push`-Blocker (inkl. Verbot direkter
Pushes auf `main`/`staging`). [Quelle: `issue.md`,
`refs/ci-workflows-instructions.md`, `refs/git-hooks-readme.md`]

## Konfiguration

### Map-abhängige Einstellungen (pro Kartenpaket, OT-26)

Überschreibbar im Menü innerhalb `{ suggested, min, max }` — Münster-Startwerte:

| Parameter | Vorschlag | Bereich | Quelle |
|---|---|---|---|
| Detektivzahl | 4 | 2–6 | `04-balancing.md`, `02-technisches-konzept.md` §4 |
| Kameraanzahl | 8 | 0–15 | `04-balancing.md`, `02-technisches-konzept.md` §4 |
| Zeitlimit (Runden) | 30 | ≥ 15 oder `unlimited` | `04-balancing.md`, OT-09 |
| Polizeifunk-Tiefe | 5 Hinweise | 3–10 | `04-balancing.md`, `02-technisches-konzept.md` §4 |
| Kantensperr-Dauer | 3 Runden | 1–6 | `04-balancing.md`, `02-technisches-konzept.md` §4 |
| Ereignismodus/-kadenz | Spannung +10/Runde, Schwelle 40 | je Modus | `01-spielkonzept.md` §4.2 |

Feste Skalar-Eigenschaften pro Map (nicht im Menü überschreibbar):
`cameraMinGap` = 2, `hintZoneRadius` = 2, `eventMix` = 25/45/30,
`missionRules` (minGap 3, maxGap 8, routeBudget 18/22, sabotageDetour 4),
`sabotageEffects` = [kamera_aus, funkstille, falsche_spur],
`minDistanceToDetective` = 3, Hitze-Schwellen (0/1–2/3–4/≥5).
[Quelle: `02-technisches-konzept.md` §4, `04-balancing.md`, OT-26]

### Ereignismodi

`cycle` (Startwert: alle 4 Runden) · `chance` (Startwert: 25 %/Runde) ·
`tension` (**Default**: +10/Runde, Schwelle 40). [Quelle:
`01-spielkonzept.md` §4.2]

### Balancing-Zielwerte

~40–50 % Ganove-Siegquote; Sabotage-Annahme ~50/50; ~10 „harte" Anker
(exakte Hinweise) pro 30-Runden-Partie. [Quelle: `04-balancing.md`]

### Globale (nicht konfigurierbare) Regeln

Rundenstruktur, Fangbedingung, Hinweis-Grundsatz, Sabotage-Binärwahl,
Zugzwang. [Quelle: `02-technisches-konzept.md` §4, `04-balancing.md`]

## Akzeptanzkriterien

1. **Spielbarkeit:** Beide Spielmodi sind durchgängig spielbar — Mensch als
   Ganove vs. KI-Detektive (primär) und Mensch als Detektivtrupp vs.
   KI-Ganove; der Dev-Modus (KI-vs.-KI) läuft headless und zeichnet
   JSONL-Eventlogs auf. [Quelle: `01-spielkonzept.md` §6, OT-30]
2. **Regelwerk vollständig:** FA-01 bis FA-24 sind umgesetzt; insbesondere
   sind Informationsasymmetrie, Hinweisgrundsatz, Fangprüfung pro Einzelzug,
   Zugzwang, Sabotage-Binärwahl und alle fünf Endbedingungen korrekt —
   prüfbar u. a. über deterministische Replays gleicher Seeds.
3. **Missionen prüfbar:** Die Missionsgenerierung erfüllt die messbaren
   BFS-Kriterien (FA-17) — automatisiert validierbar.
4. **Karten:** `muenster.json` (~50 Knoten, echte Orte, Kategorien/Zonen)
   und `luebeck.json` (unbalancierte Validierungskarte) laden über
   `MapLoader.loadMap(id)` ohne Hartcodierung; Menü-Overrides respektieren
   die Map-Bereiche.
5. **Persistenz/Replay:** Save/Load stellt identische Zustände wieder her;
   der Replay-Player spielt Eventlogs deterministisch in beiden
   Perspektiven ab; Statistiken (Siegquote, Partienlänge,
   Hinweise/Kameratreffer) werden aus Logs aggregiert.
6. **i18n/A11y/Audio:** DE/EN vollständig über Schlüssel; Tastaturbedienung
   und farbenblind-sichere Darstellung umgesetzt; Sound-Dramaturgie für den
   Hitze-Indikator vorhanden.
7. **CI/CD:** Für jede Projektphase existiert eine Prerelease-Version
   (`vX.Y.Z-rc.N`) auf `staging`, die Stakeholder den Fortschritt erkennen
   lässt; PR-Gates (static checks, build & test mit Coverage,
   no-pending-backmerge, verify-pr-source) laufen; Promotion-, Release- und
   Backmerge-Workflows funktionieren; wöchentlicher Security-Scan ist
   eingerichtet. [Quelle: `issue.md`, `refs/ci-workflows-instructions.md`]
8. **Git-Hooks:** `pre-commit`/`pre-push` sind installierbar und aktiv;
   direkte Pushes auf `main`/`staging` werden lokal blockiert;
   mindestens die auf TS adaptierten Prüfungen der Vorlage plus
   projektspezifische Erweiterungen laufen. [Quelle: `issue.md`,
   `refs/git-hooks-readme.md`]
9. **Balancing messbar:** Eventlog-Metriken erlauben die Kalibrierung auf
   ~40–50 % Ganove-Siegquote und ~50/50-Sabotage-Abwägung. [Quelle:
   `04-balancing.md`, OT-23]
10. **Qualitätsanspruch:** Das Spiel soll sich als „professionelles Spiel
    auf Triple-A-Niveau" zeigen (`issue.md`). **Dieses Kriterium ist
    unscharf** — als messbaren Minimalanteil dokumentiert **[Annahme]**:
    keine bekannten spielblockierenden Fehler, konsistente und vollständig
    lokalisierte UI, reproduzierbare Builds/Releases. Konkrete
    Qualitätskriterien (Grafik-/Audio-Umfang, Referenzprodukte) sind zu
    klären — siehe „Offene Fragen".

## Nicht-Ziele

Explizit aus den Quellen bzw. der Aufgabenanweisung abgelehnt bzw.
verschoben:

1. **Multiplayer** — bewusst später (OT-36 „bewusst später";
   WebSockets/SignalR vorgesehen); lediglich die Architektur bereitet ihn
   vor (headless Store, deterministischer Seed-RNG). [Quelle:
   `00-uebersicht.md`, `02-technisches-konzept.md` §7, OT-36]
2. **OSM-Import** — kein Overpass/OSMnx im Prototyp; Karten werden
   handgefertigt auf Basis echter Topografie gebaut; als späteres Werkzeug
   dokumentiert. [Quelle: `01-spielkonzept.md` §8, OT-17]
3. **Kommerzielle Nutzung** — nicht Ziel dieser Anforderung
   (aus der Aufgabenanweisung; in den Konzeptquellen nicht explizit
   benannt).
4. **Hot-Seat** — verworfen: verdeckte Ganovenzüge würden am selben
   Bildschirm leaken. [Quelle: `01-spielkonzept.md` §6, OT-04]
5. **Sabotage-Effekt „Verkleidung"** — als möglicher vierter Effekt
   reserviert, aktuell **nicht** Teil des Angebots (Pool bleibt bei drei
   Effekten). [Quelle: `01-spielkonzept.md` §5.4, OT-16]
6. **Weitere Städte über Münster + Lübeck hinaus** — Auswahlmenü zeigt sie
   nur als „in Vorbereitung"; Kandidatenliste ist Dokumentation, kein
   Umsetzungsscope. [Quelle: `01-spielkonzept.md` §8, OT-18]

Weitere aus den Quellen ableitbare Nicht-Ziele/Verschiebungen:

7. **Schwierigkeits-Presets** (leicht/normal/schwer) — entschieden als
   *spätere* Menü-Erweiterung; die Map-Bereiche bleiben die harte Grenze.
   [Quelle: OT-32, `04-balancing.md`]
8. **KI-Training** — ausdrücklich kein Ziel des Eventlogs; das Format
   präjudiziert nichts. [Quelle: `02-technisches-konzept.md` §8]
9. **Self-Update-Manifeste** — `release-metadata.json` nur bei
   msTools.Updater-Nutzung nötig; trifft auf dieses Projekt nicht zu.
   `update.json` entfällt vermutlich ebenso (kein Self-Update im
   Browser-Spiel) — **[Annahme]**, in „Offene Fragen" gelistet. [Quelle:
   `refs/ci-workflows-instructions.md` §7]
10. **E2E-/Playwright-Gates** — die Vorlage sieht sie nur optional
    (best-effort, `continue-on-error`) vor; kein Muss. [Quelle:
    `refs/ci-workflows-instructions.md` §4]

## Offene Fragen

1. **„Triple-A-Niveau":** Was bedeutet der Qualitätsanspruch aus `issue.md`
   konkret und messbar (Grafikstil/-umfang, Audio-Umfang, Animationen,
   Referenzprodukte)? Welche Zusatztools (z. B. Grafikerstellung) werden
   benötigt und wie/wann sind sie anzufordern? [Quelle: `issue.md` —
   unscharf]
2. **CI-Adaption akzeptiert?** Die Vorlage ist .NET-basiert. Ist das in
   FA-38 beschriebene Mapping auf Node/Vite (Prettier/ESLint/`tsc`,
   vitest-Coverage, `npm audit`, `vite build`-Asset) die gewünschte
   Adaption? [Quelle: `refs/ci-workflows-instructions.md` vs. `issue.md`]
3. **Deploy-/Auslieferungsziel der Prereleases:** Wie konsumieren
   Stakeholder die Prerelease — als ZIP des statischen `vite build` im
   GitHub-Release, oder deployed auf Netlify/Vercel/eigenem Server?
   (`02-technisches-konzept.md` §10 nennt Optionen, ohne zu entscheiden;
   die CI-Vorlage liefert nur Release-Assets.) [Quelle:
   `02-technisches-konzept.md` §10 — unentschieden]
4. **Definition „Phase":** Welche Meilensteine/Entwicklungsschritte zählen
   als „Phase" im Sinne der Pflicht-Prerelease auf `staging`
   (Projektplan-Schritte, Feature-Blöcke)? [Quelle: `issue.md` — unscharf]
5. **update.json / Release-Assets:** Ist ein Update-Manifest für ein
   Browser-Spiel ohne Self-Update erforderlich oder entfällt es samt
   `release-metadata.json`? Welche Asset-Form soll das Release haben
   (ein Build-ZIP reicht vermutlich)? [Quelle:
   `refs/ci-workflows-instructions.md` §7 — **[Annahme]** entbehrlich]
6. **Coverage-Schwelle:** Die Vorlage empfiehlt 70 % Zeilenabdeckung — für
   dieses Projekt übernehmen oder anpassen? [Quelle:
   `refs/ci-workflows-instructions.md` §12]
7. **Git-Hooks-Detailumfang:** Welche konkreten TS-Prüfungen sollen die
   adaptierten Hooks durchführen (z. B. Format-/Lint-Check, Typecheck,
   Unittests, i18n-Vollständigkeit, Kartenpaket-Schema-Validierung)?
   **[Annahme]** Analogien zur .NET-Vorlage sind in FA-39 skizziert.
   [Quelle: `issue.md`, `refs/git-hooks-readme.md`]
8. **Branch-Protection-Einrichtung:** `main`/`staging` existieren remote;
   die Vorlage fordert Protection-Regeln (PR-Pflicht, erforderliche Checks,
   Labels `automated-promotion`/`automated-backmerge`). Wer richtet diese
   ein — vorhandene Rechte ausreichend? [Quelle:
   `refs/ci-workflows-instructions.md` §1]
