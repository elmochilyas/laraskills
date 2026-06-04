# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Module Dependencies |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Feature configuration isolates each feature's configuration values (API keys, feature flags, tunable parameters) into its own config file. Instead of dumping billing configuration into `config/services.php`, the billing feature owns its configuration file within its feature directory. The engineering value is self-contained feature setup: enabling a feature means configuring it within its own files. Configuration is co-located with the code that uses it, reducing context-switching.

---

## Core Concepts

- **Per-feature config file**: `app/Features/Billing/config.php` with feature-specific settings
- **Namespaced config access**: `config('billing.stripe.key')` — no naming collisions between features
- **Config merging**: `mergeConfigFrom()` in the service provider merges feature config into Laravel's repository
- **Feature-prefixed env vars**: `BILLING_STRIPE_KEY`, `USERS_REGISTRATION_OPEN` to avoid collisions
- **Config caching**: `php artisan config:cache` serializes all config including merged feature configs

---

## When To Use

- Feature-based structure where each feature has tunable parameters
- Features with API keys, external service credentials, or environment-specific settings
- Feature flags that need per-environment configuration
- Teams that want configuration co-located with feature code

## When NOT To Use

- Features with no configuration (purely internal logic)
- Small applications where a single `config/services.php` suffices
- When configuration is already centralized and changing would cause disruption

---

## Best Practices

- **Use `mergeConfigFrom()` in the provider's `boot()` method** — not in `register()`
- **Namespace env vars with feature prefix** — `BILLING_*`, `USERS_*` prevents collisions
- **Never hardcode secrets** — env vars for credentials, config files for defaults and structure
- **Validate critical config at boot** — throw meaningful errors for missing required config
- **Always run `config:cache` in production** — includes all merged feature configs
- **Document all config keys** in the feature's README

---

## Architecture Guidelines

- Config file location: `app/Features/{Feature}/config.php`
- Provider merging: `$this->mergeConfigFrom(__DIR__.'/../config.php', 'billing')`
- Access: `config('billing.stripe.key')`
- Feature flags: `config('billing.features.new_checkout')` for gradual rollouts
- Environment-specific configs: `config/default.php` + `config/production.php` with array merging
- Config publishing for package extraction: `$this->publishes([...], 'billing-config')`

---

## Performance

Config merging happens once per request (or once per cached config load). `mergeConfigFrom()` merges a PHP array — the cost is negligible (~0.01ms per feature). With `php artisan config:cache`, the merged config is serialized and loaded as a single file with zero per-feature overhead.

---

## Security

Feature configs may contain API keys and secrets. Never hardcode secrets in config files — always use `env()` calls. Validate that production config doesn't use test credentials. Feature configs are cached and should not be world-readable in production.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Hardcoded values instead of env vars | Convenience | Cannot change per environment | Always use `env('KEY')` |
| Config accessed before provider boot | Using `config()` in `register()` | Returns null | Move to `boot()` or use deferred resolution |
| Missing `mergeConfigFrom()` | Forgetting to call merge | `config('billing.*')` returns null | Always call in provider boot |
| Stale cached config | Not re-running `config:cache` | Old values served | Run `config:cache` in deployment |
| Config key collision | No namespace prefix | Two features overwrite each other | Always namespace with feature name |

---

## Anti-Patterns

- **Hardcoded secrets**: `'stripe_key' => 'pk_live_abc123'` instead of `env('BILLING_STRIPE_KEY')`
- **Config in `register()`**: Accessing `config()` before all providers have booted
- **No namespace**: Config key `'features.auto_invoicing'` conflicts with another feature
- **Missing env var validation**: Feature silently uses null values until it crashes

---

## Examples

**Feature config file:**
```php
// app/Features/Billing/config.php
return [
    'stripe' => [
        'key' => env('BILLING_STRIPE_KEY'),
        'secret' => env('BILLING_STRIPE_SECRET'),
    ],
    'tax_rate' => env('BILLING_TAX_RATE', 0.08),
    'features' => [
        'auto_invoicing' => env('BILLING_AUTO_INVOICING', true),
        'late_fees' => env('BILLING_LATE_FEES', false),
    ],
];
```

**Provider config merging:**
```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config.php', 'billing');
    }
}
```

**Config validation at boot:**
```php
public function boot(): void
{
    $this->mergeConfigFrom(__DIR__.'/../config.php', 'billing');
    if (app()->environment('production') && str_starts_with(config('billing.stripe.key'), 'pk_test_')) {
        throw new \RuntimeException('Production billing config has test Stripe key');
    }
}
```

---

## Related Topics

- modular-monolith-basics — Overall structure
- module-auto-discovery — How config is loaded
- technical-vs-domain-grouping — Config organization comparison
- vertical-slice-architecture — Managing config across many features
- feature-flags — Feature flag patterns using config

---

## AI Agent Notes

- `mergeConfigFrom()` works identically for features and packages
- Config caching is essential for production performance
- Feature configs loaded via `mergeConfigFrom()` are merged into the application config
- Environment-specific configs can override defaults per environment
- Feature flag patterns using config enable per-environment toggling
- Config validation at provider boot prevents silent misconfiguration

---

## Verification

- [ ] Each feature has its own `config.php` file
- [ ] `mergeConfigFrom()` called in provider boot
- [ ] All secrets use `env()` not hardcoded values
- [ ] Env vars prefixed with feature name
- [ ] Config keys namespaced with feature name
- [ ] `php artisan config:cache` works without errors
- [ ] Required config validated at provider boot
- [ ] Config documented in feature README
