# Rules

## Rule 1: Keep `register()` Pure — Bindings Only, Never Resolve from Container
---
## Category
Architecture
---
## Rule
Limit `register()` to container bindings (`bind`, `singleton`, `mergeConfigFrom`) and declarative shortcuts. Never call `$this->app->make()` or `resolve()` inside `register()`.
---
## Reason
The two-phase model guarantees all `register()` calls complete before any `boot()` call. Resolving in `register()` accesses bindings that may not exist yet, causing non-deterministic failures that depend on provider registration order.
---
## Bad Example
```php
public function register(): void
{
    $this->app->bind(Gateway::class, StripeGateway::class);
    $gateway = $this->app->make(Gateway::class); // May fail if dependencies not yet registered
}
```
---
## Good Example
```php
public function register(): void
{
    $this->app->bind(Gateway::class, StripeGateway::class);
}

public function boot(): void
{
    $gateway = $this->app->make(Gateway::class); // Safe — all providers registered
}
```
---
## Exceptions
Core framework providers that intentionally bind early and resolve the same binding (e.g., `FoundationServiceProvider`) — these are written with deep knowledge of registration order.
---
## Consequences Of Violation
Intermittent "Target class does not exist" errors; configuration-cache failures; non-deterministic behavior that works in development but fails in production; bugs that are hard to reproduce.

## Rule 2: Order Providers Deliberately in `bootstrap/providers.php`
---
## Category
Reliability
---
## Rule
Arrange provider classes in `bootstrap/providers.php` so that providers registering dependencies appear before providers that consume them.
---
## Reason
Provider registration order is the order listed in `bootstrap/providers.php`. A provider that registers a binding must execute `register()` before another provider's `boot()` depends on that binding.
---
## Bad Example
```php
return [
    App\Providers\PaymentControllerProvider::class, // Depends on PaymentGateway in boot()
    App\Providers\PaymentGatewayProvider::class,    // Registers PaymentGateway — too late
];
```
---
## Good Example
```php
return [
    App\Providers\PaymentGatewayProvider::class,  // Registers PaymentGateway first
    App\Providers\PaymentControllerProvider::class, // Depends on it — safe
];
```
---
## Exceptions
When all dependencies are resolved lazily (container resolves on first `make()` call, after all providers have registered) or when providers are independent of each other.
---
## Consequences Of Violation
Intermittent resolution failures; difficult debugging where swapping provider order fixes the bug without clear explanation; production issues that cannot be reproduced locally.

## Rule 3: Use `$app->booted()` for Logic Requiring All Providers to Boot
---
## Category
Architecture
---
## Rule
Use `$app->booted(callable)` for initialization that must happen after every provider has completed both `register()` and `boot()`.
---
## Reason
`boot()` runs in registration order — Provider A's `boot()` may execute before Provider B's `register()`. The `booted()` callback fires only after all providers have booted, providing a true post-bootstrap hook.
---
## Bad Example
```php
public function boot(): void
{
    // Assumes SchedulerProvider has already booted
    // but SchedulerProvider may come later in the array
    $this->app->make(Scheduler::class)->run();
}
```
---
## Good Example
```php
public function boot(): void
{
    $this->app->booted(function ($app) {
        $app->make(Scheduler::class)->run(); // All providers booted
    });
}
```
---
## Exceptions
Logic that only depends on bindings (not on other providers' `boot()` side effects) can safely run in `boot()` without waiting for `booted()`.
---
## Consequences Of Violation
Order-dependent initialization failures; code that assumes other providers have booted may find their boot-time side effects haven't run yet.

## Rule 4: Prefer Deferred Providers for Rarely-Used Services
---
## Category
Performance
---
## Rule
Implement `DeferrableProvider` on providers whose services are not needed on the majority of requests.
---
## Reason
Each eager provider adds constructor + `register()` + `boot()` overhead on every request (0.1-0.5ms). Deferred providers eliminate this entirely until the service is first resolved.
---
## Bad Example
```php
class PdfExportServiceProvider extends ServiceProvider
{
    // Eager by default — runs on every request
    // But PDF export is used on <5% of routes
}
```
---
## Good Example
```php
class PdfExportServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function provides(): array
    {
        return [PdfExporter::class, 'pdf.export'];
    }
}
```
---
## Exceptions
Providers that register routes, listeners, views, or middleware in `boot()` must be eager regardless of service utilization frequency.
---
## Consequences Of Violation
Unnecessary bootstrap overhead on every request; cumulative performance degradation as provider count grows; direct impact on TTFB.

## Rule 5: Never Override the Provider Constructor Without Calling `parent::register()`
---
## Category
Reliability
---
## Rule
If you override `register()`, always call `parent::register()` at the top of the method.
---
## Reason
The base `ServiceProvider::register()` processes `$bindings` and `$singletons` properties. Skipping `parent::register()` silently disables these declarative shortcuts, leaving them as dead code that appears correct but does nothing.
---
## Bad Example
```php
class PaymentServiceProvider extends ServiceProvider
{
    protected $bindings = [
        PaymentGateway::class => StripeGateway::class,
    ];

    public function register(): void
    {
        // parent::register() never called — $bindings are ignored
        $this->app->singleton(Logger::class);
    }
}
```
---
## Good Example
```php
class PaymentServiceProvider extends ServiceProvider
{
    protected $bindings = [
        PaymentGateway::class => StripeGateway::class,
    ];

    public function register(): void
    {
        parent::register(); // Processes $bindings and $singletons
        $this->app->singleton(Logger::class);
    }
}
```
---
## Exceptions
Providers that use NO declarative shortcuts (no `$bindings`, no `$singletons`) may omit `parent::register()` — but calling it defensively has negligible overhead.
---
## Consequences Of Violation
Silent dead code — `$bindings` and `$singletons` properties appear correct but never register anything; services silently unavailable; difficult debugging.
