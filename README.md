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

`laraskills init` is interactive. It will:
1. Detect whether the current directory is a Laravel project
2. Ask which profile to install (core / minimal / full)
3. Ask which coding tools to configure (OpenCode, MCP, Codex, Claude Code, Cursor)
4. Install project files and configure selected tools
5. Print next steps

Or use non-interactive mode for automation:

```bash
laraskills init --profile core --tools opencode --yes
laraskills init --profile core --tools opencode,generic-mcp --yes
laraskills init --profile minimal --tools none --yes
```

Profiles:

| Profile | Contents |
|---|---|
| `minimal` | 3 starter skills + rules, hooks, MCP configs, Artisan agent |
| `core` | 6 core skills + rules, hooks, MCP configs, 5 agents (default) |
| `full` | Core profile + commands and harness configs for 12 AI tools |

## OpenCode integration

When you run `laraskills init --tools opencode`, the following files are created/merged:

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
