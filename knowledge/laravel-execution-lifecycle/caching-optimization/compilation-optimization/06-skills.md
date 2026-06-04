# Skill: Run Full Optimization Pipeline

## Purpose
Execute the complete Laravel optimization pipeline (`optimize:clear` + `optimize` + `event:cache`) to generate all bootstrap caches, reducing total request bootstrap time by 50-150ms.

## When To Use
- Every production deployment before traffic is directed to the new version
- After any combination of config, route, event, or provider changes
- Before production benchmarking or load testing

## When NOT To Use
- Local development — caches mask changes until cleared, causing confusion
- Before running migrations — cached routes may reference non-existent schema
- During troubleshooting — start with `optimize:clear` to eliminate cache as a variable

## Prerequisites
- Code deployed and `composer install --no-dev --optimize-autoloader` completed
- `php artisan migrate --force` completed (if schema changes exist)
- `bootstrap/cache/` directory writable by the deployment user

## Inputs
- Application codebase with all files in place
- `.env` file with production environment values

## Workflow
1. Run `php artisan migrate --force` (schema must exist before caches reference it)
2. Run `php artisan optimize:clear` to remove all stale cache files
3. Run `php artisan optimize` (generates config, route, and services caches)
4. Run `php artisan event:cache` separately (not included in `optimize` in most versions)
5. Run `php artisan view:cache` (Laravel 9+) to pre-compile Blade templates
6. Verify all cache files exist: `config.php`, `routes.php`, `services.php`, `events.php`
7. Run `php artisan route:list --format=json` to verify routes resolve correctly
8. Check exit code of each command — fail deployment on any error

## Validation Checklist
- [ ] `php artisan optimize:clear` runs before `php artisan optimize`
- [ ] `php artisan optimize` completes without errors
- [ ] `php artisan event:cache` runs as separate step
- [ ] All cache files exist in `bootstrap/cache/`: `config.php`, `routes.php`, `services.php`, `events.php`
- [ ] Output of each command is checked for errors (don't silently pass)
- [ ] Health checks pass against the optimized application
- [ ] Deployment order: migrations → clear → optimize → event:cache → restart workers

## Common Failures
- Running `optimize` without `optimize:clear` first — stale artifacts persist
- Not running `event:cache` separately — events run auto-discovery on every request
- Optimize before migrations — cached routes reference missing schema
- Partial cache failure recovery — one cache fails but others succeed
- Permission errors on `bootstrap/cache/` — silent failure, app runs uncached

## Decision Points
- **Full optimize vs targeted commands**: Full optimize for general deploys; targeted (`config:cache`, `route:cache`) for single-category changes to reduce deployment time
- **Clear before optimize vs not clearing**: Always clear — prevents hybrid stale/fresh state

## Performance Considerations
- Total bootstrap improvement: 50-150ms reduction per request with all caches enabled
- Cache generation time: 2-5 seconds for full `optimize`
- Cache file sizes: config 100-500KB, routes 200KB-1MB, events 10-50KB, services 5-15KB
- All cache files benefit from OpCache opcode caching

## Security Considerations
- Cached config contains resolved secrets — protect `bootstrap/cache/` permissions
- Cache files should not be publicly accessible (web server should block `bootstrap/`)
- Stale caches after deployment may reference old code paths — always regenerate
- `optimize:clear` does not clear OpCache — worker restart still needed

## Related Rules
- Always run optimize in production deployments
- Run `optimize:clear` before every optimize
- Run migrations before optimize
- Cache in the correct dependency order
- Use targeted cache commands for focused changes
- Verify cache integrity after optimization
- Never run optimize in development

## Related Skills
- Execute Cache Invalidation Deployment
- Configure OpCache for Laravel Production
- Warm Caches During CI/CD Deployment

## Success Criteria
- All five cache files (config, routes, events, services, views) generated
- Bootstrap time reduced to 5-15ms (from 50-150ms uncached)
- No cache-related errors after deployment
- Full pipeline completes in under 10 seconds
