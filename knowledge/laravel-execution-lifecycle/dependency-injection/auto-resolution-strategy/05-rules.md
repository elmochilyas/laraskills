# Avoid Relying on Auto-Resolution for Interfaces
---
## Category
Framework Usage
---
## Rule
Never use auto-resolution for interfaces or abstract classes. Always register explicit bindings in a service provider.
---
## Reason
Auto-resolution throws `TargetInterfaceNotInstantiableException` when asked to resolve an interface — the container cannot guess which concrete implementation to use. Explicit bindings are the only supported resolution path for abstractions.
---
## Bad Example
```php
class PaymentService
{
    public function __construct(
        private PaymentGatewayInterface $gateway, // No binding registered — will throw
    ) {}
}
```
---
## Good Example
```php
// In service provider
$this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);

class PaymentService
{
    public function __construct(
        private PaymentGatewayInterface $gateway,
    ) {}
}
```
---
## Exceptions
No common exceptions. Every interface and abstract class must have an explicit binding.
---
## Consequences Of Violation
Runtime `BindingResolutionException` or `TargetInterfaceNotInstantiableException` when the class is resolved.

---

# Use Singleton Bindings for Hot-Path Classes
---
## Category
Performance
---
## Rule
Prefer explicit singleton bindings for frequently-resolved classes to avoid Reflection overhead on every `make()` call.
---
## Reason
Auto-resolution re-inspects the constructor via PHP Reflection on every `make()` call. Each inspection costs ~0.01-0.05ms and is multiplied by each level in the dependency chain. A singleton binding pays this cost once.
---
## Bad Example
```php
for ($i = 0; $i < 1000; $i++) {
    $service = app(ReportService::class); // Reflection cost paid 1000 times
}
```
---
## Good Example
```php
// In service provider
$this->app->singleton(ReportService::class);

// Resolution
$service = app(ReportService::class); // Reflection cost paid once
```
---
## Exceptions
Classes with per-request mutable state should not be singletons — use `scoped()` instead.
---
## Consequences Of Violation
Unnecessary per-request Reflection overhead in hot paths; measurable latency in high-throughput applications.

---

# Provide Defaults for Optional Primitive Parameters
---
## Category
Reliability
---
## Rule
Always provide default values for optional primitive constructor parameters that may lack explicit bindings.
---
## Reason
Auto-resolution cannot resolve scalar types (string, int, array). If a primitive parameter has no type-hint, no binding, and no default value, the container throws `BindingResolutionException`.
---
## Bad Example
```php
class ReportService
{
    public function __construct(
        private int $pageSize, // No default, no binding — will throw
    ) {}
}
```
---
## Good Example
```php
class ReportService
{
    public function __construct(
        private int $pageSize = 25, // Default fallback when no binding exists
    ) {}
}
```
---
## Exceptions
When an explicit primitive binding is always registered in a service provider.
---
## Consequences Of Violation
`BindingResolutionException` at runtime when the class is resolved without a matching binding.

---

# Avoid Constructor Side Effects in Auto-Resolved Classes
---
## Category
Reliability
---
## Rule
Never perform I/O, database queries, HTTP calls, or other side effects in constructors of classes resolved by the container.
---
## Reason
Auto-resolution triggers constructor execution on every `make()` call. Side effects in constructors cause unpredictable behavior — a simple cache lookup could trigger an API call, and a logging statement could initiate a database connection.
---
## Bad Example
```php
class MetricsService
{
    public function __construct()
    {
        $this->init = file_get_contents('https://api.example.com/init'); // Side effect in constructor
    }
}
```
---
## Good Example
```php
class MetricsService
{
    public function __construct(
        private HttpClient $http,
    ) {}

    public function initialize(): void
    {
        $this->response = $this->http->get('https://api.example.com/init');
    }
}
```
---
## Exceptions
No common exceptions. Constructors should only accept and assign dependencies.
---
## Consequences Of Violation
Unexpected side effects during container resolution; difficult debugging; test instability; performance degradation from repeated I/O.

---

# Do Not Catch BindingResolutionException Silently
---
## Category
Maintainability
---
## Rule
Never wrap `app()->make()` in an empty try/catch block to silently handle resolution failures.
---
## Reason
A silent catch hides real binding configuration errors, making debugging extremely difficult. Resolution failures indicate missing bindings, circular dependencies, or misconfigured parameters — all of which should fail loudly during development.
---
## Bad Example
```php
try {
    $service = app(ReportGenerator::class);
} catch (BindingResolutionException $e) {
    // Silently ignored — hides configuration errors
}
```
---
## Good Example
```php
if ($this->app->bound(ReportGenerator::class)) {
    $service = app(ReportGenerator::class);
} else {
    $service = new DefaultReportGenerator();
}
```
---
## Exceptions
When implementing a fallback chain where multiple resolution strategies are explicitly intended.
---
## Consequences Of Violation
Debugging difficulty; silent production failures; misconfigured services discovered too late.

---

# Bind Frequently-Resolved Concrete Classes Explicitly
---
## Category
Performance
---
## Rule
Pre-register concrete classes that are resolved frequently with explicit bindings to bypass the auto-resolution Reflection path.
---
## Reason
Auto-resolution uses `ReflectionClass` on every `make()` call. For classes resolved per-request or in loops, this overhead accumulates. An explicit `bind()` or `singleton()` avoids Reflection entirely for the resolution.
---
## Bad Example
```php
// No explicit binding — auto-resolved on every request
$service = app(OrderProcessingService::class);
```
---
## Good Example
```php
// In service provider
$this->app->singleton(OrderProcessingService::class);

// Resolution
$service = app(OrderProcessingService::class); // No Reflection — cached instance
```
---
## Exceptions
Classes with simple constructors (no type-hinted dependencies) where the Reflection cost is negligible.
---
## Consequences Of Violation
Measurable per-request Reflection overhead; suboptimal performance under high load.

---

# Let Auto-Resolution Handle Concrete Classes
---
## Category
Code Organization
---
## Rule
Prefer auto-resolution for concrete classes with resolvable constructors rather than registering unnecessary `bind(Concrete::class, Concrete::class)` bindings.
---
## Reason
Auto-resolution handles concrete classes automatically. Registering a concrete-to-concrete binding adds no value — it introduces maintainability overhead without any behavioral benefit.
---
## Bad Example
```php
$this->app->bind(Logger::class, Logger::class); // Redundant — auto-resolution handles this
```
---
## Good Example
```php
// No binding needed
class ReportService
{
    public function __construct(
        private Logger $log,
        private Cache $cache,
    ) {}
}
// app(ReportService::class) works without any binding
```
---
## Exceptions
When you need lifecycle control — use `singleton()` for a concrete class that should be shared.
---
## Consequences Of Violation
Unnecessary boilerplate in service providers; harder to see which bindings are intentional (interface) vs accidental (concrete).
