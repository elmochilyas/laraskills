# Observer Anti-Patterns Rules

## Rule 1: Never Put Business Logic in Observers
---
## Category
Architecture
---
## Rule
Never implement business rules, domain calculations, or decision logic in observer methods. Keep observers strictly for infrastructure concerns.
---
## Reason
Business logic in observers is invisible — it runs automatically when a model is saved, with no indication at the call site. This makes business rules hard to discover, test in isolation, and reason about. Business logic belongs in model methods, domain services, or action classes.
---
## Bad Example
```php
class OrderObserver
{
    public function created(Order $order): void
    {
        if ($order->total_cents >= 10000) {
            $order->applyDiscount(0.1); // Business logic hidden in observer
        }
    }
}
```
---
## Good Example
```php
// Business logic in a domain service or action class
class ApplyVolumeDiscount
{
    public function execute(Order $order): void
    {
        if ($order->total_cents >= 10000) {
            $order->applyDiscount(0.1);
            $order->save();
        }
    }
}

// Observer only for infrastructure concerns
class OrderCacheObserver
{
    public function saved(Order $order): void
    {
        Cache::forget("order:{$order->id}");
    }
}
```
---
## Exceptions
Trivial formatting or normalization that is purely infrastructural (e.g., trimming whitespace before save).
---
## Consequences Of Violation
Business logic scattered across observer classes; untestable without triggering persistence; hidden side effects that surprise developers; difficulty migrating to domain-driven design.

---

## Rule 2: Keep One Observer Per Infrastructure Concern
---
## Category
Maintainability
---
## Rule
Create a separate observer class for each infrastructure concern (cache, audit, notifications, sync). Do not create a single "god" observer per model.
---
## Reason
A single observer handling cache invalidation, audit logging, notifications, and external sync becomes hard to test, reason about, and change. One change risks breaking another. Separate observers have single responsibilities and can be tested independently.
---
## Bad Example
```php
class OrderObserver
{
    public function saved(Order $order): void
    {
        Cache::forget("order:{$order->id}");
        AuditLog::log('order_saved', $order);
        Mail::send(new OrderConfirmation($order));
        $this->syncToExternalSystem($order);
    }
}
```
---
## Good Example
```php
#[ObservedBy(OrderCacheObserver::class)]
#[ObservedBy(OrderAuditObserver::class)]
#[ObservedBy(OrderNotificationObserver::class)]
class Order extends Model {}
```
---
## Exceptions
Two concerns are trivially coupled (e.g., logging and auditing that share the same data and always change together).
---
## Consequences Of Violation
Large, untestable observer classes; accidental coupling between unrelated side effects; single change in one concern risks breaking another.

---

## Rule 3: Dispatch Jobs for Heavy Operations in Observers — Never Execute Synchronously
---
## Category
Performance
---
## Rule
Dispatch a queued job for any operation that takes longer than ~5ms (API calls, image processing, email sending, report generation).
---
## Reason
Observer methods execute synchronously inside the HTTP request or command. Heavy synchronous operations block the response, cause timeouts, degrade user experience, and reduce throughput. Queuing moves the work to a background process.
---
## Bad Example
```php
public function created(Order $order): void
{
    Mail::send(new OrderConfirmation($order)); // Synchronous — blocks response
    Http::post('https://external.com/api/sync', $order->toArray()); // Blocking
}
```
---
## Good Example
```php
public function created(Order $order): void
{
    dispatch(new SendOrderConfirmation($order->id))->afterCommit();
    dispatch(new SyncOrderToExternal($order->id))->afterCommit();
}
```
---
## Exceptions
The operation is trivially fast (a cache `forget` call or a log write) and queuing would add unnecessary overhead.
---
## Consequences Of Violation
Slow HTTP responses; request timeouts; poor user experience; blocked queue workers if sync operations fail; cascading failures under load.

---

## Rule 4: Use Constructor Injection in Observers — Never Facades or Global State
---
## Category
Design
---
## Rule
Inject dependencies through the observer's constructor instead of using facades, helpers, or static calls.
---
## Reason
Facades create hidden coupling to the Laravel container, making observers impossible to unit test without mocking facades. Constructor injection makes dependencies explicit, improves testability, and follows standard Laravel dependency injection patterns.
---
## Bad Example
```php
class OrderCacheObserver
{
    public function saved(Order $order): void
    {
        Cache::forget("order:{$order->id}"); // Hidden facade dependency
    }
}
```
---
## Good Example
```php
class OrderCacheObserver
{
    public function __construct(
        private readonly CacheManager $cache
    ) {}

    public function saved(Order $order): void
    {
        $this->cache->forget("order:{$order->id}");
    }
}
```
---
## Exceptions
The dependency is the cache, session, or other Laravel facade that Laravel's testing helpers (`Cache::fake()`) can mock without constructor injection.
---
## Consequences Of Violation
Difficult to unit test observers; hidden coupling to the service container; brittle tests that require facade fakes.

---

## Rule 5: Use `saveQuietly()` or `withoutEvents()` to Prevent Infinite Loops — Never Suppress Events Broadly
---
## Category
Reliability
---
## Rule
When an observer must save a model inside its own event handler, use `saveQuietly()` or `withoutEvents()` on the specific save call, not a global suppression flag.
---
## Reason
Saving a model inside its own observer creates an infinite loop: save → observer → save → observer → ... Targeted quiet suppression breaks the loop at the specific point without disabling events for all other operations.
---
## Bad Example
```php
public function saved(Order $order): void
{
    Order::updated(fn () => /* ... */); // Registering another listener inside listener
    $order->save(); // Triggers another saved event — infinite loop
}
```
---
## Good Example
```php
public function saved(AuditLog $log): void
{
    AuditLog::withoutEvents(fn () =>
        $this->pruneOldLogs() // Manipulates AuditLog without triggering events
    );
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Stack overflow; maximum execution time exceeded; server crashes; difficult-to-diagnose infinite loops in production.

---

## Rule 6: Do Not Access Relationships in Observers That May Not Be Loaded
---
## Category
Reliability
---
## Rule
Always check if a relationship is loaded before accessing it in an observer method, or use `load()` explicitly.
---
## Reason
Observers receive the model after the database operation. If the relationship was not eager-loaded on the query that retrieved the model, accessing it triggers an N+1 query inside the observer, which is invisible to the caller and degrades performance.
---
## Bad Example
```php
public function deleted(Order $order): void
{
    foreach ($order->items as $item) { // Triggers lazy load — N+1 in observer
        // ...
    }
}
```
---
## Good Example
```php
public function deleted(Order $order): void
{
    if ($order->relationLoaded('items')) {
        foreach ($order->items as $item) {
            // ...
        }
    } else {
        // Use a dedicated query instead
        $itemCount = $order->items()->count();
    }
}
```
---
## Exceptions
The model is always loaded with the relationship in every code path that deletes it (verify with audit).
---
## Consequences Of Violation
Silent N+1 queries in observers; unexpected database load; performance degradation that is hard to trace.

---

## Rule 7: Never Throw Exceptions From `*ed` Event Observers to Control Flow
---
## Category
Design
---
## Rule
Do not throw exceptions in `*ed` (after) event observers as a means of control flow or error signaling.
---
## Reason
`*ed` events fire after the database operation has already committed. Throwing an exception at this point cannot undo the persistence. The model is saved, the transaction is committed, and the exception becomes an unrecoverable error for the caller.
---
## Bad Example
```php
public function saved(Order $order): void
{
    if ($order->total_cents < 0) {
        throw new \Exception("Order saved with negative total"); // Too late — data persisted
    }
}
```
---
## Good Example
```php
public function saving(Order $order): ?bool
{
    if ($order->total_cents < 0) {
        Log::warning('Negative total prevented');
        return false; // Aborts before save — no data persisted
    }
    return null;
}
```
---
## Exceptions
Logging or monitoring exceptions that should not affect the caller (e.g., a monitoring service that throws but is caught internally).
---
## Consequences Of Violation
Orphaned data committed to the database; HTTP 500 errors after successful persistence; partial system state that is difficult to reconcile.
