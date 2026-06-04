# Skill: Configure Middleware Pipeline via Kernel

## Purpose
Register and prioritize middleware (global, group, route) in the kernel using the appropriate configuration API for the Laravel version (class properties for 10-, fluent API for 11+).

## When To Use
- Adding a new middleware to the application
- Configuring middleware groups (web, api)
- Setting middleware priority
- Removing unused framework middleware
- Migrating between Laravel versions

## When NOT To Use
- Implementing middleware logic (create dedicated middleware classes)
- For business logic or service registration (use service providers)
- For route definitions (use route files)

## Prerequisites
- Laravel version knowledge (10- uses Kernel class, 11+ uses fluent API)
- Understanding of middleware pipeline order (global → group → route)
- Each middleware class must exist and be autoloadable

## Inputs
- List of middleware classes to register
- Registration level for each (global, group, or route-alias)
- Desired execution priority
- Laravel version of the project

## Workflow
1. Determine Laravel version:
   - **10-**: modify `app/Http/Kernel.php` properties
   - **11+**: modify `bootstrap/app.php` with `->withMiddleware()` fluent API
2. For each middleware:
   a. Create the middleware class if not already created
   b. Register it in exactly one location (global, group, or alias — never duplicate)
3. Define middleware priority:
   - **10-**: set `$middlewarePriority` array in Order property
   - **11+**: use `$middleware->priority([...])` in the fluent API
4. Remove any unused framework middleware (e.g., API-only apps remove `EncryptCookies`, `StartSession`)
5. Run `php artisan route:cache` to regenerate route cache
6. Verify middleware order with `php artisan route:list` or `php artisan middleware:list`

## Validation Checklist
- [ ] Each middleware class is registered in exactly one location
- [ ] No middleware appears in both global and group registration (no duplication)
- [ ] Middleware priority is explicitly defined (not relying on framework defaults)
- [ ] Unused framework middleware is removed (API-only: remove cookie/session/CSRF)
- [ ] Custom middleware classes are testable and have no business logic in the kernel
- [ ] `withoutMiddleware()` is never used in production code paths
- [ ] Middleware order is verified after framework upgrades

## Common Failures
- Registering the same middleware in both global and group — runs twice per request
- Not defining explicit priority — middleware may run in unexpected order after version upgrade
- Using `withoutMiddleware()` in production — removes security middleware from routes
- Forgetting to update middleware configuration after Laravel version upgrade — API changes between versions

## Decision Points
- Global vs group vs alias? Global for security/infrastructure that applies to all routes; group for domain-specific (web/api); alias for per-route application
- Explicit priority or framework default? Explicit priority when custom middleware must run between framework middleware

## Performance Considerations
- Every global middleware runs on every request — remove unused framework middleware for API-only apps
- Middleware pipeline adds ~0.1-0.5ms per middleware
- Route caching eliminates route registration overhead from kernel bootstrap

## Security Considerations
- Middleware registration order determines the security perimeter — auth before authorization, session before CSRF
- `withoutMiddleware()` bypasses all middleware including auth — never use in production
- After Laravel version upgrades, verify middleware priority — framework may reorder middleware
- Remove unused framework middleware to avoid unexpected behavior in API contexts

## Related Rules
- Never Put Business Logic in Kernel Classes (05-rules.md)
- Enable All Caches in Production (05-rules.md)
- Keep Middleware Priority Explicit (05-rules.md)
- Never Duplicate Middleware Across Registration Points (05-rules.md)
- Validate Middleware Order After Framework Upgrades (05-rules.md)
- Remove Unused Framework Middleware (05-rules.md)
- Never Use withoutMiddleware() in Production (05-rules.md)

## Related Skills
- Skill: Configure Application via Fluent API
- Skill: Optimize Bootstrap Performance

## Success Criteria
- Middleware is registered at the correct level (global, group, or alias)
- No middleware duplication exists
- Middleware priority is explicitly configured
- Unused framework middleware is removed for the application's context
- Middleware order is verified and correct after any version upgrade
