# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Database Testing |
| Knowledge Unit | Database Testing Lifecycle |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel migrations, Database configuration, Eloquent ORM basics |
| Related KUs | Model factory patterns, Database assertions, Parallel testing |
| Source | domain-analysis.md K005 |

# Overview

Database testing lifecycle encompasses how database state is managed between tests: setup, migration, data seeding, transaction wrapping, and teardown. Laravel provides three strategies — `RefreshDatabase` (transaction rollback), `DatabaseMigrations` (full migrate/rollback), and `DatabaseTruncation` (table truncation) — each with distinct speed, isolation, and concurrency characteristics. Choosing the wrong strategy leads to slow tests, flaky test failures, or insufficient isolation.

# Core Concepts

- **`RefreshDatabase` trait**: Wraps each test in a database transaction. After the test, the transaction is rolled back. Fastest approach for MySQL/PostgreSQL.
- **`DatabaseMigrations` trait**: Runs `php artisan migrate:fresh` before each test. Slowest but most compatible. Use when DDL is needed.
- **`DatabaseTruncation` trait**: Truncates all tables between tests. Faster than migrations but slower than refresh.
- **Transaction nesting**: PHPUnit wraps each test in a transaction. Nested `DB::beginTransaction()` creates savepoints.
- **`RefreshDatabase` + parallel**: Each parallel worker gets its own database. The trait handles database creation and migration per process.

# When To Use

- `RefreshDatabase` for 95%+ of tests (best speed and isolation balance)
- `DatabaseMigrations` for tests that modify schema or test migration behavior
- `DatabaseTruncation` for databases that don't support nested transactions
- Combine with process-specific databases for parallel test execution

# When NOT To Use

- Never use no database trait (lack of isolation between tests)
- `DatabaseMigrations` for all tests (10x slower than `RefreshDatabase`)
- `RefreshDatabase` with DDL-heavy operations (may not be compatible with some schema changes)
- SQLite-only testing when production uses MySQL/PostgreSQL (creates blind spots)

# Best Practices (WHY)

- **Default to `RefreshDatabase`**: It's the fastest and safest for MySQL/PostgreSQL. Transaction rollback (<1ms) is orders of magnitude faster than full migration rollback (100-5000ms).
- **Reserve `DatabaseMigrations` for DDL tests**: Only tests that actually modify the database schema need full migration rollback. Keep these in a separate test directory with scoped trait application.
- **Use process-specific databases in parallel**: `RefreshDatabase` auto-creates `myapp_test_1`, `myapp_test_2` for each parallel worker. Without this, parallel tests collide on the same tables.
- **Use production-equivalent database in CI**: SQLite differs from MySQL/PostgreSQL in JSON handling, foreign key enforcement, and transaction semantics. Always run critical tests against the production-equivalent engine.
- **Keep migrations reversible**: All migrations must be reversible for `RefreshDatabase`/`rollback` to work. Irreversible migrations need `DatabaseTruncation` or manual cleanup.

# Architecture Guidelines

- **Strategy selection**: `RefreshDatabase` for 95%+ of tests. `DatabaseMigrations` only for schema-modifying tests. `DatabaseTruncation` for non-transactional databases.
- **Mixed strategies**: Apply traits per-directory via `uses()` scoping in Pest. Different test groups can use different lifecycle strategies.
- **SQLite for local TDD**: Use SQLite locally for speed (50-100 tests/second). Use MySQL/PostgreSQL in CI for production realism.
- **Migration tracking**: `RefreshDatabase` uses static `$migrated` flag. Migration runs once per process, not once per test.

# Performance Considerations

- `RefreshDatabase` overhead: <1ms per test (transaction begin + rollback).
- `DatabaseMigrations` overhead: 100-5000ms per test.
- `DatabaseTruncation` overhead: 5-50ms per test.
- Migration run (once per process): 500ms-10s. Cached by `$migrated` flag.
- SQLite in-memory: ~50-100 tests/second. PostgreSQL with transactions: ~30-60 tests/second.

# Security Considerations

- Test databases should never contain real user data or secrets
- Parallel test databases should be dropped after CI runs to avoid accumulation
- Database credentials used in CI should have limited permissions (test database only)

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using DatabaseMigrations for all tests | Easy setup, works everywhere | CI suite takes 10x longer than necessary | Use RefreshDatabase by default; DatabaseMigrations only when needed |
| Not handling parallel database provisioning | Tests work sequentially but fail in parallel | Flaky CI failures only in parallel mode | Configure ParallelTesting for database name suffixing |
| Using SQLite as only CI database | No service container setup | Misses MySQL/PostgreSQL-specific bugs | Use production-equivalent database in CI |
| Assuming all databases support transactional DDL | MySQL specific engine behavior | RefreshDatabase may not work with MyISAM | Use DatabaseTruncation for limited DDL transaction support |
| No database isolation trait | Accidental sharing of test state | Tests pass in isolation but fail in suite | Always use RefreshDatabase, DatabaseMigrations, or DatabaseTruncation |

# Anti-Patterns

- **SQLite-only CI**: Running all tests on SQLite when production uses MySQL/PostgreSQL. Creates false confidence and production bugs.
- **DatabaseMigrations for entire suite**: Using the slowest strategy for all tests. Instead, use `RefreshDatabase` as default and scope `DatabaseMigrations` to specific tests.
- **No database isolation**: Writing tests without any lifecycle trait. Tests leak state, causing order-dependent failures.
- **Shared database across parallel workers**: Multiple parallel processes writing to the same database tables. Instead, use process-specific database names.

# Examples

```php
// Default: RefreshDatabase (Pest)
uses(RefreshDatabase::class);

// DatabaseMigrations for specific directory
uses(DatabaseMigrations::class)->in('tests/Feature/MigrationTests');

// DatabaseTruncation for non-transactional databases
uses(DatabaseTruncation::class);

// Parallel database configuration in phpunit.xml
// <server name="DB_DATABASE" value="testing_{process_id}" />
```

# Related Topics

- **Prerequisites**: Laravel migrations, Database configuration, Eloquent ORM basics
- **Related**: Model factory patterns, Database assertions, Parallel testing
- **Advanced**: Process-specific database provisioning, Migration strategy design, Seed data management

# AI Agent Notes

- When working on a Laravel project's tests, check which database lifecycle trait is used. If it uses `DatabaseMigrations` everywhere, recommend switching to `RefreshDatabase` as default with `DatabaseMigrations` scoped only to migration-specific tests.
- For parallel testing, ensure `DB_DATABASE` uses a process-specific token. Without this, parallel tests will collide.
- If the project uses SQLite in CI but MySQL/PostgreSQL in production, recommend adding at least one CI matrix cell with the production-equivalent database engine.

# Verification

- [ ] RefreshDatabase is the default database lifecycle strategy
- [ ] DatabaseMigrations is used only for tests that modify schema
- [ ] DatabaseTruncation is available for non-transactional databases
- [ ] Process-specific databases are configured for parallel execution
- [ ] CI uses production-equivalent database engine in matrix
- [ ] All migrations are reversible
- [ ] No shared database across parallel workers
- [ ] Test databases are cleaned up after CI run
