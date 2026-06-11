# Phase 13.1 — MCP Adoption Analysis

## Overview

This report analyzes the adoption of ECC MCP retriever tools across all 9 experimental runs (3 scenarios × 3 modes). The three modes represent different levels of MCP availability and mandate.

## Raw Call Counts

| Run | Mode | retrieve_context_bundle | search_ecc | get_knowledge_unit | validate_ecc | get_graph_context | Total |
|-----|------|------------------------|-----------|-------------------|-------------|------------------|-------|
| 03-webhook | baseline-controlled | 0 | 0 | 0 | 0 | 0 | **0** |
| 03-webhook | ecc-voluntary | 0 | 0 | 0 | 0 | 0 | **0** |
| 03-webhook | ecc-required | 8 | 29 | 6 | 8 | 0 | **51** |
| 05-multi-tenant | baseline-controlled | 0 | 0 | 0 | 0 | 0 | **0** |
| 05-multi-tenant | ecc-voluntary | 2 | 0 | 10 | 0 | 0 | **12** |
| 05-multi-tenant | ecc-required | 10 | 33 | 41 | 10 | 0 | **94** |
| 06-rag | baseline-controlled | 0 | 0 | 0 | 0 | 0 | **0** |
| 06-rag | ecc-voluntary | 0 | 0 | 0 | 0 | 0 | **0** |
| 06-rag | ecc-required | 7 | 24 | 7 | 7 | 0 | **45** |

## Adoption Patterns

### Baseline-Controlled (Mode A)
**0 MCP calls across all 3 runs.** MCP was disabled via `"enabled":false` — confirmed isolation works correctly.

### ECC-Voluntary (Mode B)
**Mixed adoption: only 1 of 3 runs used MCP.**

| Scenario | Used MCP? | Total Calls | Notes |
|----------|-----------|-------------|-------|
| 03-webhook | No | 0 | Agent ignored available MCP entirely |
| 05-multi-tenant | **Yes** | 12 | Moderate adoption (1 retrieve + 10 get_knowledge_unit) |
| 06-rag | No | 0 | Agent ignored available MCP entirely |

The multi-tenant scenario was the only one where the voluntary agent opted into MCP. This suggests that agents are more likely to seek external knowledge for multi-tenant problems (which are inherently complex and less commonly implemented) vs. more familiar patterns like webhooks.

### ECC-Required (Mode C)
**100% adoption across all 3 runs.** Total calls: 51 (webhook), 94 (multi-tenant), 45 (RAG). The required-retrieval instruction was effective at forcing MCP usage.

## Tool-Level Analysis

### `retrieve_context_bundle`
- Used in all ECC-required runs and 1 ECC-voluntary run
- Most commonly called with `standard` mode
- One RAG-required run used `budget: 8000` for deeper context
- Task descriptions were full copies of the scenario prompt, not abbreviated

### `validate_ecc`
- Called only in ECC-required runs (as mandated by instruction)
- Never called in ECC-voluntary runs
- All calls returned: 2321 KUs valid, 0 cycles
- This is a lightweight call (~1s) and a good "hygiene" check

### `search_ecc`
- Heavily used in ECC-required runs (29, 33, 24 calls)
- Never used in ECC-voluntary runs
- Query patterns reveal agent research strategy:
  - **Webhook (03)**: Focused on HTTP testing, queue dispatch, method injection, security patterns
  - **Multi-tenant (05)**: Focused on cross-tenant leakage, tenant-aware validation, API resources, form requests
  - **RAG (06)**: Focused on Laravel AI SDK, document chunking, provider abstraction, resource controllers
- Many searches were iterative refinements of earlier queries

### `get_knowledge_unit`
- Used in all MCP-active runs (ECC-required + ECC-voluntary multi-tenant)
- **Canonical ID matching issue**: In ECC-required runs, most calls returned "not found" because agents used display names (e.g., `resource-controller-methods`) instead of canonical IDs (e.g., `api-crud-system-engineering/resource-controller-methods`)
- The exception was the ECC-voluntary multi-tenant run, where simple IDs like `multi-tenant-isolation` resolved successfully
- This is a significant UX issue: the retrieval instruction told agents to "use the exact canonical id returned by search_ecc" but search results may not clearly display domain-prefixed IDs

### `get_graph_context`
- **Never called in any run.** Neither voluntary nor required agents used this tool.
- Possible reasons: agents don't think in graph terms, the tool name doesn't signal its value, or agents prefer sequential search over graph navigation.

## Known Issue: Canonical ID Mismatch

The required-retrieval instruction tells agents:
> When calling get_knowledge_unit, always use the exact canonical id returned by search_ecc.

However, `search_ecc` returns display-name-like identifiers (e.g., `resource-controller-methods`, `document-chunking-strategies`) rather than full canonical IDs (e.g., `api-crud-system-engineering/resource-controller-methods`). This mismatch caused the majority of `get_knowledge_unit` calls in ECC-required runs to fail with "not found".

**Impact**: Of ~54 total `get_knowledge_unit` calls across ECC-required runs, approximately 85% returned "not found" due to this ID mismatch. Only the ECC-voluntary multi-tenant run consistently resolved IDs (using simple names like `multi-tenant-isolation`).

## Agent Satisfaction with MCP

From the run logs, agents that used MCP tools consistently:
1. Called `retrieve_context_bundle` first (per instruction)
2. Called `validate_ecc` for structural verification (in required mode only)
3. Engaged in iterative `search_ecc` → `get_knowledge_unit` research loops
4. Cited MCP-gathered knowledge in their implementation decisions

Agents that did NOT use MCP (voluntary runs 03 and 06) either:
- Did not mention MCP at all in their output
- Or noted they had MCP available but proceeded without it

## Recommendations

1. **Fix canonical ID display** in `search_ecc` results so agents can copy-paste IDs directly into `get_knowledge_unit`
2. **Rename `get_graph_context`** to something more action-oriented (e.g., `explore_connections` or `find_related_knowledge`)
3. **Consider making `validate_ecc` part of the voluntary prompt** — it's cheap and provides useful structural validation
4. **Add abbreviated task descriptions** to `retrieve_context_bundle` — agents copy the full prompt which wastes context budget
5. **For ECC-required mode**, consider reducing the number of mandated calls to prevent excessive token consumption (94 calls for multi-tenant consumed significant context)
