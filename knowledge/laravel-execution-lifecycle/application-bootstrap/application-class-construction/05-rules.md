# Application Class Construction — Rules

## Rule Name
Always use `Application::configure()->create()` instead of `new Application()` in Laravel 11+.
---
## Category
Framework Usage
---
## Rule
Prefer the `Application::configure(basePath: ...)->...->create()` static factory over direct `new Application(...)` constructor invocation.
---
## Reason
The factory enforces `ApplicationBuilder` usage, ensuring the proper configuration chain runs. Direct constructor invocation bypasses modern configuration APIs (`withRouting()`, `withMiddleware()`, `withExceptions()`) and reverts to the fragile pre-Laravel 11 kernel binding approach.
---
## Bad Example
```php
$app = new Illuminate\Foundation\Application(dirname(__DIR__));
$app->singleton(HttpKernel::class, App\Http\Kernel::class);
return $app;
```
---
## Good Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->withMiddleware()
    ->withExceptions()
    ->create();
```
---
## Exceptions
Custom framework distributions that subclass `Application` and need to pass constructor arguments not supported by `configure()` may use `new` directly.
---
## Consequences Of Violation
Bypasses builder configuration, tightens coupling to internal constructor behavior, and prevents framework evolution of the bootstrap layer.

---

## Rule Name
Never modify the Application constructor or add bindings in constructor subclasses.
---
## Category
Architecture
---
## Rule
Keep the Application constructor unmodified. Extend container configuration via service providers, booting callbacks, or the ApplicationBuilder — never via constructor override or inheritance.
---
## Reason
The constructor establishes an immutable baseline for framework operation. Adding constructor logic in subclasses couples custom behavior to the bootstrap phase, prevents clean reset in Octane, and creates ordering uncertainties with base service provider registration.
---
## Bad Example
```php
class CustomApplication extends Application
{
    public function __construct($basePath = null)
    {
        parent::__construct($basePath);
        $this->singleton(MyService::class, MyService::class);
    }
}
```
---
## Good Example
```php
// In a service provider or ApplicationBuilder:
->withSingletons([MyService::class => MyService::class])
```
---
## Exceptions
Framework-level extensions (Laravel Octane, Lumen) that need to modify the bootstrap sequence for runtime compatibility are a valid but rare exception.
---
## Consequences Of Violation
Bindings registered in constructor overrides survive `flush()` unexpectedly, cannot be cleared between Octane requests, and create subtle ordering bugs with base providers.

---

## Rule Name
Never call `app('config')` or any non-base binding immediately after construction.
---
## Category
Reliability
---
## Rule
Await the `LoadConfiguration` bootstrapper before accessing configuration values through the container.
---
## Reason
The constructor registers only base bindings (`'app'`, `Container`, `Psr\Container\ContainerInterface`) and ~60 aliases. No configuration is loaded — `$app->make('config')` throws `BindingResolutionException`. Accessing config before its bootstrapper runs is the most common bootstrap-order bug.
---
## Bad Example
```php
// In a service provider's register() method:
$driver = $this->app['config']['database.default'];
// BindingResolutionException — 'config' not yet bound
```
---
## Good Example
```php
// In a service provider's boot() method:
$driver = $this->app['config']['database.default'];
// Config is available because LoadConfiguration runs before BootProviders
```
---
## Exceptions
Reading `$_ENV['APP_ENV']` directly from the environment superglobal is safe and necessary before `LoadEnvironmentVariables` runs.
---
## Consequences Of Violation
`BindingResolutionException` at best; silent `null` values if a fallback masks the error. Logic silently uses defaults instead of configured values.

---

## Rule Name
Always pass an explicit `basePath` to `Application::configure()` in non-standard directory layouts.
---
## Category
Reliability
---
## Rule
Provide the explicit `basePath` argument when deploying to directory structures that differ from the standard Laravel layout.
---
## Reason
The constructor fallback (`dirname(__DIR__, 3)`) assumes `vendor/` is three levels above the `Illuminate\Foundation` source. Non-standard layouts (serverless packaging, monorepos, Phar archives) violate this assumption, causing all path helpers to resolve to incorrect directories.
---
## Bad Example
```php
// In a custom deployment where vendor is at /app/vendor:
return Application::configure()
    // No basePath — defaults to dirname(__DIR__, 3)
    // which may resolve to wrong directory
    ->withRouting(...)
    ->create();
```
---
## Good Example
```php
return Application::configure(basePath: '/var/www/app')
    ->withRouting(...)
    ->create();
```
---
## Exceptions
Standard Laravel installations with the default directory structure (`project/vendor/laravel/framework/src/Illuminate/Foundation`) do not require an explicit basePath.
---
## Consequences Of Violation
All path helpers (`basePath()`, `storagePath()`, `configPath()`, etc.) return wrong paths. File operations fail, logs write to wrong locations, and cached files are not found.

---

## Rule Name
Never call `$this->make()` inside `registerBaseBindings()` or `registerBaseServiceProviders()`.
---
## Category
Reliability
---
## Rule
Avoid container resolution inside the constructor's internal registration methods before all base bindings are established.
---
## Reason
The constructor call chain executes `registerBaseBindings()` → `registerBaseServiceProviders()` → `registerCoreContainerAliases()` sequentially. Calling `$this->make()` before this chain completes may trigger resolution of bindings that do not yet exist, causing resolution failures or incomplete provider instantiation.
---
## Bad Example
```php
// Hypothetical override of registerBaseServiceProviders:
protected function registerBaseServiceProviders()
{
    parent::registerBaseServiceProviders();
    $router = $this->make('router'); // May fail — router binding not yet fully set up
}
```
---
## Good Example
```php
// Do not resolve from container during construction.
// Use booting callbacks for post-construction setup:
$this->booting(function ($app) {
    $router = $app->make('router');
});
```
---
## Exceptions
The framework itself uses `new` (not `make()`) to instantiate base service providers intentionally, bypassing the container to avoid circular resolution.
---
## Consequences Of Violation
`BindingResolutionException` during application construction — the entire framework fails to initialize. Constructor errors are especially hard to debug because error handlers are not yet registered.
