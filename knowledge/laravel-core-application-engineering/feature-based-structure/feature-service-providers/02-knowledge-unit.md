# Feature Service Providers

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Service Providers
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Feature service providers are Laravel service providers that register a single feature's components with the application. Each feature has its own provider responsible for loading that feature's routes, views, migrations, bindings, and registrations. This follows the single responsibility principle at the provider level.

The engineering value is modular registration: enabling/disabling a feature can be done by commenting out its provider in `config/app.php`. Feature providers also serve as a manifest of what each feature contributes to the application.

---

## Core Concepts

### Basic Feature Provider

```php
namespace App\Features\Billing\Providers;

use Illuminate\Support\ServiceProvider;

class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(InvoiceServiceInterface::class, InvoiceService::class);
        $this->app->singleton(PaymentGateway::class, fn() => new PaymentGateway(
            config('billing.stripe_key'),
        ));
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
        $this->loadViewsFrom(__DIR__.'/../views', 'billing');
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
        $this->loadTranslationsFrom(__DIR__.'/../translations', 'billing');
    }
}
```

### Registration in Application

```php
// config/app.php
'providers' => [
    // Framework providers...
    App\Providers\AppServiceProvider::class,

    // Feature providers...
    App\Features\Billing\Providers\BillingServiceProvider::class,
    App\Features\Users\Providers\UsersServiceProvider::class,
    App\Features\Analytics\Providers\AnalyticsServiceProvider::class,
],
```

---

## Mental Models

### The Feature Manifest

Each service provider is a manifest that declares "this feature adds these routes, these views, these bindings, and these migrations." To understand what a feature contributes to the application, read its service provider.

### The Toggle Switch

Registering a provider in `config/app.php` turns the feature on. Removing it turns the feature off (assuming the rest of the app doesn't depend on it). This enables feature flags at the provider level.

---

## Internal Mechanics

### Provider Boot Order

Feature providers boot after framework providers and after `AppServiceProvider`. Within the providers array, order matters — providers listed first load first. If features have dependencies on each other, ensure the dependent provider is listed after its dependency.

### Deferred Providers

For features that only register bindings (no boot logic), use the `$defer` property:

```php
class BillingServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function provides(): array
    {
        return [
            PaymentGateway::class,
            InvoiceServiceInterface::class,
        ];
    }

    public function register(): void
    {
        // bindings...
    }
}
```

Deferred providers only load when one of their bindings is requested — reducing request-time overhead.

### Automatic Discovery

Auto-discover feature providers:

```php
// AppServiceProvider
class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        foreach (glob(app_path('Features/*'), GLOB_ONLYDIR) as $featureDir) {
            $feature = basename($featureDir);
            $provider = "App\\Features\\{$feature}\\Providers\\{$feature}ServiceProvider";
            if (class_exists($provider)) {
                $this->app->register($provider);
            }
        }
    }
}
```

---

## Patterns

### Feature Config Publishing

Allow features to publish their config:

```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../config/billing.php' => config_path('billing.php'),
        ], 'billing-config');
    }
}
```

```bash
php artisan vendor:publish --tag=billing-config
```

### Feature-Specific Commands

Register Artisan commands from the feature:

```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                App\Features\Billing\Commands\GenerateInvoices::class,
                App\Features\Billing\Commands\SyncSubscriptions::class,
            ]);
        }
    }
}
```

### Feature-Specific Policies

Register authorization policies:

```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::policy(
            App\Features\Billing\Models\Invoice::class,
            App\Features\Billing\Policies\InvoicePolicy::class,
        );
    }
}
```

### Observer Registration

```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        App\Features\Billing\Models\Invoice::observe(
            App\Features\Billing\Observers\InvoiceObserver::class,
        );
    }
}
```

---

## Architectural Decisions

### Single Provider vs Multiple Providers Per Feature

| Approach | When | Example |
|---|---|---|
| Single provider | Feature < 10 registrations | `BillingServiceProvider` handles all |
| Split providers | Feature > 10 registrations | `BillingRouteProvider` + `BillingEventProvider` |
| Deferred provider | Only bindings, no boot | `BillingBindingsProvider` |

### Feature Provider vs Package Provider

| Concern | Feature Provider | Package Provider |
|---|---|---|
| Location | `app/Features/{Feature}/Providers/` | Separate package in `vendor/` |
| Distribution | Same repo | Composer installable |
| Lifecycle | Application lifecycle | Independent versioning |
| Reusability | Single app | Multiple apps |

Extract a feature to a package when it needs to be shared across applications.

---

## Tradeoffs

| Concern | Feature Providers | Single AppServiceProvider |
|---|---|---|
| Organization | Each feature self-contained | All registrations in one file |
| Discoverability | Read one provider per feature | Read one large provider |
| Overhead | 10 features = 10 providers | 1 provider |
| Toggle-ability | Remove one provider line | Comment out section of provider |
| Autoloading | Each provider loaded on boot | Single provider loaded on boot |

---

## Performance Considerations

Each additional service provider adds ~1-5ms to boot time (provider instantiation + method calls). For 10 feature providers, this is ~10-50ms. Use deferred providers for features that only register bindings to avoid this overhead on requests that don't use those features.

Use `php artisan optimize` to cache providers (and all config, routes, events) in production:

```bash
php artisan optimize
php artisan event:cache
php artisan route:cache
```

---

## Production Considerations

- Register features in dependency order in `config/app.php`
- Use auto-discovery for non-critical features to reduce manual registration
- Cache routes and events in production to minimize provider boot overhead
- Use deferred providers for heavy bindings that are rarely requested
- Document each feature's provider responsibilities in the feature's README
- Consider a `Providers/` directory within each feature, not a single file, when registrations exceed ~20 lines

---

## Common Mistakes

### Too Much Logic in `register()`

`register()` should only contain container bindings. Never boot services, load routes, or interact with framework features in `register()`. Use `boot()` for those.

### Missing Parent Call

```php
// Bad
public function boot(): void
{
    // forgot parent::boot()
    $this->loadRoutesFrom(...);
}
```

Always call `parent::boot()` when overriding (though Laravel's ServiceProvider boot is empty, custom parent providers may have logic).

### Hardcoded Paths

```php
// Bad — fragile when feature moves
$this->loadViewsFrom(app_path('Features/Billing/views'), 'billing');

// Good — relative to the provider's directory
$this->loadViewsFrom(__DIR__.'/../views', 'billing');
```

---

## Failure Modes

### Missing Provider Registration

A feature's routes and views aren't loading. The provider is not registered in `config/app.php`. Or the autodiscovery glob pattern doesn't match the feature directory name. Check `php artisan route:list` to verify.

### Circular Provider Dependencies

Feature A's boot method calls a service from Feature B, but Feature B's provider hasn't booted yet. Use the `boot()` method's deferred resolution or restructure the dependency. If providers must depend on each other, order them explicitly in `config/app.php`.

---

## Ecosystem Usage

Laravel's service provider lifecycle (`register()` then `boot()`) applies to feature providers identically. The `config/app.php` providers array supports feature provider registration alongside framework providers. Deferred providers (`$defer = true`) optimize performance for rarely-used features. Auto-discovery via `ServiceProvider::addProviderToBootstrapFile()` can automate feature registration.

---

## Related Knowledge Units

- **Feature Foundations** (this workspace) — directory structure overview
- **Module Organization** (this workspace) — where the provider lives within the feature
- **Feature Routes** (this workspace) — loading routes from the provider
- **Feature Configuration** (this workspace) — feature-specific config files
- **Cross-Feature Communication** (this workspace) — avoiding tight coupling between feature providers
- **Large Project Structure** (this workspace) — provider organization at scale

---

## Research Notes

- Laravel loads service providers in the order listed in `config/app.php` `providers` array
- The `register()` method is called before `boot()` — never depend on other providers in `register()`
- `boot()` is called after ALL providers' `register()` methods — safe to use other providers here
- Deferred providers (`$defer = true`) only load when one of their `provides()` bindings is resolved
- Route caching (`php artisan route:cache`) serializes route registrations and skips route-loading providers on cached requests
- Event caching (`php artisan event:cache`) similarly caches event registrations
- View and translation loading from providers happens on every request (no caching) — but the overhead is negligible
