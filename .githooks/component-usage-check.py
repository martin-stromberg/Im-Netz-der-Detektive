#!/usr/bin/env python3
"""Unused .tsx component check (analogous to the template's razor-usage-check).

Warns (never blocks the commit) about orphaned components: a .tsx file whose
PascalCase component name is not referenced by any other .ts/.tsx file in
src/ (no import, no JSX tag).

By default the check only runs when at least one .tsx file is staged
(nothing to warn about otherwise), but always audits the whole src/ tree so
orphans caused by the current change are still surfaced. Pass --all to run
the audit unconditionally and --strict to fail on findings (pre-push).

Exceptions (not checked):
  - main.tsx (entry point), App.tsx (root component)
  - Files whose name starts with a lowercase letter (not component convention)
  - *.test.tsx, *.d.ts
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

EXCLUDED_DIRS = {'.git', 'node_modules', 'dist', 'coverage', 'test-results', '.agents'}
SKIP_NAMES = {'main.tsx', 'App.tsx'}
SKIP_SUFFIXES = ('.test.tsx', '.d.ts')


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


def all_tsx_files(root):
    files = []
    src = root / 'src'
    if not src.is_dir():
        return files
    for p in src.rglob('*.tsx'):
        if any(part in EXCLUDED_DIRS for part in p.parts):
            continue
        files.append(p)
    return files


def all_source_files(root):
    files = []
    src = root / 'src'
    if not src.is_dir():
        return files
    for ext in ('*.ts', '*.tsx'):
        for p in src.rglob(ext):
            if any(part in EXCLUDED_DIRS for part in p.parts):
                continue
            if p.name.endswith(SKIP_SUFFIXES):
                continue
            files.append(p)
    return files


def is_used(component_name, component_path, all_contents):
    """True if the component is referenced in another source file - via an
    import specifier or a JSX tag."""
    jsx_pattern = re.compile(rf'<{re.escape(component_name)}[\s/>]')
    import_pattern = re.compile(
        rf'import[^;]*\b{re.escape(component_name)}\b[^;]*from', re.DOTALL
    )
    named_import_pattern = re.compile(
        rf'\{{[^}}]*\b{re.escape(component_name)}\b[^}}]*\}}', re.DOTALL
    )
    for path, content in all_contents.items():
        if path == component_path:
            continue
        if (
            jsx_pattern.search(content)
            or import_pattern.search(content)
            or named_import_pattern.search(content)
        ):
            return True
    return False


def find_unused_components(root):
    tsx_files = [
        f for f in all_tsx_files(root)
        if f.name not in SKIP_NAMES and not f.name.endswith(SKIP_SUFFIXES)
    ]

    contents = {}
    for f in all_source_files(root):
        try:
            contents[f] = f.read_text(encoding='utf-8', errors='replace')
        except OSError:
            continue

    unused = []
    for f in tsx_files:
        component_name = f.stem
        if not component_name or not component_name[0].isupper():
            continue
        if not is_used(component_name, f, contents):
            unused.append(f.relative_to(root).as_posix())
    return sorted(unused)


def parse_args():
    parser = argparse.ArgumentParser(description='unused .tsx component check')
    parser.add_argument('--all', action='store_true', help='run the audit unconditionally, not only when .tsx files are staged')
    parser.add_argument('--strict', action='store_true', help='exit 1 on findings instead of only warning')
    return parser.parse_args()


def main():
    args = parse_args()
    root = repo_root()
    if root is None:
        return 1

    if not args.all:
        staged_tsx = [f for f in staged_files() if f.endswith('.tsx')]
        if not staged_tsx:
            print('OK: no staged .tsx files, nothing to check.')
            return 0

    unused = find_unused_components(root)

    if unused:
        level = 'ERROR' if args.strict else 'WARNING'
        print(f'{level}: possibly orphaned .tsx components (not referenced anywhere in src/):')
        for u in unused:
            print(f'  {u}')
        print('  -> Reference the component, or delete it if it is no longer needed.')
        return 1 if args.strict else 0

    print('OK: no orphaned .tsx components found.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
