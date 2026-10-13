# Projektplan — Im Netz der Detektive

## Übersicht

Umsetzung des asymmetrischen Verfolgungsspiels „Im Netz der Detektive" gemäß
`requirement.md` (FA-01 bis FA-39) und der verbindlichen Spezifikation unter
`docs/konzept/content/` (`01-spielkonzept.md`, `02-technisches-konzept.md`,
`04-balancing.md`): Ein verdeckter Ganove erfüllt eine Mission im Wegenetz von
Münster, während offen spielende Detektive ihn über Hinweise, Kameras und
Ereignisse eingrenzen. Betroffene Bereiche: komplette Neuentwicklung der
Webanwendung (`src/` — Engine, State, UI, Kartenpakete), Projekt- und
Qualitätsinfrastruktur (Build, Tests, Git-Hooks, CI/CD mit Staging-Prereleases),
Spielinhalte (Karten Münster + Lübeck, Fälle), Persistenz/Replay, i18n/A11y/Audio
sowie Balancing und Endabnahme. Greenfield: außer Konzept-Dokumenten und dem
Doc-Viewer existiert kein Code.

## Grobe Vorgehensentscheidungen

| Bereich | Entscheidung | Begründung |
|---------|--------------|------------|
| Reihenfolge | **Scaffold-first:** Schritt 1 baut das Projekt-Grundgerüst samt kompletter Qualitätsinfrastruktur (Tests, Git-Hooks, CI-Workflows), bevor erste Fachlichkeit entsteht. | Ab Schritt 2 löst jeder Merge auf `staging` automatisch einen RC-Prerelease aus und alle Quality Gates (Format, Lint, Typecheck, Tests, Coverage, Security-Scan) greifen von Anfang an. Nachträgliches Einziehen einer Pipeline auf gewachsenen Code erzeugt Big-Bang-Nacharbeit. |
| Schichtung | **Engine vor UI:** Der gesamte Spielkern (Schritte 2–8) wird headless auf dem Zustand-Store gebaut, bevor Bildschirme entstehen (Schritte 9–13). | Der Store läuft per Vorgabe ohne UI (KI-vs.-KI treibt denselben Store). So ist das komplette Regelwerk inkl. Informationsasymmetrie ohne UI testbar; UI-Schritte bleiben dünne Anzeige-/Eingabeschichten. |
| Datenformate | **Kartenpaket-Format früh und gegen zwei echte Karten validieren:** Loader + Format in Schritt 2, Münster (~50 Knoten, echte Orte) und die kleine, bewusst unbalancierte Lübeck-Validierungskarte in Schritt 3. | Das Format ist eine verbindliche Schnittstelle (Multi-Stadt-fähig, nichts hartkodieren). Zwei unterschiedlich große Karten decken Formatlücken früh auf, bevor Engine- und UI-Schritte darauf aufbauen. |
| Aufzeichnung | **Eventlog bewusst nach den ereigniserzeugenden Systemen** (Schritt 7, nach Runden-, Informations- und Missionssystem): erst dann sind alle Event-Typen und Metriken bekannt. | Das JSONL-Format soll einmal vollständig definiert werden (Header, alle Event-Typen, `result`-Summary inkl. Balancing-Metriken). Früher eingeführt müsste es wiederholt erweitert werden. |
| Prerelease-Strategie | **Ein Entwicklungsschritt = eine „Phase":** Nach Merge eines Schritts in den Basisbranch wird der Stand zusätzlich auf `staging` gemergt/gepusht; `staging-ci` erzeugt pro Push einen versionierten RC-Prerelease (`vX.Y.Z-rc.N`). | FA-37 verlangt „mit jeder Phase" eine Prerelease; die Schrittgranularität ist die einzige messbare, automatisch erzwingbare Interpretation der unscharfen „Phase". Gröbere Bündelung (z. B. nur Meilensteine) wurde verworfen, weil sie Phasen willkürlich definiert und weniger Fortschritt sichtbar macht. |
| CI-Adaption | Die .NET-Vorlage wird **strukturtreu auf Node/Vite gemappt:** `npm ci` statt `dotnet restore`; Prettier/ESLint/`tsc --noEmit` statt `dotnet format`/Build als statische Checks; `vitest` mit Coverage-Schwelle statt `dotnet test` + ReportGenerator; `npm audit` statt NuGet-Vulnerability-Scan; ein `vite build`-ZIP als einziges Release-Asset. `update.json` und `release-metadata.json` entfallen (kein Self-Update im Browser-Spiel). | FA-38 fordert genau diese Adaption; die 7-Workflow-Struktur, die Quality Gates und die Promotion-/Backmerge-Mechanik der Vorlage bleiben unverändert — es ändern sich nur die konkreten Befehle und die Asset-Form. |
| CI-Cold-Start | `workflow_run`- und `push: main`-Trigger greifen erst, wenn die Workflow-Dateien auf `main` liegen. Der **erste `staging`→`main`-Promotion-PR wird einmalig manuell angelegt** (Vorlage §11.5); danach läuft die Kette automatisch. Ebenso sind nach dem ersten grünen CI-Lauf die Statuskontexte `static checks`, `build & test` und `no pending backmerge` als Pflicht-Checks in der Branch-Protection zu hinterlegen (aktuell leere `contexts`-Liste). | Bekannter Einmaleffekt der Vorlage — ohne den manuellen Erst-PR startet die Promotion-Kette still nie. Teil von Schritt 1. |
| Determinismus | **Ein zentraler Seeded-RNG ist von Schritt 2 an die einzige Zufallsquelle** in allen Engine-Modulen (kein `Math.random()`). | Deterministische Replays, KI-vs.-KI-Balancing-Simulationen und reproduzierbare Tests hängen daran; nachträgliches Entfernen versteckter Zufallsquellen wäre aufwendig und fehleranfällig. |
| Lokalisierung | **i18n-Schlüssel ab dem ersten UI-Schritt:** Alle sichtbaren Texte werden von Anfang an über Schlüssel geführt (DE und EN parallel mitwachsen); Schritt 13 prüft Vollständigkeit und ergänzt Sprachumschaltung, Barrierefreiheit und Audio. | FA-33 verlangt i18n „von Beginn an" — eine nachträgliche String-Extraktion über die gesamte UI wäre reine Verschwendung. |
| Asset-Strategie | **SVG-first plus KI-generierte Rasterillustrationen:** Karte, Icons und UI-Elemente werden handgefertigt als SVG-Vektorgrafik erstellt; ergänzend werden Rasterillustrationen (Titelbild, Texturen, Stadtbild-/Atmosphäre-Karten, Fall-Artworks) KI-generiert — primär über Pollinations.ai (kostenlose HTTP-Bild-API ohne Key), bei Bedarf über die Hugging-Face-Inference-API (kostenloses Kontingent; API-Token wird rechtzeitig vor Nutzung beim Nutzer angefordert). Audio bleibt prozedural (WebAudio). Alle generierten Assets werden gesichtet sowie qualitäts- und lizenzgeprüft und ausschließlich lokal ins Repo eingebettet — keine Hotlinks. | Der Nutzer hat die aufwändigere Qualitätsvariante gewählt: Das visuelle Niveau soll über reine SVG-Darstellung hinausgehen, ohne externe Grafiktools oder gekaufte Assets zu benötigen. Fotorealistische 3D-Grafik bleibt Nicht-Ziel; lokale Einbettung hält Builds und Releases reproduzierbar. |
| Scope-Disziplin | **Nicht-Ziele bleiben draußen:** kein Multiplayer, kein Hot-Seat, keine weiteren Städte über Münster + Lübeck hinaus (Auswahlmenü zeigt sie nur als „in Vorbereitung"), keine Schwierigkeits-Presets, kein OSM-Import, kein vierter Sabotage-Effekt, kein Self-Update-Manifest. | Verbindlich aus Anforderung und Entscheidungsarchiv; die Architektur bereitet Multiplayer lediglich implizit vor (headless Store, Seed-RNG), ohne etwas dafür zu bauen. |

## Entwicklungsschritte

### Schritt 1: Projekt-Scaffold und Qualitätsinfrastruktur

**Ziel:** Ein leeres, aber vollständig buildbares, testbares und releasefähiges
Vite/React/TypeScript-Projekt steht, inklusive aller Qualitätsgates: lokale
Git-Hooks (adaptiert auf TS/React) und die vollständige, auf Node/Vite
adapierte CI-Pipeline nach `refs/ci-workflows-instructions.md`.

**Beschreibung:** Es ist das Anwendungsgerüst für das Spiel „Im Netz der
Detektive" zu schaffen — ein Greenfield-Projekt; außer Konzept-Dokumenten
(`docs/konzept/`) existiert kein Code. Aufzusetzen ist eine Vite + React 18 +
TypeScript-Anwendung mit der im technischen Konzept festgelegten
Modulstruktur nach Feature-Slices (`src/components`, `src/logic`, `src/state`,
`src/data` — Ordner mit minimalen Platzhaltern, die kompilieren) und einer
minimalen App-Shell, die rendert. Zustand als State-Bibliothek und CSS-Module
(kein Tailwind) sind einzurichten. Die Qualitätswerkzeuge umfassen ESLint,
Prettier, `tsc --noEmit` und Vitest inklusive Coverage-Konfiguration (erzwungene
70-%-Zeilenabdeckung in `pr-staging-ci` und `staging-ci`) mit einem
ersten Beispieltest; `package.json` enthält alle Skripte (`dev`, `build`,
`test`, `lint`, `format`, `typecheck`, `coverage`, `release`). Die
`.gitignore` wird für ein Node/Vite-Projekt vervollständigt (`node_modules/`,
`dist/`, Coverage, `.env`, OS-/Editor-Dateien — bestehender `issue.md`-Eintrag
bleibt). Die Git-Hooks sind nach `refs/git-hooks-readme.md` auf TypeScript zu
adaptieren: `pre-commit` führt eine Warnstufe auf gestagten Dateien aus,
`pre-push` ein striktes Whole-Repo-Audit und blockiert direkte Pushes auf
`main`/`staging`; Install-Skripte setzen `core.hooksPath`. Die .NET-fokussierten
Python-Prüfungen der Vorlage sind funktional auf TS zu übertragen (u. a.
Stub-Erkennung analog `no-notimplemented-check.py`, i18n-Schlüssel-Parität
analog `translation-check.py`); eigene projektspezifische Prüfungen sind
erwünscht (z. B. Kartenpaket-Schema-Validierung, `Math.random()`-Verbot in
Engine-Modulen). Die CI-Pipeline ist vollständig aufzusetzen: alle sieben
Workflows (`verify-pr-source`, `pr-staging-ci` mit `detect-backmerge`,
parallelen `static-checks`/`build-and-test` und `no-pending-backmerge`,
`staging-ci` mit `version`- und `prerelease`-Job für `vX.Y.Z-rc.N`,
`staging-to-main-promotion`, `sync-staging-with-main`, `release` inkl.
manuellem `vX.Y.Z`-Tag-Pfad und Asset-Repair, wöchentlicher `security-scan`),
die Composite Actions `build-and-package` (`vite build` + einzelnes ZIP-Asset)
und `security-scan` (`npm audit`, blockierend), `release.config.js` mit
`conventionalcommits`-Preset inkl. aller semantic-release-DevDependencies sowie
`scripts/resolve-release-version.mjs` inkl. Unit-Tests und Prerelease-Guard.
Release-Asset ist genau ein ZIP des statischen Builds; `update.json`/
`release-metadata.json` entfallen (kein Self-Update). Teil des Schritts ist der
einmalige Cold-Start: Nach dem ersten Merge nach `staging` ist der erste
`staging`→`main`-Promotion-PR manuell anzulegen (die Workflows existieren erst
danach auf `main`), und nach dem ersten grünen CI-Lauf sind die
Pflicht-Statuskontexte `static checks`, `build & test` und
`no pending backmerge` in der Branch-Protection von `staging` via `gh`-API als
erforderliche Checks zu hinterlegen (autorisiert); `main` bleibt mit PR-Pflicht
wie gehabt geschützt.

**Akzeptanzkriterien:**
- `npm ci`, `npm run build`, `npm test` und `npm run typecheck` laufen lokal
  fehlerfrei durch; ESLint- und Prettier-Prüfung bestehen.
- Die Hooks sind via Install-Skript aktivierbar; `pre-push` blockiert einen
  Push auf `main`/`staging` nachweisbar lokal.
- Alle sieben Workflow-Dateien und beide Composite Actions existieren und sind
  YAML-valide; `pr-staging-ci` und `staging-ci` erzwingen dabei die
  70-%-Zeilenabdeckung; `release.config.js` und
  `scripts/resolve-release-version.mjs` inkl. Unit-Tests liegen vor.
- Ein Push auf `staging` erzeugt automatisch eine RC-Prerelease `vX.Y.Z-rc.N`
  mit dem Build-ZIP als Asset; der erste `staging`→`main`-Promotion-PR ist
  (einmalig manuell) angelegt; die Branch-Protection verlangt die drei
  Statuskontexte.

**Abhängigkeiten:** Keine

**Betroffene Bereiche:** Projektinfrastruktur, Build/Test, CI/CD,
Qualitätssicherung (Git-Hooks)

### Schritt 2: Engine-Grundgerüst — Kartenpakete, Graph, Zufall, Startaufstellung

**Ziel:** Der headless-fähige Spielkern kann Kartenpakete laden und validieren,
liefert Graph-Grundfunktionen (inkl. BFS-Distanzen), einen zentralen
deterministischen Zufallszahlengenerator und das Startaufstellungs-System
gemäß Kartenpaket-Regeln.

**Beschreibung:** Es ist die technische Basis des Spiels zu implementieren,
ohne jede UI — verbindliche Spezifikation ist `02-technisches-konzept.md` §3/§4.
Das Kartenpaket-Format ist zu unterstützen: JSON-Pakete mit Pflichtfeldern
`nodes[]` (id, name, x, y, categories[], zone), `edges[]` (a, b, type ∈
`weg`/`fahrt`; `cost` reserviert), `spawnRules` (Modi `choice`/`free`/`random`
pro Seite, optionales `minDistanceToDetective`, `order` detektive-zuerst) und
`settings` (topologieskalierende Werte als `{suggested, min, max}` bzw.
`roundLimit` mit `unlimited`; feste Skalarfelder `cameraMinGap`,
`hintZoneRadius`, `eventMode`/`eventDefaults`, `eventMix`, `missionRules`,
`sabotageEffects`) sowie `viewBox`. Ein Lader (`loadMap(id)`) validiert Pakete
vollständig und meldet Fehler verständlich. Graph-Hilfsfunktionen liefern
Nachbarschaften und BFS-Kantendistanzen (Grundlage für spätere
Generierungskriterien, Zonenhinweise und Kameraabstände). Ein zentraler
Seeded-RNG ist die einzige Zufallsquelle aller Engine-Module — gleicher Seed
ergibt identische Folgen; `Math.random()` ist im Engine-Code verboten. Das
Spawn-System platziert gemäß Kartenpaket: immer Detektive zuerst, der Ganove
als Letzter; bei `choice` wird die erlaubte Knotenliste angeboten, bei `free`
alle Knoten mit Mindestabstand zu den bereits platzierten Detektiven, bei
`random` vergibt der RNG — Positionen unterhalb des Mindestabstands werden
grundsätzlich nicht angeboten. Der Zustand-Store wird mit den spezifizierten
State-Feldern (round, phase, Positionen, mission, events, cameras,
blockedEdges, eventMode, tensionValue, seed, log) und imperativen Actions
angelegt und muss ohne React lauffähig sein.

**Akzeptanzkriterien:**
- Gültige Test-Kartenpakete laden fehlerfrei; ungültige/fehlerhafte Pakete
  werden mit verständlicher Fehlermeldung abgelehnt (fehlende Pflichtfelder,
  ungültige Kantentypen, Referenzfehler).
- BFS-Distanzen auf einem Fixture-Graphen sind nachweisbar korrekt.
- Gleicher Seed produziert identische Zufallsfolgen und identische
  Startaufstellungen; verschiedene Seeds variieren.
- Alle drei Spawn-Modi funktionieren; die Reihenfolge Detektive-vor-Ganove wird
  erzwungen; kein angebotener Ganoven-Startpunkt unterschreitet
  `minDistanceToDetective`.
- Der Store lässt sich headless (ohne UI) instanziieren und treiben.

**Abhängigkeiten:** 1

**Betroffene Bereiche:** Kartenpaket-Format, Engine-Grundlage (Graph, RNG),
Startaufstellung, State

### Schritt 3: Kartenpakete Münster und Lübeck

**Ziel:** Zwei echte, spielbare Kartenpakete liegen vor: die Hauptkarte
Münster (~50 Knoten auf realer Topografie mit echten Orten) und die kleine,
bewusst unbalancierte Lübeck-Altstadtinsel als Validierungskarte für den
Lader.

**Beschreibung:** Es sind die beiden Kartenpakete des Prototyp-Scope zu erstellen
(Spezifikation: `01-spielkonzept.md` §2/§8, `02-technisches-konzept.md` §4,
`04-balancing.md`). `muenster.json`: 45–60 Knoten mit echten, wiedererkennbaren
Orten (Hauptbahnhof, Domplatz, Schloss, Aasee, Hafen, Prinzipalmarkt o. ä.),
~90–110 Kanten, Ø-Knotengrad 3–4, beide Kantentypen (`weg` dicht, `fahrt` als
seltene Fernverbindungen), jeder Knoten mit `categories` (diebstahl/kontakt/
sabotage/flucht — je Kategorie genügend Knoten für die Missionsgenerierung),
`zone` und plausiblen `x`/`y`-Koordinaten auf echter Topografie. `spawnRules`
und `settings` tragen die Münster-Startwerte: Detektive 4 (2–6), Kameras 8
(0–15), Zeitlimit 30 (ab 15, unbegrenzt erlaubt), Polizeifunk-Tiefe 5 (3–10),
Kantensperr-Dauer 3 (1–6), `cameraMinGap` 2, `hintZoneRadius` 2, Ereignismodus
Spannung (+10/Runde, Schwelle 40; Alternativen Zyklus 4 / Chance 25 %),
Ereignismischung 25/45/30, Missionsregeln minGap 3/maxGap 8/Routenbudget 18/22/
Sabotage-Umweg 4, alle drei Sabotage-Effekte, `minDistanceToDetective` 3.
`luebeck.json`: kleine Altstadtinsel-Karte, bewusst unbalanciert, mit eigenen
Orten, Kategorien, Zonen, Spawn-Regeln und angepassten Settings — sie soll den
Lader und die Settings-Bereiche gegen ein zweites, strukturell anderes Paket
testen. Beide Pakete müssen ohne Hartcodierung über `loadMap(id)` laden; der
Graph muss zusammenhängend sein.

**Akzeptanzkriterien:**
- Beide Pakete bestehen die Loader-Validierung; `loadMap("muenster")` und
  `loadMap("luebeck")` liefern vollständige Kartenobjekte.
- Münster erfüllt die Strukturmetriken automatisiert geprüft: 45–60 Knoten,
  ~90–110 Kanten, Ø-Grad 3–4, zusammenhängend, alle vier Kategorien mit
  mehreren Knoten vertreten, mindestens eine `fahrt`-Kante.
- Die Settings-Bereiche beider Karten entsprechen dem Format
  `{suggested, min, max}` bzw. den festen Skalarfeldern.
- Automatisierte Prüfung bestätigt, dass auf dem Münster-Graphen die
  Missions-Generierungskriterien grundsätzlich erfüllbar sind (ausreichend
  Kandidaten je Kategorie, Distanzstruktur).

**Abhängigkeiten:** 2

**Betroffene Bereiche:** Kartenpakete/Spielinhalte, Balancing-Startwerte

### Schritt 4: Rundenablauf, Bewegung und Spielende

**Ziel:** Der komplette Rundenmotor läuft headless: Zwei-Phasen-Runden mit
fester Detektivreihenfolge, alle Bewegungsregeln inkl. Zugzwang, die
Fangprüfung nach jedem Einzelzug und alle fünf Endbedingungen.

**Beschreibung:** Auf dem Store und dem Kartengraphen ist der Spielablauf zu
implementieren (Spezifikation: `01-spielkonzept.md` §3/§7). Jede Runde hat zwei
Phasen: zuerst der Ganove (ein Zug auf einen legalen Nachbarknoten — oder
später eine Aktionsrunde), dann die Detektive einzeln in fester Reihenfolge
D1→Dn. Bewegungsregeln: 1 Zug = 1 Kante (beide Kantentypen); Zugzwang für alle
— niemand darf freiwillig stehen bleiben (einzige Ausnahme: die Aktionsrunde
des Ganoven, deren Mechanik im Missionsschritt folgt; die Struktur für die
Ausnahme ist jetzt vorzusehen); von Detektiven besetzte Knoten sind für den
Ganoven illegale Ziele; mehrere Detektive dürfen denselben Knoten teilen;
gesperrte Kanten sind für beide Seiten unpassierbar (Sperrungen entstehen im
Informationsschritt — die Bewegungsprüfung berücksichtigt sie bereits); keine
Fangprüfung auf Kanten. Endbedingungen: Fang (ein Detektiv beendet seinen
Einzelzug auf dem Ganoven-Knoten — Sofortprüfung, Partie endet sofort mitten
in der Detektivphase); Umzingelung (der Ganove hat zu Phasenbeginn keinen
legalen Zug und keine ausführbare Aktion → Fang; die Aktionsverfügbarkeit ist
als Prüfpunkt vorzusehen und wird vom Missionssystem befüllt); Flucht (der
Ganove erreicht einen als Fluchtpunkt markierten, unbesetzten Knoten →
Ganove-Sieg; ein besetzter Fluchtpunkt ist nur temporär illegales Ziel);
Zeitlimit (Ablauf ohne Flucht → Detektiv-Sieg; einstellbar, inkl. „unbegrenzt"
— dann entscheiden nur Fang/Flucht); Remis (vorzeitiger Abbruch kann als
Unentschieden mit `outcome: "draw"` gewertet werden). Runden- und
Phasenzähler sind korrekt zu führen.

**Akzeptanzkriterien:**
- Skriptgesteuerte Testpartien belegen: legale/illegale Züge werden korrekt
  validiert (Nachbarschaft, besetzte Knoten für den Ganoven, gesperrte Kanten),
  Detektive dürfen Knoten teilen.
- Die Fangprüfung nach jedem Einzelzug beendet die Partie sofort — auch wenn
  weitere Detektive noch nicht gezogen haben.
- Umzingelung wird erkannt (kein legaler Zug, keine Aktion → Detektiv-Sieg).
- Zeitlimit-Ende liefert Detektiv-Sieg; die Einstellung „unbegrenzt" deaktiviert
  die Zeitbedingung nachweisbar.
- Flucht am freien Fluchtpunkt liefert Ganove-Sieg; Abbruch kann als Remis
  (`draw`) gewertet werden.
- Alles läuft deterministisch über den Seed headless.

**Abhängigkeiten:** 2, 3

**Betroffene Bereiche:** Rundenablauf, Bewegungsregeln, Spielende/Endbedingungen

### Schritt 5: Informationssystem — Kameras, Ereignisse, Hinweise, Polizeifunk, Hitze

**Ziel:** Die komplette Informationsschicht erzeugt und verteilt sämtliche
Informationen regelkonform: Kameras, drei Ereignis-Auslösemodi, drei
Ereignistypen, vergangenheitsbezogene Hinweise nur für Detektive, einmaliger
Polizeifunk und der 4-stufige Hitze-Indikator für den Ganoven.

**Beschreibung:** Es ist das Informationssystem gemäß `01-spielkonzept.md` §4
und `04-balancing.md` zu implementieren. Kameras: Beim Spielstart werden N
Kameras (Karten-Setting) zufällig per RNG verteilt — Mindestabstand
`cameraMinGap` Kanten untereinander, Ausschlussliste geschützter Knoten (wird
später mit den Missionszielknoten belegt); dauerhaft aktiv; bei Betreten durch
den Ganoven erzeugen sie einen Hinweis mit exaktem Knoten + Auslöserunde, nur
für Detektive sichtbar; der Ganove erfährt Kamerapositionen nie (Ausnahme
Polizeifunk). Ereignisse: drei einstellbare Auslösemodi — fester Zyklus,
prozentuale Wahrscheinlichkeit, Spannungsbalken (+Wert/Runde, Schwelle,
Reset nach Auslösung) — mit den Karten-Defaults; die Typmischung folgt
`eventMix`: Sichtbarkeit (exakter aktueller Knoten, nur für die laufende
Runde), Hinweis/Zeuge (zonenbasiert, Radius `hintZoneRadius` Kanten), Umwelt
(sperrt eine zufällige Kante für `edgeBlockRounds`, beidseitig sichtbar und
wirksam — nie die letzte freie Kante eines Knotens, nie soweit, dass der Graph
zerteilt würde; ein Konnektivitäts-/Isolations-Check ist Pflicht).
Ganovenaktionen sind keine Zufallsereignisse. Hinweisgrundsatz: Hinweise
zeigen, wo der Ganove *war*, nie wo er *ist* — exakte Knotenangaben nur
vergangenheitsbezogen; einzige Live-Ausnahme ist das Sichtbarkeitsereignis;
nur Detektive sehen Hinweise. Polizeifunk: einmal pro Partie; liefert dem
Ganoven die letzten N Hinweise (`radioHintCount`) mit Typ und Runde inklusive
Kameraauslösungen; keine unentdeckten Kameras, keine kommenden Ereignisse.
Hitze-Indikator: 4 Stufen (ruhig/aktiv/erhöht/kritisch) aus gewichteter
Hinweisaktivität der letzten 3 Runden (Zonen-Hinweis +1, Kamera +2,
Aktions-Spur +2, Sichtbarkeit +3; Schwellen 0/1–2/3–4/≥5); zeigt *wie viel*
die Detektive wissen, nie *was/woher*. Die Informationsasymmetrie (FA-02) ist
zentral durchzusetzen: Sichtbarkeiten sind datenseitig getrennt
(`visibleTo`-Prinzip), nicht erst in der Anzeige.

**Akzeptanzkriterien:**
- Kameraplatzierung hält den Mindestabstand und die Ausschlussliste über viele
  Seeds ein; Auslösung erzeugt den exakten Knoten-Hinweis nur für Detektive.
- Alle drei Auslösemodi erzeugen die spezifizierte Kadenz (Zyklus deterministisch;
  Chance statistisch; Spannungsbalken garantiert ~alle 4 Runden bei Defaults).
- Die Typmischung nähert sich über viele Züge 25/45/30 an; Umweltsperrungen
  zerteilen den Graphen nie und blockieren nie die letzte freie Kante.
- Kein Hinweis verrät die Live-Position (außer dem Sichtbarkeitsereignis, das
  nach der Runde verfällt); Hinweise sind ausschließlich detektivsichtig.
- Polizeifunk funktioniert genau einmal und liefert exakt die letzten N
  Hinweise inkl. Kameratreffern.
- Der Hitze-Level entspricht exakt der Gewichtungstabelle über einem
  3-Runden-Fenster.
- Automatisierte Prüfung der Asymmetrie: Ganoven-Sicht enthält weder Kameras,
  Hinweise noch hinweisgebende Ereignisse.

**Abhängigkeiten:** 4

**Betroffene Bereiche:** Informationssystem (Kameras, Ereignisse, Hinweise),
Spezialfähigkeit Polizeifunk, Hitze-Indikator

### Schritt 6: Missionssystem — Generierung, Aktionen, Sabotage und Fälle

**Ziel:** Missionen werden in der festen Reihenfolge Diebstahl → Kontakt →
Binärwahl (Sabotage oder Flucht) generiert und gespielt — mit automatisiert
prüfbaren BFS-Generierungskriterien, Aktions-Spur-Hinweisen, dem
Sabotage-Angebot des Informanten und benannten vordefinierten „Fällen".

**Beschreibung:** Es ist das Missionssystem gemäß `01-spielkonzept.md` §5 zu
implementieren. Die Missionsgenerierung zieht aus den Kategorie-Pools der
Karte per RNG Zielknoten und muss die messbaren Kriterien einhalten (per
BFS-Distanz prüfbar): Paardistanz aller Missionsziele ≥ `minGap` Kanten;
aufeinanderfolgende Ziele 3–`maxGap` Kanten; kürzeste Route
Start→Diebstahl→Kontakt→Flucht + 3 Aktionsrunden ≤ `routeBudget` (mit
Sabotage ≤ `routeBudgetSabotage`); Fluchtpunkt ≥ 4 Kanten vom Kontakt- und ≥ 3
vom Diebstahlziel; Sabotage-Umweg ≤ `sabotageDetour` gegenüber dem Direktweg.
Nicht konforme Ziehungen werden verworfen, bis eine gültige Mission entsteht.
Aktionsausführung: Betreten ≠ Aktion — am Zielknoten wählt der Ganove in
seiner Phase „ausführen" (verharrt, voll verwundbar, kostet die Bewegung der
Runde) oder zieht weiter; die Aktion erzeugt einen exakten Spur-Hinweis, der
für die Detektive vor ihren Zügen derselben Runde sichtbar ist (in die
Hitze-Wertung eingehend). Nach der Kontakt-Aktion bietet der Informant im
selben Schritt ein Sabotageziel mit einem zufällig gezogenen Effekt aus dem
Karten-Pool (Kameras deaktivieren für den Rest der Partie / Funkstille für N
Runden keine hinweisgebenden Ereignisse / falsche Spur mit irreführenden
Hinweisen) an; der Ganove sieht Sabotageziel und Fluchtpunkt und trifft die
Binärwahl — kein Zurück; der Kontakt-Hinweis verrät die Wahl nicht. Flucht =
Sieg bei Ankunft am freien Fluchtpunkt, ohne Aktionsrunde; die
Umzingelungs-Prüfung berücksichtigt jetzt echte Aktionsverfügbarkeit.
Missionsvarianten: zufallsgeneriert (wie oben), vordefinierte „Fälle" als
benannte Szenarien mit Mini-Story in JSON-Missionssets pro Karte (mindestens
zwei Fälle für Münster) und spielerdefiniert (Zielknoten wählbar, Validierung
gegen Kategorien und Kriterien). Die Kameraplatzierung schließt jetzt die
konkreten Missionszielknoten aus (öffentliche Regel).

**Akzeptanzkriterien:**
- Über viele Seeds erzeugte Missionen erfüllen ausnahmslos alle
  BFS-Generierungskriterien — automatisiert verifiziert.
- Die feste Reihenfolge Diebstahl → Kontakt → Binärwahl wird erzwungen; Ziele
  sind erst erreichbar/ausführbar, wenn die Mission sie freigibt.
- Eine Aktionsausführung verbraucht die Ganoven-Bewegung, lässt ihn stehen
  und verwundbar und erzeugt den Spur-Hinweis vor der Detektivphase.
- Das Sabotage-Angebot erscheint direkt nach der Kontakt-Aktion; die
  Binärwahl ist endgültig; alle drei Effekte wirken nachweisbar (Kameras aus,
  Funkstille unterdrückt Hinweise für N Runden, falsche Spur erzeugt
  irreführende Hinweise); der Kontakt-Hinweis leakt die Wahl nicht.
- Missionszielknoten sind garantiert kamerafrei.
- Fälle-Missionssets laden pro Karte und sind spielbar; spielerdefinierte
  Missionen werden validiert.

**Abhängigkeiten:** 5

**Betroffene Bereiche:** Missionssystem, Sabotage, Szenarien („Fälle")

### Schritt 7: Eventlog, Aufzeichnung und Export

**Ziel:** Jede Partie wird vollständig als JSONL-Eventlog aufgezeichnet, ist
über den Seed deterministisch rekonstruierbar, und kann exportiert sowie
automatisch vorgehalten werden — als Datenbasis für Replay, Statistiken und
Balancing.

**Beschreibung:** Es ist das Eventlog gemäß `02-technisches-konzept.md` §8 zu
implementieren. Das Log ist event-sourced: eine `header`-Zeile (gameId,
mapId, seed, config, mission, cameras, starts), danach sequenzierte Events
(`seq`, `round`, `type`, `actor`, `visibleTo`, …) für alle Spielvorgänge —
Startaufstellung, Züge (inkl. Kantentyp), Kameraauslösungen, Ereignisse je Typ,
Kantensperrungen und deren Ablauf, Hinweise, Aktionsausführungen/Spuren,
Sabotage-Angebot und -Wahl, Polizeifunk-Einsatz, Spuren der Ereignisauslösung
— sowie eine abschließende `result`-Zeile mit `outcome` (inkl. `"draw"`) und
den Balancing-Metriken (Rundenzahl, Hinweise gesamt, Kameratreffer u. a.).
Zentrale Anforderung: Das Log ist via Seed vollständig rekonstruierbar —
gleicher Seed und gleiche Eingaben erzeugen identische Zustände und identische
Logs; der zentrale RNG bleibt einzige Zufallsquelle. Export: ein
„Partie exportieren"-Mechanismus lädt das Log als Datei (Blob-Download);
zusätzlich werden die letzten N Partien automatisch in `localStorage`
vorgehalten.

**Akzeptanzkriterien:**
- Vollständige Testpartien erzeugen valide JSONL-Logs mit Header, allen
  Event-Typen und `result`-Summary inkl. Metriken und `outcome`.
- Bei gleichem Seed und gleichen Eingaben ist das Log bitgleich
  reproduzierbar; die Zustandsrekonstruktion aus Header + Seed stimmt mit dem
  Originalzustand überein.
- `visibleTo` ist auf allen Events korrekt gesetzt (Grundlage für die spätere
  Perspektiven-Wiedergabe).
- Export erzeugt eine herunterladbare JSONL-Datei; `localStorage` hält die
  letzten N Logs (FIFO), auch über Sitzungen hinweg.
- Das `result`-Event enthält die Balancing-Metriken in auswertbarer Form
  (Runden bis Fang/Flucht, Hinweise/Partie, Kameratreffer).

**Abhängigkeiten:** 6

**Betroffene Bereiche:** Eventlog/Aufzeichnung, Determinismus,
Persistenz-Grundlage

### Schritt 8: Deduktion und KI — Detektiv-KI, Ganove-KI, KI-vs.-KI-Modus

**Ziel:** Eine geteilte Deduktions-Datenstruktur berechnet alle mit den
Hinweisen konsistenten Ganoven-Positionen; darauf aufsetzend spielen eine
glaubwürdige Detektiv-KI und eine Ganove-KI — zusammen ermöglichen sie den
headless KI-vs.-KI-Dev-Modus als Balancing-Werkzeug.

**Beschreibung:** Es ist die KI-Seite des Spiels zu implementieren
(`01-spielkonzept.md` §6, `02-technisches-konzept.md` §5). Die
Deduktions-Datenstruktur pflegt die Menge aller Knoten, die mit den bisherigen
Hinweisen konsistent sind: exakte Hinweise (Kamera, Aktions-Spur,
Sichtbarkeit) und Zonen-Hinweise werden als Constraints über den Graphen und
die vergangenen Runden ausgewertet (Positionsverläufe, nicht nur Punktmengen);
die Struktur wird später identisch für das UI-Overlay und intern von der
Detektiv-KI genutzt. Die Detektiv-KI steuert alle Detektive als eine Instanz:
Heuristik „auf den letzten Hinweis zusteuern + mögliche Positionen
eingrenzen" (Aufteilen/Einkreisung statt Einzelverfolgung); sie kennt nur die
detektivseitig erlaubten Informationen — Missionsstruktur und Ziel-Pools ja,
gezogene Zielknoten und Ganovenposition nie (kein Campen auf Zielen). Die
Ganove-KI verfolgt die Mission: Routenwahl Richtung aktuelles Ziel,
Aktions-Timing (z. B. nicht bei hoher Hitze bzw. wenn Detektive nahe sind),
sinnvoller Polizeifunk-Einsatz, Abwägung der Sabotage-Binärwahl (Umweg vs.
Effekt). Beide KIs treiben denselben Store und denselben RNG. Der
KI-vs.-KI-Dev-Modus läuft komplett headless: konfigurierbare Batch-Läufe
(viele Seeds) spielen Partien zu Ende und schreiben Eventlogs —
Balancing-Werkzeug, kein Spielmodus.

**Akzeptanzkriterien:**
- Die Deduktions-Menge ist in skriptierten Szenarien exakt korrekt und wird
  mit jedem Hinweis monoton enger bzw. korrekt eingeschränkt; sie enthält die
  tatsächliche Ganovenposition immer (kein falscher Ausschluss).
- Die Detektiv-KI übt messbaren Druck aus (fängt den Ganove in einem
  relevanten Anteil von Simulationspartien) und verwendet nachweisbar keine
  verbotenen Informationen.
- Die Ganove-KI kann Missionen zu Ende führen und gewinnt in einem relevanten
  Anteil von Simulationspartien.
- Batch-Läufe von N KI-vs.-KI-Partien unterschiedlicher Seeds laufen headless
  zu regulären Endbedingungen und erzeugen vollständige Eventlogs —
  reproduzierbar je Seed.
- Kein `Math.random()` und kein Informations-Leak in den KI-Modulen
  (instrumentiert prüfbar).

**Abhängigkeiten:** 7

**Betroffene Bereiche:** Deduktion, Detektiv-KI, Ganove-KI,
KI-vs.-KI-Simulation/Balancing-Werkzeug

### Schritt 9: Ganove-Perspektive (Primärmodus)

**Ziel:** Der primäre Spielmodus ist vollständig spielbar: Der Mensch spielt
den Ganoven gegen die KI-Detektive — mit SVG-Kartenansicht, allen
ganovenseitigen Informationen und dem kompletten Missions-Aktionsfluss.

**Beschreibung:** Es ist die GanoveUI gemäß `02-technisches-konzept.md` §4/§6
und `01-spielkonzept.md` §1 zu bauen (React, CSS-Module; alle Texte ab jetzt
über i18n-Schlüssel DE/EN). Die geteilte Kartenkomponente rendert die Karte
als SVG aus `viewBox`/Koordinaten: Knoten, Kanten beider Typen, gesperrte
Kanten ausgegraut, Detektiv-Icons — in dieser Ansicht zusätzlich der eigene
Ganoven-Marker; Kamera-Icons und Hinweise erscheinen hier grundsätzlich nicht
(Informationsasymmetrie). Die Ansicht zeigt: eigene Position mit hervorgehobenen
legalen Nachbarknoten (besetzte Detektivknoten und gesperrte Kanten werden
nicht angeboten), alle Detektivpositionen exakt, den Missionsfortschritt
(aktuelles Ziel, Reihenfolge), gesperrte Kanten, den Hitze-Indikator als Badge
mit Icon + Text (nicht nur Farbe) und den Polizeifunk-Button (einmalig).
Am Zielknoten bietet die UI „Aktion ausführen" oder Weiterziehen an; nach der
Kontakt-Aktion erscheint die Sabotage-Binärwahl (Sabotageziel oder Fluchtpunkt
mit angezeigtem Effekt — endgültige Wahl). Partien starten in diesem Schritt
mit Standardkonfiguration und generierter Mission (das vollwertige Menü folgt
später). Sieg-/Niederlagen-Zustände (Fang, Umzingelung, Flucht, Zeitlimit,
Remis) werden verständlich angezeigt.

**Akzeptanzkriterien:**
- Eine komplette Partie Mensch-Ganove vs. KI-Detektive ist von der
  Startaufstellung bis zu jedem der Endzustände durchspielbar.
- Die Ansicht enthält alle geforderten Elemente: eigene Position + legale
  Nachbarknoten, Detektivpositionen, Missionsfortschritt, gesperrte Kanten,
  Hitze-Badge, Polizeifunk-Button.
- Illegale Züge (besetzte Knoten, gesperrte Kanten, Nicht-Nachbarn) werden in
  der UI nicht angeboten.
- Die Ganoven-Ansicht zeigt nachweisbar weder Kameras noch Hinweise/Ereignisse.
- Aktionsfluss inkl. Sabotage-Binärwahl ist bedienbar und wirkt regelkonform;
  Flucht am Fluchtpunkt endet die Partie als Ganove-Sieg.

**Abhängigkeiten:** 8

**Betroffene Bereiche:** UI Ganoven-Perspektive, SVG-Kartendarstellung

### Schritt 10: Detektiv-Perspektive mit Deduktions-Werkzeugen

**Ziel:** Der zweite Spielmodus ist vollständig spielbar: Der Mensch steuert
alle Detektive gegen die KI-Ganove — mit detektivseitiger Karte, Hinweis-Chronik
und den drei Deduktions-Werkzeugen.

**Beschreibung:** Es ist die DetektiveUI gemäß `02-technisches-konzept.md` §4/§6
und `01-spielkonzept.md` §6 zu bauen (i18n-Schlüssel weiterhin Pflicht). Die
geteilte Kartenkomponente zeigt in dieser Perspektive: die vollständige Karte
inkl. Ortskategorien und Zonen, Kamera-Icons (nur hier sichtbar), die eigenen
Detektivpositionen, gesperrte Kanten — der Ganove bleibt unsichtbar. Die
Steuerung führt D1→Dn in fester Reihenfolge durch ihre Einzelzüge (legale
Ziele anbieten; Fangprüfung je Zug). Die Deduktions-Werkzeuge umfassen:
Hinweis-Chronik (alle Hinweise mit Typ, Ort/Zone und Runde, chronologisch),
Marker (Knoten manuell markieren und kommentieren) und das
„Mögliche-Positionen"-Overlay, das exakt die aus der Deduktions-Datenstruktur
berechnete konsistente Knotenmenge auf der Karte hervorhebt und sich mit jedem
Hinweis einengt. Die UI zeigt außerdem die Missionsstruktur — Reihenfolge und
Ziel-Pools — aber nie die gezogenen Zielknoten. Ereignisse (inkl. beidseitig
sichtbarer Umweltsperrungen) werden angezeigt; Endzustände sind verständlich
dargestellt.

**Akzeptanzkriterien:**
- Eine komplette Partie Mensch-Detektive vs. KI-Ganove ist von der
  Startaufstellung bis zu jedem Endzustand durchspielbar.
- Die Hinweis-Chronik listet alle Hinweise mit Typ, Ort/Zone und Runde
  vollständig und in Reihenfolge.
- Marker lassen sich setzen, kommentieren und bleiben über Runden erhalten.
- Das Overlay zeigt exakt die Deduktions-Menge (konsistente Knoten) — geprüft
  gegen die Engine-Berechnung.
- Die Ansicht zeigt nachweisbar nie den Ganoven und nie die gezogenen
  Missionszielknoten; Kamera-Icons erscheinen ausschließlich in dieser
  Perspektive.

**Abhängigkeiten:** 8, 9

**Betroffene Bereiche:** UI Detektiv-Perspektive, Deduktions-Werkzeuge

### Schritt 11: Menü, Einstellungen und Szenarien-Auswahl

**Ziel:** Ein vollständiger Anwendungsrahmen führt in die Partie: Hauptmenü,
Karten-Auswahl, Modus-Auswahl, Einstellungen innerhalb der Karten-Bereiche
und Missions-/Fall-Auswahl inklusive Startaufstellungs-Flow.

**Beschreibung:** Es ist der Menü- und Einstiegsbereich gemäß
`01-spielkonzept.md` §2/§5.2/§8 und `02-technisches-konzept.md` §4 zu bauen.
Das Hauptmenü bietet: neue Partie, Partie fortsetzen (wird mit dem
Persistenz-Schritt befüllt; Eintragstruktur jetzt vorsehen) sowie Statistiken/
Replay (dito). Die Karten-Auswahl listet Münster und Lübeck (mit Name/Tagline)
und zeigt weitere Städte nur als „in Vorbereitung" (Nicht-Ziel: keine weiteren
Karten). Für Menü- und Auswahlbildschirme können hier bereits die ersten
KI-generierten Rasterillustrationen einfließen (z. B. Titelbild im Hauptmenü,
Stadtbild-/Atmosphäre-Karten in der Karten-Auswahl); wird dafür die
Hugging-Face-Inference-API benötigt, ist der API-Token rechtzeitig vor Nutzung
beim Nutzer anzufordern — alle generierten Assets werden nach Sicht- und
Lizenzprüfung lokal ins Repo eingebettet (keine Hotlinks). Die Modus-Auswahl
bietet Ganoven-Perspektive, Detektiv-Perspektive
und den Dev-Modus (KI-vs.-KI mit Aufzeichnung). Das Einstellungs-Formular
liest pro gewählter Karte die `{suggested, min, max}`-Bereiche aus dem Paket
und lässt Überschreibungen nur innerhalb davon zu: Detektivzahl, Kameraanzahl,
Zeitlimit inkl. „unbegrenzt", Polizeifunk-Tiefe, Kantensperr-Dauer,
Ereignismodus und -kadenz; Vorschläge sind vorausgewählt. Die Missions-Auswahl
bietet: einen vordefinierten „Fall" (benannte Szenarien mit Mini-Story aus dem
Missionsset der Karte), zufallsgeneriert oder spielerdefiniert (Zielknoten per
Karte wählen, Validierung). Anschließend läuft die Startaufstellung gemäß
`spawnRules` der Karte: Detektive zuerst, Ganove als Letzter — bei Wahl-Modi
interaktiv (unerlaubte Positionen unter Mindestabstand werden nicht
angeboten), bei `random` automatisch.

**Akzeptanzkriterien:**
- Alle Einstellungen sind auf die Bereiche der gewählten Karte begrenzt;
  ungültige Werte werden verweigert; „unbegrenzt" ist beim Zeitlimit wählbar,
  wo die Karte es erlaubt.
- Karten-, Modus- und Missions-Auswahl führen korrekt in den Spielstart; Fälle
  zeigen Namen und Mini-Story; spielerdefinierte Missionen werden validiert.
- Der Spawn-Flow setzt die Reihenfolge (Detektive zuerst, Ganove zuletzt) um
  und bietet keine Positionen unter Mindestabstand an.
- Weitere Städte erscheinen ausschließlich als „in Vorbereitung".
- Alle Menütexte laufen über i18n-Schlüssel (DE/EN).
- Sofern in diesem Schritt KI-generierte Rasterassets eingebunden werden, sind
  sie gesichtet, lizenzgeprüft und lokal im Repo eingebettet — keine externen
  Hotlinks; ein benötigter Hugging-Face-Token wurde rechtzeitig angefordert.

**Abhängigkeiten:** 9, 10

**Betroffene Bereiche:** Menü/Anwendungsrahmen, Einstellungen,
Szenarien-Auswahl, Startaufstellungs-Flow

### Schritt 12: Persistenz — Save/Load, Replay-Player und Statistiken

**Ziel:** Partien können an beliebiger Stelle gespeichert und identisch
fortgesetzt werden; aufgezeichnete Eventlogs lassen sich deterministisch als
Replay in zwei Perspektiven abspielen; aggregierte Statistiken werten die
gespeicherten Logs aus.

**Beschreibung:** Es ist die Persistenz- und Wiedergabe-Schicht gemäß
`02-technisches-konzept.md` §8/§8.1 zu bauen. Save/Load: Ein Speicherstand ist
State-Snapshot + Log + Seed; „Partie fortsetzen" im Menü stellt den exakten
Spielzustand wieder her (Runde, Phase, Positionen, Mission, Hinweise, Kameras,
Sperrungen, verbrauchter Polizeifunk, Hitze-Fenster). Replay-Player: gespeicherte
Eventlogs werden erneut deterministisch durch die Engines geschickt — Timeline
mit Abspielen/Pause/Schritt vor/zurück und zwei Perspektiven (Ganove-Sicht /
Detektiv-Sicht), gesteuert über `visibleTo` der Events; die Replay-Ansicht
nutzt die vorhandenen Karten-/Ansichtskomponenten beider Perspektiven.
Statistiken: Aus den gespeicherten Logs werden aggregierte Werte berechnet und
angezeigt — Siegquote je Seite/Modus, durchschnittliche Partienlänge,
Hinweise pro Partie, Kameratreffer; die Log-Liste ist verwaltbar (ansehen,
exportieren, löschen).

**Akzeptanzkriterien:**
- Ein an beliebiger Stelle gespeicherter Spielstand stellt nach dem Laden den
  identischen Zustand wieder her (Zustandsvergleich vollständig gleich);
  verbrauchte Einmal-Fähigkeiten bleiben verbraucht.
- Der Replay-Player spielt Logs deterministisch ab: Schritt vor/zurück landet
  auf identischen Zuständen; die Perspektiven filtern korrekt nach
  `visibleTo` (Detektiv-Sicht zeigt nie den Ganoven außerhalb erlaubter
  Hinweise).
- Die Statistik-Werte stimmen über bekannten Log-Fixtures exakt (Siegquote,
  Partienlänge, Hinweise/Partie, Kameratreffer).
- Log-Export/-Verwaltung funktioniert inkl. der automatischen
  `localStorage`-Vorhaltung.

**Abhängigkeiten:** 7, 11

**Betroffene Bereiche:** Persistenz (Save/Load), Replay-Player, Statistiken

### Schritt 13: Lokalisierung, Barrierefreiheit und Audio

**Ziel:** Das Spiel ist vollständig zweisprachig (DE/EN) ohne hartkodierte
Texte, erfüllt die Barrierefreiheits-Anforderungen (nie nur Farbe, volle
Tastaturbedienung, Kontraste) und besitzt die dezente Sound-Dramaturgie als
Spannungskanal für den Ganoven.

**Beschreibung:** Es sind die Querschnitts-Anforderungen gemäß
`02-technisches-konzept.md` §11 und FA-33/34/35 endgültig umzusetzen und
abzusichern. i18n: Alle sichtbaren Texte — Menüs, Panels, Hinweistexte,
Hitze-Stufen, Fall-Geschichten, Endzustands-Anzeigen, Fehlermeldungen —
laufen über Schlüssel mit vollständigen DE- und EN-Ressourcen inklusive
Sprachumschaltung zur Laufzeit; die Hook-Prüfung auf Schlüssel-Parität muss
grün sein. Barrierefreiheit: Icons und Overlays sind nie nur farbkodiert
(Form/Label/Muster zusätzlich — insbesondere Hitze-Badge,
Deduktions-Overlay, gesperrte Kanten, Knotenkategorien, Hinweistypen); ein
Farbenblind-Modus bzw. farbenblind-sichere Standarddarstellung ist
gewährleistet; die gesamte Bedienung ist per Tastatur möglich (Kartennavigation,
Knotenauswahl, Aktionen, Menüs); Kontraste sind ausreichend. Audio: dezente
Dramaturgie als Spannungskanal — Sound beim Stufenanstieg des
Hitze-Indikators und ein unaufdringliches „Polizeiaktivitäts"-Ambient für den
Ganoven; die Klänge werden prozedural per WebAudio synthetisiert (keine
externen Audiodateien erforderlich); Lautstärke/Stummschaltung einstellbar.

**Akzeptanzkriterien:**
- Keine hartkodierten sichtbaren Strings in Komponenten (automatisierter
  Check); DE- und EN-Ressourcen sind vollständig und schlüssel-paritär;
  Sprachwechsel wirkt zur Laufzeit auf allen Bildschirmen.
- Alle status- und typunterscheidenden Elemente sind zusätzlich zur Farbe per
  Form/Label/Muster codiert; Farbenblind-Trägheit ist dokumentiert geprüft.
- Kernflows (Menü → Partie beider Perspektiven → Aktionen → Ende) sind komplett
  per Tastatur durchführbar; Kontraste erfüllen die Anforderung.
- Hitze-Stufenanstieg löst den Sound aus; Ambient läuft dezent; Stummschaltung
  funktioniert.

**Abhängigkeiten:** 9, 10, 11, 12

**Betroffene Bereiche:** Lokalisierung (i18n), Barrierefreiheit, Audio

### Schritt 14: Endabnahme — E2E-Tests, Balancing-Kalibrierung und Polishing

**Ziel:** Das Spiel ist end-to-end automatisiert abgesichert, auf die
Balancing-Zielwerte kalibriert (~40–50 % Ganove-Siegquote, ~50/50
Sabotage-Abwägung) und auf professionelles Niveau poliert — inklusive der
fertiggestellten KI-generierten Rasterillustrationen.

**Beschreibung:** Es ist der Abschluss-Schritt für Qualität und Abnahme.
E2E-Tests (Playwright o. ä.) decken die Kernflows ab: Menü → Karten-/Modus-/
Einstellungswahl → Startaufstellung → komplette Ganove-Partie und komplette
Detektiv-Partie bis zum Ende, Aktions- und Sabotagefluss, Save/Load, Replay,
Statistiken, Sprachwechsel, Tastatur-Basisbedienung sowie
Asymmetrie-Assertions (keine Leaks in den DOM). Die E2E-Suite wird in die CI
eingebunden (best-effort mit `continue-on-error` und Trace-/Artefakt-Upload
gemäß Vorlage). Balancing-Kalibrierung: Über den headless KI-vs.-KI-Modus
werden Batch-Simulationen mit vielen Seeds gefahren und aus den Eventlogs die
Kalibrierungsmetriken aggregiert — `outcome`-Verteilung, Runden bis
Fang/Flucht, Hinweise/Partie, Kameratreffer, Sabotage-Annahmequote; die
einstellbaren Parameter (Karten-Settings/Defaults) werden so nachjustiert,
dass die Zielwerte erreicht oder eine begründete Abweichung dokumentiert wird.
Polishing: konsistente visuelle Durchgängigkeit (einheitlicher Stil der
SVG-Karte, Panels, Übergänge im Rahmen von CSS-Modulen), Feinschliff der
Interaktionen, Bug-Sweep; der Qualitätsanspruch „professionell" wird als
messbarer Minimalanteil verstanden: keine bekannten spielblockierenden Fehler,
konsistente und vollständig lokalisierte UI, durchgängiger visueller Stil aus
handgefertigter SVG-Grafik und Rasterillustrationen, reproduzierbare
Builds/Releases. Rasterillustrationen: Die KI-generierten Assets werden
spätestens in diesem Schritt fertiggestellt und eingebunden — Titelbild,
Texturen/Hintergründe, Stadtbild-/Atmosphäre-Karten für die Karten-Auswahl
sowie Fall-Artworks für die Fall-/Missionsanzeige. Die Generierung erfolgt
über Pollinations.ai (kostenlose HTTP-Bild-API ohne Key) bzw. bei Bedarf über
die Hugging-Face-Inference-API, wofür der API-Token rechtzeitig vor Nutzung
beim Nutzer anzufordern ist. Stil-Konsistenz wird über Prompt-Disziplin
gesichert; jedes Asset wird gesichtet sowie qualitäts- und lizenzgeprüft und
ausschließlich lokal ins Repo eingebettet (keine Hotlinks). Die Generierung
kann bereits in früheren UI-Schritten beginnen, sobald dort Bild-Assets
gebraucht werden — die Token-Anforderung erfolgt dann entsprechend früher.

**Akzeptanzkriterien:**
- Die E2E-Suite läuft lokal grün und ist in den CI-Workflows verdrahtet
  (inkl. Trace-Upload bei Fehlern).
- Ein dokumentierter Simulations-Bericht (aus Eventlogs aggregiert) weist die
  Ganove-Siegquote im Korridor ~40–50 % und eine Sabotage-Annahmequote nahe
  50/50 aus — oder eine begründete, dokumentierte Abweichung.
- Keine bekannten spielblockierenden Fehler; die Release-Builds sind
  reproduzierbar; der letzte Schritt-Merge erzeugt wie jede Phase einen
  RC-Prerelease auf `staging`.
- Alle geplanten Rasterillustrationen (Titelbild, Texturen/Hintergründe,
  Stadtbild-/Atmosphäre-Karten, Fall-Artworks) sind generiert, gesichtet,
  qualitäts- und lizenzgeprüft und lokal im Repo eingebettet — keine externen
  Hotlinks; ein benötigter Hugging-Face-API-Token wurde rechtzeitig vor
  Nutzung beim Nutzer angefordert.

**Abhängigkeiten:** 13

**Betroffene Bereiche:** E2E-Qualitätssicherung, Balancing, Polishing/Release

## Übersichtstabelle

| # | Titel | Abhängigkeiten | Betroffene Bereiche |
|---|-------|----------------|----------------------|
| 1 | Projekt-Scaffold und Qualitätsinfrastruktur | Keine | Projektinfrastruktur, Build/Test, CI/CD, Git-Hooks |
| 2 | Engine-Grundgerüst — Kartenpakete, Graph, Zufall, Startaufstellung | 1 | Kartenpaket-Format, Engine-Grundlage, Spawn, State |
| 3 | Kartenpakete Münster und Lübeck | 2 | Karten/Spielinhalte, Balancing-Startwerte |
| 4 | Rundenablauf, Bewegung und Spielende | 2, 3 | Rundenmotor, Bewegungsregeln, Endbedingungen |
| 5 | Informationssystem — Kameras, Ereignisse, Hinweise, Polizeifunk, Hitze | 4 | Kameras, Ereignisse, Hinweise, Polizeifunk, Hitze |
| 6 | Missionssystem — Generierung, Aktionen, Sabotage und Fälle | 5 | Missionen, Sabotage, Szenarien („Fälle") |
| 7 | Eventlog, Aufzeichnung und Export | 6 | Eventlog, Determinismus, Persistenz-Basis |
| 8 | Deduktion und KI — Detektiv-KI, Ganove-KI, KI-vs.-KI-Modus | 7 | Deduktion, KI beider Seiten, Simulation/Dev-Modus |
| 9 | Ganove-Perspektive (Primärmodus) | 8 | UI Ganove, SVG-Karte |
| 10 | Detektiv-Perspektive mit Deduktions-Werkzeugen | 8, 9 | UI Detektive, Deduktions-Tools |
| 11 | Menü, Einstellungen und Szenarien-Auswahl | 9, 10 | Menü/Rahmen, Konfiguration, Spawn-Flow |
| 12 | Persistenz — Save/Load, Replay-Player und Statistiken | 7, 11 | Save/Load, Replay, Statistik |
| 13 | Lokalisierung, Barrierefreiheit und Audio | 9, 10, 11, 12 | i18n, A11y, Audio |
| 14 | Endabnahme — E2E-Tests, Balancing-Kalibrierung und Polishing | 13 | E2E-Tests, Balancing, Polishing |

## Geklärte Punkte

| # | Offener Punkt | Empfohlener Vorschlag | Entscheidung |
|---|---------------|------------------------|--------------|
| 1 | **Messbarkeit des Qualitätsanspruchs „Triple-A-Niveau":** Die Anforderung ist unscharf; Grafikstil/-umfang, Audio-Umfang und Referenzprodukte sind nicht definiert. | Als messbaren Minimalanteil festlegen: keine bekannten spielblockierenden Fehler, konsistente und vollständig lokalisierte UI (DE/EN), durchgängiger visueller Stil im Rahmen von SVG/CSS-Modulen, dezentes Audio, reproduzierbare Builds/Releases. Für darüber hinausgehende Ambitionen (z. B. Illustrationen, aufwendige Animation) benötigte externe Grafik-/Audio-Tools spätestens zu Beginn von Schritt 14 anfordern; ohne solche Tools ist die Polishing-Grenze die genannte Minimaldefinition. | **Die aufwändigere Variante wird gewählt:** Handgefertigte SVG-Vektorgrafik (Karte, Icons, UI) und prozedurales WebAudio werden ergänzt um KI-generierte Rasterillustrationen (z. B. Titelbild, Texturen, Stadtbild-/Atmosphäre-Karten, Fall-Artworks). Kanäle: Pollinations.ai (kostenlose HTTP-Bild-API, kein Key nötig) und Hugging Face Inference API (kostenloses Kontingent; API-Token wird bei Bedarf explizit beim Nutzer angefordert). Lizenz-/Qualitätskontrolle liegt beim Projekt: Prompt-Disziplin, Sichtprüfung, nur lokal ins Repo eingebettete Assets, keine Hotlinks. Der messbare Minimalanteil des Vorschlags bleibt als Untergrenze bestehen. |
| 2 | **Definition „Phase" für die Pflicht-Prerelease:** Welche Einheiten zählen als Phase auf `staging`? | Ein Entwicklungsschritt = eine Phase → jeder Schritt-Merge wird zusätzlich auf `staging` gepusht und erzeugt einen RC `vX.Y.Z-rc.N` (≈ 14 RCs). Das ist die feinste sinnvolle und einzige automatisch erzwingbare Interpretation; gröbere Bündelung würde „Phase" willkürlich machen. | **Angenommen wie vorgeschlagen:** 1 Entwicklungsschritt = 1 Phase; jeder Schritt-Merge wird zusätzlich auf `staging` gepusht und erzeugt RC `vX.Y.Z-rc.N`. |
| 3 | **Konsumform der Prereleases:** Wie nutzen Stakeholder die RCs — Release-Asset oder deployed? | `vite build`-ZIP als GitHub-Release-Asset (vorlagenkonform, kein Zusatzsystem nötig). Da der Build statisch ist, kann später optional Hosting (GitHub Pages, Netlify, eigener Server) ergänzt werden — als Erweiterung, nicht als Voraussetzung. | **Angenommen wie vorgeschlagen:** `vite build`-ZIP als GitHub-Release-Asset; statisches Hosting bleibt eine optionale spätere Erweiterung. |
| 4 | **Coverage-Schwelle:** Die Vorlage empfiehlt 70 % Zeilenabdeckung — übernehmen oder anpassen? | 70 % Zeilenabdeckung wie in der Vorlage übernehmen, in `pr-staging-ci` und `staging-ci` erzwingen. Der Engine-Kern (`src/logic`, `src/state`) ist der Coverage-Schwerpunkt und sollte deutlich darüber liegen; bei systematischer Verfehlung im Projektverlauf neu verhandeln statt still zu senken. | **Angenommen wie vorgeschlagen:** 70 % Zeilenabdeckung, erzwungen in `pr-staging-ci` und `staging-ci`. |
| 5 | **Konkreter Prüfumfang der adaptierten Git-Hooks:** Welche TS-Prüfungen ersetzen die .NET-spezifischen Python-Checks? | `pre-commit` (Warnstufe auf gestagte Dateien): Prettier-/ESLint-/Typecheck auf betroffene Dateien, i18n-Schlüssel-Parität, Stub-Erkennung für TS (analog `no-notimplemented-check.py`). `pre-push` (strikt, Whole-Repo): alle Checks, `vitest run`, Kartenpaket-Schema-Validierung aller `src/data/maps/*.json`, `Math.random()`-Verbot in `src/logic`, verwaiste-Komponenten-Check (analog `razor-usage-check.py`); zusätzlich Push-Verbot auf `main`/`staging`. | **Angenommen wie vorgeschlagen:** `pre-commit` Warnstufe auf gestagte Dateien (Prettier, ESLint, Typecheck, i18n-Parität, TS-Stub-Erkennung); `pre-push` strikt Whole-Repo (alle Checks + `vitest` + Kartenpaket-Schema-Validierung + `Math.random()`-Verbot in `src/logic` + verwaiste-Komponenten-Check); Push-Verbot auf `main`/`staging`. |
| 6 | **Branch-Protection-Einrichtung:** `main`/`staging` sind geschützt (1 Review), aber ohne Pflicht-Statuskontexte; Labels `automated-promotion`/`automated-backmerge` fehlen. Wer richtet es ein, reichen die Rechte? | Nach dem ersten grünen CI-Lauf die Statuskontexte `static checks`, `build & test`, `no pending backmerge` als Pflicht-Checks auf `staging` (und PR-Pflicht auf `main` belassen) via `gh`-API setzen — laut Bestandsaufnahme ist `gh` authentifiziert; falls die Rechte nicht reichen, den Repository-Owner beauftragen. Die beiden Labels legen die Promotion-/Backmerge-Workflows beim ersten Lauf selbst an (`--force`). | **Angenommen und autorisiert:** Nach dem ersten grünen CI-Lauf werden die Pflicht-Statuskontexte `static checks`, `build & test`, `no pending backmerge` auf `staging` via `gh`-API gesetzt; `main` bleibt mit PR-Pflicht geschützt. Teil von Schritt 1. |
| 7 | **Bestätigung der CI-Adaption:** Ist das in FA-38/den Vorgehensentscheidungen skizzierte .NET→Node/Vite-Mapping die gewünschte Adaption? | Ja empfohlen: Struktur, Gates und Promotion-/Backmerge-Mechanik der Vorlage unverändert übernehmen, nur Befehle und Asset-Form mappen (`npm ci`, Prettier/ESLint/`tsc`, `vitest`-Coverage, `npm audit`, ein Build-ZIP). `update.json`/`release-metadata.json` entfallen (kein Self-Update). Eine schlankere Eigenkonstruktion wird verworfen, weil FA-37/FA-38 die Vorlagenstruktur verbindlich vorgeben. | **Bestätigt:** .NET→Node/Vite-Mapping wie in FA-38 und den Vorgehensentscheidungen; `update.json`/`release-metadata.json` entfallen. |

## Offene Punkte

Keine.
