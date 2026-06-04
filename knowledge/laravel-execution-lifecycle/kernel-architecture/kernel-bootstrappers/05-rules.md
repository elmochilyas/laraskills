# Kernel Bootstrappers — Rules

## Rule Name
Use config caching in production to eliminate filesystem I/O during bootstrap.
---
## Category
Performance
---
## Rule
Always run `php artisan config:cache` in production deployments. Never serve production traffic without a cached configuration.
---
## Reason
The `LoadConfiguration` bootstrapper reads 30+ files from `config/` on every request without caching. Config caching serializes all configuration into a single file, drastically reducing `LoadConfiguration` overhead from filesystem I/O to a single `require` statement.
---
## Bad Example
```bash
# Production deployment without config cache
git pull && php artisan migrate
```
---
## Good Example
```bash
git pull && php artisan config:cache && php artisan migrate
```
---
## Exceptions
During active development where config changes frequently, skip caching to avoid the `php artisan config:clear` step on every change.
---
## Consequences Of Violation
Unnecessary filesystem reads on every request (30+ files), degraded Time to First Byte (TTFB), measurable throughput reduction under load.

---

## Rule Name
Never resolve services in bootstrappers that depend on other bootstrappers yet to run.
---
## Category
Reliability
---
## Rule
Do not resolve services from the container inside a bootstrapper's `bootstrap()` method unless you have verified that the required bootstrappers have already executed according to the fixed sequence.
---
## Reason
Bootstrapper order is rigid and immutable. Resolving a service before its provider is registered (step 5) causes resolution failure. Resolving facades before `RegisterFacades` (step 4) triggers autoloader errors.
---
## Bad Example
```php
class LoadTenantConfig implements Bootstrapper
{
    public function bootstrap(Application $app): void
    {
        // ResumeBroker is bound in a service provider — not yet registered!
        $broker = $app->make(ResumeBroker::class);
    }
}
```
---
## Good Example
```php
class LoadTenantConfig implements Bootstrapper
{
    public function bootstrap(Application $app): void
    {
        $config = $app->make('config'); // Config is available after step 2
        // Only use services whose bootstrappers have already run
    }
}
```
---
## Exceptions
Custom bootstrappers appended after `BootProviders` in the bootstrapper array may safely resolve any service, as all providers are booted by that point.
---
## Consequences Of Violation
Service resolution failure at bootstrap, partial initialization state, cascading errors in downstream bootstrappers, application crash without clear error message.

---

## Rule Name
Register custom bootstrappers in the correct position relative to the six core bootstrappers.
---
## Category
Architecture
---
## Rule
When adding a custom bootstrapper, insert it at the correct position in the bootstrapper array relative to the six fixed bootstrappers. Never place a bootstrapper that depends on providers before `RegisterProviders`.
---
## Reason
Custom bootstrappers run before or after the entire core sequence cannot be interleaved between individual core steps. Misplaced bootstrappers cause dependency failures.
---
## Bad Example
```php
protected $bootstrappers = [
    LoadEnvironmentVariables::class,
    LoadConfiguration::class,
    App\Bootstrap\LoadTenantConfig::class, // Correct after config
    HandleExceptions::class,
    RegisterFacades::class,
    App\Bootstrap\MyBootstrapper::class, // Wrong — runs before providers
    RegisterProviders::class,
    BootProviders::class,
];
```
---
## Good Example
```php
protected $bootstrappers = [
    LoadEnvironmentVariables::class,
    LoadConfiguration::class,
    App\Bootstrap\LoadTenantConfig::class, // Needs config only
    HandleExceptions::class,
    RegisterFacades::class,
    RegisterProviders::class,
    BootProviders::class,
    App\Bootstrap\MyBootstrapper::class, // Correct — after all core steps
];
```
---
## Exceptions
No common exceptions. The six core bootstrappers must remain in their fixed order with custom bootstrappers positioned before or after the sequence.
---
## Consequences Of Violation
Services resolved before their providers are registered throw binding not found exceptions, framework behaves unpredictably during initialization.

---

## Rule Name
Defer service providers that only register container bindings.
---
## Category
Performance
---
## Rule
Implement `DeferrableProvider` on any service provider that only registers container bindings and does not need immediate boot. Never eagerly load providers that can be deferred.
---
## Reason
`RegisterProviders` + `BootProviders` account for 60-70% of total bootstrap time with 30+ providers. Deferred providers are only loaded when resolved, reducing bootstrap overhead proportionally to the number of deferred providers.
---
## Bad Example
```php
class AnalyticsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(MetricCollector::class, fn() => new MetricCollector());
    }
    // No boot() method needed — but provider runs every request
}
```
---
## Good Example
```php
class AnalyticsServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->singleton(MetricCollector::class, fn() => new MetricCollector());
    }

    public function provides(): array
    {
        return [MetricCollector::class];
    }
}
```
---
## Exceptions
Providers that register event listeners, middleware, route macros, or perform any side effects in `boot()` cannot be deferred. Providers that must execute on every boot (e.g., logging setup) should stay eager.
---
## Consequences Of Violation
Unnecessary bootstrap time inflation, heavier per-request overhead, slower TTFB for requests that never use the deferred services.

---

## Rule Name
Keep custom bootstrappers fast and side-effect-free beyond their single responsibility.
---
## Category
Performance
---
## Rule
Limit custom bootstrapper `bootstrap()` methods to lightweight, synchronous setup tasks. Never perform HTTP calls, database queries, or file writes inside a bootstrapper.
---
## Reason
Bootstrappers delay every request. Even a 50ms bootstrapper adds 50ms to every request's TTFB. Heavy work in bootstrappers compounds across all routes and Artisan commands.
---
## Bad Example
```php
class LoadTenantConfig implements Bootstrapper
{
    public function bootstrap(Application $app): void
    {
        $response = Http::timeout(5)->get('https://config-service.internal'); // HTTP call
        $app->make('config')->set('tenant', $response->json());
    }
}
```
---
## Good Example
```php
class LoadTenantConfig implements Bootstrapper
{
    public function bootstrap(Application $app): void
    {
        $tenantId = $_SERVER['HTTP_X_TENANT_ID'] ?? 'default';
        $fallback = config('app.default_tenant');
        $app->make('config')->set('tenant.id', $tenantId ?: $fallback);
    }
}
```
---
## Exceptions
No common exceptions. If heavy initialization is truly required before request handling, cache the result or load it during deployment rather than at bootstrap.
---
## Consequences Of Violation
Increased TTFB for every request, cascading failure when external services are unavailable at bootstrap, inability to serve cached/static responses when the bootstrapper fails.

---

## Rule Name
Do not attempt to remove or skip core bootstrappers.
---
## Category
Reliability
---
## Rule
Never remove, override, or disable any of the six core framework bootstrappers. Add custom bootstrappers alongside them; do not replace them.
---
## Reason
The six core bootstrappers provide essential framework functionality: environment loading, configuration, error handling, facades, provider registration, and provider boot. Removing any breaks fundamental framework behavior.
---
## Bad Example
```php
protected $bootstrappers = [
    LoadEnvironmentVariables::class,
    LoadConfiguration::class,
    // HandleExceptions removed — "optimization"
    RegisterFacades::class,
    RegisterProviders::class,
    BootProviders::class,
];
```
---
## Good Example
```php
protected $bootstrappers = [
    LoadEnvironmentVariables::class,
    LoadConfiguration::class,
    HandleExceptions::class,
    RegisterFacades::class,
    RegisterProviders::class,
    BootProviders::class,
    App\Bootstrap\MyCustomBootstrapper::class, // Added, not replacing
];
```
---
## Exceptions
Custom application frameworks built on Laravel components (not extending `Illuminate\Foundation\Application`) may define their own bootstrapper sequence. This is not applicable to standard Laravel applications.
---
## Consequences Of Violation
Missing error handling leads to uncaught exceptions with stack trace exposure, facades unavailable causing runtime errors, providers never registered, application crash during initialization.

---

## Rule Name
Understand that guarded bootstrapping is per-Application-instance, not global.
---
## Category
Testing
---
## Rule
When working with multiple Application instances, remember that the `hasBeenBootstrapped` flag is scoped to each Application instance. Each instance runs bootstrappers independently.
---
## Reason
The guarded bootstrap flag lives on the Application instance, not the Kernel. Multiple kernels sharing the same Application instance only bootstrap once. Multiple Application instances each run the full sequence.
---
## Bad Example
```php
// Test assumes bootstrapped state is global
$app1 = new Application();
$kernel1 = new ConsoleKernel($app1);
$kernel1->handle($input, $output);
// $app1->hasBeenBootstrapped() === true

$app2 = new Application(); // Different instance — not bootstrapped
// Code assumes $app2 is bootstrapped
$app2->make('config')->get('app.key'); // Fails — not bootstrapped
```
---
## Good Example
```php
$app1 = new Application();
$kernel1 = new ConsoleKernel($app1);
$kernel1->handle($input, $output);

$app2 = new Application();
$kernel2 = new ConsoleKernel($app2);
$kernel2->handle($input, $output); // Explicitly bootstrap $app2
$app2->make('config')->get('app.key'); // Works
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Tests that reuse Application instances accidentally skip bootstrappers, false positives due to shared state, mysterious failures when multiple kernels interact in integration tests.
