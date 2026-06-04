# Boot Phase Order Rules

## Rule 1: Separate Binding Registration from Initialization
---
## Category
Framework Usage
---
## Rule
Always place container bindings in `register()` and application initialization (routes, events, views) in `boot()`.
---
## Reason
The two-phase guarantee — all providers complete `register()` before any provider's `boot()` starts — ensures that bindings from every provider are available during boot. Placing bindings in `boot()` makes them invisible to deferred providers and breaks the phase contract.
---
## Bad Example
```php
public function boot()
{
    $this->app->singleton(PaymentGateway::class, function ($app) {
        return new StripeGateway($app['config']['services.stripe.secret']);
    });
    Event::listen(OrderPlaced::class, SendOrderConfirmation::class);
}
```
---
## Good Example
```php
public function register()
{
    $this->app->singleton(PaymentGateway::class, function ($app) {
        return new StripeGateway($app['config']['services.stripe.secret']);
    });
}

public function boot()
{
    Event::listen(OrderPlaced::class, SendOrderConfirmation::class);
}
```
---
## Exceptions
Providers registered after the app is already booted call `register()` then immediately `boot()` — this is handled by the framework, not user code.
---
## Consequences Of Violation
Deferred providers cannot access bindings registered in `boot()`. Bindings registered in `boot()` after deferred resolution cause unpredictable behavior.
---

## Rule 2: Avoid Heavy I/O in Boot
---
## Category
Performance
---
## Rule
Never perform heavy I/O (database queries, API calls, file operations) directly in service provider `boot()` methods.
---
## Reason
`boot()` runs on every request for eager providers. Heavy operations add 5-50ms to every request's bootstrap time, directly impacting time-to-first-byte.
---
## Bad Example
```php
public function boot()
{
    $this->app->make(ReportService::class)->generateDailyDigest();
    Cache::put('boot_timestamp', now());
    Log::info('Provider booted', ['memory' => memory_get_usage()]);
}
```
---
## Good Example
```php
public function boot()
{
    Route::middleware('web')->group(base_path('routes/web.php'));
    Event::listen(UserRegistered::class, SendWelcomeEmail::class);
}
```
---
## Exceptions
Lightweight cache reads for configuration or feature flags that guard conditional registration.
---
## Consequences Of Violation
Increased bootstrap time on every request. Slower response times, higher server costs, degraded user experience under load.
---

## Rule 3: Do Not Call boot() Manually
---
## Category
Framework Usage
---
## Rule
Never call `$app->boot()` or `app()->boot()` in application code.
---
## Reason
The framework manages the boot phase automatically. Manual calls may trigger double booting (guarded by `$app->booted`) or force boot before all providers are registered, causing `BindingResolutionException`.
---
## Bad Example
```php
public function register()
{
    $this->app->boot(); // Forces early boot of all providers
    $this->app->singleton(Service::class, fn() => new Service());
}
```
---
## Good Example
```php
public function register()
{
    $this->app->singleton(Service::class, fn() => new Service());
}
```
---
## Exceptions
Framework internals or testing utilities that explicitly need to observe boot behavior.
---
## Consequences Of Violation
Double booting resets state, or providers boot before all bindings are registered, causing resolution failures.
---

## Rule 4: Document Boot Dependencies Between Providers
---
## Category
Maintainability
---
## Rule
Document when a provider's `boot()` depends on services from another specific provider.
---
## Reason
Providers boot in registration order. Future reordering of the `config/app.php` providers array can silently break initialization without clear documentation.
---
## Bad Example
```php
// config/app.php — no comments about dependencies
'providers' => [
    App\Providers\PaymentServiceProvider::class,
    App\Providers\AnalyticsServiceProvider::class,
],
```
---
## Good Example
```php
// config/app.php — documented dependency
'providers' => [
    App\Providers\PaymentServiceProvider::class,
    // AnalyticsServiceProvider depends on PaymentServiceProvider's bindings in boot()
    App\Providers\AnalyticsServiceProvider::class,
],
```
---
## Exceptions
Providers with no cross-provider dependencies.
---
## Consequences Of Violation
Silent breakage when providers are reordered. Debugging time wasted on "service not found" errors that are actually ordering issues.
---

## Rule 5: Keep Boot Focused on Initialization Only
---
## Category
Code Organization
---
## Rule
Limit each provider's `boot()` method to initialization logic: registering routes, event listeners, view composers, and gates.
---
## Reason
A `boot()` method that mixes bindings, business logic, and initialization violates the single-responsibility principle and makes the bootstrap sequence hard to trace and debug.
---
## Bad Example
```php
public function boot()
{
    $this->app->bind(Service::class, Concrete::class); // Should be in register()
    Log::info('Boot started');                         // Noise
    $this->loadViewsFrom(__DIR__.'/views', 'package');  // OK
    $report = $this->app->make(ReportService::class);   // OK but misplaced
    $report->runStartupChecks();                        // Business logic in boot
}
```
---
## Good Example
```php
public function register()
{
    $this->app->bind(Service::class, Concrete::class);
}

public function boot()
{
    $this->loadViewsFrom(__DIR__.'/views', 'package');
    $this->loadRoutesFrom(__DIR__.'/routes.php');
}
```
---
## Exceptions
Providers that register commands or schedule tasks may call `Artisan::command()` or `$schedule->command()` in `boot()`.
---
## Consequences Of Violation
Hard-to-debug bootstrap issues. Providers become God objects that violate separation of concerns.
---

## Rule 6: Always Call parent::boot() When Extending Providers
---
## Category
Reliability
---
## Rule
Always call `parent::boot()` when extending a service provider that has boot logic.
---
## Reason
The parent provider's `boot()` method may register routes, views, or listeners that are essential for correct operation. Skipping the parent call silently omits this initialization.
---
## Bad Example
```php
class CustomEventProvider extends EventServiceProvider
{
    public function boot()
    {
        Event::listen(CustomEvent::class, CustomListener::class);
        // parent::boot() not called — parent's listeners never register
    }
}
```
---
## Good Example
```php
class CustomEventProvider extends EventServiceProvider
{
    public function boot()
    {
        parent::boot();
        Event::listen(CustomEvent::class, CustomListener::class);
    }
}
```
---
## Exceptions
When deliberately replacing a provider's entire boot behavior and accepting that parent initialization is skipped.
---
## Consequences Of Violation
Parent listeners, routes, or views silently missing. Hard-to-diagnose feature gaps in extending providers.
---

## Rule 7: Prefer Deferred Providers for Pure Binding Providers
---
## Category
Performance
---
## Rule
Use `DeferrableProvider` for providers that only register bindings and have no `boot()` logic.
---
## Reason
Deferred providers skip both `register()` and `boot()` unless one of their services is actually resolved, eliminating per-request overhead for unused services.
---
## Bad Example
```php
class ReportingServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->singleton(ReportGenerator::class, fn() => new ReportGenerator());
    }
    // No boot() — still runs register() on every request
}
```
---
## Good Example
```php
class ReportingServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register()
    {
        $this->app->singleton(ReportGenerator::class, fn() => new ReportGenerator());
    }

    public function provides()
    {
        return [ReportGenerator::class];
    }
}
```
---
## Exceptions
Providers that register routes, event listeners, view composers, gates, or commands must be eager — deferral would delay their registration until first service resolution.
---
## Consequences Of Violation
Every request pays `register()` overhead for services that may never be used. Unnecessary bootstrap time in requests that don't need the provider's services.
