# Manual Event Firing Rules

## Rule 1: Use `fireModelEvent()` for Testing Observer Logic Without Persistence
---
## Category
Testing
---
## Rule
Use `$model->fireModelEvent('created')` to test observer methods without creating a database record.
---
## Reason
`fireModelEvent()` dispatches the event without running the database operation. This allows testing observer logic in isolation, without side effects from actual persistence. It makes tests faster and more focused.
---
## Bad Example
```php
public function test_order_created_invalidates_cache(): void
{
    $order = Order::factory()->create(); // Slow — hits database
    // Observer fires automatically
}
```
---
## Good Example
```php
public function test_order_created_invalidates_cache(): void
{
    $order = Order::factory()->make(); // In-memory only
    $order->fireModelEvent('created', false); // Fire event without persisting
    // Assert cache invalidation
}
```
---
## Exceptions
Testing requires the model to be persisted (e.g., testing `retrieved` event behavior against actual database data).
---
## Consequences Of Violation
Slow test suites; tests coupled to database state; inability to test observer logic in isolation.

---

## Rule 2: Use `$observables` to Register Custom Model Events, Then Fire Them With `fireModelEvent()`
---
## Category
Design
---
## Rule
Add custom event names to the model's `$observables` array and fire them via `fireModelEvent()` to extend the lifecycle with domain-specific hooks.
---
## Reason
Custom events allow observers to react to domain-specific transitions (e.g., `processing`, `shipped`) alongside standard lifecycle events. `$observables` ensures the events are discoverable through `getObservableEvents()` and fire through the same dispatch mechanism.
---
## Bad Example
```php
class Order extends Model
{
    public function process(): void
    {
        event(new OrderProcessing($this)); // Standard event — not in model lifecycle
    }
}
```
---
## Good Example
```php
class Order extends Model
{
    protected $observables = ['processing'];

    public function process(): void
    {
        $this->fireModelEvent('processing');
    }
}
```
---
## Exceptions
The event is a domain event that should be dispatched through the Event facade, not through the model lifecycle.
---
## Consequences Of Violation
Custom events bypass the model's observer infrastructure; observers cannot react to domain transitions; two different event systems for similar concerns.

---

## Rule 3: Never Replace Normal Persistence With Manual Event Firing
---
## Category
Design
---
## Rule
Do not use `fireModelEvent()` or `dispatchEvents()` as a replacement for `save()`, `delete()`, or other persistence methods.
---
## Reason
Manual event firing triggers listener code without performing the database operation. Using it as a persistence replacement means no data is actually written. Standard `save()` and `delete()` fire events automatically and persist data — manual firing should only supplement this flow.
---
## Bad Example
```php
public function saveOrder(Order $order): void
{
    $this->fireModelEvent('creating'); // No INSERT happens
    $order->total_cents = 0;
    $this->fireModelEvent('created');  // Record never exists
}
```
---
## Good Example
```php
public function saveOrder(Order $order): void
{
    $order->save(); // Events fire automatically; data is persisted
}
```
---
## Exceptions
Replaying events for data recovery or audit re-processing where persistence is explicitly not desired.
---
## Consequences Of Violation
Data not persisted despite developer intent; phantom events with no backing records; data loss in production paths.

---

## Rule 4: Use `Model::dispatchEvents()` Only When You Need to Fire Queued Events Without Saving
---
## Category
Framework Usage
---
## Rule
Only call `Model::dispatchEvents()` when you need to flush the model's queued event buffer without performing a save operation.
---
## Reason
Eloquent queues events during `save()` and dispatches them after the operation. `dispatchEvents()` flushes this queue without saving. Using it unnecessarily creates events without corresponding data changes, confusing listeners that expect persistence.
---
## Bad Example
```php
$order->setAttribute('status', 'placed');
$order->dispatchEvents(); // Fires events but no save — listeners see no DB change
```
---
## Good Example
```php
$order->status = 'placed';
$order->save(); // Persists and dispatches events together
```
---
## Exceptions
Testing the event dispatch mechanism itself or manually managing the event life cycle in a custom persistence adapter.
---
## Consequences Of Violation
Events fire without data changes; listeners receive stale model state; cache invalidation runs when no data changed.

---

## Rule 5: Always Pass `false` as the Second Argument to `fireModelEvent()` When Firing Without Halting
---
## Category
Framework Usage
---
## Rule
Pass `false` as the second argument to `fireModelEvent($event, $halt = false)` when you do not want the event to halt on a `false` return from listeners.
---
## Reason
By default, `fireModelEvent()` passes `$halt = true`, which checks listener return values and stops propagation on `false`. Firing custom events may not intend to halt, and the default behavior may block unrelated operations.
---
## Bad Example
```php
// Halt = true — any listener returning false blocks chain
$this->fireModelEvent('processing');
```
---
## Good Example
```php
// Halt = false — listeners fire but cannot halt
$this->fireModelEvent('processing', false);
```
---
## Exceptions
The custom event is explicitly designed to allow halting (e.g., a `validating` event that should abort processing).
---
## Consequences Of Violation
A misbehaving listener returning `false` silently blocks event propagation and the domain operation.

---

## Rule 6: Keep `$observables` Declarations Close to Where Custom Events Are Fired
---
## Category
Maintainability
---
## Rule
Declare `$observables` entries in the same model or trait that fires the custom event, not inherited from a distant parent class.
---
## Reason
`$observables` defines which event names the model's observer infrastructure recognizes. If defined in a distant parent, a developer reading the model may not know custom events exist. Proximity between declaration and usage improves discoverability.
---
## Bad Example
```php
// In BaseModel (far away)
class BaseModel extends Model
{
    protected $observables = ['processing'];
}

// In subclass — developer may not know 'processing' exists
class Order extends BaseModel
{
    public function process(): void
    {
        $this->fireModelEvent('processing');
    }
}
```
---
## Good Example
```php
trait HasProcessingEvent
{
    protected $observables = ['processing'];

    public function process(): void
    {
        $this->fireModelEvent('processing', false);
    }
}

class Order extends Model
{
    use HasProcessingEvent;
}
```
---
## Exceptions
The parent class defines a shared set of custom events used across all subclasses.
---
## Consequences Of Violation
Custom events defined in one place and fired in another; developers unsure which events are available; difficulty refactoring event names.
