# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Database Testing |
| Knowledge Unit | Migration Rollback Testing |
| Difficulty | Advanced |
| Maturity | Mature |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel migrations, Schema builder, Database design |
| Related KUs | Database testing lifecycle, CI/CD pipeline integration, Zero-downtime deployment |
| Source | domain-analysis.md K056 |

# Overview

Migration rollback testing verifies that all database migrations can be safely rolled back (undone) without data loss or schema corruption. Laravel's `migrate:rollback` reverses the last batch of migrations. Testing rollback ensures zero-downtime deployments can revert schema changes if needed. Irreversible migrations (missing `down()` method) are a deployment risk — they make it impossible to revert a failed release.

# Core Concepts

- **`down()` method**: Each migration should have a `down()` that reverses the `up()` changes.
- **`migrate:rollback`**: Reverses the last batch of migrations.
- **`migrate:reset`**: Reverses ALL migrations.
- **`migrate:fresh`**: Drops all tables and re-runs all migrations. Does NOT test `down()` methods.
- **Irreversible operations**: `dropColumn()`, `renameColumn()`, data transformations without inverse.

# When To Use

- Before every production deployment that includes new migrations
- In CI as a mandatory gate before deployment
- When introducing zero-downtime deployment
- After writing any migration that modifies existing data or schema

# When NOT To Use

- When migrations are purely additive (new tables, new columns) and have proper `down()` methods
- For database seeders (use seeder testing instead)
- As a substitute for production rollback procedure validation (test procedure separately)
- In parallel CI jobs (migration tests must run sequentially)

# Best Practices (WHY)

- **Every `up()` must have a corresponding `down()`**: A missing `down()` means deployment rollback is impossible. CI should enforce this. If a migration truly cannot be reversed (rare), document it explicitly and have a manual rollback procedure.
- **Test the full round-trip**: `migrate:fresh` → verify schema → `migrate:rollback` → verify reverse → `migrate` → verify schema matches initial state. This catches incomplete `down()` methods.
- **Preserve data in `down()` where possible**: `down()` should not just drop data. If a column is removed in `up()`, `down()` should recreate it. For data migrations, save original values before transformation.
- **Test data round-trip**: Insert test data → apply migration → verify data is accessible → rollback → verify data is still accessible. This prevents data loss during deployment rollback.
- **Run migration tests sequentially in CI**: Migration tests must NOT run in parallel. Use a dedicated CI job that runs after (not alongside) the main test suite.

# Architecture Guidelines

- **Irreversible migration documentation**: When a migration truly cannot have a `down()`, document it explicitly and have a manual rollback procedure.
- **`down()` completeness**: `down()` should recreate removed columns/tables. It does not need to restore data values (but should try where possible).
- **`migrate:rollback` vs `migrate:fresh` in tests**: Use `migrate:fresh` for normal test setup. Use `migrate:rollback` specifically when testing rollback functionality.
- **Batch boundaries**: Test rollback of full batches (as they run in production), not individual migrations.

# Performance Considerations

- Migration application: 100-5000ms depending on migration count.
- Rollback overhead: Similar to migration (same operations in reverse).
- Schema assertions: Fast (<5ms) for `Schema::hasTable()` / `hasColumn()`.
- Data round-trip: 2x migration time + data operation time.
- Parallel testing: Migration tests should NOT run in parallel.

# Security Considerations

- Rollback of migrations that modified sensitive data could expose old data if not handled correctly.
- Ensure `down()` methods don't inadvertently expose data that was meant to be removed.
- Test that rollback of security-related migrations (PII removal, encryption changes) works correctly.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Missing `down()` method entirely | Developer focuses on forward migration | Migration cannot be rolled back; deployment failure becomes crisis | Every up() has a corresponding down(). CI enforces this |
| Truncating/destroying data in down() instead of preserving | down() drops table without preserving data | Rollback during failed deployment loses production data | down() should preserve data when possible |
| Only testing migrate:fresh, not migrate:rollback | Development workflow uses migrate:fresh | fresh doesn't test down() methods | Run migrate:rollback at least once in CI |
| Ignoring batch boundaries in tests | Testing rollback of single migration | Production rollback reverts entire batch, not individual | Test that full batch rollback works |
| Not testing data round-trip | Only testing schema changes | Data may be lost or corrupted during rollback | Insert data → migrate → rollback → verify data |

# Anti-Patterns

- **No `down()` method**: Writing migrations without rollback capability. Creates deployment risk and makes the team hesitant to deploy.
- **Destructive `down()`**: Dropping tables or columns without preserving data. Causes data loss on rollback.
- **Only testing `migrate:fresh`**: Assuming `migrate:fresh` tests rollback. It drops and recreates — it doesn't execute `down()` methods.
- **Running migration tests in parallel**: Multiple parallel processes running migration tests interfere with each other. Always run sequentially.

# Examples

```php
public function test_migration_rollback_cycle()
{
    // Apply all migrations
    $this->artisan('migrate:fresh')->assertSuccessful();

    // Verify expected tables exist
    $this->assertTrue(Schema::hasTable('users'));
    $this->assertTrue(Schema::hasTable('posts'));

    // Rollback the last batch
    $this->artisan('migrate:rollback')->assertSuccessful();

    // Verify tables from rolled-back batch are gone
    $this->assertFalse(Schema::hasTable('posts'));
    $this->assertTrue(Schema::hasTable('users')); // Earlier batch

    // Re-apply to verify clean state
    $this->artisan('migrate')->assertSuccessful();
    $this->assertTrue(Schema::hasTable('posts'));
}

public function test_migration_data_round_trip()
{
    // Create data with current schema
    $user = User::factory()->create(['name' => 'Test User']);

    // Apply migration that transforms data
    $this->artisan('migrate')->assertSuccessful();

    // Verify data is accessible
    $this->assertDatabaseHas('users', ['id' => $user->id]);

    // Rollback
    $this->artisan('migrate:rollback')->assertSuccessful();

    // Verify data still exists
    $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Test User']);
}
```

# Related Topics

- **Prerequisites**: Laravel migrations, Schema builder, Database design
- **Related**: Database testing lifecycle, CI/CD pipeline integration, Zero-downtime deployment
- **Advanced**: Data migration testing, Custom migration stubs, Deployment rollback automation

# AI Agent Notes

- When writing a new migration, immediately write the `down()` method. Don't leave it as an exercise for "later." Without `down()`, deployment rollback is impossible.
- For data migrations (backfilling, transforming data), the `down()` method must reverse the data transformation. Save original values in a temporary location if needed.
- In CI, create a dedicated "migration test" job that runs after the main test suite. Use `needs: [test]` to ensure it runs sequentially.

# Verification

- [ ] All migrations have functional `down()` methods
- [ ] CI runs `migrate:rollback` test at least once per deployment
- [ ] Migrate → rollback → migrate cycle completes without errors
- [ ] Data round-trip tests verify data preservation during rollback
- [ ] Irreversible migrations are documented with manual rollback procedures
- [ ] Migration tests run in a dedicated sequential CI job (not parallel)
- [ ] `down()` methods preserve data where possible
