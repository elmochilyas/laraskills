# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Database Testing
Knowledge Unit: Migration Rollback Testing
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Migration rollback testing verifies that all database migrations can be safely rolled back (undone) without data loss or schema corruption. Laravel's `migrate:rollback` reverses the last batch of migrations. Testing rollback ensures zero-downtime deployments can revert schema changes if needed. Irreversible migrations (missing `down()` method) are a deployment risk—they make it impossible to revert a failed release.

# Core Concepts
- **`down()` method**: Every migration should have a `down()` method that reverses the `up()` changes. Missing `down()` means the migration is irreversible.
- **`migrate:rollback`**: Reverses the last batch of migrations. A batch is a group of migrations run together in one `migrate` command.
- **`migrate:reset`**: Reverses ALL migrations (all batches).
- **`migrate:fresh`**: Drops all tables and re-runs all migrations. Does not test `down()` methods—used for development, not deployment rollback.
- **Irreversible operations**: `dropColumn()`, `dropTable()` in `up()` without corresponding inverse in `down()`. Renaming columns. Data transformation.
- **Data preservation during rollback**: `down()` should preserve data where possible (recreate column with data, not just delete).

# Mental Models
- **Rollback as undo operation**: Each `down()` is the "undo" for that migration. It must perfectly reverse the schema change.
- **Migration as transaction**: The full migrate ? rollback cycle should be a no-op on final database state. Schema should match exactly before and after.
- **Irreversible = deployment risk**: A missing `down()` means a failed deployment cannot be rolled back. The only fix is forward migration, which may be impossible under time pressure.
- **Schema state verification**: After rollback, the database schema must match the state before the migration was applied.

# Internal Mechanics
- **Migration batch tracking**: Laravel's `migrations` table tracks which batch each migration ran in. `migrate:rollback` reads the highest batch number and reverses all migrations in that batch.
- **`down()` execution order**: Reversed order of `up()`. If migration A ran before migration B, rollback runs B's `down()` first, then A's `down()`.
- **Schema state comparison**: After rollback, run `migrate` again and verify no errors. Schema should be in a clean state.
- **Data integrity verification**: After rollback + migrate, verify that pre-migration data is still accessible.
- **`Schema::hasTable()`, `Schema::hasColumn()`**: Use in tests to verify schema state before and after rollback.

# Patterns
- **Pattern: Migrate ? rollback ? migrate cycle**
  - Purpose: Verify full migration round-trip
  - Benefits: Catches `down()` errors; ensures clean rollback
  - Tradeoffs: Requires clean database; time-consuming for many migrations
  - Implementation: `migrate:fresh` ? verify schema ? `migrate:rollback` ? verify reverse ? `migrate` ? verify schema same as initial

- **Pattern: Irreversible migration detection**
  - Purpose: Verify all migrations have functional `down()` methods
  - Benefits: Ensures deployment rollback capability
  - Tradeoffs: Some migrations are intentionally irreversible (documented exceptions)
  - Implementation: Custom script that runs each migration + its rollback in isolation

- **Pattern: Data round-trip test**
  - Purpose: Verify data survives migration ? rollback cycle
  - Benefits: Prevents data loss during deployment rollback
  - Tradeoffs: Data transformation in migrations makes round-trip complex
  - Implementation: Insert data ? apply migration ? verify data accessible ? rollback ? verify data still accessible

- **Pattern: CI migration gate**
  - Purpose: Automatically test all migrations in CI before deployment
  - Benefits: Catches migration errors before they reach production
  - Tradeoffs: Adds 30-60 seconds to CI pipeline
  - Implementation: CI job: `migrate:fresh` ? run test suite ? `migrate:rollback` ? `migrate` ? run test suite again

# Architectural Decisions
- **Irreversible migration documentation**: When a migration truly cannot have a `down()` (e.g., removing PII columns), document it explicitly and have a manual rollback procedure.
- **Down method completeness**: `down()` should recreate removed columns/tables. It does not need to restore data (but should try where possible).
- **Rollback in CI vs manual test**: CI should run rollback tests for every migration. Manual testing is for production-specific rollback scenarios.
- **`migrate:fresh` vs `migrate:rollback` in tests**: `migrate:fresh` drops and recreates—doesn't test `down()`. Always use `migrate:rollback` when testing rollback functionality.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Ensures deploy rollback capability | Slow to test all migrations cascadingly | Run rollback tests only in CI, not in local dev |
| Data round-trip prevents data loss | Complex setup for data-transforming migrations | Focus on migrations that move/transform data |
| Irreversible migration detection is comprehensive | Some irreversible migrations are legitimate | Document exceptions; have manual rollback plan |
| CI migration gate catches errors early | Adds CI time | Worth the confidence for production schema changes |

# Performance Considerations
- Migration application overhead: 100-5000ms depending on migration count.
- Rollback overhead: Similar to migration (same operations in reverse).
- Schema assertions: Fast (<5ms) for `Schema::hasTable()` / `hasColumn()`.
- Data round-trip: Migration + rollback + data verification = 2x migration time + data operation time.
- Parallel testing: Migration tests should NOT run in parallel. Use a dedicated CI job.

# Production Considerations
- **Zero-downtime deployments**: Rollback must be fast. Test that `down()` executes quickly. Slow rollbacks extend deployment downtime.
- **Data migration rollback**: Migrations that transform data (e.g., `UPDATE users SET ...`) must have inverse data transformations in `down()`.
- **Large table rollback**: Dropping a column (rollback = re-add column) is fast. Dropping a table (rollback = recreate table) may lose data. Avoid irreversible table drops.
- **Rollback automation**: Ensure deployment scripts automatically `rollback` on failure. Test this flow.

# Common Mistakes
- **Mistake: Missing `down()` method entirely**
  - Why: Developer focuses on forward migration
  - Why harmful: Migration cannot be rolled back; deployment failure becomes a crisis
  - Better: Every `up()` has a corresponding `down()`. CI enforces this.

- **Mistake: Truncating/destroying data in `down()` instead of preserving**
  - Why: `down()` drops table without preserving data
  - Why harmful: Rollback during a failed deployment loses production data
  - Better: `down()` should preserve data when possible. Data migration rollback should restore original values.

- **Mistake: Only testing `migrate:fresh` not `migrate:rollback`**
  - Why: Development workflow uses `migrate:fresh`
  - Why harmful: `fresh` doesn't test `down()` methods
  - Better: Run `migrate:rollback` at least once in CI

- **Mistake: Ignoring batch boundaries in tests**
  - Why: Testing rollback of a single migration
  - Why harmful: Rollback in production reverts entire batch, not individual migrations
  - Better: Test that the full batch rollback works

# Failure Modes
- **Missing `down()` method**: `migrate:rollback` fails for that migration. Migration cannot be reverted. Fix by adding `down()` in a new migration.
- **`down()` method has SQL errors**: Typos, incompatible syntax, missing tables. Run rollback tests in CI to catch.
- **Data loss on rollback**: `down()` drops a column with data that wasn't backed up. Always backup data or preserve in down().
- **Irreversible operation**: `renameColumn()` in `up()` cannot be reversed if the original column name is no longer tracked. Use separate `addColumn` + `dropColumn` pattern.

# Ecosystem Usage
- **Laravel core**: Laravel's migration system tracks batches and provides rollback commands. Core tests verify rollback behavior.
- **Laravel Forge**: Forge deployment scripts include `php artisan migrate --force` and automatic rollback on failure.
- **Laravel Envoyer**: Envoyer's zero-downtime deployment includes migration health checks and rollback triggers.
- **Spatie packages**: Spatie migration packages typically include `down()` methods and test rollback in CI.

# Related Knowledge Units
- **Prerequisites**: Laravel migrations, Schema builder, Database design
- **Related Topics**: Database testing lifecycle, CI/CD pipeline integration, Zero-downtime deployment
- **Advanced Follow-up**: Data migration testing, Custom migration stubs, Deployment rollback automation

# Research Notes
- Laravel's RefreshDatabase trait uses database transactions for test isolation, rolling back changes after each test — this is the fastest approach for MySQL/PostgreSQL
- SQLite in-memory database is a common testing strategy but has limitations: lacks full-text search, JSON functions differ, and some MySQL-specific features are unavailable
- Model factories with relationships require careful fterCreating() callback management to avoid N+1 factory creation during test setup
- ssertDatabaseHas() and ssertDatabaseMissing() are the primary assertion helpers; they query the database directly — ensure test database is properly configured
- Database testing performance: RefreshDatabase with SQLite in-memory runs ~50-100 tests/second; PostgreSQL via transactions runs ~30-60 tests/second
