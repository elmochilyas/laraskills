# Skill: Execute Cache Invalidation Deployment

## Purpose
Clear stale Laravel bootstrap caches and regenerate fresh ones during zero-downtime deployments, ensuring consistent application state across the cutover.

## When To Use
- Every production deployment that changes config, routes, events, views, or providers
- After `composer install`/`update` that modifies package providers
- After environment variable rotation affecting config values

## When NOT To Use
- Infrastructure-only deployments with zero code/config changes
- Local development — caches should be cleared, not warmed
- Ephemeral environments where caches don't persist across restarts

## Prerequisites
- Deployment strategy chosen (symlink swap, blue/green, rolling)
- `composer install --no-dev --optimize-autoloader` completed
- Migrations run (`php artisan migrate --force`)
- `bootstrap/cache/` directory writable by deployment user

## Inputs
- New release directory or deployment artifact
- Previous release's cache files (for rollback preservation)
- CI/CD environment variables matching production

## Workflow
1. Deploy new code to release directory (do NOT switch traffic yet)
2. Install composer dependencies: `composer install --no-dev --optimize-autoloader`
3. Run migrations: `php artisan migrate --force`
4. Run `php artisan optimize:clear` to remove old cache files
5. Run `php artisan optimize` to rebuild config, route, services caches
6. Run `php artisan event:cache` separately
7. Run `php artisan view:clear` to clear compiled Blade templates
8. Run `php artisan view:cache` (Laravel 9+) to pre-compile views
9. Verify cache files exist and are valid
10. Switch traffic: symlink swap, LB registration, or DNS cutover
11. Restart PHP-FPM or Octane workers to flush OpCache

## Validation Checklist
- [ ] `optimize:clear` runs before `optimize` in deploy script
- [ ] Cache files built in new release directory before symlink swap
- [ ] Migrations run before cache generation
- [ ] PHP-FPM/Octane workers restarted after cache build
- [ ] Previous release's caches preserved for instant rollback
- [ ] Concurrent deployments prevented (locking or serialized pipeline)
- [ ] Health checks pass against optimized application

## Common Failures
- Symlink swap before warmup — first requests served uncached
- Cache built with wrong environment — production runs with CI config
- OpCache not reset — old opcodes continue serving despite new files
- Concurrent deployment streams corrupt cache files
- Cache clear without warmup — performance regression until first request
- Warmup before migrations — cached routes reference non-existent schema

## Decision Points
- **Build on server vs CI**: CI build catches errors early; server build ensures exact environment match
- **Full clear vs targeted**: Full `optimize:clear` for comprehensive deploys; targeted clear (`config:clear`) for single-category changes

## Performance Considerations
- Clear + warm duration: 3-10 seconds for full pipeline
- Without warmup: 50-150ms bootstrap penalty per first request per server
- Cache stampede risk when multiple workers detect missing cache simultaneously
- Rollback without caches forces old code to run uncached

## Security Considerations
- Cached config contains resolved secrets — protect `bootstrap/cache/` permissions
- Old cache files may reference removed class paths — clear before warm prevents errors
- Stale caches after rollback expose old secrets — rotate secrets atomically
- Ensure `bootstrap/cache/` is not publicly accessible via web server

## Related Rules
- Warm caches before routing traffic to new deployment
- Clear caches before warming in deployment
- Run migrations before cache warmup
- Restart PHP workers after cache build
- Keep previous release caches for instant rollback
- Prevent concurrent cache generation

## Related Skills
- Warm Caches During CI/CD Deployment
- Execute Optimize in Deployment Sequence
- Configure OpCache for Laravel Production

## Success Criteria
- Zero first-request latency penalty after deployment
- No class-not-found or provider errors after cutover
- Rollback completes instantly with full cache support
- All workers serve new code within seconds of completion
