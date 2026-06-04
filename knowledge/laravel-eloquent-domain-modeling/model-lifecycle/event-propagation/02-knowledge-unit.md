# Event Propagation

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
Event propagation in Eloquent refers to the mechanism by which model events either continue to subsequent listeners or halt the entire operation. The core rule: returning `false` from a `*ing` (before) event listener prevents the database operation and stops further event propagation. After-events (`*ed`) cannot halt propagation. This halting mechanism is the primary control surface for aborting model operations from event listeners.

## Core Concepts
- **Halting events:** Only `*ing` events (saving, creating, updating, deleting, trashing, restoring, forceDeleting) can halt propagation by returning `false`.
- **Non-halting events:** `*ed` events (saved, created, updated, deleted, trashed, restored, forceDeleted, retrieved, booting, booted, replicating) cannot halt; their return values are ignored.
- **Propagation scope:** Halting stops both the event dispatch loop (no further listeners for the same event) AND the database operation. It does NOT stop unrelated events in the same chain.
- **True return vs. no return:** Any return value other than `false` (including `null`, `true`, a string, or no explicit return) allows propagation to continue.

## Mental Models
- **Circuit breaker:** A `*ing` listener is a circuit breaker. When it trips (`false`), power (execution) stops for the entire operation, not just that listener. The circuit cannot be reset mid-chain.
- **Veto power:** Think of before-events as having veto power. Any single listener can veto the operation. After-events are notifications â€” they can observe but not veto.
- **Gate check:** The event system runs each `*ing` event through all registered listeners in order. If any listener returns `false`, the gate closes. Subsequent listeners of the same event never execute.

## Internal Mechanics

> **Reference:** 
- `fireModelEvent($event)` loops through all registered listeners for the given event name. It calls `$dispatcher->until($event, $payload)` which dispatches the event and returns the first non-null response.
- `$dispatcher->until()` iterates listeners. If a listener returns a value (not null), `until()` returns that value immediately, skipping remaining listeners.
- Back in `fireModelEvent()`, if the returned value === `false`, the method returns `false`. The calling method (`performInsert`, `performUpdate`, `delete`, etc.) checks this and aborts.
- The event dispatcher's `until()` method is key: it short-circuits on the first non-null return. This means only the first listener that returns `false` (or any non-null value) is the halting point â€” listeners registered later never execute.

```
// Simplified fireModelEvent logic:
$result = $this->getEventDispatcher()->until("eloquent.{$event}: {$this}", $this);
if ($result === false) { return false; }
return true;
```

- For `*ed` events, `fireModelEvent()` is called with `dispatch()` (not `until()`), which fires all listeners and ignores return values.

## Patterns
- **Validation gate pattern:** Return `false` from `saving` or `creating` when business rules are violated. The listener throws no exception â€” it simply prevents persistence. This is cleaner than throwing `ValidationException` in an event context.
- **Authorization gate pattern:** Check user permissions in `deleting` and return `false` to prevent unauthorized deletions. Combine with policy gates for defense-in-depth.
- **Conditional abort pattern:** Return `false` from `updating` if certain critical fields are being changed without authorization:

```php
Model::updating(function ($model) {
    if ($model->isDirty('role') && ! request()->user()->isAdmin()) {
        return false;
    }
});
```

- **Pre-soft-delete check pattern:** Return `false` from `deleting` to prevent soft-deletion of models that must never be deleted or trashed.

## Architectural Decisions
- **Why `until()` instead of `dispatch()` for before-events?** â€” Using `until()` enables short-circuit halting. If `dispatch()` were used, all listeners would execute even after one returned `false`, making halting purely advisory.
- **Why does `false` halt but exceptions do not?** â€” Exceptions propagate up the call stack and can be caught by the caller. The `false` return is a deliberate "soft abort" that does not crash the request. It gives the application a chance to handle the failure gracefully.
- **Why no listener chain continuation after halting?** â€” Once an operation is aborted, continuing to fire listeners would be misleading: they would observe a model state that was never persisted, creating cognitive dissonance.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simple `return false` halting mechanism | Only the first blocking listener determines outcome | Listener ordering matters â€” first registered wins |
| Soft abort avoids exception handling overhead | Silent aborts can be hard to debug | Log every `false` return in development |
| Clean separation of validation from persistence | No mechanism for "soft reject" with feedback | Use exceptions for user-facing feedback; `false` for internal abort |

## Performance Considerations
- **Early halting is efficient:** If a `saving` listener returns `false`, no inner events fire and no DB query runs. This saves resources for invalid operations.
- **Listener ordering affects performance:** Register validation listeners early (before logging or audit listeners) to fail fast.
- **`until()` overhead:** The `until()` method checks each listener's return value, adding marginal overhead per listener. For most applications this is negligible.

## Production Considerations
- **Log aborted operations:** In production, log every `false` return from a model event. Silent aborts make debugging production issues extremely difficult.
- **Observer method halting:** Observer methods (`saving()`, `creating()`, etc.) on observer classes also halt when returning `false`. The behavior is identical to closure listeners.
- **Audit trail of aborts:** Record aborted operations in the audit log with the reason and the listener source. This helps identify patterns of blocked operations.

## Common Mistakes
- **Returning `null` or `void` thinking it halts:** Only an explicit `return false` halts. `return null`, `return true`, or no return statement all allow propagation. This is the most common bug when migrating from a halting to a non-halting pattern.
- **Returning `false` in a `*ed` event:** After-events cannot halt. Returning `false` from `saved`, `created`, `updated`, etc. has no effect â€” the operation already completed.
- **Assuming all listeners execute after halting:** Once a listener returns `false` on a `*ing` event, no further listeners for that same event run. Later listeners are silently skipped.
- **Returning `false` from an exception handler:** If an observer method throws an exception that is caught, and the catch block returns `false`, the halting still works. But this is confusing â€” use exceptions for error handling.

## Failure Modes
- **First-listener domination:** The first registered listener to return `false` determines the outcome. Later listeners with conflicting logic never execute. This creates invisible dependencies on registration order.
- **Silent operation suppression:** An overeager validation listener can silently suppress saves across the entire model class. Without logging, developers have no indication why their operations fail.
- **Observer method returning false inadvertently:** A method like `saving()` that returns the result of a helper function may accidentally return `false` from the helper, halting the operation unexpectedly.
- **Halting across transactions:** If an operation is inside a database transaction, a halted event leaves the transaction open. The caller must handle the rollback.

## Ecosystem Usage
- **Laravel Auditing:** Does not halt events â€” it only observes. Returns void from all listener methods.
- **Spatie Activitylog:** Similarly, does not use halting. It logs activity without interfering with persistence.
- **Laravel Nova:** Uses event halting in its resource lifecycle to prevent unauthorized changes.

## Related Knowledge Units

### Prerequisites
- Event Catalog
- Event Dispatch Order

### Related Topics
- Event Control (Quiet Operations)
- Observer Pattern

### Advanced Follow-up Topics
- Manual Event Firing
- Observer Anti-Patterns

## Research Notes
- **Source Analysis:** `Illuminate\Events\Dispatcher::until()` â€” iterates listeners and returns the first non-null response. The short-circuit behavior is at the dispatcher level, not the model level. `Illuminate\Database\Eloquent\Concerns\HasEvents::fireModelEvent()` checks for `false`.
- **Key Insight:** The halting mechanism relies on `$dispatcher->until()` returning the first non-null value. This means if a listener returns a non-null, non-false value (e.g., a string), the `until()` method also short-circuits, but `fireModelEvent()` only halts if the value is exactly `=== false`. Non-false, non-null values from early listeners still prevent later listeners from running for the same event.
- **Version-Specific Notes:** The halting behavior has been consistent since Laravel 4.x. The `fireModelEvent` method signature changed in Laravel 9.x to return `mixed` instead of `bool|null` for better type safety.
