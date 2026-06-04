# firstOrCreate vs createOrFirst

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | first-or-create-vs-create-or-first |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

`firstOrCreate()` and `createOrFirst()` both find a record or create one if it doesn't exist, but they differ fundamentally in concurrency safety. `firstOrCreate()` uses a check-then-act pattern vulnerable to race conditions, while `createOrFirst()` uses an act-then-handle-collision pattern that is race-condition safe. Understanding this distinction is critical for any code path that may execute concurrently.

## Core Concepts

- **`firstOrCreate()` flow**: `SELECT ... WHERE attributes` → if null → `INSERT ...`. Race window exists between SELECT and INSERT.
- **`createOrFirst()` flow**: `INSERT ...` → on unique constraint violation → `SELECT ...`. No race window — INSERT is the first operation, and the database's unique constraint provides atomic collision detection.
- **Race window**: The gap between SELECT and INSERT in `firstOrCreate()`. Under load, two concurrent requests both see no record and both insert — producing duplicates.
- **Unique constraint requirement**: `createOrFirst()` is only safe when the attributes columns have a unique constraint. Without it, the INSERT succeeds for both concurrent requests, producing duplicates.

## When To Use

- `createOrFirst()` for all web-facing code paths where concurrent requests may create the same record (user registration, slug generation, tag creation, queue job deduplication)
- `firstOrCreate()` in truly serial contexts: database seeds, artisan commands, single-worker queue jobs, or code paths protected by explicit locking

## When NOT To Use

- `firstOrCreate()` on any path that may execute concurrently without explicit locking
- `createOrFirst()` without first verifying a unique constraint exists on the attributes columns
- Either method when you need to update existing records (use `updateOrCreate()`, but note it has the same race condition as `firstOrCreate()`)

## Best Practices

- **Prefer `createOrFirst()` by default for web-facing code**: Every web request is concurrent unless you have explicitly serialized access. `createOrFirst()` is the safe default for any find-or-create path in controllers, jobs, or event listeners. Reserve `firstOrCreate()` for artisan commands, seeds, or code gated by explicit locking.
- **Always migrate a unique constraint before using `createOrFirst()`**: The method is only as safe as the database constraint it relies on. Before deploying `createOrFirst()` calls, audit the migration to ensure a unique constraint exists on the `$attributes` columns. Without it, `createOrFirst()` silently produces duplicates.
- **Log `createOrFirst()` collisions at `info` level**: Collisions indicate concurrent access. Logging them provides visibility into concurrency patterns and can help identify performance bottlenecks or unexpected contention.

## Architecture Guidelines

- Use `createOrFirst()` for registration, invitation acceptance, and any "claim this resource" flow
- Use `firstOrCreate()` for admin panel creation where access is serial per user
- Use `firstOrCreate()` with `lockForUpdate()` inside a transaction as an alternative concurrent-safe pattern in codebases that cannot upgrade to Laravel 10.20+
- Monitor for duplicates via `SELECT attributes, COUNT(*) GROUP BY HAVING COUNT(*) > 1` on tables using `firstOrCreate()`

## Performance Considerations

- `createOrFirst()` always performs an INSERT first — for endpoints where the record already exists 90%+ of the time, this is wasted write load
- `firstOrCreate()` with `lockForUpdate()` is race-safe but holds row locks, reducing concurrency under contention
- Exception handling in `createOrFirst()` is cheap (~1-2μs for exception creation) and try-catch overhead without exception is near zero
- Index the attributes columns — benefits both methods and is required for `createOrFirst()`'s unique constraint

## Security Considerations

- `createOrFirst()` prevents duplicate user accounts/enrollments from race conditions — this is a security concern in registration flows
- Ensure `createOrFirst()` collision logging does not include sensitive PII data

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `firstOrCreate()` without concurrency awareness | Assuming serial execution | Duplicate records under load | Use `createOrFirst()` |
| Using `createOrFirst()` without unique constraint | Skipping migration review | Silently creates duplicates | Verify unique constraint exists first |
| Believing `updateOrCreate()` is safe | Same base implementation | Same race condition | Use `createOrFirst()` with separate update or locking |
| Not handling soft-deleted records | `firstOrCreate()` matches soft-deleted rows | Returns logically deleted record | Add `->whereNull('deleted_at')` |

## Anti-Patterns

- **Blind `firstOrCreate()`**: Using `firstOrCreate()` throughout the codebase without considering concurrency. Nearly all web-facing code paths are concurrent.
- **`createOrFirst()` without constraint**: Using `createOrFirst()` on a table without a unique constraint. The method silently produces duplicates — the constraint is the safety mechanism.
- **Transaction-less locking alternative**: Using `lockForUpdate()` without wrapping in `DB::transaction()`. The lock is released immediately, providing zero protection.

## Examples

```php
// Safe concurrent registration — use createOrFirst
$user = User::createOrFirst(
    ['email' => $request->email],
    ['name' => $request->name, 'password' => bcrypt($request->password)]
);

// Unsafe — firstOrCreate race window
$user = User::firstOrCreate(
    ['email' => $request->email],
    ['name' => $request->name, 'password' => bcrypt($request->password)]
);

// Safe serial path — artisan command, no concurrency
public function handle(): void
{
    Tag::firstOrCreate(['slug' => 'featured'], ['name' => 'Featured']);
}

// Transaction-based alternative for pre-Laravel 10.20
DB::transaction(function () use ($email, $data) {
    $user = User::lockForUpdate()->where('email', $email)->first();
    return $user ?? User::create(array_merge(['email' => $email], $data));
});
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | unique-enforcement |
| Prerequisite | database-constraints |
| Closely Related | concurrency-handling |
| Closely Related | upsert-patterns |
| Closely Related | select-constraints |

## AI Agent Notes

- Generate `createOrFirst()` by default for find-or-create in concurrent contexts
- Always add a migration with a unique constraint when generating `createOrFirst()` code
- Use `firstOrCreate()` only in artisan commands, seeds, or explicitly serialized paths
- Never generate `lockForUpdate()` outside a `DB::transaction()` closure

## Verification

- [ ] `createOrFirst()` is used for all concurrent find-or-create paths (controllers, event listeners, jobs)
- [ ] `firstOrCreate()` is only used in serial contexts (artisan commands, seeds, gated by locking)
- [ ] Unique constraint exists on the `$attributes` columns for every `createOrFirst()` call
- [ ] No `firstOrCreate()` is used on endpoints that may receive concurrent requests
- [ ] Soft-delete handling is applied where `firstOrCreate()` or `createOrFirst()` could match logically deleted records
