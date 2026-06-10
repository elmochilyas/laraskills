# OpenCode MCP Setup

## Prerequisites

- Laravel ECC npm package installed (`npm install -g laravel-ecc`)
- ECC root configured (`laravel-ecc setup --ecc-root <path>`)
- OpenCode installed

## Configure MCP Server

Add the following to your OpenCode configuration (`opencode.json` or `~/.config/opencode/opencode.json`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "laravel-ecc": {
      "type": "local",
      "command": [
        "node",
        "<npm-global-path>/node_modules/laravel-ecc/scripts/laravel-ecc-mcp.mjs"
      ],
      "enabled": true,
      "timeout": 10000,
      "environment": {
        "ECC_ROOT": "/path/to/laravel-ecc"
      }
    }
  }
}
```

Or using the npm-linked binary (if installed globally):

```jsonc
{
  "mcp": {
    "laravel-ecc": {
      "type": "local",
      "command": ["laravel-ecc-mcp"],
      "enabled": true,
      "timeout": 10000,
      "environment": {
        "ECC_ROOT": "/path/to/laravel-ecc"
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
laravel-ecc    connected    [tools: 5]
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

## ECC_ROOT Configuration

The MCP server resolves the ECC root using the same precedence as the CLI:

1. `--ecc-root` CLI argument (in the `command` array)
2. `ECC_ROOT` environment variable (in the `environment` block)
3. Persisted user configuration (`laravel-ecc setup`)
4. Current working directory discovery

If the server starts but tools return errors about missing intelligence files, configure `ECC_ROOT` in the MCP environment block or run `laravel-ecc setup` first.

## Troubleshooting

If `opencode mcp list` shows `failed`:

1. Test the server directly: `node scripts/laravel-ecc-mcp.mjs`
2. Confirm the script path is correct for your installation
3. Confirm `ECC_ROOT` points to a valid checkout
4. Set `timeout: 10000` to allow for first-startup catalog loading

See `docs/onboarding/troubleshooting.md` for more details.
