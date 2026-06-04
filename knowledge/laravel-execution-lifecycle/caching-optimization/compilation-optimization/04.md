# ku-06: Compilation Optimization

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **KU:** ku-06-compilation-optimization
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Compilation optimization refers to the bundle of techniques Laravel uses to reduce bootstrap overhead by caching compiled representations of configuration, routes, events, views, and services. The `php artisan optimize` command orchestrates most of these, while others (OpCache, Composer autoloader optimization) are complementary infrastructure-level optimizations.

## Core Concepts
- **Cache types**: Config cache, route cache, event cache, view cache, services cache — each caches a different aspect of bootstrap.
- **Compile strategy**: Move expensive operations (file parsing, Reflection, serialization) from request time to build/deploy time.
- **Pre-computation**: The optimized form is pre-computed and stored as plain PHP files that can be `require`d in microseconds.
- **Composite command**: `php artisan optimize` runs multiple sub-commands in sequence to generate all caches.
- **Symmetry**: Every cache operation has a corresponding clear operation — `optimize` and `optimize:clear` are symmetric inverses.

## When To Use
- **Always in production**. Running in production without optimization caches leaves significant performance on the table.
- In CI/CD pipelines as part of the build phase.
- After every deployment that changes configuration, routes, events, or providers.

## When NOT To Use
- In development — optimized caches mask changes until cleared.
- When debugging bootstrap issues — run `optimize:clear` to force fresh execution.
- In testing — most test environments run uncached to ensure fresh state per test.

## Best Practices (WHY)
- **Run optimize last in deployment**: After `composer install`, migrations, and other setup — caches should reflect the final state.
- **Run optimize:clear before renovating**: Always clear old caches before building new ones to prevent stale + new hybrid state.
- **Use individual cache commands for targeted changes**: If only routes changed, `route:cache` is faster than full `optimize`.
- **Verify cache integrity**: After optimization, run health checks that exercise cached paths to confirm caches are valid.

## Architecture Guidelines
- Cache order matters: `config:cache` → `route:cache` → `event:cache` (config affects routes, routes reference config).
- All cache files live in `bootstrap/cache/` — a single directory for bootstrap-level caching.
- Cache files are plain PHP arrays or serialized data — readable as text, fast to load.
- Storage in `bootstrap/cache/` (not `storage/`) because bootstrap cache must be available before storage is initialized.

## Performance
- Total bootstrap improvement: 50-150ms reduction per request with all caches enabled.
- Cache file sizes: config 100-500KB, routes 200KB-1MB, events 10-50KB, services 5-15KB.
- OpCache interaction: all cache files benefit from OpCache opcode caching — zero PHP parsing cost after first request.
- Cache generation time: 2-5 seconds for full `optimize` in typical applications.

## Security
- Cached config files contain resolved secrets — protect `bootstrap/cache/` permissions.
- Cache files should not be publicly accessible (web server should block `bootstrap/`).
- Stale caches after deployment may reference old code paths — always regenerate.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Running optimize in development | Changes don't take effect | Standard deploy command run locally | Confusing debugging sessions | Use individual clear commands in dev |
| Not running event:cache separately | Events not cached | Assuming optimize includes event:cache | Auto-discovery runs on every request | Run event:cache separately |
| Optimize before migrations | Cached routes reference non-existent columns | Route caching before DB schema ready | Route resolution errors after deploy | Run migrations before optimize |
| Partial cache failure recovery | optimize fails partway through | Closure route blocks route:cache | Config cached but routes not — inconsistent state | Fix the issue and re-run full optimize |
| Stale caches across deployments | Old cache files from previous deploy | Not running optimize:clear before new optimize | Mixed old/new behavior | Clear before build |

## Anti-Patterns
- **Optimize in every build without clearing**: Accumulates stale cache entries — always clear before fresh build.
- **Ignoring optimize failures**: optimize exits with error on first failure — check output for all sub-commands.
- **Assuming all caches are the same**: Config cache and services cache serve different purposes and have different invalidation rules.

## Examples
```bash
# Full optimization sequence
php artisan optimize:clear
php artisan optimize
php artisan event:cache

# Individual targeted caching
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

## Related Topics
- Config Caching (ku-01) — the most impactful single cache
- Route Caching (ku-02) — route compilation mechanics
- Event Caching (ku-03) — event listener manifest caching
- View Caching (ku-04) — automatic Blade compilation
- Service Caching Meta (ku-05) — deferred provider manifest
- Optimize Command (ku-09) — the composite command that orchestrates compilation

## AI Agent Notes
- `php artisan optimize` runs `config:cache`, `route:cache`, and triggers services manifest generation.
- `event:cache` is NOT always included in `optimize` — check your Laravel version.
- When debugging post-deploy issues, start with `php artisan optimize:clear` to eliminate cache-related causes.
- The `optimize:clear` command is idempotent — running it multiple times is safe.

## Verification
- [ ] `php artisan optimize` completes without errors in production
- [ ] All cache files exist in `bootstrap/cache/`
- [ ] `php artisan optimize:clear` removes all cache files
- [ ] Deployment script runs optimize after migrations
- [ ] Health checks pass against the optimized application
