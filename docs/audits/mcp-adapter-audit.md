# MCP Adapter Audit

**Date:** 2026-06-09  
**Repository:** laravel-ecc@1.0.0-beta.8

---

## Static Audit Results

### File: `scripts/laravel-ecc-mcp.mjs` (274 lines)

| Check | Result |
|-------|--------|
| Stdio transport only | ✅ `StdioServerTransport` |
| No HTTP server | ✅ No Express, no HTTP imports |
| No OAuth | ✅ |
| No write tools | ✅ All 5 tools are read-only queries |
| Delegates to shared core | ✅ Imports from `../src/retrieval/index.mjs` |
| No duplicate retrieval logic | ✅ |
| No duplicate ranking | ✅ |
| No duplicate graph logic | ✅ |
| No `console.log` to stdout | ✅ All diagnostics to stderr |
| Input schemas exist | ✅ |
| Output schemas exist | ✅ |
| Read-only annotations exist | ✅ `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true` |
| Missing root → isError | ✅ `buildRootErrorResult` with `isError: true` |
| Server stays alive on error | ✅ |
| Graceful SIGINT/SIGTERM shutdown | ✅ |

### File: `scripts/mcp/schemas.mjs` (237 lines)

| Check | Result |
|-------|--------|
| 5 tool input schemas | ✅ |
| All have input schema | ✅ |
| All read-only | ✅ |
| Output schemas defined | ✅ |
| Zod validation | ✅ |

### File: `scripts/mcp/handlers.mjs` (312 lines)

| Check | Result |
|-------|--------|
| Core delegation | ✅ |
| Error → isError | ✅ |
| Not-found handling | ✅ |
| No duplicate ranking | ✅ |

### Minor: Duplicate `loadCatalog` Call
`buildValidationResult` calls `loadCatalog` twice (once via `validateIntelligence`, once directly for exact cycle counts). Non-blocking but could be optimized.

### Minor: Partial Graph Logic Overlap
`countCycles` and `readEdgesForSelfLoopsAndDangling` partially overlap with `validateIntelligence` internals but are necessary for exact counts not returned by `validateIntelligence`.

## Tools Exposed

| # | Tool | Read-Only |
|---|------|-----------|
| 1 | retrieve_context_bundle | ✅ |
| 2 | search_ecc | ✅ |
| 3 | get_knowledge_unit | ✅ |
| 4 | get_graph_context | ✅ |
| 5 | validate_ecc | ✅ |

**Exactly 5 read-only tools.** ✅

## Verdict

| Check | Result |
|-------|--------|
| Stdio only | ✅ |
| No write tools | ✅ |
| Delegates to shared core | ✅ |
| Schemas for all tools | ✅ |
| Read-only annotations | ✅ |
| Deterministic | ✅ |
| Bounded outputs | ✅ |
| Error handling | ✅ |
| Graceful shutdown | ✅ |
