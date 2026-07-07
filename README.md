# deslicer/change-action

GitHub Action that installs the [`deslicer`](https://github.com/deslicer/cli) CLI from signed GitHub Releases and optionally runs `deslicer change` commands.

## Usage

Install only (expose `deslicer` on `PATH`):

```yaml
- uses: deslicer/change-action@v1
  with:
    version: v1
```

Run a change command after install:

```yaml
- uses: deslicer/change-action@v1
  with:
    version: v1
    command: plan
    command-args: --environment production
    observer-api-url: https://api.deslicer.ai
```

Direct (App-free) mode with an Observer API token — required for bundle-source
commands like `deslicer change plan --source-dir`:

```yaml
- uses: deslicer/change-action@v1
  with:
    version: v1
    command: plan
    command-args: --source-dir ./apps --environment production
    observer-api-url: https://api.deslicer.ai
    api-token: ${{ secrets.DESLICER_API_TOKEN }}
```

The token is exported to the CLI as `$DESLICER_API_TOKEN`, masked in workflow
logs, and never appears in process arguments.

### Version pinning

| Input | Meaning |
|---|---|
| `version: v1` | Floating tag — latest `v1.x.y` release from `deslicer/cli` |
| `version: v1.0.0` | Immutable semver release |
| `version-sha: <40-char-sha>` | Pin to the release tag that points at this commit (overrides `version`) |

Enterprise teams should pin `version-sha` or an immutable semver tag.

## Inputs

| Name | Required | Default | Description |
|---|---|---|---|
| `version` | No | `v1` | CLI version selector |
| `version-sha` | No | — | 40-char commit SHA override |
| `command` | No | — | `deslicer change` subcommand (`plan`, `approve`, `status`, …) |
| `command-args` | No | `''` | Extra arguments for `deslicer change` |
| `observer-api-url` | No | — | Sets `$OBSERVER_API_URL` for the CLI |
| `api-token` | No | — | Observer API token; exported as `$DESLICER_API_TOKEN` (masked, env-only) |
| `github-token` | No | — | GitHub token for `deslicer/cli` release API calls; pass `${{ github.token }}` to avoid rate limits |

## Outputs

| Name | Description |
|---|---|
| `cli-version` | Installed semver (without `v` prefix) |
| `cli-path` | Absolute path to the `deslicer` binary |

## Security

Downloads are verified with SHA-256 checksums and cosign keyless signatures from the `deslicer/cli` release workflow. Unsigned or tampered artifacts fail closed.

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Development

```bash
npm ci
npm test
npm run build   # writes dist/index.js — commit before tagging
```

Nested checkout: `deslicer-automation-platform/change-action/` (separate git repo).

### Releasing to the GitHub Marketplace

1. Bump `version` in `package.json`, update `CHANGELOG.md`, run `npm run build`, commit `dist/`.
2. Tag and push `vX.Y.Z` (or dispatch the Release workflow) — it creates the GitHub Release and moves the floating `v1` tag.
3. First-time Marketplace listing (manual, once): on the release page, edit the release, tick **Publish this Action to the GitHub Marketplace**, accept the Marketplace Developer Agreement, choose category **Continuous integration**, and confirm the `branding` icon/color from `action.yml`. Subsequent releases are listed automatically once the action is published.

### Live E2E

The `Live E2E (staging, direct mode)` job in `.github/workflows/e2e.yml` runs nightly and on dispatch. It bundles a fixture Splunk app and creates a plan on the staging Observer through the `api-token` direct-mode path. Configure on the repo:

- secret `DESLICER_STAGING_API_TOKEN` — staging Observer API key (`tools` scope)
- variable `STAGING_OBSERVER_API_URL` — staging Observer management URL
- variable `STAGING_TARGET_GROUP_ID` — staging host-group UUID for bundle plans

When any of the three is missing, the job skips with a warning instead of failing.
