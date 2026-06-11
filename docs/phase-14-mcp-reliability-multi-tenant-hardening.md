# Phase 14: MCP Reliability & Multi-Tenant Knowledge Hardening

**Report Date:** 2026-06-11
**Status:** Complete — Phase 14 readiness achieved.

## Summary

Phase 14 addressed MCP tool reliability gaps (canonical-ID resolution through the schema layer, retrieval budgeting guidance) and hardened multi-tenant Laravel knowledge with query-level scoping anti-patterns and validation checklists. All Phase 14 tests pass (176/180; 4 pre-existing failures unchanged). The intelligence layer validates cleanly (2321 KUs, 429 dep edges, 3513 rel edges, 0 cycles).

## Previous Limitation

Three evidence reports from Phase 13.1 surfaced gaps:
1. **Canonical-ID resolution**: MCP tools accepted short IDs and aliases in `resolveCanonicalId()` but the resolution metadata was silently stripped by Zod output schemas — agents could not see which strategy was used, making debugging difficult.
2. **Retrieval budgeting**: No guidance existed in MCP tool outputs or agent documentation about how to iterate when a bundle doesn't answer the question.
3. **Multi-tenant knowledge**: Existing knowledge covered tenant isolation policies but lacked explicit guidance on query-level global scopes, scoped route-model binding, and cross-tenant leakage testing.

## Discovery Findings

- `getKnowledgeUnit()` returns `_resolution` with strategy + resolved ID, but `knowledgeUnitOutputSchema` didn't include the field, so Zod `.safeParse()` stripped it silently
- `getPrerequisites()` / `getRelatedTopics()` return `_resolution` but `graphContextOutputSchema` didn't include `resolvedId`
- `buildSearchResult()` text output used a bare list format that was harder to copy-paste than a table-like format
- `describeForAgents()` didn't mention convergence or budgeting
- Multi-tenant KUs covered policy-level but not query-level scoping patterns

## Completed Work

### 1. Canonical-ID Schema Exposure

**`scripts/mcp/schemas.mjs`:**
- Added `_resolution: z.object({ strategy: z.string(), resolved_id: z.string() }).optional()` to `knowledgeUnitOutputSchema`
- Added `resolvedId: z.string().optional()` to `graphContextOutputSchema`

### 2. Search Text Format Improvement

**`scripts/mcp/handlers.mjs`** — `buildSearchResult()`:
- Text output now uses a table-like pipe format: `# | ID (canonical) | Name | Score`
- Each result appears on its own line with a numeric index
- Every listed result ID is visible for copy-paste into `get_knowledge_unit` / `get_graph_context`

### 3. Resolution Info in Outputs

**`scripts/mcp/handlers.mjs`:**
- `buildKnowledgeUnitResult()` — text output shows resolution strategy when short ID or alias was used
- `buildGraphContextResult()` — text output shows resolution strategy; structured exposes `resolvedId`

### 4. Retrieval Budgeting & Convergence Guidance

**`scripts/mcp/handlers.mjs`:**
- `describeForAgents()` updated with budget + convergence instructions
- `buildRetrieveBundleResult()` text output includes convergence guidance section
- MCP tool descriptions in `laravel-ecc-mcp.mjs` updated

**`scripts/mcp/schemas.mjs`:**
- All input schema descriptions updated with budget guidance
- `retrieveContextInputSchema` fields: `mode`, `max_kus`, `max_prerequisites`, `related_depth`, `budget` all carry size/iteration hints

**`agent/retrieval-guide.md`:**
- MCP path elevated as primary workflow (superseding CLI-first workflow)

### 5. Multi-Tenant Knowledge Hardening

**`knowledge/security-identity-engineering/authentication/multi-tenant-authentication/08-anti-patterns.md`:**
- Added Anti-Pattern 6: "Policy-only tenant isolation without query-level scoping"
- Added Anti-Pattern 7: "Missing scoped route-model binding for tenant isolation"

**`knowledge/security-identity-engineering/authentication/multi-tenant-authentication/09-checklists.md`:**
- Added items: query-level scoping (global TenantScope), scopeBindings on nested tenant routes, cross-tenant leakage test

**`tests/retrieval/fixtures/benchmark-tasks.json`** — `bench-072`:
- Task: "Design multi-tenant CRUD with query-level scoping, scoped route-model binding, and cross-tenant leakage tests"
- Expected KUs: `cross-tenant-data-leak-prevention`, `tenant-aware-middleware`, `eloquent-global-scopes`
- Expected rules: `tenant isolation`, `global scope`

### 6. Regression Tests

**`tests/retrieval/mcp.test.mjs`** — Added 5 new tests:
- `get_knowledge_unit`: short ID resolution via last-segment strategy (verifies `_resolution.strategy === 'last-segment'`)
- `get_knowledge_unit`: alias resolution (verifies `_resolution.strategy === 'alias'`)
- `get_knowledge_unit`: canonical-ID round-trip (search → short ID → get → same canonical ID)
- `search_ecc`: nonsense query handled gracefully (verifies well-formed text output)
- `get_graph_context`: short ID resolution with `resolvedId` exposed

## Validation

- **176/180 tests passing** (4 pre-existing failures: `cli.test.mjs` line 78 & 84, `ecc-root-resolver.test.mjs` line 134 & 194 — unchanged from baseline)
- **All Phase 14 tests pass** (short ID resolution, alias resolution, canonical-ID round-trip, schema exposure, non-canonical graph context)
- **`validate_ecc`**: `valid: true`, 2321 KUs, 429 dependency edges, 3513 relationship edges, 0 cycles, 0 self-loops, 0 dangling edges
- **All MCP 5 tools** confirmed with schemas and annotations

## Remaining Gaps

1. (Pre-existing) CLI `prerequisites` and `related` commands have output-format issues — MCP equivalents (`get_graph_context`) work correctly.
2. (Pre-existing) Root-resolver tests 3 and 5 fail due to config-file priority — resolved in Phase 12 but the test expectations need updating.
3. (Deferred) Intelligence layer regeneration was not re-run (generator tooling handles this deterministically).

## Phase 15 Readiness

Phase 14 is complete. The codebase is ready for Phase 15 topics such as: additional MCP server transports (SSE/WebSocket), retrieval performance benchmarking, knowledge-layer caching, or CLI output formatting improvements.
