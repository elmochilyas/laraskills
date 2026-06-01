# Laravel ECC — Agent Instructions

Laravel 13 AI-ready skills, rules, agents, and CLI harness configs for OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, Copilot, and more.

**Version:** 1.0.0-beta.5

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
| laravel-eloquent | Advanced Eloquent ORM specialist | Relationship mapping, query optimization, N+1 elimination, domain modeling, scopes, casts, events, performance tuning |
| laravel-migration | Database migration design | Schema design, migrations, seeders, factories |
| laravel-database | Database engineering specialist | SQL optimization, indexing, PostgreSQL (JSONB, materialized views, vector search), MySQL (InnoDB, utf8mb4, partitioning, replication), transactions, scaling |
| laravel-container | Container, DI, provider, facade architecture | Container bindings, providers, contract design, facade review |
| laravel-api-rest | REST API architecture specialist | Resource naming, HTTP methods, status codes, HATEOAS, versioning, resource transformation, pagination |
| laravel-api-jsonapi | JSON:API specification specialist | Native JsonApiResource, sparse fieldsets, includes, relationships, compound documents, links, meta objects |
| laravel-api-graphql | GraphQL architecture specialist | Lighthouse schema-first, resolvers, DataLoader, query complexity, subscriptions, Federation |
| laravel-api-grpc | gRPC & Protobuf specialist | Proto definition, RoadRunner gRPC services, interceptors, streaming, client integration |
| laravel-api-microservices | Microservice architecture specialist | Service boundaries, database ownership, event-driven communication, saga patterns |
| laravel-authentication | Authentication & authorization specialist | Sanctum, Passport, OAuth2, OIDC, JWT, Policies, Gates, Roles, Permissions, MFA, SSO |
| laravel-identity-architecture | Enterprise IAM & zero-trust specialist | SCIM, LDAP/AD, Entra ID, Okta, Keycloak, SAML, zero-trust, conditional access |

## Available Skills

| Skill | Purpose |
|-------|---------|
| laravel-patterns | Laravel 13 architecture: Actions, DTOs, Services, Queues, Caching, API Resources |
| laravel-eloquent | Advanced Eloquent: relationships (morph, deep, through), performance (N+1, aggregates), domain modeling (DTOs, VOs), custom builders, scopes, casts, events, event sourcing |
| laravel-tdd | Laravel 13 testing with Pest 4: Feature tests, fakes, architecture tests |
| laravel-security | Laravel 13 security: mass assignment, XSS, CSRF, Gates/Polices, rate limiting |
| laravel-core-internals | Laravel 13 core internals: Service Container, DI, Providers, Facades, Request Lifecycle, Contracts |
| laravel-database | Database engineering: SQL mastery, indexing, PostgreSQL (JSONB, materialized views, vector search), MySQL (InnoDB, utf8mb4, partitioning, replication), scaling, transactions |
| laravel-api-rest | REST API architecture: resource naming, HATEOAS, versioning, resource transformation, pagination (offset/cursor/keyset) |
| laravel-api-jsonapi | JSON:API specification: native JsonApiResource, sparse fieldsets, includes, compound documents, relationships, links, meta, error handling |
| laravel-api-graphql | GraphQL with Lighthouse: schema-first design, directives, DataLoader, query complexity, subscriptions, Federation |
| laravel-api-grpc | gRPC & Protocol Buffers: proto definition, RoadRunner services, interceptors, streaming, client integration for microservices |
| laravel-api-microservices | Internal microservice architecture: service boundaries, database ownership, event-driven communication, saga patterns, health checks |
| laravel-authentication | Authentication & authorization: Sanctum, Passport, OAuth2, OIDC, JWT, Policies, Gates, Roles, Permissions, Multi-tenant, SSO, Enterprise IAM, Zero-trust |

## Laravel 13 Key Features

- **Attribute-driven models**: `#[Table]`, `#[Fillable]`, `#[Hidden]`, `#[Casts]`, `#[Connection]`, `#[ScopedBy]`, `#[ObservedBy]`
- **Universal PHP 8 attributes**: Model config, queue jobs (`#[Tries]`, `#[Timeout]`, `#[Backoff]`), console commands (`#[AsCommand]`, `#[Signature]`, `#[Description]`)
- **Advanced Eloquent**: Polymorphic relationships, HasOneThrough/HasManyThrough, custom builders, global/local scopes, query macros, custom/encrypted/enum casts
- **Rich domain models**: DTOs, Value Objects, domain events, event sourcing patterns
- **Pest 4 as first-class** test framework (PHP Attribute Output PAO shipped)
- **PHP 8.3+ required**
- **Svelte 5 adapter** for Laravel Echo
- **Horizon Redis Cluster** support
- **Pest 4 browser testing**: First-party Playwright integration for browser tests
- **Native vector search**: `whereVectorSimilarTo()` with PostgreSQL + pgvector + `laravel/ai` SDK
- **MySQL & PostgreSQL balanced**: MySQL (InnoDB, utf8mb4, JSON, partitioning, replication), PostgreSQL (JSONB, materialized views, GIN/GiST/BRIN indexes, vector search), full-text search via `whereFullText` on both

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
skills/          — 6 Laravel 13 deep skills
rules/           — Always-follow guidelines (common + php + web + laravel)
agents/          — 5 Laravel-specific agents (+ 4 MCP agents in mcp-configs)
commands/        — 4 Laravel commands + ECC commands
hooks/           — Trigger-based automations for Pint, PHPStan, Pest
mcp-configs/     — MCP server configurations
scripts/         — Cross-platform Node.js utilities
update.ps1       — Windows update script (syncs to latest package version)
update.sh        — Unix update script (syncs to latest package version)
```
