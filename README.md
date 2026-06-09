# Laravel ECC

**Laravel 13 AI-ready skills, rules, agents, and CLI harness configs** for OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, and Kiro.

A Laravel-focused AI coding-agent **operating layer** and **engineering knowledge system**.

Builds on the [ECC](https://github.com/affaan-m/ECC) ecosystem with Laravel 13-specific depth.

```bash
# Install from GitHub
npx skills add elmochilyas/laravel-ecc

# Install from npm
npx laravel-ecc@beta add laravel-patterns
```

## Repository Architecture

### Curated Operating Layer

The curated layer teaches AI coding agents how to behave and operate inside Laravel projects:

```
agents/       — 12 Laravel-specific agent definitions
skills/       — 12 deep Laravel 13 skills
rules/        — 41 always-follow guidelines (4 categories)
commands/     — 7 Laravel/ECC console command references
hooks/        — Git/agent hook automations
mcp-configs/  — MCP server configurations
```

### Knowledge Intelligence Layer

The knowledge layer provides deep Laravel engineering knowledge, navigation, and machine-readable indexes:

```
knowledge/     — 21 engineering domains, 2,321 knowledge units
intelligence/  — JSON files, indexes, dependency graph
agent/         — Routing maps, retrieval guides, domain indexes
meta/          — Domain discovery analysis
tools/         — Rebuild and generation scripts
```

## What's Included

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 12 | Deep Laravel 13 skills (~35-40 code examples each) |
| Rules | 41 | common(10) + php(5) + web(7) + laravel(19) |
| Agents | 12 | Artisan, Eloquent, Migration, Database, Container, REST, JSON:API, GraphQL, gRPC, Microservices, Authentication, Identity Architecture |
| Commands | 7 | artisan, migrate, seed, route-list, tdd, code-review, plan |
| Harness Configs | 12 | OpenCode, Claude Code, Cursor, Gemini, Codex, Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, Kiro |
| MCP Config Files | 1 | mcp-servers.json (defines Laravel docs + Composer security servers) |

### Intelligence Layer

| Metric | Value |
|---|---|
| Engineering Domains | 21 |
| Canonical Knowledge Units | 2,321 |
| JSON Intelligence Files | 10 |
| Markdown Indexes | 7 |
| Dependency Edges | 429 |
| Relationship Edges | 3,513 |
| Circular Dependencies | 0 (verified by automated DFS on every generation) |
| Agent Navigation Files | 5 |

## How AI Agents Should Use ECC

```
Task
↓
Identify Domain
↓
Consult Routing Map
↓
Load Relevant Knowledge
↓
Apply Rules
↓
Use Skill Workflow
↓
Check Decision Trees
↓
Avoid Anti-Patterns
↓
Validate With Checklist
```

Reference files:
- [`AGENTS.md`](AGENTS.md) — Full agent operating instructions
- [`agent/retrieval-guide.md`](agent/retrieval-guide.md) — Optimal retrieval strategy
- [`agent/domain-routing-index.md`](agent/domain-routing-index.md) — Flat domain index
- [`agent/task-to-skill-map.md`](agent/task-to-skill-map.md) — Task-to-skill mapping

## Quick Start

### Install from npm

```bash
# Full installation to current project
npx laravel-ecc@beta install

# Install with a different profile
npx laravel-ecc@beta install --profile minimal    # Skills only
npx laravel-ecc@beta install --profile full       # Everything

# Add a single component to an existing project
npx laravel-ecc@beta add laravel-patterns

# Check installation state
npx laravel-ecc@beta doctor
```

### Install from GitHub

```bash
# All skills via Vercel Skills CLI
npx skills add elmochilyas/laravel-ecc

# Or via GitHub CLI
gh skill install elmochilyas/laravel-ecc

# Install a single skill
npx skills add elmochilyas/laravel-ecc --skill laravel-patterns
```

### Install Scripts

```bash
# Minimal (skills only)
./install.ps1 --profile minimal   # Windows
./install.sh --profile minimal    # macOS/Linux

# Core (skills + rules + agents — default)
./install.ps1                     # Windows
./install.sh                      # macOS/Linux

# Full (everything including harness configs)
./install.ps1 --profile full      # Windows
./install.sh --profile full       # macOS/Linux
```

### Update to Latest

```bash
# Via npm (recommended)
npx laravel-ecc@beta update

# Via install scripts
./update.ps1                      # Windows
./update.sh                       # macOS/Linux

# Preview changes without applying
./update.ps1 --dry-run            # Windows
./update.sh --dry-run             # macOS/Linux

# Check version
npx laravel-ecc@beta doctor
./update.ps1 --version            # Windows
./update.sh --version             # macOS/Linux
```

The update script reads your existing installation state (`.laravel-ecc-state.json`) and syncs all components to the latest package version while preserving your installation profile.

## Distribution

The npm package (`laravel-ecc`) includes:
- Curated **operating layer**: skills, rules, agents, commands, hooks, MCP configs
- CLI harness configurations for 12 AI coding tools
- Install and update scripts
- **Intelligence layer metadata**: JSON intelligence files (10), markdown indexes (7), alias mappings (aliases.json), external concept registry (external-concepts.json)

The full **knowledge intelligence layer** (knowledge/, intelligence/, agent/, meta/, tools/) is available from the [GitHub repository](https://github.com/elmochilyas/laravel-ecc) but is not included in the npm package to keep it lightweight.

## Laravel 13

Targets **Laravel 13** (PHP 8.3+, Pest 4).

Key features:
- PHP 8 attribute-driven models (`#[Table]`, `#[Fillable]`, `#[Hidden]`, `#[Casts]`)
- Pest 4 first-class test framework with PHP Attribute Output (PAO)
- Queue job attributes (`#[Connection]`, `#[Tries]`, `#[Timeout]`)
- Console command attributes (`#[AsCommand]`)
- Pest 4 browser testing with Playwright
- Horizon Redis Cluster support

## Twelve Skills

### laravel-patterns
Architecture: modular domains, Actions/Services/DTOs, Eloquent optimization, attribute models, Form Requests, API Resources, Queues, Events, Caching, Policies, Pipeline, Service container, Rate limiting

### laravel-tdd
Pest 4: Feature/Unit 80/20 split, Model factories, HTTP tests, Auth tests, Laravel fakes (Http/Mail/Queue/Storage/Event/Bus), Architecture tests, Datasets, Snapshot testing, Parallel testing, CI

### laravel-security
Mass assignment, SQL injection, XSS/Blade, CSRF, Breeze/Fortify, Gates/Polices, FormRequest, Rate limiting, HSTS/CSP headers, Session security, CORS, File uploads, composer audit, APP_KEY rotation, Production hardening

### laravel-core-internals
Service Container, Dependency Injection, Auto Resolution, Contextual Binding, Tagged Services, Service Lifetimes (Singleton/Scoped/Transient), Service Providers (Register/Boot lifecycle, Deferred, Dynamic loading), Facades (Internals, Testing, Anti-patterns, Custom), Request Lifecycle (Middleware Pipeline, Route Resolution, Controller Dispatching, Response Generation), Contracts (Interface-first, Swappable implementations, LSP)

### laravel-eloquent
Advanced Eloquent: relationships (morph, polymorphic many-to-many, HasOneThrough, HasManyThrough), performance (N+1 prevention, eager constraints, selective columns, aggregate relationships), model design (DTOs, Value Objects, Rich Domain Models), advanced features (custom builders, global/local scopes, query macros, custom/encrypted/enum casts), events (observers, domain events, event sourcing)

### laravel-database
Database engineering for both MySQL and PostgreSQL: SQL mastery (CTEs, window functions, recursive CTEs, UPSERT, RETURNING, GROUP BY extensions), query plans (EXPLAIN ANALYZE, FORMAT=JSON), index design (composite, partial, covering, functional, GIN/GiST/BRIN/HNSW, FULLTEXT, SPATIAL, invisible, descending), full-text search (whereFullText, Scout, BOOLEAN MODE), database scaling (read replicas, partitioning, sharding, PgBouncer, ProxySQL), multi-tenant strategies, transactions (pessimistic locking, gap locks, isolation levels, deadlock prevention, retry), PostgreSQL (JSONB, GIN, materialized views, triggers, functions, arrays, range types), MySQL (InnoDB, utf8mb4, JSON, ProxySQL, Group Replication, Performance Schema), Laravel 13 vector search (whereVectorSimilarTo, pgvector, embeddings, HNSW, reranking, hybrid full-text + vector)

### laravel-api-rest
REST API architecture: REST principles (resources over actions, HTTP methods, status codes), HATEOAS hypermedia links, API versioning (URL-based, header negotiation, deprecation strategy), resource transformation (API Resources, conditional attributes, consistent envelopes), pagination strategies (offset, cursor, length-aware, decision matrix), enterprise API checklist

### laravel-api-jsonapi
JSON:API specification: Laravel 13 native JsonApiResource, attribute definition (simple list, closure-wrapped, sparse fieldsets), relationship mapping, compound documents with includes, whitelisting/limiting include depth, self/relationship/top-level links, meta objects, JSON:API error handling, pagination for JSON:API (page-based, cursor), test patterns

### laravel-api-graphql
GraphQL with Lighthouse: schema-first design (SDL), directives (@all, @find, @paginate, @create, @update, @delete, @hasMany, @belongsTo, @rules, @can, @canModel), thin resolver pattern with Action delegation, N+1 prevention with DataLoader, query complexity protection (max depth, max complexity), subscriptions (Pusher), GraphQL Federation (@key, @external, @shareable, @provides, @requires), validation, authorization via policies, testing

### laravel-api-grpc
gRPC and Protocol Buffers for Laravel: proto syntax and field numbering optimization, RoadRunner gRPC server configuration, service implementation (unary, server streaming, bidirectional), gRPC interceptors (logging, metrics, auth), client integration, error handling with gRPC status codes, health checks, schema evolution rules, testing

### laravel-api-microservices
Internal microservice architecture: service boundaries (one domain per service), database ownership (no direct cross-service DB access), communication strategy (events preferred, gRPC, REST), event-driven integration (event catalog, publishing, cross-service listeners), saga pattern for distributed transactions (orchestration/choreography, compensating actions), health checks, structured logging, distributed tracing, deployment

### laravel-authentication
Authentication & authorization: Sanctum, Passport, OAuth2, OIDC, JWT, Policies, Gates, Roles, Permissions, Multi-tenant, SSO, Enterprise IAM, Zero-trust, MFA

## CLI Harness Support

| Tool | Config |
|------|--------|
| OpenCode | `.opencode/opencode.json` |
| Claude Code | `.claude/settings.json` |
| Cursor | `.cursor/rules.mdc` |
| Gemini CLI | `.gemini/instructions.md` |
| Codex CLI | `.codex/instructions.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| VS Code | `.vscode/settings.json` / `.vscode/extensions.json` |
| Zed | `.zed/settings.json` |
| Trae | `.trae/rules.md` |
| Qwen | `.qwen/instructions.md` |
| CodeBuddy | `.codebuddy/instructions.md` |
| Kiro | `.kiro/instructions.md` |

## Deterministic Retrieval CLI (Phase 11)

The ECC retrieval CLI provides deterministic, explainable access to the knowledge intelligence layer:

```bash
# Retrieve a context bundle for a task
npx laravel-ecc retrieve "Build a multi-tenant REST API using Sanctum and queued notifications"

# Compact mode for quick routing
npx laravel-ecc retrieve "Optimize an N+1 query" --mode compact

# Search for knowledge units
npx laravel-ecc search "Policies versus Gates"

# Get knowledge unit details
npx laravel-ecc get security-identity-engineering/authentication/sanctum-spa-authentication

# Validate intelligence layer integrity
npx laravel-ecc validate
```

**Modes:** `compact` (quick routing), `standard` (default), `deep` (detailed research)

**Output:** `markdown` (human-readable) or `json` (machine-readable, MCP-ready)

**Root discovery:** `--ecc-root <path>` or `ECC_ROOT` environment variable

For full documentation, see `docs/retrieval-cli-guide.md`.

## Local MCP Server (Phase 11.2)

A thin local stdio MCP server (`laravel-ecc-mcp`) exposes the same retrieval core to MCP-capable agents (OpenCode, Claude Code, Cursor, etc.). It is a **read-only, deterministic adapter** — no duplicate ranking logic, no graph changes.

```jsonc
// .opencode/opencode.json (or examples/opencode-mcp.local.jsonc)
{
  "mcp": {
    "laravel-ecc": {
      "type": "local",
      "command": ["node", "C:\\path\\to\\laravel-ecc\\scripts\\laravel-ecc-mcp.mjs"],
      "enabled": true,
      "timeout": 10000,
      "environment": { "ECC_ROOT": "C:\\path\\to\\laravel-ecc" }
    }
  }
}
```

Five read-only tools:

| Tool | Purpose |
|------|---------|
| `retrieve_context_bundle` | Smallest useful bundle for a Laravel task |
| `search_ecc` | Ranked KU search |
| `get_knowledge_unit` | Inspect one KU by ID |
| `get_graph_context` | Prerequisites + related topics in one call |
| `validate_ecc` | Validate intelligence layer integrity |

See:

- `docs/mcp-server-guide.md` — architecture, stdio rule, lightweight strategy
- `docs/mcp-opencode-setup.md` — OpenCode configuration snippets
- `docs/mcp-tool-reference.md` — per-tool schema and return shape
- `docs/mcp-troubleshooting.md` — actionable error recovery

## License

MIT — based on [ECC](https://github.com/affaan-m/ECC) by Affaan Mustafa.
