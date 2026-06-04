# Domain Event vs Model Event — Rules

---

## Rule: Use Model Events Only for Infrastructure Side Effects
---
## Category
Architecture
---
## Rule
Limit Eloquent model event listeners (`saved`, `created`, `updated`, `deleted`) to infrastructure concerns such as cache invalidation, logging, and search index synchronization. Never place business logic inside model event listeners.
---
## Reason
Model events fire on every persistence operation, including bulk updates and `touch()` calls, regardless of business significance. Business logic in model events executes on irrelevant changes, causing unexpected side effects and performance degradation.
---
## Bad Example
```php
class OrderObserver
{
    public function saved(Order $order): void
    {
        if ($order->wasChanged('status')) {
            Mail::send(new OrderStatusMail($order)); // Business logic in model event!
        }
    }
}
```
---
## Good Example
```php
class OrderObserver
{
    public function saved(Order $order): void
    {
        Cache::forget("order:{$order->id}"); // Infrastructure — OK
    }
}
```
---
## Exceptions
No common exceptions. Business reactions to state changes belong in domain event listeners.
---
## Consequences Of Violation
Emails sent on `touch()` calls, business workflows triggered by irrelevant attribute changes, and listeners that fire during test setup when factories create models.

---

## Rule: Dispatch Domain Events Explicitly from Domain Methods, Never from Model Events
---
## Category
Architecture
---
## Rule
Always dispatch domain events by explicitly calling `Event::dispatch()` inside a domain method (e.g., `markAsPaid()`). Never dispatch them from within a model event observer or `$dispatchesEvents` property.
---
## Reason
Model events fire automatically on every `save()`, including when the model is saved for reasons unrelated to the domain occurrence. This causes domain events to be dispatched for non-domain operations, creating phantom events in the system.
---
## Bad Example
```php
class Order extends Model
{
    protected $dispatchesEvents = [
        'saved' => OrderStatusChanged::class, // Fires on EVERY save!
    ];
}
```
---
## Good Example
```php
class Order extends Model
{
    public function markAsPaid(): void
    {
        $this->status = 'paid';
        $this->paid_at = now();
        $this->save();

        Event::dispatch(new OrderStatusChanged(
            orderId: $this->id,
            newStatus: 'paid',
        ));
    }
}
```
---
## Exceptions
No common exceptions. Explicit dispatch from domain methods is always preferred.
---
## Consequences Of Violation
Duplicate domain events on every `save()` call, phantom events during data migrations and seeding, and incorrect business state because events fired when no business operation occurred.

---

## Rule: Name Domain Events in Past Tense, Model Events in Eloquent's Convention
---
## Category
Maintainability
---
## Rule
Name domain event classes using past-tense business language (`OrderPlaced`, `PaymentReceived`, `InvoicePaid`). Keep Eloquent model event names as the built-in lifecycle method names (`saved`, `created`, `updated`, `deleted`).
---
## Reason
Past tense signals a completed business occurrence. Eloquent's lifecycle names are infrastructure concerns about persistence. Mixing naming conventions confuses developers about the event's nature — is it a business event or a persistence event?
---
## Bad Example
```php
// Business event named as a model event
class saved_order_status { ... }

// Model event named as a business event
class OrderObserver
{
    public function OrderPlaced(Order $order): void { ... }
}
```
---
## Good Example
```php
// Domain event — past tense business language
class OrderPlaced { ... }

// Model event — Eloquent lifecycle convention
class OrderObserver
{
    public function saved(Order $order): void { ... }
}
```
---
## Exceptions
No common exceptions. Follow the naming convention strictly — it communicates intent.
---
## Consequences Of Violation
Confusion about whether an event signals a business occurrence or a persistence operation, leading to misplaced listeners and logic.

---

## Rule: Carry Model Instances in Model Events, Carry IDs in Domain Events
---
## Category
Architecture
---
## Rule
Pass the full Eloquent model instance in model event listener signatures (Laravel convention). Pass only IDs and value objects (never model instances) in domain event classes.
---
## Reason
Model events are synchronous and fire within the same request — the model instance is current and accessible. Domain events may be queued and processed later; passing a serialized model instance includes stale or irrelevant data and couples listeners to the model's schema.
---
## Bad Example
```php
// Domain event carrying a model instance — bad!
class OrderPlaced
{
    public function __construct(
        public readonly Order $order,
    ) {}
}
```
---
## Good Example
```php
// Model event — Laravel passes the model instance
class OrderObserver
{
    public function saved(Order $order): void { ... }
}

// Domain event — only IDs and value objects
class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $customerId,
        public readonly int $totalCents,
    ) {}
}
```
---
## Exceptions
No common exceptions. Model events get model instances; domain events get IDs.
---
## Consequences Of Violation
Stale data in queued listeners, serialization of large model graphs, tight coupling between event consumers and model schema changes, and potential for lazy-loading N+1 queries in listeners.

---

## Rule: Never Write Business Logic in Model Event Observers
---
## Category
Architecture
---
## Rule
Keep all model event observer methods limited to infrastructure operations. Extract any business logic that reacts to a state change into a dedicated domain event and listener.
---
## Reason
Model event observers are registered globally — they fire for every model save in every context. Business logic placed here executes during testing factories, `touch()` calls, and mass updates, causing unpredictable side effects and test pollution.
---
## Bad Example
```php
class UserObserver
{
    public function created(User $user): void
    {
        if ($user->role === 'admin') {
            AdminLog::create(['user_id' => $user->id, 'action' => 'admin_created']);
            // Business logic reacting to domain occurrence — wrong place!
        }
    }
}
```
---
## Good Example
```php
// Model event — infrastructure only
class UserObserver
{
    public function created(User $user): void
    {
        Cache::forget('user_counts');
    }
}

// Domain method dispatches a domain event for business reactions
class User extends Model
{
    public function promoteToAdmin(): void
    {
        $this->role = 'admin';
        $this->save();

        Event::dispatch(new UserPromotedToAdmin($this->id));
    }
}
```
---
## Exceptions
No common exceptions. Business logic never belongs in model event observers.
---
## Consequences Of Violation
Impossible to test business reactions without full HTTP integration tests, side effects during seeding/factory creation, and confusion about why business workflows trigger on non-business operations.

---

## Rule: Disable Model Events for Bulk Operations Using `saveQuietly()`
---
## Category
Performance
---
## Rule
Use `saveQuietly()`, `Model::withoutEvents()`, or `Model::insert()` for batch operations where model event side effects are unnecessary or harmful.
---
## Reason
Model events fire on every individual `save()`, making bulk operations dramatically slower. Importing 10,000 records triggers 10,000 observer methods, most of which are irrelevant during data loading.
---
## Bad Example
```php
foreach ($records as $data) {
    Order::create($data);
    // 10,000 records = 10,000 model event chain executions
}
```
---
## Good Example
```php
Order::withoutEvents(function () use ($records) {
    foreach ($records as $data) {
        Order::create($data);
    }
});

// Or for pure inserts:
Order::insert($records);
```
---
## Exceptions
When each record genuinely requires the model event side effect (e.g., cache invalidation per record). Still, batch the side effects by collecting IDs and invalidating once.
---
## Consequences Of Violation
Order-of-magnitude slower bulk operations, database transaction log overflow, and timeouts during imports or migrations.

---

## Rule: Use `$dispatchesEvents` Only for Persistence-Level Infrastructure
---
## Category
Framework Usage
---
## Rule
If using the `$dispatchesEvents` property on a model, limit it to mapping infrastructure events (e.g., `saved` → cache-invalidation listener). Never map domain event classes in `$dispatchesEvents`.
---
## Reason
`$dispatchesEvents` fires on EVERY persistence event, making it impossible to distinguish between a business operation and an incidental save. Domain events must be dispatched intentionally from domain methods.
---
## Bad Example
```php
class Order extends Model
{
    protected $dispatchesEvents = [
        'saved' => OrderPlaced::class, // Fires on every save, not just "placed"
    ];
}
```
---
## Good Example
```php
class Order extends Model
{
    protected $dispatchesEvents = [
        'saved' => InvalidateOrderCache::class, // Infrastructure event — acceptable
    ];

    public function place(): void
    {
        $this->status = 'placed';
        $this->save();

        Event::dispatch(new OrderPlaced($this->id)); // Intentional business event
    }
}
```
---
## Exceptions
No common exceptions. The `$dispatchesEvents` property is for persistence events, not domain events.
---
## Consequences Of Violation
Domain events firing on non-business saves, phantom event processing, and difficulty understanding which save operations produce which business events.
