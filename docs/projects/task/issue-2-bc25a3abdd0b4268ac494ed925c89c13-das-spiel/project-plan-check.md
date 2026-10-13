# Planprüfung — Im Netz der Detektive

## Ergebnis

**Status:** Projektplan vollständig

## Abgleich Anforderung ↔ Entwicklungsschritte

| FA | Anforderung (kurz) | Schritt(e) | Abdeckung |
|----|--------------------|-----------|-----------|
| FA-01 | Spielprinzip: asymmetrisches Verfolgungsspiel | 4–6, 8–10 | voll |
| FA-02 | Informationsasymmetrie (Sichtbarkeiten beider Seiten) | 5, 9, 10 | voll |
| FA-03 | Münster-Graph ~50 Knoten, ~90–110 Kanten, Ø-Grad 3–4, `cost` reserviert | 2, 3 | voll |
| FA-04 | Kantentypen `weg`/`fahrt`, 1 Zug = 1 Kante | 2, 3, 4 | voll |
| FA-05 | Knotenattribute `categories`, `zone`, `x`/`y` | 2, 3 | voll |
| FA-06 | Spawn-Modi `choice`/`free`/`random`, Detektive zuerst, Mindestabstand | 2, 11 | voll |
| FA-07 | Rundenstruktur: Ganovenphase → D1→D4, interne Prüfungen | 4, 5 | voll |
| FA-08 | Zugzwang, besetzte Knoten tabu, Detektive teilen Knoten, keine Fangprüfung auf Kanten | 4, 9 | voll |
| FA-09 | Kameras (8, Mindestabstand 2, Missionsziele frei, exakter Hinweis nur Detektive) | 3, 5, 6 | voll |
| FA-10 | Ereignis-Auslösemodi (Zyklus/Chance/Spannung mit Startwerten) | 3, 5 | voll |
| FA-11 | Ereignistypen/-mischung 25/45/30, Umweltsperrung, Isolationsschutz | 5 | voll |
| FA-12 | Hinweisgrundsatz (vergangenheitsbezogen, Live-Ausnahme Sichtbarkeit, nur Detektive) | 5 | voll |
| FA-13 | Polizeifunk (einmalig, letzte N Hinweise inkl. Kameraauslösungen) | 5, 9 | voll |
| FA-14 | Hitze-Indikator (4 Stufen, Gewichtung, 3-Runden-Fenster, Badge + Sound) | 5, 9, 13 | voll |
| FA-15 | Aktionspool (Diebstahl/Kontakt/Sabotage/Flucht) | 3, 6 | voll |
| FA-16 | Missionsvarianten, „Fälle" mit Mini-Story, feste Reihenfolge | 6, 11 | voll |
| FA-17 | Generierungskriterien messbar per BFS | 6 | voll |
| FA-18 | Aktionsausführung (Betreten ≠ Aktion, Spur vor Detektivzügen, Flucht = Sieg) | 4, 6 | voll |
| FA-19 | Sabotage-Angebot (3 Effekte, Binärwahl, kein Leak im Kontakt-Hinweis) | 6 | voll |
| FA-20 | Detektivtrupp (4, eine Instanz, Balancing-Parameter, kein Campen) | 3, 8 | voll |
| FA-21 | Spielmodi (Ganove primär, Detektiv, Dev-Modus KI-vs.-KI; kein Hot-Seat) | 8, 9, 10, 11 | voll |
| FA-22 | Deduktions-Werkzeuge (Chronik, Marker, Overlay; geteilte `Deduction`) | 8, 10 | voll |
| FA-23 | KI (Detektiv-Heuristik, GanoveAI für Dev-Modus/Detektiv-Perspektive) | 8 | voll |
| FA-24 | Endbedingungen (Fang, Umzingelung, Flucht, Zeitlimit inkl. unbegrenzt, Remis) | 4, 6 | voll |
| FA-25 | Zwei UI-Ansichten (GanoveUI, DetektiveUI mit allen Elementen) | 9, 10 | voll |
| FA-26 | MapGraph-SVG (Kamera-Icons nur Detektivsicht, Ganove nur GanoveUI) | 9, 10 | voll |
| FA-27 | Menü/Einstellungen innerhalb Map-Bereiche, Städte „in Vorbereitung" | 3, 11 | voll |
| FA-28 | JSONL-Eventlog (Header/Events/result, Seed-Rekonstruktion, einziger RNG, Export, localStorage) | 1, 2, 7 | voll |
| FA-29 | Save/Load, Replay-Player (Timeline, zwei Perspektiven), Statistiken | 12 | voll |
| FA-30 | Technik-Stack (React 18 + Vite + TS, Zustand headless, CSS-Module, Feature-Slices) | 1, 2 | voll |
| FA-31 | Kartenpaket-Format (`loadMap(id)`, `{suggested,min,max}`, keine Hartcodierung) | 2 | voll |
| FA-32 | Karten-Scope (Münster + Lübeck-Validierungskarte) | 3 | voll |
| FA-33 | i18n DE/EN von Beginn an, keine hartkodierten Strings | 9–13 (Hook-Check in 1) | voll |
| FA-34 | Barrierefreiheit (nie nur Farbe, Tastatur, Kontraste) | 9, 13 | voll |
| FA-35 | Audio (Hitze-Stufen-Sound, Polizeiaktivitäts-Ambient) | 13 | voll |
| FA-36 | Balancing-Startwerte + Kalibrierung (~40–50 % Ganove-Sieg, ~50/50 Sabotage) | 3, 14 | voll |
| FA-37 | Prerelease-Pipeline (RC pro Phase auf `staging`, Promotion/Release/Backmerge) | 1 + Vorgehensentscheidung „Prerelease-Strategie" | voll |
| FA-38 | Quality Gates (static checks ∥ build&test, Coverage, verify-pr-source, no-pending-backmerge, Security-Scan) | 1 | voll |
| FA-39 | Git-Hooks (pre-commit Warnstufe, pre-push strikt, Push-Verbot main/staging, TS-Adaption + eigene Prüfungen) | 1 | voll |

## Abhängigkeitsprüfung

Alle Abhängigkeiten verweisen ausschließlich auf frühere existierende Schritte
(1←—; 2←1; 3←2; 4←2,3; 5←4; 6←5; 7←6; 8←7; 9←8; 10←8,9; 11←9,10; 12←7,11;
13←9,10,11,12; 14←13). Der Graph ist zyklenfrei; die numerische Reihenfolge
1–14 ist bereits eine gültige topologische Sortierung. Die Übersichtstabelle
ist mit den Schrittbeschreibungen konsistent (Titel, Abhängigkeiten und
Betroffene Bereiche stimmen überein). Fachlich begründbare Kanten: Schritt 5
baut die Kamera-Ausschlussliste als Mechanismus und Schritt 6 belegt sie mit
den Missionszielknoten — die Deferral ist in beiden Schritten explizit
dokumentiert. Schritt 10 benötigt Schritt 9 wegen der geteilten
MapGraph-Komponente; Schritt 12 benötigt Schritt 11 wegen der Menüeinträge.
Die bewusste Spätposition des Eventlogs (Schritt 7 nach allen
ereigniserzeugenden Systemen) ist in den Vorgehensentscheidungen begründet
und konsistent umgesetzt.

## Fehlende oder unvollständige Punkte

Keine.

## Hinweise

- **Nicht-Ziele:** Alle Nicht-Ziele bleiben unberührt bzw. sind explizit
  ausgeschlossen (Scope-Disziplin-Zeile): kein Multiplayer (nur implizite
  Architekturvorbereitung via headless Store/Seed-RNG), kein Hot-Seat, kein
  OSM-Import, keine weiteren Städte (Auswahlmenü zeigt sie nur als „in
  Vorbereitung", Schritt 11), kein vierter Sabotage-Effekt „Verkleidung",
  keine Schwierigkeits-Presets, kein `update.json`/`release-metadata.json`,
  nichts Kommerzielles. Die Playwright-E2E-Suite in Schritt 14 ist kein
  Verstoß gegen Nicht-Ziel 10: Die Vorlage sieht sie optional
  (best-effort/`continue-on-error`) vor, und der Plan verdrahtet sie genau so.
- **Geklärte Punkte:** Alle 7 Entscheidungen sind widerspruchsfrei verankert:
  (1) Asset-Strategie SVG + KI-Rasterillustrationen in Entscheidungstabelle,
  Schritt 11 und Schritt 14; (2) 1 Schritt = 1 Phase in der
  Prerelease-Strategie-Entscheidung und Schritt-14-Akzeptanz; (3) ZIP-Asset in
  CI-Adaption und Schritt 1; (4) 70-%-Coverage in Schritt 1; (5) Hook-Umfang in
  Schritt 1; (6) Branch-Protection via `gh`-API als Cold-Start in Schritt 1;
  (7) CI-Adaption .NET→Node/Vite strukturtreu in Schritt 1.
- **Kleinigkeiten ohne Lückencharakter:** Der verwaiste-Komponenten-Check
  (analog `razor-usage-check.py`) aus Entscheidung 5 ist in Schritt 1 nur
  implizit über „u. a."/„eigene projektspezifische Prüfungen" abgedeckt;
  `actions.json` aus der Bereiche-Tabelle der Anforderung wird nicht namentlich
  genannt (Sabotage-Effekte laufen über `sabotageEffects` im Kartenpaket); die
  Erhaltung des Doc-Viewers (`start-docs.bat`) steht nur implizit in der
  Übersicht („außer Konzept-Dokumenten und dem Doc-Viewer existiert kein
  Code"). Allesamt im Lifecycle auf Ebene der Schrittbeschreibungen
  ausführbar, ohne dass der Plan unklar wird.
- **Lifecycle-Tauglichkeit:** Jeder Schritt trägt Ziel, eigenständig
  verständliche Beschreibung mit Spezifikationsverweisen, messbare
  Akzeptanzkriterien (überwiegend automatisiert prüfbar: BFS-Kriterien,
  Seed-Determinismus, Asymmetrie-Assertions, Strukturmetriken) und explizite
  Abhängigkeiten — ohne Klassenebene. Alle Schritte taugen unverändert als
  Lifecycle-Eingabe.
- **Interpretationspunkt Detektivzahl:** FA-20 nennt „Testbereich 3–5"
  (OT-05), der Plan übernimmt den Konfigurations-Bereich 2–6 aus
  `04-balancing.md`/requirement.md-Konfigurationstabelle — konsistent, da der
  Menü-Bereich die Map-Grenze und 3–5 ein Test-Subset davon ist.
