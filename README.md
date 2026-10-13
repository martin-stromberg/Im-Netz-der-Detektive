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

Rundenmotor (Entwicklungsschritt 4): Die Partie läuft komplett headless —
Zwei-Phasen-Runden (Ganove, dann Detektive in fester Reihenfolge), alle
Bewegungsregeln inklusive Zugzwang und Kantensperrungen, Sofort-Fangprüfung
nach jedem Detektivzug und alle fünf Endbedingungen (Fang, Umzingelung,
Flucht, Zeitlimit inklusive „unbegrenzt", Remis). Die Aktionsrunde des
Ganoven und die missionsgebundene Flucht sind als Hooks vorbereitet.
Darunter steht das Engine-Grundgerüst mit zwei echten Kartenpaketen
(**Münster**: 59 Orte, 101 Kanten; **Lübeck-Altstadtinsel**: 22 Orte als
Validierungskarte), Kartenpaket-Loader und -Validator, Graph-Funktionen
(BFS), Seeded-RNG und Startaufstellungs-System. Informationssystem und
Oberflächen folgen in den nächsten Entwicklungsschritten. Details:
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
