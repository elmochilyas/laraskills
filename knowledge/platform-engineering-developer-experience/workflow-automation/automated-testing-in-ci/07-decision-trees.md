# 07-Decision Trees: Automated Testing in CI

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | workflow-automation-ci-cd |
| **Knowledge Unit** | automated-testing-in-ci |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Test Database Strategy | SQLite in-memory vs MySQL service containers | Do we prioritize test speed or production parity? |
| D02 | Test Parallelization | Sequential vs parallel test execution | Is the test suite large enough to benefit from parallelization? |
| D03 | CI Caching Strategy | What to cache between CI runs | How do we minimize dependency installation time? |
| D04 | Test Framework Choice | Pest vs PHPUnit for new projects | Which test framework fits the team's style and needs? |

## Architecture-Level Decision Trees

### D01: Test Database Strategy

```
START: What database should tests use in CI?
│
├── SQLite in-memory (fast, simple)
│   ├── Config: DB_CONNECTION=sqlite, DB_DATABASE=:memory:
│   ├── Speed: 5-10x faster than MySQL/PostgreSQL
│   ├── Pro: no service containers needed, instant CI
│   ├── Con: doesn't catch MySQL/PostgreSQL-specific issues
│   ├── Con: features like JSON column, full-text search may differ
│   └── Best for: unit tests, simple feature tests, small projects
│
├── MySQL service container (production parity)
│   ├── Config: CI service container with MySQL, health checks
│   ├── Speed: slower (full DB setup per suite)
│   ├── Pro: catches engine-specific issues before production
│   ├── Con: more CI setup, slower test execution
│   └── Best for: feature tests, integration tests, complex queries
│
├── Hybrid approach (recommended)
│   ├── Unit tests → SQLite in-memory (fast)
│   ├── Feature tests → MySQL service container (production parity)
│   ├── Split: separate test suites or directory-based config
│   ├── Pro: fast for unit tests, production parity for features
│   └── Best for: most projects — balanced speed and accuracy
│
└── Database configuration tips
    ├── Health check MySQL service before running tests
    ├── Use RefreshDatabase trait for test isolation
    ├── phpunit.xml: set DB_CONNECTION per test suite
    └── CI service container: MySQL with root password
```

### D02: Test Parallelization

```
START: Should we run tests in parallel?
│
├── Sequential (small suites, < 500 tests)
│   ├── Command: php artisan test
│   ├── Time: 2-5 minutes for typical suite
│   ├── Pro: simple, no parallel complexity
│   └── Best for: small projects, test suites under 500 tests
│
├── Parallel (recommended for 500+ tests)
│   ├── Command: php artisan test --parallel --processes=4
│   ├── Time reduction: ~60% for large suites
│   ├── Requirements:
│   │   ├── Parallel testing package (Pest includes, PHPUnit needs ParaTest)
│   │   ├── One database per process (laravel_test_1, laravel_test_2)
│   │   └── Test isolation (no shared state between processes)
│   ├── Pro: significantly faster CI
│   └── Best for: large project, 500+ tests
│
├── Matrix-based parallel (separate job per suite)
│   ├── Split tests by type: unit, feature, dusk
│   ├── Each type: separate CI job, runs parallel
│   ├── Pro: clear separation, independent results
│   └── Best for: complex test suites with browser tests
│
└── Parallel gotchas
    ├── Database parallelism: create suffixed databases per process
    ├── File system: use unique temp directories per process
    ├── Flaky tests: order-dependent tests fail in parallel
    └── Debugging: re-run failed tests sequentially to isolate
```

### D03: CI Caching Strategy

```
START: What should we cache in CI?
│
├── Composer vendor/ (essential)
│   ├── Cache key: hash of composer.lock
│   ├── Restore keys: previous composer.lock hash (fallback)
│   ├── Save time: 30-60 seconds per run
│   └── Action: actions/cache with path vendor/
│
├── NPM node_modules/
│   ├── Cache key: hash of package-lock.json
│   ├── Save time: 20-40 seconds per run
│   └── Action: actions/cache with path node_modules/
│
├── PHPStan result cache
│   ├── Cache: .phpstan.result.cache
│   ├── Save time: 2-5 minutes per run (full → incremental)
│   ├── Invalidated on: php file changes
│   └── Action: actions/cache with appropriate key
│
├── PHPUnit result cache
│   ├── Cache: .phpunit.result.cache
│   ├── Save time: 10-30 seconds per run
│   └── Helps: order-dependent test detection
│
└── Cache best practices
    ├── Separate cache keys per tool
    ├── Use hash-based keys for exact matches
    ├── Restore keys for fallback when hash changes
    └── Monitor cache hit rate — should be >80%
```

### D04: Test Framework Choice

```
START: Should we use Pest or PHPUnit?
│
├── Pest (recommended for new projects)
│   ├── Modern: more readable assertions, describe/it syntax
│   ├── Parallel: parallel by default (no extra config)
│   ├── Features: arch testing, snapshot testing, test traits
│   ├── Ecosystem: growing Laravel community adoption
│   ├── Migration: can coexist with PHPUnit, migrate gradually
│   └── Best for: new Laravel projects, teams wanting modern DX
│
├── PHPUnit (legacy, well-established)
│   ├── Traditional: class-based test methods
│   ├── Standard: Laravel ships with PHPUnit by default
│   ├── Ecosystem: all tools and integrations support PHPUnit
│   ├── Parallel: requires ParaTest for parallel execution
│   └── Best for: legacy projects, teams comfortable with PHPUnit
│
└── Migration considerations
    ├── Pest runs on top of PHPUnit (not a replacement, a wrapper)
    ├── Can mix Pest and PHPUnit tests in same project
    ├── Start new files in Pest, keep existing in PHPUnit
    └── Migration path: gradual, file-by-file
```
