# Rules

## Rule 1: Defer Rarely-Used Services to Optimize Bootstrap Time
---
## Category
Performance
---
## Rule
Prefer deferred providers for services used on less than 30% of routes.
---
## Reason
Eager providers run on every request. Deferred providers eliminate all bootstrap overhead (constructor, register, boot) until the service is actually needed, reducing TTFB for the majority of requests.
---
## Bad Example
```php
class AnalyticsServiceProvider extends ServiceProvider
{
    // No DeferrableProvider interface — runs on every request
    // but analytics tracking is only needed on 5% of routes
}
```
---
## Good Example
```php
class AnalyticsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(AnalyticsTracker::class);
    }

    public function provides(): array
    {
        return [AnalyticsTracker::class, 'analytics'];
    }
}
```
---
## Exceptions
Services used on most requests (>70%) should remain eager — the deferred overhead of manifest lookup and on-demand registration outweighs the benefit.
---
## Consequences Of Violation
Higher bootstrap time on every request; cumulative performance degradation as provider count grows; wasted CPU and memory on routes that never use the service.

## Rule 2: Always Implement `provides()` with Every Registered Service Identifier
---
## Category
Reliability
---
## Rule
Always return every service identifier (class, interface, alias) registered in `register()` from the `provides()` method.
---
## Reason
The deferred manifest maps service identifiers to provider classes. If `provides()` omits a binding, the provider will never load when that service is resolved, causing silent resolution failures.
---
## Bad Example
```php
class MailServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(MailManager::class);
        $this->app->bind('mailer', MailManager::class);
    }

    public function provides(): array
    {
        return [MailManager::class]; // 'mailer' alias omitted — resolves to nothing
    }
}
```
---
## Good Example
```php
class MailServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(MailManager::class);
        $this->app->bind('mailer', MailManager::class);
    }

    public function provides(): array
    {
        return [MailManager::class, 'mailer'];
    }
}
```
---
## Exceptions
No common exceptions. Every binding, alias, and concrete registered in `register()` must be listed.
---
## Consequences Of Violation
Silent resolution failures on deferred services; mysterious "Target class does not exist" errors that only occur on specific pages; difficult-to-debug production issues.

## Rule 3: Never Defer Providers That Register Routes, Event Listeners, or Views in `boot()`
---
## Category
Architecture
---
## Rule
Never apply `DeferrableProvider` to a provider whose `boot()` method registers routes, event listeners, views, middleware, or other boot-time artifacts.
---
## Reason
Deferred providers are not instantiated during normal boot — they load on first service resolution. If routes or listeners are registered in `boot()`, they won't be available until someone resolves a service from the provider, potentially never.
---
## Bad Example
```php
class BlogServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes/blog.php');
        // Routes won't be registered until a Blog service is resolved
    }
}
```
---
## Good Example
```php
class BlogServiceProvider extends ServiceProvider
{
    // No DeferrableProvider — runs at boot time

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes/blog.php');
    }
}
```
---
## Exceptions
If the provider registers routes conditionally inside a closure that only fires when a service is resolved, deferral may be acceptable — but this is rare and should be explicitly documented.
---
## Consequences Of Violation
Routes returning 404; event listeners never firing; views never loaded; middleware not applied; the provider's boot-time work is effectively dead code.

## Rule 4: Always Rebuild the Deferred Manifest After Code Changes
---
## Category
Reliability
---
## Rule
Always run `php artisan optimize` (or `php artisan clear-compiled`) after adding, removing, or modifying deferred providers in a production deployment.
---
## Reason
The deferred manifest at `bootstrap/cache/services.php` is a static snapshot. Code changes without manifest regeneration mean the stale manifest still references old provider classes or lacks new ones, causing resolution failures.
---
## Bad Example
```bash
# Deploy code adding a new deferred provider
git pull origin main
# No manifest rebuild — services silently unavailable
```
---
## Good Example
```bash
git pull origin main
php artisan optimize --no-interaction
```
---
## Exceptions
Local development environments without config/route caching may not require immediate rebuild, as Laravel rebuilds the manifest on-the-fly when the cache is absent.
---
## Consequences Of Violation
Silent resolution failures after deployment; new services returning "class not found" errors; old removed services still resolving from stale manifest.

## Rule 5: Keep `provides()` in Exact Sync with `register()` Bindings
---
## Category
Maintainability
---
## Rule
When adding or removing a binding in `register()`, always update `provides()` in the same change set.
---
## Reason
A mismatch between `provides()` and `register()` is the most common deferred provider bug. The manifest maps what `provides()` returns — if it doesn't match, services silently fail to resolve or the manifest contains stale entries.
---
## Bad Example
```php
public function register(): void
{
    $this->app->singleton(OldService::class); // removed but still in provides
    $this->app->singleton(NewService::class); // added but not in provides
}

public function provides(): array
{
    return [OldService::class]; // stale entry, NewService missing
}
```
---
## Good Example
```php
public function register(): void
{
    $this->app->singleton(NewService::class);
}

public function provides(): array
{
    return [NewService::class];
}
```
---
## Exceptions
No common exceptions. Always keep `register()` and `provides()` synchronized.
---
## Consequences Of Violation
Stale manifest entries referencing deleted classes; new services never resolving via deferred loading; difficult debugging as errors surface only in specific request contexts.

## Rule 6: Prefer a Deferred-First Policy for New Providers
---
## Category
Architecture
---
## Rule
Default new providers to deferred unless a specific, documented need for eager registration exists.
---
## Reason
Deferred providers incur zero cost until their services are used. Starting deferred by default prevents accidental performance regressions and forces deliberate justification when a provider must be eager.
---
## Bad Example
```php
// New provider, no thought given to deferral
class PdfExportServiceProvider extends ServiceProvider
{
    // Eager by default — runs on every request
    // PDF export is used on <1% of routes
}
```
---
## Good Example
```php
class PdfExportServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function provides(): array
    {
        return [PdfExporter::class];
    }
}
```
---
## Exceptions
Providers that register boot-time artifacts (routes, views, listeners, middleware) must be eager, as must providers that other providers depend on in `boot()`.
---
## Consequences Of Violation
Unnecessary bootstrap overhead from providers that are rarely needed; provider count grows faster than actual active service count.
