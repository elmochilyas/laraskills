# Skill: Execute Optimize in Deployment Sequence

## Purpose
Run `php artisan optimize` as the final warmup step in deployments to generate all bootstrap caches (config, route, services) and ensure production serves requests with maximum performance.

## When To Use
- Every production deployment — run after all code is in place and migrations complete
- After any configuration, route, event, or provider changes in production
- Before production benchmarking or load testing

## When NOT To Use
- Local development — caches must be cleared after every change, negating the benefit
- Before running `composer install`/`update` — autoloader changes may invalidate compiled classes
- During troubleshooting — run `optimize:clear` first to eliminate cache as a variable

## Prerequisites
- Code fully deployed with `composer install --no-dev --optimize-autoloader`
- Migrations complete (`php artisan migrate --force`)
- `bootstrap/cache/` directory writable by deployment user
- No Closure-based routes in the application

## Inputs
- Application codebase in final deployed state
- `.env` file with production values
- Artisan CLI

## Workflow
1. Deploy code and install dependencies: `composer install --no-dev --optimize-autoloader`
2. Run migrations: `php artisan migrate --force`
3. Run `php artisan optimize:clear` to remove all stale cache files
4. Run `php artisan optimize` to generate config, route, and services caches
5. Run `php artisan event:cache` separately (not included in `optimize` in most versions)
6. Verify exit code of each command — fail deployment on any error
7. Verify cache files exist in `bootstrap/cache/`: `config.php`, `routes.php`, `services.php`
8. Run `php artisan route:list --format=json` to confirm routes cached correctly

## Validation Checklist
- [ ] `php artisan optimize` runs as the last Artisan command before serving traffic
- [ ] `php artisan optimize:clear` runs immediately before `optimize`
- [ ] `php artisan event:cache` runs as a separate step after `optimize`
- [ ] Exit code of each command checked (deployment fails on error)
- [ ] All expected cache files present in `bootstrap/cache/`
- [ ] `bootstrap/cache/` has correct permissions (writable by deploy, readable by web server)
- [ ] `php artisan optimize:clear` removes all cache files cleanly
- [ ] `php artisan help optimize` confirms expected sub-commands for the Laravel version

## Common Failures
- Running `optimize` before migrations — cached routes reference missing schema columns
- Running `optimize` without `optimize:clear` first — stale cache artifacts persist
- Not running `event:cache` separately — events run auto-discovery on every request
- Assuming `optimize` succeeded without checking output — partial cache failure
- Permission errors on `bootstrap/cache/` — command succeeds silently but writes nothing
- Running `optimize` in development — config/route changes don't take effect

## Decision Points
- **Full optimize vs targeted commands**: Full optimize for general deploys (2-5s); targeted commands (`config:cache`, `route:cache`) for single-category changes to reduce deployment time
- **Check Laravel version**: Use `php artisan help optimize` to verify which sub-commands are included; event:cache may or may not be included

## Performance Considerations
- Execution time: 1-10 seconds depending on application size
- Bootstrap improvement: 30-100ms reduction per request with all caches enabled
- Services cache saves 15-40ms, config cache saves 30-80ms, route cache saves 20-40ms, events cache saves 5-20ms
- Total optimized bootstrap: 5-15ms vs 50-150ms uncached

## Security Considerations
- Cached files may contain sensitive data (secrets in config, route patterns) — protect `bootstrap/cache/`
- Run `optimize` in a secure build environment, not on the production server if possible
- `optimize:clear` does not clear OpCache — worker restart still needed for OpCache invalidation
- Partial cache failure leaves inconsistent application state — always verify full success

## Related Rules
- Run optimize as the final deployment step
- Run `event:cache` separately after `optimize`
- Clear before optimize: run `optimize:clear` first
- Never run optimize in local development
- Verify optimize output for errors
- Ensure `bootstrap/cache/` has correct permissions

## Related Skills
- Execute Cache Invalidation Deployment
- Run Config Caching in Production Deployments
- Cache Routes for Production

## Success Criteria
- All bootstrap caches generated without errors in every production deployment
- Bootstrap time reduced to 5-15ms from 50-150ms uncached
- No partial cache failures (all caches build or none)
- Deployment pipeline fails fast on cache build errors
