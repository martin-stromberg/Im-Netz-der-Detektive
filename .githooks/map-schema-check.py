#!/usr/bin/env python3
"""Map package schema check for src/data/maps/*.json.

Validates every map package against the format specified in
docs/konzept/content/02-technisches-konzept.md section 4:

  - Top level: id, name, viewBox (strings), nodes[], edges[],
    spawnRules{}, settings{} (all required).
  - nodes[]: { id: str (unique), name: str, x: number, y: number,
    categories: non-empty list of diebstahl|kontakt|sabotage|flucht,
    zone: str }.
  - edges[]: { a, b: existing node ids, type: weg|fahrt,
    cost: number (optional, reserved) }.
  - spawnRules: { detectives: {mode}, ganove: {mode},
    order: "detektive_first" } with mode in choice|free|random;
    mode "choice" requires a non-empty nodes[]/zones[] list of valid
    references; "free" supports optional minDistanceToDetective (number).
  - settings: range objects {suggested, min, max} (suggested within
    [min, max]) for detectiveCount, cameraCount, radioHintCount,
    edgeBlockRounds; roundLimit may carry unlimited: true instead of max;
    scalar fields cameraMinGap, hintZoneRadius (numbers); eventMode in
    cycle|chance|tension; eventDefaults {cycle, chance, threshold,
    perRound} numbers; eventMix {sichtbarkeit, hinweis, umwelt} numbers;
    missionRules {minGap, maxGap, routeBudget, routeBudgetSabotage,
    sabotageDetour} numbers; sabotageEffects subset of
    kamera_aus|funkstille|falsche_spur.

Findings are hard errors in every mode. Default scope: staged map files
(runs only if at least one is staged); --all audits every map package.
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

EXCLUDED_DIRS = {'.git', 'node_modules', 'dist', 'coverage', 'test-results', '.agents'}
MAPS_DIR = Path('src') / 'data' / 'maps'

CATEGORIES = {'diebstahl', 'kontakt', 'sabotage', 'flucht'}
EDGE_TYPES = {'weg', 'fahrt'}
SPAWN_MODES = {'choice', 'free', 'random'}
EVENT_MODES = {'cycle', 'chance', 'tension'}
SABOTAGE_EFFECTS = {'kamera_aus', 'funkstille', 'falsche_spur'}
RANGE_SETTINGS = {'detectiveCount', 'cameraCount', 'radioHintCount', 'edgeBlockRounds'}
SCALAR_SETTINGS = {'cameraMinGap', 'hintZoneRadius'}
EVENT_DEFAULT_KEYS = {'cycle', 'chance', 'threshold', 'perRound'}
EVENT_MIX_KEYS = {'sichtbarkeit', 'hinweis', 'umwelt'}
MISSION_RULE_KEYS = {'minGap', 'maxGap', 'routeBudget', 'routeBudgetSabotage', 'sabotageDetour'}


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


def all_map_files(root):
    maps_dir = root / MAPS_DIR
    if not maps_dir.is_dir():
        return []
    return sorted(p for p in maps_dir.glob('*.json') if p.is_file())


def is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def check_range(path):
    if not isinstance(path, dict):
        return 'must be an object {suggested, min, max}'
    if not is_number(path.get('suggested')):
        return 'must have numeric "suggested"'
    if not is_number(path.get('min')):
        return 'must have numeric "min"'
    if 'unlimited' in path:
        if path['unlimited'] is not True:
            return '"unlimited" must be true when present'
        if 'max' in path and not is_number(path['max']):
            return '"max" must be numeric when present'
    elif not is_number(path.get('max')):
        return 'must have numeric "max" (or "unlimited": true)'
    if 'max' in path and is_number(path.get('max')):
        if path['min'] > path['max']:
            return 'min must not exceed max'
        if not (path['min'] <= path['suggested'] <= path['max']):
            return 'suggested must be within [min, max]'
    elif not is_number(path.get('max')) and path['suggested'] < path['min']:
        return 'suggested must be >= min'
    return None


def check_spawn_rule(rule, node_ids, where, errors):
    if not isinstance(rule, dict):
        errors.append(f'{where}: must be an object')
        return
    mode = rule.get('mode')
    if mode not in SPAWN_MODES:
        errors.append(f'{where}.mode: must be one of {sorted(SPAWN_MODES)} (got {mode!r})')
    if mode == 'choice':
        nodes = rule.get('nodes')
        zones = rule.get('zones')
        if not isinstance(nodes, list) and not isinstance(zones, list):
            errors.append(f'{where}: mode "choice" requires "nodes" or "zones" list')
        if isinstance(nodes, list):
            if not nodes:
                errors.append(f'{where}.nodes: must not be empty')
            for ref in nodes:
                if ref not in node_ids:
                    errors.append(f'{where}.nodes: unknown node id {ref!r}')
    if 'minDistanceToDetective' in rule and not is_number(rule['minDistanceToDetective']):
        errors.append(f'{where}.minDistanceToDetective: must be a number')


def validate_map(data, errors):
    for field in ('id', 'name', 'viewBox'):
        if not isinstance(data.get(field), str) or not data[field].strip():
            errors.append(f'{field}: required non-empty string')

    nodes = data.get('nodes')
    node_ids = set()
    if not isinstance(nodes, list) or not nodes:
        errors.append('nodes: required non-empty array')
        nodes = []
    for i, node in enumerate(nodes):
        where = f'nodes[{i}]'
        if not isinstance(node, dict):
            errors.append(f'{where}: must be an object')
            continue
        nid = node.get('id')
        if not isinstance(nid, str) or not nid.strip():
            errors.append(f'{where}.id: required non-empty string')
        elif nid in node_ids:
            errors.append(f'{where}.id: duplicate node id {nid!r}')
        else:
            node_ids.add(nid)
        if not isinstance(node.get('name'), str) or not node['name'].strip():
            errors.append(f'{where}.name: required non-empty string')
        for coord in ('x', 'y'):
            if not is_number(node.get(coord)):
                errors.append(f'{where}.{coord}: required number')
        categories = node.get('categories')
        if not isinstance(categories, list) or not categories:
            errors.append(f'{where}.categories: required non-empty array')
        else:
            for cat in categories:
                if cat not in CATEGORIES:
                    errors.append(f'{where}.categories: invalid category {cat!r} (allowed: {sorted(CATEGORIES)})')
        if not isinstance(node.get('zone'), str) or not node['zone'].strip():
            errors.append(f'{where}.zone: required non-empty string')

    edges = data.get('edges')
    if not isinstance(edges, list) or not edges:
        errors.append('edges: required non-empty array')
        edges = []
    for i, edge in enumerate(edges):
        where = f'edges[{i}]'
        if not isinstance(edge, dict):
            errors.append(f'{where}: must be an object')
            continue
        for endpoint in ('a', 'b'):
            ref = edge.get(endpoint)
            if ref not in node_ids:
                errors.append(f'{where}.{endpoint}: unknown node id {ref!r}')
        if edge.get('type') not in EDGE_TYPES:
            errors.append(f'{where}.type: must be one of {sorted(EDGE_TYPES)} (got {edge.get("type")!r})')
        if 'cost' in edge and not is_number(edge['cost']):
            errors.append(f'{where}.cost: must be a number when present')

    spawn = data.get('spawnRules')
    if not isinstance(spawn, dict):
        errors.append('spawnRules: required object')
    else:
        if spawn.get('order') != 'detektive_first':
            errors.append('spawnRules.order: must be "detektive_first"')
        for side in ('detectives', 'ganove'):
            if side not in spawn:
                errors.append(f'spawnRules.{side}: required')
            else:
                check_spawn_rule(spawn[side], node_ids, f'spawnRules.{side}', errors)

    settings = data.get('settings')
    if not isinstance(settings, dict):
        errors.append('settings: required object')
        return

    for name in sorted(RANGE_SETTINGS):
        if name not in settings:
            errors.append(f'settings.{name}: required range object')
        else:
            err = check_range(settings[name])
            if err:
                errors.append(f'settings.{name}: {err}')
    if 'roundLimit' not in settings:
        errors.append('settings.roundLimit: required range object')
    else:
        err = check_range(settings['roundLimit'])
        if err:
            errors.append(f'settings.roundLimit: {err}')
    for name in sorted(SCALAR_SETTINGS):
        if not is_number(settings.get(name)):
            errors.append(f'settings.{name}: required number')
    if settings.get('eventMode') not in EVENT_MODES:
        errors.append(f'settings.eventMode: must be one of {sorted(EVENT_MODES)}')

    for group, keys in (
        ('eventDefaults', EVENT_DEFAULT_KEYS),
        ('eventMix', EVENT_MIX_KEYS),
        ('missionRules', MISSION_RULE_KEYS),
    ):
        value = settings.get(group)
        if not isinstance(value, dict):
            errors.append(f'settings.{group}: required object')
            continue
        for key in sorted(keys):
            if not is_number(value.get(key)):
                errors.append(f'settings.{group}.{key}: required number')

    effects = settings.get('sabotageEffects')
    if not isinstance(effects, list) or not effects:
        errors.append('settings.sabotageEffects: required non-empty array')
    else:
        for effect in effects:
            if effect not in SABOTAGE_EFFECTS:
                errors.append(f'settings.sabotageEffects: invalid effect {effect!r} (allowed: {sorted(SABOTAGE_EFFECTS)})')


def parse_args():
    parser = argparse.ArgumentParser(description='map package schema check for src/data/maps/*.json')
    parser.add_argument('--all', action='store_true', help='validate all map packages, not only staged ones')
    parser.add_argument('--strict', action='store_true', help='accepted for hook symmetry; findings are always errors')
    return parser.parse_args()


def main():
    args = parse_args()
    root = repo_root()
    if root is None:
        return 1

    if args.all:
        files = all_map_files(root)
        scan_mode = 'all'
    else:
        staged = staged_files()
        prefix = MAPS_DIR.as_posix() + '/'
        files = [root / f for f in staged if f.startswith(prefix) and f.endswith('.json')]
        scan_mode = 'staged'
        if not files:
            print('OK: no staged map packages, nothing to check.')
            return 0

    if not files:
        print('No map packages in src/data/maps/ found; nothing to check.')
        return 0

    failed = False
    checked = 0
    for path in files:
        if not path.exists():
            continue
        rel = path.relative_to(root).as_posix()
        checked += 1
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except (OSError, json.JSONDecodeError) as e:
            failed = True
            print(f'ERROR: {rel}: cannot parse JSON: {e}')
            continue
        if not isinstance(data, dict):
            failed = True
            print(f'ERROR: {rel}: top level is not a JSON object')
            continue
        errors = []
        validate_map(data, errors)
        if errors:
            failed = True
            print(f'ERROR: map package {rel} violates the Kartenpaket schema:')
            for e in errors:
                print(f'  {e}')
            print()

    if failed:
        return 1
    print(f'OK: {checked} {scan_mode} map package(s) valid.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
