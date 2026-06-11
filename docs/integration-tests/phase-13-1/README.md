# Phase 13.1 — Controlled ECC Attribution Study

## Overview

9 isolated `opencode run` experiments (3 scenarios × 3 MCP modes) measuring the discrete impact of ECC MCP retrieval on Laravel 13 implementation quality. Designed to remove the `--pure` confound from Phase 13.

## Quick Links

| Document | Description |
|----------|-------------|
| [Final Report](phase-13-1-final-report.md) | Comprehensive results, analysis, and recommendations |
| [Methodology](methodology.md) | Experiment design, mode definitions, scoring rubric |
| [Scenario Matrix](scenario-matrix.md) | Timing, test results, scores, and MCP call counts for all 9 runs |
| [MCP Adoption Analysis](mcp-adoption-analysis.md) | Tool-by-tool usage analysis across all modes |
| [Retrieval Efficacy Report](retrieval-efficacy-report.md) | Whether retrieved knowledge influenced implementation decisions |
| [Runbook](phase-13-1-runbook.md) | Manual execution protocol with per-scenario checklists |

### Scenario Reports

| Scenario | Report |
|----------|--------|
| 03 — Signed Webhook | [View Report](scenarios/03-signed-webhook-report.md) |
| 05 — Multi-Tenant Isolation | [View Report](scenarios/05-multi-tenant-isolation-report.md) |
| 06 — AI RAG Workflow | [View Report](scenarios/06-laravel-ai-rag-workflow-report.md) |

### Prompt Files

| File | Description |
|------|-------------|
| `prompts/03-signed-webhook.txt` | Webhook scenario prompt |
| `prompts/05-multi-tenant-isolation.txt` | Multi-tenant scenario prompt |
| `prompts/06-laravel-ai-rag-workflow.txt` | RAG workflow scenario prompt |
| `prompts/required-retrieval-instruction.txt` | Mandatory MCP retrieval instruction (Mode C) |

## Key Results

| Result | Value |
|--------|-------|
| Total runs | 9 |
| Pass rate | **100%** (all tests pass, all Pint pass) |
| ECC-Required wins | 2 of 3 scenarios |
| Baseline wins | 1 of 3 scenarios |
| Fastest duration | 03-ecc-required: **5m 1s** |
| Slowest duration | 03-baseline-controlled: **10m 53s** |
| Most tests | 06-ecc-required: **28 tests, ~57 assertions** |
| Most MCP calls | 05-ecc-required: **94 calls** |
| ECC-Voluntary adoption | **33%** (1 of 3 runs) |

## Top-Level Findings

1. **ECC-Required mode consistently produces higher-quality code** in less time for 2 of 3 scenarios (webhook, RAG)
2. **ECC-Voluntary adoption is poor** — only 1 of 3 agents opted to use available MCP tools
3. **Baseline agents can match or exceed ECC quality** on well-documented patterns (multi-tenant)
4. **High MCP call counts don't guarantee quality** — 94 calls in multi-tenant required still placed 2nd
5. **`get_knowledge_unit` has a canonical ID resolution bug** causing ~85% of calls to fail in ECC-required runs
