# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Database Testing
## Knowledge Unit: Database Testing Lifecycle

---

### Rule 1: Default to `RefreshDatabase` for 95% of tests

| Field | Value |
|-------|-------|
| **Name** | Use `RefreshDatabase` as the default lifecycle |
| **Category** | Strategy Selection |
| **Rule** | Use `RefreshDatabase` trait as the default database lifecycle strategy for all feature tests. Reserve `DatabaseMigrations` only for tests that modify database schema. |
| **Reason** | `RefreshDatabase` wraps each test in a database transaction and rolls back after the test (~1ms overhead). `DatabaseMigrations` runs full migrate:rollback (~100-5000ms). Using migrations for all tests makes the suite 10-100x slower than necessary. |
| **Bad Example** | `uses(DatabaseMigrations::class)->in('tests')` — all tests run full migration rollback. |
| **Good Example** | `uses(RefreshDatabase::class)->in('tests/Feature')` + `uses(DatabaseMigrations::class)->in('tests/Feature/Migration')`. |
| **Exceptions** | Tests that use DDL operations (CREATE/ALTER/DROP) which may not work correctly within transactions. |
| **Consequences Of Violation** | Test suite is 10-100x slower than necessary. CI feedback loop is significantly longer. |

---

### Rule 2: Never run tests without any database isolation trait

| Field | Value |
|-------|-------|
| **Name** | Always use a database isolation trait |
| **Category** | Data Isolation |
| **Rule** | Every test that touches the database must use one of: `RefreshDatabase`, `DatabaseMigrations`, or `DatabaseTruncation`. Never run database tests without any lifecycle trait. |
| **Reason** | Without isolation, records created in one test persist and affect subsequent tests. Tests pass in isolation but fail in the full suite due to data contamination. The failure is order-dependent and non-deterministic. |
| **Bad Example** | A feature test file without any database trait — records leak between tests. |
| **Good Example** | All test files include a database lifecycle trait, applied via `uses()` in `pest.php` or imported per-file. |
| **Exceptions** | Unit tests that use mocks and never touch a real database. |
| **Consequences Of Violation** | Flaky, order-dependent test failures. Debugging requires running the entire suite to reproduce. |

---

### Rule 3: Use production-equivalent database in CI

| Field | Value |
|-------|-------|
| **Name** | CI must use the production database engine |
| **Category** | CI Configuration |
| **Rule** | Use SQLite in-memory for local development. In CI, run tests against the production-equivalent database engine (MySQL or PostgreSQL) in at least one CI matrix job. |
| **Reason** | SQLite differs from MySQL/PostgreSQL in JSON handling, full-text search, foreign key enforcement, locking behavior, and supported SQL syntax. CI-only SQLite testing misses engine-specific bugs that manifest in production. |
| **Bad Example** | CI runs all tests on SQLite — production MySQL silently breaks on JSON queries or `FOR UPDATE` locks. |
| **Good Example** | CI matrix includes one SQLite job (fast) and one MySQL/PostgreSQL job (production-equivalent). |
| **Exceptions** | Projects that only use SQLite in production. |
| **Consequences Of Violation** | SQL engine-specific bugs reach production. JSON queries fail, locking behavior differs, foreign key violations go undetected. |

---

### Rule 4: Configure process-specific databases for parallel execution

| Field | Value |
|-------|-------|
| **Name** | Isolate databases per parallel worker |
| **Category** | Parallel Execution |
| **Rule** | Configure `ParallelTesting` to create and drop process-specific databases (e.g., `myapp_test_1`, `myapp_test_2`) when running tests with `--parallel`. |
| **Reason** | Without process-specific databases, parallel workers write to the same tables simultaneously. `RefreshDatabase` wraps each test in a transaction, but different workers' transactions run concurrently, causing deadlocks and data collisions. |
| **Bad Example** | `php artisan test --parallel` without database naming configuration — all workers use the same database. |
| **Good Example** | `ParallelTesting::setUpProcess()` creating `myapp_test_{$token}` and `tearDownProcess()` dropping it. |
| **Exceptions** | Single-connection databases (SQLite in-memory) are inherently isolated per process. |
| **Consequences Of Violation** | Deadlocks, transaction conflicts, and random test failures in parallel mode. |

---

### Rule 5: Keep all migrations reversible

| Field | Value |
|-------|-------|
| **Name** | Every migration must have a `down()` method |
| **Category** | Migration Design |
| **Rule** | Every migration's `up()` method must have a corresponding `down()` method that reverses the change. Never skip the `down()` method. |
| **Reason** | `RefreshDatabase` and `DatabaseMigrations` rely on `down()` methods for rollback. Irreversible migrations break the test lifecycle and make deployment rollback impossible. |
| **Bad Example** | `Schema::table('users', fn (Blueprint $table) => $table->dropColumn('name'))` in `up()` with no `down()`. |
| **Good Example** | `down()` method: `Schema::table('users', fn (Blueprint $table) => $table->string('name'))` — adds the column back. |
| **Exceptions** | Truly irreversible operations (rare). These must be documented with a manual rollback procedure. |
| **Consequences Of Violation** | Test lifecycle breaks. Deployment rollback is impossible. Failed releases cannot be reverted. |

---

### Rule 6: Scope `DatabaseMigrations` trait only to schema-modifying tests

| Field | Value |
|-------|-------|
| **Name** | Scope `DatabaseMigrations` to schema tests |
| **Category** | Strategy Selection |
| **Rule** | Apply `DatabaseMigrations` only to specific test directories or files that modify database schema. Use `uses(DatabaseMigrations::class)->in('tests/Feature/MigrationTests')`. |
| **Reason** | `DatabaseMigrations` is 100-5000x slower than `RefreshDatabase`. Applying it globally penalizes the entire suite. Schema-modifying tests are rare and should be explicitly scoped. |
| **Bad Example** | `uses(DatabaseMigrations::class)->in('tests/Feature')` — all feature tests run full migrations. |
| **Good Example** | `uses(RefreshDatabase::class)->in('tests/Feature')` + `uses(DatabaseMigrations::class)->in('tests/Feature/Migrations')`. |
| **Exceptions** | Projects where `RefreshDatabase` is incompatible with the database engine (e.g., some NoSQL databases). |
| **Consequences Of Violation** | Test suite is orders of magnitude slower than it should be. |
