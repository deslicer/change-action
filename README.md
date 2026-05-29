# deslicer/change-action

GitHub Action that installs the [`deslicer`](https://github.com/deslicer/cli) CLI from signed GitHub Releases (SHA-256 + cosign) and runs `deslicer change <command>`.

Part of the [Deslicer-for-GitHub](https://github.com/deslicer) integration (Plan 1d). Implementation tracked in `deslicer-ai` superpowers plans.

## Status

Scaffold only — install, verify, cache, and command dispatch land in Plan 1d Task 1.

## Usage (planned)

```yaml
- uses: deslicer/change-action@v1
  with:
    version: v1
    command: plan
    command-args: --environment production
```
