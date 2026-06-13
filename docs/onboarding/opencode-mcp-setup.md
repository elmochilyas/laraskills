# OpenCode MCP Setup

## Prerequisites

- LaraSkills npm package installed (`npm install -g laraskills`)
- LaraSkills root configured (`laraskills setup --laraskills-root <path>`)
- OpenCode installed

## Configure MCP Server

Add the following to your OpenCode configuration (`opencode.json` or `~/.config/opencode/opencode.json`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "laraskills": {
      "type": "local",
      "command": [
        "node",
        "<npm-global-path>/node_modules/laraskills/scripts/laraskills-mcp.mjs"
      ],
      "enabled": true,
      "timeout": 10000,
      "environment": {
        "LARASKILLS_ROOT": "/path/to/laraskills"
      }
    }
  }
}
```

Or using the npm-linked binary (if installed globally):

```jsonc
{
  "mcp": {
    "laraskills": {
      "type": "local",
      "command": ["laraskills-mcp"],
      "enabled": true,
      "timeout": 10000,
      "environment": {
        "LARASKILLS_ROOT": "/path/to/laraskills"
      }
    }
  }
}
```

## Verify Connection

```bash
opencode mcp list
```

Expected output:

```
laraskills    connected    [tools: 5]
```

## Available MCP Tools

Exactly five read-only tools are exposed:

| Tool | Purpose |
|------|---------|
| `retrieve_context_bundle` | Smallest useful bundle for a Laravel task |
| `search_ecc` | Ranked KU search |
| `get_knowledge_unit` | Inspect one KU by ID |
| `get_graph_context` | Prerequisites + related topics in one call |
| `validate_ecc` | Validate intelligence layer integrity |

## LARASKILLS_ROOT Configuration

The MCP server resolves the LaraSkills root using the same precedence as the CLI:

1. `--laraskills-root` CLI argument (in the `command` array)
2. `LARASKILLS_ROOT` environment variable (in the `environment` block)
3. Persisted user configuration (`laraskills setup`)
4. Current working directory discovery

If the server starts but tools return errors about missing intelligence files, configure `LARASKILLS_ROOT` in the MCP environment block or run `laraskills setup` first.

## Troubleshooting

If `opencode mcp list` shows `failed`:

1. Test the server directly: `node scripts/laraskills-mcp.mjs`
2. Confirm the script path is correct for your installation
3. Confirm `LARASKILLS_ROOT` points to a valid checkout
4. Set `timeout: 10000` to allow for first-startup catalog loading

See `docs/onboarding/troubleshooting.md` for more details.
