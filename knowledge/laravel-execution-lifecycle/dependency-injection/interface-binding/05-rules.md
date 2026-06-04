# Bind Interfaces in the Correct Service Provider
---
## Category
Code Organization
---
## Rule
Register each interface binding in the service provider that corresponds to the feature or domain it belongs to.
---
## Reason
Binding all interfaces in `AppServiceProvider` creates a God provider that mixes unrelated concerns. Grouping bindings by domain makes them discoverable and maintainable — payment bindings in `PaymentServiceProvider`, cache bindings in `CacheServiceProvider`.
---
## Bad Example
```php
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
        $this->app->bind(CacheInterface::class, RedisCache::class);
        $this->app->bind(LoggerInterface::class, CloudLogger::class);
        // 20 more unrelated bindings
    }
}
```
---
## Good Example
```php
class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
    }
}
```
---
## Exceptions
Simple applications with few bindings may use `AppServiceProvider` for brevity.
---
## Consequences Of Violation
Hard-to-navigate providers; organization drift; accidental duplicate bindings.

---

# Use Singleton for Stateless Interface Implementations
---
## Category
Performance
---
## Rule
Prefer `singleton()` when binding interfaces to stateless concrete implementations.
---
## Reason
Stateless services (loggers, HTTP clients, cache managers) can be shared across the application without risk of state leakage. Singleton binding caches the instance, avoiding repeated construction.
---
## Bad Example
```php
$this->app->bind(LoggerInterface::class, MonologLogger::class);
// New instance every resolution — wasteful
```
---
## Good Example
```php
$this->app->singleton(LoggerInterface::class, MonologLogger::class);
// Same instance shared across the application
```
---
## Exceptions
Services that hold per-request mutable state must use `bind()` to create fresh instances.
---
## Consequences Of Violation
Unnecessary memory allocation; repeated resolution overhead.

---

# Validate That the Concrete Implements the Interface
---
## Category
Reliability
---
## Rule
Ensure every concrete class bound to an interface actually implements that interface.
---
## Reason
A binding that maps to a non-implementing concrete fails at method-call time, not at registration. This creates a delayed failure that is harder to diagnose and trace.
---
## Bad Example
```php
$this->app->bind(NotifierInterface::class, Logger::class);
// Logger does not implement NotifierInterface — call-site failure
```
---
## Good Example
```php
$this->app->bind(NotifierInterface::class, SlackNotifier::class);
// SlackNotifier implements NotifierInterface
```
---
## Exceptions
Closure bindings that dynamically construct valid implementations — verify in the Closure logic.
---
## Consequences Of Violation
Runtime type errors at method call time; delayed failure discovery.

---

# Do Not Bind Concrete to Concrete
---
## Category
Code Organization
---
## Rule
Never register `bind(Concrete::class, Concrete::class)` — auto-resolution handles concrete classes without explicit binding.
---
## Reason
Concrete-to-concrete bindings add no value. They create clutter in service providers and make it harder to identify which bindings are truly architectural (interface-to-concrete mappings).
---
## Bad Example
```php
$this->app->bind(OrderService::class, OrderService::class); // Noise
$this->app->bind(Cache::class, Cache::class);               // Noise
```
---
## Good Example
```php
// These are unnecessary — remove them
// Auto-resolution handles concrete classes
```
---
## Exceptions
When lifecycle control is needed — use `singleton()` for a concrete class that should be shared.
---
## Consequences Of Violation
Provider clutter; harder to see real architectural bindings; misleading code.

---

# Avoid Interface Explosion
---
## Category
Maintainability
---
## Rule
Only create interfaces for abstractions that genuinely need polymorphic implementations. Do not create interfaces for every class "just in case."
---
## Reason
Each interface adds maintenance overhead: the interface file, the binding registration, and the mapping. If a class has only one implementation and no realistic alternative, the interface adds indirection without value.
---
## Bad Example
```php
// Single implementation, no planned alternative
interface UserHelperInterface {}
class UserHelper implements UserHelperInterface {}
```
---
## Good Example
```php
// Concrete class — interface only when polymorphism is needed
class UserHelper {}
```
---
## Exceptions
Package development where consumers must be able to swap implementations. Testing requirements where mocking via interface is significantly easier.
---
## Consequences Of Violation
Unnecessary files; binding registration overhead; indirection without benefit.

---

# Keep Closure Bindings Simple
---
## Category
Maintainability
---
## Rule
Limit Closure-based bindings to simple construction logic. Extract complex resolution logic into a dedicated factory class.
---
## Reason
Closures in service providers cannot be tested in isolation and are not reusable. A named factory class provides testability, reusability, and a clear contract.
---
## Bad Example
```php
$this->app->bind(PaymentGateway::class, function ($app) {
    $config = $app['config']->get('payment');
    $gateway = $config['provider'] === 'stripe'
        ? new StripePayment($config['stripe'])
        : new PayPalPayment($config['paypal']);
    // 20 lines of additional setup
    return $gateway;
});
```
---
## Good Example
```php
$this->app->bind(PaymentGateway::class, function ($app) {
    return $app->make(PaymentGatewayFactory::class)->create();
});
```
---
## Exceptions
Simple closures with a single `new` statement and no branching logic.
---
## Consequences Of Violation
Untestable binding logic; service provider bloat; duplicated factory logic.
