# Event Propagation Rules

## Rule 1: Only Return `false` From `*ing` Events to Halt the Operation
---
## Category
Framework Usage
---
## Rule
Only use `return false` in `saving`, `creating`, `updating`, `deleting`, `trashing`, `restoring`, `forceDeleting`, and `replicating` event listeners to abort the database operation.
---
## Reason
Eloquent only inspects the return value of `*ing` (before) events. Returning `false` from an `*ed` (after) event has no effect — the operation already completed. This is the single mechanism for aborting model persistence from event listeners.
---
## Bad Example
```php
public function saved(Order $order): void
{
    if ($order->total_cents < 0) {
        return false; // No effect — save already committed
    }
}
```
---
## Good Example
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        return false; // Aborts the save before the database operation
    }
    return null;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Data persists despite validation failure; developer believes operation was aborted; data integrity violations.

---

## Rule 2: Throw an Exception or Log Before Returning `false`
---
## Category
Maintainability
---
## Rule
Always log a warning or throw a meaningful exception immediately before returning `false` from a halting event listener.
---
## Reason
Returning `false` silently aborts the operation with no indication of why. Developers debugging a failed save have no information about which listener halted the operation or why.
---
## Bad Example
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        return false; // Silent halt — impossible to debug
    }
    return null;
}
```
---
## Good Example
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        Log::warning('Attempted save with negative total', [
            'order_id' => $order->id,
            'total_cents' => $order->total_cents,
        ]);
        return false;
    }
    return null;
}
```
---
## Exceptions
The halting is trivial and the failure reason is obvious from the condition (e.g., a null required field).
---
## Consequences Of Violation
Silent failures; extended debugging time; production issues that leave no trace in logs.

---

## Rule 3: Return `null` (Not `true`) From Halting Events When You Want the Operation to Continue
---
## Category
Framework Usage
---
## Rule
Return `null` or omit the return statement from `*ing` event listeners when the operation should proceed. Do not return `true`.
---
## Reason
Eloquent checks for strict `false` to halt. Returning `null`, `true`, or nothing all allow the operation to continue. However, returning `true` can mislead readers into thinking a positive action is taken. `null` or no return is idiomatic.
---
## Bad Example
```php
public function saving(Order $order): ?bool
{
    return true; // Misleading — reader expects a meaningful return
}
```
---
## Good Example
```php
public function saving(Order $order): ?bool
{
    // No return or explicit null means "continue"
    if ($order->total_cents < 0) {
        return false;
    }
    return null;
}
```
---
## Exceptions
You need to explicitly document that the listener intentionally allows the operation (e.g., in code generation or framework code).
---
## Consequences Of Violation
Reader confusion about the listener's intent; inconsistent return patterns across observers; perceived coupling between listener and operation outcome.

---

## Rule 4: Do Not Use Event Halting as the Primary Validation Mechanism
---
## Category
Design
---
## Rule
Prefer explicit validation in FormRequest classes or model methods over halting events for primary data validation.
---
## Reason
Halting events are invisible — they are defined in observers, not on the model or controller. Developers reading the save call have no indication that validation is happening elsewhere. Explicit validation at the entry point (FormRequest, model `save` override) is discoverable and testable.
---
## Bad Example
```php
class OrderObserver
{
    public function saving(Order $order): ?bool
    {
        if ($order->total_cents < 0) return false; // Hidden validation
        return null;
    }
}
```
---
## Good Example
```php
class StoreOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return ['total_cents' => ['required', 'integer', 'min:0']];
    }
}
```
---
## Exceptions
Cross-cutting validation that applies to all entry points (e.g., preventing soft-deleted models from being saved) or validation that must run at the ORM level regardless of how the model is persisted.
---
## Consequences Of Violation
Hidden business rules; difficulty discovering why a save failed; validation logic scattered across observers instead of centralized.

---

## Rule 5: Never Rely on Event Halting in Queued Listeners
---
## Category
Reliability
---
## Rule
Do not use `return false` in event listeners that may execute on a queue or in a deferred context.
---
## Reason
Queued listeners execute asynchronously. By the time the listener runs and returns `false`, the model operation has already completed. Halting has no effect in deferred contexts, creating a false sense of safety.
---
## Bad Example
```php
class ValidateOrder implements ShouldQueue
{
    public function saving(Order $order): ?bool
    {
        if ($order->total_cents < 0) return false; // Too late — save already committed
        return null;
    }
}
```
---
## Good Example
```php
class ValidateOrder
{
    public function saving(Order $order): ?bool
    {
        if ($order->total_cents < 0) return false; // Synchronous — works
        return null;
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Invalid data persists despite halting logic; silent data integrity failures; debugging nightmare when the halt "should have worked."

---

## Rule 6: Do Not Halt in `replicating` for Validation — Halt for Mutation Control Only
---
## Category
Design
---
## Rule
Do not use `replicating` halting for data validation. Use it only to prevent replication based on model state.
---
## Reason
`replicating` fires during `replicate()`, which creates an in-memory copy (no database operation). Halting here prevents the copy but does not prevent the original model from being saved. Using it for validation is semantically wrong.
---
## Bad Example
```php
public function replicating(Order $order): ?bool
{
    if ($order->status !== 'completed') {
        return false; // Halts copy — but original save is unaffected
    }
    return null;
}
```
---
## Good Example
```php
public function replicating(Order $order): ?bool
{
    if ($order->is_archived) {
        return false; // Prevent copying archived orders
    }
    return null;
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Misleading validation logic in the wrong event phase; replication halting used for purposes other than controlling the copy operation.
