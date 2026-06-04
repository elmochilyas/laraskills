# Bootstrap Warmup in CI/CD

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Caching & Optimization |
| Knowledge Unit | Bootstrap Warmup in CI/CD |
| Difficulty | Advanced |
| Lifecycle Phase | Deployment |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Bootstrap warmup in CI/CD is the practice of generating all Laravel bootstrap caches (config, route, events, services) during the build or deploy phase, ensuring that production servers serve requests with fully-warmed caches from the first request. This eliminates the cold-start penalty where the first requests to a newly deployed server must bootstrap uncached. Warmup is typically integrated into CI/CD pipelines as a deployment step before traffic is routed to the new environment.

## Core Concepts
- **Cold start**: A server that has just been deployed but has no bootstrap caches yet. First requests pay 50-150ms bootstrap penalty.
- **Cache warmup**: Running `php artisan optimize` (and optionally `view:cache`) during deployment to pre-generate all caches.
- **Build-time vs deploy-time warmup**: Caches can be generated during CI build or during the deployment hook — each has tradeoffs.
- **CI/CD pipeline**: The automated workflow (GitHub Actions, GitLab CI, Jenkins) that builds, tests, and deploys the application.
- **Deployment artifact**: The deployable package (directory, container image, serverless bundle) that includes pre-generated caches.
- **Warmup verification**: Automated checks that confirm caches were generated correctly before directing traffic.

## When To Use
- Every production deployment — warmup is a standard deployment step.
- CI/CD pipelines that deploy to multiple servers — avoids cold starts on each server.
- Octane deployments — caches are loaded once per worker; warmup is essential for consistent behavior.
- Serverless deployments (Vapor) — cold starts are more expensive; warmup reduces their impact.

## When NOT To Use
- Single-server deployments with symlink-swap — warmup happens on the server during the activate hook.
- Development environments where caches are cleared frequently.
- When deployment time is extremely constrained (<1 second budget) — warmup adds 5-30 seconds.

## Best Practices (WHY)
- **Warm caches before traffic is routed**: Generate all caches in the deploy step, before the symlink swap or load balancer registration. *Why: Ensures the first request from real traffic benefits from caching.*
- **Verify caches after warmup**: Run `php artisan route:list` or check cache file existence after warmup. *Why: A failed warmup silently falls back to uncached mode, causing performance regression.*
- **Use build-time warmup for containers**: Generate caches during Docker image build. *Why: Reduces deploy-time overhead and catches cache build errors early.*
- **Include environment-appropriate values**: Use production-like environment variables when building caches. *Why: Caches freeze env() calls — wrong values cause incorrect configuration.*
- **Monitor warmup duration**: Track how long `php artisan optimize` takes in CI/CD. *Why: Increasing duration indicates growing application complexity that may need provider optimization.*

## Architecture Guidelines
- For symlink-swap deployments (Envoyer, Deployer): warm caches in the new release directory before the symlink swap.
- For container deployments (Docker, Vapor): warm caches during the Dockerfile build or container entrypoint.
- For serverless: warm caches during the build phase — caches are included in the deployment artifact.
- For Octane: warm caches before starting workers — worker processes load caches from the pre-built files.
- Always run `optimize:clear` before `optimize` to ensure no stale caches remain.

## Performance
- Cache generation time: 5-30 seconds depending on application size.
- Warmup vs. cold start savings: 50-150ms per request until caches are naturally populated.
- For auto-scaling environments: warmup prevents a spike of slow responses when new instances spin up.
- Container image size increase: 100KB-5MB for bootstrap cache files.

## Security
- Caches contain resolved secrets (config cache) — ensure cache files are not exposed in container layers or build logs.
- Use `.dockerignore` or build-stage separation to exclude sensitive cache files from intermediate layers.
- Verify that CI/CD environment variables match production — especially `APP_KEY`, `DB_PASSWORD`, `APP_ENV`.
- Cache files should be excluded from version control and only exist in the deployment artifact.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Building caches with wrong env | CI uses different .env values | Production runs with CI config values frozen in cache | Use production-like env in CI |
| Not clearing caches before warmup | Previous build artifacts remain | Mixed old/new cache data | Always optimize:clear before optimize |
| Skipping warmup for "small" deploys | Deploying without cache generation | 50-150ms penalty per server on first requests | Always warm up caches |
| Warmup in activate hook after traffic | Swapping symlink first, then warming | First requests to new release are uncached | Warm before symlink swap |
| Warmup without OpCache reset | opcache.validate_timestamps=0 | Cached opcodes reference old PHP files | Reset OpCache after cache files are written |

## Anti-Patterns
- **Manual warmup**: SSHing into production to run `php artisan optimize` — should be automated in CI/CD.
- **Skipping warmup for "emergency" deploys**: Hotfixes deployed without warmup — no cache penalty for a 2-line config change is acceptable, but route/provider changes need it.
- **One pipeline for all envs**: Using the same cache build for staging and production — different env values produce different caches.

## Examples
```yaml
# GitHub Actions deploy step
- name: Deploy & Warmup
  run: |
    php artisan optimize:clear
    php artisan optimize
    php artisan view:cache
    # Verify
    php artisan route:list --format=json > /dev/null
```

## Related Topics
- **Prerequisites:** Optimize Command — the command that performs the warmup.
- **Closely Related:** Cache Invalidation Deployment — invalidation and warmup as paired operations.
- **Advanced:** OpCache Configuration — OpCache reset timing relative to cache warmup.
- **Cross-Domain:** CI/CD Pipeline Design, Deployment Strategies.

## AI Agent Notes
- For Docker multi-stage builds: generate caches in the build stage, copy them to the final stage.
- For Octane: warm caches in the Dockerfile, then start Octane workers that load the pre-built caches.
- The `php artisan optimize` command is the standard warmup tool — it runs config:cache, event:cache, route:cache.
- Cache warmup should be the LAST step before the deployment is made live — after composer install and migrations.
- Monitor deployment scripts for `optimize` failures — a failed warmup should fail the deployment.

## Verification
- [ ] CI/CD pipeline includes `optimize:clear` + `optimize` steps
- [ ] Caches are built with production-like environment values
- [ ] Warmup completes before traffic is routed to new deployment
- [ ] Cache build failures cause deployment to fail (not silently skipped)
- [ ] Container deployments include cache files in the final image
- [ ] Deployment duration includes warmup time budget
