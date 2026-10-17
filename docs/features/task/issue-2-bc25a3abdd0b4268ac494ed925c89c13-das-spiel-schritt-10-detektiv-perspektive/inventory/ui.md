# Bestandsaufnahme — UI-Komponenten

## `MapGraph.tsx` (geteilte SVG-Karte)
Datei: `src/components/MapGraph.tsx`

| Prop | Typ | Zweck |
|------|-----|-------|
| `map` | `MapPack` | viewBox, Knoten (id/name/x/y/categories/zone), Kanten (weg/fahrt) |
| `round` | `number` | für `untilRound` gesperrter Kanten |
| `blockedEdges` | `BlockedEdge[]` | grau + Barriere-Glyph (Form + Farbe) |
| `detectivePositions` | `string[]` | nummerierte D-Marker |
| `ganovePosition` | `string \| null` | Ganoven-Marker — nur Ganove-Perspektive |
| `legalTargets` | `MoveTarget[]` | klickbare Ziel-Ringe |
| `selectableNodeIds` | `string[]` | klickbare Spawn-Auswahl |
| `missionTargets`, `currentTargetId`, `escapeNodeIds` | — | Missions-Badges (ganove-seitig) |
| `onNodeSelect` | `(nodeId) => void` | Klick-/Enter-Handler |

Fehlt für die Detektiv-Perspektive: Kamera-Icons, Kategorie-Badges/Zonen,
aktiver Detektiv, Marker-Pins, „Mögliche Positionen"-Overlay. Interaktive
Knoten sind bereits `role="button"` + Tab/Enter.

## `GanoveScreen.tsx` (Muster-Referenz)
Datei: `src/components/GanoveScreen.tsx`

- Drei Ansichten: `idle` → `pickSpawn` → `playing` (+ `outcome-panel`).
- `runGuarded`: Store-Fehler (`MoveError` etc.) → `notice`-Text.
- URL-Parameter `?map=`, `?seed=`, `?mission=` (`auto|random|none|case:<id>`);
  Hook `autoDetectives={false}` deaktiviert den KI-Treiber in Tests.
- `installDetectiveDriver()` via `useEffect` in `playing`-Ansicht.
- Seitenleiste: `MissionPanel`, Intel-Feed (`visibleEvents(…,"ganove")`),
  Radio-Button, Abort-Button mit Bestätigung, `HeatBadge`, `MapLegend`.
- E2E-Hooks: `data-testid`, `data-view`, `data-outcome`, `data-selectable`,
  `data-legal-target`, `data-ganove`, `data-detective`.

## `MissionPanel.tsx`
Ganove-seitig: Schrittliste mit Status (`erledigt`/`aktuell`/`offen`,
Form-Marker ✓/▶/○) + `currentMissionTarget` + `pendingChoice`-Auswahl.
Zeigt gezogene Zielknoten — für die Detektivseite nur das
Statusmuster wiederverwendbar (Quelle dort: `getMissionStructure()`).

## `HeatBadge.tsx`
4-Stufen-Indikator (ganove-seitig, für Detektiv-UI nicht vorgesehen).

## `App.tsx` / `main.tsx`
`App.tsx` rendert direkt `<GanoveScreen />` — Modus-Switcher fehlt.
`main.tsx` exponiert `window.__gameStore` nur in DEV-Builds (E2E-Hook).

## i18n
`src/i18n/index.ts`: `t(key, params)` liest `de.json` (einzige Laufzeit-
Sprache), `TranslationKey` aus `de`; `de.json`/`en.json` müssen
schlüsselparitätisch bleiben (Hook `i18n-check.py`).

## Styling
`GanoveScreen.module.css`/`MapGraph.module.css`: dunkles Krimi-Theme
(#0c0f16-Hintergrund, #e8b45a-Amber, #3d5a80-Blau), CSS-Module-Konvention,
Form+Farbe-Codierung bereits etabliert.
