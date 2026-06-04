# Phase 5: Rules — Force Deleting

## Rule 1: Gate `forceDelete()` behind authorization policies with admin-only permissions
---
## Category
Security
---
## Rule
Implement a `forceDelete` policy method that restricts force-delete to authorized admin roles. Do not allow force-delete without explicit authorization.
---
## Reason
`forceDelete()` is irreversible — the record is permanently removed from the database. Without authorization gating, any authenticated user can permanently destroy data that may be needed for recovery, audit, or compliance.
---
## Bad Example
```php
class UserController extends Controller
{
    public function forceDelete(User $user): RedirectResponse
    {
        $user->forceDelete(); // No authorization — any user can permanently delete
    }
}
```
---
## Good Example
```php
class UserPolicy
{
    public function forceDelete(User $actor, User $target): bool
    {
        return $actor->is_admin;
    }
}

class UserController extends Controller
{
    public function forceDelete(User $user): RedirectResponse
    {
        $this->authorize('forceDelete', $user);
        $user->forceDelete();
    }
}
```
---
## Exceptions
Systems where force-delete is intentionally available to all authenticated users for self-service account erasure (GDPR right to erasure).
---
## Consequences Of Violation
Permanent, irreversible data loss by non-admin users; compliance incidents from unauthorized data destruction; lack of accountability.
---

## Rule 2: Always scope to `onlyTrashed()` before bulk force-delete iteration
---
## Category
Reliability
---
## Rule
Prepend `onlyTrashed()` on the query before iterating records for bulk `forceDelete()`. Do not iterate `Model::all()` or an un-scoped query.
---
## Reason
Without `onlyTrashed()`, iteration calls `forceDelete()` on every record in the table, permanently deleting active records. This is a catastrophic data loss scenario.
---
## Bad Example
```php
// CATASTROPHIC: force-deletes ALL users, active or not
User::chunk(100, fn ($users) => $users->each->forceDelete());
```
---
## Good Example
```php
// Safe: only force-deletes trashed records
User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subYear())
    ->each(fn (User $user) => $user->forceDelete());
```
---
## Exceptions
No common exceptions. Never bulk force-delete without `onlyTrashed()`.
---
## Consequences Of Violation
Complete, irreversible deletion of all records in the table; catastrophic production incidents requiring database restore from backup.
---

## Rule 3: Use `forceDeleteQuietly()` in maintenance scripts where event side effects cause errors
---
## Category
Maintainability
---
## Rule
Call `forceDeleteQuietly()` in automated maintenance scripts that do not need event side effects (audit logging, cache clearing, notifications). Do not manually disable event dispatchers.
---
## Reason
`forceDeleteQuietly()` suppresses all model events (`deleting`, `deleted`, `forceDeleting`, `forceDeleted`). This prevents cascading failures from event listeners that may not function correctly in a CLI context (e.g., email notifications failing because mail is not configured).
---
## Bad Example
```php
// Fragile: manually managing event dispatcher
User::getEventDispatcher()->disable();
User::onlyTrashed()->each(fn ($u) => $u->forceDelete());
User::getEventDispatcher()->enable(); // Forgot in catch block?
```
---
## Good Example
```php
// Clean: quiet method handles event suppression
User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subYear())
    ->each(fn (User $user) => $user->forceDeleteQuietly());
```
---
## Exceptions
Maintenance scripts that intentionally need event side effects (e.g., archival during force-delete).
---
## Consequences Of Violation
Event dispatcher left disabled if an exception occurs; unexpected errors from event listeners in CLI context; unwanted side effects like email notifications during maintenance.
---

## Rule 4: Use `isForceDeleting()` in observers to differentiate soft delete from force delete
---
## Category
Maintainability
---
## Rule
Check `$model->isForceDeleting()` inside the `deleting` event to determine whether the operation is a soft delete or a force delete. Do not rely on separate observer methods alone.
---
## Reason
The `deleting` event fires for both soft delete and force delete. Without checking `isForceDeleting()`, the same logic runs for both operations, which may be incorrect (e.g., cascading to related records using `delete()` on a force-delete context).
---
## Bad Example
```php
public function deleting(User $user): void
{
    // Same behavior for both soft and force delete — may be wrong
    Log::info("User {$user->id} deleted");
    $user->posts()->delete(); // Soft-deletes posts even during force delete
}
```
---
## Good Example
```php
public function deleting(User $user): void
{
    if ($user->isForceDeleting()) {
        Log::info("User {$user->id} force deleted");
        $user->posts()->forceDelete(); // Permanently remove children too
    } else {
        Log::info("User {$user->id} soft deleted");
        $user->posts()->delete(); // Soft-delete children
    }
}
```
---
## Exceptions
Models where soft delete and force delete should produce identical side effects.
---
## Consequences Of Violation
Mixed behavior where soft-deleted children are orphaned after parent force-delete, or children are force-deleted when only a soft delete was intended.
---

## Rule 5: Log all force-delete operations for audit compliance
---
## Category
Security
---
## Rule
Capture who performed the force delete, which record was deleted, and when in the `forceDeleted` event. Do not log force deletes only in controllers.
---
## Reason
Force-delete is a destructive, irreversible operation. Audit logging at the controller level misses operations performed through other entry points (queued jobs, Artisan commands, scheduled pruning). The `forceDeleted` event is the single enforcement hook.
---
## Bad Example
```php
// Controller-only logging — misses CLI and other entry points
class UserController extends Controller
{
    public function forceDelete(User $user): RedirectResponse
    {
        $user->forceDelete();
        Log::info("User {$user->id} force deleted by " . auth()->id());
    }
}
```
---
## Good Example
```php
class UserObserver
{
    public function forceDeleted(User $user): void
    {
        Log::warning('User force deleted', [
            'user_id' => $user->id,
            'email' => $user->email,
            'deleted_at' => $user->deleted_at,
            'actor_id' => auth()->id(),
            'actor_ip' => request()->ip(),
        ]);
    }
}
```
---
## Exceptions
Ephemeral models where audit trail is not required.
---
## Consequences Of Violation
Missing audit trail for destructive operations; compliance violations; inability to investigate data loss incidents.
---

## Rule 6: Queue large batch force-deletes to avoid memory exhaustion and request timeouts
---
## Category
Scalability
---
## Rule
Dispatch force-delete operations on large batches (>1,000 records) to a queued job. Do not force-delete large datasets synchronously in a web request.
---
## Reason
Iterating and force-deleting thousands of records in a single request consumes excessive memory, holds database connections open, and risks request timeout. Queued jobs can run in the background with retry logic and progress tracking.
---
## Bad Example
```php
// Web request: force-deleting 50k records synchronously
public function emptyTrash(): RedirectResponse
{
    User::onlyTrashed()->each(fn ($user) => $user->forceDelete());
    // May time out or exhaust memory
}
```
---
## Good Example
```php
class PruneUsersJob implements ShouldQueue
{
    public function handle(): void
    {
        User::onlyTrashed()
            ->where('deleted_at', '<=', now()->subYear())
            ->chunk(100, fn ($users) => $users->each->forceDelete());
    }
}

// Controller dispatches the job
public function emptyTrash(): RedirectResponse
{
    PruneUsersJob::dispatch();
    return redirect()->back()->with('info', 'Trash cleanup started.');
}
```
---
## Exceptions
Single-record force-deletes or small batches (<100 records) performed by an admin in a UI.
---
## Consequences Of Violation
HTTP 504 gateway timeouts; memory exhaustion crashes; failed force-delete operations mid-way through, leaving inconsistent state.
---

## Rule 7: Handle foreign key constraints before force-deleting parent records
---
## Category
Reliability
---
## Rule
Delete or detach related child records before force-deleting a parent if foreign key constraints would prevent the deletion. Do not assume `ON DELETE CASCADE` is configured at the database level.
---
## Reason
`forceDelete()` issues a real `DELETE` statement. If the parent has child records with foreign key constraints (`ON DELETE RESTRICT`), the database rejects the deletion. Without proper child cleanup, the force-delete fails with a foreign key constraint violation.
---
## Bad Example
```php
// Fails if User has posts with foreign key constraint
public function forceDelete(User $user): void
{
    $user->forceDelete(); // Integrity constraint violation
}
```
---
## Good Example
```php
public function forceDelete(User $user): void
{
    DB::transaction(function () use ($user) {
        // Handle children based on requirements
        $user->posts()->each(fn ($post) => $post->forceDelete());
        // Or detach: $user->roles()->detach();
        $user->forceDelete();
    });
}
```
---
## Exceptions
Tables where `ON DELETE CASCADE` is configured and behavior is understood and documented.
---
## Consequences Of Violation
`QueryException` with "Integrity constraint violation" error; partial deletion in inconsistent state; application errors exposed to users.
---

## Rule 8: Never call `forceDelete()` on a query builder directly
---
## Category
Framework Usage
---
## Rule
Call `forceDelete()` only on model instances. Do not attempt to call it on a query builder.
---
## Reason
`forceDelete()` is an instance method on the model, not a builder method. `Model::where(...)->forceDelete()` does NOT exist and throws a `BadMethodCallException`. Bulk force-delete requires iteration over instances or a raw query.
---
## Bad Example
```php
User::where('id', $id)->forceDelete(); // BadMethodCallException
```
---
## Good Example
```php
// Instance approach
$user = User::withTrashed()->findOrFail($id);
$user->forceDelete();

// Bulk approach with iteration
User::onlyTrashed()->each(fn ($user) => $user->forceDelete());

// Or raw query (no events)
DB::table('users')->where('id', $id)->delete();
```
---
## Exceptions
No common exceptions. `forceDelete()` is always instance-only.
---
## Consequences Of Violation
Runtime `BadMethodCallException`; confusion for developers unfamiliar with the API; production errors if not caught in testing.
---

## Rule 9: Do not use `forceDelete()` when data recoverability is required
---
## Category
Design
---
## Rule
Use `delete()` (soft delete) for records that may need recovery. Reserve `forceDelete()` for records that are definitively eligible for permanent removal.
---
## Reason
`forceDelete()` is permanent. Once executed, the record cannot be recovered from the application. The decision to use `forceDelete()` vs `delete()` should be driven by the data lifecycle policy, not convenience.
---
## Bad Example
```php
// Permanent deletion without considering recovery needs
public function destroy(User $user): RedirectResponse
{
    $user->forceDelete(); // User cannot be restored — no recovery possible
}
```
---
## Good Example
```php
// Soft delete with recovery window
public function destroy(User $user): RedirectResponse
{
    $user->delete(); // Recoverable within the pruning window
}

// Force delete only when recovery window has expired
User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subDays(30))
    ->each(fn ($user) => $user->forceDelete());
```
---
## Exceptions
GDPR right-to-erasure requests that require immediate permanent deletion.
---
## Consequences Of Violation
Irrecoverable data loss; user and business dissatisfaction; potential legal consequences if data was deleted prematurely.
---

## Rule 10: Backup before bulk force-delete operations
---
## Category
Reliability
---
## Rule
Create a database backup before running any bulk force-delete operation that affects more than 100 records. Do not rely on soft-delete as the only recovery mechanism.
---
## Reason
Bulk force-delete is irreversible. If the `prunable()` query has a bug (e.g., missing a `where` condition), active records are permanently deleted. A backup provides the only safety net.
---
## Bad Example
```php
Artisan::call('model:prune', ['--model' => User::class]);
// No backup — if prunable() has a bug, data is gone forever
```
---
## Good Example
```php
public function handle(): void
{
    if ($this->option('force')) {
        $this->call('db:backup', ['--database' => 'mysql']); // Pre-backup
    }

    $this->call('model:prune', [
        '--model' => User::class,
        '--pretend' => !$this->option('force'),
    ]);
}
```
---
## Exceptions
Single-record force-deletes or development environments where data loss is acceptable.
---
## Consequences Of Violation
Catastrophic, permanent data loss from a buggy prunable query or a mis-scheduled job; hours or days of recovery time from the last full backup.
