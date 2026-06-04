# Binding Resolution — Rules

## Use make() for All Application-Level Resolution
---
## Category
Framework Usage
---
## Rule
Always use `$app->make()` for resolving services in application code — never `$app->build()`.
---
## Reason
`make()` runs the full resolution chain: alias normalization, contextual bindings, instances cache, bindings, auto-resolution, extenders, and resolution callbacks. `build()` bypasses extenders, resolution callbacks, and caching — producing raw, unconfigured instances that lack cross-cutting behavior.
---
## Bad Example
```php
class ReportService {
    public function generate(): Report {
        $builder = $this->app->build(ReportBuilder::class); // Bypasses extenders
        return $builder->build();
    }
}
```
---
## Good Example
```php
class ReportService {
    public function __construct(protected ReportBuilder $builder) {}

    public function generate(): Report {
        return $this->builder->build();
    }
}
```
---
## Exceptions
Container internals — `build()` is designed for use within `Container::resolve()`.
---
## Consequences Of Violation
Reliability: services lack decoration, configuration, and caching. Extenders and resolution callbacks silently skipped.

---

## Inject Dependencies via Constructor, Never Resolve Inside Methods
---
## Category
Code Organization
---
## Rule
Always declare dependencies in the constructor — never call `make()`, `app()`, or `resolve()` inside business logic.
---
## Reason
Calling `resolve()` inside methods creates a service locator pattern: dependencies become implicit, untestable without container bootstrapping, and hidden from static analysis. Constructor injection makes all dependencies explicit, testable via mock injection, and visible at a glance.
---
## Bad Example
```php
class OrderController {
    public function process(Request $request): Response {
        $processor = resolve(OrderProcessor::class); // Service locator
        return $processor->process($request);
    }
}
```
---
## Good Example
```php
class OrderController {
    public function __construct(protected OrderProcessor $processor) {}

    public function process(Request $request): Response {
        return $this->processor->process($request);
    }
}
```
---
## Exceptions
Factory classes whose purpose is resolving services dynamically (e.g., `ReportFactory` that resolves based on runtime type).
---
## Consequences Of Violation
Testing: requires container bootstrapping for unit tests. Maintainability: hidden dependencies not visible in constructor signature.

---

## Use makeWith() with Named Arrays, Not Positional Parameters
---
## Category
Reliability
---
## Rule
Always pass named associative arrays to `makeWith()`, never positional or indexed arrays.
---
## Reason
The container matches parameters by name (via `ReflectionParameter::getName()`), not by position. Positional arrays with matching positions but wrong names are silently ignored — the parameter receives its default value instead of the intended value.
---
## Bad Example
```php
// Positional array — silently wrong
$this->app->makeWith(ReportGenerator::class, ['csv', 100]);
// If the constructor has `$format` then `$limit`, this works by coincidence.
// If parameters are reordered, values map incorrectly with no error.
```
---
## Good Example
```php
$this->app->makeWith(ReportGenerator::class, [
    'format' => 'csv',
    'limit' => 100,
]);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: silent failure where constructor parameters receive default values instead of intended overrides.

---

## Pre-Resolve Hot Services During Boot to Front-Load Cost
---
## Category
Performance
---
## Rule
Call `$app->make(HotService::class)` in the `boot()` method of a service provider for services resolved on every request.
---
## Reason
Reflection-based resolution costs are paid at first resolution. Pre-resolving during boot moves this cost to application initialization, ensuring consistent response times. In Octane, this cost is paid once per worker start rather than on the first request hitting each worker.
---
## Bad Example
```php
// Hot service resolved lazily on first request — adds latency
class AnalyticsController {
    public function __construct(protected ExpensiveService $service) {}
}
// First request: ~200μs reflection overhead + service resolution time
```
---
## Good Example
```php
class AppServiceProvider extends ServiceProvider {
    public function boot(): void {
        $this->app->make(ExpensiveService::class); // Pre-resolve during boot
    }
}
// First request: zero additional overhead — already resolved and cached
```
---
## Exceptions
Services with request-time dependencies that cannot be resolved during boot.
---
## Consequences Of Violation
Performance: variable response times where the first request after deployment or worker start is significantly slower.

---

## Catch BindingResolutionException at the Kernel Level
---
## Category
Reliability
---
## Rule
Handle `BindingResolutionException` with a centralized exception handler that logs the abstract name and resolution context.
---
## Reason
Resolution failures propagate as unhandled exceptions that expose container internals in error messages. A centralized handler logs the full abstract name and build stack for debugging while returning a safe error response to the client.
---
## Bad Example
```php
// Unhandled — propagates to user as 500 with internal details
try {
    $service = $this->app->make(ReportService::class);
} catch (BindingResolutionException $e) {
    throw $e; // Exposes: "Target [PaymentGateway] is not instantiable"
}
```
---
## Good Example
```php
// In App\Exceptions\Handler
public function register(): void {
    $this->reportable(function (BindingResolutionException $e) {
        Log::error('Container resolution failed', [
            'abstract' => $e->getMessage(),
            'build_stack' => $e->getPrevious()?->getTraceAsString(),
        ]);
    });
}
// Returns generic 500 response to client
```
---
## Exceptions
Development environments where full exception details aid debugging.
---
## Consequences Of Violation
Security: internal service names and resolution paths exposed in production error responses. Debugging: insufficient context to diagnose resolution failures in production.

---

## Understand Resolution Chain Order for Debugging
---
## Category
Reliability
---
## Rule
Trace resolution failures through the canonical chain order: alias normalization → contextual bindings → instances cache → bindings → auto-resolution → exception.
---
## Reason
The resolution chain is deterministic. When a service resolves to an unexpected implementation, the root cause is always in one of these steps: an alias redirects to a different abstract, a cached instance returns an old object, a contextual binding overrides the default, or auto-resolution resolves a wrong concrete class.
---
## Bad Example
```php
// Debugging "why is this returning the old implementation?"
$service = $this->app->make(PaymentGateway::class);
// Assumption: must be the binding definition
// Reality: instances cache still holds the old instance from a previous test
```
---
## Good Example
```php
// Trace the chain:
// 1. Is 'PaymentGateway' an alias? -> check $app->getAlias()
// 2. Is there a cached instance? -> check $app->isShared()
// 3. Is there a contextual binding? -> check $app->getContextual()
// 4. What does the binding say? -> check the registered concrete
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: time wasted debugging the wrong layer of the resolution chain. Maintainability: incorrect fixes that mask the real issue (e.g., re-registering a binding when the fix is to forget a cached instance).
