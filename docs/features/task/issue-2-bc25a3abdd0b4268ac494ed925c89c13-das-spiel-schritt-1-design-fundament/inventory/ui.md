# Bestandsaufnahme: UI / Styles

## Einstieg und globale Styles

- `src/main.tsx` — rendert `<App />`, importiert `App` und
  `useGameStore`. Kein CSS-Import.
- `index.html` — kein `<link>`/`<style>`; `<title>Im Netz der Detektive</title>`.
- `src/App.module.css` (5 Zeilen) — nur `.shell` (`min-height: 100vh`,
  `background: #0c0f16`), verwendet in `App.tsx` Zeile 24.

## CSS-Module und Rollen

| Datei | Zeilen | Rolle |
|-------|--------|-------|
| `src/components/GanoveScreen.module.css` | 394 | **Shared-Theme** — Basisklassen für alle Screens; WCAG-Kontrast-Kommentarblock Z. 1–27 |
| `src/components/Menu.module.css` | 234 | Menüfluss: `.menuList`, `.cardGrid`, `.card`, `.cardTitle`, `.badge`, `.fieldGrid`, `.numberInput`, `.selectInput`, `.rangeInput`, `.errorList`, `.summaryTable`, `.statGrid`, `.statBox`, `.statHeading`, `.statList`, `.replayControls`, `.perspectiveToggle` |
| `src/components/DetektivScreen.module.css` | 167 | Detektiv-Ergänzungen: `.steps`, `.step`, `.status_*`, `.toolToggle`, `.markerList`, `.markerHeading`, `.commentInput`, `.removeButton`, `.roundBadge`, `.legend*` |
| `src/components/MapGraph.module.css` | 246 | SVG-Karte: `.map`, `.edge*`, `.node*`, `.hitArea`, Marker-, Missions-, Kamera-, Zonen-Klassen |
| `src/components/MissionPanel.module.css` | 98 | `.panel`, `.heading`, `.steps`, `.choice*` |
| `src/components/EventBanner.module.css` | 72 | `.stack`, `.banner`, `.tone_*` |
| `src/components/HeatBadge.module.css` | 45 | `.badge`, `.level_*` |
| `src/components/PursuitBadge.module.css` | 51 | `.badge`, `.level_*`, `.ring`/`.dot` |
| `src/components/MapBackdrop.module.css` | 34 | Comic-Board-Features: `.feature_water` … `.feature_block` |

## Import-Verhältnisse (TSX)

`shared = GanoveScreen.module.css` wird importiert von:
`AppSettingsScreen`, `DetektivScreen`, `DevModeScreen`, `MainMenu`,
`MapSelect`, `MissionSelect`, `ModeSelect`, `ReplayScreen` (zusätzlich
`detektivStyles`), `ResumeScreen`, `SettingsScreen`, `StatsScreen` —
jeweils kombiniert mit einem eigenen Modul (`Menu.module.css` o. ä.).
`GanoveScreen.tsx` nutzt das Shared-Theme als `styles`.

## Heading-/Titel-Klassen (Ziele der Schmuckschrift)

| Klasse | Datei | Verwendung |
|--------|-------|------------|
| `.title` | `GanoveScreen.module.css` Z. 47 | `<h1>` auf allen Screens (31 Vorkommen von `shared.title`/`styles.title`/`shared.panelHeading`/`styles.heading` in TSX) |
| `.panelHeading` | `GanoveScreen.module.css` Z. 213 | `<h2>` Panel-Überschriften |
| `.heading` | `MissionPanel.module.css` Z. 5 | `<h2>` Missions-Panel |
| `.statHeading` | `Menu.module.css` Z. 158 | Statistik-Box-Überschriften |
| `.cardTitle` | `Menu.module.css` Z. 44 | Karten-Titel (Karten-/Fall-/Moduswahl) |
| `.markerHeading` | `DetektivScreen.module.css` Z. 59 | `<h3>` Marker-Panel |
| `.summaryTable th` | `Menu.module.css` Z. 139 | Tabellenköpfe (Fließtext-ähnlich, nicht zwingend Schmuckschrift) |

## Bestandspalette (Häufigkeit über alle Module)

Hex: `#e8b45a`(22) `#d98c8c`(19) `#f5d76e`(16) `#8a94a6`(15) `#161b26`(15)
`#c8d0dc`(14) `#2a3240`(14) `#9db8d9`(13) `#eaf0f8`(12) `#7fd4a8`(11)
`#0c0f16`(11) `#10141c`(8) `#1d2534`(5) `#f0c8c8`(4) `#7fb8d4`(4)
`#4a5568`(4) `#3d5a80`(4) `#243050`(4) `#b48ad4`(3) `#e8a05a`(2)
`#e88a7a`(2) `#d4a94f`(2) `#7a6a4f`(2) `#4a2326`(2) `#3a3f4a`(2)
`#a8e8c8` `#5c2c30` `#5a7db0` `#5a5148` `#3a4152` `#323a48` `#2f4a3a`
`#2e3a4d` `#2d4a66` `#202835` `#1f3328` `#1d3247`

rgb()/rgba(): `rgba(12,15,22,0.93/0.97)` Screen-Overlay, `rgb(217 140 140 /*)`
Pursuit-Vignette, `rgb(232 160 90 / 55%)`, `rgb(20 28 22|28 18 20|20 24 32 /
90%)` Splash-Hintergründe, `rgb(16 20 28 / 92%)` Banner, `rgb(0 0 0 / 45%)`
Banner-Schatten.

## WCAG-Dokumentation (Bestand)

`GanoveScreen.module.css` Z. 1–27 dokumentiert gemessene Kontraste, u. a.
`#eaf0f8`/`#0c0f16` = 16,7:1, `#e8b45a`/`#161b26` = 9,1:1,
`#8a94a6`/`#161b26` = 5,6:1 — alle ≥ 4,5:1.

## Testvertrag (nicht anfassen)

`data-*`-Attribute: u. a. `data-pursuit` (`GanoveScreen.module.css`),
`data-node-id`, `data-edge` in `MapGraph.tsx`; sichtbare Strings kommen
vollständig aus `t()` (`src/i18n/de.json`, `en.json`) — Hook
`no-hardcoded-strings-check.py` prüft das.
