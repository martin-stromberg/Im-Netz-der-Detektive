/**
 * KI-vs.-KI-Batch-CLI ("npm run sim") — headless Balancing-Werkzeug:
 * spielt N Partien über eine Seed-Range mit `AiSimulation` auf dem
 * regulären Store, schreibt optional die JSONL-Eventlogs ins
 * Dateisystem und gibt eine aggregierte Summary (Outcome-Verteilung,
 * Partienlängen, Hinweise, Kameratreffer, Sabotage-Annahmequote,
 * Radio-Nutzung) auf stdout aus.
 *
 * Ausführung läuft über den SSR-Build (`vite.sim.config.ts` →
 * `dist-sim/sim.mjs`), weil `MapLoader`/`MissionLoader` auf dem
 * Vite-Feature `import.meta.glob` basieren.
 *
 * Beispiele:
 *   npm run sim                                # muenster, Seeds 1–10
 *   npm run sim -- --map luebeck --games 20 --seed-start 100
 *   npm run sim -- --seeds 5-15 --out sim-logs --detectives 5
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  runAiBatch,
  summarizeBatch,
  type AiGameOptions,
  type BatchSummary,
  type SimGameResult,
} from "../src/logic/AiSimulation";
import { loadMap } from "../src/logic/MapLoader";
import { serializeLog } from "../src/logic/Recorder";
import type { MapPack } from "../src/logic/mapPack";
import type { MissionOption } from "../src/state/gameStore";

export interface SimCliOptions {
  mapId: string;
  seeds: number[];
  outDir: string | null;
  gameOptions: AiGameOptions;
}

const USAGE = `Usage: npm run sim -- [options]
  --map <id>                 Kartenpaket (default: muenster)
  --games <n>                Anzahl Partien (default: 10)
  --seed-start <n>           Erster Seed (default: 1) → Seeds seed-start..seed-start+games-1
  --seeds <a-b|a,b,c>        Explizite Seed-Range/-Liste (überstimmt --games/--seed-start)
  --out <dir>                Verzeichnis für die JSONL-Eventlogs (default: keine Dateien)
  --detectives <n>           Detektiv-Anzahl (Map-Einstellung)
  --round-limit <n|none>     Rundenlimit (Map-Einstellung; "none" = unbegrenzt)
  --mission <auto|random|none>  Missionsoption (default: auto)
  --help                     Diese Hilfe`;

class SimArgError extends Error {}

function parseSeedSpec(spec: string): number[] {
  const range = /^(\d+)-(\d+)$/.exec(spec);
  if (range !== null) {
    const [from, to] = [Number(range[1]), Number(range[2])];
    if (to < from) {
      throw new SimArgError(`--seeds: ungültige Range ${JSON.stringify(spec)}`);
    }
    return Array.from({ length: to - from + 1 }, (_, i) => from + i);
  }
  const list = spec.split(",").map((part) => {
    const value = Number(part);
    if (!Number.isInteger(value) || value < 0) {
      throw new SimArgError(`--seeds: ungültiger Seed ${JSON.stringify(part)}`);
    }
    return value;
  });
  if (list.length === 0) {
    throw new SimArgError("--seeds: leere Liste");
  }
  return list;
}

function parsePositiveInt(flag: string, value: string | undefined): number {
  const parsed = Number(value);
  if (value === undefined || !Number.isInteger(parsed) || parsed <= 0) {
    throw new SimArgError(`${flag}: positive Ganzzahl erwartet, got ${JSON.stringify(value)}`);
  }
  return parsed;
}

export function parseSimArgs(argv: readonly string[]): SimCliOptions {
  let mapId = "muenster";
  let games = 10;
  let seedStart = 1;
  let seeds: number[] | null = null;
  let outDir: string | null = null;
  let detectiveCount: number | undefined;
  let roundLimit: number | null | undefined;
  let mission: MissionOption | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = (): string => {
      const value = argv[++i];
      if (value === undefined) {
        throw new SimArgError(`${arg}: Wert fehlt`);
      }
      return value;
    };
    switch (arg) {
      case "--help":
      case "-h":
        throw new SimArgError(USAGE);
      case "--map":
        mapId = next();
        break;
      case "--games":
        games = parsePositiveInt("--games", next());
        break;
      case "--seed-start":
        seedStart = parsePositiveInt("--seed-start", next());
        break;
      case "--seeds":
        seeds = parseSeedSpec(next());
        break;
      case "--out":
        outDir = next();
        break;
      case "--detectives":
        detectiveCount = parsePositiveInt("--detectives", next());
        break;
      case "--round-limit": {
        const value = next();
        roundLimit =
          value === "none" || value === "unlimited"
            ? null
            : parsePositiveInt("--round-limit", value);
        break;
      }
      case "--mission": {
        const value = next();
        if (value !== "auto" && value !== "random" && value !== "none") {
          throw new SimArgError(
            `--mission: auto|random|none erwartet, got ${JSON.stringify(value)}`,
          );
        }
        mission = value;
        break;
      }
      default:
        throw new SimArgError(`unbekannte Option ${JSON.stringify(arg)}\n${USAGE}`);
    }
  }

  return {
    mapId,
    seeds: seeds ?? Array.from({ length: games }, (_, i) => seedStart + i),
    outDir,
    gameOptions: {
      startOptions: {
        ...(detectiveCount !== undefined ? { detectiveCount } : {}),
        ...(roundLimit !== undefined ? { roundLimit } : {}),
        ...(mission !== undefined ? { mission } : {}),
      },
    },
  };
}

/** Formatiert die Batch-Summary für stdout. */
export function formatSummary(map: MapPack, results: readonly SimGameResult[]): string {
  const s: BatchSummary = summarizeBatch(results);
  const pct = (n: number): string => `${((n / Math.max(s.games, 1)) * 100).toFixed(0)}%`;
  const lines = [
    `KI-vs.-KI-Simulation — Karte ${map.name} (${map.id}), ${s.games} Partien`,
    `  Outcomes: caught ${s.outcomes.caught} (${pct(s.outcomes.caught)}) · ` +
      `surrounded ${s.outcomes.surrounded} (${pct(s.outcomes.surrounded)}) · ` +
      `escaped ${s.outcomes.escaped} (${pct(s.outcomes.escaped)}) · ` +
      `timeout ${s.outcomes.timeout} (${pct(s.outcomes.timeout)}) · ` +
      `draw ${s.outcomes.draw} (${pct(s.outcomes.draw)})`,
    `  Detektiv-Siege (caught+surrounded+timeout): ${pct(
      s.outcomes.caught + s.outcomes.surrounded + s.outcomes.timeout,
    )} | Ganove-Siege (escaped): ${pct(s.outcomes.escaped)}`,
    `  Runden: Ø ${s.avgRounds.toFixed(1)} (min ${s.minRounds}, max ${s.maxRounds})`,
    `  Hinweise/Partie: Ø ${s.avgHints.toFixed(1)} | Kameratreffer/Partie: Ø ${s.avgCamerasTriggered.toFixed(1)}`,
    `  Sabotage-Annahmequote: ${
      s.sabotageAcceptanceRate === null ? "—" : `${(s.sabotageAcceptanceRate * 100).toFixed(0)}%`
    } | Radio-Nutzung: ${(s.radioUsageRate * 100).toFixed(0)}%`,
  ];
  return lines.join("\n");
}

/** Schreibt je Partie ein JSONL-Eventlog nach `outDir`; gibt die Pfade zurück. */
export function writeGameLogs(results: readonly SimGameResult[], outDir: string): string[] {
  mkdirSync(outDir, { recursive: true });
  return results.map((result) => {
    const header = result.log.find((entry) => entry.type === "header");
    const gameId = (header?.gameId as string | undefined) ?? `seed-${result.seed}`;
    const path = join(outDir, `sim-${gameId}.jsonl`);
    writeFileSync(path, serializeLog(result.log) + "\n", "utf8");
    return path;
  });
}

/** Führt die CLI aus. Rückgabe: Exit-Code (0 = Erfolg). */
export function runSim(argv: readonly string[]): number {
  let options: SimCliOptions;
  try {
    options = parseSimArgs(argv);
  } catch (error) {
    if (error instanceof SimArgError) {
      console.error(error.message);
      return error.message === USAGE ? 0 : 1;
    }
    throw error;
  }
  const map = loadMap(options.mapId);
  const results = runAiBatch(map, options.seeds, options.gameOptions);
  console.log(formatSummary(map, results));
  if (options.outDir !== null) {
    const paths = writeGameLogs(results, options.outDir);
    console.log(`  Logs: ${paths.length} Dateien → ${options.outDir}/`);
  }
  return 0;
}

const invokedAsMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsMain) {
  process.exitCode = runSim(process.argv.slice(2));
}
