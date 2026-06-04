# Deferred Provider Loading Timing Rules

## Rule 1: Keep provides() Complete and In Sync
---
## Category
Reliability
---
## Rule
Always return every service identifier the provider registers — including aliases — from the `provides()` method.
---
## Reason
The deferred services manifest maps service identifiers to their provider. Missing a service in `provides()` means the manifest does not associate it with the provider. When `$app->make(Service::class)` is called, the container finds no binding and no deferred provider to load, throwing `BindingResolutionException`.
---
## Bad Example
```php
class ReportingProvider extends ServiceProvider implements DeferrableProvider
{
    public function register()
    {
        $this->app->singleton(ReportGenerator::class, fn() => new ReportGenerator());
        $this->app->alias(ReportGenerator::class, 'reports');
    }

    public function provides()
    {
        return [ReportGenerator::class]; // Missing 'reports' alias
    }
}
```
---
## Good Example
```php
class ReportingProvider extends ServiceProvider implements DeferrableProvider
{
    public function register()
    {
        $this->app->singleton(ReportGenerator::class, fn() => new ReportGenerator());
        $this->app->alias(ReportGenerator::class, 'reports');
    }

    public function provides()
    {
        return [ReportGenerator::class, 'reports'];
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
`BindingResolutionException` when resolving a service or alias that the provider registers but `provides()` omits. Intermittent failures based on which service triggers the provider load.
---

## Rule 2: Never Defer Providers with Boot Logic
---
## Category
Architecture
---
## Rule
Never implement `DeferrableProvider` on a service provider that has `boot()` logic.
---
## Reason
A deferred provider's `boot()` runs on first resolution, not during the main boot phase. If `boot()` registers routes, event listeners, view composers, or gates, those registrations do not happen until the provider is triggered — potentially too late for early-arriving requests.
---
## Bad Example
```php
class EventProvider extends ServiceProvider implements DeferrableProvider
{
    public function boot()
    {
        Event::listen(UserRegistered::class, SendWelcomeEmail::class);
    }

    public function provides()
    {
        return [SomeService::class];
    }
}
// Listener never registers until SomeService is resolved
```
---
## Good Example
```php
// Split into deferred binding provider and eager boot provider
class EventProvider extends ServiceProvider
{
    public function boot()
    {
        Event::listen(UserRegistered::class, SendWelcomeEmail::class);
    }
}
```
---
## Exceptions
Providers that use `when()` to trigger loading based on a specific event — the provider loads before that event fires, so `boot()` runs in time.
---
## Consequences Of Violation
Event listeners never fire. Routes return 404. View composers never execute. Gates are undefined — all because the deferred provider's `boot()` never runs during the main boot phase.
---

## Rule 3: Regenerate Services Cache After Provider Changes
---
## Category
Maintainability
---
## Rule
Always run `php artisan optimize:clear` when changing a provider's deferred status or its `provides()` method.
---
## Reason
The services manifest (`bootstrap/cache/services.php`) caches which providers are deferred and their service mappings. Without regeneration, the framework uses a stale manifest: a provider that was eager remains in the manifest as eager after you add `DeferrableProvider`, or a new service is missing from the manifest.
---
## Bad Example
```php
// 1. Add DeferrableProvider to a provider
// 2. Deploy without running optimize:clear
// 3. Provider still treated as eager — no performance gain
```
---
## Good Example
```php
// 1. Add DeferrableProvider to a provider
// 2. Run: php artisan optimize:clear
// 3. Run: php artisan optimize
// 4. Verify: inspect bootstrap/cache/services.php
```
---
## Exceptions
Development environments where services cache is not used (no `php artisan optimize` run).
---
## Consequences Of Violation
Stale manifest causes `BindingResolutionException` for new services. Changed deferred status not reflected. Debugging wasted on "provider not loading" issues that are actually manifest stale date issues.
---

## Rule 4: Account for First-Use Latency Spike
---
## Category
Performance
---
## Rule
Accept that deferred providers incur a latency spike on first resolution and plan for it in performance-sensitive code paths.
---
## Bad Example
```php
// In a controller that handles a customer-facing request
public function show(Request $request)
{
    $report = app(ReportGenerator::class)->generate(); // First call: 50ms penalty
    return response()->json($report);
}
```
---
## Good Example
```php
// Pre-resolve during warmup
public function register()
{
    $this->app->booted(function () {
        if (! $this->app->runningInConsole()) {
            $this->app->make(ReportGenerator::class); // Warmup — pay cost at boot, not on first request
        }
    });
}
```
---
## Exceptions
Octane deployments where first-use latency is paid once per worker, then amortized across thousands of requests.
---
## Consequences Of Violation
First user who triggers a deferred service experiences 10-50ms latency spike. Inconsistent response times for different code paths.
---

## Rule 5: Use when() for Event-Triggered Deferred Loading
---
## Category
Architecture
---
## Rule
Use the `when()` method on deferred providers that must register event listeners before the listened event fires.
---
## Reason
Without `when()`, a deferred provider that registers an event listener in `boot()` would load too late — the event fires before the provider is triggered. The `when()` method tells the framework to preload the provider when a specific binding is resolved (typically the event class), ensuring the listener is registered before the event dispatches.
---
## Bad Example
```php
class NotificationProvider extends ServiceProvider implements DeferrableProvider
{
    public function boot()
    {
        Event::listen(UserRegistered::class, SendWelcomeEmail::class);
    }

    public function provides()
    {
        return [NotificationService::class];
    }
}
// UserRegistered event fires before NotificationService is resolved — listener never runs
```
---
## Good Example
```php
class NotificationProvider extends ServiceProvider implements DeferrableProvider
{
    public function boot()
    {
        Event::listen(UserRegistered::class, SendWelcomeEmail::class);
    }

    public function provides()
    {
        return [NotificationService::class];
    }

    public function when()
    {
        return [UserRegistered::class]; // Provider loads when UserRegistered is resolved
    }
}
```
---
## Exceptions
Providers that only bind services without any event listener registration.
---
## Consequences Of Violation
Event listeners registered in deferred providers silently never fire. Features that depend on those listeners break without clear error messages.
---

## Rule 6: Avoid Deferring Providers Used on Most Requests
---
## Category
Performance
---
## Rule
Do not defer a provider whose services are resolved on 90%+ of requests.
---
## Reason
Deferral provides marginal benefit when the service is used on nearly every request — the provider still loads. Meanwhile, deferral adds complexity: the first-use latency spike, the risk of `provides()` being incomplete, and stale manifest issues.
---
## Bad Example
```php
class LoggerProvider extends ServiceProvider implements DeferrableProvider
{
    // Logger is used on every single request — deferring saves nothing
    public function register()
    {
        $this->app->singleton(Logger::class, fn() => new Logger());
    }

    public function provides()
    {
        return [Logger::class];
    }
}
```
---
## Good Example
```php
class LoggerProvider extends ServiceProvider
{
    // Keep eager — used on every request, deferral provides no benefit
    public function register()
    {
        $this->app->singleton(Logger::class, fn() => new Logger());
    }
}
```
---
## Exceptions
When the provider is heavy (registers many services) but only a subset is used per request.
---
## Consequences Of Violation
Unnecessary complexity without measurable performance gain. Added maintenance burden from `provides()` and cache regeneration requirements.
