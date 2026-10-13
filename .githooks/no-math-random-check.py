#!/usr/bin/env python3
"""Math.random() prohibition for engine code under src/logic/.

The game engines must be deterministic: the seeded RNG (src/logic/rng.ts,
from step 2 onwards) is the single source of randomness so replays and
AI-vs-AI simulations stay reproducible. `Math.random()` in src/logic/**
is therefore forbidden.

Default scope (pre-commit): staged files under src/logic/. --all scans the
whole directory (pre-push). Findings are hard errors in both modes.
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

EXCLUDED_DIRS = {'.git', 'node_modules', 'dist', 'coverage', 'test-results', '.agents'}
LOGIC_DIR = Path('src') / 'logic'
MATH_RANDOM_RE = re.compile(r'\bMath\s*\.\s*random\s*\(')


def run(*args):
    return subprocess.run(args, capture_output=True, text=True)


def repo_root():
    res = run('git', 'rev-parse', '--show-toplevel')
    if res.returncode != 0:
        print('ERROR: not inside a git repository', file=sys.stderr)
        return None
    return Path(res.stdout.strip())


def staged_files():
    res = run('git', 'diff', '--cached', '--name-only', '--diff-filter=ACM')
    if res.returncode != 0:
        return []
    return [p for p in res.stdout.splitlines() if p]


def all_logic_files(root):
    logic_dir = root / LOGIC_DIR
    if not logic_dir.is_dir():
        return []
    files = []
    for ext in ('*.ts', '*.tsx'):
        for p in logic_dir.rglob(ext):
            if any(part in EXCLUDED_DIRS for part in p.parts):
                continue
            files.append(p)
    return sorted(files)


def strip_comments_and_strings(text):
    out = []
    i = 0
    n = len(text)
    while i < n:
        two = text[i:i + 2]
        if two == "//":
            j = text.find("\n", i)
            if j == -1:
                j = n
            out.append(" " * (j - i))
            i = j
        elif two == "/*":
            j = text.find("*/", i + 2)
            j = n if j == -1 else j + 2
            out.append(re.sub(r"[^\n]", " ", text[i:j]))
            i = j
        elif text[i] in ('"', "'", "`"):
            quote = text[i]
            j = i + 1
            while j < n and text[j] != quote:
                j += 2 if text[j] == "\\" and j + 1 < n else 1
            j = min(j + 1, n)
            out.append(re.sub(r"[^\n]", " ", text[i:j]))
            i = j
        else:
            out.append(text[i])
            i += 1
    return "".join(out)


def parse_args():
    parser = argparse.ArgumentParser(description='Math.random() prohibition for src/logic/**')
    parser.add_argument('--all', action='store_true', help='scan all of src/logic/, not only staged files')
    parser.add_argument('--strict', action='store_true', help='accepted for hook symmetry; findings are always errors')
    return parser.parse_args()


def main():
    args = parse_args()
    root = repo_root()
    if root is None:
        return 1

    if args.all:
        files = all_logic_files(root)
        scan_mode = 'all'
    else:
        prefix = LOGIC_DIR.as_posix() + '/'
        files = [root / f for f in staged_files()
                 if f.startswith(prefix) and f.endswith(('.ts', '.tsx'))]
        scan_mode = 'staged'
        if not files:
            print('OK: no staged files under src/logic/, nothing to check.')
            return 0

    if not files:
        print(f'No files under {LOGIC_DIR.as_posix()}/ found; nothing to check.')
        return 0

    failed = False
    checked = 0
    for path in files:
        if not path.exists():
            continue
        checked += 1
        rel = path.relative_to(root).as_posix()
        try:
            content = path.read_text(encoding='utf-8', errors='replace')
        except OSError:
            continue
        clean = strip_comments_and_strings(content)
        lines = [i + 1 for i, line in enumerate(clean.splitlines()) if MATH_RANDOM_RE.search(line)]
        if lines:
            failed = True
            print(f'ERROR: {rel} uses Math.random() (line(s): {", ".join(map(str, lines))})')
            print('  -> Engine code must stay deterministic: use the seeded RNG from')
            print('     src/logic/rng.ts as the single source of randomness.')
            print()

    if failed:
        return 1
    print(f'OK: {checked} {scan_mode} file(s) under src/logic/ checked, no Math.random() found.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
