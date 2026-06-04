# Deferred Provider Rules

## Rule 1: Use DeferrableProvider Interface, Not $defer Property
---
## Category
Maintainability
---
## Rule
Always implement the `DeferrableProvider` interface for deferred providers instead of using the legacy `$defer = true` property.
---
## Reason
The interface enables IDE autocompletion, static analysis, and consistent type-checking. The `$defer` property is a legacy pattern from Laravel 7 and earlier. The interface is the canonical pattern in Laravel 13.
---
## Bad Example
```php
class AnalyticsProvider extends ServiceProvider
{
    protected $defer = true; // Legacy pattern

    public function register() { ... }
    public function provides() { return [Analytics::class]; }
}
```
---
## Good Example
```php
use Illuminate\Contracts\Support\DeferrableProvider;

class AnalyticsProvider extends ServiceProvider implements DeferrableProvider
{
    public function register() { ... }
    public function provides() { return [Analytics::class]; }
}
```
---
## Exceptions
Maintaining compatibility with Laravel 6 or 7 codebases.
---
## Consequences Of Violation
Missed IDE support. Legacy code that is harder to refactor and maintain. Inconsistent patterns across the codebase.
---

## Rule 2: Always Implement provides() Completely
---
## Category
Reliability
---
## Rule
Return every binding name, class reference, and alias that the provider registers from the `provides()` method.
---
## Reason
The deferred services manifest maps service identifiers to their provider. Any service registered but not listed in `provides()` is invisible to the deferred resolution mechanism. When `$app->make()` is called with an unlisted service, the container finds no binding and no deferred provider to load.
---
## Bad Example
```php
public function register()
{
    $this->app->singleton(Analytics::class, fn() => new Analytics());
    $this->app->bind(ReportGenerator::class, CsvReportGenerator::class);
    $this->app->alias(Analytics::class, 'analytics');
}

public function provides()
{
    return [Analytics::class]; // Missing ReportGenerator::class and 'analytics' alias
}
```
---
## Good Example
```php
public function register()
{
    $this->app->singleton(Analytics::class, fn() => new Analytics());
    $this->app->bind(ReportGenerator::class, CsvReportGenerator::class);
    $this->app->alias(Analytics::class, 'analytics');
}

public function provides()
{
    return [Analytics::class, ReportGenerator::class, 'analytics'];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
`BindingResolutionException` when resolving a service the provider registers but `provides()` omits. Intermittent resolution failures.
---

## Rule 3: Never Defer Providers with Mandatory Boot Logic
---
## Category
Architecture
---
## Rule
Never apply `DeferrableProvider` to a service provider whose `boot()` method registers routes, events, listeners, or gates.
---
## Reason
A deferred provider loads only when one of its `provides()` services is resolved. If the provider's `boot()` registers routes or listeners, those registrations don't happen until resolution. Early requests that depend on those routes or listeners will fail.
---
## Bad Example
```php
class EventServiceProvider extends ServiceProvider implements DeferrableProvider
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
// UserRegistered listener never registers until SomeService is first resolved
```
---
## Good Example
```php
class EventServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Event::listen(UserRegistered::class, SendWelcomeEmail::class);
    }
}
```
---
## Exceptions
Using `when()` method to trigger preloading based on a specific event — but ensure the trigger fires before the first event dispatch.
---
## Consequences Of Violation
Event listeners silently never fire. Routes return 404. Gates are undefined for the first requests until a service coincidentally triggers provider loading.
---

## Rule 4: Regenerate Manifest After Provider Changes
---
## Category
Maintainability
---
## Rule
Run `php artisan optimize:clear` and `php artisan optimize` after any change to a provider's `DeferrableProvider` status or `provides()` method.
---
## Reason
The services manifest (`bootstrap/cache/services.php`) caches deferred provider mappings. Without regeneration, the old manifest is used: newly deferred providers are still treated as eager, new services in `provides()` are missing from the manifest, and removed services still trigger the old provider.
---
## Bad Example
```php
// 1. Removed a service from provides()
// 2. Deployed without running optimize:clear
// 3. Old manifest still maps the removed service to the provider
// 4. When service is resolved, provider loads — but service isn't registered
```
---
## Good Example
```php
// After any provider modification:
// php artisan optimize:clear
// php artisan optimize
// Check bootstrap/cache/services.php for correctness
```
---
## Exceptions
Development environments where manifest regeneration happens automatically.
---
## Consequences Of Violation
`BindingResolutionException` or continued use of stale provider mappings. Hours of debugging what appears to be a provider issue but is actually a stale cache.
---

## Rule 5: Use when() for Event-Driven Deferred Providers
---
## Category
Architecture
---
## Rule
Use the `when()` method to specify services or events whose resolution should trigger preemptive loading of a deferred provider.
---
## Reason
Without `when()`, a deferred provider that registers event listeners loads too late to catch early events. The `when()` method registers the provider to load when a specified binding is resolved, ensuring the provider's `boot()` runs before the relevant event fires.
---
## Bad Example
```php
class MailTrackingProvider extends ServiceProvider implements DeferrableProvider
{
    public function boot()
    {
        Event::listen(MailSent::class, TrackMailDelivery::class);
    }

    public function provides() { return [MailTracker::class]; }
    // MailSent fires before MailTracker is ever resolved — listener never runs
}
```
---
## Good Example
```php
class MailTrackingProvider extends ServiceProvider implements DeferrableProvider
{
    public function boot()
    {
        Event::listen(MailSent::class, TrackMailDelivery::class);
    }

    public function provides() { return [MailTracker::class]; }

    public function when()
    {
        return [MailSent::class]; // Provider loads when MailSent is resolved
    }
}
```
---
## Exceptions
Providers that only bind services and register no event listeners — they don't need `when()`.
---
## Consequences Of Violation
Event listeners registered in deferred providers silently never execute. Debugging event-based features that appear to work intermittently.
---

## Rule 6: Avoid Deferring High-Frequency Services
---
## Category
Performance
---
## Rule
Do not defer providers for services that are resolved on the majority of requests.
---
## Reason
Deferral adds complexity (manifest management, `provides()` maintenance, first-use latency) without meaningful performance benefit when the service is used on nearly every request. The provider still loads — it just loads on first use instead of at boot.
---
## Bad Example
```php
// DatabaseServiceProvider — database is used on every request
class DatabaseServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register()
    {
        $this->app->singleton(DB::class, fn() => new DatabaseManager());
    }

    public function provides() { return [DB::class]; }
}
```
---
## Good Example
```php
class DatabaseServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(DB::class, fn() => new DatabaseManager());
    }
}
```
---
## Exceptions
Providers with extremely heavy `register()` costs that are worth deferring even if used on most requests — but consider optimizing the `register()` method instead.
---
## Consequences Of Violation
Unnecessary complexity without performance gain. Added risk of stale manifest bugs. First-use latency spike on high-traffic services.
