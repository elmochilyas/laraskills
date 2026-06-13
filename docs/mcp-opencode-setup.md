# OpenCode MCP Setup for LaraSkills

## Quick start

The LaraSkills MCP server is a **local stdio** server. OpenCode spawns it as a child process; no HTTP, no remote endpoint, no auth.

Two ready-to-use configuration snippets are checked in under `examples/`:

- `examples/opencode-mcp.local.jsonc` — direct path invocation (works without `npm link`).
- `examples/opencode-mcp.linked.jsonc` — npm-linked binary invocation.

Both include `timeout: 10000` (ms) — larger than OpenCode's default 5000 ms to give the first-startup catalog load a reliable margin on Windows.

## Option A — Direct path (no install required)

Copy the contents of `examples/opencode-mcp.local.jsonc` into your project's `opencode.json` (or `~/.config/opencode/opencode.json`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "laraskills": {
      "type": "local",
      "command": [
        "node",
        "C:\\path\\to\\laraskills\\scripts\\laraskills-mcp.mjs"
      ],
      "enabled": true,
      "timeout": 10000,
      "environment": {
        "LARASKILLS_ROOT": "C:\\path\\to\\laraskills"
      }
    }
  }
}
```

Adjust the absolute paths to match your checkout. The server will not start before OpenCode spawns it, so the path only needs to be valid on the host where OpenCode runs.

## Option B — npm link (no absolute paths)

```powershell
# In the laraskills checkout
npm link

# Verify the binaries are on PATH
laraskills --version
laraskills-mcp --version
```

Then in `opencode.json`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "laraskills": {
      "type": "local",
      "command": [
        "laraskills-mcp"
      ],
      "enabled": true,
      "timeout": 10000,
      "environment": {
        "LARASKILLS_ROOT": "C:\\path\\to\\laraskills"
      }
    }
  }
}
```

## OpenCode commands

```powershell
opencode mcp add
opencode mcp list
opencode mcp remove laraskills
```

`opencode mcp list` should show:

```
laraskills    connected    [tools: 5]
```

If the server shows as `failed`, see `docs/mcp-troubleshooting.md`.

## Smoke test (end-to-end)

After OpenCode is configured, send a prompt to your primary agent:

```
Use the laraskills MCP server to retrieve context for:
Build a CRUD REST API for products with policies and pagination.
```

OpenCode should automatically:

1. Discover the `laraskills` MCP server.
2. Call `retrieve_context_bundle` (mode = `standard` by default).
3. Optionally follow up with `get_knowledge_unit` on the top-ranked KUs.
4. Optionally call `get_graph_context` for the most relevant KU.
5. Optionally call `validate_ecc` to confirm graph integrity if the user asks.

You should never need to type `npx laraskills retrieve ...` manually. If your agent does, the MCP server is not connected — see troubleshooting.

## Permission

If you set `permission.mcp_*` to `"ask"` (as in the default `laraskills/.opencode/opencode.json`), OpenCode will prompt for approval on the first MCP call per session. Approve once per session.

To allow the laraskills MCP server without prompts:

```jsonc
{
  "permission": {
    "mcp_*": "allow"
  }
}
```

## Where the snippet lives

The official `laraskills` repository ships the snippets in `examples/`. They are **not** included in the npm package (the package is for skills/rules/agents/MCP server code, not example configs).
