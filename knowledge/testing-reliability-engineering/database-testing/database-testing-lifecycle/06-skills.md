# Skill: Configure Database Testing Lifecycle Strategy

## Purpose
Select and configure the correct database lifecycle strategy — `RefreshDatabase`, `DatabaseMigrations`, or `DatabaseTruncation` — balancing speed, isolation, and compatibility.

## When To Use
- Setting up test database configuration for a new Laravel project
- Configuring parallel database isolation with process-specific databases
- Choosing between lifecycle strategies for different test types
- Configuring CI to use production-equivalent database engine

## When NOT To Use
- Tests that don't touch the database (use mocks or unit tests)
- Database-specific integration tests that need real server setup
- Migration rollback tests (use dedicated sequential job)

## Prerequisites
- Database configured in `.env.testing` or `phpunit.xml`
- Migrations created for all tables
- Understanding of transaction vs migration rollback

## Inputs
- Database engine (SQLite, MySQL, PostgreSQL)
- CI runner capabilities (parallel processes, service containers)
- Test types (feature, migration, unit)

## Workflow
1. Apply `RefreshDatabase` trait as the default strategy for 95%+ of tests — it wraps each test in a transaction (~1ms overhead)
2. Scope `DatabaseMigrations` only to tests that modify schema — apply via `uses(DatabaseMigrations::class)->in('tests/Feature/Migrations')`
3. Ensure all migrations have reversible `down()` methods — required for `RefreshDatabase` rollback
4. Configure process-specific databases for parallel execution using `ParallelTesting::token()` to create unique database names per worker
5. Set SQLite `:memory:` for local development (2-3x faster, zero setup) and MySQL/PostgreSQL in CI for production equivalence
6. Add CI matrix job with production-equivalent database engine to catch engine-specific bugs (JSON queries, locking, full-text)
7. Clean up parallel databases after CI run using `ParallelTesting::tearDownProcess()` or `--recreate-databases`

## Validation Checklist
- [ ] `RefreshDatabase` is the default lifecycle strategy
- [ ] `DatabaseMigrations` used only for schema-modifying tests
- [ ] All migrations have reversible `down()` methods
- [ ] Process-specific databases configured for parallel execution
- [ ] CI uses production-equivalent database in at least one matrix job
- [ ] Test databases cleaned up after CI run
- [ ] No database tests run without any isolation trait

## Common Failures
- Using `DatabaseMigrations` for all tests — 10-100x slower than `RefreshDatabase`
- No database isolation trait — records leak between tests, causing order-dependent failures
- SQLite-only CI — engine-specific bugs (JSON queries, locking) reach production
- Shared database across parallel workers — deadlocks and data collisions
- Irreversible migrations — `RefreshDatabase` rollback fails

## Decision Points
- `RefreshDatabase` (transaction rollback, fastest) vs `DatabaseMigrations` (full migrate/rollback, most compatible)
- SQLite locally (fast, no setup) vs production-equivalent DB locally (catches engine bugs earlier)
- Process-specific databases (parallel isolation) vs shared database (simpler but incompatible with parallel)

## Performance Considerations
- `RefreshDatabase` overhead: <1ms per test (transaction begin + rollback)
- `DatabaseMigrations` overhead: 100-5000ms per test (migrate + rollback)
- `DatabaseTruncation` overhead: 5-50ms per test (table truncation)
- SQLite `:memory:`: ~50-100 tests/second; MySQL with transactions: ~30-60 tests/second

## Security Considerations
- Test databases should never contain real user data or secrets
- Parallel test databases must be dropped after CI runs to avoid accumulation
- Database credentials in CI should have limited permissions (test database only)

## Related Rules (from 05-rules.md)
- Rule 1: Default to `RefreshDatabase` for 95% of tests
- Rule 2: Never run tests without any database isolation trait
- Rule 3: Use production-equivalent database in CI
- Rule 4: Configure process-specific databases for parallel execution
- Rule 5: Keep all migrations reversible
- Rule 6: Scope `DatabaseMigrations` trait only to schema-modifying tests

## Success Criteria
- Test suite uses fastest appropriate lifecycle strategy (RefreshDatabase by default)
- Parallel tests have isolated databases with no collisions
- CI catches engine-specific bugs with production-equivalent database
- All migrations are reversible for safe rollback
