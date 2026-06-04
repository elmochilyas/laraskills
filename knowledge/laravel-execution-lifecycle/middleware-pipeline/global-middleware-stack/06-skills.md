# Skill: Configure Global Middleware Stack

## Purpose
Add, remove, reorder, and audit middleware in the global stack that applies to every HTTP request, ensuring infrastructure concerns are handled without unnecessary overhead.

## When To Use
- Adding infrastructure middleware (CORS, trust proxies, maintenance mode)
- Removing unnecessary defaults for API-only or specialized applications
- Debugging middleware ordering issues that affect all routes
- Optimizing by moving session/cookie middleware from global to group level

## When NOT To Use
- When middleware only applies to specific routes (use group or route middleware)
- When you are not sure if the middleware should be global (always prefer more specific)
- For application-level business logic

## Prerequisites
- Laravel 11+ project with `bootstrap/app.php` or Laravel <11 with `App\Http\Kernel`
- Understanding of which middleware needs to run on every request

## Inputs
- Middleware classes to add (FQCN)
- Middleware classes to remove (FQCN)
- Desired execution order (dependency-based)

## Workflow
1. Audit existing global middleware with `php artisan route:list -v` on any route
2. Identify which middleware must run on every request (maintenance mode, trust proxies, CORS)
3. Identify which middleware should be moved to a group (session, cookies for API-only apps)
4. Open `bootstrap/app.php` and locate the `->withMiddleware()` callback
5. Add infrastructure middleware with `$middleware->append(\App\Http\Middleware\YourMiddleware::class)`
6. Add middleware that must run before all others with `$middleware->prepend(...)`
7. Remove unnecessary defaults with `$middleware->remove(\Illuminate\Session\Middleware\StartSession::class)`
8. Run `php artisan route:list -v` to verify the new global stack composition
9. Run `php artisan optimize` to cache configuration

## Validation Checklist
- [ ] Global stack contains only infrastructure middleware
- [ ] No session/cookie middleware in global for API-only apps
- [ ] Trust proxies run before IP-dependent middleware
- [ ] Maintenance mode middleware blocks before any processing
- [ ] `route:list -v` shows correct global middleware on test route
- [ ] Configuration cached with `php artisan optimize`

## Common Failures
- Adding DB-dependent middleware globally (health checks fail when DB is down)
- Adding application middleware globally when it should be group-specific
- Not re-caching after changes (stale config in production)
- Removing `EncryptCookies` globally without understanding session dependency

## Decision Points
- Does every single request need this middleware? -> If no, use group or route middleware
- Is this infrastructure (security, normalization) or application logic? -> Infrastructure goes global
- Could this middleware fail in a way that takes down health checks? -> If yes, don't make it global

## Performance Considerations
- Global middleware affects 100% of traffic, including health checks and webhooks
- Session I/O in global stack wastes resources on stateless API routes
- Each global middleware adds ~0.1-0.5ms pipeline resolution overhead
- Bug in global middleware takes down the entire application

## Security Considerations
- Global middleware is non-bypassable by route configuration
- `withoutMiddleware()` on a route does NOT bypass global middleware
- Only explicit removal from the global stack removes it
- Order matters: trust proxies must run before IP-dependent middleware

## Related Rules
- Add Middleware at the Most Specific Level Possible
- Audit Default Global Middleware Before Production
- Order Global Middleware by Infrastructure Dependency
- Do Not Add Heavy or Service-Dependent Middleware to the Global Stack

## Related Skills
- Audit Default Middleware Composition
- Create and Manage Middleware Groups
- Configure Middleware in Bootstrap

## Success Criteria
- Global stack contains only necessary infrastructure middleware
- No application-specific middleware in global stack
- All routes benefit from or are not harmed by global middleware
- Health checks and monitoring endpoints remain functional
