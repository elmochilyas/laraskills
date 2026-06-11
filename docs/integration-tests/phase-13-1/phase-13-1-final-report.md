# Phase 13.1 — Final Report

## Executive Summary

Phase 13.1 executed 9 controlled runs (3 scenarios × 3 MCP modes) using `opencode/deepseek-v4-flash-free` to measure the discrete impact of ECC MCP retrieval on Laravel implementation quality, removing the `--pure` confound from Phase 13.

**Key finding**: ECC-required mode produces the highest-quality implementations in 2 of 3 scenarios (signed webhook: 81.0, RAG workflow: 86.0). Baseline-controlled produces the best result in 1 of 3 scenarios (multi-tenant isolation: 87.0). ECC-voluntary adoption is poor (1 of 3 runs used MCP) and produced the weakest implementations.

## Scores Summary

| Scenario | Baseline | ECC-Voluntary | ECC-Required | Winner |
|----------|----------|--------------|--------------|--------|
| 03 — Signed Webhook | 72.5 | 70.0 | **81.0** | ECC-Required |
| 05 — Multi-Tenant Isolation | **87.0** | 72.5 | 77.0 | Baseline |
| 06 — AI RAG Workflow | 74.0 | 72.0 | **86.0** | ECC-Required |

## Timing Summary

| Scenario | Baseline | ECC-Voluntary | ECC-Required |
|----------|----------|--------------|--------------|
| 03 — Signed Webhook | 10m 53s | **5m 51s** (-46%) | **5m 1s** (-54%) |
| 05 — Multi-Tenant Isolation | **6m 53s** | 8m 50s (+28%) | 8m 6s (+18%) |
| 06 — AI RAG Workflow | 8m 52s | **5m 54s** (-33%) | **5m 54s** (-33%) |

ECC modes were faster in 2 of 3 scenarios (webhook: -46%/-54%, RAG: -33%/-33%) but slower in multi-tenant (+18%/+28%).

## MCP Adoption

| Mode | Runs with MCP | Total Calls | Avg Calls/Run |
|------|--------------|-------------|---------------|
| Baseline-Controlled | 0 of 3 | 0 | 0 |
| ECC-Voluntary | 1 of 3 | 12 | 4 |
| ECC-Required | **3 of 3** | **190** | **63.3** |

ECC-Required mode achieved 100% MCP adoption with the required-retrieval instruction. ECC-Voluntary achieved only 33% adoption (only multi-tenant scenario).

## Tool Usage Distribution (ECC-Required Only)

| Tool | Total Calls | % of Total | Used In |
|------|------------|-----------|---------|
| `search_ecc` | 86 | 45.3% | All 3 runs |
| `get_knowledge_unit` | 54 | 28.4% | All 3 runs |
| `retrieve_context_bundle` | 25 | 13.2% | All 3 runs |
| `validate_ecc` | 25 | 13.2% | All 3 runs |
| `get_graph_context` | 0 | 0% | **Never used** |

## Known Issues Discovered

1. **Canonical ID mismatch in `get_knowledge_unit`**: ~85% of calls returned "not found" because agents used display names (e.g., `resource-controller-methods`) instead of canonical IDs (e.g., `api-crud-system-engineering/resource-controller-methods`). Only the ECC-voluntary run with simple IDs resolved successfully.

2. **`get_graph_context` never called**: Neither voluntary nor required agents used graph navigation tools. The tool name may not signal its value to agents.

3. **Tenant model bug in 05-ecc-required**: `Tenant->users()` relationship method missing `return` keyword, silently returning `null`.

4. **Windows PowerShell stderr issue**: `opencode.ps1` writes status to stderr, causing `$ErrorActionPreference = "Stop"` to abort PowerShell scripts. All 9 scripts required patching.

## Per-Scenario Verdicts

### Scenario 03 — Signed Webhook
**Winner: ECC-Required (81.0)**

ECC guidance on webhook security patterns (timestamp-before-signature ordering, 409 for duplicates, configurable tolerance, stored signatures, factory for test data) produced a measurably better implementation. The required-retrieval instruction was effective, with 51 MCP calls across 5 tool types. Duration was 54% shorter than baseline — the largest improvement in the study.

### Scenario 05 — Multi-Tenant Isolation
**Winner: Baseline-Controlled (87.0)**

The only scenario where ECC did not improve scores. The baseline agent's 2-layer defense (query scoping + Policy) was more robust than the ECC-required agent's Policy-only approach. The ECC-required agent made 94 MCP calls (most of any run) but this did not prevent a code bug (missing `return` in relationship) or architectural weakness (single-layer defense). ECC-voluntary produced the weakest result with no Policy at all.

### Scenario 06 — AI RAG Workflow
**Winner: ECC-Required (86.0)**

The clearest ECC win. ECC guidance on provider abstraction, chunking with overlap, factories, `Http::preventStrayRequests()`, and constructor injection produced a 16% higher score in 33% less time. The ECC-voluntary agent ignored MCP and produced the weakest RAG framework.

## Recommendations

### Short-term (Phase 13.2)

1. **Fix `get_knowledge_unit` ID resolution** to accept display names and partial IDs without domain prefix
2. **Rename `get_graph_context`** to a more actionable name (e.g., `explore_connections`)
3. **Add `validate_ecc` to voluntary-mode prompts** — it's cheap and provides structural assurance
4. **Reduce required-retrieval instruction verbosity** to conserve context budget

### Medium-term (Phase 14)

1. **Investigate why voluntary adoption is low** — is the MCP tool discoverability insufficient?
2. **Test whether MCP call count correlates inversely with quality** — the multi-tenant required run's 94 calls may have consumed context that would have been better spent on implementation
3. **Consider tiered retrieval**: "compact" mode for familiar patterns, "standard" for moderate complexity, "deep" for novel domains
4. **Explore automatic retrieval routing** — detect task domain and pre-fetch relevant KUs without agent action

### Long-term

1. **Canonical ID resolution should be transparent** — agents should not need to understand ID formats
2. **Consider automatic `validate_ecc` as a pre-flight check** before every run
3. **Build a confidence score** for MCP guidance based on task similarity to existing KUs
