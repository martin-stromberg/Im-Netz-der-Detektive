@echo off
REM ============================================================
REM  Startet die Konzept-Dokumentation "Im Netz der Detektive"
REM  im lokalen Webserver und oeffnet den Browser.
REM
REM  Voraussetzung: Python 3 im PATH (liefert http.server).
REM  Alternativ:  cd docs\konzept ^&^& npx serve -l 8899
REM ============================================================
cd /d "%~dp0docs\konzept"
start "" http://localhost:8899
python -m http.server 8899
