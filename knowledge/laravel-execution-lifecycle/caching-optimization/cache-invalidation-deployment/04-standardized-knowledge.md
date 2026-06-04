# Cache Invalidation Deployment

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Caching & Optimization |
| Knowledge Unit | Cache Invalidation Deployment |
| Difficulty | Advanced |
| Lifecycle Phase | Deployment |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Cache invalidation during deployment is the process of clearing and regenerating Laravel's bootstrap caches (config, route, events, services) when new code is deployed. Because these caches freeze application state at build time, any code change — new routes, modified config, added providers, updated composer dependencies — requires cache invalidation. The deployment strategy must handle cache regeneration atomically to avoid serving inconsistent state during the transition.

## Core Concepts
- **Cache freeze**: Bootstrap caches are snapshots. They reflect the code state at the time of generation, not runtime.
- **Invalidation triggers**: Any change to config, routes, events, providers, or composer autoloader requires cache regeneration.
- **Atomic swap**: Deployments should build caches in a new directory, then atomically swap symlinks to avoid serving half-baked state.
- **Cache warming**: Generating caches before traffic is directed to the new deployment — avoids cold-start penalty.
- **Rollback**: Older caches (from the previous deployment) should be kept for rapid rollback.
- **Stale detection**: Monitoring tools can detect when caches are stale by comparing file modification times.

## When To Use
- Every production deployment that modifies config, routes, events, or providers.
- After composer install/update that changes provider paths.
- After environment variable rotation that affects config values.

## When NOT To Use
- Deployments with zero code/config changes (e.g., infrastructure-only changes).
- Local development — cache is typically not used in development.

## Best Practices (WHY)
- **Build caches in CI/CD, not on the server**: Generate caches during the build phase and deploy them as artifacts. *Why: Build-time caching catches errors early and reduces deployment time.*
- **Use atomic deployments**: Deploy to a new directory, build caches, then swap symlink. *Why: Avoids serving traffic with stale or half-built caches.*
- **Clear before building**: Always run `optimize:clear` before `optimize`. *Why: Old cache files can conflict with new code, causing unpredictable behavior.*
- **Keep previous caches for rollback**: If deploying via symlink swap, keep the previous release's caches intact. *Why: Enables instant rollback without rebuilding caches.*
- **Monitor cache staleness**: Use deployment hooks to verify caches are fresh after deploy. *Why: A failed cache build silently falls back to uncached mode.*

## Architecture Guidelines
- Bootstrap caches are stored in `bootstrap/cache/` — this directory should be writable during deployment but protected in production.
- Use deployment tools (Envoyer, Forge, Deployer) that support cache warmup as a deployment hook.
- For serverless (Vapor), caches are built during the container image build phase.
- For Octane, caches must be built before workers start — worker restart does not regenerate caches.
- Atomic deployments (symlink swap) should build caches in the new release directory before swapping.

## Performance
- Cache regeneration time: config (0.5-3s), routes (1-10s), events (0.5-2s), services (0.5-2s).
- Without cache: 50-150ms bootstrap penalty per request until caches are regenerated.
- Rolling deployments: each new server regenerates caches independently — total cost scales with fleet size.
- CI/CD cache build: adds 5-30s to deployment pipeline depending on application size.

## Security
- Cache files may contain resolved secrets — ensure they are not exposed in build artifacts or logs.
- Deploy strategies that build caches on the production server expose secret values in temporary files.
- Use encrypted environment variables in CI/CD to generate caches securely.
- Rollback with stale caches may expose old secrets — rotate secrets atomically with deployment.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Not clearing cache before deploy | Deploying new code with old cache | Config/routes/providers from old code still active | Always run optimize:clear before optimize |
| Cache built with wrong environment | CI/CD uses different env than production | Production runs with CI config values | Use production-like env in CI for cache build |
| Symlink swap without warmup | Swapping to new release without building caches | First requests are uncached until cache is built | Warm caches before symlink swap |
| Forgetting services cache | Provider changes without services cache regeneration | New providers not registered | Include optimize in deploy |
| No rollback plan | New cache breaks production | Cannot quickly revert to working state | Keep previous release's caches for rollback |

## Anti-Patterns
- **Building caches on the production server**: Exposes build logic and env vars to the production filesystem.
- **Manual cache invalidation**: SSHing into production to run `optimize:clear` — should be automated in deploy.
- **One-size-fits-all cache clear**: Running `optimize:clear` on every deploy even when no cacheable code changed — unnecessary downtime.
- **Not verifying cache after deploy**: Assuming `optimize` succeeded without checking — may silently fail.

## Examples
```bash
# Atomic deployment with cache warmup
composer install --no-dev
php artisan optimize:clear
php artisan optimize
php artisan view:cache
ln -sfn /releases/new-release /current
```

## Related Topics
- **Prerequisites:** Optimize Command — the command that builds all caches.
- **Closely Related:** Bootstrap Warmup in CI/CD — CI/CD cache generation strategies.
- **Advanced:** OpCache Configuration — OpCache reset during deployment.
- **Cross-Domain:** Deployment Strategies — zero-downtime deployment patterns.

## AI Agent Notes
- Laravel's bootstrap caches are NOT automatically invalidated — they are snapshots that require manual regeneration.
- The `optimize:clear` command deletes all files in `bootstrap/cache/` — it's the standard invalidation mechanism.
- For atomic deployments: build caches in the new release directory before symlink swap.
- Envoyer and Forge use deployment hooks (activate, deactivate) to manage cache warming.
- Octane: caches are loaded once per worker — worker restart does NOT regenerate caches; they must be regenerated before worker restart.

## Verification
- [ ] Deployment script includes `optimize:clear` + `optimize` sequence
- [ ] Caches are built with production-like environment values
- [ ] Symlink swap happens AFTER cache warmup
- [ ] Rollback keeps previous release's caches intact
- [ ] Cache build failures are detected and alerted
