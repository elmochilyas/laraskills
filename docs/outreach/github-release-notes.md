## 1.0.0-beta.19 — 2026-06-22

LaraSkills is a Laravel 13 skills, rules, agents, and knowledge-retrieval system for AI-assisted development.

### What's new in beta.19

**Refined init wizard with multi-assistant support.** The onboarding wizard now cleanly separates three steps — assistant selection, integration level, and profile — and supports configuring multiple coding assistants at once.

- **Multi-assistant selection** — Configure OpenCode, Codex, Cursor, Claude Code, and Generic MCP in one `laraskills init` run. Select with comma (`1,2,3`), by name (`opencode,codex`), `all`, or `none`.
- **New `--assistants` flag** — Preferred CLI flag. `--assistant`, `--tools`, `--tool` kept as backward-compatible aliases.
- **Honest support levels** — OpenCode and Generic MCP are `configured` (full auto-setup). Codex, Cursor, Claude Code get `template` configs with manual MCP instructions. No pretend-full-setup.
- **MCP model clarified** — LaraSkills exposes one MCP server (`laraskills-mcp`). Each assistant connects as an MCP client. Right config or template is generated per assistant.
- **Improved doctor** — Shows per-assistant status with support levels: `configured`, `template generated`, `missing`, `not selected`.
- **State file enhanced** — Records `assistants` and `integration`.
- **229 Node.js tests passing.**

### New onboarding

```powershell
npm install -g laraskills
cd my-laravel-project
laraskills init
```

### Advanced examples

```powershell
laraskills init --assistants all --integration full --profile core --yes
laraskills init --assistants opencode,codex --integration full --profile core --yes
laraskills init --assistants none --integration project-files --profile minimal --yes
```

### Upgrading

```powershell
npm update -g laraskills
cd my-laravel-project
laraskills update
```

### Resources

- [GitHub repository](https://github.com/elmochilyas/laraskills)
- [npm package](https://www.npmjs.com/package/laraskills)
- [Release notes](https://github.com/elmochilyas/laraskills/blob/main/docs/releases/1.0.0-beta.19.md)
- [CHANGELOG](https://github.com/elmochilyas/laraskills/blob/main/CHANGELOG.md)

### Feedback

Open an issue for bugs, feature requests, or beta feedback: https://github.com/elmochilyas/laraskills/issues/new/choose
