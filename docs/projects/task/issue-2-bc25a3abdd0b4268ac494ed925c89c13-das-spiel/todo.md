# Projekt-Tracking — Das Spiel (Issue #2)

Basisbranch: `task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel`
Issue: #2
Projektverzeichnis: `docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/`

## Checkliste

- [x] Branchprüfung (Basisbranch bestimmt, kein Hauptbranch)
- [x] Verzeichnis/Tracking angelegt
- [x] Einstiegspunkt bestimmt (Neues Projekt — keine Artefakte vorhanden)
- [x] Anforderung aufbereitet (`requirement.md`, 39 FA, 8 offene Fragen)
- [x] Bestandsaufnahme (`inventory.md` — Greenfield, Protection auf main/staging aktiv, Vorlagen .NET-spezifisch)
- [x] Projektplan (`project-plan.md`, 14 Schritte)
- [x] Offene Punkte geklärt (7 Entscheidungen: Asset-Strategie aufwändig via Pollinations/HF+SVG+WebAudio, 1 Schritt=1 Phase/RC, ZIP-Asset, 70 % Coverage, Hook-Umfang, Branch-Protection autorisiert, CI-Adaption bestätigt)
- [x] Planprüfung (`project-plan-check.md`, Status „vollständig", 0 Lücken)
- [x] Planungscommit (`plan: Im Netz der Detektive — asymmetrisches Browser-Verfolgungsspiel`)
- [x] Entwicklungsschritte-Tracking (`steps.md` + `status.html` via `generate_status.py`)
- [x] Entwicklungsschleife (alle 14 Schritte `Fertig`, jeweils Abnahme „Anforderung vollständig erfüllt" bzw. korrigiert, Merge auf Basisbranch, RC-Prerelease `v1.0.0-rc.1`–`rc.14` auf staging)
- [ ] Aufräumen (Projektverzeichnis entfernt)
- [ ] Abschlusscommit

## Hinweise

- lifecycle-Skill vorhanden: `.agents/skills/lifecycle/` (ASCII-kodiert, Einstieg `SKILL.md` → `lifecycle.md`)
- CI-Vorlage: Pattern-Collection `CI-Workflows/instructions.md` (.NET-Variante — muss auf Node/Vite adaptiert werden; staging/main existieren remote bereits)
- Git-Hooks-Vorlage: Pattern-Collection `Git-Hooks/` (Python-Skripte, .NET-fokussiert — analog für TS adaptieren)
