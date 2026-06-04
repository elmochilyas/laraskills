# Phase 5: Rules — Laravel 11 vs 10 Middleware Registration

---

## Rule Name

Use the Fluent API in New Laravel 11+ Applications

---

## Category

Framework Usage

---

## Rule

New Laravel 11+ applications must register middleware via the fluent API in `bootstrap/app.php` using `->withMiddleware(function (Middleware $middleware) { ... })`. Do not create or migrate to `app/Http/Kernel.php` for new applications.

---

## Reason

The fluent API is the standard registration mechanism for Laravel 11+. It provides discoverable methods (`append`, `prepend`, `alias`, `group`, `priority`, `web`, `api`) and supports conditional registration inside the closure. Creating a Kernel.php in a new application reintroduces a deprecated pattern and misses fluent API features like group modification (`$middleware->web(append: [...])`) that are not available in the array-based approach.

---

## Bad Example

```php
// New Laravel 11 application using the old pattern
class Kernel extends HttpKernel
{
    protected $middleware = [
        \App\Http\Middleware\CustomMiddleware::class,
    ];

    protected $middlewareGroups = [
        'web' => [/* ... */],
    ];
}
```

---

## Good Example

```php
// New Laravel 11+ application using fluent API
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(\App\Http\Middleware\CustomMiddleware::class);
    $middleware->web(append: [
        \App\Http\Middleware\SetLocale::class,
    ]);
});
```

---

## Exceptions

Applications upgraded from Laravel 10 where `app/Http/Kernel.php` already exists. The upgrade guide recommends NOT migrating the application structure. The old Kernel.php continues to work alongside the new API.

---

## Consequences Of Violation

Maintenance risks: missing access to fluent API features (group modification, conditional registration). Onboarding friction: developers familiar with Laravel 11+ patterns are confused by the deprecated structure. Upgrade risks: the deprecated path may be removed in future Laravel versions.

---

---

## Rule Name

Do Not Migrate Kernel.php When Upgrading from Laravel 10 to 11

---

## Category

Maintainability

---

## Rule

When upgrading a Laravel 10 application to Laravel 11, keep the existing `app/Http/Kernel.php` file. Do not migrate its contents to `bootstrap/app.php` unless the team is prepared for a full audit of middleware behavior after migration. New middleware additions can use the fluent API alongside the existing Kernel.php.

---

## Reason

Laravel 11 maintains full backward compatibility with Kernel.php — the upgrade guide explicitly recommends against migrating the application structure. Migrating Kernel.php content to the fluent API provides no functional benefit and introduces risk: the array properties and fluent API may merge unexpectedly, and middleware that relied on the array property order or priority may behave differently in the fluent configuration.

---

## Bad Example

```php
// During Laravel 10→11 upgrade — unnecessary migration
// Old Kernel.php deleted, all middleware moved to bootstrap/app.php
// Every middleware must be verified to ensure correct behavior
```

---

## Good Example

```php
// After upgrade — Kernel.php stays, new additions use fluent API
// app/Http/Kernel.php (unchanged from Laravel 10)
class Kernel extends HttpKernel
{
    protected $middleware = [/* existing */];
    protected $middlewareGroups = [/* existing */];
}

// bootstrap/app.php — new additions only
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias('new-feature', NewFeatureMiddleware::class);
});
```

---

## Exceptions

Teams performing a comprehensive rewrite or restructuring of the middleware layer during upgrade may choose to migrate. This must be done as a separate task with dedicated testing.

---

## Consequences Of Violation

Reliability risks: merged configuration may produce unexpected middleware behavior. Testing gaps: migrated middleware may not be tested in the new configuration context. Wasted effort: migration provides no runtime benefit and consumes development time.

---

---

## Rule Name

Use HasMiddleware or #[Middleware] for Controller Middleware in Laravel 11+

---

## Category

Framework Usage

---

## Rule

In Laravel 11+, implement controller middleware via the `HasMiddleware` interface or the `#[Middleware]` PHP 8 attribute. Never use `$this->middleware()` in the controller constructor — this method was removed from the base Controller.

---

## Reason

The base controller class in Laravel 11 no longer provides the `middleware()` method. Calling `$this->middleware()` in a controller constructor causes a fatal `BadMethodCallException`. The `HasMiddleware` interface provides a static `middleware()` method that returns an array of `Middleware` objects, making middleware configuration discoverable and static rather than conditional at runtime. The `#[Middleware]` attribute provides per-method middleware configuration visible at the method signature level.

---

## Bad Example

```php
class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth', except: ['index', 'show']); // Fatal error in Laravel 11
    }
}
```

---

## Good Example

```php
class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('auth', except: ['index', 'show']),
        ];
    }
}

// Alternative: #[Middleware] attribute
class UserController extends Controller
{
    #[Middleware('auth', except: ['index', 'show'])]
    public function index(): View { /* ... */ }
}
```

---

## Exceptions

Controllers that need dynamic middleware configuration based on runtime conditions may use the `callable` middleware pattern via route definitions instead.

---

## Consequences Of Violation

Reliability risks: fatal `BadMethodCallException` on every request to the controller. Upgrade blocker: application cannot run on Laravel 11+ without fixing every controller.

---

---

## Rule Name

Use Package-Registration Methods in Service Providers for Cross-Version Compatibility

---

## Category

Maintainability

---

## Rule

Packages must register middleware aliases and groups using `$router->aliasMiddleware()` and `$router->middlewareGroup()` in the service provider's `boot()` method. Never reference `Kernel.php`, `bootstrap/app.php`, or the `Middleware` configuration object from a package.

---

## Reason

The `Router::aliasMiddleware()` and `Router::middlewareGroup()` methods work identically in Laravel 10 and 11+, providing a single compatible API. The `Middleware` configuration object is only available inside `bootstrap/app.php`'s `withMiddleware` closure and is not accessible from service providers. Packages that hardcode Kernel.php references break on Laravel 11+, and packages that attempt to access the Middleware config object fail at runtime.

---

## Bad Example

```php
class PackageServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Only works in Laravel 10—not accessible in 11+
        $this->app->make(Middleware::class)->alias('pkg', PackageMiddleware::class);
    }
}
```

---

## Good Example

```php
class PackageServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $router = $this->app['router'];
        $router->aliasMiddleware('pkg', PackageMiddleware::class);
        $router->middlewareGroup('pkg', [PackageMiddleware::class]);
    }
}
```

---

## Exceptions

No common exceptions. Package middleware registration must always use the router-based methods.

---

## Consequences Of Violation

Reliability risks: package fails to register middleware, causing missing functionality or runtime errors. Compatibility risks: package only works on one Laravel version. Maintenance burden: package must maintain separate paths for Laravel 10 and 11+.

---

---

## Rule Name

Use Group Modification Instead of Full Group Replacement

---

## Category

Maintainability

---

## Rule

In Laravel 11+, use `$middleware->web(append: [...])`, `$middleware->web(prepend: [...])`, or `$middleware->web(remove: [...])` to modify default groups. Never use `$middleware->group('web', [...])` unless you intend to replace the entire group definition.

---

## Reason

Full replacement with `$middleware->group('web', [...])` requires listing every default middleware explicitly. If a Laravel upgrade adds a new middleware to the default `web` group, replacement-based configurations will not receive it, potentially missing security updates or behavioral changes. Group modification preserves all current and future defaults while making targeted additions or removals.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->group('web', [
        \App\Http\Middleware\EncryptCookies::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
        \App\Http\Middleware\SetLocale::class,
    ]);
    // CSRF, ShareErrorsFromSession, QueuedCookies are missing
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->web(append: [
        \App\Http\Middleware\SetLocale::class,
    ]);
    // All default middleware preserved
});
```

---

## Exceptions

Full replacement is acceptable when the team explicitly decides to remove default middleware (e.g., no session or CSRF in a stateless application) and has documented which defaults were removed and why.

---

## Consequences Of Violation

Security risks: accidentally removing CSRF or other security middleware. Upgrade risks: missing new framework middleware added to default groups. Maintenance burden: each Laravel upgrade requires manual reconciliation.

---

---

## Rule Name

Rebuild Route Cache After Middleware Parameter Changes

---

## Category

Reliability

---

## Rule

After changing any middleware parameter in a route file (e.g., `throttle:60,1` to `throttle:120,1`), re-run `php artisan route:cache`. Never assume that parameter changes in route files are reflected immediately when route caching is enabled.

---

## Reason

Route caching serializes middleware parameters as part of the cached route configuration. The parameters (`:60,1`) are stored in the cache file and read from it at runtime. Changing the route file without rebuilding the cache leaves the old parameter values in effect. This is particularly dangerous for rate limits — a limit increased from `60` to `120` per minute would silently remain at `60`.

---

## Bad Example

```php
// Route file changed from throttle:60,1 to throttle:120,1
// But route:cache was NOT rebuilt
// The old limit (60/min) still applies silently
Route::post('/api/data', [DataController::class, 'store'])
    ->middleware('throttle:120,1');
```

---

## Good Example

```php
// 1. Update route file
Route::post('/api/data', [DataController::class, 'store'])
    ->middleware('throttle:120,1');

// 2. Rebuild route cache
// php artisan route:cache

// 3. Verify new limit is applied
```

---

## Exceptions

During development when route caching is not enabled, parameter changes take effect immediately. The rule applies to production and staging environments where `route:cache` is active.

---

## Consequences Of Violation

Security risks: rate limit changes do not take effect, leaving endpoints more available than intended. Reliability risks: incorrect middleware parameters cause unexpected behavior. Debugging difficulty: the discrepancy between route file and cached behavior is not obvious.

---

---

## Rule Name

Use Conditional Registration Inside withMiddleware for Environment-Specific Middleware

---

## Category

Maintainability

---

## Rule

Use PHP conditionals inside the `withMiddleware` closure for environment-specific middleware registration. Do not create separate bootstrap files or service providers for environment-specific middleware.

---

## Reason

The fluent API supports conditionals because it is a closure, not a property array. This allows middleware registration to be scoped to specific environments without duplicating configuration across files. Using conditionals inside the single `withMiddleware` closure keeps all middleware registration visible in one location and prevents configuration drift between environments.

---

## Bad Example

```php
// Environment-specific middleware hidden in a service provider
class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if (app()->environment('production')) {
            $router = $this->app['router'];
            $router->aliasMiddleware('enforce-https', EnforceHttps::class);
        }
    }
}
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    if (app()->environment('production')) {
        $middleware->append(EnforceHttps::class);
    }

    if (app()->environment('local')) {
        $middleware->append(DebugBarMiddleware::class);
    }
});
```

---

## Exceptions

Packages must never use conditional registration inside `withMiddleware` since packages do not control `bootstrap/app.php`. Packages should use service provider methods for all registrations.

---

## Consequences Of Violation

Maintenance risks: middleware registration is scattered across files, making it hard to determine which middleware runs in which environment. Configuration drift: different environments may diverge in subtle ways.
