# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Database Testing
Knowledge Unit: Database Testing Lifecycle
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Database testing lifecycle encompasses how database state is managed between tests: setup, migration, data seeding, transaction wrapping, and teardown. Laravel provides three strategies—`RefreshDatabase` (transaction rollback), `DatabaseMigrations` (full migrate/rollback), and `DatabaseTruncation` (table truncation)—each with distinct speed, isolation, and concurrency characteristics. Choosing the wrong strategy leads to slow tests, flaky test failures, or insufficient isolation.

# Core Concepts
- **`RefreshDatabase` trait**: Wraps each test in a database transaction. After the test, the transaction is rolled back. Fastest approach for MySQL/PostgreSQL. Not compatible with non-transactional DDL (some migration operations).
- **`DatabaseMigrations` trait**: Runs `php artisan migrate:fresh` before the test suite, then `php artisan migrate:rollback` after. Slowest but most compatible. Use when DDL operations are needed.
- **`DatabaseTruncation` trait**: Truncates all tables between tests. Faster than migrations but slower than refresh. Useful for databases that don't support nested transactions.
- **Transaction nesting**: PHPUnit wraps each test in a transaction. Nested calls to `DB::beginTransaction()` inside the test create savepoints.
- **`RefreshDatabase` + parallel**: Each parallel worker gets its own database. The trait handles database creation and migration per process.
- **Migration isolation**: `DatabaseMigrations` runs all migrations for each test. `RefreshDatabase` runs migrations once, then uses transactions.
- **Seed data**: Use `DatabaseMigrations` with seeders for shared reference data. `RefreshDatabase` transactions roll back seeded data.

# Mental Models
- **Transaction as reset button**: `RefreshDatabase` uses `BEGIN TRANSACTION` before the test and `ROLLBACK` after. The database never sees permanent changes.
- **Migration as setup cost**: `DatabaseMigrations` pays the migration cost per test. `RefreshDatabase` pays it once per test process. `DatabaseTruncation` pays TRUNCATE cost per test.
- **Isolation spectrum**: `DatabaseMigrations` (strongest but slowest) ? `RefreshDatabase` (strong and fast for MySQL/PostgreSQL) ? `DatabaseTruncation` (moderate, fast for any DB).
- **Parallel database provisioning**: Each parallel worker needs a separate database. The trait auto-creates `myapp_test_1`, `myapp_test_2`, etc.

# Internal Mechanics
- **`RefreshDatabase` flow**: (1) Check if migration was run this process. (2) If not, run `migrate:fresh`. (3) Begin transaction. (4) Run test. (5) Rollback transaction. (6) Next test begins new transaction.
- **`DatabaseMigrations` flow**: (1) Run `migrate:fresh`. (2) Run test. (3) Run `migrate:rollback`. (4) Next test repeats step 1.
- **`DatabaseTruncation` flow**: (1) Check if migration was run. (2) If not, run `migrate:fresh`. (3) Before each test, truncate all tables. (4) Run test. (5) Tables remain empty for next test.
- **Migration tracking**: `RefreshDatabase` uses a static `$migrated` flag. Once migration is run per process, subsequent tests skip migration. The flag is per-class-hierarchy, so different test classes share the flag.
- **Database name resolution**: `RefreshDatabase` interacts with `ParallelTesting` to append the process token to the database name.
- **SQLite `:memory:` mode**: When `DB_CONNECTION=sqlite` and `database` is `:memory:`, RefreshDatabase uses schema-level migrations without transactions (SQLite doesn't support concurrent transactions on the same in-memory database).

# Patterns
- **Pattern: Default to RefreshDatabase**
  - Purpose: Best balance of speed and isolation
  - Benefits: Fast, transactional isolation, migration run once per process
  - Tradeoffs: Requires database that supports DDL within transactions
  - Implementation: `use RefreshDatabase;` in test file or `uses(RefreshDatabase::class)` in pest.php

- **Pattern: DatabaseMigrations for DDL-heavy tests**
  - Purpose: When test modifies schema (indexes, columns) via migration
  - Benefits: Clean schema state per test
  - Tradeoffs: Slow (migrate + rollback per test)
  - Implementation: `uses(DatabaseMigrations::class)->in('tests/Feature/MigrationTests')`

- **Pattern: DatabaseTruncation for non-transactional databases**
  - Purpose: Databases that don't support nested transactions
  - Benefits: Faster than full migrations, cleaner than transactions
  - Tradeoffs: Truncate is slower than rollback; auto-increment counters don't reset without extra work
  - Implementation: `use DatabaseTruncation;` with `$tablesToTruncate` override

- **Pattern: Migration-once per parallel process**
  - Purpose: Avoid redundant migrations across parallel workers
  - Benefits: CI time saved; only N migrations instead of N x M
  - Tradeoffs: All workers must share same schema version
  - Implementation: `RefreshDatabase` handles this automatically

# Architectural Decisions
- **RefreshDatabase vs DatabaseMigrations**: Use `RefreshDatabase` for 95%+ of tests. Use `DatabaseMigrations` only for tests that modify schema. Never use neither (no isolation).
- **SQLite `:memory:` vs MySQL for tests**: SQLite `:memory:` is 5-10x faster but has JSON, full-text search, and locking differences. Use MySQL in CI; SQLite locally.
- **Parallel database strategy**: Use `RefreshDatabase` + process-specific databases. `DatabaseTruncation` also works in parallel (each worker truncates its own tables).
- **Mixed strategies in same suite**: Some tests need `RefreshDatabase`; others need `DatabaseMigrations`. Apply traits per-directory via `uses()` scoping.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| RefreshDatabase is fast and safe | Not compatible with DDL in migrations | Test DDL operations separately with DatabaseMigrations |
| DatabaseMigrations is most compatible | Very slow for large migration sets | Use only for schema-modifying tests |
| DatabaseTruncation works on any DB | Slower than RefreshDatabase | Acceptable for non-MySQL databases |
| Process-specific databases enable parallelism | Multiple databases to manage per CI run | Automation handles creation/destruction |

# Performance Considerations
- `RefreshDatabase` overhead: <1ms per test (transaction begin + rollback).
- `DatabaseMigrations` overhead: 100-5000ms per test (depending on migration count and complexity).
- `DatabaseTruncation` overhead: 5-50ms per test (each table TRUNCATE).
- Migration run (once per process): 500ms-10s. Cached by `$migrated` flag.
- Parallel workers multiply database connections: N workers × 1 connection each plus migration connection.
- SQLite `:memory:` vs file: `:memory:` is faster but creates separate databases per connection. File-based SQLite with journal mode is slower.

# Production Considerations
- **Production-equivalent database in CI**: Always run critical tests against the same database engine as production. SQLite-only CI misses MySQL/PostgreSQL-specific bugs.
- **Migration history**: All migrations must be reversible for `RefreshDatabase`/`rollback` to work. Irreversible migrations need `DatabaseTruncation` or manual cleanup.
- **Seed data**: Reference data (countries, roles, permissions) should be seeded during migration. Test that seeders run correctly in test environment.
- **Database cleanup on CI**: Parallel test databases should be dropped after CI run. Orphaned databases accumulate.

# Common Mistakes
- **Mistake: Using RefreshDatabase with SQLite in-memory in parallel**
  - Why: Each PHP process has its own in-memory SQLite
  - Why harmful: Each worker needs its own database; in-memory per-process works but must be configured
  - Better: Ensure each parallel worker creates its own SQLite database file or uses process-specific names

- **Mistake: Using DatabaseMigrations for all tests**
  - Why: Easy setup, works everywhere
  - Why harmful: CI suite takes 10x longer than necessary
  - Better: Use `RefreshDatabase` by default; `DatabaseMigrations` only when needed

- **Mistake: Not handling parallel database provisioning**
  - Why: Tests work sequentially but fail in parallel
  - Why harmful: Flaky CI failures only in parallel mode
  - Better: Configure `ParallelTesting` for proper database name suffixing

- **Mistake: Assuming all databases support transactional DDL**
  - Why: MySQL supports transactional DDL only for specific engines
  - Why harmful: `RefreshDatabase` may not work correctly with MyISAM tables or certain migration operations
  - Better: Use `DatabaseTruncation` for databases with limited DDL transaction support

# Failure Modes
- **Transaction savepoint limit reached**: Deeply nested `beginTransaction()` calls exceed database savepoint limits. MySQL default is allowed.
- **Migration timeout**: Long-running migrations (large data seeds, slow DDL operations) timeout in parallel mode. Increase timeout or optimize migrations.
- **Schema cache staleness**: `RefreshDatabase` caches schema state. After migration rollback/rollforward, schema cache may be stale. Run `migrate:fresh` to reset.
- **Database connection exhaustion**: Each parallel worker opens a database connection. Exceeds `max_connections` if too many workers.

# Ecosystem Usage
- **Laravel core**: Laravel's own test suite uses `RefreshDatabase` with MySQL in CI, SQLite locally.
- **Laravel Spark**: Spark's subscription tests use `RefreshDatabase` with process-specific databases for parallel runs.
- **Spatie packages**: Spatie packages typically use `RefreshDatabase` with `uses()` scoping per test directory.
- **Laravel Nova**: Nova tests use `RefreshDatabase` combined with `DatabaseMigrations` for specific migration-heavy test files.

# Related Knowledge Units
- **Prerequisites**: Laravel migrations, Database configuration, Eloquent ORM basics
- **Related Topics**: Model factory patterns, Database assertions, Parallel testing
- **Advanced Follow-up**: Process-specific database provisioning, Migration strategy design, Seed data management

# Research Notes
- Laravel's RefreshDatabase trait uses database transactions for test isolation, rolling back changes after each test — this is the fastest approach for MySQL/PostgreSQL
- SQLite in-memory database is a common testing strategy but has limitations: lacks full-text search, JSON functions differ, and some MySQL-specific features are unavailable
- Model factories with relationships require careful fterCreating() callback management to avoid N+1 factory creation during test setup
- ssertDatabaseHas() and ssertDatabaseMissing() are the primary assertion helpers; they query the database directly — ensure test database is properly configured
- Database testing performance: RefreshDatabase with SQLite in-memory runs ~50-100 tests/second; PostgreSQL via transactions runs ~30-60 tests/second
