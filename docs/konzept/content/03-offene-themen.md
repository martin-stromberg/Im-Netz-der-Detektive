# Offene Themen

> Checkliste der Klärungspunkte. **Stand: Alle Themen entschieden** —
> Entscheidungen sind in `01-spielkonzept.md`, `02-technisches-konzept.md`
> und `04-balancing.md` eingearbeitet. Zahlenwerte sind kalibrierbare
> Startwerte. Änderungsbedarf bitte hier diskutieren und nachziehen.

## Kritisch (blockiert das Konzept)

- [x] **OT-01 — Sabotage: optional oder Pflicht?** — *entschieden*
  Optional: Der Informant bietet nach der Kontakt-Aktion ein Sabotageziel an.
  Binärwahl: Sabotageziel **oder** Fluchtpunkt — kein Zurück.
- [x] **OT-02 — Missionswissen der Detektive** — *entschieden*
  Detektive kennen die **Missionsstruktur** und die Ziel-Pools
  (Ortskategorien sind öffentliche Karteneigenschaft), aber **niemals die
  gezogenen Zielknoten**. Aktions-Spuren verraten Ziele erst rückblickend.
- [x] **OT-03 — Fangbedingung** — *entschieden*
  Detektiv beendet Zug auf Ganoven-Knoten = Fang, Sofortprüfung nach jedem
  Einzelzug. Besetzte Knoten sind für den Ganoven illegale Ziele
  (UI filtert sie). Keine Fangprüfung auf Kanten.
- [x] **OT-04 — Wer spielt was im Prototyp** — *entschieden*
  Mensch als Ganove vs. 4 KI-Detektive. KI-vs.-KI nur als Dev-/Balancing-
  Modus mit Aufzeichnung. Kein Hot-Seat (verdeckte Züge würden leaken).
- [x] **OT-05 — Anzahl und Steuerung der Detektive** — *entschieden*
  4 Detektive, eine Steuerinstanz (Prototyp: KI). Konfigurationsparameter
  für Balancing (Testbereich 3–5).
- [x] **OT-06 — Sichtbarkeit der Detektive für den Ganoven** — *entschieden*
  Ja, jederzeit exakt („offen" laut Dok 1; auch mechanisch nötig für OT-03).

## Spielregeln & Ablauf

- [x] **OT-07 — Rundenstruktur** — *entschieden*
  Zwei Phasen: Ganove zuerst (Zug oder Aktion), dann D1→D4 sequenziell.
  Zugzwang für alle; Ausnahme: Aktionsrunde des Ganoven.
- [x] **OT-08 — Missionsreihenfolge** — *entschieden*
  Fest: Diebstahl → Kontakt → Binärwahl (Sabotage/Flucht). Feste Reihenfolge
  macht Spuren zu Prognosen — Kern der Detektiv-Deduktion.
- [x] **OT-09 — Zeitlimit und Generierungskriterien** — *entschieden*
  Zeitlimit **einstellbar**: Map-Vorschlag (Münster: 30), überschreibbar
  inkl. **„unbegrenzt"** (dann entscheidet nur Fang oder Flucht).
  Kriterien messbar per BFS: Zielabstände ≥ 3, aufeinanderfolgend 3–8,
  Gesamtroute ≤ 18 (mit Sabotage ≤ 22), Fluchtpunkt ≥ 4 vom Kontakt,
  Sabotage-Umweg ≤ +4.
- [x] **OT-10 — Aktionsrunde des Ganoven** — *entschieden*
  Betreten ≠ Aktion. Am Zielknoten: Wahl „ausführen" (verharren, verwundbar)
  oder weiterziehen. Aktion erzeugt exakten Spur-Hinweis, sichtbar **vor**
  den Detektivzügen derselben Runde. Sabotage-Angebot ohne Extra-Runde.

## Informationssystem

- [x] **OT-11 — Kamera vs. „nie exakte Position"** — *entschieden*
  Grundsatz umformuliert: „Hinweise zeigen, wo der Ganove **war** — nie wo
  er **ist**." Kamera = exakter Knoten + Auslöserunde (bewusste Ausnahme,
  vergangenheitsbezogen). Live-Exaktheit nur via Sichtbarkeitsereignis.
- [x] **OT-12 — Kamera-Parameter** — *entschieden*
  8 Kameras (~15 %), Mindestabstand 2 Kanten, dauerhaft aktiv.
  Ganove erfährt Positionen nie (Ausnahme: Polizeifunk).
- [x] **OT-13 — Umweltereignisse** — *entschieden*
  Sperren 1 zufällige Kante für 3 Runden, **beidseitig** wirksam und
  sichtbar (öffentliche Info wie eine Straßensperrung). Engine verhindert
  Isolation/Graph-Zerteilung.
- [x] **OT-14 — Sichtbarkeitsereignis** — *entschieden*
  Exakter Knoten für genau die laufende Runde, kein Trail, keine Route.
  Selten (~25 % der Ereignisse, ~2/Partie).
- [x] **OT-15 — Polizeifunk-Umfang** — *entschieden*
  Letzte **5 Hinweise** mit Typ/Runde, **inkl. Kameraauslösungen**.
  Keine unentdeckten Kameras, keine kommenden Ereignisse.
- [x] **OT-16 — Ganovenaktionen als Ereignistyp** — *entschieden*
  Sind Sabotage-Effekte (zufällig angeboten: Kameras aus / Funkstille /
  falsche Spur). „Verkleidung" reserviert als vierter Effekt.

## Karte & Content

- [x] **OT-17 — Münster-Graph** — *entschieden*
  Handgebaut auf realer Topografie, ~50 Knoten / ~90–110 Kanten, Ø-Grad 3–4.
  Zwei Kantentypen (`weg`/`fahrt`), `cost` reserviert. Knoten mit
  `categories` + `zone` + `x`/`y`. Kein OSM-Import im Prototyp (als späteres
  Werkzeug dokumentiert).
- [x] **OT-18 — Weitere Städte** — *entschieden*
  Multi-Stadt-Architektur (Kartenpakete) von Anfang an; Scope strikt:
  Münster fertig + Lübeck als unbalancierte Validierungskarte. Auswahlmenü
  zeigt weitere Städte „in Vorbereitung". Kandidatenliste + Kriterien in
  `01-spielkonzept.md` §8.

## Technik & Prototyp

- [x] **OT-20 — Technikentscheidungen** — *entschieden*
  TypeScript ja, Zustand ja (headless-fähig für Simulation), CSS-Module ja
  (kein Tailwind — SVG-Kern profitiert nicht von Utility-Klassen).
- [x] **OT-22 — Aufzeichnung** — *entschieden*
  JSONL-Eventlog (Header + Events + Result), deterministisch via
  zentralem Seeded-RNG. Zweck: Balancing-Analyse + Replay.
  `result`-Summary trägt die Balancing-Metriken.
- [x] **OT-23 — Balancing-Parameter** — *entschieden als Startwerte*
  Siehe `04-balancing.md`. Kalibrierung via Eventlog-Metriken
  (Ziel: ~40–50 % Ganove-Siegquote, Sabotage ~50/50-Abwägung).

## Randfälle

- [x] **OT-24 — Ganove ohne legale Züge** — *entschieden*
  Keine legalen Züge + keine ausführbare Aktion → Umzingelung = Fang.
- [x] **OT-25 — Kamera auf Missionsziel / Detektive auf Fluchtpunkt** — *entschieden*
  Missionsziele kamerafrei (öffentliche Regel). Besetzter Fluchtpunkt =
  nur illegales Zugziel, temporär durch Detektiv-Zugzwang. Flucht = Sieg
  bei Ankunft, keine Aktionsrunde.

## Nachträglich entschieden

- [x] **OT-26 — Map-abhängige Einstellungen** — *entschieden*
  Alle topologieskalierenden Parameter liegen im Kartenpaket als
  `{ suggested, min, max }` und sind im Menü überschreibbar:
  Detektivzahl, Kameraanzahl, Zeitlimit (inkl. unbegrenzt),
  Polizeifunk-Tiefe, Sperr-Dauer, Ereigniskadenz. Feste Map-Eigenschaften:
  Ereignis-Mischung, Missions-Regeln, Zonenradius, Sabotage-Effekt-Pool,
  Kamera-Mindestabstand. Reine Spielregeln bleiben global.
  Schema siehe `02-technisches-konzept.md` §4.
- [x] **OT-27 — Hitze-Indikator für den Ganoven** — *entschieden*
  4-stufiger „Polizeiaufmerksamkeits"-Level (ruhig/aktiv/erhöht/kritisch)
  aus gewichteter Hinweisaktivität der letzten 3 Runden — zeigt wie viel
  die Detektive wissen, nie was/woher. Details `01-spielkonzept.md` §4.6.
- [x] **OT-28 — Startaufstellung** — *entschieden*
  Spawn-Modi pro Map: `choice`/`free`/`random`; Mindestabstand zum
  Ganoven als Map-Parameter; Ganove wählt immer als Letzter.
  Schema `02-technisches-konzept.md` §4.
- [x] **OT-29 — Remis bei vorzeitigem Beenden** — *entschieden*
  Abbruch kann als Unentschieden gezählt werden (`outcome: "draw"`),
  keine Niederlage in der Statistik. Multiplayer später: beidseitig.
- [x] **OT-30 — Detektiv-Perspektive als Modus** — *entschieden*
  Zweiter Spielmodus: Mensch steuert 4 Detektive vs. KI-Ganove.
  Fast gratis, da KI-Ganove für den Dev-Modus ohnehin gebaut wird.
- [x] **OT-31 — Deduktions-Werkzeuge** — *entschieden*
  Hinweis-Chronik, Marker, „Mögliche Positionen"-Overlay; die KI nutzt
  dieselbe Datenstruktur intern (`Deduction.ts`).
- [x] **OT-32 — Schwierigkeits-Presets** — *entschieden*
  Presets bündeln Setting-Overrides (leicht/normal/schwer) innerhalb der
  Map-Bereiche — spätere Menü-Erweiterung.
- [x] **OT-33 — Szenarien („Fälle")** — *entschieden*
  Vordefinierte Missionen als benannte Mini-Stories pro Karte
  (JSON-Missionssets); dient Onboarding und Atmosphäre.
- [x] **OT-34 — Persistenz & Replay** — *entschieden*
  Save/Load via State-Snapshot + Log + Seed; Replay-Player spielt
  Eventlogs deterministisch ab (zwei Perspektiven); Statistiken aus Logs.
- [x] **OT-35 — Lokalisierung, Barrierefreiheit, Audio** — *entschieden*
  i18n DE/EN von Beginn an, farbenblind-sichere Icons (Form+Text),
  Tastaturbedienung, dezente Sound-Dramaturgie als Ganove-Spannungskanal.
- [ ] **OT-36 — Multiplayer-Detailfragen** — *bewusst später*
  Rollenverteilung (1 Ganove + koop. Detektive?), Zug-Timeouts,
  Disconnect-Handling, Remis-Vereinbarung beidseitig.
