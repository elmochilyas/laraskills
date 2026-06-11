# Phase 13.1 — Scenario Matrix

## Overview

| # | Scenario | Prompt | Baseline Worktree | Voluntary Worktree | Required Worktree |
|---|----------|--------|-------------------|-------------------|-------------------|
| 03 | Signed Webhook | `prompts/03-signed-webhook.txt` | `03-signed-webhook-baseline-controlled` | `03-signed-webhook-ecc-voluntary` | `03-signed-webhook-ecc-required` |
| 05 | Multi-Tenant Isolation | `prompts/05-multi-tenant-isolation.txt` | `05-multi-tenant-isolation-baseline-controlled` | `05-multi-tenant-isolation-ecc-voluntary` | `05-multi-tenant-isolation-ecc-required` |
| 06 | AI RAG Workflow | `prompts/06-laravel-ai-rag-workflow.txt` | `06-laravel-ai-rag-workflow-baseline-controlled` | `06-laravel-ai-rag-workflow-ecc-voluntary` | `06-laravel-ai-rag-workflow-ecc-required` |

## Run Order

All runs executed sequentially: 03 → 05 → 06, each mode A → B → C.

```
 1. 03-signed-webhook-baseline-controlled
 2. 03-signed-webhook-ecc-voluntary
 3. 03-signed-webhook-ecc-required
 4. 05-multi-tenant-isolation-baseline-controlled
 5. 05-multi-tenant-isolation-ecc-voluntary
 6. 05-multi-tenant-isolation-ecc-required
 7. 06-laravel-ai-rag-workflow-baseline-controlled
 8. 06-laravel-ai-rag-workflow-ecc-voluntary
 9. 06-laravel-ai-rag-workflow-ecc-required
```

## Timing Summary

| Run | Start | End | Duration | Exit Code |
|-----|-------|-----|----------|-----------|
| 03-baseline-controlled | 2026-06-11 13:09:04 | 2026-06-11 13:19:57 | 10m 53s | 0 |
| 03-ecc-voluntary | 2026-06-11 13:22:08 | 2026-06-11 13:27:59 | 5m 51s | 0 |
| 03-ecc-required | 2026-06-11 13:28:42 | 2026-06-11 13:33:43 | 5m 1s | 0 |
| 05-baseline-controlled | 2026-06-11 14:04:03 | 2026-06-11 14:10:57 | 6m 53s | 0 |
| 05-ecc-voluntary | 2026-06-11 14:11:18 | 2026-06-11 14:20:08 | 8m 50s | 0 |
| 05-ecc-required | 2026-06-11 14:25:07 | 2026-06-11 14:33:13 | 8m 6s | 0 |
| 06-baseline-controlled | 2026-06-11 14:34:15 | 2026-06-11 14:43:07 | 8m 52s | 0 |
| 06-ecc-voluntary | 2026-06-11 14:43:31 | 2026-06-11 14:49:26 | 5m 54s | 0 |
| 06-ecc-required | 2026-06-11 14:51:17 | 2026-06-11 14:57:12 | 5m 54s | 0 |

## Test Results Summary

| Run | Tests | Pass | Fail | Assertions | Duration |
|-----|-------|------|------|------------|----------|
| 03-baseline-controlled | 7 | 7 | 0 | 23 | 1.26s |
| 03-ecc-voluntary | 7 | 7 | 0 | 17 | 1.15s |
| 03-ecc-required | 9 | 9 | 0 | 19 | 1.24s |
| 05-baseline-controlled | 19 | 19 | 0 | 34 | 2.51s |
| 05-ecc-voluntary | 13 | 13 | 0 | 29 | 1.90s |
| 05-ecc-required | 23 | 23 | 0 | 43 | 4.06s |
| 06-baseline-controlled | 18 | 18 | 0 | 75 | 2.44s |
| 06-ecc-voluntary | 15 | 15 | 0 | 56 | 2.40s |
| 06-ecc-required | 28 | 28 | 0 | 90 | 2.69s |

All 9 runs: 100% test pass rate, 100% Pint pass rate, exit code 0.

## Score Summary

| Run | Functional (1×) | Conventions (1×) | Architecture (1×) | Validation (1×) | Security (1×) | Auth (1×) | Tests (2×) | Maint. (1×) | Style (0.5×) | Effic. (0.5×) | **Total** |
|-----|----------------|------------------|-------------------|----------------|---------------|-----------|------------|-------------|--------------|---------------|-----------|
| 03-base | 8 | 7 | 8 | 7 | 8 | 5 | 7 (14) | 7 | 10 (5) | 7 (3.5) | **72.5** |
| 03-vol | 7 | 8 | 8 | 6 | 7 | 5 | 6 (12) | 8 | 10 (5) | 8 (4) | **70.0** |
| 03-req | 9 | 8 | 9 | 8 | 9 | 5 | 9 (18) | 9 | 10 (5) | 9 (4.5) | **81.0** |
| 05-base | 9 | 9 | 9 | 9 | 9 | 9 | 8 (16) | 8 | 10 (5) | 8 (4) | **87.0** |
| 05-vol | 8 | 8 | 7 | 8 | 7 | 7 | 6 (12) | 7 | 10 (5) | 7 (3.5) | **72.5** |
| 05-req | 7 | 8 | 7 | 8 | 6 | 8 | 9 (18) | 7 | 10 (5) | 7 (3.5) | **77.0** |
| 06-base | 8 | 8 | 8 | 7 | 8 | 5 | 8 (16) | 8 | 10 (5) | 7 (3.5) | **74.0** |
| 06-vol | 7 | 8 | 8 | 7 | 8 | 5 | 7 (14) | 8 | 10 (5) | 8 (4) | **72.0** |
| 06-req | 9 | 9 | 9 | 8 | 8 | 5 | 10 (20) | 9 | 10 (5) | 8 (4) | **86.0** |

## Per-Scenario Ranking

### Scenario 03 — Signed Webhook
1. **ECC-Required: 81.0** — Best functional correctness, security, test coverage
2. Baseline-Controlled: 72.5 — Solid but longer duration, fewer tests
3. ECC-Voluntary: 70.0 — Lowest validation and security scores; skipped MCP entirely

### Scenario 05 — Multi-Tenant Isolation
1. **Baseline-Controlled: 87.0** — Best architecture (2-layer defense), highest security
2. ECC-Required: 77.0 — Widest test coverage but Policy-only scoping is fragile; Tenant model bug
3. ECC-Voluntary: 72.5 — No Policy layer, fewest tests, slowest duration

### Scenario 06 — AI RAG Workflow
1. **ECC-Required: 86.0** — Full pipeline, best test coverage (28 tests/90 assertions), factories, DI
2. Baseline-Controlled: 74.0 — Solid but no answer generation, uses service locator
3. ECC-Voluntary: 72.0 — Keyword-only retrieval, no answer generation scope, fewer tests

## MCP Call Summary

| Run | retrieve_context_bundle | search_ecc | get_knowledge_unit | validate_ecc | get_graph_context | **Total** |
|-----|------------------------|-----------|-------------------|-------------|------------------|-----------|
| 03-base | 0 | 0 | 0 | 0 | 0 | **0** |
| 03-vol | 0 | 0 | 0 | 0 | 0 | **0** |
| 03-req | 8 | 29 | 6 | 8 | 0 | **51** |
| 05-base | 0 | 0 | 0 | 0 | 0 | **0** |
| 05-vol | 2 | 0 | 10 | 0 | 0 | **12** |
| 05-req | 10 | 33 | 41 | 10 | 0 | **94** |
| 06-base | 0 | 0 | 0 | 0 | 0 | **0** |
| 06-vol | 0 | 0 | 0 | 0 | 0 | **0** |
| 06-req | 7 | 24 | 7 | 7 | 0 | **45** |
