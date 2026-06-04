# Config Caching

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Caching & Optimization |
| Knowledge Unit | Config Caching |
| Difficulty | Foundation |
| Lifecycle Phase | Application Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Config caching merges all `config/*.php` files into a single serialized file (`bootstrap/cache/config.php`), resolving all `env()` calls at cache-build time. This eliminates file parsing and environment variable resolution on every request, reducing bootstrap time by 30-80ms. The cache is immutable — once built, changes to `.env` or config files are invisible until the cache is rebuilt.

## Core Concepts
- **Merge-resolve pattern**: All config files are loaded, merged, and `env()` calls resolved at cache-build time. The result is written as a PHP array via `var_export()`.
- **Single require**: At runtime, `LoadConfiguration` bootstrapper checks for the cached file. If present, it `require`s it — no file scanning, no env resolution.
- **var_export() serialization**: The config array is exported to valid PHP code — faster than `serialize()` because no deserialization is needed.
- **ENV freeze**: All `env()` calls in config files are evaluated at cache time. Runtime `env()` calls return null if the cache is active.
- **Clear command**: `php artisan config:clear` removes the cached file, reverting to file-based loading.

## When To Use
- Always in production — running Laravel production without `config:cache` is a measurable performance regression.
- In CI/CD deployment pipelines as a standard step before serving traffic.
- When environment variables are stable between deployments.

## When NOT To Use
- In local development where config changes frequently.
- When config files contain Closures or unserializable values — `var_export()` cannot handle Closures.
- When dynamic config values depend on runtime conditions — cache freezes the value at build time.

## Best Practices (WHY)
- **Always use `config()` instead of `env()` in application code**: After caching, `env()` returns null. *Why: The env() helper reads from $_ENV at runtime, which is bypassed when cache is active.*
- **Wrap all `env()` calls in config files**: The only safe place for `env()` is inside `config/*.php`. *Why: Cache resolves env() calls at build time, freezing them in the cached array.*
- **Cache after every deployment**: Include `php artisan config:cache` in deployment scripts. *Why: Production should always use the cached config for optimal performance.*
- **Secure the cached file**: `bootstrap/cache/config.php` contains resolved secrets. Set filesystem permissions to 640. *Why: Secrets like DB passwords and API keys are written in plaintext.*

## Architecture Guidelines
- Config files should be pure PHP returning arrays — no side effects, no dynamic logic, no Closures.
- Environment-specific config overrides belong in the config file via `env()`, not by swapping config files.
- The order of config file loading (alphabetical by filename) affects merge precedence — later files override earlier keys.
- Run `config:cache` BEFORE `route:cache` — route caching depends on resolved configuration.

## Performance
- Uncached: 20-50 file reads, PHP parsing, env resolution — 30-80ms per request.
- Cached: single `require` + array assignment — <1ms per request.
- OpCache caches the compiled opcode of `config.php`, making subsequent requires near-zero cost.
- Memory: cached config array typically 500KB-3MB, held in memory for the request lifetime.

## Security
- Secrets written to `bootstrap/cache/config.php` are in plaintext. Protect with filesystem permissions.
- Do not commit `bootstrap/cache/config.php` to version control (it's already in `.gitignore`).
- Environment rotation (e.g., database password change) requires `config:cache` re-run.
- CI/CD pipelines should use production-like `.env` values when generating the cache.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| env() in app code | `env('APP_DEBUG')` called in controllers/services | Returns null after config:cache | Use `config('app.debug')` |
| Stale cache after .env change | Changed .env but didn't re-cache | Old values served until cache rebuild | Always re-run config:cache after .env changes |
| Closures in config | Config file returns a Closure | Fatal error on config:cache | Move Closures to service providers |
| Wrong environment cached | Cached with wrong APP_ENV | Wrong database, mail, etc. configured | Verify .env before caching |
| Cache not cleared before rebuild | Running config:cache without config:clear | Clean rebuild ensures consistency | Command handles this internally, but verify |

## Anti-Patterns
- **env() in application code**: Called outside config files, returns null after caching.
- **Dynamic config keys**: `config($dynamicKey)` with values that should be frozen — consider whether the key should be computed at runtime.
- **Config cache in development**: Running `config:cache` locally and wondering why config changes don't take effect.

## Examples
```bash
# Deployment sequence
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

## Related Topics
- **Prerequisites:** Bootstrapper Sequence — where LoadConfiguration bootstrapper fits.
- **Closely Related:** Route Caching, Events Caching — sibling caching commands.
- **Advanced:** Cache Invalidation Deployment — stale config detection and deployment strategies.
- **Cross-Domain:** OpCache Configuration — OpCache caches the compiled config.php.

## AI Agent Notes
- After `config:cache`, inspect `bootstrap/cache/config.php` to verify the resolved values.
- `Illuminate\Foundation\Bootstrap\LoadConfiguration::bootstrap()` checks for the cached file first.
- The `env()` helper in application code after caching returns null without warning.
- Config caching uses `var_export()` which cannot export Closures, resources, or objects.

## Verification
- [ ] `php artisan config:cache` runs successfully without errors
- [ ] No `env()` calls exist outside of `config/*.php` files
- [ ] `bootstrap/cache/config.php` is not committed to version control
- [ ] Deployment script includes `config:cache` step
- [ ] OpCache is configured in production for cached file optimization
