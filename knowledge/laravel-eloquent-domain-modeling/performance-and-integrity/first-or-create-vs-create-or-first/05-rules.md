## Prefer createOrFirst for Web-Facing Code
---
## Category
Reliability
---
## Rule
Use `createOrFirst()` instead of `firstOrCreate()` for all controllers, event listeners, queue jobs, and any code path that may execute concurrently.
---
## Reason
`firstOrCreate()` has a race window between SELECT and INSERT. Two concurrent requests both see no record and both INSERT — producing duplicates. `createOrFirst()` inserts first and catches the unique constraint violation, eliminating the race window entirely.
---
## Bad Example
```php
// Race condition: two concurrent registration requests both pass the SELECT
// Both see no existing user → both INSERT → duplicate email records
$user = User::firstOrCreate(['email' => $request->email], $data);
```
---
## Good Example
```php
// Concurrent-safe: INSERT first, catch unique violation on collision
$user = User::createOrFirst(['email' => $request->email], $data);
```
---
## Exceptions
Artisan commands (single invocation), database seeds, and single-worker queue jobs where serial execution is guaranteed and documented.
---
## Consequences Of Violation
Duplicate records in production — duplicate user accounts, duplicate tags, duplicate slugs. Data cleanup requires manual intervention and may cascade to related records.
---
## Always Add a Unique Constraint Before Using createOrFirst
---
## Category
Reliability
---
## Rule
Verify that a database unique index exists on the `$attributes` columns before deploying code that calls `createOrFirst()`.
---
## Reason
`createOrFirst()` relies on the database throwing a `UniqueConstraintViolationException` on collision. Without a unique index, the INSERT always succeeds — both concurrent writes insert their row, and `createOrFirst()` silently produces duplicates. The method is only as safe as the constraint.
---
## Bad Example
```php
// No unique constraint on email column
$user = User::createOrFirst(['email' => $request->email], $data);
// Both concurrent INSERTs succeed — duplicate emails created silently
```
---
## Good Example
```php
// Migration: $table->string('email')->unique();
$user = User::createOrFirst(['email' => $request->email], $data);
// Second INSERT hits unique constraint → exception caught → SELECT returns existing
```
---
## Exceptions
No common exceptions. Without the constraint, `createOrFirst()` is not safe and should not be used.
---
## Consequences Of Violation
Duplicate records in production. The developer believed the code was concurrent-safe, but the missing constraint made it equivalent to `firstOrCreate()` — with the extra cost of INSERTs on every call.
---
## Handle Soft-Deleted Records Explicitly
---
## Category
Maintainability
---
## Rule
Add `->whereNull('deleted_at')` before `firstOrCreate()` or `createOrFirst()` when the unique constraint should ignore soft-deleted records.
---
## Reason
`firstOrCreate()` and `createOrFirst()` query all rows including soft-deleted ones. If the unique constraint covers all rows (including deleted), a "new" creation matches the deleted record. If the application allows re-registration, the user gets back a logically deleted model.
---
## Bad Example
```php
// Soft-deleted user with same email is returned as "found"
$user = User::firstOrCreate(['email' => $request->email], $data);
// $user->trashed() === true — unexpected
```
---
## Good Example
```php
$user = User::whereNull('deleted_at')
    ->firstOrCreate(['email' => $request->email], $data);
// Soft-deleted records are excluded from the match
```
---
## Exceptions
Application requirements that explicitly match against all rows including soft-deleted ones (e.g., preventing re-registration with the same email).
---
## Consequences Of Violation
Users see stale or logically deleted data. "Created" records are actually recovered from the trash, and subsequent operations may fail because the model is soft-deleted.
---
## Use firstOrCreate Only in Documented Serial Contexts
---
## Category
Maintainability
---
## Rule
Add a comment documenting the serial execution guarantee whenever using `firstOrCreate()` outside a seed or artisan command.
---
## Reason
`firstOrCreate()` is safe only in truly serial contexts. Without a comment explaining why serial execution is guaranteed, future developers may copy the pattern into concurrent code paths, introducing duplicate-bug regressions.
---
## Bad Example
```php
public function handle(): void
{
    Tag::firstOrCreate(['slug' => 'featured'], ['name' => 'Featured']);
    // No comment — future dev copies this into a controller
}
```
---
## Good Example
```php
public function handle(): void
{
    // Serial: single-worker queue, dispatched once per deployment
    Tag::firstOrCreate(['slug' => 'featured'], ['name' => 'Featured']);
}
```
---
## Exceptions
No common exceptions. Every `firstOrCreate()` should document its serial guarantee.
---
## Consequences Of Violation
Regressions when code is copied into concurrent contexts. The duplicate bug is introduced without the original author's knowledge because the serial assumption is invisible.
