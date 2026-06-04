# Skill: Cache Routes for Production

## Purpose
Compile all application routes into a serialized `CompiledUrlMatcher` file (`bootstrap/cache/routes.php`), eliminating 20-40ms of route registration overhead per request.

## When To Use
- Applications with 100+ routes — measurable bootstrap improvement in production
- Complex route groups with extensive middleware chains
- Octane or Vapor deployments where route registration cost is paid once per worker

## When NOT To Use
- Routes use Closures — convert to controller classes first
- Local development — route changes require cache rebuild
- Dynamic route registration (multi-tenant with per-tenant routes)

## Prerequisites
- All route handlers use controller class strings (no Closures)
- `php artisan config:cache` run first (config dependency)
- `php artisan route:list` confirms all routes resolve correctly
- `config:cache` completed (routes depend on resolved config)

## Inputs
- Route files: `routes/web.php`, `routes/api.php`, `routes/channels.php`, etc.
- Service providers that register routes in `boot()`
- Cached config file (`bootstrap/cache/config.php`)

## Workflow
1. Audit all routes for Closure handlers — replace with controller class strings
2. Replace `Route::get('/', fn() => view('...'))` with `Route::view()` or controller classes
3. Replace `Route::get('/old', fn() => redirect('/new'))` with `Route::redirect()`
4. Run `php artisan config:cache` (routes depend on resolved config)
5. Run `php artisan route:list` to verify all routes resolve without errors
6. Run `php artisan route:cache` to compile the serialized matcher
7. Verify routes still resolve correctly by checking `php artisan route:list`

## Validation Checklist
- [ ] `php artisan route:cache` completes without `LogicException`
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment script
- [ ] `php artisan route:list` output matches expected routes after caching
- [ ] New routes work after deployment (cache was rebuilt)
- [ ] Route cache regenerated after provider or middleware changes

## Common Failures
- Closure routes block caching entirely with `LogicException`
- `route:cache` without `config:cache` first — inconsistent URL defaults
- Dynamic/conditional route registration frozen at build time — routes missing
- Stale cache after route changes — old routes served, new ones return 404
- Provider changes without cache rebuild — routes from new providers not found

## Decision Points
- **Full optimize vs route:cache alone**: Use `route:cache` when only routes changed; use full `optimize` for comprehensive deployments
- **Dynamic routes via middleware**: Replace conditional route registration with middleware-based filtering for cache compatibility

## Performance Considerations
- Uncached: 20-40ms route registration overhead for 200+ routes
- Cached: zero registration overhead; URL matching ~1µs via compiled prefix tree
- Cache file: 200KB-1MB for 500 routes (includes compiled regex patterns)
- OpCache caches `routes.php` parse, but `unserialize()` still reconstructs objects

## Security Considerations
- Cached routes preserve original middleware and auth constraints
- Route caching does not bypass authentication — middleware runs at request time
- Ensure `route:cache` runs after any environment-conditional route registration
- Do not expose `bootstrap/cache/routes.php` publicly

## Related Rules
- Use controller strings instead of Closures for all routes
- Cache config before caching routes
- Validate all routes before caching
- Run `route:cache` in every production deployment
- Avoid dynamic route registration in cached applications
- Rebuild route cache after provider or middleware changes
- Use `Route::view()` and `Route::redirect()` instead of Closures
- Do not use route cache in development

## Related Skills
- Run Config Caching in Production Deployments
- Execute Optimize in Deployment Sequence

## Success Criteria
- Route registration overhead reduced from 20-40ms to 0ms
- No Closure routes exist in the codebase
- All routes cache successfully on every production deployment
- URL matching resolves correctly via compiled prefix tree
