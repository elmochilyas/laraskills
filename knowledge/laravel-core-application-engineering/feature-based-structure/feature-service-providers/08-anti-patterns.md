# Anti-Patterns: Module Auto-Discovery

## 1. Business Logic in register()

Putting database queries, API calls, or service resolution in the provider's `register()` method.

```php
public function register(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes.php');
    // route/framework features may not be ready
}
```

During `register()`, not all providers have been registered. Dependencies on other providers' bindings may not exist yet. `register()` must only contain service container bindings. All framework interactions — loading routes, views, migrations — must go in `boot()`.

## 2. One Giant AppServiceProvider

A single `AppServiceProvider` with 500+ lines registering routes, views, and migrations for every feature.

A 500+ line provider file is hard to navigate and maintain. Feature extraction requires carefully separating registrations. Each feature must have its own service provider. The `AppServiceProvider` should only register application-wide concerns. Feature-specific routes, views, migrations, and bindings must be registered in the feature's own provider.

## 3. Hardcoded Absolute Paths

Using `app_path('Features/Billing/routes.php')` instead of `__DIR__.'/../routes.php'` in provider methods.

Hardcoded absolute paths break when the feature directory is moved, renamed, or extracted into a package. Always use `__DIR__` relative paths: `$this->loadRoutesFrom(__DIR__.'/../routes.php')`. Relative paths work regardless of where the feature directory lives.

## 4. Missing parent::boot() Call

Overriding `boot()` without calling `parent::boot()`, silently skipping shared boot logic.

If the application defines a base service provider with shared boot logic (e.g., rate limiting, event discovery), omitting `parent::boot()` silently skips that logic. Always call `parent::boot()` as the first line when overriding `boot()` in a feature service provider.

## 5. No Deferred Providers for Rarely-Used Features

A reporting feature provider that only registers container bindings is loaded on every request, even though the reporting feature is used in <10% of requests.

Deferred providers are not loaded on every request. They are only instantiated when one of their registered bindings is resolved. Set `protected $defer = true` on feature providers that only register container bindings and have no boot logic. This reduces boot time overhead by ~1-5ms per deferred provider.

## 6. Provider Ordering Ignored

Listing providers in `config/app.php` in arbitrary order, causing config values to return `null` during boot.

Laravel boots providers in the order they are listed. If Provider B's `boot()` calls `config('feature-a.setting')`, Feature A's config must be merged first. List feature providers in `config/app.php` in dependency order — providers that are depended upon must appear first.

## 7. Feature Provider Not Registered

Creating a feature's service provider but forgetting to add it to the `config/app.php` providers array.

The feature's routes, views, and migrations silently fail to load. No error is thrown — routes just return 404. Always verify registration with `php artisan route:list` after creating a new feature provider. Register the provider in `config/app.php` before considering the feature complete.
