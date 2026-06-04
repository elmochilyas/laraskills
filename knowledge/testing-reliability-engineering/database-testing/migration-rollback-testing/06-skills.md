# Skill: Test Migration Rollback Cycle

## Purpose
Write tests that verify the full migrate → rollback → migrate cycle, including data preservation, ensuring all migrations have functional `down()` methods and can be safely reverted.

## When To Use
- Before every production deployment that includes new migrations
- When writing any migration that modifies existing data or schema
- When introducing zero-downtime deployment
- In CI as a mandatory gate before deployment

## When NOT To Use
- For purely additive migrations (new tables, new columns) with proper `down()` methods
- For database seeders (use seeder testing instead)
- In parallel CI jobs (migration tests must run sequentially)

## Prerequisites
- All migrations have `down()` methods defined
- Database configured (use production-equivalent engine for migration tests)
- Understanding of migration batches and `migrate:rollback` behavior

## Inputs
- Migration files with `up()` and `down()` methods
- Test data that exercises the migration's data transformations
- Expected schema state before and after rollback

## Workflow
1. Ensure every migration has a `down()` method that reverses the `up()` changes — CI should enforce this
2. Write a migration round-trip test: `migrate:fresh` → verify schema → `migrate:rollback` → verify reverse schema → `migrate` → verify schema matches initial state
3. Write a data round-trip test: create test data → apply migration → verify data accessible → rollback → verify data still accessible with original values
4. In `down()` methods, preserve data where possible — recreate columns/tables rather than dropping them
5. Run migration tests in a dedicated sequential CI job (not parallel with other tests)
6. Use `needs: [test]` to ensure migration tests run after (not alongside) the main test suite
7. Document irreversible migrations explicitly with manual rollback procedures

## Validation Checklist
- [ ] All migrations have functional `down()` methods
- [ ] CI runs `migrate:rollback` test at least once per deployment
- [ ] Migrate → rollback → migrate cycle completes without errors
- [ ] Data round-trip tests verify data preservation during rollback
- [ ] Irreversible migrations documented with manual rollback procedures
- [ ] Migration tests run in a dedicated sequential CI job
- [ ] `down()` methods preserve data where possible

## Common Failures
- Missing `down()` method — deployment cannot be reverted
- `down()` drops data instead of preserving it — data loss on rollback
- Only testing `migrate:fresh` — doesn't execute `down()` methods
- Running migration tests in parallel — schema collisions between workers
- Not testing data round-trip — schema is restored but data is lost

## Decision Points
- `migrate:rollback` (reverses last batch, mirrors production) vs `migrate:reset` (reverses all, for development)
- Data preservation in `down()` (reconstruct original data) vs minimal rollback (preserve schema only)
- Dedicated CI job vs inline in main suite — always dedicated, sequential job

## Performance Considerations
- Migration application: 100-5000ms depending on migration count
- Rollback overhead: similar to migration (same operations in reverse)
- Schema assertions: <5ms for `Schema::hasTable()` / `hasColumn()`
- Data round-trip: 2x migration time + data operation time
- Migration tests must NOT run in parallel

## Security Considerations
- Rollback of migrations that modified sensitive data could expose old data
- Ensure `down()` methods don't inadvertently expose data meant to be removed
- Test that rollback of security-related migrations (PII removal, encryption) works correctly

## Related Rules (from 05-rules.md)
- Rule 1: Every `up()` method must have a corresponding `down()` method
- Rule 2: Test the full migrate-rollback-migrate cycle in CI
- Rule 3: Test data round-trip (preserve data across migration → rollback)
- Rule 4: Run migration tests sequentially, never in parallel
- Rule 5: Preserve data in `down()` wherever possible

## Success Criteria
- Every migration's `down()` method correctly reverses `up()`
- Data survives the migration → rollback cycle intact
- CI blocks deployment if migration tests fail
- Irreversible migrations are known exceptions with documented procedures
