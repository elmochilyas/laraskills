# Phase 13.1 — Summary

## Goal
Execute 9 isolated `opencode run` experiments (3 scenarios × 3 MCP modes) from clean Laravel 13 baselines, comparing ECC attribution quality and MCP adoption.

## Status

| Step | Status |
|------|--------|
| Branch created (`feat/phase-13-1-controlled-attribution`) | ✓ |
| All 7 Phase 13 reports reviewed | ✓ |
| Preflight checks (version, model, tests, benchmarks, intelligence) | ✓ |
| Lab root created (`laravel-ecc-phase-13-1-lab`) | ✓ |
| package-tools installed with `laravel-ecc@1.0.0-beta.12` | ✓ |
| MCP script path verified | ✓ |
| 9 worktrees created and fully set up (artisan, vendor, .env, db) | ✓ |
| 4 prompt files created (3 scenario prompts + retrieval instruction) | ✓ |
| Runbook (`phase-13-1-runbook.md`) + manual guide (`run-phase-13-1-manually.md`) | ✓ |
| MCP config key discovery (`mcp` not `mcpServers`) | ✓ |
| 9 original `.ps1` scripts created | ✓ |
| Original scripts syntax-validated | ✓ |
| All 9 worktrees clean (pre-patch) | ✓ |
| **Root cause identified**: `$ErrorActionPreference = "Stop"` + OpenCode stderr → `NativeCommandError` abort | ✓ |
| Preflight failures documented (`logs/preflight-failures-2026-06-11.md`) | ✓ |
| **Patch applied**: `try/finally` + `$ErrorActionPreference = "Continue"` on every native OpenCode call | ✓ |
| **JSON escape bug fixed**: `.Replace('\', '\\')` in MCP config for all 6 B/C scripts | ✓ |
| All 9 patched scripts re-validated (syntax OK) | ✓ |
| All 9 worktrees confirmed clean (post-patch) | ✓ |
| MCP preflight validated — Mode A → `disabled`, Modes B/C → `connected` | ✓ |

## Root Cause
Windows PowerShell 5.1 calls `opencode.ps1` which wraps `opencode.exe`. The `.ps1` proxy writes status/progress information to **stderr**. With `$ErrorActionPreference = "Stop"`, every stderr line is treated as a terminating `NativeCommandError`, killing the script before `opencode run` even starts.

## Patches Applied

### All 9 scripts (native command safety)
Every `opencode mcp list` and `opencode run` invocation wrapped:
```powershell
$prevEAP = $ErrorActionPreference
try {
    $ErrorActionPreference = "Continue"
    $output = (& opencode ... 2>&1 | Out-String)
    $exitCode = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $prevEAP
}
```
Exit codes gate the logic — stderr log output alone does not abort. Post-run native commands (`php artisan test`, `pint.bat`, `git`, etc.) use the same pattern.

### Scripts 02, 03, 05, 06, 08, 09 (JSON backslash escape)
MCP path variables use `.Replace('\', '\\')` before JSON interpolation to produce valid JSON with doubled backslashes. Verified: OpenCode accepts the config and reports `laravel-ecc connected`.

## Patched File List

| # | File | Bugs Fixed |
|---|------|-----------|
| 01 | `scripts/01-webhook-baseline-controlled.ps1` | NativeCommandError |
| 02 | `scripts/02-webhook-ecc-voluntary.ps1` | NativeCommandError + JSON esc |
| 03 | `scripts/03-webhook-ecc-required.ps1` | NativeCommandError + JSON esc |
| 04 | `scripts/04-multi-tenant-baseline-controlled.ps1` | NativeCommandError |
| 05 | `scripts/05-multi-tenant-ecc-voluntary.ps1` | NativeCommandError + JSON esc |
| 06 | `scripts/06-multi-tenant-ecc-required.ps1` | NativeCommandError + JSON esc |
| 07 | `scripts/07-rag-baseline-controlled.ps1` | NativeCommandError |
| 08 | `scripts/08-rag-ecc-voluntary.ps1` | NativeCommandError + JSON esc |
| 09 | `scripts/09-rag-ecc-required.ps1` | NativeCommandError + JSON esc |

Also updated: `logs/preflight-failures-2026-06-11.md` (newly created).

## How to Run

Open a **separate PowerShell 5.1 terminal** (not this OpenCode session) and run:

```powershell
# First run — Webhook, Mode A (baseline-controlled, 3-5 min)
& "C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc-phase-13-1-lab\scripts\01-webhook-baseline-controlled.ps1"

# Then proceed sequentially through 09
& "C:\Users\Pc\Desktop\...\scripts\02-webhook-ecc-voluntary.ps1"
& "C:\Users\Pc\Desktop\...\scripts\03-webhook-ecc-required.ps1"
# ... etc.
```

Or follow `run-phase-13-1-manually.md` for the full walkthrough with expected timings and scoring rubrics.

## What Each Script Does
1. Records start timestamp
2. Sets `$env:OPENCODE_CONFIG_CONTENT` (disables ECC MCP for Mode A, enables for B/C)
3. Validates MCP preflight via `opencode mcp list` (exit-code-gated, stderr-tolerant)
4. Launches `opencode run --model opencode/deepseek-v4-flash-free ...`
5. After `opencode run` exits: `php artisan test`, `pint.bat --test`, `php artisan route:list`, `git status`, `git diff --stat`
6. Records end timestamp + duration
7. Writes all artifacts to `<lab-root>/logs/` and `<lab-root>/timings/`
8. Restores `$env:OPENCODE_CONFIG_CONTENT` in `finally` block

## Relevant Directories
- `<lab-root>` = `...\laravel-ecc-phase-13-1-lab`
- Scripts: `<lab-root>\scripts\01-09.ps1`
- Worktrees: `<lab-root>\worktrees\` (9 dirs)
- Logs: `<lab-root>\logs\` (per-run .txt files)
- Timings: `<lab-root>\timings\` (per-run timing files)
- Prompt files: `<ecc-root>\docs\integration-tests\phase-13-1\prompts\`
- Runbook: `<ecc-root>\docs\integration-tests\phase-13-1\phase-13-1-runbook.md`
