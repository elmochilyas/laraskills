# Lifecycle Callback Hooks Rules

## Rule 1: Register booting/booted Callbacks in register() Phase
---
## Category
Framework Usage
---
## Rule
Always register `$app->booting()` and `$app->booted()` callbacks inside a service provider's `register()` method, never in `boot()`.
---
## Reason
`booting()` callbacks fire before any provider's `boot()` method runs. If registered in `boot()`, the booting phase has already passed — the callback never executes. `booted()` callbacks registered in `boot()` may fire immediately (fire-once) before expected.
---
## Bad Example
```php
public function boot()
{
    $this->app->booting(function ($app) {
        // Never executes — booting phase already passed
        Log::info('Booting...');
    });
}
```
---
## Good Example
```php
public function register()
{
    $this->app->booting(function ($app) {
        // Executes before any provider boots
        Log::info('Booting...');
    });

    $this->app->booted(function ($app) {
        // Executes after all providers have booted
        Log::info('Booted.');
    });
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
`booting()` callback silently never executes. `booted()` callback fires immediately instead of after all providers boot, breaking timing assumptions.
---

## Rule 2: Use booted() for Post-Provider Setup, Not Provider boot()
---
## Category
Architecture
---
## Rule
Use `$app->booted()` for setup that must run after ALL providers have booted. Use a provider's own `boot()` for setup specific to that provider.
---
## Reason
`booted()` guarantees all providers have completed initialization. A provider's `boot()` runs during the provider iteration — other providers may not have booted yet. `booted()` is the correct hook for cross-provider coordination.
---
## Bad Example
```php
public function boot()
{
    // This provider assumes ReportingProvider has already booted
    $this->app->make(ReportingProvider::class)->registerReports();
    // ReportingProvider may not have booted yet
}
```
---
## Good Example
```php
public function register()
{
    $this->app->booted(function ($app) {
        // All providers booted — safe to coordinate
        \App::make(ReportingProvider::class)->registerReports();
    });
}
```
---
## Exceptions
Initialization that only depends on the current provider's own services — use `boot()` directly.
---
## Consequences Of Violation
Cross-provider initialization fails because the dependent provider hasn't booted yet. Coordination code must be moved to a separate hook when discovered.
---

## Rule 3: Keep booting() Callbacks Lightweight
---
## Category
Performance
---
## Rule
Never perform heavy I/O (database queries, API calls) inside `booting()` callbacks.
---
## Reason
`booting()` callbacks run before any provider boots — this is the earliest point in the provider initialization phase. Heavy operations here delay the entire boot sequence, directly impacting time-to-first-byte for every request.
---
## Bad Example
```php
public function register()
{
    $this->app->booting(function ($app) {
        DB::table('metrics')->insert(['event' => 'booting', 'time' => now()]);
        Cache::put('booting_flag', true);
    });
}
```
---
## Good Example
```php
public function register()
{
    $this->app->booting(function ($app) {
        // Lightweight flag setting only
        $app->instance('booting.flag', true);
    });
}
```
---
## Exceptions
Octane deployments where booting callbacks fire once per worker start and the cost is amortized.
---
## Consequences Of Violation
Every request pays the cost of heavy operations before any application code runs. Increased bootstrap time and server load.
---

## Rule 4: Understand Fire-Once Semantics of booted()
---
## Category
Reliability
---
## Rule
Do not rely on a `booted()` callback to execute on every request or every test case — it fires once per application instance.
---
## Reason
Once the app is booted, `$app->booted = true`. Any new `booted()` callback registered after this point fires immediately and is removed. In Octane and repeated test runs, this means the callback fires at unexpected times or only once.
---
## Bad Example
```php
// In a test setUp()
public function setUp(): void
{
    parent::setUp();
    $this->app->booted(function () {
        // Fires immediately because app is already booted
        // May not execute in the expected test context
    });
}
```
---
## Good Example
```php
// Use middleware for per-request setup instead
class TrackRequestMiddleware
{
    public function handle($request, $next)
    {
        // Runs on every request — predictable
        return $next($request);
    }
}
```
---
## Exceptions
One-time initialization that should happen exactly once per application lifecycle (e.g., registering Octane tickers).
---
## Consequences Of Violation
Code expected to run per-request runs only once. Test assertions pass or fail depending on test order. Hard-to-reproduce bugs in Octane workers.
---

## Rule 5: Prefer Provider boot() Over Hooks for Provider-Specific Logic
---
## Category
Code Organization
---
## Rule
If initialization logic belongs to a single provider, put it in that provider's `boot()` method rather than in a global `booting()` or `booted()` callback.
---
## Reason
Global hooks are for cross-provider coordination. Provider-specific logic in hooks scatters initialization across different registration points, making it harder to discover which code runs during which phase.
---
## Bad Example
```php
class PaymentProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->booted(function ($app) {
            // PaymentProvider-specific logic in a global hook
            $this->registerPaymentRoutes();
        });
    }
}
```
---
## Good Example
```php
class PaymentProvider extends ServiceProvider
{
    public function boot()
    {
        $this->registerPaymentRoutes(); // Provider-specific logic in its own boot()
    }
}
```
---
## Exceptions
When the logic depends on ALL providers having booted, not just the current provider.
---
## Consequences Of Violation
Initialization logic scattered across hooks rather than co-located with the provider. Harder to understand what each provider does during boot.
---

## Rule 6: Do Not Modify Container Bindings in booting() Callbacks
---
## Category
Reliability
---
## Rule
Never register container bindings or modify service implementations inside `booting()` callbacks.
---
## Reason
`booting()` callbacks run before any provider boots but after all providers have registered. Bindings added here are visible to some providers but not others — those that already booted won't see them. This creates non-deterministic behavior based on provider iteration order.
---
## Bad Example
```php
public function register()
{
    $this->app->booting(function ($app) {
        $app->bind(Logger::class, DatabaseLogger::class); // May conflict with provider bindings
    });
}
```
---
## Good Example
```php
public function register()
{
    $this->app->bind(Logger::class, DatabaseLogger::class); // Register in the proper phase
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Binding conflicts between hooks and provider `register()` methods. Some providers see the hook binding, others don't. Non-deterministic behavior.
