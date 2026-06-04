# Skill: Warm Caches During CI/CD Deployment

## Purpose
Generate all Laravel bootstrap caches during the CI/CD deploy phase to eliminate cold-start penalty on production servers.

## When To Use
- Every production deployment with automated CI/CD pipelines
- Before routing traffic to newly deployed servers, containers, or serverless functions
- When deploying with Octane, Vapor, or auto-scaling environments

## When NOT To Use
- Single-server symlink-swap deployments that warm caches in the activate hook
- Development or staging environments where caches are cleared frequently
- Deployment time budgets under 1 second where warmup adds 5-30 seconds

## Prerequisites
- CI/CD pipeline configured (GitHub Actions, GitLab CI, Jenkins, etc.)
- `composer install --no-dev --optimize-autoloader` executed
- `php artisan migrate --force` completed (if schema changes exist)
- Production-like `.env` values available in CI

## Inputs
- Laravel application codebase
- CI/CD environment variables matching production
- Deployment target (server, container, serverless)

## Workflow
1. Set production-like environment variables in CI/CD secrets
2. Copy `.env.production` or export production values
3. Run `php artisan optimize:clear` to remove stale cache files
4. Run `php artisan optimize` to generate config, route, and services caches
5. Run `php artisan event:cache` separately (not included in optimize in most versions)
6. Run `php artisan view:cache` (Laravel 9+) to pre-compile Blade templates
7. Verify caches exist with file existence checks
8. Run `php artisan route:list --format=json` to confirm routes are cached
9. Include cache files in the deployment artifact

## Validation Checklist
- [ ] `bootstrap/cache/config.php` exists and contains production-like values
- [ ] `bootstrap/cache/routes.php` exists and produces correct route list
- [ ] `bootstrap/cache/events.php` exists (if events are used)
- [ ] `bootstrap/cache/services.php` exists with expected providers
- [ ] Cache build failures cause the deployment pipeline to fail
- [ ] Warmup completes before traffic switch (symlink, LB, DNS)

## Common Failures
- Cache built with wrong environment variables — production runs CI values
- `optimize:clear` not run before `optimize` — stale artifacts persist
- `event:cache` omitted — event discovery runs on every request
- Permissions prevent cache file writes — silent failure, app runs uncached
- OpCache not reset after cache files deployed — old opcodes still serve

## Decision Points
- **Build-time vs deploy-time warmup**: Build-time (Docker build) catches errors early; deploy-time (symlink hook) ensures environment match
- **Full optimize vs targeted commands**: Full optimize for general deploys; targeted commands for single-category changes (routes only)

## Performance Considerations
- Cache generation adds 5-30 seconds to deployment pipeline
- Warmup saves 50-150ms bootstrap penalty per request on every new server
- Container image size increases by 100KB-5MB from cache files
- Pre-warming prevents cache stampede under load during rollout

## Security Considerations
- Cache files contain resolved secrets (DB passwords, API keys)
- Use build-stage separation to exclude cache files from intermediate container layers
- `.dockerignore` should exclude `bootstrap/cache/` from build context if generated in CI
- Verify CI environment variables match production — especially `APP_KEY`

## Related Rules
- Run `optimize:clear` before `optimize` in CI/CD
- Use production-like env variables for cache builds in CI
- Verify cache integrity after warmup
- Reset OpCache after cache files are written
- Fail the deployment on cache build errors

## Related Skills
- Execute Optimize in Deployment Sequence
- Configure OpCache for Laravel Production
- Execute Cache Invalidation Deployment

## Success Criteria
- All bootstrap cache files exist before traffic reaches new deployment
- First request latency matches optimized (50-150ms faster than cold)
- Cache build failures halt deployment with clear error
- Container images include pre-built caches ready to serve
