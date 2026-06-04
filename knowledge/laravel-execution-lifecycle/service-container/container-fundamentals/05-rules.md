# Container Fundamentals — Rules

## Register All Bindings in Service Providers
---
## Category
Code Organization
---
## Rule
Always register container bindings within service provider `register()` methods — never in application code, controllers, or middleware.
---
## Reason
Centralizing binding registration in service providers makes the dependency configuration discoverable and auditable. Bindings registered in application code are hidden, non-deterministic, and cannot be reliably overridden or extended by other providers.
---
## Bad Example
```php
class OrderController {
    public function process(): Response {
        app()->bind(PaymentGateway::class, StripeGateway::class); // Hidden binding
        $gateway = app()->make(PaymentGateway::class);
    }
}
```
---
## Good Example
```php
class PaymentServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->bind(PaymentGateway::class, StripeGateway::class);
    }
}
```
---
## Exceptions
Test methods where bindings are overridden temporarily — restore original bindings in `tearDown()`.
---
## Consequences Of Violation
Maintainability: scattered binding registration impossible to audit. Reliability: bindings registered conditionally in controllers create non-deterministic resolution behavior.

---

## Use $app->bound() Before Resolving in Conditional Paths
---
## Category
Reliability
---
## Rule
Check `$app->bound('abstract')` before calling `$app->make('abstract')` when the binding may not exist.
---
## Reason
Resolving an unregistered abstract throws `BindingResolutionException`. In conditional code paths where a service may or may not be registered (package features, optional integrations), checking `bound()` first prevents exceptions and allows graceful degradation.
---
## Bad Example
```php
public function getReportGenerator(): ?ReportGenerator {
    return $this->app->make(ReportGenerator::class); // Throws if not registered
}
```
---
## Good Example
```php
public function getReportGenerator(): ?ReportGenerator {
    if (! $this->app->bound(ReportGenerator::class)) {
        return null;
    }
    return $this->app->make(ReportGenerator::class);
}
```
---
## Exceptions
Code paths where the binding is guaranteed to exist (core framework bindings, boot-time resolved services).
---
## Consequences Of Violation
Reliability: unhandled `BindingResolutionException` in production when optional services are not installed.

---

## Avoid Array Push Syntax for Registering Services
---
## Category
Framework Usage
---
## Rule
Do not use `$app['services'][] = new Service()` to register service collections — use `tag()` or explicit binding instead.
---
## Reason
Array push syntax `$app['key'][] = value` bypasses the binding system. It mutates the resolved instance after resolution rather than registering a binding, which means rebound callbacks do not fire and the modification is invisible to the container lifecycle.
---
## Bad Example
```php
public function register(): void {
    $this->app['report.handlers'][] = new PdfHandler(); // Array push — not a binding
    $this->app['report.handlers'][] = new CsvHandler();
}
```
---
## Good Example
```php
public function register(): void {
    $this->app->tag([PdfHandler::class, CsvHandler::class], 'report.handlers');
}

// Resolution:
$handlers = $this->app->tagged('report.handlers');
```
---
## Exceptions
Temporary data storage in test setup that is explicitly cleared in `tearDown()`.
---
## Consequences Of Violation
Reliability: modifications invisible to container lifecycle, rebound callbacks not triggered, inconsistent with binding system expectations.

---

## Do Not Inject app() or resolve() in Business Logic
---
## Category
Architecture
---
## Rule
Avoid calling `app()`, `resolve()`, or `$this->app->make()` inside business logic — inject all dependencies through constructors.
---
## Reason
Using `resolve()` inside business logic creates a Service Locator anti-pattern: the class's dependencies are hidden from its signature, making the class untestable without bootstrapping the full container and impossible to statically analyze. Constructor injection makes every dependency explicit.
---
## Bad Example
```php
class OrderProcessor {
    public function process(array $order): void {
        $logger = resolve(Logger::class); // Hidden dependency
        $payments = resolve(PaymentGateway::class); // Hidden dependency
        $logger->log('Processing order');
        $payments->charge($order);
    }
}
```
---
## Good Example
```php
class OrderProcessor {
    public function __construct(
        protected Logger $logger,
        protected PaymentGateway $payments
    ) {}

    public function process(array $order): void {
        $this->logger->log('Processing order');
        $this->payments->charge($order);
    }
}
```
---
## Exceptions
Factory classes whose purpose is service resolution based on runtime conditions.
---
## Consequences Of Violation
Testing: requires container bootstrapping for unit tests. Maintainability: hidden dependencies not visible in constructor. Static analysis: dependency graph invisible to tools.

---

## Understand Container vs. Application Inheritance
---
## Category
Architecture
---
## Rule
Use `Container` for packages that must work without Laravel's full framework; use `Application` for full Laravel context.
---
## Reason
`Application` extends `Container` with framework-specific features (environment detection, base paths, configuration loading). Type-hinting `Application` when `Container` suffices creates an unnecessary coupling to the full framework, making packages harder to extract or test in isolation.
---
## Bad Example
```php
// Package API — unnecessarily coupled to full Application
class ServiceRegistry {
    public function __construct(protected \Illuminate\Foundation\Application $app) {}
    public function register(): void {
        $this->app->bind(Service::class, ConcreteService::class);
    }
}
```
---
## Good Example
```php
// Package API — depends only on Container
class ServiceRegistry {
    public function __construct(protected \Illuminate\Contracts\Container\Container $app) {}
    public function register(): void {
        $this->app->bind(Service::class, ConcreteService::class);
    }
}
```
---
## Exceptions
Code that explicitly needs `Application` methods (`environment()`, `basePath()`, `configPath()`).
---
## Consequences Of Violation
Maintainability: tighter coupling to Laravel framework. Testing: requires full Application bootstrap for container features.

---

## Prefer Explicit Bindings Over Auto-Resolution for Production Hot Paths
---
## Category
Performance
---
## Rule
Register explicit bindings (closure or class name) for services resolved on every request rather than relying on auto-resolution via reflection.
---
## Reason
Auto-resolution uses `ReflectionClass::getConstructor()` and parameter inspection at every resolution. For hot-path services resolved on every request, this adds ~50-200μs overhead. Explicit bindings replace reflection with direct construction, improving throughput under load.
---
## Bad Example
```php
// Auto-resolution on every request — unnecessary reflection
class ReportController {
    public function __construct(protected AnalyticsService $analytics) {}
}
```
---
## Good Example
```php
// Explicit binding — zero reflection overhead
$this->app->bind(AnalyticsService::class, function ($app) {
    return new AnalyticsService(
        $app->make(DatabaseConnection::class)
    );
});
```
---
## Exceptions
Classes with zero constructor dependencies where reflection overhead is negligible (<2μs).
---
## Consequences Of Violation
Performance: cumulative reflection overhead under high concurrency, especially for deeply nested dependency chains.

---

## Audit Container Instance Growth in Octane Deployments
---
## Category
Performance
---
## Rule
Monitor `count($container->getInstances())` in Octane deployments to detect unexpected singleton accumulation.
---
## Reason
Under Octane, the `$instances` array persists for the worker lifetime. Services that should be transient but are implicitly cached (e.g., accidentally calling `make()` inside a singleton factory) accumulate memory. A growing instance count signals a lifecycle bug.
---
## Bad Example
```php
// No monitoring — instance growth goes undetected until OOM
```
---
## Good Example
```php
// Octane middleware or monitoring hook:
$container = app();
$instanceCount = count($container->getInstances());

if ($instanceCount > 500) { // Threshold varies by application
    Log::warning('Container instance count growing', [
        'count' => $instanceCount,
        'abstracts' => array_keys($container->getInstances()),
    ]);
}
```
---
## Exceptions
Applications with legitimately high numbers of singleton services (e.g., 300+ registered provider bindings).
---
## Consequences Of Violation
Performance: unbounded memory growth in Octane workers leading to out-of-memory errors and worker restarts.
