# LaraSkills

[![npm version](https://img.shields.io/npm/v/laraskills)](https://www.npmjs.com/package/laraskills)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![PHP](https://img.shields.io/badge/PHP-%3E%3D8.3-777bb4)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-%3E%3D13-red)](https://laravel.com)

Laravel 13 skills, rules, agents, retrieval tooling, and MCP integration for AI-assisted development.

LaraSkills gives coding agents two complementary layers:

- An **operating layer** with reusable skills, rules, agents, hooks, commands, and harness configurations.
- A **knowledge intelligence layer** with 2,321 Laravel engineering knowledge units, deterministic retrieval, decision support, anti-patterns, and validation checklists.

The project targets Laravel 13, PHP 8.3+, and Pest 4. It supports OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, GitHub Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, and Kiro.

## Why LaraSkills?

AI coding agents are powerful, but without Laravel-specific guardrails they generate generic, insecure, or outdated code. LaraSkills solves this with two layers:

1. **Operating layer** — Drop-in skills, rules, agents, and hooks that train your AI tool on Laravel 13 conventions, security best practices, and architecture patterns. Install it in any Laravel project with one command.
2. **Knowledge intelligence layer** — 2,321 curated knowledge units across 21 engineering domains. When an agent needs to "design a multi-tenant API" or "optimize an Eloquent N+1," it retrieves expert-level guidance with rules, decision trees, anti-patterns, and checklists — not generic web results.

The result: AI that writes Laravel code that looks like it was written by an experienced Laravel engineer.

> **Beta status:** `1.0.0-beta.16` — the package is in active development. Core functionality is stable and validated in real Laravel projects (see [validation evidence](#validation-evidence)).

## Requirements

- Node.js 18 or newer
- A Laravel project for operating-layer installation
- A full LaraSkills Git checkout for retrieval and the local MCP server

The npm package stays lightweight and does not bundle the large `knowledge/` or `intelligence/` trees.

## Installation

### 1. Install the npm package

Install LaraSkills as a development dependency in your Laravel project:

```bash
npm install --save-dev laraskills
```

> During the beta period, you may also use `npm install --save-dev laraskills@beta` to explicitly request the latest pre-release build.

### 2. Install the operating layer

Run the installer from the Laravel project root:

```bash
npx laraskills install --profile core
```

The installer writes LaraSkills-owned content such as `skills/`, `rules/`, `agents/`, `hooks/`, and `mcp-configs/`, then records the selected profile in `.laraskills-state.json`.

### 3. Configure retrieval

Clone the full repository once, then point the installed CLI at it:

```bash
git clone https://github.com/elmochilyas/laraskills.git ../laraskills-source
npx laraskills setup --laraskills-root ../laraskills-source
npx laraskills doctor
```

You can use `LARASKILLS_ROOT` instead of persisted setup:

```bash
export LARASKILLS_ROOT=/path/to/laraskills
```

PowerShell:

```powershell
$env:LARASKILLS_ROOT = 'C:\path\to\laraskills'
```

Preferred root sources are `--laraskills-root`, `LARASKILLS_ROOT`, saved user configuration, and current-directory walk-up. Legacy ECC inputs remain temporary fallbacks.

### Installation profiles

| Profile | Contents |
|---|---|
| `minimal` | Three starter skills plus shared rules, hooks, MCP configs, and the Artisan agent |
| `core` | Six core skills plus shared rules, hooks, MCP configs, and five agents; this is the default |
| `full` | Core profile plus LaraSkills commands and bundled AI-tool harness configurations |

Use `npx laraskills install --help` to inspect the current profile summary.

### Skills-only alternative

To install skills through the Vercel Skills CLI instead of the LaraSkills project installer:

```bash
npx skills add elmochilyas/laraskills
```

## Quickstart

From a Laravel project:

```bash
# Install the package and operating layer
npm install --save-dev laraskills
npx laraskills install --profile core

# Configure the full knowledge checkout
git clone https://github.com/elmochilyas/laraskills.git ../laraskills-source
npx laraskills setup --laraskills-root ../laraskills-source

# Confirm the installation and intelligence graph
npx laraskills doctor
npx laraskills validate

# Retrieve focused guidance for a real task
npx laraskills retrieve \
  "Build a Laravel 13 products API with Form Requests, policies, API Resources, pagination, and Pest tests" \
  --mode compact
```

Use the returned canonical knowledge-unit IDs with `get --include-content` when deeper guidance is needed.

## Core commands

All commands support the local binary through `npx laraskills`. Run `npx laraskills <command> --help` for command-specific usage.

### `install`

Install LaraSkills operating-layer files into the current project:

```bash
npx laraskills install
npx laraskills install --profile minimal
npx laraskills install --profile full
```

### `doctor`

Diagnose root resolution, intelligence files, retrieval readiness, and the MCP adapter:

```bash
npx laraskills doctor
npx laraskills doctor --laraskills-root /path/to/laraskills
```

A release-ready setup reports `Status: HEALTHY`.

### `validate`

Validate knowledge-unit records, graph edges, aliases, relationships, and structural integrity:

```bash
npx laraskills validate
npx laraskills validate --format json
```

### `retrieve`

Build a deterministic context bundle for a Laravel task:

```bash
npx laraskills retrieve "Optimize an Eloquent N+1 query" --mode compact
npx laraskills retrieve "Design a multi-tenant REST API" --mode standard --format json
```

Modes are `compact`, `standard` (default), and `deep`.

### `search`

Find ranked knowledge units and their canonical IDs:

```bash
npx laraskills search "Sanctum tenant authentication"
npx laraskills search "composite indexes" --domain data-storage-systems --limit 10
```

### `get --include-content`

Inspect one canonical knowledge unit. Add `--include-content` to include its full standardized knowledge document:

```bash
npx laraskills get \
  security-identity-engineering/authorization/policies-model \
  --include-content
```

JSON output is available with `--format json`.

## Building blocks

| Building block | Purpose |
|---|---|
| **Profiles** | Select how much of the operating layer is installed in a project |
| **Skills** | Deep, task-oriented Laravel workflows and implementation guidance |
| **Rules** | Always-follow engineering, security, testing, PHP, web, and Laravel conventions |
| **Agents** | Specialized role definitions for areas such as Eloquent, migrations, databases, APIs, and identity |
| **Hooks** | Agent lifecycle and quality automations that warn, validate, or block unsafe operations |
| **MCP configs** | Ready-to-adapt server definitions for Laravel documentation and dependency security tooling |

The repository also includes seven reusable command references and harness configurations for twelve AI coding tools.

## Knowledge and retrieval

The knowledge layer spans 21 engineering domains and includes:

| Metric | Count |
|---|---:|
| Knowledge units | 2,321 |
| Knowledge artifacts per unit | 6 |
| Dependency edges | 427 |
| Relationship edges | 3,513 |
| Machine-readable JSON files | 10 |
| Cross-repository Markdown indexes | 7 |

Each knowledge unit can provide standardized knowledge, rules, skills, decision trees, anti-patterns, and a validation checklist.

Start with:

- [`agent/domain-routing-index.md`](agent/domain-routing-index.md)
- [`agent/task-to-skill-map.md`](agent/task-to-skill-map.md)
- [`agent/retrieval-guide.md`](agent/retrieval-guide.md)
- [`docs/retrieval-cli-guide.md`](docs/retrieval-cli-guide.md)

## Known limitations

- **Full checkout required for retrieval** — The npm package stays lightweight by excluding the `knowledge/` and `intelligence/` directories. To use `retrieve`, `search`, `get`, or the MCP server, you need a separate Git checkout of the repository and must configure it with `npx laraskills setup --laraskills-root <path>` or the `LARASKILLS_ROOT` environment variable.
- **Coverage requires PCOV or Xdebug** — `php artisan test --coverage` does not work without a code coverage driver. LaraSkills projects that need coverage reporting must have PCOV or Xdebug installed in their PHP environment.

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

See [`docs/mcp-server-guide.md`](docs/mcp-server-guide.md) and [`docs/mcp-tool-reference.md`](docs/mcp-tool-reference.md).

## Validation evidence

Phase 17 validated the packed beta in real Laravel 13 applications:

- **Fresh Laravel project:** package install, setup, doctor, graph validation, retrieval, and a complete policy-protected CRUD API workflow passed. The generated application finished with 11 Pest tests and 168 assertions. See the [fresh-project report](docs/integration-tests/phase-17/fresh-laravel-project/report.md).
- **Existing Laravel project:** LaraSkills was added to a non-empty Breeze/Pest application without overwriting existing application files. The baseline had 29 tests and 73 assertions; the final application had 32 tests and 82 assertions, with policy-authorized note archiving and no regressions. See the [existing-project report](docs/integration-tests/phase-17/existing-laravel-project/report.md).
- **Release gates:** the corrected artifact passed the LaraSkills test suite, all 72 retrieval benchmarks, packed-install verification, MCP smoke verification, and intelligence validation.

The existing-project coverage command could not run because that PHP environment had neither Xdebug nor PCOV; behavioral tests and the remaining release gates passed.

## Package contents

The npm package includes the operating layer, CLI, MCP adapter, runtime modules, install/update scripts, and AI-tool harness configurations. The full knowledge intelligence layer remains in the GitHub repository to keep npm installation fast.

Use the npm package for project installation and the Git checkout as the retrieval root.

## Development verification

Release-readiness checks:

```bash
npm test
npm run benchmark
npm run verify:packed-install
npm run verify:mcp
node scripts/laraskills.mjs validate --format json --laraskills-root .
```

CI runs the core suite across Windows, Ubuntu, and macOS on supported Node versions.

## Release notes

See the [CHANGELOG](CHANGELOG.md) for a full history of changes. Notable releases:

- [1.0.0-beta.16](docs/releases/1.0.0-beta.16.md) — Latest beta release with real Laravel 13 project validation, bug fixes, and MCP workflow verification.

## Feedback and issues

Found a bug, have a feature request, or want to contribute? Open an issue on the [GitHub repository](https://github.com/elmochilyas/laraskills/issues). We track open work, planned features, and community contributions there.

**Beta testers:** See the [beta testing guide](docs/feedback/beta-testing-guide.md) for instructions on testing LaraSkills in your Laravel project and reporting your experience. The [tester checklist](docs/feedback/tester-checklist.md) provides a structured walkthrough.

## Migration from Laravel ECC

Laravel ECC was renamed to LaraSkills. Use the `laraskills` package, `laraskills` CLI, `laraskills-mcp` server, and `LARASKILLS_ROOT`.

Temporary `laravel-ecc`, `laravel-ecc-mcp`, `--ecc-root`, and `ECC_ROOT` compatibility aliases remain available. See the [migration guide](docs/migrations/laravel-ecc-to-laraskills.md).

## License

MIT. LaraSkills builds on [ECC](https://github.com/affaan-m/ECC) by Affaan Mustafa. See [LICENSE](LICENSE).
