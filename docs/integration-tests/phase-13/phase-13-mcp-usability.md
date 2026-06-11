# Phase 13 — MCP Usability Findings

## Overview

This document reviews the usability of the Laravel ECC MCP server across the six evaluation scenarios. Observations are drawn from per-scenario reports and raw ECC run logs.

## MCP Tool Set

The published `laravel-ecc@1.0.0-beta.12` exposes exactly 5 tools:

| Tool | Purpose |
|------|---------|
| `retrieve_context_bundle` | Smallest useful bundle for a Laravel task |
| `search_ecc` | Ranked KU search |
| `get_knowledge_unit` | Inspect one KU by ID |
| `get_graph_context` | Prerequisites + related topics in one call |
| `validate_ecc` | Validate intelligence layer integrity |

## Connection Reliability

| Aspect | Status |
|--------|--------|
| Server starts | ✅ Confirmed — MCP server starts from installed npm package |
| Initial connection | ✅ `opencode mcp list` shows connected |
| Timeout handling | ✅ No timeout failures observed in any of the 6 ECC runs |
| Reconnection | ⏳ Not tested (server did not disconnect during any run) |
| Error messages | ✅ No MCP errors observed in any ECC run log |

## Tool-by-Tool Usability

### `retrieve_context_bundle`
- **Standard mode** (~4,000–6,000 tokens) was used in 4 of 6 scenarios (1, 2, 3, 4)
- **Adequacy**: standard mode was sufficient for all scenarios — no task required deep mode
- **Adoption**: 4/6 scenarios used it
- **Call count**: exactly 1 call per scenario that used it
- **Issue**: bundle contents are not explicitly reported by the agent, making it hard to verify domain selection was correct

### `search_ecc`
- **Adoption**: used in only 2 of 6 scenarios (1 with 3–5 searches, 4 with multiple searches)
- **Canonical ID exposure**: search output correctly exposes canonical KU IDs — agents in Scenarios 1 and 4 used these IDs in subsequent `get_knowledge_unit` calls
- **Recall**: search returned relevant KUs for all queries observed (e.g., "eloquent relationships eager loading n+1" correctly returned relationship/loading/n+1 KUs)
- **Issue**: agents in Scenarios 2, 3, 5, 6 never called search — they either relied on the bundle alone or ignored MCP entirely

### `get_knowledge_unit`
- **Adoption**: used in only 2 of 6 scenarios (S1 with 4–5 calls, S4 with ~6 calls)
- **Canonical ID resolution**: ✅ No errors — agents used valid canonical IDs from search results
- **Content quality**: KUs returned detailed, actionable content that influenced generated code (e.g., `sanctum-authentication-setup` guided proper Sanctum installation)
- **Issue**: `get_graph_context` was never called in any scenario — the tool exists but no agent discovered or used it

### `get_graph_context`
- **Adoption**: **0 calls across all 6 scenarios** — this tool was entirely unused
- **Possible reasons**: agents may not find it discoverable; the tool's purpose (prerequisites + related topics) may overlap with `search_ecc` in ways the agent doesn't distinguish; or the agent's workflow doesn't naturally trigger the need for graph traversal

### `validate_ecc`
- **Adoption**: called in 4 of 6 scenarios (all except 5 and 6 which made 0 MCP calls)
- **Speed**: consistently fast (< 1 second)
- **Output**: returns structural integrity info (KU count, cycle detection)
- **Value**: provides a quick health check but agents don't visibly use the output for decision-making

## Actual Usage Patterns

| Pattern | Scenarios | Count |
|---------|-----------|-------|
| Full workflow: bundle → validate → search → KU reads | 1, 4 | 2 |
| Minimal workflow: bundle → validate only | 2, 3 | 2 |
| Zero MCP usage | 5, 6 | 2 |

## Usability Issues Observed

| Issue | Scenarios Affected | Severity |
|-------|-------------------|----------|
| Agent doesn't discover MCP tools at all | 5, 6 | **High** — entire knowledge layer bypassed |
| Agent stops at bundle+validate without deep research | 2, 3 | **Medium** — shallow retrieval |
| `get_graph_context` never called | All 6 | **Low** — tool may be redundant |
| Agent doesn't report which KUs were retrieved | 2, 3 | **Low** — observability gap |
| No automated post-run checklist validation | All with retrieval | **Low** — missed improvement opportunity |

## Why Agents Skip MCP (Hypotheses)

Based on observations across all 6 scenarios:

1. **Discoverability gap**: The agent's explore phase (reading files, listing directories) satisfies information needs before the agent considers using MCP tools. By the time the agent starts writing code, it believes it has enough context.

2. **Web search is preferred**: In Scenario 6, the agent explicitly performed a web search ("Laravel AI SDK conventions 2026") instead of querying ECC. This pattern (web search > MCP lookup) may be a learned behavior from training data.

3. **Bundle sufficiency**: Standard mode bundles provide enough context for focused CRUD tasks (Scenarios 2, 3), making additional research feel unnecessary to the agent.

4. **Tool visibility**: MCP tools appear as a flat list of options alongside many other actions. Without explicit instructions to "always call retrieve_context_bundle first," the agent treats MCP as optional research, not as a required workflow step.

5. **Speed trade-off**: The agent optimizes for quick completion. MCP calls add latency (1–3 seconds each) with no guaranteed benefit, so the agent may skip them by default.

## Improvement Proposals

1. **Add MCP tool usage to the system prompt** — Explicit instructions like "Before implementing, call `retrieve_context_bundle` for your task" would dramatically improve adoption.

2. **Auto-trigger bundle on project load** — If the agent automatically called `retrieve_context_bundle` when entering a new worktree, the knowledge layer would be seeded without requiring manual tool discovery.

3. **Surface MCP tools more prominently** — Consider grouping MCP tools in a dedicated section of the agent's action space, or giving them higher priority than web search for Laravel-specific queries.

4. **Remove or consolidate `get_graph_context`** — Zero usage across 6 scenarios suggests the tool overlaps with `search_ecc` + `get_knowledge_unit`. Consider merging its functionality into the bundle or search output.

5. **Add post-run validation feedback** — After code generation, have the agent automatically run `validate_ecc` and report the result. This creates a habit loop.

6. **Create scenario prompts for Phase 13.1** that explicitly direct the agent to use MCP tools, testing whether the agent can follow MCP workflow instructions when they are explicitly stated.

---

*Phase 13 MCP usability findings. 2026-06-11.*
