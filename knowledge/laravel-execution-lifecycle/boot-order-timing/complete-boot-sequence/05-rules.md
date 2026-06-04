# Complete Boot Sequence Rules

## Rule 1: Never Resolve Services in register()
---
## Category
Framework Usage
---
## Rule
Never call `$this->app->make()` or `resolve()` inside a service provider's `register()` method.
---
## Reason
The `register()` phase runs before all providers have registered. Resolving a service whose provider hasn't registered yet throws a `BindingResolutionException`. Every provider's `register()` completes before any provider's `boot()` starts.
---
## Bad Example
```php
public function register()
{
    $this->app->bind(ReportService::class, fn($app) => new ReportService($app->make(Logger::class)));
    $logger = $this->app->make(Logger::class); // MAY FAIL — Logger provider may not have registered
}
```
---
## Good Example
```php
public function register()
{
    $this->app->bind(ReportService::class, fn($app) => new ReportService($app->make(Logger::class)));
}

public function boot()
{
    $logger = $this->app->make(Logger::class); // Safe — all providers have registered
}
```
---
## Exceptions
Resolving the `config` repository is safe in `register()` because it is registered by a framework core provider before any app provider.
---
## Consequences Of Violation
`BindingResolutionException` during bootstrap. Non-deterministic failures depending on provider order.
---

## Rule 2: Cache Configuration and Routes in Production
---
## Category
Performance
---
## Rule
Always run `config:cache`, `route:cache`, and `event:cache` in production deployments.
---
## Reason
Caching eliminates file parsing for configuration files, route files, and event listeners, reducing bootstrap time from 30-80ms to 5-15ms per request. Without caching, every request pays the full file-parsing cost.
---
## Bad Example
```php
// Deploy script without caching
git pull
php artisan migrate
// Missing: php artisan config:cache && php artisan route:cache
```
---
## Good Example
```php
// Deploy script with caching
git pull
php artisan migrate
php artisan config:cache
php artisan route:cache
php artisan event:cache
```
---
## Exceptions
Development environments where configuration changes frequently. Environments where `env()` helper is used outside of config files (migrate away from this pattern).
---
## Consequences Of Violation
30-80ms unnecessary bootstrap overhead per request. Higher server costs and slower response times under load.
---

## Rule 3: Understand the 16-Step Boot Sequence Order
---
## Category
Architecture
---
## Rule
Know and respect the fixed 16-step boot sequence order when debugging bootstrap issues or writing initialization code.
---
## Reason
Each step depends on the previous. Bootstrappers cannot be reordered or removed. Code that assumes a step has completed before it actually runs will fail. The sequence is: Composer autoload → Application instance → Kernel bootstrap (6 bootstrappers) → Provider register → Provider boot → Middleware pipeline → Route dispatch → Controller → Response → Terminate.
---
## Bad Example
```php
// Assuming facades are available in code that runs before RegisterFacades bootstrapper
class CustomBootstrapper
{
    public function bootstrap(Application $app)
    {
        Cache::get('key'); // Fails — RegisterFacades hasn't run yet
    }
}
```
---
## Good Example
```php
// Using the container directly — always available
class CustomBootstrapper
{
    public function bootstrap(Application $app)
    {
        $app->make('cache')->get('key'); // Safe — container provides the service
    }
}
```
---
## Exceptions
Octane workers where the sequence runs once per worker start, not per request.
---
## Consequences Of Violation
Silent failures or exceptions when code depends on a bootstrapper that hasn't executed yet. Bugs that are hard to reproduce because boot order is non-obvious.
---

## Rule 4: Defer Providers That Only Bind Services
---
## Category
Performance
---
## Rule
Implement `DeferrableProvider` for service providers that only register bindings and have no `boot()` logic.
---
## Reason
Deferred providers skip both `register()` and `boot()` phases unless one of their services is actually resolved, reducing bootstrap overhead proportionally to unused providers.
---
## Bad Example
```php
class AnalyticsProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(Analytics::class, fn() => new Analytics());
    }
}
```
---
## Good Example
```php
class AnalyticsProvider extends ServiceProvider implements DeferrableProvider
{
    public function register()
    {
        $this->app->singleton(Analytics::class, fn() => new Analytics());
    }

    public function provides()
    {
        return [Analytics::class];
    }
}
```
---
## Exceptions
Providers that register routes, event listeners, view composers, gates, or commands must remain eager.
---
## Consequences Of Violation
Every request pays `register()` overhead for services rarely or never used on that request.
---

## Rule 5: Monitor Bootstrap Time in Production
---
## Category
Performance
---
## Rule
Track time from `LARAVEL_START` (defined in `public/index.php`) to the first middleware execution in production.
---
## Reason
Bootstrap overhead is additive — every provider and bootstrapper adds cost. Without monitoring, gradual bootstrap bloat goes unnoticed until response times degrade. A `LARAVEL_START` to middleware delta exceeding 100ms indicates optimization is needed.
---
## Bad Example
```php
// No bootstrap timing instrumentation
// Cannot answer: "How long does bootstrap take in production?"
```
---
## Good Example
```php
// In AppServiceProvider::boot() or a bootstrap event listener
$bootstrapDuration = (microtime(true) - LARAVEL_START) * 1000;
if ($bootstrapDuration > 100) {
    Log::warning('Slow bootstrap', ['duration_ms' => $bootstrapDuration]);
}
```
---
## Exceptions
Environments where observability tooling (Telescope, DataDog, New Relic) already captures bootstrap timing.
---
## Consequences Of Violation
Unnoticed bootstrap bloat over time. Degraded user experience and higher infrastructure costs.
---

## Rule 6: Never Call $app->boot() Manually
---
## Category
Reliability
---
## Rule
Never invoke `$app->boot()` from middleware, controllers, or any user code.
---
## Reason
The framework manages the boot phase automatically. Manual booting can trigger double-boot (guarded by `$booted` flag) or boot providers before all registrations complete, causing resolution failures.
---
## Bad Example
```php
class SomeMiddleware
{
    public function handle($request, $next)
    {
        app()->boot(); // Forces boot mid-request
        return $next($request);
    }
}
```
---
## Good Example
```php
class SomeMiddleware
{
    public function handle($request, $next)
    {
        return $next($request);
    }
}
```
---
## Exceptions
Testing utilities that need to verify boot phase behavior in isolation.
---
## Consequences Of Violation
Double booting resets state. Providers initialized before all bindings registered cause `BindingResolutionException`. Subtle order-dependent bugs.
