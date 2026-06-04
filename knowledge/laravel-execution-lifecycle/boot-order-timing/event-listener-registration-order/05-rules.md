# Event Listener Registration Order Rules

## Rule 1: Use $listen Array for Static, Cacheable Mappings
---
## Category
Code Organization
---
## Rule
Prefer the declarative `$listen` property on `EventServiceProvider` over programmatic `Event::listen()` calls for event-to-listener mappings.
---
## Reason
The `$listen` array is declarative, visible at a glance, and cacheable by `event:cache`. Programmatic `Event::listen()` in `boot()` cannot be cached — listeners registered this way are re-registered on every uncached request, adding bootstrap overhead.
---
## Bad Example
```php
class EventServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Event::listen(OrderPlaced::class, SendOrderConfirmation::class);
        Event::listen(UserRegistered::class, SendWelcomeEmail::class);
    }
}
```
---
## Good Example
```php
class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        OrderPlaced::class => [
            SendOrderConfirmation::class,
        ],
        UserRegistered::class => [
            SendWelcomeEmail::class,
        ],
    ];
}
```
---
## Exceptions
Listeners that must be registered conditionally based on runtime configuration — use `Event::listen()` in `boot()` and accept the caching limitation.
---
## Consequences Of Violation
Listeners registered via `Event::listen()` in `boot()` are not captured by `event:cache`, adding 10-30ms runtime discovery overhead on every uncached request.
---

## Rule 2: Avoid Listener Order Dependency
---
## Category
Architecture
---
## Rule
Design event listeners to be order-independent. Never make one listener's correctness depend on another listener running before or after it.
---
## Reason
Order-dependent listeners share implicit state, creating a fragile chain where changing one listener's order breaks another. This violates the principle that events should broadcast to independent observers. If order matters, consider a single listener that sequences the operations internally.
---
## Bad Example
```php
protected $listen = [
    OrderPlaced::class => [
        CalculateTax::class,       // Must run first
        ApplyDiscount::class,      // Must run after CalculateTax
        SendConfirmation::class,   // Must run after both
    ],
];
```
---
## Good Example
```php
class ProcessOrder
{
    public function handle(OrderPlaced $event): void
    {
        $this->calculateTax($event->order);
        $this->applyDiscount($event->order);
        $this->sendConfirmation($event->order);
    }
}

protected $listen = [
    OrderPlaced::class => [
        ProcessOrder::class, // Single listener sequences operations internally
    ],
];
```
---
## Exceptions
When listeners are in separate packages and merging them is impractical — but document the ordering requirement explicitly.
---
## Consequences Of Violation
Listener reordering silently breaks business logic. Adding a new listener in the wrong position causes subtle bugs. Tests fail unpredictably based on registration order.
---

## Rule 3: Use Event Caching in Production
---
## Category
Performance
---
## Rule
Always run `php artisan event:cache` as part of the production deployment process.
---
## Reason
Without event caching, Laravel must scan listener classes and reflect on `handle()` method type-hints to build the event-to-listener map on every request (10-30ms). Event caching generates a compiled manifest that eliminates this runtime discovery entirely.
---
## Bad Example
```php
// Deploy script
git pull
php artisan migrate
// Missing: php artisan event:cache
```
---
## Good Example
```php
git pull
php artisan migrate
php artisan event:cache
// Events cached to bootstrap/cache/events.php
```
---
## Exceptions
Applications with dynamically registered listeners that cannot be expressed in `$listen` and are registered programmatically in `boot()`.
---
## Consequences Of Violation
10-30ms extra bootstrap overhead per request for listener discovery. Harder to predict listener execution order.
---

## Rule 4: Clear Event Cache After Listener Changes
---
## Category
Maintainability
---
## Rule
Run `php artisan event:clear && php artisan event:cache` whenever listeners are added, removed, or their event type-hints change.
---
## Reason
The event cache manifest hard-codes the event-to-listener mappings and the listener class names. A stale cache after listener changes means new listeners never fire, removed listeners still execute, or the cache references deleted classes causing fatal errors.
---
## Bad Example
```php
// Added new listener to $listen array
// Deployed without clearing event cache
// New listener never fires — cached manifest doesn't include it
```
---
## Good Example
```php
// After listener changes:
// php artisan event:clear
// php artisan event:cache
// Verify: php artisan event:list
```
---
## Exceptions
Development environments where event cache is not used.
---
## Consequences Of Violation
New listeners silently fail to execute. Removed listeners continue running from stale cache. Deleted listener classes cause `ClassNotFoundException`.
---

## Rule 5: Use Explicit Priority Only When Semantically Required
---
## Category
Architecture
---
## Rule
Only use the `$priority` parameter on `Event::listen()` when listener execution order has a semantic requirement, not as a substitute for architectural improvement.
---
## Reason
Priority adds complexity: higher numbers run first, and the interaction between priority and registration order is non-obvious. Using priority for all listeners creates a fragile numbering scheme that breaks when new listeners are added with overlapping priorities.
---
## Bad Example
```php
Event::listen(OrderPlaced::class, LogOrder::class, 100);
Event::listen(OrderPlaced::class, ProcessPayment::class, 50);
Event::listen(OrderPlaced::class, SendEmail::class, 10);
// Fragile — what priority should a new listener get?
```
---
## Good Example
```php
// $listen array — order in array determines execution order
protected $listen = [
    OrderPlaced::class => [
        LogOrder::class,
        ProcessPayment::class,
        SendEmail::class,
    ],
];
```
---
## Exceptions
Package listeners that must run before or after application listeners without modifying the application's `$listen` array.
---
## Consequences Of Violation
Unpredictable listener ordering. Priority numbering gaps and overlaps cause confusion. New listeners break existing priorities.
---

## Rule 6: Use Subscribers for Related Listeners
---
## Category
Code Organization
---
## Rule
Group related event listeners for the same feature into subscriber classes using `EventServiceProvider`'s `$subscribe` property.
---
## Reason
Subscribers colocate multiple event-handler mappings for a single concern (e.g., billing events, audit trail). This improves cohesion, reduces the `$listen` array size, and makes feature-specific event handling discoverable in one class.
---
## Bad Example
```php
protected $listen = [
    InvoiceGenerated::class => [LogInvoice::class],
    PaymentReceived::class => [LogPayment::class],
    SubscriptionStarted::class => [LogSubscription::class],
    PlanChanged::class => [LogPlanChange::class],
    AccountCancelled::class => [LogCancellation::class],
    // Many individual listeners for related events
];
```
---
## Good Example
```php
protected $subscribe = [
    BillingEventSubscriber::class,
];

// BillingEventSubscriber handles InvoiceGenerated, PaymentReceived,
// SubscriptionStarted, PlanChanged, AccountCancelled
```
---
## Exceptions
Listeners that are the sole handler for an event and belong to no obvious feature group.
---
## Consequences Of Violation
Large, hard-to-navigate `$listen` arrays. Related listeners scattered across multiple provider files. Reduced cohesion for feature-specific event handling.
