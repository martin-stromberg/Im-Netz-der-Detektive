#!/usr/bin/env python3
"""Erzeugt status.html aus steps.md (+ optionaler blocked.md) im selben Verzeichnis."""
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def parse_steps(text: str):
    steps = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("|") or line.startswith("|---") or "| #" in line:
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 5 or not cells[0].isdigit():
            continue
        steps.append(
            {
                "n": cells[0],
                "title": cells[1],
                "deps": cells[2],
                "branch": cells[3].strip("`"),
                "status": cells[4],
            }
        )
    title_m = re.search(r"^#\s+(.+)$", text, re.M)
    branch_m = re.search(r"Branch:\s*`([^`]+)`", text)
    return (
        title_m.group(1) if title_m else "Projekt",
        branch_m.group(1) if branch_m else "",
        steps,
    )


def main() -> int:
    steps_md = HERE / "steps.md"
    if not steps_md.exists():
        print("steps.md nicht gefunden", file=sys.stderr)
        return 1
    title, branch, steps = parse_steps(steps_md.read_text(encoding="utf-8"))

    blocked = HERE / "blocked.md"
    blocked_html = ""
    if blocked.exists():
        content = html.escape(blocked.read_text(encoding="utf-8"))
        blocked_html = f'<section class="blocked"><h2>Blockade</h2><pre>{content}</pre></section>'

    done = sum(1 for s in steps if s["status"] == "Fertig")
    total = len(steps)
    pct = round(done / total * 100) if total else 0

    rows = ""
    for s in steps:
        cls = {
            "Fertig": "done",
            "In Arbeit": "wip",
            "Blockiert": "blocked-row",
        }.get(s["status"], "open")
        rows += (
            f'<tr class="{cls}"><td>{html.escape(s["n"])}</td>'
            f"<td>{html.escape(s['title'])}</td>"
            f"<td>{html.escape(s['deps'])}</td>"
            f"<td><code>{html.escape(s['branch'])}</code></td>"
            f"<td>{html.escape(s['status'])}</td></tr>\n"
        )

    page = f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>{html.escape(title)} — Projektstatus</title>
<style>
body {{ font-family: system-ui, sans-serif; max-width: 1100px; margin: 2rem auto; padding: 0 1rem; color: #222; }}
h1 {{ font-size: 1.4rem; }}
.meta {{ color: #555; margin-bottom: 1rem; }}
.bar {{ background: #e5e5e5; border-radius: 6px; height: 22px; overflow: hidden; }}
.bar > div {{ background: #2e7d32; height: 100%; color: #fff; font-size: 0.8rem; text-align: center; line-height: 22px; transition: width .3s; }}
table {{ border-collapse: collapse; width: 100%; margin-top: 1rem; font-size: 0.9rem; }}
th, td {{ border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }}
th {{ background: #f5f5f5; }}
tr.done td {{ background: #e8f5e9; }}
tr.wip td {{ background: #fff8e1; }}
tr.blocked-row td {{ background: #ffebee; }}
code {{ font-size: 0.78rem; word-break: break-all; }}
.blocked {{ margin-top: 1.5rem; border: 2px solid #c62828; border-radius: 8px; padding: 0.8rem 1rem; background: #ffebee; }}
.blocked h2 {{ color: #c62828; margin-top: 0; }}
.blocked pre {{ white-space: pre-wrap; font-size: 0.85rem; }}
</style>
</head>
<body>
<h1>{html.escape(title)}</h1>
<p class="meta">Basisbranch: <code>{html.escape(branch)}</code> · Fortschritt: {done}/{total} Schritte fertig ({pct} %)</p>
<div class="bar"><div style="width:{pct}%">{pct}&nbsp;%</div></div>
<table>
<thead><tr><th>#</th><th>Titel</th><th>Abhängigkeiten</th><th>Branch</th><th>Status</th></tr></thead>
<tbody>
{rows}</tbody>
</table>
{blocked_html}
</body>
</html>
"""
    (HERE / "status.html").write_text(page, encoding="utf-8")
    print(f"status.html erzeugt: {done}/{total} Schritte fertig ({pct} %)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
