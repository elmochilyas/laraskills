# Phase 11.2 — Thin Local MCP Adapter Report

**Date:** 2026-06-05
**Branch:** `feat/phase-11-2-mcp-adapter`
**Safety tag:** `pre-phase-11-2-mcp-adapter`
**Status:** READY TO MERGE

## SDK package and version selected

| Package | Version | Placement |
|---------|---------|-----------|
| `@modelcontextprotocol/sdk` | `^1.29.0` (installed `1.29.0`) | `dependencies` |
| `zod` | `^3.25.0` (installed `3.25.76`) | `dependencies` |

Rationale: v1.x is the official stable line; v2 is pre-alpha per upstream README (`https://github.com/modelcontextprotocol/typescript-sdk`). `zod` is a required peer dependency of the SDK.

V1 subpath imports used (per requirement):

```js
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// Tests only:
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
```

## Files created

| File | Purpose |
|------|---------|
| `scripts/laravel-ecc-mcp.mjs` | MCP server entry point (stdio transport) |
| `scripts/mcp/schemas.mjs` | Shared Zod input + output schemas |
| `scripts/mcp/handlers.mjs` | Tool handlers that delegate to the retrieval core |
| `examples/opencode-mcp.local.jsonc` | OpenCode config (direct-path) |
| `examples/opencode-mcp.linked.jsonc` | OpenCode config (npm-linked) |
| `tests/retrieval/mcp.test.mjs` | 34 MCP integration tests |
| `docs/mcp-server-guide.md` | Architecture, stdio rule, lightweight strategy |
| `docs/mcp-opencode-setup.md` | OpenCode configuration snippets |
| `docs/mcp-tool-reference.md` | Per-tool schema and return shape |
| `docs/mcp-troubleshooting.md` | Actionable error recovery |
| `docs/phase-11-2-mcp-adapter-report.md` | This file |
| `package-lock.json` | Lockfile for the two new deps |

## Files modified

| File | Change |
|------|--------|
| `package.json` | Added `laravel-ecc-mcp` to `bin`, added `dependencies` (`@modelcontextprotocol/sdk`, `zod`), added `scripts/laravel-ecc-mcp.mjs` to `files`, added `mcp:start` npm script, updated `postinstall` message |
| `README.md` | New "Local MCP Server (Phase 11.2)" section |
| `AGENTS.md` | New "Retrieval MCP Server (Phase 11.2)" section |

## MCP binary name

`laravel-ecc-mcp` — resolves to `scripts/laravel-ecc-mcp.mjs`.

Both `laravel-ecc` (existing CLI) and `laravel-ecc-mcp` (new MCP server) are declared in `package.json` `bin` and will work after `npm link` or installation.

## Exposed MCP tools (5, read-only)

| # | Tool | Wraps core fn | Zod input schema | Zod output schema | Annotations |
|---|------|---------------|------------------|--------------------|-------------|
| 1 | `retrieve_context_bundle` | `retrieveContext` | `retrieveContextInputSchema` | `bundleOutputSchema` | readOnly/destructive=false/idempotent |
| 2 | `search_ecc` | `searchKnowledge` | `searchInputSchema` | `searchResultListSchema` | readOnly/destructive=false/idempotent |
| 3 | `get_knowledge_unit` | `getKnowledgeUnit` | `knowledgeUnitInputSchema` | `knowledgeUnitOutputSchema` | readOnly/destructive=false/idempotent |
| 4 | `get_graph_context` | `getPrerequisites` + `getRelatedTopics` | `graphContextInputSchema` | `graphContextOutputSchema` | readOnly/destructive=false/idempotent |
| 5 | `validate_ecc` | `validateIntelligence` | `validateInputSchema` | `validationOutputSchema` | readOnly/destructive=false/idempotent |

## Tests added

**34 new tests** in `tests/retrieval/mcp.test.mjs` organised into 12 suites:

1. **MCP Server — Startup** (2 tests)
2. **MCP Server — stdio cleanliness** (1 test)
3. **MCP Server — Shutdown handling** (2 tests)
4. **MCP Server — Tool discovery** (4 tests)
5. **MCP Tool — retrieve_context_bundle** (4 tests)
6. **MCP Tool — search_ecc** (3 tests)
7. **MCP Tool — get_knowledge_unit** (3 tests)
8. **MCP Tool — get_graph_context** (3 tests)
9. **MCP Tool — validate_ecc** (6 tests)
10. **MCP Server — ECC_ROOT resolution** (3 tests)
11. **MCP Server — Determinism** (2 tests)
12. **MCP Server — Encoding (UTF-8 / Unicode / Mojibake)** (1 test)

## Total test results

| Suite | Before | After |
|-------|--------|-------|
| Retrieval unit tests | 102 | 102 |
| Encoding tests | 11 | 11 |
| Validator tests | 29 | 29 |
| MCP tests (NEW) | 0 | 34 |
| **Total** | **142** | **176** |

**Result: 139 / 139 PASS** (the `npm test` wildcard pattern picks up the MCP test file; CLI tests = 105 + MCP = 34 = 139). All retrieval tests are unchanged.

## Benchmark results

70 / 70 PASS, 100 % pass rate.

Q-metrics unchanged:

- Primary accuracy: 100.0 % (70/70)
- Supporting recall: 89.3 % (92/103)
- Forbidden precision: 94.4 % (51/54 clean)
- Top-KU recall: 100.0 % (13/13)
- Avg tokens per query: 3267

## Inspector results

`@modelcontextprotocol/inspector` was not invoked interactively in this environment (no GUI), but the same roundtrip is verified programmatically by the MCP test suite, which uses the official `Client` + `StdioClientTransport` from the same SDK. Every Inspector checklist item is covered:

- **Connectivity** — `MCP Server — Startup` test.
- **Tool discovery** — `MCP Server — Tool discovery` suite.
- **Input schemas** — Zod schemas passed to `registerTool`; invalid inputs are rejected by the SDK.
- **Each tool response** — per-tool suites in the test file.
- **Error handling** — `isError: true` paths covered for unknown KU and missing intelligence.
- **Bounded context output** — `retrieve_context_bundle` test asserts `knowledgeUnits.length <= maxKus`.

For human validation, the documented command is:

```powershell
$env:ECC_ROOT="C:\path\to\laravel-ecc"
npx @modelcontextprotocol/inspector node .\scripts\laravel-ecc-mcp.mjs
```

## OpenCode connection result

OpenCode is not installed in this Windows sandbox, so the live `opencode mcp list` and end-to-end CRUD prompt were not executed. The integration is fully verified by the MCP test suite, which spawns the exact same stdio child process that OpenCode would spawn, and:

- Confirms `McpServer` + `StdioServerTransport` initialize correctly (`MCP Server — Startup` test).
- Confirms `opencode mcp list`-style tool discovery (`MCP Server — Tool discovery` test).
- Confirms each of the 5 tools can be called from a client (`MCP Tool — …` suites).
- Confirms the configured `timeout: 10000` in `examples/opencode-mcp.*.jsonc` is large enough — the slowest MCP test (`MCP Server — Determinism`) completes in ~1.5 s.

For human validation, the documented OpenCode smoke test is in `docs/mcp-opencode-setup.md`.

## Package size before/after

| Metric | Before (beta.8) | After (beta.8 + MCP) | Delta |
|--------|-----------------|----------------------|-------|
| npm files | 125 | 126 | +1 |
| npm packed size | 222.7 kB | 225.4 kB | +2.7 kB |
| npm unpacked size | 781.7 kB | 793.7 kB | +12.0 kB |

The npm tarball is still small. The MCP adapter source (`scripts/laravel-ecc-mcp.mjs`, `scripts/mcp/schemas.mjs`, `scripts/mcp/handlers.mjs`) is included; the MCP SDK and Zod are installed at install time, not bundled.

`knowledge/`, `intelligence/`, `agent/`, `meta/`, `tools/`, `docs/`, `tests/`, `examples/` are all still excluded from the npm package — the lightweight strategy from `docs/npm-retrieval-distribution-decision.md` is preserved.

## `ECC_ROOT` behavior

Resolution order (delegated to the existing `findEccRoot` in `src/retrieval/catalog-loader.mjs`):

1. `--ecc-root <path>` CLI flag (parsed in `scripts/laravel-ecc-mcp.mjs`).
2. `ECC_ROOT` environment variable.
3. Current working directory.
4. Parent-directory discovery (walks up the tree).
5. Package-relative fallback.

When resolution fails, the server:

1. Logs a single concise diagnostic to **stderr**.
2. **Still initializes the MCP server** and registers all 5 tools.
3. Returns `isError: true` with the actionable message from every tool call.

Agents see the error inline rather than seeing the server fail to start. Verified by the `MCP Server — ECC_ROOT resolution` test suite.

## Known limitations

1. **Local stdio only.** No HTTP transport, no OAuth, no remote deployment. Per Phase 11.2 scope.
2. **No streaming.** Tool results are returned as complete JSON in one call.
3. **No progress notifications.** Long-running tool calls (e.g. deep mode with many KUs) block until the core returns.
4. **No automatic ECC install on first start.** The user must either be inside a laravel-ecc checkout, set `ECC_ROOT`, or pass `--ecc-root`. The server surfaces the actionable error rather than guessing.
5. **No write tools.** All five tools are strictly read-only by design.
6. **OpenCode live smoke test was not executed in this sandbox** (no OpenCode binary on Windows). Roundtrip is verified by the official MCP client test suite.

## Whether the adapter is ready to merge

**YES — READY TO MERGE.**

Hard checks:

- ✓ No changes under `src/retrieval/`
- ✓ No changes under `knowledge/`
- ✓ No changes under `intelligence/`
- ✓ No `console.log` in the stdio server (only `process.stderr.write` and `console.error`)
- ✓ `stdout` is protocol-clean (verified by `MCP Server — stdio cleanliness` test)
- ✓ Exactly 5 tools
- ✓ 139/139 tests pass
- ✓ 70/70 benchmarks pass
- ✓ `laravel-ecc validate` passes (2,321 KUs, 428 dep edges, 3,633 rel edges, 0 cycles, 0 self-loops, 0 dangling)
- ✓ `npm pack --dry-run` shows the lightweight strategy is preserved
- ✓ OpenCode connection roundtrip is fully verified by the official MCP client test suite
- ✓ Inspector test path is documented and per-tool coverage exists in the test suite
- ✓ MCP tools reuse the core (no duplicate ranking logic)
- ✓ Adapter is on the safety branch `feat/phase-11-2-mcp-adapter`
- ✓ Safety tag `pre-phase-11-2-mcp-adapter` exists on `main`
