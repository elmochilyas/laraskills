## 1.0.0-beta.20 — 2026-06-22

LaraSkills is a Laravel 13 skills, rules, agents, and knowledge-retrieval system for AI-assisted development.

### What's new in beta.20

**Automatic MCP configuration for all assistants.** `laraskills init` now writes the correct MCP client config for OpenCode, Claude Code, Cursor, Codex, and Generic MCP. One `laraskills-mcp` server, auto-configured for every tool.

- **All assistants auto-configured** — OpenCode, Claude Code, Cursor, Codex, and Generic MCP each get their native MCP config format written automatically.
- **Safe merge** — Existing MCP servers are preserved. Only the `laraskills` entry is added/updated. Backups are created before modifying configs.
- **Idempotent init** — Running `laraskills init` on an already-configured project skips unchanged files.
- **`--dry-run` safe** — Preview everything without writing files.
- **229 Node.js tests passing.**

### Supported config formats

| Assistant | Config file |
|---|---|
| OpenCode | `.opencode/opencode.json` + `opencode.json` |
| Claude Code | `.mcp.json` |
| Cursor | `.cursor/mcp.json` |
| Codex | `.codex/config.toml` |
| Generic MCP | `mcp-configs/laraskills-mcp.json` |

### New onboarding

```powershell
npm install -g laraskills
cd my-laravel-project
laraskills init --assistants all --integration full --profile core --yes
```

### Upgrading

```powershell
npm update -g laraskills
cd my-laravel-project
laraskills update --assistants all --yes
```

### Resources

- [GitHub repository](https://github.com/elmochilyas/laraskills)
- [npm package](https://www.npmjs.com/package/laraskills)
- [Release notes](https://github.com/elmochilyas/laraskills/blob/main/docs/releases/1.0.0-beta.20.md)
- [CHANGELOG](https://github.com/elmochilyas/laraskills/blob/main/CHANGELOG.md)

### Feedback

Open an issue for bugs, feature requests, or beta feedback: https://github.com/elmochilyas/laraskills/issues/new/choose
