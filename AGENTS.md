# Laravel ECC — Agent Instructions

Laravel 13 AI-ready skills, rules, agents, and CLI harness configs for OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, Copilot, and more.

**Version:** 1.0.0-beta.11

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

## Repository Purpose

This repository contains two layers:

1. **Curated Operating Layer** — Teaches AI coding agents how to behave and operate inside Laravel projects (skills, rules, agents, commands, hooks, harness configs).
2. **Knowledge Intelligence Layer** — Deep Laravel engineering knowledge with navigation, machine-readable indexes, decision support, anti-pattern detection, and validation guidance (knowledge units, intelligence JSON, agent routing maps).

AI agents should use both layers: the operating layer for behavioral instructions and the knowledge layer for domain-specific engineering depth.

## Repository Architecture

```
agents/          — 12 Laravel-specific agent definitions
skills/          — 12 deep Laravel 13 skills
rules/           — 41 always-follow guidelines (common + php + web + laravel)
commands/        — 7 Laravel/ECC console command references
hooks/           — Git/agent hook automations
mcp-configs/     — MCP server configurations
knowledge/       — 21 engineering domains, 2,321 knowledge units
intelligence/    — 10 JSON files, 7 markdown indexes, dependency graph
agent/           — 5 navigation files: routing maps, retrieval guides, domain indexes
tools/           — Rebuild and generation scripts for the knowledge layer
docs/            — Architecture decisions, coverage baselines, repair reports
scripts/         — Cross-platform Node.js utilities
update.ps1       — Windows update script (syncs to latest package version)
update.sh        — Unix update script (syncs to latest package version)
```

---

## ECC Knowledge Architecture

The ECC repository now includes a complete generated knowledge base spanning 21 domains of Laravel engineering.

### Knowledge Layer Structure

- `knowledge/{domain}/{subdomain}/{ku}/` — Generated knowledge units with 6 phase files each:
  - `04-standardized-knowledge.md` — Core knowledge content
  - `05-rules.md` — Domain-specific rules
  - `06-skills.md` — Domain-specific skills
  - `07-decision-trees.md` — Decision frameworks
  - `08-anti-patterns.md` — Common mistakes
  - `09-checklists.md` — Validation checklists

### Intelligence Layer

- `intelligence/indexes/` — 7 cross-repository indexes (checklist-index, rule-index, skill-index, decision-tree-index, dependency-index, knowledge-unit-index, anti-pattern-index)
- `intelligence/registry/` — knowledge-registry.md
- `intelligence/json/` — Machine-readable JSON intelligence (10 files)

### Agent Navigation Layer

- `agent/agent-routing-map.md` — Task-to-domain routing
- `agent/domain-selection-guide.md` — Problem-to-domain matching
- `agent/retrieval-guide.md` — Optimal retrieval workflow
- `agent/task-to-skill-map.md` — Task-to-skill mapping
- `agent/domain-routing-index.md` — Flat domain index

### Discovery Artifacts

- `meta/domain-discovery/` — Phase 1 domain discovery analysis (21 domains)

## Knowledge Discovery Workflow

For AI agents:

1. **Identify the task** → Route via `agent/agent-routing-map.md`
2. **Select the domain** → Confirm via `agent/domain-selection-guide.md`
3. **Locate the KU** → Find in `intelligence/indexes/knowledge-unit-index.md`
4. **Read the content** → Open `knowledge/{domain}/{subdomain}/{ku}/04-standardized-knowledge.md`
5. **Apply rules** → Read `05-rules.md` for that KU
6. **Learn skills** → Read `06-skills.md` for that KU
7. **Check decisions** → Read `07-decision-trees.md` for that KU
8. **Prevent anti-patterns** → Read `08-anti-patterns.md` for that KU
9. **Validate work** → Read `09-checklists.md` for that KU
10. **Cross-reference** → Use `intelligence/indexes/checklist-index.md` for broader validation

## Mandatory Agent Retrieval Workflow

Before generating Laravel code, agents must:

1. Identify the task type.
2. Select the relevant ECC domain.
3. Consult:
   - `agent/domain-routing-index.md`
   - `agent/domain-selection-guide.md`
4. Load relevant:
   - knowledge units;
   - rules;
   - skills;
   - decision trees;
   - anti-patterns;
   - checklists.
5. Use:
   - `agent/retrieval-guide.md`
   - `agent/task-to-skill-map.md`
6. Validate implementation against relevant checklists before completion.

## Retrieval Priority

Use this order:

1. `agent/domain-routing-index.md`
2. `agent/task-to-skill-map.md`
3. `intelligence/indexes/skill-index.md`
4. `intelligence/indexes/rule-index.md`
5. `intelligence/indexes/decision-tree-index.md`
6. `intelligence/indexes/anti-pattern-index.md`
7. `intelligence/indexes/checklist-index.md`
8. `knowledge/<domain>/<subdomain>/<knowledge-unit>/`

Indexes are navigation layers. Knowledge-unit files are deep sources. Avoid scanning the whole repository.

## Retrieval CLI (Phase 11.1)

Before scanning the entire knowledge layer, use the deterministic retrieval CLI:

```bash
npx laravel-ecc retrieve "your task"    # Get the minimal useful context bundle
npx laravel-ecc search "keywords"       # Find matching knowledge units
npx laravel-ecc get <ku-id>             # Inspect a specific knowledge unit
npx laravel-ecc validate                # Check intelligence layer integrity
```

The retrieval CLI produces deterministic, explainable output with ranked knowledge units, applicable rules, skills, decision trees, anti-patterns, checklists, prerequisites, and related topics. It is faster and more targeted than manual file scanning.

**Preferred workflow:**
1. Run `npx laravel-ecc retrieve "your task" --mode compact` for quick routing
2. Use the returned KUs as starting points for deeper reading
3. Run `npx laravel-ecc retrieve "your task" --mode standard` for full context
4. Use `npx laravel-ecc get <ku-id>` to inspect specific KUs in detail

## Retrieval MCP Server (Phase 11.2)

When a coding agent is connected to the local `laravel-ecc-mcp` MCP server, prefer the MCP tools over the CLI — they return identical results and are discoverable by the agent:

1. `retrieve_context_bundle` — get the smallest useful context for the current task.
2. `search_ecc` — exploratory search across KUs.
3. `get_knowledge_unit` — deep inspection of one KU.
4. `get_graph_context` — prerequisites + related topics in one call.
5. `validate_ecc` — confirm graph integrity if uncertain.

Prefer `compact` or `standard` mode before `deep`. Avoid loading the entire repository. See `docs/mcp-tool-reference.md` for per-tool schemas.

## Machine-Readable Intelligence

Future tools, MCP servers, and retrieval systems should consume these files:

```
intelligence/json/
├── knowledge-units.json      — 2,321 KU metadata records
├── rules.json                — 2,321 rule definitions
├── skills.json               — 2,321 skill definitions
├── decision-trees.json       — 2,321 decision tree definitions
├── anti-patterns.json        — 2,321 anti-pattern definitions
├── checklists.json           — 2,321 checklist definitions
├── dependencies.json         — 429 dependency edges
├── relationships.json        — 3,513 relationship edges
├── aliases.json              — 120 alias mappings
└── external-concepts.json    — 26 external concept references
```

## Architectural Default

Reference: `docs/architecture-decisions/repository-vs-direct-eloquent.md`

Use direct Eloquent inside Actions or application services by default. Introduce repositories only when they create a meaningful abstraction boundary.

## When to Use Indexes vs Knowledge

### Use indexes FIRST when:
- You don't know which domain covers your task
- You need cross-domain validation
- You need checklist items that span multiple KUs
- You need to find rules across the entire repository

### Use knowledge FIRST when:
- You already know the domain and subdomain
- You need deep understanding of a specific topic
- You need detailed implementation guidance
- You need KU-specific rules, skills, or decision trees

## 21 Domain Reference

| Domain | Folder | Description |
|--------|--------|-------------|
| AI Intelligence Systems | `knowledge/ai-intelligence-systems/` | AI provider integration, Laravel AI SDK, agentic workflows, RAG, vector databases, streaming, token management |
| API CRUD System Engineering | `knowledge/api-crud-system-engineering/` | RESTful CRUD patterns, resource controllers, validation, pagination, API versioning |
| API Integration Engineering | `knowledge/api-integration-engineering/` | External API integration, webhooks, OAuth clients, rate limiting, retry strategies |
| Application Architecture Patterns | `knowledge/application-architecture-patterns/` | Architectural patterns, modular monoliths, hexagonal architecture, DDD, CQRS |
| Async & Distributed Systems | `knowledge/async-distributed-systems/` | Queues, job pipelines, event-driven architecture, message brokers, distributed processing |
| Backend Architecture Design | `knowledge/backend-architecture-design/` | Backend design principles, service layer, DTOs, actions, SOLID in Laravel |
| Cost & Resource Optimization | `knowledge/cost-resource-optimization/` | Cloud cost optimization, resource sizing, caching strategies, query optimization |
| Data Engineering & Analytics | `knowledge/data-engineering-analytics/` | ETL pipelines, data warehousing, analytics queries, reporting systems |
| Data Storage Systems | `knowledge/data-storage-systems/` | Database schema design, storage engines, data modeling, indexing strategies |
| DevOps & Infrastructure | `knowledge/devops-infrastructure/` | CI/CD pipelines, containerization, deployment strategies, environment management |
| Governance & Compliance Engineering | `knowledge/governance-compliance-engineering/` | GDPR, SOC2, HIPAA compliance, audit logging, data retention policies |
| Laravel Core Application Engineering | `knowledge/laravel-core-application-engineering/` | Core Laravel application structure, routing, middleware, request lifecycle |
| Laravel Eloquent Domain Modeling | `knowledge/laravel-eloquent-domain-modeling/` | Advanced Eloquent ORM, relationships, domain events, value objects, query optimization |
| Laravel Execution Lifecycle | `knowledge/laravel-execution-lifecycle/` | Framework bootstrapping, service providers, middleware pipeline, kernel lifecycle |
| Observability & Production Intelligence | `knowledge/observability-production-intelligence/` | Logging, monitoring, tracing, APM, alerting, health checks |
| Performance & Runtime Engineering | `knowledge/performance-runtime-engineering/` | Performance tuning, opcode caching, database optimization, profiling |
| Platform Engineering & Developer Experience | `knowledge/platform-engineering-developer-experience/` | Developer tooling, local environment, scaffolding, code generation |
| Real-Time Systems | `knowledge/real-time-systems/` | WebSockets, Laravel Echo, broadcasting, presence channels, event streaming |
| Search & Retrieval Systems | `knowledge/search-retrieval-systems/` | Full-text search, Meilisearch, Algolia, Scout, custom search engines |
| Security & Identity Engineering | `knowledge/security-identity-engineering/` | Authentication, authorization, encryption, security best practices, IAM |
| Testing & Reliability Engineering | `knowledge/testing-reliability-engineering/` | Pest testing, TDD, fixture factories, CI test suites, reliability engineering |

## Pre-Commit Validation Process

Before finalizing any implementation:

1. [ ] Identify the domain → Use `agent/domain-selection-guide.md`
2. [ ] Open the relevant `09-checklists.md` in the knowledge unit
3. [ ] Verify every checklist item is addressed
4. [ ] Cross-reference with `intelligence/indexes/checklist-index.md` for cross-cutting concerns
5. [ ] Review `intelligence/indexes/rule-index.md` for applicable rules
6. [ ] Check `08-anti-patterns.md` to avoid common mistakes
7. [ ] Consult `agent/task-to-skill-map.md` for relevant skill patterns
8. [ ] Pass the 5 Repository-Wide Completion Gates:
    - Gate 1: Architecture Complete
    - Gate 2: Security Complete
    - Gate 3: Testing Complete
    - Gate 4: Performance Complete
    - Gate 5: Production Ready
