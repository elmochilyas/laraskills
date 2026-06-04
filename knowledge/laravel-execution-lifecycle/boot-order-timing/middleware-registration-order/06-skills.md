# Skill: Order Middleware for Correct Request Processing

## Purpose
Configure global, group, and route middleware in the correct execution order — respecting dependency direction, security requirements, and Laravel's three-phase pipeline (global → group → route).

## When To Use
- Setting up middleware configuration in a new Laravel application (Laravel 11+ `bootstrap/app.php` or legacy HTTP Kernel)
- Adding new middleware that depends on or modifies request state
- Debugging middleware order issues (auth not available, CORS preflight failures, model binding not resolved)
- Migrating middleware configuration between Laravel versions

## When NOT To Use
- For route-specific concerns that should not run globally — use route middleware instead
- For reordering framework-provided middleware arbitrarily — the default order is designed for correct operation
- For middleware that is handled at the web server level (Nginx CORS, Apache rewrite)

## Prerequisites
- Understanding of the three-phase middleware pipeline (global → group → route)
- Knowledge of which middleware types modify vs. read request state
- Familiarity with `SubstituteBindings` and its role in model binding

## Inputs
- Current middleware configuration (Laravel 11+ `bootstrap/app.php` or legacy `Http\Kernel` properties)
- List of new middleware to add and their requirements
- Route definitions that reference middleware

## Workflow
1. Identify which middleware is truly global (must run on every route) vs. group-specific (web/api) vs. route-specific
2. Move non-global middleware out of the global list into the appropriate group or route definitions
3. Order middleware by dependency: middleware that modifies request state must run before middleware that reads it
4. Ensure `SubstituteBindings` runs before any custom middleware that accesses resolved models
5. Position CORS middleware before auth middleware to handle OPTIONS preflight requests correctly
6. Define short, descriptive middleware aliases for cleaner route definitions
7. Audit the global middleware list — keep it under 10 entries; prefer group middleware for scoped concerns
8. For Laravel 11+, configure middleware in `bootstrap/app.php` using `->withMiddleware()`
9. Test middleware order by adding temporary logging or using Telescope's middleware profiling

## Validation Checklist
- [ ] Global middleware list is minimal and truly necessary for all routes
- [ ] Group middleware order respects dependency direction (modifiers before readers)
- [ ] `SubstituteBindings` runs before custom middleware that uses route model binding
- [ ] CORS middleware runs before auth middleware (for OPTIONS preflight handling)
- [ ] Middleware aliases are documented and consistently used
- [ ] No route-specific middleware is registered globally
- [ ] Auth middleware runs before any middleware that exposes user data

## Common Failures
- CORS middleware after auth middleware — OPTIONS preflight fails because auth rejects before CORS headers are set
- `SubstituteBindings` after custom middleware that accesses `$request->route('user')` — receives raw ID instead of model
- Registering route-specific middleware globally — every request pays overhead for middleware that only serves some routes
- Wrong group assignment — auth-required middleware in `api` group without `auth:api` middleware in the stack

## Decision Points
- Use global middleware for truly cross-cutting concerns (trust proxies, maintenance mode detection)
- Use group middleware for pipeline segments (web: session/cookies/CSRF; api: throttle/auth)
- Use route middleware for single-route concerns (specific permissions, feature flags)
- If middleware order frequently causes issues, document the expected order in the middleware configuration

## Performance Considerations
- Each middleware adds ~10-50µs per request for resolution and execution
- Global middleware runs on EVERY request — keep this list minimal
- Route middleware runs only on matched routes — use for expensive operations
- Middleware that makes external calls (API auth, rate limiting) dominates request time
- Under Octane, middleware resolution costs are paid per request (not amortized like boot)

## Security Considerations
- Auth middleware must run before middleware that exposes user data
- CORS middleware must handle OPTIONS preflight before auth runs
- CSRF protection must run after session start and before state-modifying controllers
- Rate limiting middleware should wrap auth to prevent unauthenticated requests from consuming rate limits
- Validate that substitute bindings don't expose unauthorized model instances

## Related Rules
- Middleware Registration Order Rule 1: Place Global Middleware Minimally
- Middleware Registration Order Rule 2: Order Middleware by Dependency Direction
- Middleware Registration Order Rule 6: Validate CORS Middleware Position

## Related Skills
- Order Routes Correctly for First-Match Routing (ku-07-route-registration-order)
- Configure Event Listener Order and Registration (ku-08-event-listener-registration-order)
- Order Service Providers by Dependency (ku-02-provider-registration-order)

## Success Criteria
- Global middleware list contains only 3-5 truly global entries
- All middleware respects dependency direction (modifiers before readers)
- CORS preflight requests succeed without authentication
- Custom middleware accessing route models always receives resolved model instances
- Middleware aliases are used consistently in route definitions
