# Unique Enforcement

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Unique Enforcement |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Unique enforcement deals with atomically finding or creating records that satisfy uniqueness constraints. `firstOrCreate()` and `createOrFirst()` (Laravel 10.20+) are the two primary methods. `firstOrCreate()` is vulnerable to duplicate rows in concurrent scenarios because SELECT and INSERT are separate operations. `createOrFirst()` leverages database unique constraints to handle collisions atomically.

## Core Concepts

- **`firstOrCreate($attributes, $values)`**: SELECT → if null → INSERT. Race window exists between the two operations.
- **`createOrFirst($attributes, $values)`**: INSERT → on unique constraint violation → SELECT. No race window — INSERT is the first operation.
- **`firstOrNew($attributes, $values)`**: Returns a new unsaved model instance. No race protection until `save()`.
- **`updateOrCreate($attributes, $values)`**: Has the same race condition as `firstOrCreate()`.
- **Unique constraint dependency**: `createOrFirst()` requires a database unique index on the matched columns. Without it, duplicates are inserted silently.

## When To Use

- `createOrFirst()` for all web-facing code paths (controllers, event listeners, queue jobs) where concurrent requests may create the same record
- `firstOrCreate()` for serial contexts only (database seeds, artisan commands, single-worker jobs)
- `createOrFirst()` for idempotent registration, slug generation, tag creation on-the-fly

## When NOT To Use

- `firstOrCreate()` on any path that may execute concurrently without explicit locking
- `createOrFirst()` without first verifying a unique constraint exists on the attributes columns
- Either method when you need bulk processing (use `upsert()`)

## Best Practices

- **Default to `createOrFirst()` for all concurrent paths**: Every web request is concurrent. Unless you have explicitly serialized access (mutex, single-worker queue), `firstOrCreate()` has a race window. `createOrFirst()` is the safe default for registration, slug generation, role assignment, and any find-or-create pattern in controllers, event listeners, or jobs.
- **Always pair `createOrFirst()` with a unique constraint migration**: `createOrFirst()` is only as safe as the database constraint it relies on. The method detects collisions via `UniqueConstraintViolationException` — without a unique index, no exception is thrown and duplicates are inserted. Before deploying `createOrFirst()`, audit the migration to ensure the unique constraint exists.
- **Use `firstOrCreate()` only in strictly serial contexts**: Artisan commands (single invocation), database seeds, and single-worker queue jobs where you control execution concurrency. Document the serial assumption in a comment so future developers don't treat it as a safe pattern.
- **Handle soft-deleted records explicitly**: `firstOrCreate()` matches soft-deleted rows. If the unique constraint only enforces uniqueness among active records, add `->whereNull('deleted_at')` before the call.

## Architecture Guidelines

- Use `createOrFirst()` over `firstOrCreate()` as the default choice for new code
- Reserve `firstOrCreate()` for seeds, migrations, and explicitly serialized commands
- For pre-Laravel 10.20 codebases, use `firstOrCreate()` with `lockForUpdate()` inside a transaction
- Monitor `SQLSTATE[23000]` error rates — spikes may indicate missing unique constraints

## Performance Considerations

- `createOrFirst()` always executes an INSERT first — for hot paths where the record exists 99% of the time, this adds unnecessary write load
- `firstOrCreate()` with `lockForUpdate()` inside a transaction holds row locks, impacting concurrency
- Exception handling in `createOrFirst()` is cheap (~1-2μs for exception creation); try-catch without exception is near zero overhead
- Index the attributes columns — benefits both methods and is required for `createOrFirst()`'s unique constraint

## Security Considerations

- `createOrFirst()` prevents duplicate account creation from race conditions — this is a security concern in registration flows
- Ensure `createOrFirst()` collision logging does not include sensitive PII data

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `firstOrCreate()` without concurrency awareness | Assuming serial execution | Duplicate records under load | Use `createOrFirst()` |
| Using `createOrFirst()` without unique constraint | Skipping migration audit | Silently creates duplicates | Verify unique constraint exists |
| Assuming `updateOrCreate()` is safe | Same base implementation | Same race condition | Use `createOrFirst()` or manual locking |
| Not handling soft-deleted records | Matching on all rows | Returns logically deleted record | Add `->whereNull('deleted_at')` |

## Anti-Patterns

- **Blind `firstOrCreate()`**: Using `firstOrCreate()` throughout the codebase without considering concurrency. Nearly all web-facing code paths are concurrent.
- **`createOrFirst()` without constraint**: Using `createOrFirst()` on a table without a unique constraint. The method silently produces duplicates.
- **Transaction-less locking alternative**: Using `lockForUpdate()` without wrapping in `DB::transaction()`. The lock is released immediately.

## Examples

```php
// Concurrent-safe registration
$user = User::createOrFirst(
    ['email' => $request->email],
    ['name' => $request->name, 'password' => bcrypt($request->password)]
);

// Serial-only — database seed
public function run(): void
{
    Tag::firstOrCreate(['slug' => 'featured'], ['name' => 'Featured']);
}

// Pre-Laravel 10.20 alternative with locking
DB::transaction(function () use ($email, $data) {
    $user = User::lockForUpdate()->where('email', $email)->first();
    return $user ?? User::create(array_merge(['email' => $email], $data));
});

// Soft-delete aware
$user = User::whereNull('deleted_at')
    ->firstOrCreate(['email' => $email], $data);
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | database-constraints |
| Prerequisite | Model creation basics |
| Closely Related | first-or-create-vs-create-or-first |
| Closely Related | upsert-patterns |
| Closely Related | concurrency-handling |

## AI Agent Notes

- Generate `createOrFirst()` by default for find-or-create patterns in concurrent contexts
- Always add a migration with a unique constraint when generating `createOrFirst()` code
- Use `firstOrCreate()` only in seeds, artisan commands, or explicitly serialized paths
- Never generate `lockForUpdate()` outside a `DB::transaction()` closure

## Verification

- [ ] `createOrFirst()` is used for all concurrent find-or-create paths (controllers, event listeners, jobs)
- [ ] `firstOrCreate()` is only used in serial contexts (artisan commands, seeds, sections with explicit locking)
- [ ] Unique constraint exists on the `$attributes` columns for every `createOrFirst()` call
- [ ] No `firstOrCreate()` is used on endpoints that may receive concurrent requests
- [ ] Soft-delete handling is applied where appropriate
