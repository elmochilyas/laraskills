# Phase 5: Rules — Restoring

## Rule 1: Validate unique constraints before calling `restore()`
---
## Category
Reliability
---
## Rule
Check for unique constraint conflicts before calling `restore()`. Do not attempt restore and catch the exception.
---
## Reason
Restoring a record with a unique value that was reused by another active record throws a `QueryException`. Pre-validation provides a clear error message to the user instead of a 500 error.
---
## Bad Example
```php
public function restore(User $user): RedirectResponse
{
    try {
        $user->restore();
        return redirect()->back()->with('success', 'User restored.');
    } catch (QueryException $e) {
        // Caught after the fact — user sees a generic error
        return redirect()->back()->with('error', 'Cannot restore due to conflict.');
    }
}
```
---
## Good Example
```php
public function restore(User $user): RedirectResponse
{
    if (User::where('email', $user->email)->exists()) {
        return redirect()->back()->with('error', 'Cannot restore: email already in use by another active user.');
    }

    $user->restore();
    return redirect()->back()->with('success', 'User restored.');
}
```
---
## Exceptions
Models without unique constraints, or when using UUID primary keys with partial unique indexes that make conflicts impossible.
---
## Consequences Of Violation
500 errors for end users; confusing or non-actionable error messages; data inconsistency if the restore partially succeeds.
---

## Rule 2: Always use `onlyTrashed()` before builder-level `restore()`
---
## Category
Reliability
---
## Rule
Scope bulk restore queries with `onlyTrashed()`. Do not call builder-level `restore()` without it.
---
## Reason
Builder-level `restore()` without `onlyTrashed()` matches all records in the query. If the query accidentally includes non-trashed records, the restore still succeeds (no-op for active records), but the developer's intent is unclear and the query may be catching records it shouldn't.
---
## Bad Example
```php
User::where('team_id', $teamId)->restore();
// In theory: restores all trashed users in a team
// In practice: matches both active and trashed — active records are a no-op
```
---
## Good Example
```php
User::onlyTrashed()
    ->where('team_id', $teamId)
    ->restore(); // Clearly scoped to only trashed records
```
---
## Exceptions
No common exceptions. Always scope bulk restore to `onlyTrashed()`.
---
## Consequences Of Violation
Accidental restore of records that should remain deleted; developer confusion about the query's scope and behavior.
---

## Rule 3: Use per-instance `restore()` when model events are required; use builder-level `restore()` when they are not
---
## Category
Performance
---
## Rule
Choose between instance-level and builder-level `restore()` based on whether per-record event dispatching is needed. Do not default to one or the other without consideration.
---
## Reason
Instance-level `restore()` fires `restoring`/`restored` events for each record. Builder-level `restore()` issues a single `UPDATE` query and fires zero model events. Using instance-level for bulk operations is O(n) queries and events; using builder-level when events are needed skips critical business logic.
---
## Bad Example
```php
// Bulk restore where events ARE needed — uses builder-level, events are lost
User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subDays(30))
    ->restore(); // No events fired — audit logging and cascading skipped
```
---
## Good Example
```php
// No events needed — bulk builder restore for performance
User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subDays(30))
    ->restore();

// Events needed — per-instance restore
User::onlyTrashed()
    ->where('deleted_at', '<=', now()->subDays(30))
    ->each(fn (User $user) => $user->restore());
```
---
## Exceptions
No common exceptions. The choice depends on event requirements.
---
## Consequences Of Violation
Missing audit logs, skipped cascading restores, broken business rules, or excessive query overhead (instance-level for 10k records = 10k queries).
---

## Rule 4: Implement a `restoring` event listener as a gate for business rules
---
## Category
Security
---
## Rule
Use the `restoring` event (returning `false`) to enforce business rules that should prevent restore. Do not validate restore eligibility only at the controller level.
---
## Reason
Controller-level checks can be bypassed by other code paths (queued jobs, Artisan commands, Tinker sessions). The `restoring` event provides a single enforcement point at the model layer that applies universally.
---
## Bad Example
```php
// Controller-only validation — bypassable via other entry points
class UserController extends Controller
{
    public function restore(User $user): RedirectResponse
    {
        if ($user->email && User::where('email', $user->email)->exists()) {
            return redirect()->back()->withErrors(['email' => 'Email already taken.']);
        }
        $user->restore();
    }
}
```
---
## Good Example
```php
// Model-level enforcement — applies everywhere
class UserObserver
{
    public function restoring(User $user): ?bool
    {
        if ($user->email && User::where('email', $user->email)->exists()) {
            return false; // Cancel restore regardless of entry point
        }
        return true;
    }
}
```
---
## Exceptions
When business rules intentionally vary by context (e.g., admin can restore without email conflict, regular users cannot).
---
## Consequences Of Violation
Bypassed validation through alternative entry points; inconsistent restore behavior; potential data integrity issues from restoring conflicting records.
---

## Rule 5: Log restore actions in the `restored` event for audit trail
---
## Category
Security
---
## Rule
Capture audit information (who restored, what was restored, when, and why) in the `restored` event handler. Do not log restore actions only at the controller level.
---
## Reason
Audit logging at the controller level misses restores performed through other code paths (Artisan commands, jobs, schedule tasks). The `restored` event is the single hook that captures all restore operations regardless of entry point.
---
## Bad Example
```php
// Controller-only audit logging
class UserController extends Controller
{
    public function restore(User $user): RedirectResponse
    {
        $user->restore();
        Log::info("User {$user->id} restored by user " . auth()->id()); // Misses CLI restores
    }
}
```
---
## Good Example
```php
// Observer-based audit logging — captures all entry points
class UserObserver
{
    public function restored(User $user): void
    {
        Log::info('User restored', [
            'user_id' => $user->id,
            'restored_at' => now(),
            'actor_id' => auth()->id(), // Nullable for CLI contexts
        ]);
    }
}
```
---
## Exceptions
Ephemeral models where auditing is not required.
---
## Consequences Of Violation
Incomplete audit trail; compliance gaps; inability to trace who performed a restore in non-HTTP contexts.
---

## Rule 6: Use `restoreQuietly()` in maintenance scripts where event side effects are unwanted
---
## Category
Maintainability
---
## Rule
Call `restoreQuietly()` in maintenance and data-migration scripts that should not trigger event listeners. Do not temporarily disable event listeners as a workaround.
---
## Reason
Temporarily disabling event listeners is fragile and easy to forget to re-enable. `restoreQuietly()` provides an explicit, localized way to suppress events for a single operation without affecting the broader application state.
---
## Bad Example
```php
// Fragile: disabling events manually
public function handle(): void
{
    User::getEventDispatcher()->disable();
    User::onlyTrashed()->each(fn ($u) => $u->restore());
    User::getEventDispatcher()->enable();
    // If this throws, events remain disabled for the rest of the request
}
```
---
## Good Example
```php
// Clean: restoreQuietly for each record
public function handle(): void
{
    User::onlyTrashed()->each(fn (User $user) => $user->restoreQuietly());
}
```
---
## Exceptions
Batch operations where calling `restoreQuietly()` on each record is a performance concern — consider builder-level `restore()` or a transactional approach.
---
## Consequences Of Violation
Event listeners firing during maintenance scripts, causing cascading side effects (unexpected notifications, cache clears); fragile code that may leave events disabled on failure.
---

## Rule 7: Wrap restore in a database transaction with row locking for race condition protection
---
## Category
Reliability
---
## Rule
Use `DB::transaction()` with `lockForUpdate()` on the record before restoring. Do not call `restore()` without concurrency protection when concurrent restore/delete operations are possible.
---
## Reason
Without locking, two concurrent requests can both pass the unique constraint check and attempt restore, or a force-delete can happen between the check and the restore. `lockForUpdate()` acquires a pessimistic lock that serializes access.
---
## Bad Example
```php
// Race condition window between check and restore
$user = User::onlyTrashed()->find($id);
if (!User::where('email', $user->email)->exists()) {
    $user->restore(); // Another request may have restored or re-created the email
}
```
---
## Good Example
```php
DB::transaction(function () use ($id) {
    $user = User::onlyTrashed()->lockForUpdate()->findOrFail($id);

    if (User::where('email', $user->email)->where('id', '!=', $id)->exists()) {
        throw new ConflictException('Email already taken.');
    }

    $user->restore();
});
```
---
## Exceptions
Single-user systems or models without unique constraints where concurrent access is impossible.
---
## Consequences Of Violation
Duplicate unique values causing `QueryException` on restore; silent data corruption from interleaved operations; inconsistent state under concurrent load.
---

## Rule 8: Use the `wasRestored` property to determine if state actually changed
---
## Category
Maintainability
---
## Rule
Check the `$model->wasRestored` property after calling `restore()` to determine if the record was actually restored. Do not rely solely on the boolean return value.
---
## Reason
`restore()` returns `true` even when called on a non-trashed model (no-op). The `wasRestored` property is `true` only when the model's `deleted_at` was actually changed from a non-null to null value.
---
## Bad Example
```php
$user = User::find(1); // Active record, not trashed
$result = $user->restore();
// $result is true, but nothing changed
flash()->success('User restored!'); // Misleading message
```
---
## Good Example
```php
$user = User::withTrashed()->find(1);
$user->restore();

if ($user->wasRestored) {
    flash()->success('User restored!');
    Log::info("User {$user->id} was restored");
} else {
    flash()->info('User was already active.');
}
```
---
## Exceptions
No common exceptions. Always check `wasRestored` when displaying feedback to users.
---
## Consequences Of Violation
Misleading success messages displayed to users; unnecessary audit log entries for no-op restores.
---

## Rule 9: Treat restore as a separate permission in authorization policies
---
## Category
Security
---
## Rule
Implement a separate `restore` method in model policies. Do not reuse `update` or `delete` permissions for restore actions.
---
## Reason
Restore is a distinct capability: it creates a previously-deleted active record, which may affect other users (e.g., re-adding to shared resources). Combining it with `update` or `delete` grants unauthorized restore access or requires overly permissive roles.
---
## Bad Example
```php
class UserPolicy
{
    public function update(User $actor, User $target): bool
    {
        return $actor->is_admin;
    }
}

// Controller checks update permission for restore
$this->authorize('update', $user); // Incorrect: update permission should not gate restore
```
---
## Good Example
```php
class UserPolicy
{
    public function restore(User $actor, User $target): bool
    {
        return $actor->is_admin;
    }
}

// Controller checks restore permission
$this->authorize('restore', $user); // Correct: dedicated restore gate
```
---
## Exceptions
Systems where the authorization model intentionally treats restore as a subtype of update (rare).
---
## Consequences Of Violation
Unauthorized users gaining the ability to restore records; security gaps in permission auditing; difficulty implementing granular restore-only roles.
---

## Rule 10: Implement a `restored` listener to cascade restore to related soft-deleted children
---
## Category
Reliability
---
## Rule
Cascade restore to soft-deleted children in the parent's `restored` event handler. Do not leave child records orphaned after parent restore.
---
## Reason
Parent restore does not automatically restore children. If children were soft-deleted when the parent was deleted, they remain in the trashed state after parent restore. This creates an inconsistent state where the parent is active but children are inaccessible.
---
## Bad Example
```php
class User extends Model
{
    use SoftDeletes;
    // No cascade — posts remain trashed after user restore
}
```
---
## Good Example
```php
class UserObserver
{
    public function restored(User $user): void
    {
        $user->posts()->onlyTrashed()->restore();
    }
}

// Or in the model itself:
class User extends Model
{
    use SoftDeletes;

    protected static function booted(): void
    {
        static::restored(function (User $user) {
            $user->posts()->onlyTrashed()->restore();
        });
    }
}
```
---
## Exceptions
Children that should remain deleted even after parent restore (e.g., children that were independently deleted after parent deletion).
---
## Consequences Of Violation
Orphaned child records that are invisible through standard queries; data integrity issues; incomplete data sets after restore operations.
