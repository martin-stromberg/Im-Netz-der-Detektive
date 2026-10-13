# Bestandsaufnahme: Detektiv-Perspektive (Schritt 10)

Analyse des bestehenden Codes bezogen auf die DetektiveUI-Anforderung
(`requirement.md`): Engine, Informationsasymmetrie, Deduktion, KI-Treiber und
die geteilte `MapGraph`-Komponente wurden auf vorhandene Bausteine geprüft.

## Zusammenfassung

- **Engine/Store vollständig:** `useGameStore` deckt den kompletten Rundenablauf
  ab — `startGame`, `moveDetective` (D1→Dn via `activeDetectiveIndex`, Fangprüfung
  je Zug), automatischer Phasenwechsel zu `ganove` nach dem letzten Detektiv,
  `getLegalDetectiveMoves`, `getMissionStructure` (struktur ohne Zielknoten),
  `outcome` für alle Endzustände.
- **KI-Ganove vorhanden, Treiber fehlt:** `GanoveAI.ts` (`chooseGanoveTurn`,
  `chooseSabotagePath`, `shouldUseRadio`, `GanoveView`) und
  `buildGanoveView`/`aiRng` in `AiSimulation.ts` existieren; ein
  store-gebundener Treiber analog `detectiveDriver.ts` fehlt noch.
- **Deduktion vorhanden:** `deducePossiblePositions` (`Deduction.ts`) liefert
  die exakte konsistente Knotenmenge; `detectiveStartsFromLog`
  (`detectiveDriver.ts`) rekonstruiert den Spawn-Prior aus dem Log-Header.
- **Asymmetrie-Bausteine vorhanden:** `visibleEvents`/`visibleCameras`
  (`InformationSystem.ts`) filtern auf Datenebene; `MapGraph` besitzt
  bewusst keine Kamera-/Hinweis-Props (strukturelles No-Leak).
- **MapGraph-Erweiterung nötig:** Kameras, Ortskategorien/Zonen, aktiver
  Detektiv, Marker-Pins und das Positions-Overlay fehlen als Render-Props.
- **UI-Muster wiederverwendbar:** `GanoveScreen` liefert das komplette Muster
  (IdleView/SpawnView/Playing-View, `data-testid`, `runGuarded`,
  URL-Parameter, Legende); `MissionPanel`-Schrittliste zeigt das
  Struktur-Statusmuster (für die Detektivseite ohne Zielknoten neu nötig).
- **Marker/Kommentare fehlen komplett** — werden als UI-State im Screen
  ergänzt (Vorgabe: nicht im Eventlog nötig).
- **Modus-Switcher fehlt:** `App.tsx` rendert aktuell direkt `GanoveScreen`.
- **i18n-Parität Pflicht:** `de.json`/`en.json` decken nur die GanoveUI ab;
  `t()` liest aktuell nur `de`.

Test-Ausgangszustand: `npm test` — 32 Dateien / 419 Tests, alle grün;
`npm run coverage` — 93,6 % Lines (Threshold 70 %). Nachweis:
[inventory/tests.md](inventory/tests.md).

## Details

- [Logik & State](inventory/logic.md)
- [UI-Komponenten](inventory/ui.md)
- [Tests](inventory/tests.md)
