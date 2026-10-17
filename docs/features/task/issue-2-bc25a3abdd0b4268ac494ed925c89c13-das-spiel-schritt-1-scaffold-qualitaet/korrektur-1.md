# Korrektur 1 – `.gitattributes`: LF-Checkout für alle Textdateien

## Anlass

Abnahmeprüfung `docs/projects/task/issue-2-bc25a3abdd0b4268ac494ed925c89c13-das-spiel/acceptance-schritt-1.md`:

- `npm run format:check` schlug auf diesem Windows-Checkout
  (`core.autocrlf=true`) mit Exit 1 fehl, obwohl die committeten Blobs
  LF-sauber sind (`i/lf w/crlf`).
- Ursache: `.gitattributes` pinnte `eol=lf` nur für `*.sh`/`*.yml`/`*.mjs`
  und Hook-Dateien; alle übrigen Textdateien (`*.ts`, `*.tsx`, `*.json`,
  `*.css`, `*.html`, `*.js`, `*.md`, …) fielen unter `* text=auto` und
  wurden mit CRLF ausgecheckt. Prettier (`endOfLine: "lf"` in
  `.prettierrc`) bricht dann ab — konkreter Befund: `src/i18n/en.json`.
- Damit war das Akzeptanzkriterium „ESLint- und Prettier-Prüfung bestehen"
  auf der Zielplattform Windows nicht erfüllt.

## Korrektur

`.gitattributes`:

- `* text=auto` → `* text=auto eol=lf`: alle Textdateien werden
  verbindlich mit LF ausgecheckt (deckt sämtliche Prettier-/ESLint-
  Fileglobs ab: `prettier --check .` läuft über alle nicht per
  `.prettierignore` ausgeschlossenen Dateien, `eslint .` entsprechend).
- Bestehende Regeln (`.githooks/*`, `*.sh`, `*.yml`, `*.mjs`) beibehalten
  — als explizite Absicherung, inhaltlich redundant zur globalen Regel.
- Explizite binäre Ausnahmen ergänzt (`*.png`, `*.jpg`, `*.zip`,
  `*.woff*`, `*.pdf` u. a.), damit zukünftige Assets nicht normalisiert
  werden.

Working Tree: nach Attribut-Änderung alle getrackten Dateien gelöscht und
aus dem Index neu ausgecheckt (`git ls-files -z | xargs -0 rm -f`,
`git checkout -- .`). `git ls-files --eol` zeigt danach für alle Dateien
`i/lf w/lf` (Ausnahme: leeres `src/data/maps/.gitkeep`, `i/none w/none`).

## Verifikation (lokal, Windows-Checkout, Branch task/…-schritt-1-scaffold-qualitaet)

| Befehl | Ergebnis |
| --- | --- |
| `git ls-files --eol` | alle `w/lf` (vorher flächendeckend `w/crlf`) |
| `npm run format:check` | Exit 0 — „All matched files use Prettier code style!" (vorher Exit 1, Befund `src/i18n/en.json`) |
| `npm run lint` | Exit 0 |
| `npm test` | Exit 0 — 4 Dateien / 25 Tests grün |
| `npm run build` | Exit 0 — `tsc --noEmit` + `vite build`, `dist/` erzeugt |
