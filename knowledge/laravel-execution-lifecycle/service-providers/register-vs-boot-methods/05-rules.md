# Rules

## Rule 1: Never Resolve from the Container Inside `register()`
---
## Category
Architecture
---
## Rule
Do not call `$this->app->make()`, `app()`, or `resolve()` inside `register()`. Bindings from other providers may not exist yet.
---
## Reason
The two-phase model guarantees all `register()` calls complete before any `boot()` call. Resolving in `register()` accesses bindings that are not guaranteed to exist, creating non-deterministic failures that depend on provider registration order.
---
## Bad Example
```php
public function register(): void
{
    $this->app->bind(Logger::class, FileLogger::class);
    $logger = $this->app->make(Logger::class); // Works now, but may fail if order changes
}
```
---
## Good Example
```php
public function register(): void
{
    $this->app->bind(Logger::class, FileLogger::class);
}

public function boot(): void
{
    $logger = $this->app->make(Logger::class); // Safe — all providers registered
}
```
---
## Exceptions
Core framework providers that intentionally bind and resolve the same service within `register()` — these have explicit knowledge of the container state and are carefully ordered.
---
## Consequences Of Violation
Intermittent "Target class does not exist" errors; config-cache failures; hard-to-reproduce bugs that appear only in certain deployment orders; non-deterministic bootstrap behavior.

## Rule 2: Place Route, View, Event Listener, and Middleware Registration in `boot()`
---
## Category
Architecture
---
## Rule
Register routes, event listeners, view composers, Blade directives, and middleware only inside `boot()`, never in `register()`.
---
## Reason
These operations depend on core framework services (Router, View, Event dispatcher) that are registered by other providers during their `register()` phase. By the time `boot()` runs, all providers' `register()` has completed, so these services are guaranteed to exist.
---
## Bad Example
```php
public function register(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
    // Router may not be bound yet — order-dependent failure
}
```
---
## Good Example
```php
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
    $this->loadViewsFrom(__DIR__.'/../views', 'blog');
    $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
}
```
---
## Exceptions
No common exceptions. Route, view, and event registration always belongs in `boot()`.
---
## Consequences Of Violation
Routes loading before Router is bound; view namespaces not registered; event listeners not attached; `php artisan config:cache` failures; intermittent errors that depend on provider ordering.

## Rule 3: Keep `register()` Pure — Bindings and Config Merges Only, No Side Effects
---
## Category
Architecture
---
## Rule
Limit `register()` strictly to container bindings (`bind`, `singleton`, `tag`, `when`/`needs`/`give`) and config merges (`mergeConfigFrom`). Avoid I/O, logging, file writes, or HTTP calls.
---
## Reason
Config caching (`php artisan config:cache`) calls `register()` in a special context where the application may not be fully booted. Side effects in `register()` — especially file writes and logging — can fail silently or corrupt the cache.
---
## Bad Example
```php
public function register(): void
{
    $this->app->bind(Logger::class, FileLogger::class);
    Log::info('Provider registered'); // Side effect — may fail during config cache
    file_put_contents(storage_path('logs/provider.txt'), 'registered'); // File write in register
}
```
---
## Good Example
```php
public function register(): void
{
    $this->app->bind(Logger::class, FileLogger::class);
    $this->mergeConfigFrom(__DIR__.'/../config/analytics.php', 'analytics');
}

public function boot(): void
{
    // Side-effect logic runs in boot where environment is stable
    Log::info('Provider booted');
}
```
---
## Exceptions
No common exceptions. `register()` must be side-effect free to support config caching correctly.
---
## Consequences Of Violation
`php artisan config:cache` fails with silent exceptions; cached config may be corrupted; file writes in config-cache context may produce artifacts in the build process; debugging confusion when "register" side effects don't appear.

## Rule 4: Use Boot Method Injection for Auto-Resolved Dependencies
---
## Category
Code Organization
---
## Rule
Type-hint required services as `boot()` parameters instead of calling `$this->app->make()` inside `boot()`.
---
## Reason
Laravel's container auto-resolves type-hinted parameters in `boot()`, making dependencies explicit, self-documenting, and resolved once rather than on every call. This also signals to readers what the provider actually needs.
---
## Bad Example
```php
public function boot(): void
{
    $gateway = $this->app->make(PaymentGateway::class);
    $logger = $this->app->make(LoggerInterface::class);
    $gateway->setLogger($logger);
}
```
---
## Good Example
```php
public function boot(PaymentGateway $gateway, LoggerInterface $logger): void
{
    $gateway->setLogger($logger);
}
```
---
## Exceptions
When the dependency is optional or conditionally resolved based on runtime state. In that case, use `$this->app->make()` with a guard or `$this->app->bound()` check.
---
## Consequences Of Violation
Hidden dependencies — readers must scan `boot()` body to understand what the provider needs; potential multiple resolutions of the same service; less idiomatic, more verbose code.

## Rule 5: Use `$app->booted()` for Actions Requiring the Entire Application to Be Booted
---
## Category
Architecture
---
## Rule
Use `$this->app->booted(callable)` for initialization that must run after every single provider has completed both `register()` and `boot()`.
---
## Reason
`boot()` runs in provider registration order — it is not guaranteed that all providers have booted when your `boot()` executes. `booted()` callbacks fire only after the entire application's boot sequence completes.
---
## Bad Example
```php
public function boot(): void
{
    // Assumes all providers have booted and all routes are registered
    // But this provider may run early in the boot sequence
    Route::getRoutes()->refreshRouteLookup();
}
```
---
## Good Example
```php
public function boot(): void
{
    $this->app->booted(function ($app) {
        // All providers have booted — routes, events, views all registered
        $app->make(RouteRegistrar::class)->refresh();
    });
}
```
---
## Exceptions
Actions that depend only on bindings (not on other providers' boot-time side effects) can safely run in `boot()` without `booted()`.
---
## Consequences Of Violation
Order-dependent failures where some providers' boot-time registrations are not yet complete; actions operating on incomplete application state; bugs that only occur with specific provider ordering.

## Rule 6: Never Perform I/O, Logging, or Database Operations Inside `register()`
---
## Category
Reliability
---
## Rule
Keep `register()` free of I/O operations — no database queries, HTTP calls, file writes, or logging.
---
## Reason
`register()` executes during config caching and early bootstrap when the application environment is unstable. I/O may fail silently, produce unexpected artifacts, or corrupt cached state. All I/O belongs in `boot()` or later.
---
## Bad Example
```php
public function register(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config/payments.php', 'payments');
    Log::channel('setup')->info('Payments provider registered'); // I/O in register
    Cache::put('provider_version', '1.0'); // Cache write in register
}
```
---
## Good Example
```php
public function register(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config/payments.php', 'payments');
}

public function boot(): void
{
    Log::channel('setup')->info('Payments provider booted');
    Cache::put('provider_version', '1.0');
}
```
---
## Exceptions
No common exceptions. The only acceptable operations in `register()` are container binding calls and config merges.
---
## Consequences Of Violation
Config caching failures; unexpected file artifacts in build process; silent I/O failures that don't surface until runtime; corrupted cache state; log entries that appear during config cache but not during normal requests.
