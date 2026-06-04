# Observer Registration Rules

## Rule 1: Default to `#[ObservedBy]` Attribute for Observer Registration
---
## Category
Code Organization
---
## Rule
Always register observers using the `#[ObservedBy(Observer::class)]` attribute on the model class unless registration is conditional.
---
## Reason
The attribute keeps registration co-located with the model, making it immediately visible to anyone reading the class. Service provider registration hides the binding in a separate file that is easy to overlook during maintenance.
---
## Bad Example
```php
// AppServiceProvider.php — registration hidden
public function boot(): void
{
    Order::observe(OrderCacheObserver::class);
    Order::observe(OrderAuditObserver::class);
}
```
---
## Good Example
```php
#[ObservedBy(OrderCacheObserver::class)]
#[ObservedBy(OrderAuditObserver::class)]
class Order extends Model {}
```
---
## Exceptions
Registration depends on environment, configuration, or feature flags — use `Model::observe()` for conditional cases.
---
## Consequences Of Violation
Developers adding observers must know to check the service provider; registration may be duplicated or missed; model class does not fully document its own lifecycle bindings.

---

## Rule 2: Use `Model::observe()` Only for Conditional Registration
---
## Category
Design
---
## Rule
Use `Model::observe()` only when observer registration depends on a runtime condition (environment, config flag, feature toggle).
---
## Reason
Conditional registration cannot use attributes because attributes are compiled at load time. `Model::observe()` in a service provider's `boot()` method allows conditionals, but should be limited to cases where unconditional registration would be incorrect.
---
## Bad Example
```php
// Unconditional registration in service provider — should use #[ObservedBy]
public function boot(): void
{
    Order::observe(OrderCacheObserver::class);
}
```
---
## Good Example
```php
// Conditional — only registers in debug mode
public function boot(): void
{
    if (config('app.debug')) {
        Order::observe(DebugOrderObserver::class);
    }
}
```
---
## Exceptions
A third-party package that cannot modify the model class to add attributes.
---
## Consequences Of Violation
Inconsistent registration patterns; mix of attribute and service provider registration with no clear rule; harder to audit all observer bindings.

---

## Rule 3: Group All `observe()` Calls in One Service Provider
---
## Category
Code Organization
---
## Rule
Place all `Model::observe()` calls in a single dedicated service provider (e.g., `AppServiceProvider::boot()` or `ObserverServiceProvider`), not scattered across multiple providers.
---
## Reason
Scattered registration calls make it difficult to audit which observers are registered. A single provider serves as the canonical registry for programmatic observer bindings, simplifying maintenance and debugging.
---
## Bad Example
```php
// In multiple providers — hard to find all registrations
// AuthServiceProvider registers UserObserver
// EventServiceProvider registers OrderObserver
// AppServiceProvider registers InvoiceObserver
```
---
## Good Example
```php
class ObserverServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (config('app.debug')) {
            Order::observe(DebugOrderObserver::class);
        }
    }
}
```
---
## Exceptions
Package-specific service providers that must register their own observers.
---
## Consequences Of Violation
Difficulty auditing all registered observers; duplicate registrations; confusion about where to add new observers.

---

## Rule 4: Register Multiple Observers With Multiple `#[ObservedBy]` Attributes, Not One Array
---
## Category
Maintainability
---
## Rule
Stack multiple `#[ObservedBy]` attributes (one per observer) instead of attempting to pass an array of observers to a single attribute.
---
## Reason
PHP 8 attributes do not natively support array arguments cleanly for this purpose. Multiple attributes are the idiomatic pattern and make it easy to add, remove, and reorder observers independently.
---
## Bad Example
```php
// Hypothetical — #[ObservedBy] expects a single class
#[ObservedBy([OrderCacheObserver::class, OrderAuditObserver::class])]
```
---
## Good Example
```php
#[ObservedBy(OrderCacheObserver::class)]
#[ObservedBy(OrderAuditObserver::class)]
class Order extends Model {}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Compilation errors; non-standard attribute usage; difficulty reordering or selectively removing observers.

---

## Rule 5: Order `#[ObservedBy]` Attributes and `observe()` Calls by Dependency
---
## Category
Reliability
---
## Rule
List `#[ObservedBy]` attributes or `observe()` calls in dependency order: observers that set up prerequisites before observers that depend on them.
---
## Reason
Observers fire in registration order. If observer A depends on state created by observer B, A must be registered after B. Ordering by dependency prevents subtle ordering bugs.
---
## Bad Example
```php
#[ObservedBy(OrderNotificationObserver::class)] // Depends on audit
#[ObservedBy(OrderAuditObserver::class)]        // Should run first
```
---
## Good Example
```php
#[ObservedBy(OrderAuditObserver::class)]        // Runs first
#[ObservedBy(OrderNotificationObserver::class)] // Depends on audit data
```
---
## Exceptions
Observers have no interdependencies and execution order is irrelevant.
---
## Consequences Of Violation
Observers fire in wrong order; dependent observers see incomplete state; intermittent bugs that only appear under specific conditions.

---

## Rule 6: Keep Observer Filenames Consistent With the Registered Class Name
---
## Category
Maintainability
---
## Rule
Name observer files after their class name and place them in the `App\Observers` directory.
---
## Reason
Consistent naming and placement enables IDE navigation (Go to Class), simplifies imports, and makes the project structure predictable. An observer called `OrderCacheObserver` should be in `app/Observers/OrderCacheObserver.php`.
---
## Bad Example
```php
// app/Observers/OrderCacheObserver.php — correct file
// But another observer in app/Helpers/OrderAuditObserver.php — wrong location
```
---
## Good Example
```php
// app/Observers/OrderCacheObserver.php
// app/Observers/OrderAuditObserver.php
```
---
## Exceptions
Observers registered from third-party packages that live in their own namespace.
---
## Consequences Of Violation
Difficulty locating observer files; inconsistent project structure; confusion during code review.

---

## Rule 7: Do Not Register the Same Observer Multiple Times on the Same Model
---
## Category
Reliability
---
## Rule
Ensure each observer is registered exactly once per model. Avoid duplicate registration through both `#[ObservedBy]` and `Model::observe()` for the same observer.
---
## Reason
Duplicate registration causes the observer's methods to execute twice for every event. This doubles side effects: cache cleared twice, duplicate log entries, double email dispatch. The bug is silent — no error is thrown.
---
## Bad Example
```php
#[ObservedBy(OrderCacheObserver::class)] // Registered via attribute
class Order extends Model {}

// Also registered via service provider — DUPLICATE
public function boot(): void
{
    Order::observe(OrderCacheObserver::class);
}
```
---
## Good Example
```php
#[ObservedBy(OrderCacheObserver::class)] // Single registration on model
class Order extends Model {}

// Service provider only registers conditional observers
public function boot(): void
{
    if (config('app.debug')) {
        Order::observe(DebugOrderObserver::class); // Different observer
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Duplicate cache operations; double audit log entries; duplicate emails or notifications; difficult to debug because all side effects appear to work correctly.
