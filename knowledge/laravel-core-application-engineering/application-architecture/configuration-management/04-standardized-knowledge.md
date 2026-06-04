# ECC Standardized Knowledge — Configuration Management

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Configuration Management |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — Configuration & Environment |
| **Last Updated** | 2026-06-02 |

---

## Overview

Laravel's configuration management system provides a layered access pattern: `.env` files supply environment-specific values, `config/*.php` files organize those values into logical groups, and the `Illuminate\Config\Repository` provides application-wide access via the `config()` helper. The critical architectural property is the distinction between **environment variables** (source values, loaded at bootstrap) and **configuration values** (cached, compiled, and optimized at deployment time).

The single most important engineering decision is the `env()` vs `config()` distinction. `env()` reads directly from environment variables and is never cached. `config()` reads from the `Config\Repository`, which IS cached when `php artisan config:cache` is executed. Using `env()` outside config files creates deployment traps where stale or missing environment variables cause production failures that development environments never experience.

---

## Core Concepts

### Config Repository
`Illuminate\Config\Repository` wraps an associative array with dot-notation access. `config('app.name')` resolves `['app']['name']`. Registered as a container singleton at `$app['config']`.

### Environment File Loading
`Dotenv` loads `.env` files during `LoadEnvironmentVariables` bootstrap step. Loading order: `.env` → `.env.local` → `.env.{APP_ENV}` → `.env.{APP_ENV}.local`. Each level overrides the previous.

### Config Caching
`php artisan config:cache` merges all `config/*.php` into `bootstrap/cache/config.php`. After caching, `env()` calls in config files are resolved and frozen. Environment changes require cache rebuild.

### env() vs config()
`env()` — use ONLY in config files. Never cached. Reads live environment. `config()` — use everywhere else. Reads from cached array when cache exists.

### Key Resolution
`config('database.connections.mysql.host')` splits by `.` and walks the `$items` array. If any key in the path doesn't exist, returns the default value.

---

## When To Use

- **Application configuration** — always use config files for application settings
- **Environment-specific values** — use `.env` files for per-environment overrides
- **Production deployments** — always enable config caching
- **Multi-environment setup** — development, staging, production with different configs
- **Package configuration** — publish package configs via `vendor:publish`

---

## When NOT To Use

- **Runtime feature flags** — config caching freezes values; use database or cache for dynamic flags
- **User-specific settings** — config is global, not per-user
- **Secrets management** — don't hardcode secrets in config files; use `.env` or secret manager
- **Frequently changing values** — every config change requires cache rebuild

---

## Best Practices

### Use env() Only in Config Files
Call `env()` exclusively in `config/*.php` files. Use `config()` everywhere else.

**Why:** After `config:cache`, `env()` in config files is resolved and frozen. `env()` in application code still reads live environment, creating inconsistency between cached and live values.

### Validate Required Values in Config Files
Check that critical environment variables exist at the end of config files, especially in production.

**Why:** Catching a missing value at deploy time (`config:cache` fails) is better than catching it at request time (runtime exception).

### Use the Environment File Cascade
Commit `.env` with safe defaults. Use `.env.local` for local overrides (in `.gitignore`). Use `.env.production` for production defaults.

**Why:** The cascade allows team members to have different local overrides while maintaining a single source of truth in the base `.env` file.

### Clear and Rebuild Cache on Deploy
Every deployment must include `config:clear && config:cache`.

**Why:** New configuration values (added services, changed middleware) don't load from stale cache. Without rebuilding, the application uses outdated configuration.

---

## Architecture Guidelines

### Config File Loading Flow
```
LoadConfiguration::bootstrap($app)
  → glob config/*.php
  → sort alphabetically
  → foreach: require file, set key in repository
  → apply environment-specific overrides
  → register repository as 'config' singleton
```

### Cached vs Uncached
Cached: single `require bootstrap/cache/config.php` — <0.5ms.
Uncached: 25+ file reads, glob scan, array merges — 3-8ms.
Always cache in production.

### Config Repository as Contract
Config files declare "I need X from the environment." The `.env` fulfills the contract. If a required value is missing, the contract is breached.

---

## Performance Considerations

### Uncached Loading Cost
25 config files → 3-8ms per request. Scales linearly with file count.

### Cached Loading Cost
Single file → <0.5ms regardless of count. File count has zero impact.

### Cache Miss Impact
If `bootstrap/cache/config.php` doesn't exist, fallback to uncached is silent. No error or warning. Requires bootstrap time monitoring.

### env() Performance
~0.001ms per call. Accumulates at 50+ calls per request. Use `config()` for performance consistency.

---

## Security Considerations

### Environment Variable Exposure
Environment variables are accessible to any PHP process, `php artisan tinker`, `phpinfo()` output, and error backtraces.

### Secrets in Config Files
Never hardcode secrets in `config/*.php`. Use `.env` (in `.gitignore`) or server-level environment variables.

### Cache File Permissions
`bootstrap/cache/config.php` contains resolved configuration including secrets. Protect with filesystem permissions.

### Stale Cache After Deployment
If cache is not regenerated, old config values (including old API keys, old database credentials) serve requests. This is a security risk.

---

## Common Mistakes

### Using env() Outside Config Files
Desc: `env('APP_DEBUG')` in controllers, services, or Blade views.
Cause: Convenience — the helper is available everywhere.
Consequence: Works in development (no cache), fails unpredictably in production (config cache freezes values, env() reads live).
Better: Always use `config('app.debug')` in application code.

### Calling env() After Config Cache
Desc: Assuming `env()` returns the current value after caching.
Cause: Not understanding that cached config resolves `env()` at cache time.
Consequence: Frozen values that don't reflect environment changes.
Better: Understand that after cache, config values are snapshots.

### Not Publishing Package Configs
Desc: Missing package configuration because `vendor:publish` was not run.
Cause: Forgetting the publish step after package installation.
Consequence: Application uses package defaults silently.
Better: Always run `php artisan vendor:publish --tag=config` for new packages.

### Storing Secrets in Config Files
Desc: Hardcoding `'key' => 'sk_live_abc123'` in config file and committing to version control.
Cause: Convenience during development.
Consequence: Secrets in version control, accessible to anyone with repository access.
Better: Use `env('STRIPE_KEY')` and `.env` with proper `.gitignore`.

---

## Anti-Patterns

### Config File Environment Overengineering
Creating complex conditional logic in config files based on `app()->environment()`. This makes production behavior impossible to reproduce locally. Config values should be determined by environment variables, not by the application detecting its environment.

### Global Config Mutability
Using `Config::set()` at runtime in production to change configuration. Runtime overrides are not persisted, lost on cache regenerate, and create debugging nightmares.

### Config as Feature Flag Store
Using configuration for frequently toggled feature flags. Config caching freezes values — use database-backed or cache-backed feature flag systems instead.

---

## Examples

### Config File Pattern
```php
// config/services.php
return [
    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
    ],
];
```

### Config Validation Pattern
```php
$stripeKey = env('STRIPE_KEY');
if (empty($stripeKey) && app()->environment('production')) {
    throw new RuntimeException('STRIPE_KEY is not configured');
}
return [
    'stripe' => ['key' => $stripeKey],
];
```

### Environment Cascade
```
.env           → base defaults (committed)
.env.local     → local overrides (.gitignore)
.env.production → production defaults (committed)
.env.production.local → machine overrides (.gitignore)
```

---

## Related Topics

### Prerequisites
- **Bootstrapping Lifecycle** — Config loading is a bootstrap step
- **Service Container Basics** — Config registered as container singleton

### Closely Related
- **Service Provider Strategies** — Providers consume config values
- **Directory Conventions** — Config directory organization
- **Application Localization** — Locale configuration in `config/app.php`

### Advanced
- **Environment Management** — Environment detection and configuration

### Cross-Domain
- **DevOps & Infrastructure** — Deployment scripts for config cache management

---

## AI Agent Notes

### Important Decisions
- Config caching is a performance optimization with operational cost (cache must be rebuilt on config changes)
- `env()` resolves once at cache time; after that, the value is frozen
- `config:cache` failure causes silent fallback to uncached loading
- Environment-specific config overrides directory (`config/{env}/`) was added in Laravel 11+

### Important Constraints
- `config()` returns the cached value when cache exists — it never reads live `env()` after cache
- Config repository is a singleton — all parts of the application share the same values
- Dot-notation cannot distinguish between `config('database')` and `config('database.nonexistent')`

### Rules Generation Hints
- Ban `env()` calls outside of `config/*.php` files
- Require config validation in production environments
- Require `config:cache` in deployment scripts

---

## Verification

This document has been validated against:
- `Illuminate\Config\Repository` — `$items` array, dot notation resolution
- `Illuminate\Foundation\Bootstrap\LoadConfiguration` — cached vs uncached loading paths
- `Illuminate\Foundation\Console\ConfigCacheCommand` — cache generation
- `vlucas/phpdotenv` — environment file parsing
