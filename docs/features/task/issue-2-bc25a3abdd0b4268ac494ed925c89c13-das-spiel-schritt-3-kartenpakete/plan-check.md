# Plan-Gegenprüfung

## Ergebnis

**Status:** Plan vollständig

## Abgleich Akzeptanzkriterien

| Akzeptanzkriterium | Umsetzung im Plan | Testnachweis im Plan | Status |
|--------------------|-------------------|----------------------|--------|
| Beide Pakete bestehen Loader-Validierung; `loadMap("muenster")`/`loadMap("luebeck")` liefern vollständige Kartenobjekte | Umsetzungsschritte 1–2 (Pakete), Ablauf „Laden eines Kartenpakets" | `loadMap returns complete packages for both maps`; `MapLoader.test.ts`-Erweiterung | Abgedeckt |
| Münster: 45–60 Knoten, ~90–110 Kanten, Ø-Grad 3–4, zusammenhängend, alle vier Kategorien mehrfach, mind. eine `fahrt`-Kante | Schritt 1 (Zielgrößen 50–55 Knoten, 95–105 `weg`- + 5–8 `fahrt`-Kanten, Kategorie-Verteilung ≥ 5 je Kategorie) | `muenster has 45-60 nodes and 90-110 edges`, `average node degree`, `connected`, `every category has multiple candidates`, `both edge types` | Abgedeckt |
| Settings-Bereiche beider Karten im Format `{suggested, min, max}` bzw. feste Skalarfelder | Designentscheidung + Schritte 1–2 (Münster exakt nach `04-balancing.md`, Lübeck abweichend); Schema ohnehin erzwungen | `both maps satisfy settings format` | Abgedeckt |
| Missions-Generierungskriterien auf Münster-Graph grundsätzlich erfüllbar (Kandidaten je Kategorie, Paardistanz ≥3, Folge 3–8, Budget 18/22) | Ablauf „Missionskriterien-Erfüllbarkeit" + Schritt 3 | `muenster mission criteria are feasible`, `muenster sabotage detour is feasible` | Abgedeckt |
| Beide Pakete laden ohne Hartcodierung; Graphen zusammenhängend | Kein Code geändert — `import.meta.glob`; Zusammenhang Münster + Lübeck getestet | `connected`-Tests + `luebeck is structurally different but valid` | Abgedeckt |
| Lübeck: strukturell anderes, unbalanciertes Paket (~15–25 Knoten) | Schritt 2 + Designentscheidung „Lübeck-Unbalance" | `luebeck is structurally different but valid` | Abgedeckt |

## E2E-Abdeckung

| Benutzerfluss / Akzeptanzkriterium | Geplanter E2E-Test | Status |
|------------------------------------|--------------------|--------|
| – (kein Benutzerfluss; reine Daten-/Engine-Ebene, Karten-Auswahl/Rendering erst spätere Schritte) | – | Nicht erforderlich mit Begründung |

## Hinweise

- Die Missionskriterien-Prüfung als Existenzbeweis (≥ 1 erfüllbares
  Ziel-Tripel inkl. Sabotage-Variante) ist die sinnvoll minimal invasive
  Auslegung von „grundsätzlich erfüllbar" — bei Bedarf kann der Test die
  Anzahl erfüllbarer Tripel zusätzlich zählen und eine Untergrenze
  assertieren.
- `spawnRules.detectives` für Münster: `choice` mit echten Knoten-IDs
  (Anforderung erlaubt `choice`-IDs oder `free`/`random`) — im Plan als
  `choice` mit Innenstadt-/Bahnhofsknoten festgelegt.
