#!/usr/bin/env python3
"""Stub-implementation check for TypeScript files.

Forbids (in .ts/.tsx files):
  1. `throw new Error("not implemented")` style placeholder throws
     (any error class, any casing of "not implemented", incl. German
     "nicht implementiert").
  2. Functions/methods/arrow functions whose entire body consists of a
     single throw statement (placeholder stubs).
  3. Bodies that contain nothing but a TODO/FIXME comment.

Background: such stubs turn compile-time safety into runtime errors.
Members should either be fully implemented or not exist yet.

By default (as used in pre-commit) this only WARNS on staged files and
always exits 0, so work in progress is allowed. Pass --strict (as used in
pre-push) to turn findings into a hard failure (exit 1), so stubs cannot
leave the machine. Pass --all to scan the whole repository instead of
only staged files.
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

EXCLUDED_DIRS = {'.git', 'node_modules', 'dist', 'coverage', 'test-results', '.agents'}
EXTENSIONS = ('.ts', '.tsx')
SKIP_SUFFIXES = ('.test.ts', '.test.tsx', '.d.ts')

# Explicit "not implemented" throws in any error flavour.
NOT_IMPL_RE = re.compile(
    r"throw\s+new\s+\w*Error\w*\s*\(\s*['\"`][^'\"`]*?"
    r"(?:not\s+implemented|nicht\s+implementiert)",
    re.IGNORECASE,
)

# Function/method bodies consisting of a single throw statement.
# The signature prefix intentionally only forbids "{", "}" and ";" so that
# "=" in default parameters or generics doesn't exclude real stubs.
TS_MODIFIER = (
    r"(?:export\s+)?(?:public|private|protected|static|async|readonly|"
    r"override|abstract|const|let|var|function)"
)
STUB_BLOCK_RE = re.compile(
    rf"{TS_MODIFIER}[^{{}};]*\)\s*(?::\s*[^{{}};]+)?\{{\s*throw\s+[^{{}};]*;\s*\}}"
)
STUB_ARROW_RE = re.compile(r"=>\s*\{\s*throw\s+[^{}]*;\s*\}")

# Body that contains only comments mentioning TODO/FIXME (checked against
# the raw text; the stripped variant tells us nothing else was there).
RAW_EMPTY_BODY_RE = re.compile(r"\{\s*((?://[^\n]*)|(/\*.*?\*/)|\s)*\}", re.DOTALL)
TODO_MARK_RE = re.compile(r"\b(?:TODO|FIXME)\b", re.IGNORECASE)


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


def all_source_files(root):
    files = []
    for ext in EXTENSIONS:
        for p in root.rglob(f'*{ext}'):
            if any(part in EXCLUDED_DIRS for part in p.parts):
                continue
            rel = p.relative_to(root).as_posix()
            if rel.endswith(SKIP_SUFFIXES):
                continue
            files.append(rel)
    return files


def strip_comments_and_strings(text):
    """Replaces comments and string/template literals with spaces, keeping
    newlines so line numbers stay correct."""
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
        elif text[i] == "`":
            j = i + 1
            while j < n and text[j] != "`":
                j += 2 if text[j] == "\\" and j + 1 < n else 1
            j = min(j + 1, n)
            out.append(re.sub(r"[^\n]", " ", text[i:j]))
            i = j
        elif text[i] in ('"', "'"):
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


def find_stub_issues(raw, clean):
    """Returns a list of issue strings. `raw` is the original file content,
    `clean` the comment/string-stripped variant."""
    source_lines = raw.splitlines()

    def line_of(pos):
        return clean.count("\n", 0, pos) + 1

    def source_line_text(ln):
        return source_lines[ln - 1].strip() if 0 < ln <= len(source_lines) else ""

    found = {}

    for m in NOT_IMPL_RE.finditer(clean):
        ln = line_of(m.start())
        found[ln] = f"  Zeile {ln}: 'not implemented'-Throw verwendet — {source_line_text(ln)[:120]}"

    for pattern, label in (
        (STUB_BLOCK_RE, "Funktions-/Methodenrumpf besteht nur aus einem throw-Statement (Stub)"),
        (STUB_ARROW_RE, "Arrow-Body besteht nur aus einem throw-Statement (Stub)"),
    ):
        for m in pattern.finditer(clean):
            ln = line_of(m.start())
            found.setdefault(ln, f"  Zeile {ln}: {label}")

    # Bodies with only a TODO/FIXME comment: stripped variant is empty.
    for m in re.finditer(r"\{([^{}]*)\}", raw):
        inner_raw = m.group(1)
        if not TODO_MARK_RE.search(inner_raw):
            continue
        stripped_inner = strip_comments_and_strings(inner_raw)
        if not stripped_inner.strip():
            ln = line_of(m.start())
            found.setdefault(
                ln,
                f"  Zeile {ln}: Rumpf enthaelt nur einen TODO/FIXME-Kommentar (Stub)",
            )

    return [found[ln] for ln in sorted(found)]


def parse_args():
    parser = argparse.ArgumentParser(description='not-implemented / stub check for TypeScript')
    parser.add_argument('--all', action='store_true', help='scan all .ts/.tsx files, not only staged ones')
    parser.add_argument('--strict', action='store_true', help='exit 1 on findings instead of only warning')
    return parser.parse_args()


def main():
    args = parse_args()
    root = repo_root()
    if root is None:
        return 1

    if args.all:
        files = all_source_files(root)
        scan_mode = 'all'
    else:
        files = [f for f in staged_files()
                 if f.endswith(EXTENSIONS) and not f.endswith(SKIP_SUFFIXES)]
        scan_mode = 'staged'

    checked = 0
    any_found = False
    for rel in files:
        path = root / rel
        if not path.exists():
            continue
        checked += 1
        try:
            content = path.read_text(encoding='utf-8', errors='replace')
        except OSError:
            continue

        issues = find_stub_issues(content, strip_comments_and_strings(content))
        if issues:
            any_found = True
            level = 'ERROR' if args.strict else 'WARNING'
            print(f'{level}: verbotene Platzhalter-Implementierung in {rel}:')
            print('\n'.join(issues))
            print('  -> "not implemented"-Throws, throw-only-Ruempfe und TODO-Stubs sind')
            print('     nicht erlaubt. Vollstaendig implementieren oder Member weglassen.')
            print()

    if any_found:
        if args.strict:
            return 1
        print('(Nur Warnung beim Commit - muss vor dem Push vollstaendig implementiert sein.)')
        return 0

    print(f'OK: {checked} {scan_mode} .ts/.tsx file(s) checked, no stub implementations found.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
