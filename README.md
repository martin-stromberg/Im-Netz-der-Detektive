# Im Netz der Detektive

[![Pre-Release](https://img.shields.io/github/actions/workflow/status/martin-stromberg/Im-Netz-der-Detektive/staging-ci.yml?branch=staging&label=Pre-Release)](https://github.com/martin-stromberg/Im-Netz-der-Detektive/actions)
[![License](https://img.shields.io/badge/license-PolyForm%20Noncommercial-blue)](LICENSE)
[![node >=22.14](https://img.shields.io/badge/node-%3E%3D22.14-339933?logo=nodedotjs)](https://nodejs.org)

Ein asymmetrisches Verfolgungsspiel als Computerspiel — angelehnt an
Hidden-Movement-Klassiker wie *Scotland Yard*: Ein verdeckter **Ganove**
zieht durch ein Wegenetz aus echten Münster-Orten und erfüllt eine
Mission (Diebstahl → Informant → Flucht), während **Detektive** ihn
anhand von Kameras, Zeugenhinweisen und Ereignissen eingrenzen.

Geplant als Browser-Spiel (React + TypeScript + Vite), prototypisch als
Singleplayer: Mensch als Ganove gegen KI-Detektive — oder umgekehrt.

## Status

**Brettspiel-Redesign — Schritt 7: Spieltisch** (Projekt
„Finales Brettspiel-Design"): Alle zwölf Screens ruhen jetzt auf
derselben dunklen Tischfläche — die `bg-noir`-Textur unter dem
Tisch-Schleier (`--color-table-veil`/`--color-table-veil-edge`) mit
Filz-Schimmer und Tischkanten-Vignette. In der Partie liegt das
Geschehen in einer gerahmten Spieleinlage: Das Pergament-Brett steht
mit seinem Schatten auf der vertieften Fläche, die Seitenleiste ist
ein Kartenfach für die Edelkarten-Panels, die Rundenanzeige eine
eingelassene Zählleiste. `.perspectiveToggle` ist jetzt eine
Schalterplatte mit Messing-Segment (`--brass-face`), alle
Bildflächen tragen den Kartenrand. Rein CSS — DOM, `data-*` und die
900-px-Stapelung unverändert.

Zuvor — **Schritt 6: Edelkarten-Panels** (Projekt
„Finales Brettspiel-Design"): Alle UI-Flächen — Seitenleisten-Panels,
Menü-Auswahlkarten, Statistik-Kacheln, Hinweis-/Bestätigungsboxen,
Splash-Ansagen, Event-Banner und die `role="status"`-Pills für Hitze
und Verfolgungsdruck — tragen jetzt dieselbe dunkle Spielkarten-
Haptik: Kartonband-Rand (`--color-cardboard`), gravierte Innenlinie,
dunkle Schnittkante, dezente Ecken-Prägung und zweistufiger
Tischschatten — zentral definiert über die neuen Token-Listen
`--card-face`/`--card-rim` in `src/theme.css`. Buttons wirken
metallisch/embossed (Gradient + Innenlicht + Schatten), Eingabefelder
als eingelassene Karten-Slots; Farbcodierungen, `data-*`-Attribute,
Hover- und `:focus-visible`-Zustände bleiben unverändert —
ausschließlich CSS-Änderungen, Kontraste ≥ WCAG AA dokumentiert.

Zuvor — **Schritt 5: Routen** (Projekt
„Finales Brettspiel-Design"): Die Verbindungen auf der `MapGraph`-Karte
lesen jetzt wie gezeichnete Kartenwege — die klassische
„cased line"-Technik legt eine dunkle Tinten-Fassung (`edgeCasing`)
unter einen hellen Papierkern. Ein `weg` erscheint als befestigte
Straße mit Sepia-Rand und durchgezogenem Kern, eine `fahrt` als
kräftigere Trasse mit querliegenden Papier-Schwellen — Muster, Breite
und Farbton tragen den Typ gemeinsam, nie die Farbe allein. Blockierte
Routen bleichen aus, ihr Kern reißt auf und das rote Kreuz-Glyph
(`data-block-glyph`) bleibt die Form-Kodierung; der `edgeFlash`-Puls
respektiert weiterhin `prefers-reduced-motion`. `data-*`-Vertrag und
Kanten-DOM bleiben unverändert; beide Legenden spiegeln die neue
Zweistrich-Anatomie auf ihren Papierchips. Deterministisch: kein
`Math.random()`, kein `feTurbulence`-Displacement.

Zuvor — **Schritt 4: Spielfiguren**: Aus den flachen Positionsmarkern sind
greifbare Meeple-Spielsteine geworden — das neue Modul
`src/components/boardPieces.tsx` zeichnet stehende Figuren mit
Körper-`radialGradient`, Schlagschatten und Sockel-Ellipse auf den
Orts-Plaketten. Detektiv (aufrechte Silhouette + Index-Ziffer + Blau)
und Ganove (Mantel-A-Linie + Fedora, ohne Ziffer) unterscheiden sich
über Form, Farbe und Beschriftung; der aktive Detektiv pflanzt eine
bernsteinfarbene Fahne auf seinen Sockel. `data-*`-Vertrag,
`markerMove`-Gleiten (480 ms, respektiert `prefers-reduced-motion`)
und die `translate`-Ankerung bleiben unverändert; beide Legenden
zeigen Miniaturen derselben Figuren.

Zuvor — **Schritt 3: Orts-Tokens**: Jeder Ort auf der `MapGraph`-Karte
ist eine geprägte Plakette statt eines flachen Punktes —
Schlagschatten, gefasster Rand, `radialGradient`-Volumenprägung und
gravierte Innenlinie wie eine Kartenplakette auf dem Pergament-Brett.
Wählbare Orte tragen einen perforierten grünen Rand plus gestrichelten
Ring (Form + Farbe), der Tastaturfokus einen soliden Bernstein-Ring;
beide Legenden zeigen dieselbe Miniatur-Plakette. `data-*`-Struktur,
Hit-Area (r=14) und Pfeiltasten-Roaming bleiben unverändert.

Zuvor — **Schritt 2: Brett-Materialität**: Die SVG-Stadtkarte liegt
wie ein gedrucktes Spielbrett auf dem dunklen Tisch —
Pergament-Grundfläche mit prozeduraler Papierkörnung
(`feTurbulence`) und Vignette (`radialGradient`), kräftiger
mehrstufiger Pappenrand und Schlagschatten. Alle Kartenfarben laufen
über neue, auf das helle Papier kalibrierte `--color-map-*`-Tinten
(WCAG AA); die Board-Geographie nutzt eine Vintage-Pergament-Palette;
die Legenden zeigen ihre Zeichen auf Papier-Chips in exakt den
Brettfarben.

**Brettspiel-Redesign — Schritt 1: Design-Fundament**: Ein globales `src/theme.css` führt die komplette
Noir-Palette als `:root`-Design-Tokens (`--color-*`) und ergänzt neue
Brettspiel-Tokens für Pergament, Pappe, Tisch und Schatten — Grundlage
für das „Pergament-Brett auf dunklem Tisch". Titel und Überschriften
aller Bildschirme laufen in der lokal eingebetteten Schmuckschrift
**IM Fell English** (SIL OFL, WOFF2 unter `src/assets/fonts/`,
`src/assets/ASSETS.md`) — kein externer Font-Request zur Laufzeit;
Fließtext bleibt Systemschrift. Alle CSS-Module konsumieren die Tokens
per `var()`, die WCAG-AA-Kontrastpaarungen sind in `theme.css`
dokumentiert.

**Endabnahme & Polishing — ausbalanciert, vollständig illustriert, E2E in CI**
(Entwicklungsschritt 14): Das Spiel ist nach KI-vs.-KI-Kalibrierung
auf Münster **ausgewogen** (~48 % Ganoven-Siege über 400 Seeds, ~50 %
Sabotage-Annahme; vorher 0 %) — über realistisch fehlerhafte
Detektiv-KI (Patrouillen mit Momentum, verzögerte Lage) und eine
fortschrittsorientierte Ganoven-KI; Details in
`docs/help/spiel-engine/balancing-bericht.md`. **Alle Rasterassets
sind lokal eingebettet**: Titelbild, Kartenkarten, neue Noir-
Hintergrundtextur und Fall-Artworks für beide Münster-Fälle
(`src/assets/ASSETS.md`). Die 29 Playwright-E2E-Szenarien laufen als
best-effort-Job in beiden CI-Workflows mit Trace-Upload; alle
Qualitätsgates (Unit + ≥70 % Coverage, Lint, Typecheck, E2E) grün.

**i18n final, Barrierefreiheit und Audio-Dramaturgie**
(Entwicklungsschritt 13): Das komplette Spiel läuft über einen
Einstellungs-Screen im Hauptmenü wahlweise auf **Deutsch oder
English** — der Wechsel wirkt sofort auf jedem Bildschirm und bleibt
gespeichert; Fall-Storys und Karten-Taglines kommen über
Referenzschlüssel aus den Sprachkatalogen, und ein neuer
pre-commit/pre-push-Check blockiert hartkodierte sichtbare Strings
in Komponenten (`npm run check:strings`). **Barrierefreiheit:** Farbe
ist nirgends alleinige Information (Muster, Formen, Glyphen und
Klartext durchgehend), alle Status-/Phasenwechsel landen über
`role="alert"`/`aria-live` beim Screenreader, die gemessenen
Kontraste erfüllen WCAG AA, und der Kernfluss ist vollständig per
Tastatur spielbar — inklusive Pfeiltasten-Roaming zwischen den
wählbaren Orten der Karte. **Audio:** eine komplett prozedurale
WebAudio-Dramaturgie ohne Audiodateien — gestuftes Signal je
Hitze-Stufen-Anstieg und eine dezente Polizeiaktivitäts-Kulisse in
der Ganoven-Perspektive, regelbar über Lautstärke + Stummschalter,
autoplay-konform erst nach der ersten Eingabe aktiv.

**Persistenz, Replay und Statistiken** (Entwicklungsschritt 12):
Laufende Partien lassen sich in beiden Modi über „Partie speichern"
als versionierter Snapshot ablegen (bis zu 10 Stände, Upsert pro
Partie) und über „Partie fortsetzen" bitidentisch weiterführen —
inklusive verbrauchter Einmal-Fähigkeiten, Sabotage-Fenstern und dem
exakten Zug-Stand. Abgeschlossene Partien (automatisch im
localStorage-FIFO) öffnet „Statistiken & Replays": aggregierte
Kennzahlen gesamt und je gespieltem Modus, ein deterministischer
Replay-Abspieler mit Timeline (Schritt vor/zurück, Abspielen) und
beiden `visibleTo`-Perspektiven — die Detektiv-Sicht zeigt nie die
Ganovenposition — sowie Log-Verwaltung (Export als JSONL, einzelnes
Löschen, „Alle löschen" mit Rückfrage).

**Vollständiger Anwendungsrahmen — beide Perspektiven über das
Hauptmenü spielbar** (Entwicklungsschritt 11): `npm run dev` öffnet
das Hauptmenü — „Neue Partie" führt durch Kartenwahl (Münster und
Lübeck spielbar, Hamburg/Köln „in Vorbereitung"), Moduswahl (Ganove,
Detektiv oder der KI-vs.-KI-Dev-Modus mit Batch-Auswertung),
kartengebundene Einstellungen (Detektive, Kameras, Rundenlimit inkl.
„Unbegrenzt" wo erlaubt, Polizeifunk-Tiefe, Sperrdauer,
Ereignismodus/-Kadenz — mit Vorschlagswerten und Korridoren) und die
Missionsauswahl (benannter Fall mit Mini-Story, Zufallsmission,
spielerdefinierte Mission mit Kriterienprüfung auf der Karte, oder
freie Flucht). Danach folgt die regelkonforme Startaufstellung —
Detektive zuerst, Ganove zuletzt, mit missionsgefilterten
Ganove-Kandidaten bei festen Zielen. `?mode=ganove`/`?mode=detektiv`
bleiben als direkte Entwickler-Einstiege erhalten. Titel- und
Kartenbilder sind lokal eingebettete, KI-generierte Assets
(`src/assets/ASSETS.md`).

Detektiv-Perspektive
(Entwicklungsschritt 10): Du führst den kompletten
Trupp D1 → Dn gegen den KI-Ganoven: freie Postenwahl auf der
Stadtkarte (Ganove-Start bleibt verdeckt), legale Züge per Klick
oder Tastatur, KI-Ganove-Zug automatisch nach dem letzten Detektiv.
Detektiv-Werkzeuge an Bord: chronologische Hinweis-Chronik (Art,
Ort/Zone, Runde), kommentierbare Spielermarker, das „Mögliche
Positionen"-Overlay auf Basis des exakten Deduktionsmodells,
Kameras (aktiv/sabotiert), Zonen und Ortskategorien mit
Missions-Poolgrößen — ohne jemals den Ganoven oder die gezogenen
Missionsziele zu sehen (strukturelle Informationsasymmetrie).

Ganove-Perspektive (Entwicklungsschritt 9): `?mode=ganove` — du
spielst den Ganoven gegen die KI-Detektive. Nach „Neue Partie"
beziehen die Detektive ihre Posten, du wählst deinen Startpunkt aus
den legalen Optionen und jagst die Mission (Diebstahl → Kontakt →
Sabotage-Wahl → Flucht) über die SVG-Karte von Münster: legale Züge
markiert und per Klick/Tastatur wählbar, Hitze-Indikator (Icon +
Text, 4 Stufen), einmaliger Polizeifunk, alle Endzustände inklusive
Remis-Abbruch — vollständig lokalisiert (DE/EN) und durch
Playwright-E2E abgedeckt.

Deduktion & KI (Entwicklungsschritt 8): Das geteilte
Deduktionsmodell (`Deduction.ts`) errechnet aus allen
detektivsichtbaren Hinweisen die Menge konsistenter
Ganoven-Positionshistorien — inklusive Zugzwang, Kantensperrungen,
Belegung und Negativ-Schluss durch stille Kameras. Darauf spielen zwei
KIs gegeneinander: `DetectiveAI` steuert den ganzen Trupp koordiniert
(Abdeckung der Glaubensmenge → Aufteilung/Einkreisung, letzter Hinweis
als Anker, strukturell ohne Zugriff auf Position oder Missionsziele),
`GanoveAI` führt die Mission mit Aktions-Timing (Hitze, Abstand,
Deadline), einmaligem Polizeifunk und der Sabotage-Binärwahl.
`AiSimulation.ts` treibt beide Seiten auf dem gemeinsamen Store —
deterministisch je Seed — bis zur regulären Endbedingung samt
komplettem Eventlog; `npm run sim` spielt Batch-Serien und gibt
Outcome-Verteilung plus Balancing-Metriken (Runden, Hinweise,
Kameratreffer, Sabotage-Quote) aus, optional mit JSONL-Logs je Partie.

Eventlog (Entwicklungsschritt 7): Jede Partie wird vollständig als
JSONL-Eventlog aufgezeichnet — `header` (Spiel-ID, Karte, Seed,
effektive Konfiguration, Mission, Kameras, Startaufstellung),
sequenzierte Events mit `visibleTo`-Sichtbarkeit für alle
Spielvorgänge (Züge inkl. Wegart, Kameraauslösungen, Ereignisse,
Kantensperrungen samt Ablauf, Hinweise, Aktions-Spuren,
Sabotage-Angebot und -Wahl, Polizeifunk) und ein `result`-Abschluss mit
Balancing-Metriken (Runden, Hinweise gesamt, Kameratreffer). Gleicher
Seed + gleiche Eingaben ergeben ein bitgleiches Log; aus Header + Seed
ist der Anfangszustand rekonstruierbar. Export als JSONL-Datei und
automatisches Vorhalten der letzten Partien im `localStorage` (FIFO)
sind über `Recorder.ts` hinter injizierbaren Browser-Grenzen
implementiert — die Engine bleibt headless.

Darunter liegt das Missionssystem (Entwicklungsschritt 6): Jede Partie trägt eine Mission
in fester Reihenfolge Diebstahl → Kontakt → Binärwahl
(Sabotage/Flucht) — die Ziele werden per Seed aus den
Kategorien-Pools gezogen und müssen BFS-prüfbare Kriterien erfüllen
(Mindest-/Höchstentfernungen, Routen-Budget mit Aktionsrunden,
Flucht-Abstände, Sabotage-Umweg). Aktionsrunden erzeugen exakte
Spur-Hinweise vor den Detektivzügen, das Informanten-Angebot zieht
einen von drei wirksamen Sabotage-Effekten (Kameras aus, Funkstille,
falsche Spur), die Flucht gelingt nur am missionsgebundenen
Fluchtknoten. Vordefinierte benannte „Fälle" (JSON-Missionssets,
zwei Fälle für Münster) und spielerdefinierte Missionen werden gegen
dieselben Kriterien validiert — alles mit datenseitiger
Sichtbarkeitsasymmetrie (`visibleTo`), vollständig headless und
deterministisch. Darunter steht die komplette Informationsschicht
(Kameras, Ereignisengine, Polizeifunk, Hitze-Indikator), der
Rundenmotor (Zwei-Phasen-Runden, Zugzwang, Kantensperrungen,
Sofort-Fangprüfung, alle fünf Endbedingungen) und das
Engine-Grundgerüst mit zwei echten Kartenpaketen (**Münster**: 59
Orte, 101 Kanten; **Lübeck-Altstadtinsel**: 22 Orte als
Validierungskarte). Die KI-Seite steht bereits als Engine-Feature —
die Oberflächen folgen in den nächsten Entwicklungsschritten. Details:
`docs/help/spiel-engine/`, `docs/help/kartenpakete/`.

## Setup

Voraussetzungen: Node.js ≥ 22.14 (empfohlen: 24), npm, Python 3 (für die
Git-Hook-Prüfungen), Git.

```bash
npm ci                          # Abhängigkeiten installieren
sh .githooks/install-hooks.sh   # Git-Hooks aktivieren (Windows: .githooks\install-hooks.cmd)
npm run dev                     # Dev-Server starten
```

## Befehle

| Befehl | Wirkung |
|--------|---------|
| `npm run dev` | Vite-Dev-Server |
| `npm run build` | `tsc --noEmit` + `vite build` → `dist/` |
| `npm test` | Vitest-Testsuite |
| `npm run coverage` | Tests mit erzwungener 70-%-Zeilenabdeckung |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier schreiben / prüfen |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run sim` | KI-vs.-KI-Batchsimulation (`--map/--games/--seeds/--detectives/--mission/--out`) |
| `npm run release` | `semantic-release` (nur in CI) |

## Projektstruktur

```
src/
  components/   UI-Komponenten (React, CSS-Module)
  logic/        Spiellogik/Engine (deterministisch, kein Math.random())
  state/        Zustand-Store (headless-fähig)
  data/maps/    Kartenpakete (JSON)
  i18n/         Übersetzungskataloge de.json / en.json
scripts/        CI-Hilfsskripte (resolve-release-version.mjs)
.githooks/      Lokale Qualitätsgates (pre-commit / pre-push)
.github/        CI-Workflows + Composite Actions
```

## CI/CD

Staging→main-Topologie: PRs auf `staging` durchlaufen statische Checks und
Build & Test (70-%-Coverage-Gate); jeder Push auf `staging` erzeugt einen
Release-Candidate `vX.Y.Z-rc.N` mit dem Build-ZIP `release.zip`; ein Push
auf `main` erzeugt das Release. Details: `docs/help/projektinfrastruktur/`.

## Konzept

Das vollständige, entschiedene Spielkonzept liegt als Markdown-Sammlung
unter [`docs/konzept/`](docs/konzept/content/00-uebersicht.md).
Ansehen im Browser:

```
start-docs.bat          → http://localhost:8899
```

oder manuell:

```
cd docs/konzept && python -m http.server 8899
```

Enthalten: Spielregeln, Kartenpaket-Format (weitere Städte möglich),
Technik-Konzept, Balancing-Startwerte und ein Archiv aller
Design-Entscheidungen.

## Dokumentation

- [Entwickler- und Betreiberdokumentation](docs/help/index.md)
- [Änderungsprotokoll](changes.log)

## Lizenz

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0)
— siehe [LICENSE](LICENSE).

Private und nicht-kommerzielle Nutzung ist frei (Studium, Hobby,
private Unterhaltung). **Kommerzielle Nutzung erfordert eine
gesonderte Lizenzierung.**
