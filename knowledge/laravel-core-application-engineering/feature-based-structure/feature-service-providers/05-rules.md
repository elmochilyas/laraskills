## Keep `register()` For Container Bindings Only

The `register()` method must only contain service container bindings. Never boot services, load routes, or interact with framework features there.

---

## Category

Framework Usage

---

## Rule

Limit the `register()` method in feature service providers to `$this->app->bind()`, `$this->app->singleton()`, and `$this->app->tag()` calls. All framework interactions — loading routes, views, migrations, events — must go in `boot()`.

---

## Reason

During `register()`, not all providers have been registered. Dependencies on other providers' bindings may not exist yet. `boot()` runs after all providers' `register()` methods, making it safe to interact with the full framework. Violating this causes hard-to-debug null reference errors.

---

## Bad Example

```php
public function register(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes.php');
    // route/framework features may not be ready
}
```

---

## Good Example

```php
public function register(): void
{
    $this->app->bind(InvoiceServiceInterface::class, InvoiceService::class);
}

public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes.php');
    $this->loadViewsFrom(__DIR__.'/../views', 'billing');
}
```

---

## Exceptions

Deferred providers only have a `register()` method (they never boot). In deferred providers, container bindings are the sole purpose.

---

## Consequences Of Violation

Null reference errors when depending on unregistered providers. Intermittent failures based on provider ordering. Framework features not available.

---

## Use Relative Paths In Provider Methods

All `loadRoutesFrom()`, `loadViewsFrom()`, `loadMigrationsFrom()` calls must use `__DIR__` relative paths.

---

## Category

Maintainability

---

## Rule

Use `$this->loadRoutesFrom(__DIR__.'/../routes.php')` instead of absolute paths or `app_path()` based paths. Never hardcode the feature directory name in the path.

---

## Reason

Relative paths based on `__DIR__` work regardless of where the feature directory lives. If the feature is moved, renamed, or extracted into a package, the relative reference still resolves correctly. Hardcoded paths break on restructuring.

---

## Bad Example

```php
public function boot(): void
{
    $this->loadRoutesFrom(app_path('Features/Billing/routes.php'));
    // Breaks if Billing is moved or renamed
}
```

---

## Good Example

```php
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes.php');
    // Survives directory restructuring
}
```

---

## Exceptions

No exceptions. Always use `__DIR__` relative paths.

---

## Consequences Of Violation

Routes, views, and migrations silently stop loading when the feature directory is moved. Extraction to a package requires changing all paths.

---

## Defer Rarely-Used Feature Providers

Feature providers that only register container bindings should use deferred loading.

---

## Category

Performance

---

## Rule

Set `protected $defer = true` on feature providers that only register service container bindings and have no boot logic. Implement the `provides()` method returning the binding abstract names.

---

## Reason

Deferred providers are not loaded on every request. They are only instantiated when one of their registered bindings is resolved. For features that are used infrequently, this reduces boot time overhead by ~1-5ms per deferred provider.

---

## Bad Example

```php
class ReportingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ReportGenerator::class, ReportGenerator::class);
    }
    // Loaded on every request even if ReportGenerator is rarely used
}
```

---

## Good Example

```php
class ReportingServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function provides(): array
    {
        return [ReportGenerator::class];
    }

    public function register(): void
    {
        $this->app->singleton(ReportGenerator::class, ReportGenerator::class);
    }
}
```

---

## Exceptions

Features that load routes, views, or migrations cannot be deferred. Deferred providers do not call `boot()`, so any framework registration must happen in `register()`.

---

## Consequences Of Violation

Unnecessary boot time overhead for rarely-used features. With 10+ feature providers, 10-50ms of per-request overhead from providers that are never used.

---

## Never Put Business Logic In Service Providers

Service providers must only register components. Business logic, database queries, API calls, and service instantiation must not appear in provider methods.

---

## Category

Code Organization

---

## Rule

Service providers must not contain database queries, API calls, calculations, or any logic that executes business rules. Providers register and wire. Business logic lives in service classes, actions, or jobs.

---

## Reason

Service providers run on every request (or boot). Business logic in providers couples registration to execution, makes testing impossible in isolation, and causes side effects during framework boot.

---

## Bad Example

```php
public function boot(): void
{
    $config = Setting::all()->pluck('value', 'key')->toArray();
    config(['app.dynamic' => $config]);
    // Database query during provider boot — runs on every request
}
```

---

## Good Example

```php
public function boot(): void
{
    $this->app->singleton(DynamicConfigService::class, function () {
        return new DynamicConfigService();
    });
    // Business logic in the service, not the provider
}
```

---

## Exceptions

Config validation that checks required env vars or throws on misconfiguration is acceptable in `boot()`, as it prevents the app from running with invalid configuration.

---

## Consequences Of Violation

Database queries on every boot. Side effects during testing. Provider logic cannot be unit tested. Performance degradation from unnecessary operations.

---

## Do Not Create One Giant Application Provider

Feature providers must each handle one feature. Do not accumulate all feature registrations in a single `AppServiceProvider`.

---

## Category

Code Organization

---

## Rule

Each feature must have its own service provider. The `AppServiceProvider` should only register application-wide concerns. Feature-specific routes, views, migrations, and bindings must be registered in the feature's own provider.

---

## Reason

A single `AppServiceProvider` with 500+ lines becomes unmaintainable. Feature extraction requires untangling feature-specific logic from global registrations. Per-feature providers keep each feature self-contained and enable toggling features by adding/removing providers.

---

## Bad Example

```php
// AppServiceProvider with 500 lines
public function boot(): void
{
    // Billing routes
    $this->loadRoutesFrom(base_path('app/Features/Billing/routes.php'));
    // Users routes
    $this->loadRoutesFrom(base_path('app/Features/Users/routes.php'));
    // CMS routes
    $this->loadRoutesFrom(base_path('app/Features/CMS/routes.php'));
    // ... 15 more features' registrations
}
```

---

## Good Example

```php
// AppServiceProvider — only app-wide concerns
public function boot(): void
{
    RateLimiter::for('api', fn () => Limit::perMinute(60));
}

// BillingServiceProvider — only Billing
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__.'/../routes.php');
}
```

---

## Exceptions

Very small projects (2-3 features, each <5 files) may reasonably use a single provider. Move to per-feature providers as features grow.

---

## Consequences Of Violation

500+ line provider file that is hard to navigate and maintain. Feature extraction requires carefully separating registrations. Enabling/disabling features requires editing the giant provider.

---

## Always Call `parent::boot()` In Provider Overrides

Every feature provider that defines a `boot()` method must call `parent::boot()`.

---

## Category

Reliability

---

## Rule

When overriding `boot()` in a feature service provider, always call `parent::boot()` as the first line. Never omit the parent call.

---

## Reason

If the application defines a base service provider with shared boot logic (e.g., rate limiting, event discovery), omitting `parent::boot()` silently skips that logic. The parent call ensures the inheritance chain is preserved.

---

## Bad Example

```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
        // parent::boot() not called
        // Any logic in AppServiceProvider::boot() is skipped
    }
}
```

---

## Good Example

```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        parent::boot();
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
    }
}
```

---

## Exceptions

Providers that extend `ServiceProvider` directly (not a custom base provider) and have no custom parent boot logic may omit the call. However, always calling it as a defensive practice is recommended.

---

## Consequences Of Violation

Parent boot logic silently skipped. Shared configuration or registrations in the base provider are not applied. Inconsistent behavior across features.

---

## Order Providers Explicitly For Dependencies

List feature providers in `config/app.php` in dependency order — providers that are depended upon must appear first.

---

## Category

Reliability

---

## Rule

When one feature provider's boot logic depends on another feature's registrations, ensure the dependency's provider is listed before the dependent provider in the `providers` array of `config/app.php`.

---

## Reason

Laravel boots providers in the order they are listed. If Provider B's `boot()` calls `config('feature-a.setting')`, Feature A's config must be merged first. Wrong ordering causes null config values.

---

## Bad Example

```php
'providers' => [
    App\Features\Reporting\Providers\ReportingServiceProvider::class,
    App\Features\Billing\Providers\BillingServiceProvider::class,
    // Reporting depends on Billing, but Billing is listed second
],
```

---

## Good Example

```php
'providers' => [
    App\Features\Billing\Providers\BillingServiceProvider::class,
    App\Features\Reporting\Providers\ReportingServiceProvider::class,
    // Dependencies first
],
```

---

## Exceptions

Providers with no boot-time dependencies may be listed in any order. Alphabetical order is recommended for unrelated providers.

---

## Consequences Of Violation

Config values return `null` during boot. Service bindings not yet available. Intermittent failures that depend on provider ordering.

---

## Cache Routes And Events In Production

Route and event caching minimizes provider boot overhead from feature registrations.

---

## Category

Performance

---

## Rule

Run `php artisan route:cache` and `php artisan event:cache` in production deployment. These commands serialize route and event registrations, eliminating per-request provider boot overhead for route and event loading.

---

## Reason

Feature providers that load routes via `loadRoutesFrom()` require the route file to be included on every boot. Route caching serializes all routes into a single file. Event caching does the same for event listeners. Both reduce boot time.

---

## Bad Example

Production deployment runs `php artisan optimize` but not `route:cache` or `event:cache`. Feature route files are still loaded on every request.

---

## Good Example

```bash
php artisan route:cache
php artisan event:cache
```

---

## Exceptions

Local development should not cache routes or events, as changes require cache clearing. Development relies on dynamic discovery.

---

## Consequences Of Violation

Per-request overhead from loading route files. Event discovery runs on every boot. Performance degradation proportional to feature count.

---

## Document Provider Responsibilities In Feature README

Each feature's provider should have its bindings and registrations documented in the feature README.

---

## Category

Maintainability

---

## Rule

In each feature's README, document what its service provider registers: which routes it loads, which views it namespaces, which interfaces it binds, and any deferred bindings.

---

## Reason

The service provider is the feature's manifest. Documenting its responsibilities provides a quick reference for what the feature contributes without reading the provider source. This is especially important for AI agents and new team members.

---

## Bad Example

Feature README does not mention the service provider. Developers must read the provider file to understand what the feature registers.

---

## Good Example

```
## Service Provider

- Loads `routes.php` with prefix `/billing` and name `billing.*`
- Namespaces views as `billing::` (app/Features/Billing/views/)
- Loads migrations from Database/Migrations/
- Binds `UserProfileProvider` → `UserProfileService`
- Deferred: no
```

---

## Exceptions

Trivial features with a single documentation line in the README may omit a separate provider section.

---

## Consequences Of Violation

Developers waste time reading provider source to understand feature registration. AI agents generate incorrect registration code. Feature extraction requires reverse-engineering the provider.
