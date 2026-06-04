# Auto-Resolution via Reflection — Rules

## Register Bindings for Every Interface Type-Hint
---
## Category
Framework Usage
---
## Rule
Always register a binding for every interface or abstract class used as a constructor type-hint.
---
## Reason
Auto-resolution via `ReflectionClass::getConstructor()` can only instantiate concrete, instantiable classes. Interfaces and abstract classes without a registered binding throw `BindingResolutionException: "Target [Interface] is not instantiable"` at resolution time.
---
## Bad Example
```php
class ReportService {
    public function __construct(
        protected PaymentGateway $gateway // Interface — no binding registered
    ) {}
}
// $app->make(ReportService::class); // throws BindingResolutionException
```
---
## Good Example
```php
$this->app->bind(PaymentGateway::class, StripeGateway::class);

class ReportService {
    public function __construct(
        protected PaymentGateway $gateway // Resolves to StripeGateway
    ) {}
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Reliability: resolution failure at runtime. Maintenability: non-obvious breakage when an interface is added as a dependency.

---

## Provide Default Values for Primitive Constructor Parameters
---
## Category
Reliability
---
## Rule
Always provide default values for primitive constructor parameters (string, int, array, bool) in auto-resolved classes.
---
## Reason
Auto-resolution cannot synthesize primitive values. A required primitive parameter without a default value causes `Unresolvable dependency resolving` exception unless `makeWith()` is used explicitly by every caller.
---
## Bad Example
```php
class ReportGenerator {
    public function __construct(
        protected string $format, // No default — breaks all make() callers
        protected int $limit
    ) {}
}
```
---
## Good Example
```php
class ReportGenerator {
    public function __construct(
        protected string $format = 'pdf',
        protected int $limit = 100
    ) {}
}

// make() works without parameters
// makeWith() still allows overrides:
$this->app->makeWith(ReportGenerator::class, ['format' => 'csv']);
```
---
## Exceptions
Classes designed exclusively for `makeWith()` usage, documented as requiring explicit parameter passing.
---
## Consequences Of Violation
Reliability: existing `make()` callers break silently when a primitive is added without a default.

---

## Pre-register Hot-Path Bindings to Bypass Reflection
---
## Category
Performance
---
## Rule
Pre-register explicit bindings for services resolved on hot code paths (every request, every job) rather than relying on auto-resolution.
---
## Reason
Auto-resolution via reflection costs ~50-200μs per resolution chain due to `ReflectionClass::getConstructor()`, parameter iteration, and type inspection. Explicit closures resolve ~10x faster (5μs vs 50μs) by replacing reflection with direct construction.
---
## Bad Example
```php
// Relying on auto-resolution for a controller resolved on every request
class DashboardController {
    public function __construct(
        protected AnalyticsService $analytics,
        protected CacheManager $cache,
        protected ReportBuilder $builder
    ) {}
}
// Each request: 3x reflection operations, ~50μs overhead
```
---
## Good Example
```php
$this->app->bind(DashboardController::class); // Self-binding caches resolution strategy
// Or use a closure for full control:
$this->app->bind(DashboardController::class, function ($app) {
    return new DashboardController(
        $app->make(AnalyticsService::class),
        $app->make(CacheManager::class),
        $app->make(ReportBuilder::class)
    );
});
```
---
## Exceptions
Prototyping, low-traffic applications, or classes with zero constructor dependencies where reflection overhead is negligible (<2μs).
---
## Consequences Of Violation
Performance: cumulative reflection overhead under high concurrency. In Octane, cost is paid once per worker per class, but still measurable on worker start.

---

## Avoid Deep Constructor Dependency Chains
---
## Category
Maintainability
---
## Rule
Limit auto-resolved constructor dependency chains to a maximum of 3 levels of indirection.
---
## Reason
Each level of nesting adds recursive reflection overhead (~50μs per level) and obscures the dependency graph from static analysis. A 5-level chain costs ~250μs of reflection per resolution and makes the service graph difficult to reason about.
---
## Bad Example
```php
// A → B → C → D → E (5 levels)
class A { public function __construct(protected B $b) {} }
class B { public function __construct(protected C $c) {} }
class C { public function __construct(protected D $d) {} }
class D { public function __construct(protected E $e) {} }
class E { public function __construct(protected Logger $logger) {} }
// 5 reflection operations per make(A::class)
```
---
## Good Example
```php
// Flatten: inject shared dependencies directly or use factory
class A {
    public function __construct(
        protected B $b,
        protected Logger $logger // Injected directly, not via E
    ) {}
}
class B { public function __construct(protected C $c) {} }
class C { public function __construct(protected Logger $logger) {} }
```
---
## Exceptions
Framework internals or deeply layered infrastructure where intermediate abstractions are necessary.
---
## Consequences Of Violation
Performance: increased resolution latency. Maintainability: hidden dependency graph, difficult debugging when resolution fails mid-chain.

---

## Enable ReflectionCache in Laravel 12+ for Octane Deployments
---
## Category
Performance
---
## Rule
Enable `$app->enableReflectionCache()` in `bootstrap/app.php` for Laravel 12+ applications running under Octane.
---
## Reason
Without the cache, reflection metadata is recomputed on every worker start for each auto-resolved class. The ReflectionCache persists `ReflectionClass` instances per worker lifetime, reducing cold-start overhead from ~100μs per class to near-zero after first resolution.
---
## Bad Example
```php
// bootstrap/app.php — no reflection cache
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(...)
    ->create();
```
---
## Good Example
```php
// bootstrap/app.php
$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(...)
    ->create();

$app->enableReflectionCache();
```
---
## Exceptions
Laravel 10-11 deployments where the API is unavailable.
---
## Consequences Of Violation
Performance: unnecessary reflection overhead on every Octane worker start, increasing time-to-first-response after deployment or worker restart.

---

## Use Nullable Type-Hints with Defaults for Optional Dependencies
---
## Category
Reliability
---
## Rule
Mark optional auto-resolved dependencies as nullable with a `null` default value.
---
## Reason
Auto-resolution resolves type-hinted parameters but provides no mechanism for "resolve or skip gracefully." A nullable parameter with `= null` default enables the container to resolve the dependency when a binding exists and leave it `null` when it does not, preventing resolution failures for optional services.
---
## Bad Example
```php
class Logger {
    public function __construct(
        protected AlertingService $alerts // Required — breaks if not bound
    ) {}
}
```
---
## Good Example
```php
class Logger {
    public function __construct(
        protected ?AlertingService $alerts = null // Graceful fallback
    ) {}
}
// $logger->alerts === null if AlertingService is not bound
```
---
## Exceptions
Services where the dependency is genuinely mandatory and the application should fail fast if missing.
---
## Consequences Of Violation
Reliability: avoidable runtime exceptions for genuinely optional dependencies.

---

## Do Not Rely on Auto-Resolution for Classes with Required Primitives
---
## Category
Framework Usage
---
## Rule
Avoid auto-resolving classes that have required primitive constructor parameters without defaults — register an explicit binding or factory instead.
---
## Reason
Auto-resolution cannot provide values for required primitives. Every caller must use `makeWith()` with matching parameter names, creating a fragile, distributed resolution contract. An explicit binding centralizes the primitive values in one place.
---
## Bad Example
```php
class ReportExporter {
    public function __construct(
        protected string $format, // Required primitive, no default
        protected string $destination
    ) {}
}
// Every caller must know parameter names:
$this->app->makeWith(ReportExporter::class, ['format' => 'pdf', 'destination' => 's3']);
```
---
## Good Example
```php
$this->app->bind(ReportExporter::class, function ($app) {
    return new ReportExporter(
        format: config('export.default_format'),
        destination: config('export.default_destination'),
    );
});
// Callers use simple make():
$this->app->make(ReportExporter::class);
```
---
## Exceptions
Classes designed as parameterized DTOs where `makeWith()` is the intended resolution pattern and documented as such.
---
## Consequences Of Violation
Reliability: scattered `makeWith()` calls that break when constructor parameter names change. Maintenance: fragile contracts between callers and constructor signatures.

---

## Keep Constructor Parameter Names Stable for Auto-Resolved Classes
---
## Category
Maintainability
---
## Rule
Do not rename constructor parameters of auto-resolved classes unless also updating all `makeWith()` callers.
---
## Reason
The container resolves primitives by parameter name, not position. Renaming a parameter silently breaks all `makeWith()` calls that used the old name, causing primitive values to be silently dropped or default values to be used instead.
---
## Bad Example
```php
// Before refactor:
class ExportService {
    public function __construct(protected string $outputPath = '/tmp') {}
}
$this->app->makeWith(ExportService::class, ['outputPath' => '/custom']);

// After renaming parameter:
class ExportService {
    public function __construct(protected string $path = '/tmp') {} // Renamed
}
// makeWith(['outputPath' => '/custom']) now ignores the value silently
```
---
## Good Example
```php
// Use a configuration object instead of primitive parameters
class ExportConfig {
    public function __construct(
        public string $path = '/tmp',
        public string $format = 'csv'
    ) {}
}

class ExportService {
    public function __construct(protected ExportConfig $config) {}
}
// Renaming path: update ExportConfig only, not makeWith() callers
```
---
## Exceptions
Internal or private classes with a single known caller that is updated in the same commit.
---
## Consequences Of Violation
Reliability: silent resolution failures where parameters are ignored. Maintenance: hidden coupling between `makeWith()` callers and constructor parameter names.
