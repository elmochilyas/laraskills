# Event Catalog Rules

## Rule 1: Use `*ing` Events for Validation and Authorization, `*ed` Events for Side Effects
---
## Category
Design
---
## Rule
Always use `*ing` events (saving, creating, updating, deleting) to validate or authorize an operation. Always use `*ed` events (saved, created, updated, deleted) for side effects like cache invalidation, logging, and notifications.
---
## Reason
`*ing` events fire before the database operation and can halt by returning `false`, making them the correct hook for preventing invalid state. `*ed` events fire after a successful operation and cannot halt, making them reliable triggers for side effects.
---
## Bad Example
```php
public function saved(Order $order): void
{
    if ($order->total_cents < 0) {
        return false; // No effect — saved cannot halt
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

public function saved(Order $order): void
{
    Cache::forget("order:{$order->id}"); // Side effect in *ed event
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Validation in `*ed` events is silently ignored; side effects in `*ing` events may abort operations unexpectedly; logic is placed in wrong lifecycle phase.

---

## Rule 2: Use `created`/`updated` When the Operation Type Matters; Use `saved` When It Does Not
---
## Category
Maintainability
---
## Rule
Use `created` or `updated` when the listener needs to distinguish between insert and update. Use `saved` when the same logic applies to both.
---
## Reason
`saved` fires after both create and update with no built-in way to distinguish them (except checking `wasRecentlyCreated`). Using `created`/`updated` makes intent explicit and avoids conditional checks.
---
## Bad Example
```php
public function saved(Order $order): void
{
    if ($order->wasRecentlyCreated) {
        // Send welcome email on first creation
    }
    // Always invalidate cache
}
```
---
## Good Example
```php
public function created(Order $order): void
{
    Mail::send(new WelcomeEmail($order)); // Only on insert
}

public function saved(Order $order): void
{
    Cache::forget("order:{$order->id}"); // Always
}
```
---
## Exceptions
The listener needs to fire on both create and update and also needs the distinction (in which case, register both `created` and `updated` separately).
---
## Consequences Of Violation
Hidden conditional logic; harder to understand what triggers on insert vs update; missed events if conditionals are wrong.

---

## Rule 3: Never Rely on `retrieved` for Authorization
---
## Category
Security
---
## Rule
Do not use the `retrieved` event to authorize access to a model or to filter query results.
---
## Reason
`retrieved` fires after the SELECT query executes. By this point, the data has already left the database. Authorization must happen before the query via global scopes, policies, or query constraints — not after hydration.
---
## Bad Example
```php
public function retrieved(Order $order): void
{
    if ($order->user_id !== auth()->id()) {
        abort(403); // Too late — data already retrieved
    }
}
```
---
## Good Example
```php
// In a policy or controller
public function view(User $user, Order $order): bool
{
    return $order->user_id === $user->id;
}
```
---
## Exceptions
Post-retrieval masking of sensitive fields for serialization (e.g., hiding credit card numbers in `toArray()`).
---
## Consequences Of Violation
Data already loaded into memory before authorization; timing side-channels; potential data leakage through debug backtraces.

---

## Rule 4: Use `replicating` to Modify Attributes Before Replication
---
## Category
Design
---
## Rule
Use the `replicating` event to modify, unset, or transform attributes before the model is duplicated via `replicate()`.
---
## Reason
`replicate()` copies all attributes that are not in `$except`. The `replicating` event fires before the copy happens, allowing you to programmatically clear or set attributes based on business rules (e.g., resetting a unique slug).
---
## Bad Example
```php
$newOrder = $originalOrder->replicate();
$newOrder->order_number = null; // Set after replicate — two operations
```
---
## Good Example
```php
public function replicating(Order $order): void
{
    $order->order_number = null; // Cleared before the copy
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Duplicated unique constraint violations; manual attribute handling after replication; missed attributes that should be reset.

---

## Rule 5: Do Not Use `saving`/`saved` When `creating`/`created` or `updating`/`updated` Is More Specific
---
## Category
Maintainability
---
## Rule
Prefer `creating`/`created` and `updating`/`updated` over `saving`/`saved` when the listener should only fire for one operation type.
---
## Reason
`saving` and `saved` fire for both inserts and updates. Using them when only one operation is relevant forces an `if` check (`wasRecentlyCreated` or `isDirty()`), obscuring intent at the registration site.
---
## Bad Example
```php
// Observer method fires on every save, but logic only matters on update
public function saving(Order $order): void
{
    if ($order->isDirty('status')) {
        // Validate status transition
    }
}
```
---
## Good Example
```php
public function updating(Order $order): void
{
    if ($order->isDirty('status')) {
        // Validate status transition
    }
}
```
---
## Exceptions
The listener must fire for both operations with the same logic, or the conditional itself is the intent.
---
## Consequences Of Violation
Observer method signature does not reflect actual triggers; wasted execution on irrelevant events; confusion during code review.

---

## Rule 6: Register Pivot Event Listeners Separately From Model Event Listeners
---
## Category
Code Organization
---
## Rule
Handle `pivotAttaching`, `pivotAttached`, `pivotDetaching`, `pivotDetached`, `pivotUpdating`, and `pivotUpdated` events in dedicated pivot observers or explicit closures, not in the same observer as model events.
---
## Reason
Pivot events belong to the relationship lifecycle, not the model lifecycle. Mixing them in the same observer conflates two distinct concerns: model persistence and relationship synchronization.
---
## Bad Example
```php
class OrderObserver
{
    public function updated(Order $order): void { /* ... */ }
    public function pivotAttached(Order $order, $relation, $ids): void { /* ... */ }
}
```
---
## Good Example
```php
class OrderPivotObserver
{
    public function pivotAttached(Order $order, $relation, $ids): void
    {
        // Dedicated pivot observer
    }
}
```
---
## Exceptions
The pivot and model logic are trivially related (e.g., both invalidate the same cache key).
---
## Consequences Of Violation
Observer grows with mixed responsibilities; pivot logic harder to find and test; accidental coupling between model and relationship side effects.

---

## Rule 7: Do Not Use `trashed`/`restored` Unless Using Soft Deletes
---
## Category
Maintainability
---
## Rule
Only register `trashed`, `trashing`, `restored`, `restoring`, `forceDeleting`, and `forceDeleted` event listeners on models that use the `SoftDeletes` trait.
---
## Reason
These events never fire on models without soft deletes. Registering listeners for them creates dead code that misleads developers into thinking soft-delete behavior exists.
---
## Bad Example
```php
// Order does not use SoftDeletes — this listener never executes
public function trashed(Order $order): void { /* ... */ }
```
---
## Good Example
```php
// Only define soft-delete event handlers on soft-deletable models
class DocumentObserver
{
    public function trashed(Document $document): void
    {
        // Document uses SoftDeletes
    }
}
```
---
## Exceptions
A base observer registered globally that conditionally checks for soft-delete capability.
---
## Consequences Of Violation
Dead code; misleading documentation of model capabilities; wasted developer time debugging non-firing listeners.

---

## Rule 8: Use `booting`/`booted` for Model-Level Initialization, Not Business Logic
---
## Category
Design
---
## Rule
Use `booting` and `booted` only for framework-level initialization (trait boot, global scope registration), not for business logic or event listener registration.
---
## Reason
`booting`/`booted` fire once per class per request during model boot. Business logic belongs in observers or domain events. Using boot events for business rules creates untestable, one-time-execution logic.
---
## Bad Example
```php
protected static function booted(): void
{
    static::created(function ($order) {
        // Business logic in boot event — hard to test
    });
}
```
---
## Good Example
```php
// Observer class — testable and explicit
#[ObservedBy(OrderObserver::class)]
class Order extends Model {}
```
---
## Exceptions
Trivial closures that set up non-business behavior (e.g., adding a global scope).
---
## Consequences Of Violation
Business logic scattered across model classes; untestable inline closures; hidden behavior that is hard to discover.
