# Feature Configuration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature Configuration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Feature configuration isolates each feature's configuration values (API keys, feature flags, tunable parameters) into its own config file. Instead of a single `config/billing.php` or dumping billing configuration into `config/services.php`, the billing feature owns its configuration file within its feature directory.

The engineering value is self-contained feature setup: enabling a feature means configuring it within its own files. Configuration is co-located with the code that uses it, reducing the context-switch of jumping to the global `config/` directory.

---

## Core Concepts

### Feature Config File

```php
// app/Features/Billing/config.php
return [
    'stripe' => [
        'key' => env('BILLING_STRIPE_KEY'),
        'secret' => env('BILLING_STRIPE_SECRET'),
        'webhook_secret' => env('BILLING_STRIPE_WEBHOOK_SECRET'),
    ],
    'tax_rate' => env('BILLING_TAX_RATE', 0.08),
    'invoice_prefix' => env('BILLING_INVOICE_PREFIX', 'INV-'),
    'payment_gateway' => env('BILLING_PAYMENT_GATEWAY', 'stripe') ,
    'features' => [
        'auto_invoicing' => env('BILLING_AUTO_INVOICING', true),
        'email_receipts' => env('BILLING_EMAIL_RECEIPTS', true),
        'late_fees' => env('BILLING_LATE_FEES', false),
    ],
];
```

### Publishing to Global Config

```php
// BillingServiceProvider
public function boot(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config.php', 'billing');

    if ($this->app->runningInConsole()) {
        $this->publishes([
            __DIR__.'/../config.php' => config_path('billing.php'),
        ], 'billing-config');
    }
}
```

### Accessing Config

```php
// Anywhere in the feature
$key = config('billing.stripe.key');
$rate = config('billing.tax_rate');
```

---

## Mental Models

### The Feature's Control Panel

Each feature's `config.php` is the control panel for that feature. All tunable parameters, feature flags, and third-party credentials are in one place. To understand how a feature is configured, read its config file.

### The Namespaced Config

Feature configurations are namespaced under their feature name. `config('billing.*')` is always billing config. `config('users.*')` is always users config. No naming collisions, no hunting for the right config key.

---

## Internal Mechanics

### Config Merging

`mergeConfigFrom()` merges the feature's config into Laravel's config repository at boot time. If `config('billing')` is accessed before the feature provider boots, it returns null. Accessing after boot returns the merged config.

### Config Caching

`php artisan config:cache` serializes ALL config files (including merged feature configs) into a single cached file. Feature configs are included in the cache as long as the provider runs during cache generation.

```bash
php artisan config:cache
# All feature configs are now cached
```

### Environment Variable Naming

Use feature-prefixed env vars to avoid collisions:

```
# .env
BILLING_STRIPE_KEY=pk_test_...
BILLING_TAX_RATE=0.10
USERS_REGISTRATION_OPEN=true
```

---

## Patterns

### Feature Flags

```php
// Feature config
return [
    'features' => [
        'new_checkout' => env('BILLING_NEW_CHECKOUT', false),
        'auto_invoicing' => env('BILLING_AUTO_INVOICING', true),
    ],
];

// Feature code
class CheckoutController extends Controller
{
    public function __invoke(Request $request)
    {
        if (config('billing.features.new_checkout')) {
            return app(NewCheckoutAction::class)($request);
        }
        return app(LegacyCheckoutAction::class)($request);
    }
}
```

### Environment-Specific Configs

```
Features/Billing/
  config/
    default.php       # Default values
    production.php    # Production overrides
    staging.php       # Staging overrides
```

```php
// BillingServiceProvider
public function boot(): void
{
    $config = array_merge(
        require __DIR__.'/../config/default.php',
        require __DIR__.'/../config/'.app()->environment().'.php',
    );
    $this->mergeConfigFrom(__DIR__.'/../config/default.php', 'billing');
    config(['billing' => $config]);
}
```

### Config Validation at Boot

```php
public function boot(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config.php', 'billing');

    if (app()->environment('production')) {
        $key = config('billing.stripe.key');
        if (empty($key) || str_starts_with($key, 'pk_test_')) {
            throw new \RuntimeException('Production billing config has test Stripe key');
        }
    }
}
```

---

## Architectural Decisions

### Feature Config vs Global Config

| Concern | Feature Config | Global Config |
|---|---|---|
| Ownership | Feature team owns it | Shared responsibility |
| Co-location | Next to feature code | In config/ directory |
| Discoverability | Open feature directory | Open config/billing.php |
| Refactoring | Delete feature directory + config | Delete feature config |
| Caching | Works with config:cache | Works with config:cache |

### Feature Config vs Env Only

| Concern | Config File | Env Only |
|---|---|---|
| Type casting | Manual (env returns string) | Manual |
| Default values | Defined in config | Defined in code or env |
| Feature flags | Centralized in config | Scattered across env |
| Documentation | Config file is self-documenting | Must read .env.example |
| Test overrides | `Config::set()` | `putenv()` or `Config::set()` |

Use config files for all feature settings. Use env vars ONLY for values that change between environments (credentials, URLs).

---

## Tradeoffs

| Concern | Per-Feature Config | Single Config File |
|---|---|---|
| File count | 1 per feature | 1 for everything |
| Merge conflicts | Rare (separate files) | Frequent (shared file) |
| Refactoring | Self-contained | Hunt for the right section |
| Global view | Must open N files | One file covers all |
| Provider overhead | mergeConfig per feature | None |

---

## Performance Considerations

Config merging happens once per request (or once per cached config load). `mergeConfigFrom()` merges a PHP array — the cost is negligible (~0.01ms per feature). With `php artisan config:cache`, the merged config is serialized and loaded as a single file with zero per-feature overhead.

---

## Production Considerations

- Always run `php artisan config:cache` in production for optimal performance
- Use feature-prefixed env vars (`BILLING_*`, `USERS_*`, `ANALYTICS_*`) to avoid collisions
- Validate critical feature config at provider boot with meaningful error messages
- Document all config keys and their defaults in the feature's README
- Use feature flags for gradual rollouts of new feature behavior
- Test config validation in CI (missing keys, wrong environments)
- Keep secrets in env vars — never hardcode them in feature config files

---

## Common Mistakes

### Hardcoded Values Instead of Env Vars

```php
// Bad — cannot change per environment
'stripe_key' => 'pk_live_abc123',

// Good — per-environment value
'stripe_key' => env('BILLING_STRIPE_KEY'),
```

### Config Accessed Before Provider Boot

```php
// In a service provider's register() method
config('billing.tax_rate'); // null — billing provider hasn't booted yet

// Move to boot() or use deferred resolution
```

### Missing mergeConfigFrom

Config values are accessed as `config('billing.*')`, but the feature provider never called `mergeConfigFrom()`. The keys don't exist in the config repository. Always call `mergeConfigFrom` in the provider's `boot()` method.

---

## Failure Modes

### Stale Cached Config After Feature Config Change

The feature's `config.php` is modified, but `php artisan config:cache` is not re-run. The cached config still has old values. Always run `config:cache` as part of deployment.

### Config Key Collision

Two features define `config('features.auto_invoicing')` under different namespaces (`billing.features.auto_invoicing` is fine; `features.auto_invoicing` without namespace conflicts with another feature's config). Always namespace config keys with the feature name.

### Missing Required Env Var at Boot

A required env var is missing and the config defaults to null. The feature silently uses null values until it crashes at a confusing point. Validate required env vars in the provider boot.

---

## Ecosystem Usage

Laravel's config repository supports merging feature configs via `mergeConfigFrom()`. The `config:cache` command serializes all config into a single cached file. Environment variable naming conventions (`BILLING_*`) prevent collisions. Config publishing (`php artisan vendor:publish`) allows features to expose their config to other applications when extracted as packages.

---

## Related Knowledge Units

- **Feature Foundations** (this workspace) — overall structure
- **Feature Service Providers** (this workspace) — how config is loaded
- **Feature vs Layer** (this workspace) — config organization comparison
- **Large Project Structure** (this workspace) — managing config across many features

---

## Research Notes

- `mergeConfigFrom()` is a standard Laravel package method — works identically for features and packages
- Config caching is essential for performance in production — feature configs are included when providers run during cache generation
- Feature configs loaded via `mergeConfigFrom()` are merged into the application config and accessible via `config()`
- Environment-specific configs (e.g., `billing.production.php`) can override defaults per environment
- Feature flag patterns using config: `config('billing.features.new_checkout')` — easy to toggle per environment
- Config validation at provider boot prevents silent misconfiguration in production
- Feature configs support all standard Laravel config features: env vars, defaults, caching, and publishing
