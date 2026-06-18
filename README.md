# LaraSkills

[![npm version](https://img.shields.io/npm/v/laraskills)](https://www.npmjs.com/package/laraskills)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-%3E%3D8.3-777bb4)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-%3E%3D13-red)](https://laravel.com)

Laravel 13 skills, rules, agents, retrieval tooling, and MCP integration for AI-assisted development.

LaraSkills has three parts:

1. **The npm CLI package** — provides the `laraskills` CLI and `laraskills-mcp` MCP adapter.
2. **The full LaraSkills checkout** — the knowledge source used by retrieve, search, get, validate, and MCP.
3. **Project files** — installed into each Laravel app with `laraskills init` to teach AI agents Laravel 13 conventions.

## Requirements

- Node.js 18 or newer
- A Laravel project for operating-layer installation
- A full LaraSkills Git checkout for retrieval and the local MCP server

The npm package stays lightweight and does not bundle the large `knowledge/` or `intelligence/` trees.

## Install

```bash
npm install -g laraskills
```

Or install as a local project dependency:

```bash
npm install --save-dev laraskills
```

## One-time setup

Clone the full LaraSkills repository once, then point the CLI at it:

```bash
git clone https://github.com/elmochilyas/laraskills.git ../laraskills-source
laraskills setup --laraskills-root "C:\path\to\laraskills-source"
laraskills doctor
```

Use `laraskills doctor` to confirm the configuration is healthy.

You can also set the `LARASKILLS_ROOT` environment variable instead of running `setup`:

```powershell
$env:LARASKILLS_ROOT = 'C:\path\to\laraskills'
```

## Initialize a Laravel project

Inside your Laravel project root:

```bash
cd my-laravel-project
laraskills init
```

Or with `npx` for a local install:

```bash
npx laraskills init
```

This installs skills, agents, rules, hooks, MCP configs, and a `.laraskills-state.json` file into your project.

Profiles control how much is installed:

| Profile | Contents |
|---|---|
| `minimal` | 3 starter skills + rules, hooks, MCP configs, Artisan agent |
| `core` | 6 core skills + rules, hooks, MCP configs, 5 agents (default) |
| `full` | Core profile + commands and harness configs for 12 AI tools |

```bash
laraskills init --profile minimal
laraskills init --profile core
laraskills init --profile full
```

## Retrieve context for an AI agent

With the setup complete, retrieve focused Laravel guidance:

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
```

This updates the skills, agents, rules, hooks, MCP configs, and state file to match the new CLI version.

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
| `laraskills init` | Prepare the current Laravel project (recommended) |
| `laraskills setup` | Connect the CLI to the full LaraSkills checkout |
| `laraskills doctor` | Diagnose configuration and readiness |
| `laraskills update` | Refresh installed project files |
| `laraskills retrieve` | Get a task-focused Laravel context bundle |
| `laraskills search` | Search knowledge units |
| `laraskills get` | Show one knowledge unit |
| `laraskills validate` | Validate the intelligence layer |

Use `<command> --help` for detailed usage, options, and examples.

## Advanced commands

| Command | Purpose |
|---|---|
| `laraskills install` | Install files (legacy, use `init` instead) |
| `laraskills add` | Add one component (skill or agent) |
| `laraskills prerequisites` | Show prerequisite knowledge |
| `laraskills related` | Show related knowledge |

## Local MCP server

`laraskills-mcp` is a read-only stdio server over the same deterministic retrieval core:

```bash
npx laraskills-mcp --laraskills-root /path/to/laraskills
```

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

## Validation evidence

Phase 17 validated the packed beta in real Laravel 13 applications. See the [validation evidence](#validation-evidence) section in the repository for detailed reports.

## Development verification

Release-readiness checks:

```bash
npm test
npm run benchmark
npm run verify:packed-install
npm run verify:mcp
node scripts/laraskills.mjs validate --format json --laraskills-root .
```

## Known limitations

- **Full checkout required for retrieval** — The npm package stays lightweight by excluding the `knowledge/` and `intelligence/` directories. To use `retrieve`, `search`, `get`, or the MCP server, you need a separate Git checkout of the repository configured via `laraskills setup --laraskills-root <path>` or the `LARASKILLS_ROOT` environment variable.
- **Coverage requires PCOV or Xdebug** — `php artisan test --coverage` does not work without a code coverage driver.

## License

MIT. See [LICENSE](LICENSE).
