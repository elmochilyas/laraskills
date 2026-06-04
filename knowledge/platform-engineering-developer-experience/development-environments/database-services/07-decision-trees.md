# 07-Decision Trees: Database Services

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | database-services |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Database Engine Selection | MySQL vs PostgreSQL vs SQLite for development | What database engine does production use? |
| D02 | Testing Database | What DB to use for test suite | Do we prioritize test speed or production parity? |
| D03 | Data Persistence | Whether to persist dev database data | Do we need data to survive container restarts? |
| D04 | Multiple Connections | Whether to use multiple database connections | Does the app connect to multiple databases? |

## Architecture-Level Decision Trees

### D01: Database Engine Selection

```
START: What database engine should we use for development?
│
├── MySQL (default, most common)
│   ├── Use when: production uses MySQL or MariaDB
│   ├── Sail: available by default (mysql service)
│   ├── Pro: Laravel defaults to MySQL, extensive community support
│   ├── Pro: most hosting platforms (Forge) use MySQL
│   └── Version: match production MySQL/MariaDB version exactly
│
├── PostgreSQL (alternative)
│   ├── Use when: production uses PostgreSQL
│   ├── Sail: available (pgsql service via --with=pgsql)
│   ├── Pro: JSONB, array columns, full-text search built-in
│   ├── Con: Laravel defaults to MySQL — extra config needed
│   └── Version: match production PostgreSQL version
│
├── SQLite (development only)
│   ├── Use when: simple app, no production DB yet
│   ├── Pro: zero setup, file-based, no Docker service needed
│   ├── Con: limited concurrency, no advanced features
│   └── Best for: prototypes, very simple apps
│
└── Decision rule: match production engine and version exactly
    ├── Prevents SQL compatibility issues between dev and prod
    ├── Catches engine-specific behavior during development
    └── Changes engine only if production migrates
```

### D02: Testing Database

```
START: What database should we use for tests?
│
├── SQLite in-memory (fast tests)
│   ├── Config: DB_CONNECTION=sqlite, DB_DATABASE=:memory: in phpunit.xml
│   ├── Speed: 2-5x faster than MySQL/PostgreSQL tests
│   ├── Pro: zero setup, each test gets fresh DB
│   ├── Con: SQLite != MySQL — type/feature differences
│   ├── Con: passing tests may fail against production DB
│   └── Best for: unit tests, simple queries
│
├── MySQL/PostgreSQL (production parity)
│   ├── Config: use dev DB connection, migrate:fresh before tests
│   ├── Speed: slower (full DB setup per test suite)
│   ├── Pro: tests run against same engine as production
│   ├── Pro: catches engine-specific compatibility issues
│   └── Best for: integration tests, complex queries
│
├── Hybrid approach (recommended)
│   ├── Unit tests → SQLite in-memory (fast, isolated)
│   ├── Integration/feature tests → MySQL/PostgreSQL (parity)
│   ├── Configure via phpunit.xml groups or environment
│   └── Catches: all engine-specific issues before deployment
│
└── Sail CI: run MySQL/PostgreSQL as CI service
    ├── Use Docker service in CI pipeline
    └── Same engine/version as production
```

### D03: Data Persistence

```
START: Should dev database data persist across restarts?
│
├── Persistent volumes (recommended)
│   ├── Config: named volumes in docker-compose.yml
│   ├── Data survives: container stop/start, Docker restart
│   ├── Data lost on: volume deletion, docker compose down -v
│   ├── Pro: seed once, data persists through dev sessions
│   ├── Pro: migrations don't need re-running on every start
│   └── Best for: daily development workflow
│
├── Ephemeral (fresh state every start)
│   ├── No persistent volume configured
│   ├── Data lost on container restart
│   ├── Pro: always clean state, no stale data issues
│   ├── Con: must migrate and seed every start
│   └── Best for: CI, testing, demo environments
│
└── Reset on demand
    ├── sail artisan migrate:fresh --seed
    ├── Resets DB to known state without full restart
    └── Use: when data gets messy during development
```

### D04: Multiple Connections

```
START: Does the app need multiple database connections?
│
├── Single connection (most apps)
│   ├── Config: default DB connection only
│   ├── All models use same database
│   └── Simple, no extra config needed
│
├── Read/write replicas (high-traffic apps)
│   ├── Config: separate read/write hosts in config/database.php
│   ├── Dev: typically single server (read/write to same DB)
│   ├── Prod: separate read replica
│   └── Dev/prod parity not critical for this feature
│
├── Multiple databases (complex apps)
│   ├── Example: app DB + analytics DB + reporting DB
│   ├── Dev: one container per database engine
│   ├── Config: multiple connections in config/database.php
│   ├── Models specify connection: protected $connection = 'analytics'
│   └── Sail: add additional database services to docker-compose.yml
│
└── Testing with multiple connections
    ├── Each connection needs test database
    ├── Configure in phpunit.xml or setUp()
    ├── Ensure all test databases use migrate:fresh
    └── Consider: SQLite in-memory per connection (may hit limits)
```
