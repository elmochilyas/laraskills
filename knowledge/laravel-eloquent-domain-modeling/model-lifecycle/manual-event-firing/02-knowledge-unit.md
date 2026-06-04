# Manual Event Firing

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
Eloquent provides `fireModelEvent()` and related methods to manually dispatch model events independent of database operations. This enables custom event-driven workflows where model events signal domain occurrences, not just persistence. Manual firing is essential for triggering observers from non-persistence operations, implementing custom lifecycle hooks, and decoupling event dispatch from the save/delete cycle.

## Core Concepts
- **`fireModelEvent($event)`** â€” Dispatches a named model event through the event dispatcher. Returns `false` if the event was halted (for `*ing` events). Returns `true` otherwise.
- **Custom model events:** Any string can be passed to `fireModelEvent()`. Custom events are dispatched through the same listener resolution as built-in events. Observers can listen to them if the observer method name matches.
- **Observer method mapping:** Eloquent maps observer method names to events by convention. `Model::observe(ObserverClass::class)` registers methods like `saving(Model $model)` to the `saving` event. Custom events follow the same convention â€” an observer method `published(Model $model)` maps to a `published` event.
- **`getObservableEvents()`:** Returns the list of event names the model considers "observable." Custom events must be added to this array to work with observers.
- **Event dispatcher access:** `Model::getEventDispatcher()` returns the dispatcher instance. `Model::setEventDispatcher($dispatcher)` allows overriding it. `Model::unsetEventDispatcher()` removes it.

## Mental Models
- **Event as signal, not action:** Firing a model event manually is like broadcasting a signal that something domain-relevant happened. The event does not perform any DB operation â€” it only notifies listeners.
- **Custom event namespace:** Model events go through the `eloquent.*` namespace in the dispatcher. `$this->fireModelEvent('published')` dispatches `eloquent.published: App\Models\Article`. This keeps model events separate from generic application events.
- **Observer contract extension:** Adding a custom event is extending the observer contract. Any observer that implements a method matching the custom event name will be called when the event fires.

## Internal Mechanics

> **Reference:** 
- `fireModelEvent()` does the actual dispatching:

```php
protected function fireModelEvent($event, $halt = true)
{
    if (! isset(static::$dispatcher)) {
        return true;
    }
    
    $method = $halt ? 'until' : 'dispatch';
    
    $result = $this->filterModelEventResults(
        $this->getEventDispatcher()->{$method}(
            "eloquent.{$event}: ".static::class, $this
        )
    );
    
    if ($result === false) {
        return false;
    }
    
    return true;
}
```

- `getObservableEvents()` returns the default event list. Custom events can be added via `$observables` array property or `addObservableEvents()` method.
- When an observer method is called, Eloquent's `registerObserverMethods()` maps each method name to the corresponding event. The mapping is exact â€” observer method `saving()` maps to event `saving`.
- Custom events fired manually will trigger observer methods of the same name. For example, firing `$article->fireModelEvent('published')` calls `PublishedObserver::published($article)` if registered.

```php
// Adding a custom observable event:
class Article extends Model
{
    protected $observables = ['published', 'archived'];
}

// Firing it:
$article->fireModelEvent('published');
```

## Patterns
- **Domain event emission:** Fire custom model events (`orderShipped`, `paymentConfirmed`, `subscriptionCanceled`) from service methods that perform complex domain workflows. Observers react to these events without coupling to the service layer.
- **Test helper pattern:** In tests, fire specific events to validate observer behavior without needing database state:

```php
$model = Model::factory()->make();
$model->fireModelEvent('created', false);
// Assert observer side effects
```

- **Event passthrough pattern:** When a service method saves a model and needs to fire additional signals, chain `fireModelEvent()` after `save()`:

```php
public function publish(Article $article): void
{
    $article->save();
    $article->fireModelEvent('published');
}
```

- **Observer-only custom events:** Register an observer and define custom methods that respond to non-standard lifecycle events. The observer pattern remains clean without cluttering the model with listener registration in `booted()`.

## Architectural Decisions
- **Why use `fireModelEvent()` vs. `event()` helper?** â€” `fireModelEvent()` goes through the model's dedicated dispatcher and supports the `halt` parameter. The `event()` helper dispatches generic application events which do not trigger observer methods.
- **Why add to `$observables`?** â€” The `$observables` whitelist ensures that observer methods are only invoked for declared events. Without this, any public method on an observer could be inadvertently mapped to a model event.
- **Why separate dispatcher?** â€” Model events use a separate dispatcher instance (accessible via `getEventDispatcher()`) to allow model-specific event handling without polluting the global event system.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Decouples event emission from persistence | Developers can fire events at wrong times | Establish conventions: fire custom events after DB operations |
| Extends observer pattern naturally | Custom events not documented in Laravel core docs | Document custom events in the model's docblock |
| Testable observer behavior in isolation | Manual firing bypasses the before/after persistence contract | Verify that custom events do not conflict with built-in event expectations |

## Performance Considerations
- **Manual event dispatch is cheap:** `fireModelEvent()` without listeners adds negligible overhead. The cost is proportional to the number of registered listeners, same as built-in events.
- **Custom event overuse:** Firing custom events on every request for analytics, logging, or notification can accumulate dispatch overhead. Batch or queue custom event side effects.

## Production Considerations
- **Event naming collisions:** A custom event named `updated` would shadow the built-in `updated` event. Never name custom events after built-in events. Prefix custom events (e.g., `order:shipped` mapped via observable).
- **Observer method conflicts:** If an observer already has a method named after a custom event, it will be called. Ensure observer method names are intentional â€” both for built-in and custom events.
- **Serialization of custom events:** If a custom event payload is serialized (for queues), ensure the model's relationships and loaded attributes are included as needed.

## Common Mistakes
- **Fire before persistence:** Firing `created` after a `factory()->make()` but before `save()`. Observers expecting a persisted model with an ID receive an unsaved model.
- **Not adding to `$observables`:** Observers will not receive custom events unless the event name is in `$observables`. This is a silent failure â€” no error, but the observer never fires.
- **Halting confusion with custom events:** Passing `true` (halt) to `fireModelEvent()` for a custom event means a listener returning `false` will halt the calling method. Ensure the caller handles the `false` return.
- **Assuming custom events fire during `saving`/`saved`:** They don't. Custom events only fire when explicitly called.

## Failure Modes
- **Observer method name collision:** If a built-in event name matches a custom event name, both the built-in lifecycle and the manual fire will trigger the same observer method. This can cause double execution.
- **Disconnected dispatcher:** If `Model::unsetEventDispatcher()` was called (e.g., in a test teardown), `fireModelEvent()` silently returns `true` without dispatching. Listeners never execute.
- **Partial observer invocation:** A custom event fires, but only some registered observers have the corresponding method. Observers without the method are silently skipped, which may lead to inconsistent behavior across observers.

## Ecosystem Usage
- **Spatie/Laravel-Event-Sourcing:** Uses manual model events as domain event sources for event-sourced systems.
- **Laravel Auditing:** Uses manual `fireModelEvent('auditing')` within its own traits to fire audit-specific events without conflicting with the persistence cycle.
- **Laravel Nova:** Fires custom events (`resourceSaved`, `resourceDeleted`) via manual event firing to notify Nova-specific listeners.

## Related Knowledge Units

### Prerequisites
- Event Catalog
- Event Dispatch Order

### Related Topics
- Event Propagation (halting mechanics)
- Observer Pattern

### Advanced Follow-up Topics
- Custom Event Classes
- Domain Events
- Event Sourcing

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Concerns\HasEvents::fireModelEvent()`, `getObservableEvents()`, `addObservableEvents()`. The `$observables` property is defined per-model.
- **Key Insight:** Custom events bypass the before/after persistence sandwich pattern. They are not wrapped by `saving`/`saved`. This is both a strength (clean domain signals) and a risk (observers may assume the model was just persisted).
- **Version-Specific Notes:** The `$observables` property has existed since Laravel 4.x. The `fireModelEvent()` signature has remained stable. Laravel 9.x added better type hints. The per-class dispatcher instance was formalized in Laravel 8.x.
