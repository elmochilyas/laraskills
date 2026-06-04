# Optimize Command

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Caching & Optimization |
| Knowledge Unit | Optimize Command |
| Difficulty | Intermediate |
| Lifecycle Phase | Application Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
The `php artisan optimize` command is a meta-command that runs multiple caching commands in sequence to prepare the application for production. It generates the services cache (deferred provider manifest), config cache, events cache, and route cache, and compiles commonly used classes into a single file for faster autoloading. Its counterpart, `php artisan optimize:clear`, removes all cached files. The command is the standard production preparation step in Laravel deployment workflows.

## Core Concepts
- **Meta-command**: `optimize` runs individual caching commands in dependency order.
- **Services cache**: `bootstrap/cache/services.php` — deferred provider manifest.
- **Config cache**: `bootstrap/cache/config.php` — merged configuration.
- **Events cache**: `bootstrap/cache/events.php` — event-listener map.
- **Route cache**: `bootstrap/cache/routes.php` — compiled route matcher.
- **Compiled classes**: `bootstrap/cache/compiled.php` — `class_compiles` file (removed in Laravel 11).
- **Clear command**: `optimize:clear` removes all files from `bootstrap/cache/`.
- **Dependency order**: Config cache is built first (routes depend on config), then events, then routes.

## When To Use
- Before every production deployment as the final warmup step.
- After any configuration, route, event, or provider changes in production.
- As part of CI/CD pipeline to prepare the application artifact.

## When NOT To Use
- In local development — caches must be cleared after every change, negating the benefit.
- Before running `composer install`/`update` — autoloader changes may invalidate compiled classes.
- When troubleshooting — run `optimize:clear` first to eliminate cache as a variable.

## Best Practices (WHY)
- **Run optimize after every deployment**: Include `php artisan optimize` in deployment scripts. *Why: Ensures all caches are fresh and consistent with the deployed code.*
- **Run optimize:clear before optimize**: Always clear stale caches before rebuilding. *Why: Avoids mixing old and new cache entries.*
- **Verify optimization**: Run `php artisan route:list` and check responses after optimizing. *Why: A failed cache build can silently fall back to uncached mode.*
- **Check file permissions**: Ensure `bootstrap/cache/` is writable by the web server. *Why: Cache generation fails silently if the directory is not writable.*
- **Monitor optimize duration**: In large applications, `optimize` can take 5-30 seconds. *Why: Build time matters in deployment pipelines with tight time budgets.*

## Architecture Guidelines
- `optimize` calls `config:cache`, `event:cache`, and `route:cache` in sequence.
- The services cache is generated as a side effect of the first boot after `optimize:clear`.
- `optimize:clear` deletes all files in `bootstrap/cache/` except `.gitignore`.
- In Laravel 11+, `compiled.php` was removed — `optimize` no longer compiles common classes.
- The optimization commands are idempotent — running them multiple times produces the same result.

## Performance
- `optimize` run time: typically 1-10 seconds depending on application size.
- Bootstrap improvement: 30-100ms reduction per request with all caches enabled.
- Services cache saves 15-40ms, config cache saves 30-80ms, route cache saves 20-40ms, events cache saves 5-20ms.
- Total optimized bootstrap: 5-15ms vs 50-150ms uncached.

## Security
- Cached files may contain sensitive data (secrets in config, route patterns). Protect `bootstrap/cache/` with filesystem permissions.
- Run `optimize` in a secure build environment, not on the production server directly if possible.
- Ensure `optimize:clear` is run before troubleshooting to eliminate stale cache as a security concern.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Running optimize without clearing first | Stale cache persists | Mixed old/new cache entries | Run optimize:clear before optimize |
| Forgetting optimize in deploy | Deploying without caching | 50-150ms penalty per request | Add optimize to deployment script |
| optimize:clear after optimize | Clearing caches immediately after building | Application runs uncached | Only clear when deploying new code |
| Permission errors on cache dir | Web server can't write to bootstrap/cache | Cache not generated; silent fallback to uncached | Set correct permissions in deploy |
| Running optimize in dev | Cache masks development changes | Config/route changes don't take effect | Only use optimize in production/CI |

## Anti-Patterns
- **Skipping optimize:clear before deploy**: Deploying new code with old cache — causes inconsistent behavior.
- **Manually deleting cache files**: Instead of using `optimize:clear` — may leave partial cache state.
- **Optimize in local development**: Running optimize locally and wondering why code changes don't apply.
- **Not verifying cache build**: Assuming optimize succeeded without checking — may have silently failed.

## Examples
```bash
# Full production warmup sequence
php artisan optimize:clear
php artisan optimize
php artisan view:cache

# Verify caches are active
php artisan route:list
```

## Related Topics
- **Prerequisites:** Config Caching, Route Caching, Events Caching, Services Cache — the individual caches optimize orchestrates.
- **Closely Related:** Optimize:clear — the inverse command that removes all caches.
- **Advanced:** Cache Invalidation Deployment — deployment strategies for cache management.
- **Cross-Domain:** Bootstrap Warmup in CI/CD — optimize as part of CI/CD pipeline.

## AI Agent Notes
- In Laravel 10 and below, `optimize` also generates `bootstrap/cache/compiled.php` using `class_compiles`.
- In Laravel 11+, the `compiled.php` generation was removed — `optimize` only handles config, events, and routes.
- The `optimize` command is defined in `Illuminate\Foundation\Console\OptimizeCommand`.
- To see what optimize does: `php artisan help optimize` shows the called commands.
- After `optimize:clear`, the first request regenerates the services cache automatically.

## Verification
- [ ] `php artisan optimize` runs successfully without errors
- [ ] All cache files are present in `bootstrap/cache/` after optimization
- [ ] `php artisan optimize:clear` removes all cache files
- [ ] Deployment script includes `optimize:clear` + `optimize` sequence
- [ ] `bootstrap/cache/` directory is writable by the deployment process
