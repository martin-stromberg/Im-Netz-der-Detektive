#!/usr/bin/env python3
"""i18n key parity and usage check for the JSON catalogs in src/i18n/.

Checks (analogous to the .resx translation-check of the template):
  1. Every t("...") / t('...') key used in scanned .ts/.tsx files must exist
     in every catalog under src/i18n/.
  2. All language files under src/i18n/ must define exactly the same key set
     (de.json <-> en.json parity).

Run as a pre-commit hook (default: staged .ts/.tsx files for the usage part;
parity always covers all catalogs) or with --all to scan the whole repo.
Findings are hard errors (exit 1) in both modes - an undefined translation
key is never tolerable.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

EXCLUDED_DIRS = {'.git', 'node_modules', 'dist', 'coverage', 'test-results', '.agents'}
I18N_DIR = Path('src') / 'i18n'

KEY_PATTERNS = [
    re.compile(r'(?<![\w$.])t\s*\(\s*"(?P<key>[^"]+)"'),
    re.compile(r"(?<![\w$.])t\s*\(\s*'(?P<key>[^']+)'"),
]


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
    for ext in ('*.ts', '*.tsx'):
        for p in (root / 'src').rglob(ext):
            if any(part in EXCLUDED_DIRS for part in p.parts):
                continue
            files.append(p.relative_to(root).as_posix())
    return files


def catalog_keys(path):
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, json.JSONDecodeError) as e:
        return None, f'cannot parse {path}: {e}'
    if not isinstance(data, dict):
        return None, f'{path}: top level is not a JSON object'
    return set(data.keys()), None


def parse_args():
    parser = argparse.ArgumentParser(description='i18n key parity/usage check')
    parser.add_argument('--all', action='store_true', help='scan all source files, not only staged ones')
    parser.add_argument('--strict', action='store_true', help='accepted for hook symmetry; findings are always errors')
    return parser.parse_args()


def main():
    args = parse_args()
    root = repo_root()
    if root is None:
        return 1

    i18n_dir = root / I18N_DIR
    catalogs = sorted(i18n_dir.glob('*.json')) if i18n_dir.is_dir() else []
    if not catalogs:
        print('No catalogs in src/i18n/ found; nothing to check.')
        return 0

    failed = False
    keys_per_catalog = {}
    for catalog in catalogs:
        keys, error = catalog_keys(catalog)
        rel = catalog.relative_to(root).as_posix()
        if error:
            failed = True
            print(f'ERROR: {error}')
            continue
        keys_per_catalog[rel] = keys

    # Part 1: parity between all catalogs
    union = set().union(*keys_per_catalog.values()) if keys_per_catalog else set()
    for rel, keys in sorted(keys_per_catalog.items()):
        missing = union - keys
        if missing:
            failed = True
            print(f'ERROR: {rel} is missing keys defined in other language files:')
            for key in sorted(missing):
                print(f'  {key}')
            print()

    # Part 2: t("...") usages must reference defined keys
    if args.all:
        files = all_source_files(root)
        scan_mode = 'all'
    else:
        files = [f for f in staged_files() if f.endswith(('.ts', '.tsx'))]
        scan_mode = 'staged'

    used = set()
    undefined = []
    for rel in files:
        path = root / rel
        if not path.exists():
            continue
        try:
            text = path.read_text(encoding='utf-8', errors='replace')
        except OSError:
            continue
        for pattern in KEY_PATTERNS:
            for m in pattern.finditer(text):
                key = m.group('key')
                used.add(key)
                if key not in union:
                    undefined.append((rel, key))

    if undefined:
        failed = True
        print('ERROR: the following i18n keys are used but not defined in src/i18n/:')
        for rel, key in sorted(set(undefined)):
            print(f'  {rel}: {key}')
        print()

    if failed:
        return 1

    print(f'OK: {len(used)} {scan_mode} i18n key(s) used, {len(keys_per_catalog)} catalog(s) in src/i18n/ are in parity.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
