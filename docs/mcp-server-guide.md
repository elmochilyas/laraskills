# LaraSkills MCP Server Guide

## What it is

A **local stdio MCP server** that exposes the existing deterministic LaraSkills retrieval core (`src/retrieval/index.mjs`) to MCP-capable coding agents (OpenCode, Claude Code, Cursor, etc.).

It is a **thin adapter** — it does not re-implement retrieval, ranking, or graph expansion. It only:

1. Receives JSON-RPC requests over stdio.
2. Validates them with Zod input schemas.
3. Calls the existing core functions.
4. Validates the result with a Zod output schema.
5. Returns the result as an MCP `content` + `structuredContent` response.

## Architecture

```
┌─────────────────────────┐
│  OpenCode / MCP Client  │
│  (Claude Code, Cursor,  │
│   Gemini CLI, Codex)    │
└────────────┬────────────┘
             │ stdio JSON-RPC
             ▼
┌─────────────────────────┐
│ scripts/laraskills-mcp │
│  - McpServer            │
│  - StdioServerTransport │
│  - 5 read-only tools    │
│  - Zod input + output   │
└────────────┬────────────┘
             │ direct function calls
             ▼
┌─────────────────────────┐
│ src/retrieval/index.mjs │
│  retrieveContext        │
│  searchKnowledge        │
│  getKnowledgeUnit       │
│  getPrerequisites       │
│  getRelatedTopics       │
│  validateIntelligence   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ intelligence/json/*.json│
│ (resolved via LARASKILLS_ROOT) │
└─────────────────────────┘
```

## Lightweight npm strategy

The npm package remains lightweight:

| Included | Excluded |
|----------|----------|
| `skills/`, `rules/`, `agents/`, `commands/`, `hooks/`, `mcp-configs/` | `knowledge/` (2,321 KUs × 6 files) |
| 12 harness config directories | `intelligence/` (JSON + indexes) |
| `src/` (existing retrieval core) | `agent/`, `meta/`, `tools/`, `docs/`, `tests/` |
| `scripts/laraskills.mjs` (CLI) | |
| `scripts/laraskills-mcp.mjs` (NEW — MCP entry) | |
| `scripts/mcp/schemas.mjs` (NEW — shared Zod schemas) | |
| `scripts/mcp/handlers.mjs` (NEW — tool handlers) | |

The MCP server depends on the same `intelligence/json/` files the CLI uses, resolved externally through `LARASKILLS_ROOT` or `--laraskills-root`. It does **not** bundle any knowledge files.

## External `LARASKILLS_ROOT`

Resolution order (delegated to `findEccRoot` in `src/retrieval/catalog-loader.mjs`):

1. `--laraskills-root <path>` CLI flag
2. `LARASKILLS_ROOT` environment variable
3. Current working directory
4. Parent-directory discovery (walks up the tree)
5. Package-relative fallback

If resolution fails, the server still starts, logs one actionable diagnostic to **stderr**, and returns `isError: true` from every tool call. Agents see the error inline instead of being unable to connect.

## Tool surface (5 tools, read-only)

| Tool | Purpose | Core function |
|------|---------|---------------|
| `retrieve_context_bundle` | Smallest useful bundle for a Laravel task | `retrieveContext` |
| `search_ecc` | Ranked KU search | `searchKnowledge` |
| `get_knowledge_unit` | Inspect one KU by ID | `getKnowledgeUnit` |
| `get_graph_context` | Prerequisites + related topics in one call | `getPrerequisites` + `getRelatedTopics` |
| `validate_ecc` | Validate intelligence layer integrity | `validateIntelligence` |

All tools carry the MCP annotation `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`.

## stdio rule

```
stdout = MCP protocol messages ONLY
stderr = logs and diagnostics ONLY
```

The server never writes debug logs, startup banners, or any non-protocol data to stdout. Verified by the `MCP Server — stdio cleanliness` test.

## Shutdown

`SIGINT` and `SIGTERM` are handled: the server calls `server.close()` and exits with code 0 (or `null` if killed by the signal). Verified by the `MCP Server — Shutdown handling` test.

## Running the server

### Direct invocation

```powershell
node scripts/laraskills-mcp.mjs
# or with an explicit root
node scripts/laraskills-mcp.mjs --laraskills-root C:\path\to\laraskills
```

### Via the npm binary

After `npm link` or global install:

```bash
laraskills-mcp
# or
laraskills-mcp --laraskills-root /path/to/laraskills
```

### Via npm script

```bash
npm run mcp:start
```

## MCP Inspector validation

The Inspector is the official interactive tool for testing an MCP server.

```powershell
# 1. Inside the laraskills repo (auto-discovers intelligence)
npx @modelcontextprotocol/inspector node .\scripts\laraskills-mcp.mjs

# 2. With an explicit LaraSkills root
$env:LARASKILLS_ROOT="C:\path\to\laraskills"
npx @modelcontextprotocol/inspector node .\scripts\laraskills-mcp.mjs

# 3. With an explicit --laraskills-root flag
npx @modelcontextprotocol/inspector node .\scripts\laraskills-mcp.mjs --laraskills-root C:\path\to\laraskills
```

Inside the Inspector UI:

1. Confirm "Connected" status.
2. Open the **Tools** tab — all 5 tools should be listed.
3. Click each tool, fill in its input schema, and call it.
4. Verify that each call returns:
   - a human-readable `text` content;
   - a `structuredContent` payload that matches the tool's `outputSchema`;
   - bounded size (no full repository dumps).
5. Test the error path: call `get_knowledge_unit` with a bogus ID and confirm the `isError: true` response.
6. Test the missing-root path: call the server with `--laraskills-root` pointing at a non-existent directory and confirm every tool returns the actionable `LaraSkills intelligence files were not found` error.

## CLI fallback

If MCP integration is unavailable, the existing CLI provides identical semantics:

```bash
npx laraskills retrieve "Build a CRUD REST API for products with policies and pagination" --mode compact
npx laraskills search "Sanctum" --limit 5
npx laraskills get security-identity-engineering/authentication/passport-vs-sanctum
npx laraskills prerequisites data-storage-systems/indexes/b-tree-index-structure --depth 1
npx laraskills related data-storage-systems/indexes/b-tree-index-structure --limit 10
npx laraskills validate
```

See `docs/retrieval-cli-guide.md` for the full CLI reference.
