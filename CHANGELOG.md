# Changelog

## 1.1.0 — 2026-07-07

- Add optional `api-token` input for direct (App-free) mode. The value is masked with `core.setSecret` and exported to the CLI as `$DESLICER_API_TOKEN` — env-only, never argv.

## 1.0.4 — 2026-06-09

- Fix CLI execution after install: `tc.cacheFile` returns the cache directory, not the file path. The action was adding the wrong dir to `PATH` and trying to exec the arch directory, failing with `Unable to locate executable file: .../x64`. Now joins the file name and re-applies the executable bit.

## 1.0.3 — 2026-06-09

- Commit the compiled `dist/` bundle so the action loads at a pinned ref (JS actions run `dist/index.js` from the git tree; release assets are not used). Fixes `File not found: dist/index.js`.
- Stop ignoring `dist/` in `.gitignore`.
- CI dist-drift guard now stages `dist/` before diffing so it actually catches an uncommitted or stale bundle.

## 1.0.2 — 2026-05-29

- Download Fulcio `.cert` sidecar from `deslicer/cli` releases and pass `--certificate` to `cosign verify-blob`

## 1.0.1 — 2026-05-29

- Fix `ensureCosign()` returning the tool-cache directory instead of the cosign binary path
- Align tool-cache keys (`cosign` + semver) for find/cache hit consistency

## 1.0.0 — 2026-05-29

- Initial release: install `deslicer` from signed `deslicer/cli` GitHub Releases (SHA-256 + cosign)
- Runner tool-cache integration for repeat job reuse
- Optional `deslicer change <command>` dispatch via `command` / `command-args` inputs
- Floating `version: v1` resolves latest `v1.x.y` release
