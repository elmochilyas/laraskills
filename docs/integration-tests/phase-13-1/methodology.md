# Phase 13.1 — Methodology

## Purpose

Phase 13.1 measures the discrete impact of ECC MCP retrieval on implementation quality by executing 9 isolated runs (3 scenarios × 3 MCP modes) from clean Laravel 13 baselines, using a single model (`opencode/deepseek-v4-flash-free`). It removes the `--pure` confound present in Phase 13.

## Key Differences from Phase 13

| Aspect | Phase 13 | Phase 13.1 |
|--------|----------|------------|
| Modes | 2 (baseline, ecc-assisted) | 3 (baseline-controlled, ecc-voluntary, ecc-required) |
| `--pure` | Used on baseline runs | Never used |
| MCP control | Edit `opencode.jsonc` | `$env:OPENCODE_CONFIG_CONTENT` |
| Scenarios | 6 | 3 (03, 05, 06) |
| Total runs | 12 | 9 |
| Model | Various | `opencode/deepseek-v4-flash-free` |

## Mode Definitions

### Mode A — Baseline-Controlled
ECC MCP is **disabled** via environment variable override:
```powershell
$env:OPENCODE_CONFIG_CONTENT = '{"mcp":{"laravel-ecc":{"enabled":false}}}'
```

### Mode B — ECC-Voluntary
ECC MCP is **enabled** and available to the agent. No explicit retrieval instruction is added to the prompt. The agent may use or ignore ECC MCP tools at its own discretion.

### Mode C — ECC-Required
ECC MCP is **enabled** and a required-retrieval instruction block is appended to the base prompt, mandating `retrieve_context_bundle` and `validate_ecc` calls before implementation.

## Scenarios

| # | Scenario | Domain | Key Requirements |
|---|----------|--------|------------------|
| 03 | Signed Webhook | API Integration | HMAC verification, timestamp tolerance, replay protection, idempotency, queue processing |
| 05 | Multi-Tenant Isolation | Multi-Tenant | Tenant model, project CRUD, tenant scoping, cross-tenant leakage prevention, tenant-aware validation |
| 06 | AI RAG Workflow | AI + Retrieval | Document chunks, ingestion/retrieval actions, answer generation boundary, fakeable providers, no live network |

## Infrastructure

- **Lab root**: `<lab-root>` (separate physical directory from ECC repository)
- **ECC root**: `<ecc-root>` (this repository)
- **Worktrees**: 9 distinct Laravel 13 installations at `<lab-root>/worktrees/`
- **Logs**: `<lab-root>/logs/` (raw OpenCode transcripts, test output, Pint output, route lists, git diffs)
- **Timings**: `<lab-root>/timings/` (start/end timestamps per run)

## Scoring Rubric

Each run scored 0–10 in each category. Weighted total out of 100.

| Category | Weight | Meaning |
|----------|--------|---------|
| Functional correctness | 1× | Required behavior works |
| Laravel convention adherence | 1× | Uses framework-native patterns correctly |
| Architecture clarity | 1× | Thin boundaries, appropriate separation |
| Validation quality | 1× | Correct rules and negative cases |
| Security correctness | 1× | Protects sensitive flows |
| Authorization correctness | 1× | Distinguishes authN and authZ |
| Test completeness | 2× | Covers happy and negative paths |
| Maintainability | 1× | Understandable and extensible |
| Code style | 0.5× | Pint quality |
| Execution efficiency | 0.5× | Time and unnecessary complexity |

## Execution Protocol

1. All 9 worktrees created from identical Laravel 13 baseline (`laravel/laravel ^13.0`)
2. Package tools installed with `laravel-ecc@1.0.0-beta.12`
3. MCP server configured via `$env:OPENCODE_CONFIG_CONTENT` (no filesystem config changes)
4. Each run: `opencode run --model opencode/deepseek-v4-flash-free --dangerously-skip-permissions`
5. Post-run: `php artisan test`, `pint --test`, `php artisan route:list`, `git status`, `git diff --stat`
6. All artifacts saved to `<lab-root>/logs/` and `<lab-root>/timings/`

## Known Issues

- `get_knowledge_unit` canonical ID matching: The MCP tool returns "not found" when queried with display names (e.g., `resource-controller-methods`) instead of canonical IDs (e.g., `api-crud-system-engineering/resource-controller-methods`). This affected ECC-required runs significantly.
- `get_graph_context` never called in any run — agents prefer `search_ecc` for exploration over graph navigation.
- Windows PowerShell 5.1 `$ErrorActionPreference = "Stop"` interacts badly with `opencode.ps1` stderr output; all scripts patched with `try/finally` + `$ErrorActionPreference = "Continue"` around native calls.
