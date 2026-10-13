# Übersetzte Anforderung: Informationssystem (Schritt 5)

## Fachliche Zusammenfassung

Der headless Spielkern wird um die komplette Informationsschicht
(`01-spielkonzept.md` §4, `04-balancing.md`) erweitert: Kameraplatzierung
und -auslösung, drei Ereignis-Auslösemodi (`cycle`/`chance`/`tension`)
mit drei Ereignistypen (`sichtbarkeit`/`hinweis`/`umwelt`),
vergangenheitsbezogene Hinweise ausschließlich für die Detektive, ein
einmalig nutzbarer Polizeifunk für den Ganoven und ein 4-stufiger
Hitze-Indikator. Die Informationsasymmetrie wird datenseitig über ein
`visibleTo`-Prinzip durchgesetzt, nicht erst in der Anzeige.

## Akzeptanzkriterien (aus der Kundenanforderung)

1. Kameraplatzierung hält Mindestabstand (`cameraMinGap` Kanten) und
   Ausschlussliste geschützter Knoten über viele Seeds ein; eine
   Kameraauslösung erzeugt einen Hinweis mit exaktem Knoten +
   Auslöserunde, sichtbar nur für Detektive.
2. Alle drei Auslösemodi erzeugen die spezifizierte Kadenz: `cycle`
   deterministisch alle X Runden; `chance` statistisch; `tension`
   garantiert ~alle 4 Runden bei den Karten-Defaults.
3. Die Typmischung nähert sich über viele Auslösungen 25/45/30 an;
   Umweltsperrungen zerteilen den Graphen nie und blockieren nie die
   letzte freie Kante eines Knotens.
4. Kein Hinweis verrät die Live-Position — Ausnahme: das
   Sichtbarkeitsereignis, das nach der laufenden Runde verfällt.
   Hinweise sind ausschließlich detektivsichtig.
5. Polizeifunk: genau einmal pro Partie, liefert exakt die letzten
   `radioHintCount` Hinweise inkl. Kameratreffer; keine unentdeckten
   Kameras, keine kommenden Ereignisse.
6. Hitze-Level exakt nach Gewichtungstabelle über das 3-Runden-Fenster
   (Zonen-Hinweis +1, Kamera +2, Aktions-Spur +2, Sichtbarkeit +3;
   Schwellen 0 / 1–2 / 3–4 / ≥5).
7. Automatisierte Asymmetrie-Prüfung: die Ganoven-Sicht enthält weder
   Kameras, Hinweise noch hinweisgebende Ereignisse.

## Betroffene Klassen und Komponenten

### Neue Module unter `src/logic/`

- `CameraSystem.ts` — Kameraplatzierung (RNG + Mindestabstand via BFS +
  Ausschlussliste), Auslöseprüfung beim Betreten, `deactivateAll()`
- `EreignisEngine.ts` — drei Auslösemodi, Typmischung via `eventMix`,
  Zonenhinweis-Region (`hintZoneRadius`), sichere Kantenwahl für
  `umwelt` (Konnektivitäts-/Isolations-Check)
- `InformationSystem.ts` — Asymmetrie-Sichten (`visibleTo`-Filter),
  Polizeifunk-Zusammenfassung, Hitze-Indikator (Gewichtung +
  3-Runden-Fenster + 4 Stufen), Verfall des Sichtbarkeits-Events

### Bestehende Dateien

- `src/state/gameStore.ts` — `GameEvent` um `visibleTo: "ganove"` und
  optionale Felder (Kante, Ablaufrunde, Hinweisregion, Details)
  erweitern; Kameraplatzierung in `startGame`; Kamera-/Ereignis-/
  Hinweisprüfung intern sofort nach dem Ganovenzug (vor der
  Detektivphase); neue Actions `useRadio()`, `deactivateCameras()`,
  `getHeatLevel()`; State-Feld `radioUsed`; `StartGameOptions` um
  `cameraCount`, `cameraProtectedNodes`, `radioHintCount`,
  `edgeBlockRounds` erweitern
- `src/logic/rng.ts` — unverändert, einzige Zufallsquelle
- Tests: neue `*.test.ts`-Dateien je Modul plus Store-Integrationstests

## Implementierungsansatz

- Timeline-Integration (gemäß `01-spielkonzept.md` §3.1): Kamera-,
  Ereignis- und Hinweisprüfung laufen intern sofort nach dem
  Ganovenzug ab — in `moveGanove` nach der Fluchtprüfung, vor dem
  Phasenwechsel zu `detektive`. In `ganoveAction` läuft nur die
  Ereignisprüfung (kein Betreten → keine Kameraauslösung). Neue
  Hinweise sind damit den Detektiven vor ihren Zügen sichtbar.
- Alle Engine-Module bleiben rein und deterministisch: jede Zufallszahl
  kommt aus dem `Rng` aus `rng.ts`; `Math.random()` ist verboten
  (Git-Hook).
- Pro-Runde-RNG wird aus `seed` und `round` abgeleitet, damit der Store
  serialisierbar bleibt und Replays deterministisch sind.
- Umweltsperrung: Kandidatenkanten werden in RNG-Reihenfolge geprüft;
  eine Kante ist nur zulässig, wenn der Graph (abzüglich bereits
  gesperrter Kanten) nach ihrer Entfernung zusammenhängend bleibt —
  das deckt „nie letzte freie Kante" und „keine Zerteilung" ab.

## Konfiguration

Alle Parameter kommen aus dem Kartenpaket (`settings`): `cameraCount`,
`cameraMinGap`, `eventMode`, `eventDefaults` (`cycle`, `chance`,
`threshold`, `perRound`), `eventMix`, `hintZoneRadius`,
`edgeBlockRounds`, `radioHintCount`. Overrides innerhalb der
Map-Bereiche über `StartGameOptions` (Menü-Vorgriff), validiert via
`GameConfigError`.

## Offene Fragen

- Keine. Die Timeline-Stelle ist durch §3.1 vorgegeben; die genaue
  Semantik der Zonen-Hinweisregion (BFS-Ball um die tatsächliche
  Position, benannt nach der Zone des Ganove-Knotens) wird als
  Designentscheidung im Plan festgehalten.
