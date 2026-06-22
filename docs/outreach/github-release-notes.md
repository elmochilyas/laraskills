## 1.0.0-beta.18 — 2026-06-22

LaraSkills is a Laravel 13 skills, rules, agents, and knowledge-retrieval system for AI-assisted development.

### What's new in beta.18

**Zero-friction onboarding.** Normal users no longer need to clone the LaraSkills repository. Packaged intelligence is now bundled inside the npm package, and all retrieval commands work out of the box.

- **No manual clone required** — `doctor`, `validate`, `retrieve`, `search`, `get --include-content`, and MCP work from packaged intelligence without `LARASKILLS_ROOT`, `laraskills setup`, or a Git clone.
- **`get --include-content` returns real content** — All 2,321 knowledge units' standardized Markdown content is shipped as `intelligence/content/content-index.json`.
- **Interactive `laraskills init`** — Detects Laravel projects, guides through profile and tool selection, installs project files, and configures coding tools.
- **Non-interactive init for CI/CD** — `--profile`, `--tools`, `--yes`, `--dry-run`.
- **OpenCode integration** — `init --tools opencode` creates/merges `.opencode/opencode.json` and root `opencode.json` with MCP connection, sub-agents, and slash commands.
- **Tool integration framework** — Pluggable adapters for OpenCode, Generic MCP, Codex, Claude Code, and Cursor.
- **Improved `doctor`** — Reports machine readiness (packaged/configured source) and project readiness (initialized, profile, tool integrations).
- **`laraskills setup` is now optional** — Normal users don't need it.
- **229 Node.js tests passing** (up from 213).

### New onboarding

```powershell
npm install -g laraskills
cd my-laravel-project
laraskills init
laraskills doctor
laraskills retrieve "Add a Laravel policy and Pest tests"
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
- [Release notes](https://github.com/elmochilyas/laraskills/blob/main/docs/releases/1.0.0-beta.18.md)
- [CHANGELOG](https://github.com/elmochilyas/laraskills/blob/main/CHANGELOG.md)

### Feedback

Open an issue for bugs, feature requests, or beta feedback: https://github.com/elmochilyas/laraskills/issues/new/choose
