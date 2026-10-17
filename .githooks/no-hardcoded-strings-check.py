#!/usr/bin/env python3
"""Hardcoded visible-string check for React components under src/.

Spec `02-technisches-konzept.md` section 11: no hardcoded visible strings
in components — every user-facing text goes through `t()` (or a
data-package value resolved via `resolveText`/`t()`).

Scans every `.tsx` file (excluding `*.test.tsx` / `*.d.ts`) for:

  1. JSX text children containing letters — `>Hallo<`, `>{'Hallo'}<`.
     Letters cover Latin including German umlauts; pure symbol/number/
     punctuation children (`×`, `—`, `◀`, `?`, `{index + 1}`) are ignored.
     Expressions (`{t("…")}`, `{entry.name}`) never count.
  2. String literals in visible attributes — `aria-label`, `aria-description`,
     `placeholder`, `alt`, `title` — unless the value is an expression
     (`aria-label={t("…")}` is fine, `aria-label="…"` is not).

Escape hatch: a line containing `i18n-allow` is skipped (deliberate,
auditable exceptions only).

Default scope (pre-commit): staged `.tsx` files. `--all` scans the whole
`src/` tree (pre-push). Findings are hard errors in both modes.
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

EXCLUDED_DIRS = {'.git', 'node_modules', 'dist', 'dist-sim', 'coverage', 'test-results', '.agents'}
SRC_DIR = Path('src')

# Letters (incl. European diacritics) — explicitly excluding the
# multiplication/division signs × ÷ and pure symbols, which are used as
# shape glyphs in the UI rather than text.
LETTER = r'A-Za-zÀ-ÖØ-öø-žß'
LETTER_RE = re.compile(rf'[{LETTER}]')

# JSX text child: '>' then letter-bearing text (no < { } on the way),
# ending before '<' followed by a letter, '/' or '!' (a tag). The '>' may
# not be preceded by '=', whitespace or '>' — that excludes '=>', '>='
# and spaced comparisons like `a > b` (prettier always spaces them).
JSX_TEXT_RE = re.compile(
    rf'(?<![=\s>])>(?!\s*=)(?P<text>[ \t]*[^<{{}}\n]*[{LETTER}][^<{{}}\n]*)[ \t]*<(?=[A-Za-z/!])'
)

# JSX expression child that is only a string literal: >{"text"}< / >{'text'}<
JSX_EXPR_TEXT_RE = re.compile(
    rf'>\s*\{{\s*"(?P<dq>[^"]*[{LETTER}][^"]*)"\s*\}}\s*<(?=[A-Za-z/!])'
    rf'|>\s*\{{\s*\'(?P<sq>[^\']*[{LETTER}][^\']*)\'\s*\}}\s*<(?=[A-Za-z/!])'
)

# Visible attributes carrying a string literal (not an expression).
VISIBLE_ATTR_RE = re.compile(
    r'(?<![\w-])(?:aria-label|aria-description|placeholder|alt|title)'
    r'\s*=\s*(?:"(?P<dq>[^"]*)"|\'(?P<sq>[^\']*)\'|\{\s*"(?P<bdq>[^"]*)"\s*\}|\{\s*\'(?P<bsq>[^\']*)\'\s*\})'
)

ALLOW_MARKER = 'i18n-allow'


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
    for p in (root / SRC_DIR).rglob('*.tsx'):
        if any(part in EXCLUDED_DIRS for part in p.parts):
            continue
        files.append(p.relative_to(root).as_posix())
    return sorted(files)


def strip_comments_and_strings(text):
    """Blank out comments and string/template-literal contents.

    Keeps braces of `${…}` expressions inside template literals (they are
    code), removes everything else inside quotes. Line structure (line
    numbers) is preserved by replacing with spaces.
    """
    out = list(text)
    i = 0
    n = len(text)
    state = None  # None | 'line' | 'block' | 'sq' | 'dq' | 'tpl'
    tpl_expr_depth = []
    while i < n:
        ch = text[i]
        nxt = text[i + 1] if i + 1 < n else ''
        if state == 'line':
            if ch == '\n':
                state = None
            else:
                out[i] = ' '
        elif state == 'block':
            if ch == '*' and nxt == '/':
                out[i] = out[i + 1] = ' '
                i += 1
                state = None
            elif ch != '\n':
                out[i] = ' '
        elif state == 'sq':
            if ch == '\\':
                out[i] = out[i + 1] = ' '
                i += 1
            elif ch == "'":
                state = None
            elif ch != '\n':
                out[i] = ' '
        elif state == 'dq':
            if ch == '\\':
                out[i] = out[i + 1] = ' '
                i += 1
            elif ch == '"':
                state = None
            elif ch != '\n':
                out[i] = ' '
        elif state == 'tpl':
            if ch == '\\':
                out[i] = out[i + 1] = ' '
                i += 1
            elif ch == '`':
                state = None
            elif ch == '$' and nxt == '{':
                out[i] = ' '
                i += 1
                tpl_expr_depth.append(1)
                state = None  # resume code inside ${…}
            elif ch != '\n':
                out[i] = ' '
        else:  # code
            if tpl_expr_depth:
                # Inside a template ${…} expression: `}` may close it.
                if ch == '{':
                    tpl_expr_depth[-1] += 1
                elif ch == '}':
                    tpl_expr_depth[-1] -= 1
                    if tpl_expr_depth[-1] == 0:
                        tpl_expr_depth.pop()
                        state = 'tpl'
            if state is None:
                if ch == '/' and nxt == '/':
                    out[i] = out[i + 1] = ' '
                    i += 1
                    state = 'line'
                elif ch == '/' and nxt == '*':
                    out[i] = out[i + 1] = ' '
                    i += 1
                    state = 'block'
                elif ch == "'":
                    state = 'sq'
                elif ch == '"':
                    state = 'dq'
                elif ch == '`':
                    state = 'tpl'
        i += 1
    return ''.join(out)


def strip_comments(text):
    """Blank out comments only (keeps string contents for the attribute pass)."""
    out = list(text)
    i = 0
    n = len(text)
    state = None  # None | 'line' | 'block' | 'sq' | 'dq' | 'tpl'
    while i < n:
        ch = text[i]
        nxt = text[i + 1] if i + 1 < n else ''
        if state == 'line':
            if ch == '\n':
                state = None
            else:
                out[i] = ' '
        elif state == 'block':
            if ch == '*' and nxt == '/':
                out[i] = out[i + 1] = ' '
                i += 1
                state = None
            elif ch != '\n':
                out[i] = ' '
        elif state in ('sq', 'dq'):
            quote = "'" if state == 'sq' else '"'
            if ch == '\\':
                i += 1
            elif ch == quote:
                state = None
        elif state == 'tpl':
            if ch == '\\':
                i += 1
            elif ch == '`':
                state = None
        else:
            if ch == '/' and nxt == '/':
                out[i] = out[i + 1] = ' '
                i += 1
                state = 'line'
            elif ch == '/' and nxt == '*':
                out[i] = out[i + 1] = ' '
                i += 1
                state = 'block'
            elif ch == "'":
                state = 'sq'
            elif ch == '"':
                state = 'dq'
            elif ch == '`':
                state = 'tpl'
        i += 1
    return ''.join(out)


def line_of(text, offset):
    return text.count('\n', 0, offset) + 1


def check_file(root, rel):
    path = root / rel
    try:
        raw = path.read_text(encoding='utf-8', errors='replace')
    except OSError:
        return []

    findings = []
    code = strip_comments_and_strings(raw)
    for match in JSX_TEXT_RE.finditer(code):
        snippet = match.group('text').strip()
        if not LETTER_RE.search(snippet):
            continue
        line = line_of(code, match.start())
        source_line = raw.splitlines()[line - 1] if line <= len(raw.splitlines()) else ''
        if ALLOW_MARKER in source_line:
            continue
        findings.append(
            (line, f'JSX text child looks like visible copy: {snippet[:60]!r}')
        )

    comments_stripped = strip_comments(raw)
    for match in JSX_EXPR_TEXT_RE.finditer(comments_stripped):
        value = match.group('dq') or match.group('sq') or ''
        if not LETTER_RE.search(value):
            continue
        line = line_of(comments_stripped, match.start())
        source_line = raw.splitlines()[line - 1] if line <= len(raw.splitlines()) else ''
        if ALLOW_MARKER in source_line:
            continue
        findings.append((line, f'JSX string-literal child looks like visible copy: {value[:60]!r}'))
    for match in VISIBLE_ATTR_RE.finditer(comments_stripped):
        value = next((g for g in match.groups() if g is not None), '')
        if not LETTER_RE.search(value):
            continue
        line = line_of(comments_stripped, match.start())
        source_line = raw.splitlines()[line - 1] if line <= len(raw.splitlines()) else ''
        if ALLOW_MARKER in source_line:
            continue
        findings.append((line, f'visible attribute carries a string literal: {value[:60]!r}'))

    return findings


def parse_args():
    parser = argparse.ArgumentParser(description='hardcoded visible-string check')
    parser.add_argument('--all', action='store_true', help='scan all source files, not only staged ones')
    parser.add_argument('--strict', action='store_true', help='accepted for hook symmetry; findings are always errors')
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
        files = [
            f for f in staged_files()
            if f.endswith('.tsx') and not f.endswith(('.test.tsx', '.d.tsx'))
        ]
        scan_mode = 'staged'
    files = [f for f in files if not f.endswith(('.test.tsx', '.d.ts', '.d.tsx'))]

    failed = False
    total_findings = 0
    for rel in files:
        if rel.startswith('.githooks/') or rel.startswith('e2e/'):
            continue
        findings = check_file(root, rel)
        if findings:
            failed = True
            total_findings += len(findings)
            print(f'ERROR: {rel}')
            for line, message in findings:
                print(f'  line {line}: {message}')
            print()

    if failed:
        print(
            f'{total_findings} hardcoded visible string(s) found — move the text into src/i18n/ '
            'and render it via t() (or resolveText for data-package texts).'
        )
        return 1

    print(f'OK: {len(files)} {scan_mode} .tsx file(s) checked, no hardcoded visible strings.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
