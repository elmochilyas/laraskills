# Skill: Run Config Caching in Production Deployments

## Purpose
Merge all config files into a single cached file (`bootstrap/cache/config.php`) that resolves `env()` calls at build time, eliminating 30-80ms of bootstrap overhead per request.

## When To Use
- Every production deployment — config cache is the highest-impact single optimization
- After any `.env` or config file changes
- After environment variable rotation (DB passwords, API keys)

## When NOT To Use
- Local development — config changes require cache rebuild to take effect
- When config files contain Closures or unserializable values
- In ephemeral environments where config loading time is irrelevant

## Prerequisites
- All `env()` calls restricted to `config/*.php` files only
- No Closures, resources, or objects in config file return arrays
- `.env` file with production values configured
- `bootstrap/cache/` directory writable

## Inputs
- `config/*.php` files
- `.env` file with production values
- Application bootstrap

## Workflow
1. Verify no `env()` calls exist outside `config/*.php` files
2. Review config files for Closures or unserializable values
3. Set `bootstrap/cache/` directory to writable permissions
4. Run `php artisan config:cache` to generate the cached file
5. Run `php artisan route:cache` afterward (config dependency for routes)
6. Set `bootstrap/cache/config.php` permissions to 640 after generation
7. Verify `config('app.name')` returns correct value after caching

## Validation Checklist
- [ ] `php artisan config:cache` runs without errors (no Closure exceptions)
- [ ] `bootstrap/cache/config.php` exists
- [ ] No `env()` calls exist in controllers, middleware, jobs, or views
- [ ] `config:cache` runs before `route:cache` and `event:cache`
- [ ] Cache file permissions are restrictive (640)
- [ ] `bootstrap/cache/config.php` not committed to version control
- [ ] Config cache rebuilt after environment variable rotation

## Common Failures
- `env()` in application code returns `null` after caching — silent bug
- Closures in config files cause `var_export()` fatal error
- Cache built with wrong `.env` values — production runs wrong config
- Stale cache after `.env` changes — old values persist until rebuild
- Permissions too permissive — secrets exposed to unauthorized processes

## Decision Points
- **Full optimize vs config:cache alone**: Use `config:cache` when only config changed; use full `optimize` for comprehensive deployments

## Performance Considerations
- Uncached: 20-50 file reads + PHP parsing + env resolution — 30-80ms per request
- Cached: single `require` — <1ms per request
- Config array size: 500KB-3MB, held in memory for request lifetime
- OpCache caches the compiled `config.php` — zero parse cost after first request

## Security Considerations
- `bootstrap/cache/config.php` contains all resolved secrets in plaintext
- Set filesystem permissions to 640 after cache generation
- Never commit cache file to version control
- Rotation of secrets (DB password, APP_KEY) requires cache rebuild
- CI/CD should use production-like `.env` values when generating cache

## Related Rules
- Use `config()` instead of `env()` in application code
- Wrap all `env()` calls inside config files only
- Keep config files pure and serializable
- Run `config:cache` in every production deployment
- Cache config before routes and events
- Protect `bootstrap/cache/config.php` with strict permissions
- Rebuild cache after environment variable rotation
- Never commit `bootstrap/cache/config.php` to version control

## Related Skills
- Cache Routes for Production
- Execute Optimize in Deployment Sequence

## Success Criteria
- Config loading reduced from 30-80ms to <1ms per request
- No `env()` calls exist outside `config/*.php`
- Cache rebuilds automatically after any `.env` or config change
- Secrets protected with restrictive file permissions
