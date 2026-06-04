# Event Dispatch Order Rules

## Rule 1: Never Rely on `saved` Firing Only for Inserts or Only for Updates
---
## Category
Reliability
---
## Rule
Never write a `saved` listener that assumes it fires exclusively for inserts or exclusively for updates.
---
## Reason
`saved` fires after every `save()` call, whether it created or updated the model. Assuming one or the other causes missed side effects or duplicate processing. Use `created`/`updated` when the operation type matters.
---
## Bad Example
```php
public function saved(Order $order): void
{
    $this->sendWelcomeEmail($order); // Fires on every update too!
}
```
---
## Good Example
```php
public function created(Order $order): void
{
    $this->sendWelcomeEmail($order); // Only on insert
}

public function saved(Order $order): void
{
    Cache::forget("order:{$order->id}"); // Fires for both — correct
}
```
---
## Exceptions
The listener checks `$order->wasRecentlyCreated` to distinguish the operation type explicitly.
---
## Consequences Of Violation
Duplicate welcome emails on every update; missed cache invalidation on creates; bugs that only appear when the same record is re-saved.

---

## Rule 2: Check `$order->wasRecentlyCreated` in `saved` When Distinction Is Needed
---
## Category
Framework Usage
---
## Rule
Use `$model->wasRecentlyCreated` inside a `saved` listener to determine whether the operation was an insert or update.
---
## Reason
`saved` fires for both create and update with no parameter to distinguish them. `wasRecentlyCreated` is set to `true` after an insert and `false` after an update, providing the necessary context without registering separate `created`/`updated` handlers.
---
## Bad Example
```php
public function saved(Order $order): void
{
    // No distinction — sends email on every save
    Mail::send(new OrderConfirmation($order));
}
```
---
## Good Example
```php
public function saved(Order $order): void
{
    if ($order->wasRecentlyCreated) {
        Mail::send(new OrderConfirmation($order));
    }
    Cache::forget("order:{$order->id}");
}
```
---
## Exceptions
Registering separate `created` and `updated` observers is cleaner and preferred when the two code paths diverge significantly.
---
## Consequences Of Violation
Logic runs on the wrong operation type; side effects fire too often or not often enough.

---

## Rule 3: Only Return `false` From `*ing` Events to Halt — Never From `*ed` Events
---
## Category
Design
---
## Rule
Only return `false` from `saving`, `creating`, `updating`, `deleting`, `trashing`, `restoring`, `forceDeleting`, and `replicating` events. Never return `false` from `*ed` events.
---
## Reason
Eloquent only checks the return value of `*ing` events for halting. Returning `false` from `*ed` events is silently ignored, creating the illusion of control where none exists.
---
## Bad Example
```php
public function saved(Order $order): void
{
    if ($order->total_cents < 0) {
        return false; // No effect — developer thinks save was aborted
    }
}
```
---
## Good Example
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        return false; // Correctly aborts the save
    }
    return null;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Data persists when developer expected it to be aborted; subtle data integrity bugs; false sense of security from halting logic.

---

## Rule 4: Remember That `saving` Wraps `creating`/`updating`; Listeners in `saving` Fire First
---
## Category
Framework Usage
---
## Rule
When both `saving` and `creating`/`updating` listeners are registered, the `saving` listener fires before `creating`/`updating`, and `saved` fires after `created`/`updated`.
---
## Reason
The dispatch order is `saving → creating/updating → (DB operation) → created/updated → saved`. If `saving` aborts, `creating`/`updating` never fire. Code that depends on `saving` having already run must account for this ordering.
---
## Bad Example
```php
// Assume 'saving' has already validated before 'creating' runs
// But if 'creating' does different validation, it may re-validate
```
---
## Good Example
```php
// Put shared validation in 'saving', operation-specific in 'creating'
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) return false; // Fires first
    return null;
}

public function creating(Order $order): ?bool
{
    if (Order::where('email', $order->email)->exists()) return false; // Fires second
    return null;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Validation order assumptions are wrong; `saving` halts but `creating` logic assumes it ran; race conditions between the two event phases.

---

## Rule 5: Handle Pivot Events Separately From Main Model Events — Order Is Not Guaranteed
---
## Category
Reliability
---
## Rule
Do not assume pivot events fire before or after the parent model's save events in a specific order.
---
## Reason
Pivot events (`pivotAttaching`, `pivotAttached`, etc.) fire during relationship sync operations, which may occur inside or outside the parent model's event chain. The relative order between pivot events and model events is not guaranteed by the framework.
---
## Bad Example
```php
// Assumes pivotAttached fires after saved — may not always be true
public function saved(Order $order): void { /* ... */ }
public function pivotAttached(Order $order, $relation, $ids): void { /* ... */ }
```
---
## Good Example
```php
// Treat pivot and model events as independent chains
// Use separate observers with independent concerns
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Race conditions between pivot and model event handlers; state assumed to be available when it is not; intermittent bugs.

---

## Rule 6: Do Not Expect `deleted` to Fire Before `saved` on the Same `save()` Call
---
## Category
Framework Usage
---
## Rule
Do not write code that assumes `deleted` fires in relation to `saved` — delete and save are separate operations with independent event chains.
---
## Reason
`deleted` fires during `delete()`, not during `save()`. There is no temporal ordering relationship between the two event chains. Code that couples delete and save event logic will behave unpredictably.
---
## Bad Example
```php
public function saved(Order $order): void
{
    $this->cacheIndex++; // Assumes no delete has happened between saves
}
```
---
## Good Example
```php
// Handle cache independently per operation
public function saved(Order $order): void { Cache::forget("order:{$order->id}"); }
public function deleted(Order $order): void { Cache::forget("order:{$order->id}"); }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Incorrect cache state; assumptions about model lifecycle ordering that do not hold under concurrent operations.
