# Skill: Implement Concurrent-Safe Find-Or-Create with createOrFirst

## Purpose
Atomically find an existing record or create one without race conditions, preventing duplicate records in concurrent web-facing code paths.

## When To Use
- Registration flows, slug generation, tag creation — any find-or-create in controllers
- Event listeners and queue jobs that may run concurrently
- Idempotent operation handling
- Any code path that may execute concurrently (nearly all web-facing code)

## When NOT To Use
- Truly serial contexts: artisan commands, database seeds, single-worker queue jobs
- Tables without a unique constraint on the match attributes
- Updates to existing records (use `updateOrCreate()` — but note same race condition)
- Bulk processing (use `upsert()`)

## Prerequisites
- Database unique constraint on the match columns
- Laravel 10.20+ (or use `lockForUpdate()` alternative)
- Understanding of race conditions and unique enforcement

## Inputs
- Model class
- Attributes array (columns to match for uniqueness)
- Values array (additional columns to set on creation)
- Unique constraint migration

## Workflow
1. Migrate a unique constraint on the `$attributes` columns
2. Call `Model::createOrFirst($attributes, $values)` for concurrent-safe find-or-create
3. For pre-Laravel 10.20: use `DB::transaction()` + `lockForUpdate()` + manual create
4. For soft-deleted records: add `->whereNull('deleted_at')` before the call
5. Log collisions at `info` level for monitoring concurrency patterns

## Validation Checklist
- [ ] `createOrFirst()` used for all concurrent find-or-create paths
- [ ] `firstOrCreate()` only used in serial contexts with documented guarantee
- [ ] Unique constraint exists on the `$attributes` columns
- [ ] No `firstOrCreate()` on endpoints that may receive concurrent requests
- [ ] Soft-delete handling applied where appropriate
- [ ] `lockForUpdate()` wrapped in `DB::transaction()` if used as alternative

## Common Failures
- Using `firstOrCreate()` without concurrency awareness — duplicate records under load
- Using `createOrFirst()` without unique constraint — silently creates duplicates
- Believing `updateOrCreate()` is safe — same race condition as `firstOrCreate()`
- Not handling soft-deleted records — returns logically deleted model

## Decision Points
- `createOrFirst()` vs `firstOrCreate()`: default to `createOrFirst()` for all web-facing code; use `firstOrCreate()` only in serial contexts with documented guarantee
- `createOrFirst()` vs `lockForUpdate()` alternative: use `createOrFirst()` on Laravel 10.20+; use `DB::transaction()` + `lockForUpdate()` on older versions

## Performance Considerations
- `createOrFirst()` always performs an INSERT first — wasted write load if record exists 90%+ of the time
- Exception handling in `createOrFirst()` is cheap (~1-2μs)
- Index the attributes columns — benefits both methods
- `firstOrCreate()` with `lockForUpdate()` holds row locks, reducing concurrency

## Security Considerations
- `createOrFirst()` prevents duplicate user accounts from race conditions — security-critical in registration flows
- Ensure collision logging does not include sensitive PII data

## Related Rules
- Prefer createOrFirst for Web-Facing Code (performance-and-integrity/first-or-create-vs-create-or-first)
- Always Add a Unique Constraint Before Using createOrFirst (performance-and-integrity/first-or-create-vs-create-or-first)
- Handle Soft-Deleted Records Explicitly (performance-and-integrity/first-or-create-vs-create-or-first)
- Use firstOrCreate Only in Documented Serial Contexts (performance-and-integrity/first-or-create-vs-create-or-first)

## Related Skills
- Implement Atomic Upsert Operations
- Implement Unique Enforcement with Database Constraints
- Implement Pessimistic Locking for Concurrency

## Success Criteria
- No duplicate records created under concurrent load
- Unique constraint exists on all `createOrFirst()` attributes columns
- Collisions logged and monitored
- Soft-delete edge cases handled correctly
