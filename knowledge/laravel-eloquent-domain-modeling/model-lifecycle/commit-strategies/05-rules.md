# Commit Strategies Rules

## Rule 1: Always Use `afterCommit()` for Domain Events in Transactions
---
## Category
Reliability
---
## Rule
Always call `->afterCommit()` when dispatching domain events or jobs inside a database transaction.
---
## Reason
If the transaction rolls back, the dispatched job or event listener has already been queued. It will execute against non-existent or rolled-back data, causing errors or inconsistent state. `afterCommit()` defers dispatch until the transaction successfully commits.
---
## Bad Example
```php
DB::transaction(function () {
    $order->save();
    dispatch(new ProcessOrder($order->id)); // Dispatches before commit
});
```
---
## Good Example
```php
DB::transaction(function () {
    $order->save();
    dispatch(new ProcessOrder($order->id))->afterCommit(); // Only after commit
});
```
---
## Exceptions
The event listener can handle missing data gracefully (e.g., it checks for existence before processing).
---
## Consequences Of Violation
Jobs execute against rolled-back data; runtime exceptions in workers; data inconsistency between systems.

---

## Rule 2: Use `BroadcastsEventsAfterCommit` Over `BroadcastsEvents`
---
## Category
Reliability
---
## Rule
Always apply `BroadcastsEventsAfterCommit` instead of `BroadcastsEvents` on models that participate in transactional persistence.
---
## Reason
`BroadcastsEvents` fires before the transaction commits. If the transaction rolls back, clients receive a broadcast for data that does not exist. `BroadcastsEventsAfterCommit` defers all broadcasts until after a successful commit.
---
## Bad Example
```php
use BroadcastsEvents; // Sends broadcast before commit
```
---
## Good Example
```php
use BroadcastsEventsAfterCommit; // Sends only after successful commit
```
---
## Exceptions
Broadcasts that do not depend on persisted data (e.g., optimistic UI updates for non-critical features).
---
## Consequences Of Violation
Users see phantom records; UI shows state that never persisted; confusion and data inconsistency.

---

## Rule 3: Do Not Use `afterCommit()` for Side Effects That Must Execute Regardless of the Transaction
---
## Category
Design
---
## Rule
Do not apply `afterCommit()` when the side effect should execute even if the surrounding transaction fails.
---
## Reason
`afterCommit()` suppresses dispatch on rollback. Audit logs, failure tracking, or compensating actions must execute regardless of transaction outcome. Using `afterCommit()` would silently skip them.
---
## Bad Example
```php
DB::transaction(function () {
    $order->save();
    dispatch(new LogOrderAttempt($order))->afterCommit(); // Skips log on rollback
});
```
---
## Good Example
```php
DB::transaction(function () {
    $order->save();
});

dispatch(new LogOrderAttempt($order)); // Always logs, regardless of transaction
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Missing audit trail on failures; inability to debug transaction failures; missed compensating actions.

---

## Rule 4: Default to After-Commit for All Non-Critical Side Effects
---
## Category
Reliability
---
## Rule
Default to `afterCommit()` for all event dispatch, job dispatch, and broadcasting unless you explicitly need pre-commit delivery.
---
## Reason
Pre-commit dispatch is an opt-in risk. The default should be safety (after-commit) because most side effects depend on the data being persisted. Exceptions should be documented and justified.
---
## Bad Example
```php
// No afterCommit() — dispatches before commit by default
dispatch(new SendOrderConfirmation($order));
```
---
## Good Example
```php
// afterCommit() as default — safe until proven otherwise
dispatch(new SendOrderConfirmation($order))->afterCommit();
```
---
## Exceptions
The side effect is unrelated to the persisted data (e.g., tracking that an attempt was made).
---
## Consequences Of Violation
Unpredictable side effects from failed transactions; data inconsistency between services.

---

## Rule 5: Use `dispatchAfterCommit()` on Bus for Readable One-Liners
---
## Category
Maintainability
---
## Rule
Use `Bus::dispatchAfterCommit()` instead of `dispatch(...)->afterCommit()` for a more readable one-line syntax.
---
## Reason
Chaining `->afterCommit()` is easy to forget. `dispatchAfterCommit()` makes the after-commit intent explicit and requires fewer characters, improving readability and reducing verbosity.
---
## Bad Example
```php
dispatch(new SendOrderConfirmation($order))->afterCommit()->onQueue('emails');
```
---
## Good Example
```php
Bus::dispatchAfterCommit(new SendOrderConfirmation($order))->onQueue('emails');
```
---
## Exceptions
You need to apply additional chain methods that are not compatible with `dispatchAfterCommit`.
---
## Consequences Of Violation
No direct consequence — both approaches work. Reduced readability if chaining becomes long.
---

## Rule 6: Ensure Listeners Receiving After-Commit Events Handle Non-Existence Gracefully
---
## Category
Reliability
---
## Rule
Always check model existence in listeners and jobs that receive data from after-commit dispatches.
---
## Reason
Between the transaction commit and the listener execution, another process may have deleted or modified the model. Assuming the model exists in the listener can lead to `ModelNotFoundException` or stale data reads.
---
## Bad Example
```php
public function handle(Order $order): void
{
    $order->processPayment(); // Assumes $order still exists and is in expected state
}
```
---
## Good Example
```php
public function handle(Order $order): void
{
    $order = Order::find($order->id); // Re-fetch to get current state
    if ($order === null) {
        return; // Already deleted — nothing to process
    }
    $order->processPayment();
}
```
---
## Exceptions
The model is immutable after creation (append-only logs) and cannot be deleted.
---
## Consequences Of Violation
Runtime exceptions in queue workers; processing stale data; unrecoverable job failures.

---

## Rule 7: Document After-Commit Dependency on Transaction Boundaries
---
## Category
Maintainability
---
## Rule
Document when a method's side effects depend on a wrapping transaction being committed.
---
## Reason
`afterCommit()` only works if there is an active transaction. If the caller does not wrap the operation in a transaction, `afterCommit()` is ignored and the dispatch fires immediately. This silent fallback causes subtle bugs.
---
## Bad Example
```php
public function placeOrder(Order $order): void
{
    $order->save();
    dispatch(new ProcessOrder($order->id))->afterCommit(); // No transaction — fires immediately
}
```
---
## Good Example
```php
/**
 * Places the order inside a transaction.
 * All side effects dispatch after commit.
 */
public function placeOrder(Order $order): void
{
    DB::transaction(function () use ($order) {
        $order->save();
        dispatch(new ProcessOrder($order->id))->afterCommit();
    });
}
```
---
## Exceptions
Single-query operations that do not use transactions and where after-commit behavior is not needed.
---
## Consequences Of Violation
Silent fallback to immediate dispatch; side effects fire before data is fully processed; intermittent failures under concurrent load.
