# Skill: Cache Routes for Production

## Purpose
Compile all application routes into a serialized `CompiledUrlMatcher` file (`bootstrap/cache/routes.php`), eliminating 20-40ms of route registration overhead per request.

## When To Use
- Applications with 100+ routes in production — measurable bootstrap improvement
- Complex route groups and middleware chains
- Octane or Vapor deployments where route registration cost is paid once per worker

## When NOT To Use
- Routes use Closures — must convert to controller classes first
- Local development — route changes require cache rebuild
- Dynamic route registration (multi-tenant with per-tenant routes)

## Prerequisites
- All route handlers use controller class strings (no Closures)
- `php artisan config:cache` run first (routes depend on resolved config)
- `php artisan route:list` confirms all routes resolve without errors
- Service providers that register routes are properly configured

## Inputs
- Route files: `routes/web.php`, `routes/api.php`, etc.
- Route service providers
- Bootstrap configuration (for URL defaults and middleware resolution)

## Workflow
1. Audit all routes for Closure handlers — replace with controller class strings
2. Replace `Route::get('/', fn() => view('...'))` with `Route::view()` where possible
3. Replace `Route::get('/old', fn() => redirect('/new'))` with `Route::redirect()`
4. Run `php artisan config:cache` (routes depend on resolved configuration)
5. Run `php artisan route:list` to verify all routes resolve without errors
6. Run `php artisan route:cache` to compile the serialized matcher
7. Verify routes still resolve correctly after caching

## Validation Checklist
- [ ] `php artisan route:cache` completes without `LogicException`
- [ ] All route handlers are controller strings (no Closures)
- [ ] `config:cache` runs before `route:cache` in deployment script
- [ ] `php artisan route:list` output matches expected routes after caching
- [ ] New routes work correctly after deployment (cache was rebuilt)
- [ ] Route cache regenerated after provider or middleware changes

## Common Failures
- Closure routes block caching entirely with `LogicException`
- `route:cache` without `config:cache` first — wrong URL defaults in cached routes
- Dynamic/conditional route registration frozen at build time — routes missing for some tenants
- Stale cache after route changes — old routes served, new ones return 404
- Provider or middleware changes without cache rebuild — routes from new providers not found

## Decision Points
- **Closures vs controller strings**: Always use controllers for cacheable routes; Closures block caching entirely
- **Static vs dynamic routes**: Prefer fully static route definitions; handle tenant features via middleware for cache compatibility
- **Full optimize vs route:cache alone**: Use `route:cache` when only routes changed; use full `optimize` for comprehensive deployments

## Performance Considerations
- Uncached: 20-40ms route registration overhead for 200+ routes
- Cached: zero registration overhead; URL matching ~1µs via compiled prefix tree
- Cache file size: 200KB-1MB for 500 routes (includes compiled regex patterns)
- OpCache caches `routes.php` parse, but `unserialize()` still reconstructs objects

## Security Considerations
- Cached routes preserve original middleware and auth constraints — auth still runs at runtime
- Route caching does not bypass authentication — middleware executes per request
- Ensure `route:cache` runs after any environment-conditional route registration
- Route cache does not expose routes to unauthorized users

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
- Route registration overhead reduced from 20-40ms to 0ms per request
- No Closure routes exist in the codebase
- All routes cache successfully on every production deployment
- URL matching resolves correctly via compiled prefix tree
