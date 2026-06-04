## Default to createOrFirst for Concurrent Paths
---
## Category
Reliability
---
## Rule
Use `createOrFirst()` for all find-or-create patterns in controllers, event listeners, and queue jobs — any code path that may execute concurrently.
---
## Reason
`firstOrCreate()` has a race window between SELECT and INSERT. Two concurrent requests both see no record and both INSERT — producing duplicates. `createOrFirst()` eliminates the race by inserting first and catching the constraint violation. Every web request is concurrent unless explicitly serialized.
---
## Bad Example
```php
class RegistrationController
{
    public function store(Request $request)
    {
        $user = User::firstOrCreate(
            ['email' => $request->email],
            ['name' => $request->name]
        );
        // Two concurrent requests → two users with the same email
    }
}
```
---
## Good Example
```php
class RegistrationController
{
    public function store(Request $request)
    {
        $user = User::createOrFirst(
            ['email' => $request->email],
            ['name' => $request->name]
        );
        // Concurrent-safe — unique constraint prevents duplicates
    }
}
```
---
## Exceptions
Artisan commands (single invocation), database seeds, and code paths explicitly gated by application-level mutexes.
---
## Consequences Of Violation
Duplicate records in production — duplicate accounts, duplicate tags, duplicate slugs. Data cleanup requires manual database work and may cascade to related records (orders, comments, permissions).
---
## Always Pair createOrFirst with a Unique Constraint
---
## Category
Reliability
---
## Rule
Before deploying code that calls `createOrFirst()`, verify that the matching columns have a database unique constraint.
---
## Reason
`createOrFirst()` detects collisions via `UniqueConstraintViolationException`. Without a unique index on the `$attributes` columns, the INSERT always succeeds — both concurrent writes insert their row, and `createOrFirst()` silently produces duplicates. The constraint is the safety mechanism, not the method.
---
## Bad Example
```php
// No unique constraint on 'slug'
Tag::createOrFirst(['slug' => 'featured'], ['name' => 'Featured']);
// Both concurrent INSERTs succeed — duplicate slugs created
```
---
## Good Example
```php
// Migration: $table->string('slug')->unique();
Tag::createOrFirst(['slug' => 'featured'], ['name' => 'Featured']);
// Second INSERT hits unique constraint → caught → SELECT returns existing
```
---
## Exceptions
No common exceptions. Without the constraint, `createOrFirst()` is unsafe.
---
## Consequences Of Violation
Duplicate records despite using `createOrFirst()`. The developer believed the code was safe, but the missing constraint made it equivalent to `firstOrCreate()` — with the added cost of attempting an INSERT on every call.
---
## Use firstOrCreate Only in Strictly Serial Contexts
---
## Category
Maintainability
---
## Rule
Reserve `firstOrCreate()` for database seeds, artisan commands, and other contexts where serial execution is guaranteed. Document the serial assumption.
---
## Reason
`firstOrCreate()` is safe only when no concurrent execution is possible. These contexts are rare in web applications. Documenting the serial assumption prevents future developers from copying the pattern into concurrent code paths.
---
## Bad Example
```php
public function handle(): void
{
    Tag::firstOrCreate(['slug' => 'featured'], ['name' => 'Featured']);
    // No comment — future developer copies into a controller
}
```
---
## Good Example
```php
public function handle(): void
{
    // Serial: single invocation per deployment, no concurrency possible
    Tag::firstOrCreate(['slug' => 'featured'], ['name' => 'Featured']);
}
```
---
## Exceptions
No common exceptions. Every `firstOrCreate()` outside a seed is a red flag requiring justification.
---
## Consequences Of Violation
Duplicate records introduced when code is copied from seeds into controllers. The original author's intent is invisible, and the regression occurs silently.
---
## Handle Soft-Deleted Records in Find-or-Create
---
## Category
Maintainability
---
## Rule
Add `->whereNull('deleted_at')` before `firstOrCreate()` or `createOrFirst()` when the unique constraint should not match soft-deleted records.
---
## Reason
Both methods query all rows including soft-deleted ones. If the unique constraint covers all rows (including deleted), creating a "new" record matches the deleted one — returning a logically deleted model. The application may then operate on a trashed record unexpectedly.
---
## Bad Example
```php
$user = User::firstOrCreate(['email' => $request->email], $data);
// Returns a soft-deleted user — isTrashed() === true
```
---
## Good Example
```php
$user = User::whereNull('deleted_at')
    ->firstOrCreate(['email' => $request->email], $data);
// Soft-deleted records excluded — creates fresh or returns active
```
---
## Exceptions
Requirements that explicitly enforce uniqueness across all records including deleted ones (e.g., preventing email re-registration).
---
## Consequences Of Violation
Users see stale or logically deleted data. Operations on the "returned" model may fail because it is soft-deleted, producing confusing error messages.
---
## Monitor SQLSTATE[23000] Error Rates
---
## Category
Reliability
---
## Rule
Set up monitoring and alerting on `SQLSTATE[23000]` (unique constraint violation) error rates in production.
---
## Reason
Spikes in unique constraint violations indicate missing `createOrFirst()` calls or broken unique constraints. When a code path that should use `createOrFirst()` uses `firstOrCreate()` instead, the database's unique constraint catches the duplicates — but only because the constraint exists. Monitoring violation rates helps detect these concurrent-unsafe patterns before data cleanup becomes expensive.
---
## Bad Example
```php
// No monitoring — duplicate email entries accumulate silently
// Only detected when a user tries to log in and gets the wrong account
```
---
## Good Example
```php
// In monitoring dashboard:
// Alert when SQLSTATE[23000] rate > 0 per minute for non-migration queries
// Investigate immediately — indicates race condition in application code
```
---
## Exceptions
No common exceptions. Unique constraint violations should be zero in production for non-migration operations.
---
## Consequences Of Violation
Silent accumulation of near-duplicate records because application code does not handle constraint violations gracefully (no `createOrFirst()` retry).
