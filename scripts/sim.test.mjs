import { describe, expect, it } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseSimArgs, runSim } from "./sim.ts";

describe("parseSimArgs", () => {
  it("uses defaults: muenster, seeds 1..10", () => {
    const options = parseSimArgs([]);
    expect(options.mapId).toBe("muenster");
    expect(options.seeds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(options.outDir).toBeNull();
  });

  it("parses games/seed-start into a seed range", () => {
    const options = parseSimArgs(["--games", "5", "--seed-start", "40"]);
    expect(options.seeds).toEqual([40, 41, 42, 43, 44]);
  });

  it("parses --seeds ranges and lists", () => {
    expect(parseSimArgs(["--seeds", "3-5"]).seeds).toEqual([3, 4, 5]);
    expect(parseSimArgs(["--seeds", "7,9,11"]).seeds).toEqual([7, 9, 11]);
  });

  it("parses game options", () => {
    const options = parseSimArgs([
      "--map",
      "luebeck",
      "--detectives",
      "3",
      "--round-limit",
      "20",
      "--mission",
      "none",
      "--out",
      "logs",
    ]);
    expect(options.mapId).toBe("luebeck");
    expect(options.outDir).toBe("logs");
    expect(options.gameOptions.startOptions?.detectiveCount).toBe(3);
    expect(options.gameOptions.startOptions?.roundLimit).toBe(20);
    expect(options.gameOptions.startOptions?.mission).toBe("none");
  });

  it("rejects invalid arguments", () => {
    expect(() => parseSimArgs(["--games", "x"])).toThrow();
    expect(() => parseSimArgs(["--seeds", "5-3"])).toThrow();
    expect(() => parseSimArgs(["--bogus"])).toThrow();
    expect(() => parseSimArgs(["--mission", "huh"])).toThrow();
  });
});

describe("runSim", () => {
  it("runs a batch on teststadt and prints a summary", () => {
    const code = runSim(["--map", "teststadt", "--games", "3"]);
    expect(code).toBe(0);
  });

  it("writes one JSONL event log per game to --out", () => {
    const dir = mkdtempSync(join(tmpdir(), "sim-test-"));
    try {
      const code = runSim(["--map", "teststadt", "--games", "3", "--out", dir]);
      expect(code).toBe(0);
      const files = readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
      expect(files).toHaveLength(3);
      for (const file of files) {
        const lines = readFileSync(join(dir, file), "utf8").trim().split("\n");
        const header = JSON.parse(lines[0]);
        const last = JSON.parse(lines[lines.length - 1]);
        expect(header.type).toBe("header");
        expect(last.type).toBe("result");
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reproduces identical logs per seed", () => {
    const dir = mkdtempSync(join(tmpdir(), "sim-test-"));
    try {
      runSim(["--map", "teststadt", "--games", "2", "--out", dir]);
      const first = readdirSync(dir)
        .sort()
        .map((f) => readFileSync(join(dir, f), "utf8"));
      runSim(["--map", "teststadt", "--games", "2", "--out", dir]);
      const second = readdirSync(dir)
        .sort()
        .map((f) => readFileSync(join(dir, f), "utf8"));
      expect(second).toEqual(first);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
