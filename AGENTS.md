# Laravel ECC — Agent Instructions

Laravel 13 AI-ready skills, rules, agents, and CLI harness configs for OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, Copilot, and more.

**Version:** 1.0.0-beta.2

## Core Principles

1. **Laravel 13 First** — All patterns target Laravel 13 (PHP 8.3+, Pest 4, attribute-driven models)
2. **Security-First** — Validate all input, escape all output, never trust user data
3. **Test-Driven** — Write tests before implementation, 80%+ coverage required
4. **Immutability** — Always create new objects, never mutate existing ones
5. **Plan Before Execute** — Plan complex features before writing code

## Available Agents

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| laravel-artisan | Artisan command generation | Creating commands, schedules, make:classes |
| laravel-eloquent | Eloquent ORM optimization | Query optimization, relationships, N+1 fixes |
| laravel-migration | Database migration design | Schema design, migrations, seeders, factories |
| laravel-container | Container, DI, provider, facade architecture | Container bindings, providers, contract design, facade review |

## Available Skills

| Skill | Purpose |
|-------|---------|
| laravel-patterns | Laravel 13 architecture: Actions, DTOs, Services, Eloquent, Queues, Caching |
| laravel-tdd | Laravel 13 testing with Pest 4: Feature tests, fakes, architecture tests |
| laravel-security | Laravel 13 security: mass assignment, XSS, CSRF, Gates/Polices, rate limiting |
| laravel-core-internals | Laravel 13 core internals: Service Container, DI, Providers, Facades, Request Lifecycle, Contracts |

## Laravel 13 Key Features

- **Attribute-driven models**: `#[Table]`, `#[Fillable]`, `#[Hidden]`, `#[Casts]`, `#[Connection]`, `#[Tries]`
- **Pest 4 as first-class** test framework (PHP Attribute Output PAO shipped)
- **PHP 8.3+ required**
- **Svelte 5 adapter** for Laravel Echo
- **Horizon Redis Cluster** support
- **Dusk**: `clickOnceVisible`, `clickOnceEnabled`

## Security Guidelines

**Before ANY commit:**
- No hardcoded secrets (APP_KEY, DB password, API keys)
- `#[Fillable]` or `#[Guarded]` set on all models
- SQL injection prevention (use Eloquent, not raw queries)
- XSS prevention (Blade `{{ }}` by default, `{!! !!}` only when sanitized)
- CSRF protection enabled on all state-changing forms
- Authorization via Gates/Polices on all actions
- Rate limiting on all API endpoints
- Error messages don't leak sensitive data

## Testing Requirements

**Minimum coverage: 80%**

Test types:
1. **Feature tests** (80% of tests) — HTTP endpoints, database operations, authentication
2. **Unit tests** (20% of tests) — Services, Actions, DTOs, helpers
3. **Pest architecture tests** — Enforce project conventions

**TDD workflow:**
1. Write test first (RED) — test should FAIL
2. Write minimal implementation (GREEN) — test should PASS
3. Refactor (IMPROVE) — verify coverage 80%+

## Development Workflow

1. **Plan** — Use planner approach, identify dependencies and risks
2. **TDD** — Write Pest tests first, implement, refactor
3. **Review** — Run `php artisan pint --test`, `./vendor/bin/phpstan analyse`
4. **Commit** — Conventional commits format: `feat:`, `fix:`, `refactor:`, `test:`

## Project Structure

```
skills/          — 4 Laravel 13 deep skills
rules/           — Always-follow guidelines (common + php + web + laravel)
agents/          — 4 Laravel-specific agents + ECC agents
commands/        — 4 Laravel commands + ECC commands
hooks/           — Trigger-based automations for Pint, PHPStan, Pest
mcp-configs/     — MCP server configurations
scripts/         — Cross-platform Node.js utilities
update.ps1       — Windows update script (syncs to latest package version)
update.sh        — Unix update script (syncs to latest package version)
```
