# Event Control — Quiet Operations Rules

## Rule 1: Prefer `withoutEvents()` Over Individual Quiet Methods for Scoped Suppression
---
## Category
Maintainability
---
## Rule
Use `Model::withoutEvents(fn () => { ... })` instead of calling individual quiet methods like `saveQuietly()` or `deleteQuietly()` when suppressing events for a block of code.
---
## Reason
`withoutEvents()` makes the suppression scope explicit and ensures all operations inside the block are quiet. Individual quiet methods are easy to miss on subsequent saves inside the same block, leading to unexpected event dispatch.
---
## Bad Example
```php
$order->saveQuietly(); // Only this one save is quiet
$order->items()->saveMany($items); // These saves fire events
```
---
## Good Example
```php
Model::withoutEvents(function () use ($order, $items) {
    $order->save();
    $order->items()->saveMany($items); // All saves are quiet
});
```
---
## Exceptions
A single isolated operation in a long method where wrapping the entire method is impractical.
---
## Consequences Of Violation
Partial event suppression; unexpected side effects from missed events; intermittent bugs when code paths diverge.

---

## Rule 2: Always Document Why Events Are Suppressed
---
## Category
Maintainability
---
## Rule
Always add a comment or docblock explaining the reason for using `withoutEvents()` or quiet methods.
---
## Reason
Quiet operations bypass all observers, which may contain critical infrastructure logic (cache invalidation, audit logging, sync). Without documentation, future developers may remove the quiet call, causing infinite loops, or may not realize side effects are being skipped.
---
## Bad Example
```php
Model::withoutEvents(fn () => User::factory()->count(100)->create());
// No explanation — why are events suppressed?
```
---
## Good Example
```php
// Suppress events during bulk seed to avoid firing 100 observer methods
Model::withoutEvents(fn () => User::factory()->count(100)->create());
```
---
## Exceptions
The suppression reason is obvious from the surrounding context (e.g., inside a method named `importWithoutSideEffects`).
---
## Consequences Of Violation
Developers accidentally removing suppression; missing side effects in production; hours of debugging to find why events did not fire.

---

## Rule 3: Use Quiet Operations to Break Infinite Event Loops, Not to Silence Legitimate Side Effects
---
## Category
Design
---
## Rule
Use `saveQuietly()` or `withoutEvents()` inside observer methods that persist models to prevent infinite loops — never to hide side effects that should always run.
---
## Reason
An observer that saves the observed model creates a loop: save → observer → save → observer → ... Quiet operations break this cycle. Using them to silence legitimate side effects hides bugs and makes behavior unpredictable.
---
## Bad Example
```php
public function saved(Order $order): void
{
    // Silencing side effects instead of fixing the design
    Model::withoutEvents(fn () => $this->updateExternalSystem($order));
}
```
---
## Good Example
```php
public function saved(AuditLog $log): void
{
    // Prevent loop: saving an AuditLog inside AuditLog's own observer
    AuditLog::withoutEvents(fn () =>
        $this->pruneOldLogs()
    );
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Infinite loops masked by suppression; side effects skipped without intent; debug difficulty tracing suppressed events.

---

## Rule 4: Use Quiet Operations in Test Setup, Not in Test Assertions
---
## Category
Testing
---
## Rule
Use `withoutEvents()` to seed test data without triggering observer side effects, but never use it inside the assertion phase of a test.
---
## Reason
Test assertions should verify that events fire or do not fire as part of the behavior under test. Using quiet operations in assertions suppresses the very events the test should be checking, leading to false-positive passes.
---
## Bad Example
```php
public function test_order_created_fires_event(): void
{
    $order = Model::withoutEvents(fn () => Order::factory()->create());
    // Event was suppressed — test is meaningless
}
```
---
## Good Example
```php
public function test_order_created_fires_event(): void
{
    Event::fake();
    $order = Order::factory()->create();
    Event::assertDispatched(OrderCreated::class);
}
```
---
## Exceptions
Testing the behavior of quiet operations themselves (e.g., testing that `withoutEvents` actually suppresses events).
---
## Consequences Of Violation
False-positive test passes; undetected event regressions; observers may break in production despite green tests.

---

## Rule 5: Do Not Nest `withoutEvents()` Without Understanding the Nesting Behavior
---
## Category
Framework Usage
---
## Rule
When nesting `withoutEvents()`, ensure the inner call's suppression scope is intentional and does not accidentally extend beyond the inner block.
---
## Reason
`withoutEvents()` is nestable: an inner `withoutEvents()` restores the outer suppression state on exit. However, deeply nested suppression makes it difficult to reason about which events are active at any point, leading to subtle bugs.
---
## Bad Example
```php
Model::withoutEvents(function () {
    Model::withoutEvents(function () {
        // Outer and inner are both quiet — confusing
    });
    // Still quiet — but developer may expect events restored
});
```
---
## Good Example
```php
// Avoid nesting; compose into a single suppression block
Model::withoutEvents(function () use ($order, $items) {
    $order->save();
    $order->items()->saveMany($items);
});
```
---
## Exceptions
Calling third-party code that wraps its own `withoutEvents()` and must run inside your suppression scope.
---
## Consequences Of Violation
Events unexpectedly suppressed in outer scope; hard-to-debug event suppression leaks; confusion during code review.

---

## Rule 6: Do Not Use Quiet Operations as a Performance Optimization Without Measurement
---
## Category
Performance
---
## Rule
Do not use `withoutEvents()` or quiet methods purely for performance gains unless profiling confirms the event listeners are a bottleneck.
---
## Reason
Premature use of quiet operations bypasses essential side effects (logging, cache invalidation, sync). Observer methods are typically fast (<1ms). The performance gain is negligible unless the observer does heavy synchronous work — which should be queued, not suppressed.
---
## Bad Example
```php
// "Optimization" without profiling
Model::withoutEvents(fn () => $order->save());
```
---
## Good Example
```php
// Profile first, then decide
// If observer is slow, queue the work instead of suppressing
$order->save(); // Let observers run
```
---
## Exceptions
Batch operations processing thousands of records where event overhead is confirmed to be a bottleneck via profiling.
---
## Consequences Of Violation
Missing cache invalidations; missed audit logs; data synchronization failures — all for negligible performance gain.

---

## Rule 7: Never Use Quiet Operations to Suppress Events Across HTTP Requests
---
## Category
Scalability
---
## Rule
Do not persist a "quiet mode" setting on the model or request that suppresses events across multiple HTTP requests.
---
## Reason
Quiet operations are per-call or per-scope. A persistent quiet flag would suppress events in all subsequent requests, including those from other users, leading to systematic side-effect loss. Event suppression must be scoped to the current process.
---
## Bad Example
```php
class Order extends Model
{
    public bool $quietMode = false;

    public function save(array $options = []): bool
    {
        if ($this->quietMode) {
            return $this->saveQuietly($options);
        }
        return parent::save($options);
    }
}
```
---
## Good Example
```php
// Suppress events per-operation, not per-request
$order = Model::withoutEvents(fn () => Order::create([...]));
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Systematic loss of side effects for all users; data synchronization failures; cache staleness across the application.
