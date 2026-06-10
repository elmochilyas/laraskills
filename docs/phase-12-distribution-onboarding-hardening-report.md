# Phase 12 — Distribution and Onboarding Hardening

## Executive Summary

Phase 12 implements a shared ECC root resolver with five-step precedence, a persisted cross-platform user configuration, `setup` and `doctor` CLI commands, improved MCP root resolution, updated documentation, and comprehensive regression tests. The npm package remains lightweight — no knowledge or intelligence layers are bundled.

## Previous Limitation

- Root resolution logic was duplicated between CLI and MCP
- No persisted user configuration existed
- No `setup` or `doctor` commands for onboarding
- Error messages referenced machine-specific paths
- No clear guidance on the lightweight npm strategy

## Discovery Findings

- Current `findEccRoot` in `src/retrieval/catalog-loader.mjs` handles 3-step precedence (explicit → env → cwd)
- MCP server had its own `parseEccRootArg` and `resolveRootState` mirroring the same logic
- No persisted user config nor config module existed
- Existing `doctor` command checked project installation state, not ECC root resolution
- Test suite had 150 tests and 71 benchmarks

## Root Resolution Contract

Shared resolver at `src/runtime/ecc-root-resolver.mjs` with 5-step precedence:

1. **cli-argument** — `--ecc-root <path>` explicit CLI flag
2. **environment** — `ECC_ROOT` env variable
3. **user-config** — persisted `config.json`
4. **cwd-discovery** — current directory and parent walkup
5. **Actionable failure** — with exact fix instructions

Resolution result shape: `{ root, source, valid, missingIntelligenceFiles }`

## Persisted Configuration

Module at `src/runtime/user-config.mjs`:

- **Windows:** `%APPDATA%\laravel-ecc\config.json`
- **Linux/macOS:** `~/.config/laravel-ecc/config.json` or `$XDG_CONFIG_HOME/laravel-ecc/config.json`
- `LARAVEL_ECC_CONFIG_DIR` env var override for testing
- BOM detection, malformed JSON rejection, empty field rejection
- Idempotent save/load/clear

## Setup Command

`laravel-ecc setup --ecc-root <path>`

- Validates the supplied checkout path
- Persists the absolute normalized path
- Displays config-file location, resolved ECC root, and intelligence validity
- Prints next-step commands
- `--clone` is deferred (requires `git` detection, network, and overwrite protection)

## Doctor Command

`laravel-ecc doctor`

- Reports: package version, Node.js version, platform, config file path, config existence, ECC_ROOT env value, resolved ECC root, resolution source, intelligence file checks, MCP adapter presence, retrieval readiness
- Exit code 0 for healthy, 1 for actionable failures

## MCP Integration

- MCP server uses `resolveEccRootWithPrecedence` for 5-step resolution
- Root error messages now reference `laravel-ecc setup` and `laravel-ecc doctor`
- Backward compatible — all existing MCP tests pass unchanged

## Help Output

- Updated to document `setup` and `doctor` commands
- Explains lightweight npm strategy at the top
- Includes concise examples

## Documentation Added

- `docs/phase-12-distribution-onboarding-hardening-report.md` — this report
- `docs/onboarding/npm-setup.md` — npm installation and configuration
- `docs/onboarding/opencode-mcp-setup.md` — MCP server configuration
- `docs/onboarding/troubleshooting.md` — recovery procedures

## Test Coverage

24 new tests across 2 files:

### Resolver tests (`ecc-root-resolver.test.mjs`)
- explicit `--ecc-root` wins
- `ECC_ROOT` env fallback
- cwd and parent-directory discovery
- missing root fails clearly
- invalid root fails clearly
- incomplete checkout fails clearly
- resolution source accuracy
- path normalization
- error message content

### Config tests (`user-config.test.mjs`)
- config path is cross-platform
- missing config handled gracefully
- valid config loads
- malformed JSON produces actionable error
- setup writes BOM-free UTF-8 JSON
- repeated setup is idempotent
- BOM detection

## npm Package Inspection

- `src/runtime/` is included via existing `src/` glob in package.json `files`
- No heavy layers bundled (`knowledge/`, `intelligence/`, `tools/`, `tests/`, `examples/`)
- Shared resolver present

## Clean-Install Verification

- Isolated tarball install tested
- `setup` and `doctor` work from packed install
- MCP tools/list exposed exactly 5 tools

## Validation Results

- All 174 tests PASS (150 existing + 24 new)
- 71/71 benchmarks PASS (100%)
- CLI validate PASS (2321 KUs, 429 deps, 3513 rels, 0 cycles)
- MCP 5 tools confirmed

## Deferred Items

- **`--clone` flag**: implementing safe clone requires git detection, deterministic destination, non-overwrite checks, and network dependency. Deferred to a future phase.

## Phase 13 Readiness

Phase 12 is complete. The codebase is ready for Phase 13 topics such as: enhanced CLI formatting, knowledge-layer caching, retrieval performance optimization, or additional MCP server transports.
