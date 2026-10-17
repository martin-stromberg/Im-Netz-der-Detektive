import { describe, expect, it } from "vitest";
import {
  classifyWorkflowRef,
  incompleteReleases,
  parseManualTag,
  releaseHasExpectedAssets,
  resolveReleaseVersion,
} from "./resolve-release-version.mjs";

const releasedAsset = { name: "release.zip", state: "uploaded", size: 1234 };
const missingAsset = { name: "release.zip", state: "uploaded", size: 0 };

function release(overrides = {}) {
  return {
    tag_name: "v1.2.3",
    prerelease: false,
    created_at: "2026-01-01T00:00:00Z",
    assets: [releasedAsset],
    ...overrides,
  };
}

function deps(overrides = {}) {
  return {
    refType: "branch",
    refName: "main",
    getGitHubRelease: async () => null,
    listGitHubReleases: async () => [],
    runSemanticReleaseDryRun: async () => ({ version: null }),
    ...overrides,
  };
}

describe("parseManualTag", () => {
  it("accepts a vX.Y.Z tag and returns the version", () => {
    expect(parseManualTag("v1.2.3")).toBe("1.2.3");
  });

  it("accepts prerelease-suffixed semver tags", () => {
    expect(parseManualTag("v1.2.3-rc.1")).toBe("1.2.3-rc.1");
  });

  it("rejects tags without the v prefix", () => {
    expect(() => parseManualTag("1.2.3")).toThrow("vX.Y.Z");
  });

  it("rejects malformed versions", () => {
    expect(() => parseManualTag("vfoo")).toThrow("not a valid");
    expect(() => parseManualTag("")).toThrow("vX.Y.Z");
    expect(() => parseManualTag(undefined)).toThrow("vX.Y.Z");
  });
});

describe("classifyWorkflowRef", () => {
  it("classifies a tag push as a manual release", () => {
    expect(classifyWorkflowRef({ refType: "tag", refName: "v2.0.0" })).toEqual({
      kind: "manual",
      version: "2.0.0",
      tag: "v2.0.0",
    });
  });

  it("classifies a push to main as an automatic release", () => {
    expect(classifyWorkflowRef({ refType: "branch", refName: "main" })).toEqual({
      kind: "automatic",
    });
  });

  it("rejects pushes to other branches", () => {
    expect(() => classifyWorkflowRef({ refType: "branch", refName: "staging" })).toThrow(
      "Unsupported release ref",
    );
  });
});

describe("releaseHasExpectedAssets", () => {
  it("is true when release.zip is uploaded and non-empty", () => {
    expect(releaseHasExpectedAssets(release())).toBe(true);
  });

  it("is false when the asset is missing or empty", () => {
    expect(releaseHasExpectedAssets(release({ assets: [] }))).toBe(false);
    expect(releaseHasExpectedAssets(release({ assets: [missingAsset] }))).toBe(false);
    expect(releaseHasExpectedAssets(release({ assets: undefined }))).toBe(false);
  });
});

describe("incompleteReleases", () => {
  it("returns non-prerelease releases missing their asset", () => {
    const incomplete = release({ tag_name: "v1.0.0", assets: [] });
    const complete = release({ tag_name: "v1.1.0" });
    expect(incompleteReleases([incomplete, complete])).toEqual([incomplete]);
  });

  // Regression guard for ci-workflows-instructions.md section 11.1: an old
  // prerelease missing every asset must never be picked for repair.
  it("never selects prereleases for repair", () => {
    const oldRc = release({ tag_name: "v0.9.0-rc.1", prerelease: true, assets: [] });
    const complete = release({ tag_name: "v1.0.0" });
    expect(incompleteReleases([oldRc, complete])).toEqual([]);
  });
});

describe("resolveReleaseVersion", () => {
  it("creates a release for a manual tag without an existing release", async () => {
    const result = await resolveReleaseVersion(deps({ refType: "tag", refName: "v1.2.3" }));
    expect(result).toMatchObject({
      released: true,
      release_action: "create",
      release_kind: "manual",
      version: "1.2.3",
      tag: "v1.2.3",
    });
  });

  it("does nothing when the manual tag's release is already complete", async () => {
    const result = await resolveReleaseVersion(
      deps({
        refType: "tag",
        refName: "v1.2.3",
        getGitHubRelease: async () => release({ tag_name: "v1.2.3" }),
      }),
    );
    expect(result).toMatchObject({
      released: false,
      release_action: "none",
      reason: "already-released",
    });
  });

  it("repairs a manual tag whose release misses the asset", async () => {
    const result = await resolveReleaseVersion(
      deps({
        refType: "tag",
        refName: "v1.2.3",
        getGitHubRelease: async () => release({ tag_name: "v1.2.3", assets: [] }),
      }),
    );
    expect(result).toMatchObject({
      released: true,
      release_action: "upload-existing",
      reason: "missing-assets",
    });
  });

  it("creates the automatic release when semantic-release finds a new version", async () => {
    const result = await resolveReleaseVersion(
      deps({ runSemanticReleaseDryRun: async () => ({ version: "1.3.0" }) }),
    );
    expect(result).toMatchObject({
      released: true,
      release_action: "create",
      release_kind: "automatic",
      version: "1.3.0",
      tag: "v1.3.0",
    });
  });

  it("does nothing on the automatic path without releasable commits or repairs", async () => {
    const result = await resolveReleaseVersion(
      deps({
        listGitHubReleases: async () => [release()],
      }),
    );
    expect(result).toMatchObject({
      released: false,
      release_action: "none",
      reason: "no-releasable-commits",
    });
  });

  it("falls back to repairing the oldest incomplete non-prerelease release", async () => {
    const older = release({ tag_name: "v1.0.0", created_at: "2026-01-01", assets: [] });
    const newer = release({ tag_name: "v1.1.0", created_at: "2026-02-01", assets: [] });
    const result = await resolveReleaseVersion(
      deps({ listGitHubReleases: async () => [newer, older] }),
    );
    expect(result).toMatchObject({
      released: true,
      release_action: "upload-existing",
      reason: "repair-incomplete-release",
      tag: "v1.0.0",
      version: "1.0.0",
    });
  });

  it("skips releases whose tag is not a vX.Y.Z version in the repair fallback", async () => {
    const odd = release({ tag_name: "nightly", created_at: "2025-12-01", assets: [] });
    const repairable = release({ tag_name: "v1.0.0", created_at: "2026-01-01", assets: [] });
    const result = await resolveReleaseVersion(
      deps({ listGitHubReleases: async () => [odd, repairable] }),
    );
    expect(result).toMatchObject({
      released: true,
      release_action: "upload-existing",
      tag: "v1.0.0",
    });
  });

  it("ignores prereleases in the repair fallback even when nothing else is pending", async () => {
    const rc = release({
      tag_name: "v0.9.0-rc.1",
      prerelease: true,
      assets: [],
    });
    const result = await resolveReleaseVersion(deps({ listGitHubReleases: async () => [rc] }));
    expect(result).toMatchObject({
      released: false,
      release_action: "none",
    });
  });
});
