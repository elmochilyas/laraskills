# Laravel ECC

**Laravel 13 AI-ready skills, rules, agents, and CLI harness configs** for OpenCode, Claude Code, Cursor, Gemini CLI, Codex CLI, Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, and Kiro.

Builds on the [ECC](https://github.com/affaan-m/ECC) ecosystem with Laravel 13-specific depth.

```bash
# Install from GitHub
npx skills add elmochilyas/laravel-ecc
gh skill install elmochilyas/laravel-ecc

# Install from npm
npx laravel-ecc@beta add laravel-patterns
```

## What's Included

| Category | Count | Description |
|----------|-------|-------------|
| Skills | 6 | Deep Laravel 13 skills (~35-40 code examples each) |
| Rules | 35 | common(10) + php(5) + web(7) + laravel(13) |
| Agents | 5 | Laravel Artisan, Eloquent, Migration, Database, Container agents |
| Commands | 4 | artisan, migrate, seed, route-list |
| Harness Configs | 12 | OpenCode, Claude Code, Cursor, Gemini, Codex, Copilot, VS Code, Zed, Trae, Qwen, CodeBuddy, Kiro |
| MCP Configs | 2 | Laravel docs + Composer security |

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
# All 3 skills via Vercel Skills CLI
npx skills add elmochilyas/laravel-ecc

# Or via GitHub CLI
gh skill install elmochilyas/laravel-ecc

# Install a single skill
npx skills add elmochilyas/laravel-ecc --skill laravel-patterns
```

### Install Scripts

```bash
# Minimal (3 skills only)
./install.ps1 --profile minimal   # Windows
./install.sh --profile minimal    # macOS/Linux

# Core (5 skills + rules + agents — default)
./install.ps1                     # Windows
./install.sh                      # macOS/Linux

# Full (everything)
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

## Laravel 13

Targets **Laravel 13** (PHP 8.3+, Pest 4).

Key features:
- PHP 8 attribute-driven models (`#[Table]`, `#[Fillable]`, `#[Hidden]`, `#[Casts]`)
- Pest 4 first-class test framework with PHP Attribute Output (PAO)
- Queue job attributes (`#[Connection]`, `#[Tries]`, `#[Timeout]`)
- Console command attributes (`#[AsCommand]`)
- Pest 4 browser testing with Playwright
- Horizon Redis Cluster support

## Six Skills

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

## License

MIT — based on [ECC](https://github.com/affaan-m/ECC) by Affaan Mustafa.
