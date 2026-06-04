# Bootstrapper Sequence — Rules

## Rule Name
Place all config-dependent logic in `boot()` not `register()`.
---
## Category
Framework Usage
---
## Rule
Implement interface bindings and service registrations in `register()`. Place configuration reads, environment checks, and conditional logic in `boot()`.
---
## Reason
The bootstrapper sequence guarantees `LoadConfiguration` runs before `RegisterProviders` and `BootProviders`, but providers are instantiated during `RegisterProviders` and their `register()` method executes before `BootProviders`. At `register()` time, configuration is loaded but other providers' `register()` may not have run yet. At `boot()` time, all providers are registered and configuration is guaranteed available.
---
## Bad Example
```php
public function register(): void
{
    $driver = $this->app['config']['database.default']; // Works by coincidence in FPM, but not guaranteed
}
```
---
## Good Example
```php
public function register(): void
{
    // No config access here
}

public function boot(): void
{
    $driver = $this->app['config']['database.default']; // Guaranteed available
}
```
---
## Exceptions
Code that reads `$_ENV` directly (not through `config()`) can safely execute in `register()` because `LoadEnvironmentVariables` runs before all provider phases.
---
## Consequences Of Violation
Intermittent `null` config values during `register()`, especially when config caching is enabled or when providers are deferred. Silent fallback to default values instead of configured values.

---

## Rule Name
Never modify the kernel's `$bootstrappers` array.
---
## Category
Architecture
---
## Rule
Do not override, add to, remove from, or reorder the `$bootstrappers` array in `Http\Kernel` or `Console\Kernel`.
---
## Reason
The six-bootstrapper sequence (`LoadEnvironmentVariables → LoadConfiguration → HandleExceptions → RegisterFacades → RegisterProviders → BootProviders`) is an immutable framework contract. Each bootstrapper sets up infrastructure that the next bootstrapper depends on. Adding, removing, or reordering violates these dependencies and voids framework guarantees.
---
## Bad Example
```php
class Kernel extends HttpKernel
{
    protected $bootstrappers = [
        \Illuminate\Foundation\Bootstrap\RegisterFacades::class,
        // LoadEnvironmentVariables removed — env not loaded before config
        \Illuminate\Foundation\Bootstrap\LoadConfiguration::class,
        // ...
    ];
}
```
---
## Good Example
```php
// Extend via service providers and booting callbacks:
class CustomBootstrapper
{
    public function bootstrap(Application $app): void
    {
        // Custom logic that runs during an existing phase
    }
}
```
---
## Exceptions
No common exceptions. The bootstrapper array is not a supported extension point in any Laravel version.
---
## Consequences Of Violation
Unpredictable bootstrap failures: `LoadConfiguration` without preceding `LoadEnvironmentVariables` reads environment-independent defaults. `HandleExceptions` without preceding config reads debug settings that may not exist. Framework bootstrapper tests in CI will not catch your custom order — only production fails.

---

## Rule Name
Never call `env()` helper in application code after `php artisan config:cache`.
---
## Category
Reliability
---
## Rule
Use `config()` instead of `env()` in all application code, including service providers, middleware, controllers, and jobs.
---
## Reason
When `config:cache` is enabled, the configuration is serialized and `env()` calls inside config files are resolved at cache-build time. After caching, `env()` returns `null` for any key not present in `$_ENV` at build time. `config()` reads from the cached repository and always returns the cached value.
---
## Bad Example
```php
class MailService
{
    public function send($message)
    {
        $apiKey = env('MAILGUN_SECRET'); // Returns null after config:cache
    }
}
```
---
## Good Example
```php
class MailService
{
    public function send($message)
    {
        $apiKey = config('services.mailgun.secret'); // Always reads from cached config
    }
}
```
---
## Exceptions
`bootstrap/app.php` and `config/*.php` files themselves may call `env()` because they execute before or during the config caching process.
---
## Consequences Of Violation
Staging and production environments that run `config:cache` experience sudden `null` values from `env()` calls. Debugging is difficult because `env()` works correctly in local development where caching is typically disabled.

---

## Rule Name
Implement `DeferrableProvider` on service providers that only register bindings and have no `boot()` logic.
---
## Category
Performance
---
## Rule
Apply the `DeferrableProvider` interface to service providers whose sole purpose is binding registration and that have no `boot()` method, or whose `boot()` method is empty.
---
## Reason
By default, all providers in `config/app.php 'providers'` are instantiated and registered during every request. Deferred providers are only loaded when one of their bindings is actually resolved. This reduces `RegisterProviders` overhead proportionally to the number of deferred providers.
---
## Bad Example
```php
// In config/app.php:
'providers' => [
    App\Providers\MetricsServiceProvider::class,
    // Instantiated every request even if MetricsService never called
]
```
---
## Good Example
```php
class MetricsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(MetricsCollector::class);
    }

    public function provides(): array
    {
        return [MetricsCollector::class];
    }
}
```
---
## Exceptions
Providers that register event listeners, route model bindings, view composers, or any side effect in `boot()` cannot be deferred because deferred providers only load on explicit resolution, not on framework events.
---
## Consequences Of Violation
Unnecessary bootstrap overhead: each non-deferred provider consumes ~0.05–0.2ms per request for instantiation. With 30–50 providers, this adds 1.5–10ms to every request.

---

## Rule Name
Never call `bootstrapWith()` a second time without calling `reset()` first.
---
## Category
Reliability
---
## Rule
Always call `$app->reset()` before invoking `$app->bootstrapWith()` when re-bootstrapping is required in long-running processes.
---
## Reason
After `bootstrapWith()` completes, the `hasBeenBootstrapped` guard is set to `true`. All subsequent calls to `bootstrapWith()` throw `LogicException`. `reset()` clears the guard (and all other state), allowing a fresh bootstrap sequence.
---
## Bad Example
```php
// In an Octane worker:
$app->bootstrapWith($bootstrappers); // First call — succeeds
$app->bootstrapWith($bootstrappers); // Second call — LogicException: "Application has been bootstrapped"
```
---
## Good Example
```php
$app->reset(); // Clear guard and all state
$app->bootstrapWith($bootstrappers); // Succeeds — guard was reset
```
---
## Exceptions
Single-request runtimes (FPM, `artisan` commands that exit) never need to call `bootstrapWith()` more than once.
---
## Consequences Of Violation
`LogicException` halts the worker. In Octane, this translates to a 500 response for every request after the first that triggers manual re-bootstrapping.
