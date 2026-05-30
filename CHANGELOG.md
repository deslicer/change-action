# Changelog

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
