# Observer Registration

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
Observer registration is the mechanism by which observer classes are bound to Eloquent models. Laravel supports three registration methods: explicit `Model::observe()` calls in service providers, the `#[ObservedBy]` PHP 8 attribute on the model class, and manual event listener registration via the dispatcher. The registration method determines discoverability, testability, and ordering behavior.

## Core Concepts
- **`Model::observe(ObserverClass::class)`** — Registers an observer for the given model class. Can be called multiple times for multiple observers. Registration is cumulative.
- **`#[ObservedBy(ObserverClass::class)]`** — PHP 8 attribute on the model class. Automatically registers the observer when the model boots. Supported since Laravel 10.
- **Multiple observers per model:** A model can have any number of observers. All observers fire for each event in the order they were registered.
- **Single observer on multiple models:** `Model::observe([UserObserver::class, PostObserver::class])` accepts an array.
- **Registration order:** Observers registered first fire first. Order matters when observers interact with the same event.
- **Observer resolution:** Observers are resolved through the service container, allowing dependency injection.

## Mental Models
- **Service provider as registry:** `AppServiceProvider::boot()` (or a dedicated `EventServiceProvider`) is the canonical place for explicit observer registration. Think of it as the observer registry.
- **Attribute as declaration:** `#[ObservedBy]` declares the observer as an intrinsic property of the model class. The observer is always registered when the model is used, regardless of service provider configuration.
- **Registration is explicit, not auto-discovered:** Unlike Laravel's auto-discovered events, observers must be explicitly registered. There is no convention-based auto-discovery for observers.

## Internal Mechanics
- `Model::observe()` (in `HasEvents` trait) does the following:
  1. Resolves the observer class from the container.
  2. Uses reflection to discover public methods on the observer.
  3. Filters out methods that match model methods (to avoid conflicting with inherited behavior).
  4. Registers each remaining method as a listener via `registerModelEvent()`.
  5. Calls any `$observer->boot()` method on the observer (if it exists), passing the model class as the argument.
- `registerModelEvent()` creates a closure-based listener on the model's event dispatcher under the `eloquent.{event}: {class}` namespace.
- The `#[ObservedBy]` attribute is processed in `bootObservedByAttributes()` (called from `bootTraits()` or the `booted()` lifecycle). It reads the attribute from the model class's reflection and calls `observe()` with the specified observer class.
- Observer instances are singletons (one instance per observer class per model class). The same instance handles all events for that model.

```php
// Registration flow:
public static function observe($observers): void
{
    foreach (Arr::wrap($observers) as $observer) {
        $instance = $observer instanceof stdClass
            ? $observer
            : static::getObserveInstance($observer);
        
        static::registerObserverMethods($instance);
    }
}
```

- `getObserveInstance()` resolves from the container, so observer constructors receive injected dependencies.

## Patterns
- **Dedicated observer service provider:** Create `App\Providers\ObserverServiceProvider` to centralize all observer registrations. This keeps `AppServiceProvider` clean and makes observer registration discoverable.
- **Environment-based registration:** Register different observer sets per environment:

```php
public function boot(): void
{
    if (app()->environment('production')) {
        User::observe(AuditObserver::class);
        User::observe(SearchObserver::class);
    }
    
    if (app()->environment('testing')) {
        User::observe(TestAuditObserver::class);
    }
}
```

- **`#[ObservedBy]` for core observers, service provider for conditional observers:** Use the attribute for observers that should always fire (e.g., a `TimestampObserver` for all models). Use service provider registration for observers that may be conditional or environment-specific.
- **Lazy observer registration:** Defer observer registration until a model event actually fires, for performance-critical models:

```php
// Register a closure that registers the observer on first use
User::retrieved(fn () => User::observe(ExpensiveObserver::class));
```

## Architectural Decisions
- **Why both attribute and service provider?** — Attributes make the observer-model relationship explicit on the model class. Service providers allow centralized management and conditional registration. Both are valid; choose based on project organization preferences.
- **Why container resolution?** — Constructor injection makes observers testable and composable. An observer can receive a logger, mailer, or repository without static coupling.
- **Why early registration (during boot) instead of lazy?** — Early registration ensures observers are active for all model operations, including those in service providers, middleware, and queued jobs. Lazy registration would miss events fired before the first model interaction.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| `#[ObservedBy]` makes observer explicit on model | Attribute cannot be conditionally disabled | Use `observe()` in service providers for conditional registration |
| Container resolution enables DI | Observer is a singleton — state leaks between requests | Keep observers stateless |
| Multiple registration methods offer flexibility | Team may mix styles inconsistently | Establish a project convention and document it |
| Observer `boot()` method provides setup hook | `boot()` runs on every registration, not just first | Guard observer `boot()` with static flags if needed |

## Performance Considerations
- **Reflection overhead:** `observe()` uses reflection to discover observer methods. This happens once at registration (boot time), not per event. The cost is a few milliseconds during application boot.
- **Memory footprint:** Each observer instance stays in memory for the request lifetime. Observers with heavy dependencies increase memory usage.
- **Registration at boot vs. lazily:** Registering 20+ observers at boot adds measurable bootstrap time. For high-performance APIs, consider lazy registration or reducing observer count.

## Production Considerations
- **Observer ordering documentation:** Document the expected execution order of observers for each model. If `AuditObserver` must fire before `SearchObserver`, register them in that order.
- **Audit trail of registered observers:** Log all registered observers at application boot. This aids debugging when unexpected behavior occurs.
- **Single source of truth:** Choose one registration method per project. Mixing `#[ObservedBy]` and service provider registration leads to confusion about which observers are active.
- **Testing observer registration:** In tests, use `Model::observe()` in `setUp()` or use `RefreshDatabase` trait's handling. For tests that should not trigger observers, use `Model::withoutEvents()`.

## Common Mistakes
- **Forgetting to register:** Observers are not auto-discovered. Missing `Model::observe()` or `#[ObservedBy]` means the observer never runs.
- **Double registration:** Calling `Model::observe()` in multiple service providers for the same observer. This causes duplicate observer execution.
- **Mixing registration styles inconsistently:** Some observers via attribute, others via service provider, with no clear documentation. This creates confusion about which observers are active.
- **Registering in constructor instead of `boot()`:** Registering observers in a service provider's `register()` method (before boot) may fail because the model class is not fully initialized.

## Failure Modes
- **Circular observer registration:** Observer A's `boot()` method registers Observer B, and Observer B's `boot()` registers Observer A. This creates infinite recursion during boot.
- **Registration during boot order conflict:** If two service providers register observers for the same model in different boot order, the execution order is non-deterministic and depends on provider ordering.
- **Attribute-based registration cannot be removed:** Once `#[ObservedBy]` is on the model, the observer always registers. There is no runtime mechanism to unregister an attribute-based observer except removing the attribute.

## Ecosystem Usage
- **Laravel Nova:** Uses `#[ObservedBy]` on its internal models for resource lifecycle management.
- **Laravel Cashier:** Registers observers explicitly in its service provider for billing model lifecycle tracking.
- **Spatie Packages (MediaLibrary, Activitylog):** Provide observer traits that are manually registered by the developer, typically in `AppServiceProvider::boot()`.

## Related Knowledge Units

### Prerequisites
- Observer Pattern (fundamentals)
- Service Providers

### Related Topics
- Event Catalog
- Observer Anti-Patterns

### Advanced Follow-up Topics
- Manual Event Firing
- Trait Boot Conventions

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Concerns\HasEvents::observe()` and `registerObserverMethods()`. `Illuminate\Database\Eloquent\Attributes\ObservedBy` attribute class.
- **Key Insight:** Observer registration through `observe()` and `#[ObservedBy]` ultimately calls the same `registerModelEvent()` method. The difference is only in timing and discoverability — attribute-registered observers are registered during model boot, while service provider-registered observers are registered at provider boot time.
- **Version-Specific Notes:** `#[ObservedBy]` attribute was introduced in Laravel 10.x. Prior to that, only `Model::observe()` was available. The observer `boot()` method has been supported since Laravel 5.x.
