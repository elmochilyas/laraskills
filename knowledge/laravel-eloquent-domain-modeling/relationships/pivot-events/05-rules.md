# Pivot Events Rules

## Rule: PivotEvent-Attaching-For-Validation
---
## Category
Reliability
---
## Rule
Use the `attaching` (pre-event) for validation and authorization — throw an exception to abort the operation.
---
## Reason
Pre-events fire before the database write. Throwing in the handler prevents the attach/detach from occurring, providing a clean validation mechanism.
---
## Bad Example
```php
// Using post-event (attached) for validation — too late
Event::listen(Attached::class, function ($event) {
    if ($event->parent->roles()->count() > 10) {
        // Role already attached — can't rollback easily
    }
});
```
---
## Good Example
```php
Event::listen(Attaching::class, function ($event) {
    if ($event->parent instanceof User && $event->parent->roles()->count() >= 10) {
        throw new \RuntimeException('Maximum roles exceeded');
    }
});
```
---
## Exceptions
When validation is handled at the application service layer before calling `attach()`.
---
## Consequences Of Violation
Invalid data persisted, authorization bypass, inconsistent application state.

## Rule: PivotEvent-Post-For-Side-Effects
---
## Category
Architecture
---
## Rule
Use `attached`/`detached`/`updated` (post-events) for side effects like cache invalidation, logging, and notification dispatching.
---
## Reason
Post-events fire after the database write is confirmed. This ensures side effects only execute on successful operations, preventing cache invalidation on failed writes.
---
## Bad Example
```php
Event::listen(Attaching::class, function ($event) {
    Cache::forget("roles_{$event->parent->id}");
    // Cache cleared even if attach fails
});
```
---
## Good Example
```php
Event::listen(Attached::class, function ($event) {
    Cache::forget("roles_{$event->parent->id}");
    // Only clears cache after successful attach
});
```
---
## Exceptions
When clearing cache before the operation is intentional (e.g., optimistic clearing).
---
## Consequences Of Violation
Stale cache after failed operations, inconsistent state between cache and database.

## Rule: PivotEvent-Queue-Heavy-Listeners
---
## Category
Performance
---
## Rule
Dispatch queued jobs from pivot event listeners instead of performing heavy operations synchronously.
---
## Reason
Pivot event listeners run synchronously during the HTTP request. Long-running listeners block the response, degrading user experience.
---
## Bad Example
```php
Event::listen(Attached::class, function ($event) {
    Mail::send(...); // Synchronous email — blocks request
    Notification::send(...); // More blocking
});
```
---
## Good Example
```php
Event::listen(Attached::class, function ($event) {
    SendRoleAssignedNotification::dispatch($event->parent, $event->pivotIds);
});
```
---
## Exceptions
When the side effect is fast (cache invalidation, logging).
---
## Consequences Of Violation
Slow API responses, HTTP timeouts, poor user experience.

## Rule: PivotEvent-Sync-Is-Batched
---
## Category
Framework Usage
---
## Rule
Do not expect per-row event granularity from `sync()` — events are batched per operation type (one insert event, one delete event).
---
## Reason
`sync()` computes the diff and fires one event per unique operation type, not per individual pivot row change. For per-row granularity, iterate and use `attach()`/`detach()` individually.
---
## Bad Example
```php
$user->roles()->sync([1, 2, 3, 4, 5]);
// Expecting 5 attached events — only 1 fires (if all are inserts)
```
---
## Good Example
```php
// For per-row events, iterate manually
collect([1, 2, 3])->each(fn ($id) => $user->roles()->attach($id));
```
---
## Exceptions
When batched event granularity is sufficient.
---
## Consequences Of Violation
Missing per-row audit trail, incorrect assumptions about event frequency.

## Rule: PivotEvent-Register-In-ServiceProvider
---
## Category
Code Organization
---
## Rule
Register pivot event listeners in the `EventServiceProvider` `$listen` array, not inline in controller or service code.
---
## Reason
Inline registration scatters event handling logic across the codebase. Centralized registration in `EventServiceProvider` makes event handling discoverable and maintainable.
---
## Bad Example
```php
// Controller — hidden side effect
Event::listen(Attached::class, fn ($e) => Log::info('attached'));
$user->roles()->attach($roleId);
```
---
## Good Example
```php
// EventServiceProvider
protected $listen = [
    Attached::class => [LogRoleAttachment::class],
];
```
---
## Exceptions
When tests need temporary local listeners.
---
## Consequences Of Violation
Scattered logic, hard-to-find side effects, maintenance burden.

## Rule: PivotEvent-Model-Observers-Dont-Fire
---
## Category
Framework Usage
---
## Rule
Do not expect custom pivot model observers to fire during `attach()`/`detach()` — they only fire on explicit `$pivot->save()`.
---
## Reason
`attach()` and `detach()` insert/delete pivot rows at the query builder level. They do not instantiate pivot models or call their lifecycle events.
---
## Bad Example
```php
// MembershipObserver::created — never fires
$user->teams()->attach($teamId);
```
---
## Good Example
```php
// Use pivot events for attach/detach side effects
Event::listen(Attached::class, LogTeamMembership::class);
```
---
## Exceptions
When manually calling `$pivot->save()` on an existing pivot instance.
---
## Consequences Of Violation
Missing observer logic, broken audit trails, unexpected event behavior.

## Rule: PivotEvent-Test-With-Event-Fake
---
## Category
Testing
---
## Rule
Use `Event::fake()` in tests to assert pivot events were dispatched without executing handlers.
---
## Reason
Pivot events have side effects (logging, caching, notifications). `Event::fake()` allows asserting the event was dispatched without triggering those side effects in tests.
---
## Bad Example
```php
public function test_attach_role(): void
{
    $user->roles()->attach($roleId);
    $this->assertDatabaseHas('role_user', ['user_id' => $user->id]);
    // No assertion that pivot event fired
}
```
---
## Good Example
```php
public function test_attach_role_fires_event(): void
{
    Event::fake();
    $user->roles()->attach($roleId);
    Event::assertDispatched(Attached::class, function ($event) use ($user, $roleId) {
        return $event->parent->is($user) && $event->pivotIds === [$roleId];
    });
}
```
---
## Exceptions
When testing the side effect logic itself.
---
## Consequences Of Violation
Missing coverage for event-driven behavior, regressions in side effects.
