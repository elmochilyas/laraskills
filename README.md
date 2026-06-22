# LaraSkills

[![npm version](https://img.shields.io/npm/v/laraskills)](https://www.npmjs.com/package/laraskills)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-%3E%3D8.3-777bb4)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-%3E%3D13-red)](https://laravel.com)

Laravel 13 skills, rules, agents, retrieval tooling, and MCP integration for AI-assisted development.

## How it works

LaraSkills uses a hybrid model:

1. **The npm package** provides the CLI, MCP adapter, and packaged intelligence — ready out of the box.
2. **`laraskills init`** installs project-facing skills, agents, rules, hooks, and MCP configs into your Laravel project.
3. **Tool integrations** connect coding agents like OpenCode to LaraSkills via MCP.

No manual clone required for normal users. Run `laraskills setup --help` only if you need an advanced custom knowledge source.

## Quick start

```bash
npm install -g laraskills
cd my-laravel-project
laraskills init
laraskills doctor
laraskills retrieve "Add a Laravel policy and Pest tests"
```

That's it. Packaged intelligence works out of the box.

## Requirements

- Node.js 18 or newer
- A Laravel project for operating-layer installation

## Install

```bash
npm install -g laraskills
```

Or install as a local project dependency:

```bash
npm install --save-dev laraskills
```

## Initialize a Laravel project

Inside your Laravel project root:

```bash
cd my-laravel-project
laraskills init
```

`laraskills init` is interactive. It guides you through a 3-step wizard:

1. **Choose coding assistants** — OpenCode, Codex, Cursor, Claude Code, Generic MCP (select multiple with comma, or type `all`/`none`)
2. **Choose integration level** — Full (MCP + project files), MCP only, or Project files only
3. **Choose LaraSkills profile** — Core (recommended), Minimal, or Full

By default (pressing Enter through the whole wizard), init selects all assistants with full integration and the core profile.

Multiple assistants can be configured at once. LaraSkills generates the right config or template for each:

| Assistant | Support | What LaraSkills creates |
|---|---|---|
| OpenCode | Full auto-setup | `.opencode/opencode.json` + root `opencode.json` with MCP |
| Generic MCP | Template | `mcp-configs/mcp-servers.json` (copy into any MCP client) |
| Codex | Template | `.codex/instructions.md` + MCP instructions |
| Cursor | Template | `.cursor/rules.mdc` + MCP instructions |
| Claude Code | Template | `.claude/settings.json` + MCP instructions |

### MCP — the shared protocol layer

LaraSkills exposes one MCP server command: `laraskills-mcp`. Each coding assistant connects to it as an MCP client. LaraSkills generates the correct MCP client config for each assistant, or a clear template/manual instruction when automatic wiring is not yet supported.

Or use non-interactive mode for automation:

```bash
laraskills init --assistants all --integration full --profile core --yes
laraskills init --assistants opencode,codex --integration full --profile core --yes
laraskills init --assistants none --integration project-files --profile minimal --yes

# Legacy --tools flag still works:
laraskills init --profile core --tools opencode --yes
```

Profiles:

| Profile | Contents |
|---|---|
| `minimal` | 3 starter skills + rules, hooks, MCP configs, Artisan agent |
| `core` | 6 core skills + rules, hooks, MCP configs, 5 agents (default) |
| `full` | Core profile + commands and harness configs for 12 AI tools |

## Tool integrations

### OpenCode (fully automatic)

When you run `laraskills init --assistants opencode` (the default), the following files are created/merged:

- `.opencode/opencode.json` — Project-wide instructions, sub-agents (planner, code-reviewer, security-reviewer, tdd-guide), and slash commands (plan, tdd, code-review, artisan)
- `opencode.json` — MCP connection to the `laraskills-mcp` server

If an existing `opencode.json` exists in your project, LaraSkills merges safely (preserving your settings). A backup is always created before any changes.

After init, verify with:

```bash
laraskills doctor
```

Look for: `OpenCode: configured`.

## Retrieve context for an AI agent

```bash
laraskills retrieve "Add authorization policy and Pest tests" --mode compact
laraskills retrieve "Optimize Eloquent N+1 query" --mode standard
laraskills get security-identity-engineering/authorization/policies-model --include-content
```

## Update LaraSkills

Updating has two parts:

1. **Update the CLI package:**

```bash
npm install -g laraskills
npm update -g laraskills
```

2. **Refresh project files** (run inside your Laravel project):

```bash
laraskills update
laraskills update --tools opencode --yes
laraskills update --dry-run
```

`npm update` updates the CLI package. `laraskills update` refreshes installed project files and tool integration configs.

## Global install vs local project install

Global install:

```bash
npm install -g laraskills
laraskills init
```

Local project install (team-friendly, pinned in `package.json`):

```bash
npm install --save-dev laraskills
npx laraskills init
```

Both are valid. The global install keeps `laraskills` on your PATH. The local install pins the version in your project's `devDependencies`.

## Essential commands

| Command | Purpose |
|---|---|
| `laraskills init` | Prepare the current Laravel project (interactive, recommended) |
| `laraskills doctor` | Diagnose machine and project readiness |
| `laraskills update` | Refresh installed project files |
| `laraskills retrieve` | Get a task-focused Laravel context bundle |
| `laraskills search` | Search knowledge units |
| `laraskills get` | Show one knowledge unit |
| `laraskills validate` | Validate the intelligence layer |

Use `<command> --help` for detailed usage, options, and examples.

## Advanced commands

| Command | Purpose |
|---|---|
| `laraskills setup` | Point to a custom LaraSkills checkout (advanced override) |
| `laraskills install` | Install files (legacy, use `init` instead) |
| `laraskills add` | Add one component (skill or agent) |
| `laraskills prerequisites` | Show prerequisite knowledge |
| `laraskills related` | Show related knowledge |

## Local MCP server

`laraskills-mcp` is a read-only stdio server over the same deterministic retrieval core:

```bash
npx laraskills-mcp
```

No `--laraskills-root` flag needed — packaged intelligence works automatically.

It exposes five tools:

| Tool | Purpose |
|---|---|
| `retrieve_context_bundle` | Retrieve the smallest useful context bundle for a task |
| `search_ecc` | Search ranked knowledge units |
| `get_knowledge_unit` | Inspect one knowledge unit |
| `get_graph_context` | Load prerequisites and related topics |
| `validate_ecc` | Validate intelligence integrity |

## Building blocks

| Block | Purpose |
|---|---|
| **Profiles** | Select how much of the operating layer is installed |
| **Skills** | Deep, task-oriented Laravel workflows |
| **Rules** | Always-follow engineering and security conventions |
| **Agents** | Specialized role definitions (Eloquent, migrations, APIs, etc.) |
| **Hooks** | Agent lifecycle and quality automations |
| **MCP configs** | Ready-to-adapt server definitions |

## Development verification

Release-readiness checks:

```bash
npm test
npm run benchmark
npm run verify:packed-install
npm run verify:mcp
node scripts/laraskills.mjs validate --format json --laraskills-root .
```

## License

MIT. See [LICENSE](LICENSE).
