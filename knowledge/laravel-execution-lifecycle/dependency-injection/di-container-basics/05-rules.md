# Register All Bindings in Service Providers
---
## Category
Code Organization
---
## Rule
Never call `$app->bind()`, `$app->singleton()`, or `$app->instance()` outside of a service provider's `register()` method.
---
## Reason
The service provider is the composition root — the single location where dependency wiring is configured. Scattering bindings across route files, middleware, or controller methods makes them impossible to audit and maintain.
---
## Bad Example
```php
// In routes/web.php
app()->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
```
---
## Good Example
```php
// In AppServiceProvider
public function register(): void
{
    $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
}
```
---
## Exceptions
Testing — test cases may override bindings via `instance()` in `setUp()`.
---
## Consequences Of Violation
Scattered binding configuration; difficult debugging; unpredictable resolution order.

---

# Prefer Singleton for Stateless Services
---
## Category
Performance
---
## Rule
Use `singleton()` for services that maintain no per-request mutable state.
---
## Reason
Singleton binding caches the resolved instance — subsequent resolutions return the same object. This avoids repeated construction and memory allocation. Stateless services like loggers, cache managers, and HTTP clients benefit directly.
---
## Bad Example
```php
$this->app->bind(HttpClient::class, GuzzleClient::class);
// New client created every resolution — wasteful
```
---
## Good Example
```php
$this->app->singleton(HttpClient::class, GuzzleClient::class);
// Same client reused across the application
```
---
## Exceptions
Services that hold per-request data (current user, request ID) must use `scoped()` or `bind()`.
---
## Consequences Of Violation
Unnecessary memory allocation; repeated resolution overhead; wasted CPU cycles.

---

# Bind Interfaces, Not Concretions
---
## Category
Architecture
---
## Rule
Type-hint interfaces in constructors and bind them to concretes in service providers. Do not type-hint concrete classes for services that should be swappable.
---
## Reason
Interface binding enables dependency inversion — high-level code depends on abstractions, not implementations. This allows swapping implementations for testing, different environments, or future changes without modifying consumers.
---
## Bad Example
```php
class OrderService
{
    public function __construct(
        private EloquentUserRepository $users, // Concrete — cannot swap
    ) {}
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private UserRepositoryInterface $users, // Interface — swappable
    ) {}
}

// In provider
$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
```
---
## Exceptions
Utility classes with no reasonable alternative implementation.
---
## Consequences Of Violation
Tight coupling; testing difficulty; inability to swap implementations.

---

# Never Use app() in Business Logic
---
## Category
Maintainability
---
## Rule
Never call `app()`, `resolve()`, or `App::make()` inside service, repository, or action classes.
---
## Reason
Calling `app()` creates hidden dependencies that are invisible in the class signature. This makes the class harder to test, refactor, and reason about. Constructor injection is the explicit alternative.
---
## Bad Example
```php
class OrderService
{
    public function process(Order $order): void
    {
        $payment = app(PaymentGateway::class); // Hidden dependency
        $payment->charge($order->total);
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private PaymentGateway $payment,
    ) {}

    public function process(Order $order): void
    {
        $this->payment->charge($order->total);
    }
}
```
---
## Exceptions
Service provider `register()` methods and testing utilities may use the container legitimately.
---
## Consequences Of Violation
Hidden dependencies; difficult testing; container coupling; broken static analysis.

---

# Never Inject Container as a Dependency
---
## Category
Architecture
---
## Rule
Never accept `Container $container` as a constructor parameter for pulling dependencies inside methods.
---
## Reason
Accepting the container is a disguised service locator. It hides all the class's true dependencies behind a single opaque parameter, making the class's contract invisible and untestable without container setup.
---
## Bad Example
```php
class OrderService
{
    public function __construct(private Container $container) {}

    public function process(Order $order): void
    {
        $payment = $this->container->make(PaymentGateway::class);
    }
}
```
---
## Good Example
```php
class OrderService
{
    public function __construct(
        private PaymentGateway $payment,
    ) {}

    public function process(Order $order): void
    {
        $this->payment->charge($order->total);
    }
}
```
---
## Exceptions
In service provider classes where container registration is the class's purpose.
---
## Consequences Of Violation
Hidden dependencies; impossible to unit test without container; violated explicit dependency principle.

---

# Avoid Over-Binding — Let Auto-Resolution Handle Concretes
---
## Category
Code Organization
---
## Rule
Do not register explicit bindings for concrete classes that auto-resolution can handle.
---
## Reason
Auto-resolution resolves concrete classes with resolvable constructors without any binding. Registering `bind(Service::class, Service::class)` adds noise to service providers with no behavioral benefit.
---
## Bad Example
```php
$this->app->bind(Logger::class, Logger::class);     // Unnecessary
$this->app->bind(Cache::class, Cache::class);       // Unnecessary
```
---
## Good Example
```php
// No binding needed — auto-resolution handles concrete classes
class ReportService
{
    public function __construct(
        private Logger $log,
        private Cache $cache,
    ) {}
}
```
---
## Exceptions
When lifecycle control is needed — use `singleton()` for a concrete class.
---
## Consequences Of Violation
Unnecessary service provider clutter; harder to identify intentional interfaces bindings.

---

# Do Not Modify Container Bindings at Runtime
---
## Category
Reliability
---
## Rule
Never replace bindings via `instance()` or `bind()` during a request after the application has booted.
---
## Reason
Runtime binding replacement creates unpredictable behavior — different parts of the same request may resolve different implementations of the same abstract. Service providers are the single correct place for binding configuration.
---
## Bad Example
```php
public function someMethod(): void
{
    app()->instance(PaymentGatewayInterface::class, new TestPaymentGateway());
    // Subsequent resolutions in this request get the test gateway
}
```
---
## Exceptions
In testing — `instance()` overrides are expected and properly scoped per test case.
---
## Consequences Of Violation
Unpredictable resolution; hard-to-debug state changes; inconsistent behavior within a request.
