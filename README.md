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
