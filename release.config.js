const releasePlugins = [
  ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
  ["@semantic-release/release-notes-generator", { preset: "conventionalcommits" }],
  [
    "@semantic-release/github",
    {
      // Exactly one asset per release: the ZIP of the static build. The asset
      // name is fixed - resolve-release-version.mjs's expected-asset list
      // depends on it never changing between versions.
      assets: [{ path: process.env.RELEASE_ASSET_PATH, name: "release.zip" }],
      // The default GITHUB_TOKEN only has `contents: write` - it cannot
      // comment on the PR(s) associated with a released commit, which the
      // plugin's success/fail steps otherwise attempt by default (the
      // routine staging -> main promotion PR would fail the release run at
      // that final step). See ci-workflows-instructions.md section 11.1.
      successComment: false,
      failComment: false,
    },
  ],
];

// Used instead of releasePlugins whenever resolve-release-version.mjs runs
// its dry-run-only version check - avoids loading @semantic-release/github
// (and its verifyConditions network call) for a call that never publishes.
const dryRunPlugins = [["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }]];

export default {
  // Only "main" is a real release branch. staging-ci.yml's version job passes
  // "--branches staging" on the CLI for its dry-run, treating staging as a
  // plain release branch for that one call only - the RC suffix is appended
  // there by hand, so no prerelease branch is configured here.
  branches: ["main"],
  tagFormat: "v${version}",
  plugins: process.env.RESOLVE_DRY_RUN === "true" ? dryRunPlugins : releasePlugins,
};
