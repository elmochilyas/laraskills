# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Module Auto-Discovery |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Feature service providers are Laravel service providers that register a single feature's components with the application. Each feature has its own provider responsible for loading that feature's routes, views, migrations, bindings, and registrations. The engineering value is modular registration: enabling/disabling a feature can be done by commenting out its provider in `config/app.php`. Feature providers also serve as a manifest of what each feature contributes to the application.

---

## Core Concepts

- **Single responsibility per provider**: Each feature provider handles only its feature's registrations
- **Provider manifest**: The provider declares what the feature adds — routes, views, migrations, bindings
- **Toggle switch**: Registering a provider in `config/app.php` turns the feature on; removing it turns it off
- **Deferred providers**: Features that only register bindings can use `$defer = true` to avoid request-time overhead
- **Boot order**: Providers boot in the order listed in `config/app.php` — dependent providers must be listed after their dependencies

---

## When To Use

- Feature-based structure where each feature has its own registrations
- Applications with 3+ features that need independent route/view/migration loading
- Teams that want feature toggling at the provider level
- Features that need to publish their own config files

## When NOT To Use

- Single feature or simple application where one provider suffices
- Features with no routes, views, or migrations (no boot logic needed)
- Applications where all registrations fit cleanly in `AppServiceProvider`

---

## Best Practices

- **Use `register()` only for container bindings** — never boot services, load routes, or interact with framework features in `register()`
- **Use relative paths** in `loadRoutesFrom(__DIR__.'/../routes.php')` so paths work when the feature directory moves
- **Defer rarely-used feature providers** using `$defer = true` to reduce boot time overhead
- **Cache routes and events** in production to minimize provider boot overhead
- **Auto-discover features** via glob in `AppServiceProvider::boot()` for non-critical features
- **Document provider responsibilities** in each feature's README

---

## Architecture Guidelines

- Provider registration: `App\Features\Billing\Providers\BillingServiceProvider::class` in `config/app.php`
- Boot method loads routes, views, migrations: `$this->loadRoutesFrom(__DIR__.'/../routes.php')`
- Register method binds interfaces: `$this->app->bind(Interface::class, Implementation::class)`
- Deferred providers implement `provides()` returning binding class names
- Feature-specific commands registered in boot if `$this->app->runningInConsole()`
- Feature config published via `$this->publishes()` with a tag

---

## Performance

Each additional service provider adds ~1-5ms to boot time. For 10 feature providers, this is ~10-50ms. Use deferred providers for features that only register bindings. Use `php artisan optimize` to cache providers in production. Route and event caching further reduce boot overhead.

---

## Security

Feature service providers do not introduce security concerns. They register routes which are subject to the same middleware, auth, and CSRF protection as any other route. No special security consideration beyond standard provider registration practices.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Too much logic in `register()` | Misunderstanding provider lifecycle | Services that depend on other providers fail | Use `boot()` for all framework interactions |
| Missing parent boot call | `parent::boot()` omitted | Custom parent provider logic skipped | Always call `parent::boot()` |
| Hardcoded paths | `app_path('Features/Billing/...')` | Path breaks when feature moves | Use `__DIR__.'/../'` relative paths |
| Missing provider registration | Feature provider not in `config/app.php` | Routes/views/migrations silently not loaded | Verify with `php artisan route:list` |
| Circular provider dependencies | Providers depend on each other's boot | Application fails to boot | Order providers explicitly or restructure |

---

## Anti-Patterns

- **Business logic in `register()`**: Database queries, API calls, or service resolution in the register phase
- **One giant provider**: A single `AppServiceProvider` with 500 lines of feature registrations
- **Hardcoded absolute paths**: `app_path('Features/Billing/routes.php')` instead of `__DIR__.'/../routes.php'`
- **Missing `parent::boot()`**: Overriding `boot()` without the parent call

---

## Examples

**Basic feature provider:**
```php
class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(InvoiceServiceInterface::class, InvoiceService::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
        $this->loadViewsFrom(__DIR__.'/../views', 'billing');
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
    }
}
```

**Auto-discovery in AppServiceProvider:**
```php
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
```

**Deferred provider:**
```php
class BillingServiceProvider extends ServiceProvider
{
    protected $defer = true;

    public function provides(): array
    {
        return [PaymentGateway::class, InvoiceServiceInterface::class];
    }

    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, fn() => new PaymentGateway(config('billing.stripe_key')));
    }
}
```

---

## Related Topics

- modular-monolith-basics — Directory structure overview
- bounded-contexts — Where the provider lives within the feature
- module-dependencies — Feature-specific config files
- inter-module-communication — Avoiding tight coupling between feature providers
- vertical-slice-architecture — Provider organization at scale

---

## AI Agent Notes

- Laravel loads service providers in order listed in `config/app.php` providers array
- `register()` is called before `boot()` — never depend on other providers in `register()`
- `boot()` is called after ALL providers' `register()` methods — safe to use other providers here
- Deferred providers only load when one of their `provides()` bindings is resolved
- Route caching serializes route registrations and skips route-loading providers on cached requests
- View and translation loading from providers happens on every request (no caching)

---

## Verification

- [ ] Each feature has at least one service provider
- [ ] `register()` contains only container bindings
- [ ] `boot()` loads routes, views, migrations via `$this->load*From()`
- [ ] All paths use `__DIR__.'/../'` relative notation
- [ ] `parent::boot()` called in all boot overrides
- [ ] Provider listed in `config/app.php` providers array
- [ ] `php artisan route:list` shows all feature routes
- [ ] `php artisan optimize` works without errors
