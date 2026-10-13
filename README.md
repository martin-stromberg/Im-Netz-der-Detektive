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
