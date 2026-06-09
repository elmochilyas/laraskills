# Phase 11.3 — MCP Usability Report

## MCP Discovery

The MCP tools were discoverable by the agent. The agent successfully identified and called `retrieve_context_bundle`, `search_ecc`, `get_knowledge_unit`, and `validate_ecc`. No discovery issues were observed.

## MCP Connection Reliability

No connection failures were observed during the experiment. The MCP server maintained a stable connection throughout the 9-minute session.

## ECC_ROOT Clarity

The ECC root path was correctly configured and the MCP server located its resources without issue. No path-related errors were reported.

## Tool-Call Usefulness

| Tool | Called | Useful? | Notes |
|---|---|---|---|
| `retrieve_context_bundle` | Yes | Yes | Provided structural guidance for CRUD implementation, though deep mode was excessive (~31K tokens) |
| `search_ecc` | Yes | Yes | Helped find KUs for CRUD, cursor pagination, policies, API Resources |
| `get_knowledge_unit` | Yes | Partially | Attempted with 3 non-canonical IDs, all of which failed |
| `validate_ecc` | Yes | Informational | Confirmed graph integrity (2,321 KUs, 0 cycles, 0 dangling edges) |
| `get_graph_context` | No | N/A | Not called — agent may not have needed prerequisite/related expansion |

## Failed Non-Canonical `get_knowledge_unit` Attempts

The agent attempted `get_knowledge_unit` with these IDs:
- `cursor-based-pagination` — **failed** (non-canonical)
- `model-serialization` — **failed** (non-canonical)
- `data-backfill-best-practices` — **failed** (non-canonical)

These failures represent a usability gap: the agent knew which topics it needed but could not resolve them to canonical KU IDs. Improving `search_ecc` results to include copyable canonical IDs would resolve this.

## External OpenCode Free-Model Rate-Limit Incident

An external rate-limit incident occurred with the OpenCode free model during a prior experiment phase. This was unrelated to Laravel ECC — it was a hosting/infrastructure limitation of the free-tier model service.

## Whether the Rate-Limit Issue Was Unrelated to Laravel ECC

Confirmed. The rate-limit incident was on the OpenCode side (free-tier model rate limiting) and did not affect the MCP server, retrieval CLI, or any Laravel ECC component. The incident was external to the experiment.

## Overall MCP Usability Assessment

The MCP integration is functional and useful, with two identified improvement areas:

1. **Search-to-KU resolution** — `search_ecc` results should surface canonical KU IDs for direct use in `get_knowledge_unit` calls
2. **Bundle sizing guidance** — the agent defaulted to `deep` mode for a simple CRUD task; the tool should guide users toward `compact` or `standard` mode first
