# Skill: Enforce Uniqueness with Database Constraints and createOrFirst

## Purpose
Prevent duplicate records in concurrent scenarios using database unique constraints combined with `createOrFirst()` for safe find-or-create operations.

## When To Use
- Registration flows, slug generation, tag creation in web-facing controllers
- Event listeners and queue jobs that may execute concurrently
- Idempotent operation handling
- Any find-or-create pattern in concurrent contexts

## When NOT To Use
- Serial contexts only: artisan commands, seeds, single-worker queue jobs
- Tables without a unique constraint on the match columns
- Bulk processing (use `upsert()`)

## Prerequisites
- Database unique constraint on matching columns
- Laravel 10.20+ (or `lockForUpdate()` alternative)
- Understanding of race conditions and constraint violation handling

## Inputs
- Model class
- Unique attributes array
- Additional values for creation
- Unique constraint migration

## Workflow
1. Add a database unique index on the columns that define uniqueness
2. Use `createOrFirst($attributes, $values)` instead of `firstOrCreate()` for concurrent paths
3. For pre-Laravel 10.20: use `DB::transaction()` + `lockForUpdate()` + manual create
4. Handle soft-deleted records by adding `->whereNull('deleted_at')`
5. Monitor `SQLSTATE[23000]` error rates in production — spikes indicate missing `createOrFirst()` calls
6. Document all `firstOrCreate()` calls with the serial guarantee

## Validation Checklist
- [ ] `createOrFirst()` used for all concurrent find-or-create paths
- [ ] `firstOrCreate()` only used in serial contexts with documented guarantee
- [ ] Unique constraint exists on attributes columns for every `createOrFirst()` call
- [ ] No `firstOrCreate()` on endpoints that may receive concurrent requests
- [ ] Soft-delete handling applied where appropriate
- [ ] `SQLSTATE[23000]` monitoring configured in production

## Common Failures
- Using `firstOrCreate()` without concurrency awareness — duplicates under load
- Using `createOrFirst()` without unique constraint — silently creates duplicates
- Assuming `updateOrCreate()` is safe — same race condition as `firstOrCreate()`
- Not handling soft-deleted records — returning logically deleted model
- Transaction-less locking alternative — lock released immediately

## Decision Points
- `createOrFirst()` vs `firstOrCreate()`: default to `createOrFirst()` for all concurrent paths; use `firstOrCreate()` only in serial paths with documented guarantee
- This KU vs `first-or-create-vs-create-or-first` KU: this KU focuses on the broader unique enforcement strategy including constraints and monitoring; the other focuses on the specific method comparison

## Performance Considerations
- `createOrFirst()` always executes an INSERT first — wasted write load if record exists 99% of the time
- Exception handling is cheap (~1-2μs for exception creation)
- Index the attributes columns — required for `createOrFirst()`'s unique constraint
- `firstOrCreate()` with `lockForUpdate()` holds row locks, impacting concurrency

## Security Considerations
- `createOrFirst()` prevents duplicate account creation from race conditions — critical in registration flows
- Ensure collision logging does not include sensitive PII data

## Related Rules
- Default to createOrFirst for Concurrent Paths (performance-and-integrity/unique-enforcement)
- Always Pair createOrFirst with a Unique Constraint (performance-and-integrity/unique-enforcement)
- Use firstOrCreate Only in Strictly Serial Contexts (performance-and-integrity/unique-enforcement)
- Handle Soft-Deleted Records in Find-or-Create (performance-and-integrity/unique-enforcement)
- Monitor SQLSTATE[23000] Error Rates (performance-and-integrity/unique-enforcement)

## Related Skills
- Implement Concurrent-Safe Find-Or-Create with createOrFirst
- Implement Atomic Upsert Operations
- Define Database Constraints for Referential Integrity

## Success Criteria
- No duplicate records under concurrent load
- Unique constraints exist on all uniqueness-sensitive columns
- `SQLSTATE[23000]` violations near zero in production
- Soft-delete edge cases handled correctly
