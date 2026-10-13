# Dokumentation

Übersicht über alle dokumentierten Funktionsbereiche.

## Projekt

- [Projektinfrastruktur](projektinfrastruktur/index.md) — Build-, Test- und Qualitätsinfrastruktur, Git-Hooks und die staging→main-CI-Pipeline.

## Spiel

- [Spieloberfläche](spieloberflaeche/index.md) — Der spielbare Primärmodus: Mensch als Ganove gegen KI-Detektive, mit SVG-Karte, Missionsfortschritt, Hitze-Indikator und Polizeifunk.
- [Spiel-Engine](spiel-engine/index.md) — Headless-Spielkern: Kartenpaket-Loader und -Validator, Graph-Grundfunktionen (BFS), deterministischer Seeded-RNG, Startaufstellungs-System, Zustand-Store, kompletter Rundenmotor mit allen Endbedingungen, Informationsschicht (Kameras, Ereignisse, Hinweise, Polizeifunk, Hitze-Indikator), Missionssystem, Eventlog — sowie Deduktionsmodell, Detektiv-/Ganoven-KI und die deterministische KI-vs.-KI-Batchsimulation (`npm run sim`).
- [Kartenpakete](kartenpakete/index.md) — Die spielbaren Stadtkarten: Hauptkarte Münster (59 echte Orte) und die bewusst unbalancierte Lübeck-Altstadtinsel als Validierungskarte.
