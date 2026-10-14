# Logik & UI — i18n-/A11y-/Audio-relevante Bestandteile

## `t()` / `src/i18n/index.ts`

| Methode | Sichtbarkeit | Kurzbeschreibung |
|---------|-------------|------------------|
| `t(key, params?)` | export | Liest `de[key]` und ersetzt `{name}`-Platzhalter. **Nur DE — kein Sprachparameter, kein Store-Bezug.** |
| `TranslationKey` | export (Typ) | `keyof typeof de` — typisierte Schlüsselmenge |

Kataloge: `de.json`, `en.json` — je 240 Schlüssel, paritätisch (durch `i18n-check.py` gesichert).

## `useGameStore` (Zustand)

Datei: `src/state/gameStore.ts` — Singleton-Store; für diese Anforderung relevant:

| Methode | Zweck |
|---------|-------|
| `getHeatLevel()` | `{ level: HeatLevel; score: number }` aus `heatLevel(events, round)` (`src/logic/InformationSystem.ts` Zeilen 141–151); Stufen: `score 0 → ruhig, 1–2 → aktiv, 3–4 → erhoeht, ≥5 → kritisch` (Spec `04-balancing.md`: Schwellen 0/2/4/5) |
| `visibleEvents(events, side)` | daten-level-Filter der Sichtbarkeit |
| `events`, `round`, `outcome`, `phase`, `map`, `mission` | Store-Felder für Heat-/Ambient-Auslöser |

## Komponenten (UI-Dateien mit i18n-/A11y-Bezug)

| Datei | Befund |
|-------|--------|
| `src/App.tsx` | Screen-State-Maschine (`menu→map→mode→settings→mission→game`, `dev`, `stats`, `resume`, `replay`); kein `t()` direkt, aber Mount-Punkt für Sprach-Subscription und Audio-Unlock |
| `MainMenu.tsx` | komplett `t()`; Buttons `menu-new-game`, `menu-resume`, `menu-stats`; **kein Einstellungs-/Sprach-Eintrag** |
| `MapSelect.tsx` | `t()` + `map.name`/`map.tagline`-Datenliterale |
| `ModeSelect.tsx` | komplett `t()` |
| `SettingsScreen.tsx` | komplett `t()` — **per-Map-Spieleinstellungen**, keine App-Einstellungen; native Formular-Controls (tastaturbedienbar) |
| `MissionSelect.tsx` | `t()` + `entry.name`/`entry.story`-Datenliterale (Fall-Karten); Custom-Picker über `MapGraph`-Selektion |
| `GanoveScreen.tsx` | komplett `t()`; `HeatBadge`, `MissionPanel`, `MapGraph` (legale Ziele), Intel-Feed; Notices als `<p className={notice}>` **ohne `role="alert"`/`aria-live`**; kein Audio |
| `DetektivScreen.tsx` | komplett `t()`; Deduktionstools (Overlay-Toggle, Marker-Modus über `markableNodeIds`, Kommentar-Inputs mit `aria-label`); `×`-Glyph hartkodiert (mit `aria-label`); keine `aria-live`-Regionen |
| `MapGraph.tsx` | interaktive Knoten: `role="button"`, `tabIndex=0`, Enter/Space via `onNodeKeyDown`; **keine Pfeiltasten-Wanderung**; Formkodierung (wege/fahrt-Strichmuster, Sperrkreuz, Missionsformen-Rauten/Quadrate/Dreiecke/Flagge, Kamera-Streichung, nummerierte Detektiv-Marker, Diamant-Ganove, Diamant-Ring „mögliche Position", Zonen-Halos mit Legenden-Benennung); `role="img"` + `aria-label` |
| `HeatBadge.tsx` | Icon (4 Signalbalken) + Text + `role="status"` + `aria-label` — nie nur Farbe |
| `MissionPanel.tsx` | Schrittliste mit `✓ ▶ ○`-Markern + Text; **`.status_erledigt` Kontrast 3,19:1 (unter AA)** |
| `ResumeScreen.tsx` | `t()` + `mapName()`-Datenliteral; native Buttons |
| `StatsScreen.tsx` | `t()` + `—`-Platzhalter; native Controls |
| `ReplayScreen.tsx` | `t()`; `aria-pressed` auf Perspektiv-Toggle; native Controls |
| `DevModeScreen.tsx` | `t()` + `id`-Literale in Map-`<option>` (Map-Kennung); native Controls |
| `chronicle.ts` | komplett über `t()` |
| `menuFlow.ts` | `MenuScreen`-Union, `MENU_MAP_IDS`, `FORTHCOMING_MAP_IDS`, Kadenz-Helfer |
| `gameSetup.ts` | URL-Param-Helfer, `nextSeed()` via `Date.now()` (kein `Math.random`) |

## `GameIndex` / `Recorder` (Persistenz-Pattern)

`StorageLike` + `resolveStorage` (injizierbarer Boundary, siehe `models.md`) — Vorlage für die UI-Einstellungs-Persistenz (Sprache, Lautstärke, Mute).

## Audio

**Nichts vorhanden.** Keine `AudioContext`-Referenz im Repo (`grep` bestätigt), kein `src/audio/`, keine Lautstärke-Einstellung. jsdom (`vitest`-Umgebung) stellt keinen `AudioContext` bereit — die Engine muss `supported = false` tolerant behandeln bzw. eine Fabrik injizierbar machen.
