# Decision Trees — Test Databases

## Decision Tree 1: SQLite vs MySQL/PostgreSQL for Testing

```
Which database engine should be used for testing?
│
├── Local development (rapid TDD feedback)
│   └── Use SQLite in-memory (`DB_CONNECTION=sqlite DB_DATABASE=:memory:`)
│       2-3x faster than MySQL/PostgreSQL
│       Zero setup required
│       Disadvantage: engine-specific features (JSON, full-text) may differ from production
│
├── CI pipeline (production-equivalent validation)
│   └── Use production database engine (MySQL or PostgreSQL)
│       Matrix test across multiple engines if supported
│       Catches engine-specific bugs: JSON queries, locking, transactions
│       Slower than SQLite but necessary for accuracy
│
└── Hybrid approach (recommended)
    ├── Local: SQLite — speed for dev
    └── CI: MySQL/PostgreSQL — accuracy before merge
        Document known engine differences so local devs aren't surprised
```

## Decision Tree 2: Secret Management Strategy

```
How should secrets be managed in the test environment?
│
├── Non-sensitive configuration (safe defaults)
│   └── Commit to `.env.testing` in version control
│       DB_CONNECTION=sqlite, MAIL_MAILER=array, CACHE_STORE=array
│       These are safe defaults — no secrets
│
├── Sensitive credentials (API keys, passwords)
│   └── NEVER commit to `.env.testing`
│       Create `.env.testing.example` with placeholder values
│       Add `.env.testing` to `.gitignore`
│       Inject real values via CI environment variables / secrets
│
└── Developer-specific overrides
    └── Use `.env.testing.local` (gitignored)
        Overrides `.env.testing` for individual developer preferences
```

## Decision Tree 3: Environment Variable Override Strategy

```
How should environment variables be overridden for a specific test?
│
├── Per-test override needed
│   └── Use `Env::fake(['KEY' => 'value'])` (preferred)
│       Scoped to the test — auto-cleaned after test ends
│       Never modify `$_ENV` or `$_SERVER` directly
│
├── Per-class override needed
│   └── Set in `setUp()` or `beforeEach()`
│       Use `$this->app->bind()` or `config(['key' => 'value'])`
│       Reset in `tearDown()` or `afterEach()`
│
└── Global testing environment override
    └── Set in `phpunit.xml <env>` tags
        Highest precedence — overrides `.env` and `.env.testing`
        Use for CI-specific settings like database credentials
```
