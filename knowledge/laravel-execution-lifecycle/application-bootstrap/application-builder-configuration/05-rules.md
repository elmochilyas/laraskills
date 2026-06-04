# Application Builder Configuration — Rules

## Rule Name
Always terminate the builder chain with `->create()`.
---
## Category
Framework Usage
---
## Rule
Always call `->create()` as the final method in every `ApplicationBuilder` chain.
---
## Reason
`->create()` returns the configured `Application` instance. Omitting it returns the builder itself, which is not type-compatible with the `Application` expected by the kernel entry points (`index.php`, `artisan`, Octane).
---
## Bad Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->withMiddleware();
    // Missing ->create() — returns ApplicationBuilder, not Application
```
---
## Good Example
```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php')
    ->withMiddleware()
    ->create();
```
---
## Exceptions
No common exceptions. Every builder chain requires termination.
---
## Consequences Of Violation
Runtime type error when the kernel calls `$app->make(...)` on the builder instead of the Application. Crashes all entry points.

---

## Rule Name
Never capture request-scoped variables in builder closures.
---
## Category
Reliability
---
## Rule
Avoid capturing `$request`, user data, or any request-scoped state inside closures passed to `with*()`, `booting()`, or `booted()`.
---
## Reason
Builder closures execute during application construction and persist across requests in Octane. Capturing request-scoped variables creates memory leaks and cross-request data contamination.
---
## Bad Example
```php
->booting(function ($app) use ($request) {
    $app->instance('request.logger', new RequestLogger($request));
});
```
---
## Good Example
```php
->booting(function ($app) {
    $app->singleton(RequestLogger::class, function () {
        return new RequestLogger();
    });
});
```
---
## Exceptions
Closures that capture compile-time constants or configuration values (scalars, arrays of class names) are safe because they do not vary per request.
---
## Consequences Of Violation
Memory leaks in Octane workers — the captured `$request` object and its dependencies are retained indefinitely. Sensitive data from one request may be accessible to subsequent requests.

---

## Rule Name
Prefer `Application::configure()` over manual kernel binding overwrites.
---
## Category
Architecture
---
## Rule
Always use `Application::configure()->withRouting()|withMiddleware()|withExceptions()` in Laravel 11+ instead of manually binding `HttpKernel`, `ConsoleKernel`, or exception handler contracts in `bootstrap/app.php`.
---
## Reason
The builder API is the documented, future-proof configuration surface. Manual kernel binding overwrites are fragile, undocumented in Laravel 11+, and break when framework internals change.
---
## Bad Example
```php
$app = new Application(dirname(__DIR__));
$app->singleton(HttpKernel::class, App\Http\Kernel::class);
$app->singleton(ConsoleKernel::class, App\Console\Kernel::class);
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
Custom framework extensions that subclass or replace the Kernel entirely may still need direct binding, but must first verify no builder equivalent exists.
---
## Consequences Of Violation
Bootstrap configuration becomes tightly coupled to framework internals. Upgrading Laravel versions may silently break kernel binding logic.

---

## Rule Name
Never place business logic inside builder closures.
---
## Category
Code Organization
---
## Rule
Keep builder closures in `bootstrap/app.php` limited to configuration declarations. Do not include validation, API calls, file I/O, or heavy computation.
---
## Reason
The builder runs on every request in FPM and once per worker in Octane. Business logic in builder closures increases bootstrap latency, cannot be cached, and captures scope that persists across requests.
---
## Bad Example
```php
->booting(function ($app) {
    $response = Http::post('https://internal-api/config', []);
    $app->instance('dynamic.config', $response->json());
});
```
---
## Good Example
```php
->booting(function ($app) {
    $app->singleton(DynamicConfigService::class, fn () => new DynamicConfigService);
});
```
---
## Exceptions
Lightweight conditional configuration (`if ($app->runningInConsole()) { ... }`) is acceptable because it does not perform I/O or mutate external state.
---
## Consequences Of Violation
Increased bootstrap time, network or I/O failures during startup, and memory leaks from closure-scoped resources in Octane.

---

## Rule Name
Call `withRouting()` before `withMiddleware()` when middleware depends on route configuration.
---
## Category
Framework Usage
---
## Rule
Order builder method calls so that `withRouting()` precedes `withMiddleware()` when the middleware configuration references route groups or named routes.
---
## Reason
The builder does not enforce method ordering — deferred callbacks execute in registration order. If middleware config references route state that has not been configured yet, the middleware configuration may silently fail to apply.
---
## Bad Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(append: ['throttle:api']);
})
->withRouting(api: __DIR__.'/routes/api.php', ...);
```
---
## Good Example
```php
->withRouting(api: __DIR__.'/routes/api.php', ...)
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(append: ['throttle:api']);
});
```
---
## Exceptions
When no middleware configuration references routes, ordering between these methods is irrelevant.
---
## Consequences Of Violation
Middleware groups silently not applied to the expected routes. Difficult to debug because the builder does not emit warnings about registration order.

---

## Rule Name
Do not register the same binding in both `withSingletons()` and a service provider.
---
## Category
Reliability
---
## Rule
Register each container binding in exactly one location — either the builder or a service provider, never both.
---
## Reason
Duplicate registration creates a race condition where the last registration wins. The outcome depends on execution order (builder callbacks vs provider `register()`), which may differ between FPM and Octane, and across Laravel versions.
---
## Bad Example
```php
// In bootstrap/app.php:
->withSingletons([
    PaymentGateway::class => StripeGateway::class,
])

// In AppServiceProvider::register():
$this->app->singleton(PaymentGateway::class, PaddleGateway::class);
```
---
## Good Example
```php
// In bootstrap/app.php:
->withSingletons([
    PaymentGateway::class => StripeGateway::class,
])

// In AppServiceProvider::register():
// No duplicate — registration lives in one place only.
```
---
## Exceptions
Overriding a package-provided binding in the builder (where the package registers via a service provider) is intentional and acceptable, but must be documented in the builder chain.
---
## Consequences Of Violation
Unpredictable resolution — the active concrete may differ between requests or environments. Debugging requires tracing execution order across two registration paths.

---

## Rule Name
Use `withSingletons()` exclusively for bindings that need cross-request persistence; prefer service providers for complex registration logic.
---
## Category
Code Organization
---
## Rule
Keep `withSingletons()` entries limited to simple class-to-class or class-to-concrete mappings. Register bindings that require setup logic, configuration reading, or dependency injection in service providers.
---
## Reason
Builder closures in `withSingletons()` accept only class strings or factory closures. Complex logic inside factory closures is harder to test, cannot be deferred, and increases bootstrap file complexity.
---
## Bad Example
```php
->withSingletons([
    CacheManager::class => function ($app) {
        $driver = $app['config']['cache.default'];
        $prefix = $app['config']['cache.prefix'];
        // 20 more lines of setup logic...
        return new CustomCacheManager($driver, $prefix, ...);
    },
])
```
---
## Good Example
```php
// bootstrap/app.php:
->withSingletons([
    CacheManager::class => App\Services\CacheManager::class,
])

// AppServiceProvider::register():
$this->app->extend(CacheManager::class, function ($manager, $app) {
    return $manager->configureFrom($app['config']['cache']);
});
```
---
## Exceptions
Small factory closures that trivially instantiate a class (2-3 lines, no I/O) are acceptable in `withSingletons()`.
---
## Consequences Of Violation
`bootstrap/app.php` grows beyond its configuration-only scope. Bindings with setup logic become untestable in isolation and harder to override per environment.
