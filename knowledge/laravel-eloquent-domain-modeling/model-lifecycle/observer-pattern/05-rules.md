# Observer Pattern Rules

## Rule 1: Register Observers With the `#[ObservedBy]` Attribute
---
## Category
Code Organization
---
## Rule
Always use the `#[ObservedBy(ObserverClass::class)]` attribute on the model class to register observers, rather than calling `Model::observe()` in a service provider.
---
## Reason
The attribute makes observer registration visible directly on the model, improving discoverability. Service provider `observe()` calls hide registration in a separate file that developers may not know to check.
---
## Bad Example
```php
// In AppServiceProvider.php — hidden from the model
public function boot(): void
{
    Order::observe(OrderCacheObserver::class);
}
```
---
## Good Example
```php
#[ObservedBy(OrderCacheObserver::class)]
class Order extends Model {}
```
---
## Exceptions
Registration is conditional on environment, configuration, or feature flags — use `Model::observe()` in a service provider for conditional cases.
---
## Consequences Of Violation
Observer registration is not discoverable on the model class; developers may add duplicate observers; service provider grows with unrelated registration code.

---

## Rule 2: Keep Observer Classes Focused on a Single Infrastructure Concern
---
## Category
Maintainability
---
## Rule
Create one observer class per infrastructure concern (cache, audit, sync, notifications). Do not create a single "all-in-one" observer per model.
---
## Reason
Single-concern observers can be tested, modified, and reasoned about independently. An all-in-one observer grows with every new side effect, becomes hard to test, and risks introducing bugs in one concern when changing another.
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
Two concerns are so tightly coupled that separating them would duplicate code (e.g., logging and auditing that use the same data and always change together).
---
## Consequences Of Violation
Observer classes with hundreds of lines; difficult to unit test; accidental coupling between concerns; merge conflicts when multiple developers modify the same observer.

---

## Rule 3: Place Observers in the `App\Observers` Namespace
---
## Category
Code Organization
---
## Rule
Place all observer classes under the `App\Observers` namespace following the naming convention `{Model}{Concern}Observer`.
---
## Reason
A consistent namespace and naming convention makes observers discoverable through file system navigation and IDE autocompletion. Naming by model and concern (e.g., `OrderCacheObserver`, `UserAuditObserver`) clarifies both the subject and the responsibility.
---
## Bad Example
```php
// App\Observers\OrderObserver.php — unclear if it handles cache, audit, or both
```
---
## Good Example
```php
// App\Observers\OrderCacheObserver.php — clear responsibility
// App\Observers\OrderAuditObserver.php — clear responsibility
```
---
## Exceptions
The model has only one observer with a single concern (e.g., `AuditObserver` when only audit is needed).
---
## Consequences Of Violation
Difficulty locating observer classes; inconsistent naming; confusion about observer responsibilities.

---

## Rule 4: Do Not Put Business Logic in Observers — Use Domain Events Instead
---
## Category
Architecture
---
## Rule
Keep business logic reactions (discounts, workflows, state machines) in domain event listeners, not Eloquent observers.
---
## Reason
Eloquent observers trigger on every persistence operation, including test setup, seeding, and migrations. Business logic in observers fires in contexts where it should not. Domain events are explicit — they are dispatched only when the domain operation occurs.
---
## Bad Example
```php
class OrderObserver
{
    public function created(Order $order): void
    {
        if ($order->total_cents > 1000) {
            $order->applyFreeShipping(); // Business logic in observer
        }
    }
}
```
---
## Good Example
```php
// Domain event dispatched explicitly
class PlaceOrderAction
{
    public function execute(Order $order): void
    {
        $order->save();
        event(new OrderPlaced($order));
    }
}

// Listener handles business reaction
class ApplyFreeShippingListener
{
    public function handle(OrderPlaced $event): void
    {
        if ($event->order->total_cents > 1000) {
            $event->order->applyFreeShipping();
            $event->order->save();
        }
    }
}
```
---
## Exceptions
The logic is purely infrastructural and should fire on every persistence (e.g., indexing the model in Elasticsearch).
---
## Consequences Of Violation
Business logic fires during seeding, testing, and migration; side effects that should not occur in those contexts; difficulty tracing why business rules executed.

---

## Rule 5: Keep Observer Method Bodies Under 5 Lines
---
## Category
Maintainability
---
## Rule
Limit each observer method to a single operation (cache forget, log write, job dispatch) — typically 1-5 lines.
---
## Reason
Observer methods should be thin dispatch points. If an observer method needs more than 5 lines, the logic probably belongs in a dedicated class or job. Long observer methods indicate misplaced responsibility.
---
## Bad Example
```php
public function saved(Order $order): void
{
    $cacheKey = "order:{$order->id}";
    $tags = ['orders', 'user:'.$order->user_id];
    Cache::tags($tags)->forget($cacheKey);

    $order->load('items', 'user', 'shippingAddress');
    $this->externalApi->post($order->toArray());

    if ($order->status === 'shipped') {
        Mail::send(new OrderShipped($order));
    }
}
```
---
## Good Example
```php
public function saved(Order $order): void
{
    Cache::forget("order:{$order->id}");
}
```
---
## Exceptions
The observer dispatches multiple independent side effects (e.g., cache forget + job dispatch) — two lines is still acceptable.
---
## Consequences Of Violation
Observers become dumping grounds for unrelated logic; hard to test; side effects are difficult to track and manage.

---

## Rule 6: Do Not Call Other Models' Observer Methods Directly
---
## Category
Design
---
## Rule
Never call an observer method directly from another observer, controller, or service. Let Eloquent dispatch observers automatically.
---
## Reason
Observer methods are lifecycle hooks meant to be triggered by Eloquent's event dispatcher. Calling them directly bypasses the event system, skips other registered observers, and couples the caller to the observer's internal implementation.
---
## Bad Example
```php
$observer = new OrderCacheObserver();
$observer->saved($order); // Bypassing event dispatch — other observers don't fire
```
---
## Good Example
```php
$order->save(); // All observers fire through Eloquent's event system
```
---
## Exceptions
Testing the observer in isolation, using a mock or instance directly.
---
## Consequences Of Violation
Only one observer fires; other registered observers are skipped; event propagation halting is bypassed; fragile coupling to observer classes.

---

## Rule 7: Type-Hint the Specific Model Class in Observer Methods, Not `Model`
---
## Category
Maintainability
---
## Rule
Type-hint the specific model class in observer method signatures, not the generic `Model` base class.
---
## Reason
A specific type hint documents which model the observer handles and enables IDE autocompletion, static analysis, and refactoring tools. A generic `Model` type hides the observer's subject and disables these benefits.
---
## Bad Example
```php
public function saved(Model $model): void // Generic — unknown which model
{
    Cache::forget($model->getTable().':'.$model->id);
}
```
---
## Good Example
```php
public function saved(Order $order): void // Specific — clearly for Order
{
    Cache::forget("order:{$order->id}");
}
```
---
## Exceptions
A polymorphic observer that handles multiple model types generically (e.g., a `GlobalCacheObserver` that works with any model).
---
## Consequences Of Violation
No IDE support for model-specific properties; ambiguity about which model the observer handles; risk of accidentally accepting the wrong model type.
