# Facade System — Rules

## Use Facades for Framework Services, Injection for Application Services

Reserve facades for well-known framework services (`Cache`, `Log`, `Config`, `DB`). Use constructor injection for custom application services (`PaymentService`, `UserRepository`).

---

## Category

Design

---

## Rule

Use facades for framework infrastructure services that are stable, well-understood, and unlikely to be swapped. Use constructor injection for application services whose implementations change behavior and need explicit, testable dependencies.

---

## Reason

Framework services are stable across versions and tests. Application services need visible dependency signatures for test mocking, refactoring, and team understanding. Mixing the two patterns by role keeps convenience where it's safe and explicitness where it's needed.

---

## Bad Example

```php
class PaymentService
{
    public function process(int $orderId): void
    {
        // Business logic class using facade — hidden dependency
        $receipt = Pdf::generate($orderId);
        Mail::send($receipt);
    }
}
```

---

## Good Example

```php
class PaymentService
{
    public function __construct(
        private PdfGenerator $pdf,
        private Mailer $mailer,
    ) {}

    public function process(int $orderId): void
    {
        $receipt = $this->pdf->generate($orderId);
        $this->mailer->send($receipt);
    }
}
```

---

## Exceptions

Controllers and views may use facades for both framework and application services, as they are HTTP entry points where ergonomic convenience is prioritized.

---

## Consequences Of Violation

Hidden dependencies in business logic classes, difficult test mocking, implicit coupling to facade implementation, refactoring resistance.

---

## Never Use Facades in Service Provider register() Methods

Do not call facades during the `register()` phase of any service provider.

---

## Category

Architecture

---

## Rule

Facade calls must not appear inside `register()` methods of service providers. Facades resolve services from the container, which violates the register-phase rule of only binding, not resolving.

---

## Reason

Facades rely on `Facade::getFacadeApplication()` which is set during the `RegisterFacades` bootstrap step. During `register()`, the facade application may not be set, or the underlying service may not be bound yet, causing resolution failures.

---

## Bad Example

```php
public function register(): void
{
    $this->app->singleton(Logger::class);
    Log::info('Logger registered'); // facade in register()
}
```

---

## Good Example

```php
public function register(): void
{
    $this->app->singleton(Logger::class);
}

public function boot(Logger $logger): void
{
    $logger->info('Logger booted');
}
```

---

## Exceptions

No common exceptions. Facade calls belong in `boot()` or later lifecycle phases.

---

## Consequences Of Violation

Runtime exceptions during provider registration, unresolved facade application, unpredictable bootstrap failures.

---

## Avoid Facade Calls in Class Constructors

Never call facades inside constructor methods. Resolve values at construction via injection, not via static facade proxy.

---

## Category

Design

---

## Rule

Constructors must not contain facade calls. Dependencies needed at construction time must be injected through the constructor signature.

---

## Reason

Facade calls in constructors create tight coupling at instantiation time. The resolved value is frozen at construction, cannot be replaced without reconstructing the object, and makes unit testing require facade mocking for simple construction.

---

## Bad Example

```php
class ReportGenerator
{
    private string $prefix;

    public function __construct()
    {
        $this->prefix = Config::get('report.prefix'); // facade in constructor
    }
}
```

---

## Good Example

```php
class ReportGenerator
{
    public function __construct(
        private string $prefix,
    ) {}
}

// Resolved from container with Config binding
```

---

## Exceptions

No common exceptions. Constructor injection is the required pattern for construction-time dependencies.

---

## Consequences Of Violation

Tight coupling to facade at instantiation, impossible to construct without facade mocking, hidden construction dependencies.

---

## Reset Facade State Between Tests

Ensure facade mock state is cleaned up after each test to prevent mock leakage across tests.

---

## Category

Testing

---

## Rule

Use `parent::tearDown()` in PHPUnit tests (which calls `Mockery::close()`) to reset facade resolved instances between tests. Never rely on implicit cleanup.

---

## Reason

Facade mocks are stored in `Facade::$resolvedInstance`. Without cleanup, mock expectations from one test leak to the next, causing unexpected failures or false passes in subsequent tests.

---

## Bad Example

```php
public function test_something(): void
{
    Cache::shouldReceive('get')->once()->andReturn('value');
    // No teardown — mock state leaks to next test
}

public function test_another(): void
{
    // Receives stale mock from previous test
    $result = Cache::get('key');
}
```

---

## Good Example

```php
use Tests\TestCase;

class MyTest extends TestCase
{
    // parent::tearDown() handles Mockery::close() automatically
}
```

---

## Exceptions

Tests that do not use facades or Mockery mocks may skip explicit cleanup, but calling `parent::tearDown()` is always safe.

---

## Consequences Of Violation

Flaky tests that pass or fail depending on execution order, debugging time wasted on false test failures.

---

## Use IDE Helper for Facade Autocompletion

Run `php artisan ide-helper:generate` to generate `@method` annotations for all registered facades.

---

## Category

Maintainability

---

## Rule

After adding or modifying facades, run `php artisan ide-helper:generate` to generate PHPDoc annotations. Commit the generated file to version control.

---

## Reason

Facades use `__callStatic()` which is opaque to static analysis. Without `@method` annotations, IDEs cannot provide autocompletion, method signature hints, or refactoring support for facade calls.

---

## Bad Example

```php
// No ide-helper generated — IDE cannot autocomplete
Cache::remember('key', 3600, fn() => 'value');
// IDE shows no method signature, parameters, or return type
```

---

## Good Example

```php
// After `php artisan ide-helper:generate`:
// IDE shows: remember(string $key, int $ttl, Closure $callback): mixed
Cache::remember('key', 3600, fn() => 'value');
```

---

## Exceptions

Applications that do not use IDEs for development may skip this step.

---

## Consequences Of Violation

Reduced developer productivity, no method signature discovery, refactoring blind spots, increased likelihood of misusing facade methods.

---

## Never Use Facades in Package Code

Laravel packages must use constructor injection or container resolution, never direct facade calls.

---

## Category

Architecture

---

## Rule

Packages distributed via Composer must not call facades in their internal code. Use constructor injection for all service dependencies.

---

## Reason

Package consumers may want to swap implementations of the services a package uses. Facade calls in package code create hard-coded dependencies that cannot be substituted, limiting the package's compatibility and flexibility.

---

## Bad Example

```php
// Inside a package
class PackageService
{
    public function process(): void
    {
        Cache::put('key', 'value'); // package depends on Cache facade
    }
}
```

---

## Good Example

```php
// Inside a package
class PackageService
{
    public function __construct(
        private CacheContract $cache,
    ) {}

    public function process(): void
    {
        $this->cache->put('key', 'value');
    }
}
```

---

## Exceptions

Package service providers may register container bindings and use facades in `boot()` for package configuration.

---

## Consequences Of Violation

Package consumers cannot swap service implementations, package testing requires facade mocking, incompatibility with non-Laravel frameworks.

---

## Avoid Mixed Access Patterns in the Same Class

Do not mix facade calls and constructor injection for the same service category within a single class.

---

## Category

Maintainability

---

## Rule

A class must use a consistent access pattern for its dependencies. If a class uses constructor injection for services, do not also call facades for similar services within the same class. Choose one pattern per class.

---

## Reason

Mixed patterns make the dependency graph confusing. Some dependencies are visible in the constructor signature, others are hidden in method bodies. This inconsistency makes the class harder to understand, test, and refactor.

---

## Bad Example

```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
    ) {}

    public function process(int $id): void
    {
        $order = $this->orders->find($id);          // injection
        Log::info('Processing order', ['id' => $id]); // facade
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private Logger $log,
    ) {}

    public function process(int $id): void
    {
        $order = $this->orders->find($id);
        $this->log->info('Processing order', ['id' => $id]);
    }
}
```

---

## Exceptions

Controllers may mix facades and injection pragmatically, as they are HTTP entry points where ergonomics are prioritized over strict consistency.

---

## Consequences Of Violation

Inconsistent dependency visibility, confusion about which pattern to follow, code review friction, harder test setup.
