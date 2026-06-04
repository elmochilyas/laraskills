# Bind All Interfaces in Service Providers
---
## Category
Architecture
---
## Rule
Register every interface-to-concrete binding in a service provider's `register()` method. Never bind interfaces in route files, middleware, or controllers.
---
## Reason
Centralizing bindings in service providers makes the dependency graph discoverable and maintainable. Scattered bindings are impossible to audit and create hidden configuration that varies by execution path.
---
## Bad Example
```php
// In routes/web.php
app()->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
```
---
## Good Example
```php
// In AppServiceProvider or a dedicated provider
public function register(): void
{
    $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
}
```
---
## Exceptions
Testing — tests may override bindings via `instance()` for mock injection.
---
## Consequences Of Violation
Scattered binding configuration; hard to maintain; unpredictable resolution for different consumers.

---

# Use Singleton Binding for Stateless Services
---
## Category
Performance
---
## Rule
Prefer `singleton()` over `bind()` for stateless services that have no per-request mutable state.
---
## Reason
Singleton binding caches the resolved instance — subsequent `make()` calls return the same object. This saves memory, avoids repeated resolution, and improves performance for stateless services.
---
## Bad Example
```php
$this->app->bind(LoggerInterface::class, MonologLogger::class);
// New instance resolved every time — wasteful for stateless service
```
---
## Good Example
```php
$this->app->singleton(LoggerInterface::class, MonologLogger::class);
// Same instance shared across the application
```
---
## Exceptions
Services that hold per-request state (e.g., current user context) should use `scoped()` or `bind()`.
---
## Consequences Of Violation
Unnecessary memory allocation; repeated resolution overhead; slightly degraded performance.

---

# Use Contextual Binding for Consumer-Specific Implementations
---
## Category
Architecture
---
## Rule
Use `when()->needs()->give()` when different consumers need different concrete implementations of the same interface.
---
## Reason
Contextual binding eliminates the need for factory classes and conditional logic inside consumers. It keeps the resolution rule declarative and centralized.
---
## Bad Example
```php
class ReportController
{
    public function __construct(ReportGenerator $generator)
    {
        $this->generator = $generator instanceof AdminController
            ? new DetailedReportGenerator()
            : new SummaryReportGenerator();
    }
}
```
---
## Good Example
```php
// In service provider
$this->app->when(ReportController::class)
    ->needs(ReportGenerator::class)
    ->give(DetailedReportGenerator::class);

$this->app->when(DashboardController::class)
    ->needs(ReportGenerator::class)
    ->give(SummaryReportGenerator::class);
```
---
## Exceptions
When the consumer-specific behavior depends on runtime request data — use middleware or factory pattern instead.
---
## Consequences Of Violation
Conditional logic in consumers; duplicated resolution rules; harder to test different consumer behaviors.

---

# Do Not Create Concrete-to-Concrete Bindings
---
## Category
Code Organization
---
## Rule
Never register `bind(ConcreteClass::class, ConcreteClass::class)` or similar no-op bindings.
---
## Reason
Auto-resolution handles concrete classes automatically. A concrete-to-concrete binding adds no value — it creates clutter in service providers without changing resolution behavior.
---
## Bad Example
```php
$this->app->bind(OrderService::class, OrderService::class); // Redundant
$this->app->bind(Logger::class, Logger::class);             // No benefit
```
---
## Good Example
```php
// No binding needed — auto-resolution handles it
class OrderService
{
    public function __construct(
        private Logger $logger,
    ) {}
}
// app(OrderService::class) works without any binding
```
---
## Exceptions
When you need lifecycle control — use `singleton()` for a concrete class that should be shared.
---
## Consequences Of Violation
Unnecessary service provider clutter; harder to see intentional interface bindings.

---

# Do Not Self-Bind Interfaces
---
## Category
Reliability
---
## Rule
Never bind an interface to itself — e.g., `$app->bind(Interface::class, Interface::class)`.
---
## Reason
Self-binding creates an unresolvable target: the container tries to instantiate an interface, which always fails. This binding either causes an infinite loop or an exception, depending on resolution path.
---
## Bad Example
```php
$this->app->bind(PaymentGatewayInterface::class, PaymentGatewayInterface::class);
// Cannot instantiate interface — will throw or loop
```
---
## Good Example
```php
$this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
// Concrete implementation provided
```
---
## Exceptions
No common exceptions. Interface bindings must always reference a concrete class, Closure, or another resolvable abstract.
---
## Consequences Of Violation
Runtime `BindingResolutionException`; infinite recursion during resolution; application crash.

---

# Avoid Fat Closure Bindings
---
## Category
Maintainability
---
## Rule
Keep Closure-based bindings simple. Move complex factory logic to a dedicated factory class.
---
## Reason
Fat closures in service providers are untestable in isolation, cannot be reused, and obscure the binding logic. A named factory class is testable, reusable, and self-documenting.
---
## Bad Example
```php
$this->app->bind(PaymentGatewayInterface::class, function ($app) {
    $config = $app['config']->get('payment');
    $gateway = $config['provider'] === 'stripe' ? new StripePayment(...) : new PayPalPayment(...);
    // 15 more lines of setup logic
    return $gateway;
});
```
---
## Good Example
```php
$this->app->bind(PaymentGatewayInterface::class, function ($app) {
    return $app->make(PaymentGatewayFactory::class)->create();
});
```
---
## Exceptions
Simple Closures that resolve with a single `new` statement and no branching logic.
---
## Consequences Of Violation
Untestable binding logic; service provider bloat; duplicated factory logic across projects.

---

# Validate That Bound Concrete Implements the Interface
---
## Category
Reliability
---
## Rule
Ensure the concrete class registered for an interface binding actually implements that interface.
---
## Reason
A binding that maps an interface to a non-implementing concrete will only fail at runtime when the concrete is used. This creates a time bomb — the error surfaces at the point of use, not at registration.
---
## Bad Example
```php
$this->app->bind(NotifierInterface::class, Logger::class);
// Logger does not implement NotifierInterface — runtime error
```
---
## Good Example
```php
$this->app->bind(NotifierInterface::class, SlackNotifier::class);
// SlackNotifier implements NotifierInterface
```
---
## Exceptions
When the binding uses a Closure that dynamically returns a valid implementation — verify in the Closure.
---
## Consequences Of Violation
Runtime type errors; unexpected failures at service resolution or method call time.
