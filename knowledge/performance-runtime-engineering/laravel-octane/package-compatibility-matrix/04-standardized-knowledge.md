# Standardized Knowledge: Package Compatibility Matrix

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Package Compatibility Matrix — Known-Compatible and Problematic Packages Under Octane |
| Difficulty | Intermediate |
| Lifecycle | Evaluate, Migrate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Octane compatibility varies significantly by package. **Natively compatible**: Laravel core (Horizon, Telescope, Cashier, Socialite, Sanctum). **Compatible with config**: Spatie packages (media-library, permission, translatable) — usually work with explicit scoped binding. **Incompatible**: Packages relying on global state, static caches, or `$_SESSION`. Always test each package with `octane:test` before deploying.

## Core Concepts

- **Compatible packages**: Laravel ecosystem packages from Taylor Otwell / Laravel team are Octane-aware. Spatie packages generally require `spatie/laravel-octane-compat` or explicit scoped binding config.
- **Problematic patterns**: 1) `public static $property` for caching, 2) `$_ENV` / `$_SERVER` mutation, 3) Global event bus without listener deduplication, 4) Service container rebinding on every request, 5) Direct `$_SESSION` access.
- **Testing methodology**: `artisan octane:test` runs a battery of checks. For specific packages, write Pest/PHPUnit tests that run under Octane and verify no cross-request contamination.

## When To Use

- Evaluating whether to migrate an existing application to Octane
- Auditing third-party package compatibility before Octane deployment
- Debugging cross-request contamination issues in Octane
- Creating compatibility wrappers for incompatible packages

## When NOT To Use

- For greenfield Laravel applications (choose Octane-compatible packages from the start)
- Without running actual Octane tests (theoretical compatibility ≠ actual behavior)
- As a substitute for static property audit in the application codebase

## Best Practices

- **Run octane:test before every deploy**: Catches regressions from package updates. Add to CI pipeline.
- **Use compatibility wrappers**: For packages with static properties, create a decorator using Octane's `scoped()` binding to provide per-request instances.
- **Test each package in isolation**: Disable all but one package, run under Octane, verify no state leaks. Repeat for each package.
- **Maintain a compatibility matrix**: Track which packages and versions are Octane-compatible. Update with each dependency change.
- **Prefer Octane-first packages**: Choose packages explicitly tested under Octane. Check GitHub issues for "octane" label.

## Architecture Guidelines

- **Compatibility wrapper pattern**: Wrap the package's global state behind a request-scoped interface using Octane's `scoped()` method. The wrapper creates a fresh instance per request while the package thinks it's using a singleton.
- **Provider audit**: Every service provider that calls `$this->app->singleton()` must be reviewed. If the singleton stores request-scoped data, it must use `scoped()` or implement `resetState()`.
- **Static property audit**: Search codebase for `public static` and `protected static` properties in vendor packages. Each must be justified as intentionally shared state.

## Performance Considerations

- Octane delivers 2.5-20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains
- Each worker uses 30-80MB RSS; total memory = workers × per-worker memory
- Each worker maintains persistent DB/Redis connections; total = workers × connections-per-worker
- Under Octane, database queries become primary bottleneck (bootstrap is eliminated)
- OpCache preloading further reduces cold-start latency by 2-5ms per worker

## Security Considerations

- Incompatible packages can cause cross-request data leaks (user A sees user B's data)
- Static caches in packages may retain sensitive data (PII, tokens) across requests
- $_SESSION-compatible packages may not work in Octane's stateless model

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Assuming Octane is a drop-in replacement | Not testing | Cross-request contamination | Run octane:test |
| Not auditing service providers | Trusting defaults | Accumulating listener registrations | Audit every provider |
| Ignoring connection pool limits | No capacity planning | Database connection exhaustion | N workers × M connections ≤ DB max |
| Running Octane without memory monitoring | No observability | Undetected leaks until OOM | Monitor RSS per worker |
| Not configuring opcache.preload | Performance oversight | Higher cold-start latency | Configure preloading |

## Anti-Patterns

- **Migrating to Octane without a package audit**: The biggest source of Octane failures is third-party packages. Audit first, migrate second.
- **Assuming "works in FPM = works in Octane"**: FPM's process-per-request model masks all state leaks. Octane reveals them immediately.
- **Applying compatibility patches without testing**: A patch might fix one symptom while introducing a different leak. Always test.

## Examples

```php
<?php
// Compatibility wrapper for packages with static properties
class OctaneSafePackageWrapper
{
    public function __construct(
        private Container $app
    ) {}

    public function getService(): PackageService
    {
        return $this->app->scoped(PackageService::class, function () {
            return new PackageService();
        });
    }
}

// Testing compatibility
// php artisan octane:test
// php artisan octane:start --workers=1 --max-requests=10
// Run: curl http://localhost:8000/test-endpoint repeatedly
// Check: responses are consistent, no cross-request data leaks
```

## Related Topics

- State Management and Leak Prevention
- FPM to Octane Migration
- Service Provider Optimization
- Static Property Audit Methodology

## AI Agent Notes

- Compatible: Laravel core packages (Horizon, Telescope, Cashier, Socialite, Sanctum).
- Configurable: Spatie packages (media-library, permission, translatable).
- Incompatible: packages with static state, $_SESSION, global event bus, or service container rebinding.
- Run `octane:test` before every deploy. Add to CI pipeline.
- Use scoped() bindings for per-request instances.
- Maintain a compatibility matrix as packages update.
- Static property audit is essential — search `public static` in vendor.

## Verification

- [ ] Package compatibility audit completed for all third-party packages
- [ ] octane:test passes in CI pipeline
- [ ] Compatibility wrappers implemented for incompatible packages
- [ ] Static property audit completed for vendor packages
- [ ] Service provider audit completed for all registered providers
- [ ] Connection pool limits calculated (N workers × M connections)
- [ ] Memory monitoring configured for per-worker RSS tracking
