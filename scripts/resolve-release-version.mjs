#!/usr/bin/env node
/**
 * Resolves which release action release.yml has to take and drives every
 * conditional step after it via GITHUB_OUTPUT.
 *
 * Behaviour (adapted to the single-asset Node/Vite pipeline):
 * 1. Classify the ref. A tag push (refType === "tag") is a *manual* release:
 *    the version comes from the tag name. A branch push to "main" is
 *    *automatic*: the version comes from `semantic-release --dry-run`.
 * 2. Check whether a GitHub release for that version/tag already exists and
 *    whether it already has every expected asset uploaded.
 *    - Fully present      -> do nothing (released: false).
 *    - Missing an asset   -> repair it (release_action: "upload-existing").
 *    - Absent             -> create it (release_action: "create").
 * 3. Automatic path without releasable commits: fall back to scanning all
 *    existing GitHub releases for one missing assets and repair the OLDEST
 *    one found. Prereleases are never eligible for repair (guard, §11.1).
 *
 * The pure decision logic is dependency-injected (`resolveReleaseVersion`)
 * so it is unit-testable without network access.
 */
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VERSION_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
const AUTOMATIC_RELEASE_BRANCHES = ["main"];

// The release asset set is exactly one ZIP of the static build. These names
// must never change between versions - asset repair depends on them.
const EXPECTED_ASSETS = ["release.zip"];

export function parseManualTag(tagName) {
  if (!tagName?.startsWith("v")) {
    throw new Error(`Expected a vX.Y.Z tag, received '${tagName ?? ""}'.`);
  }
  const version = tagName.slice(1);
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Tag '${tagName}' is not a valid vX.Y.Z release tag.`);
  }
  return version;
}

export function classifyWorkflowRef({ refType, refName }) {
  if (refType === "tag") {
    return { kind: "manual", version: parseManualTag(refName), tag: refName };
  }
  if (refType === "branch" && AUTOMATIC_RELEASE_BRANCHES.includes(refName)) {
    return { kind: "automatic" };
  }
  throw new Error(`Unsupported release ref '${refType ?? ""}:${refName ?? ""}'.`);
}

export function releaseHasExpectedAssets(release) {
  const assets = release.assets ?? [];
  return EXPECTED_ASSETS.every((name) =>
    assets.some((asset) => asset.name === name && asset.state === "uploaded" && asset.size > 0),
  );
}

// CRITICAL GUARD: prereleases must never be selected for asset repair. An
// old, legitimately incomplete RC would otherwise be "repaired" by checking
// out its historical commit, where current workflow files do not exist.
// See ci-workflows-instructions.md section 11.1.
export function incompleteReleases(releases) {
  return releases.filter((release) => {
    if (release.prerelease) {
      return false;
    }
    return !releaseHasExpectedAssets(release);
  });
}

/**
 * Decides the release action. `deps`:
 *   - refType, refName          - GitHub event context
 *   - getGitHubRelease(tag)     - async -> release object | null
 *   - listGitHubReleases()      - async -> array (newest first not required)
 *   - runSemanticReleaseDryRun() - async -> { version: string|null }
 * Returns the output map for GITHUB_OUTPUT.
 */
export async function resolveReleaseVersion(deps) {
  const classification = classifyWorkflowRef({
    refType: deps.refType,
    refName: deps.refName,
  });

  if (classification.kind === "manual") {
    return decideForTag({
      version: classification.version,
      tag: classification.tag,
      releaseKind: "manual",
      deps,
    });
  }

  const dryRun = await deps.runSemanticReleaseDryRun();
  if (dryRun.version) {
    const tag = `v${dryRun.version}`;
    return decideForTag({
      version: dryRun.version,
      tag,
      releaseKind: "automatic",
      deps,
    });
  }

  // No releasable commits: fall back to repairing the OLDEST incomplete
  // non-prerelease release with a valid vX.Y.Z tag name (a release on some
  // other tag cannot be tied to a version and is not repairable).
  const allReleases = await deps.listGitHubReleases();
  const incomplete = incompleteReleases(allReleases)
    .filter((release) => {
      const tagName = release.tag_name ?? "";
      return tagName.startsWith("v") && VERSION_PATTERN.test(tagName.slice(1));
    })
    .sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")));
  if (incomplete.length === 0) {
    return {
      released: false,
      reason: "no-releasable-commits",
      release_kind: "automatic",
      release_action: "none",
    };
  }
  const target = incomplete[0];
  return {
    released: true,
    reason: "repair-incomplete-release",
    version: parseManualTag(target.tag_name),
    tag: target.tag_name,
    release_kind: "automatic",
    release_action: "upload-existing",
  };
}

async function decideForTag({ version, tag, releaseKind, deps }) {
  const existing = await deps.getGitHubRelease(tag);
  if (existing && releaseHasExpectedAssets(existing)) {
    return {
      released: false,
      reason: "already-released",
      version,
      tag,
      release_kind: releaseKind,
      release_action: "none",
    };
  }
  if (existing) {
    return {
      released: true,
      reason: "missing-assets",
      version,
      tag,
      release_kind: releaseKind,
      release_action: "upload-existing",
    };
  }
  return {
    released: true,
    reason: "new-release",
    version,
    tag,
    release_kind: releaseKind,
    release_action: "create",
  };
}

/* ------------------------- CI plumbing (not unit tested) ------------------ */

function gh(args) {
  const result = spawnSync("gh", ["api", ...args], { encoding: "utf8" });
  if (result.error) {
    throw result.error;
  }
  return result;
}

function getGitHubRelease({ repo, tag }) {
  const result = gh([`repos/${repo}/releases/tags/${tag}`]);
  if (result.status !== 0) {
    if (result.stderr.includes("404") || result.stdout.includes("404")) {
      return null;
    }
    throw new Error(`gh api failed for release tag '${tag}': ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}

function listGitHubReleases({ repo }) {
  const result = gh(["--paginate", "--slurp", `repos/${repo}/releases`]);
  if (result.status !== 0) {
    throw new Error(`gh api failed listing releases: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout).flat();
}

async function runSemanticReleaseDryRun() {
  // RESOLVE_DRY_RUN=true makes release.config.js load the plugin set without
  // @semantic-release/github - the dry run must not perform its
  // verifyConditions network call.
  const result = spawnSync("npx", ["semantic-release", "--dry-run", "--no-ci"], {
    encoding: "utf8",
    env: { ...process.env, RESOLVE_DRY_RUN: "true" },
    shell: process.platform === "win32",
  });
  if (result.error) {
    throw result.error;
  }
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  // Covers both "The next release version is X.Y.Z" and the first-release
  // phrasing "There is no previous release, the next release version is X.Y.Z".
  const match = output.match(/next release version is (\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/);
  return { version: match ? match[1] : null };
}

function writeOutputs(outputs) {
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}`);
  for (const line of lines) {
    console.log(line);
  }
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, lines.join("\n") + "\n");
  }
}

async function main() {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) {
    throw new Error("GITHUB_REPOSITORY is not set.");
  }
  const outputs = await resolveReleaseVersion({
    refType: process.env.GITHUB_REF_TYPE,
    refName: process.env.GITHUB_REF_NAME,
    getGitHubRelease: (tag) => Promise.resolve(getGitHubRelease({ repo, tag })),
    listGitHubReleases: () => Promise.resolve(listGitHubReleases({ repo })),
    runSemanticReleaseDryRun,
  });
  writeOutputs(outputs);
}

const invokedAsScript =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedAsScript) {
  main().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  });
}
