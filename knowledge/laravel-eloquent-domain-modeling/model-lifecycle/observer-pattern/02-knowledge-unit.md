# Observer Pattern

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
The Observer pattern in Eloquent provides a structured way to listen to model lifecycle events by grouping related event listeners into a single class. Observers decouple event handling logic from the model itself, allowing models to focus on data and relationships while observers handle side effects like cache invalidation, audit logging, notifications, and synchronization. Each observer method maps directly to a model event by name convention.

## Core Concepts
- **Observer class:** A plain PHP class with methods named after model events (e.g., `created(Model $model)`, `updated(Model $model)`, `deleted(Model $model)`).
- **Method-to-event mapping:** Observer method names must match event names exactly. `saving()` maps to the `saving` event, `creating()` to `creating`, etc. Custom events (added via `$observables`) also follow this convention.
- **Method signatures:** Each observer method receives the model instance as its sole parameter. No return type is enforced, but returning `false` from `*ing` methods halts the operation (same as closure listeners).
- **Registration:** Observers are registered via `Model::observe(ObserverClass::class)` or the `#[ObservedBy]` attribute.
- **Multiple observers per model:** A model can have multiple observers. All observers fire for each event, in registration order.
- **Single observer per model:** An observer can be registered on multiple models. Each model gets its own observer instance.

## Mental Models
- **Grouped event listeners:** Think of an observer as a named collection of event listeners. Instead of scattering closures across `booted()` methods, observer classes organize related concerns (e.g., `AuditObserver`, `CacheObserver`, `NotificationObserver`).
- **Plugin architecture:** Observers are plugins that attach to models at registration time. The model does not know which observers are attached. Observers can be added or removed without modifying the model class.
- **Lifecycle mirror:** Observer methods mirror the model lifecycle. If you list the methods in an observer class, you get a complete picture of what lifecycle hooks that observer handles.

## Internal Mechanics

> **Reference:** 
- `Model::observe($observer)` calls `registerObserverMethods()` which uses reflection to discover public methods on the observer class.
- Each discovered method is bound to the model's event dispatcher as a closure listener:

```php
foreach ($observerMethods as $event => $method) {
    static::registerModelEvent($event, $observer->$method(...));
}
```

- The observer is instantiated once via the container. If the observer class has dependencies, they are resolved through the service container.
- When an event fires, the dispatcher calls the bound closure, which invokes the observer method with the model instance.
- `registerModelEvent()` is the same method used by `Model::created()`, `Model::saving()`, etc. Observers and closures share the same underlying mechanism.

```
// Simplified registration:
public static function observe($observer): void
{
    $instance = new $observer;
    
    foreach (get_class_methods($instance) as $method) {
        if (method_exists(static::class, $method)) {
            continue; // Skip model methods
        }
        static::registerModelEvent($method, [$instance, $method]);
    }
}
```

- The `#[ObservedBy]` attribute (Laravel 10+) registers observers automatically on model boot via the `HasEvents` trait's `bootObservedByAttribute()` method.

## Patterns
- **Separation by concern:** Create one observer per concern: `AuditObserver` for logging, `SearchObserver` for search index sync, `CacheObserver` for cache invalidation.
- **Observer + service layer:** Observers call into service/repository classes rather than implementing complex logic directly. This keeps observers thin and testable.
- **Conditional observer registration:** Register observers only in certain environments or contexts:

```php
// In AppServiceProvider::boot()
if (config('app.env') !== 'testing') {
    User::observe(SearchObserver::class);
}
```

- **Observer traits:** Extract shared observer logic into traits used by multiple observer classes. For example, a `LogsActivity` trait for observers that need activity logging.

## Architectural Decisions
- **Why observers instead of closures?** â€” Closures registered in `booted()` are simpler for single-use listeners. Observers organize multiple listeners into a single class with a clear naming convention. Use closures for one-off logic; use observers for cohesive sets of related side effects.
- **Why method-name convention instead of event class mapping?** â€” The convention eliminates configuration. An observer method named `created()` automatically handles the `created` event. No mapping array, no configuration file.
- **Why container-resolved observers?** â€” Container resolution allows dependency injection. Observers can receive repositories, loggers, mailers, and other services through their constructors without static coupling.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clean separation of side effects from model logic | Observer logic is invisible at the model call site | Developers may not know observers exist |
| Dependency injection via container | Observers are singletons (one instance) | Avoid storing request-scoped state in observer properties |
| Multiple observers can coexist | Execution order between observers is registration-order dependent | Document observer ordering requirements |
| #[ObservedBy] attribute makes registration explicit | Attribute-based registration is not overridable in tests | Use manual registration for testable observer configurations |

## Performance Considerations
- **Observer dispatch overhead:** Each observer method call is a dispatched event listener. The overhead is proportional to the number of observers Ã— the number of events.
- **Observer instantiation:** Observers are instantiated once at registration time, not per event. Instantiation cost is negligible.
- **Heavy observer dependencies:** If an observer depends on a heavy service (e.g., a full Elasticsearch client), it is instantiated at registration time even if the observer methods rarely fire. Consider lazy injection or deferred observers.

## Production Considerations
- **Observer exceptions:** An exception in one observer does not prevent other observers from executing *if* the event dispatcher catches and logs it. However, exceptions in synchronous observers propagate up by default. Wrap observer logic in try-catch blocks for resilience.
- **Observer logging:** Log observer entry and exit in production. When debugging unexpected side effects, the first question is "which observers are registered and did they fire?"
- **Observer discovery:** Use `php artisan model:show User` to see registered observers. For a comprehensive list, check `EventServiceProvider` or `AppServiceProvider::boot()`.
- **Conditional registration:** Use environment-based registration to disable certain observers in development or testing without modifying the observer code.

## Common Mistakes
- **Logic-heavy observers:** Observers that contain complex business logic, database queries, or API calls are hard to test and reason about. Keep observers thin â€” delegate to services.
- **Stateful observers:** Storing request-scoped state on the observer instance (which is a singleton) causes data leakage between requests. Use stateless observer design.
- **Missing error handling:** Observer methods that throw exceptions crash the save operation. Always catch and handle expected failures.
- **Registering the same observer twice:** Duplicate registration causes the observer methods to fire twice per event. Check `AppServiceProvider::boot()` for accidental double-registration.

## Failure Modes
- **Silent observer failure:** An observer method that silently catches all exceptions may hide critical failures. Log failures and alert on unexpected conditions.
- **Observer dependency deadlock:** If observer A calls a service that triggers an event that observer B handles, and observer B depends on observer A having completed, a circular dependency deadlock occurs.
- **Observer ordering race:** Two observers that modify the same model attribute in the same event (e.g., both `saving`) produce non-deterministic results if their execution order is not documented.

## Ecosystem Usage
- **Laravel Horizon:** Uses observers to manage job lifecycle events (job processed, job failed).
- **Spatie/Laravel-Activitylog:** Provides an observer trait that automatically logs model events.
- **Laravel Nova:** Uses observers for resource lifecycle management and action hooks.

## Related Knowledge Units

### Prerequisites
- Event Catalog
- Event Dispatch Order

### Related Topics
- Observer Registration (how to register)
- Observer Anti-Patterns (what to avoid)

### Advanced Follow-up Topics
- Manual Event Firing
- Trait Boot Conventions

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Concerns\HasEvents::observe()` â€” uses reflection to discover observer methods and registers them as event listeners. `Illuminate\Database\Eloquent\Attributes\ObservedBy` for attribute registration.
- **Key Insight:** Observers and closures registered via `Model::created()` use the same underlying `registerModelEvent()` method. There is no performance or capability difference â€” the choice is purely organizational.
- **Version-Specific Notes:** The `#[ObservedBy]` attribute was introduced in Laravel 10.x. Observer resolution through the container has been present since Laravel 5.x. The `observe()` method was part of the original Eloquent design.
