# Skill: Create and Register a Service Provider

## Purpose

Create a new Laravel service provider, implement the two-phase register-boot model correctly, and register it in the application bootstrap configuration.

## When To Use

- Registering a new set of container bindings for an application service.
- Bootstrapping a new domain capability (payments, notifications, inventory).
- Extracting registrations from an overgrown `AppServiceProvider`.
- Creating a package provider for distribution.

## When NOT To Use

- Single, trivial bindings that could use `$bindings`/`$singletons` shortcuts only.
- Bootstrapping that belongs in route files, event service providers, or middleware.

## Prerequisites

- Understanding of the service container (`bind`, `singleton`, `make`)
- Composer autoloading configuration

## Inputs

- Provider class name and namespace
- List of service bindings to register
- Boot-time registrations (routes, views, events, directives)

## Workflow

1. Create the provider class extending `Illuminate\Support\ServiceProvider`:
   ```php
   namespace App\Providers;
   use Illuminate\Support\ServiceProvider;

   class PaymentServiceProvider extends ServiceProvider
   {
       public function register(): void
       {
           // Container bindings only
           $this->app->bind(PaymentGateway::class, StripeGateway::class);
       }

       public function boot(): void
       {
           // Post-registration initialization
           $this->loadRoutesFrom(__DIR__.'/../../routes/payments.php');
       }
   }
   ```
2. Place the provider in `app/Providers/` (or `app/Providers/{Domain}/`).
3. Register the provider in `bootstrap/providers.php`:
   ```php
   return [
       App\Providers\AppServiceProvider::class,
       App\Providers\PaymentServiceProvider::class,
   ];
   ```
4. Verify the provider registers: run `php artisan about --json` and find it in the providers list.
5. Test the bindings are available: `app(PaymentGateway::class)` resolves correctly.

## Validation Checklist

- [ ] Provider extends `Illuminate\Support\ServiceProvider`
- [ ] `register()` contains only container bindings and config merges (no resolution)
- [ ] `boot()` contains only post-registration initialization (routes, views, event listeners)
- [ ] Provider registered in `bootstrap/providers.php`
- [ ] Bindings resolvable from container after registration
- [ ] Provider appears in `php artisan about --json` output

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Provider not loading | Not listed in `bootstrap/providers.php` |
| "Target class does not exist" | `$this->app->make()` called in `register()` — use `boot()` |
| Routes return 404 | Routes registered in `register()` instead of `boot()` |
| Provider listed twice | Also auto-discovered from package — check `bootstrap/cache/packages.php` |

## Decision Points

- **Register vs Boot**: Any container binding → `register()`. Any code that depends on other services → `boot()`.
- **One Provider vs Split**: Related bindings → one provider. Different domains → separate providers.

## Performance Considerations

- Each eager provider adds ~0.1-0.5ms bootstrap time.
- Keep `register()` and `boot()` lightweight — they run on every request for eager providers.
- Consider `DeferrableProvider` if services are rarely used.

## Security Considerations

- Provider has full container access during boot — ensure security-sensitive registrations are appropriate.
- Environment-specific logic must not expose development tooling in production.
- `register()` runs during config caching — avoid request-dependent side effects.

## Related Rules

- Rule 1: Keep `register()` Pure — Bindings Only, Never Resolve from Container
- Rule 2: Order Providers Deliberately in `bootstrap/providers.php`
- Rule 3: Use `$app->booted()` for Logic Requiring All Providers to Boot
- Rule 4: Prefer Deferred Providers for Rarely-Used Services
- Rule 5: Never Override the Provider Constructor Without Calling `parent::register()`

## Related Skills

- Implement a Deferred Provider
- Distinguish register() from boot() Responsibilities
- Organize Providers by Domain Bounded Context

## Success Criteria

- Provider correctly registers all bindings — verified via `$app->bound()` tests.
- Boot-time artifacts (routes, views, events) are available after boot.
- Provider appears in the expected position in the provider registration order.
---

# Skill: Debug Provider Registration Failures

## Purpose

Diagnose and resolve common service provider registration failures where bindings are missing, services fail to resolve, or providers don't load as expected.

## When To Use

- Services return "Target class does not exist" errors.
- `php artisan about` does not show an expected provider.
- Provider registration order issues cause intermittent failures.
- Config caching produces errors related to provider registration.

## When NOT To Use

- Service resolution failures unrelated to provider registration (typos in class names, missing imports).
- Runtime binding resolution issues caused by container configuration.

## Prerequisites

- `bootstrap/providers.php` structure
- Service container basics (`bind`, `singleton`, `bound`, `make`)
- Artisan CLI access

## Inputs

- Error message from failed service resolution
- Provider class code
- `bootstrap/providers.php` contents
- `bootstrap/cache/packages.php` contents

## Workflow

1. Check if the provider is registered: `php artisan about --json` and look for the provider class.
2. If provider not listed:
   - Check `bootstrap/providers.php` for manual registration.
   - Check `bootstrap/cache/packages.php` for auto-discovery.
   - Verify package is installed: `composer show vendor/package`.
3. If provider is listed but service doesn't resolve:
   - Check if provider is deferred: does it implement `DeferrableProvider`? Verify `provides()` includes the service.
   - Check if `register()` contains `$this->app->make()` causing premature resolution.
   - Check if binding uses correct container method (`bind` vs `singleton` vs `instance`).
4. If ordering issue: confirm the provider that registers the dependency comes before the provider that depends on it.
5. If config cache issue: run `php artisan config:cache` and check for errors in provider `register()` methods.

## Validation Checklist

- [ ] Provider appears in `php artisan about --json` output
- [ ] `bootstrap/providers.php` lists the provider (if manually registered)
- [ ] `bootstrap/cache/packages.php` contains the provider (if auto-discovered)
- [ ] For deferred providers: `provides()` includes the failing service identifier
- [ ] No `$this->app->make()` calls in `register()`
- [ ] Provider ordering in `bootstrap/providers.php` respects dependency order
- [ ] Config cache can be built without errors

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Provider not in `php artisan about` | Not registered and not auto-discovered |
| Service works locally but not in production | Stale cache — run `php artisan optimize` in deploy |
| Intermittent "Target class does not exist" | `make()` called in `register()` — order-dependent failure |
| Provider loads but binding doesn't resolve | Binding key mismatch; check `bound()` vs `make()` argument |
| Config cache fails | I/O or side effects in `register()` — must be pure bindings only |

## Decision Points

- **Deferred or Not**: If provider is deferred, focus on `provides()` completeness. If eager, focus on `register()` and ordering.
- **Cache Issue**: Production vs local — reproduce in production environment with `APP_DEBUG=true` to see errors.

## Performance Considerations

- Debugging in production should be minimal — enable `APP_DEBUG` temporarily if safe.
- Config caching errors often trace back to `register()` methods with request-dependent side effects.
- Deferred manifest issues cause silent failures — rebuild manifest as part of debugging.

## Security Considerations

- Enable `APP_DEBUG=true` only in non-production or with IP restriction.
- Provider errors during boot can expose class paths and configuration.
- Ordering issues in auth/security providers can create authentication bypasses.

## Related Rules

- Rule 1: Keep `register()` Pure — Bindings Only, Never Resolve from Container
- Rule 2: Order Providers Deliberately in `bootstrap/providers.php`
- Rule 5: Never Override the Provider Constructor Without Calling `parent::register()`

## Related Skills

- Diagnose and Fix Deferred Manifest Issues
- Unit Test Provider Register Method

## Success Criteria

- Provider is confirmed registered and in correct order.
- All expected bindings are resolvable from the container.
- Config caching completes without errors.
- Production and local behavior are consistent.
