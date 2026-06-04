# Skill: Choose the Correct Registration Tier for Middleware

## Purpose

Determine the appropriate registration tier (global, group, or route-level) for each middleware concern, minimizing execution overhead and ensuring correct behavior.

## When To Use

When registering any new middleware, during architecture review of existing middleware registration, or when migrating middleware between tiers.

## When NOT To Use

Infrastructure concerns (TrustedProxies, HandleCors, PreventRequestsDuringMaintenance) have no restrictive-tier alternative — they must be global.

## Prerequisites

- Understanding of the three registration tiers
- Knowledge of the middleware's concern and data requirements

## Inputs

- Middleware class
- Description of which routes need the middleware

## Workflow

1. Determine if the middleware must run before routing (trusted proxies, CORS, maintenance mode) — if yes, register globally
2. Determine if the middleware needs route context (matched route, parameters, model bindings) — if yes, do NOT register globally
3. If the middleware applies to all routes in a collection (e.g., all admin routes, all API routes), register at the group level
4. If the middleware applies to individual routes with varying configurations, register at the route level
5. Never register at a broader tier than necessary — global middleware runs on health checks, assets, and OPTIONS preflight

## Validation Checklist

- [ ] Middleware does NOT need route context but is registered globally — verify `$request->route()` is not used
- [ ] Global middleware is infrastructure-only (TrustedProxies, HandleCors, TrimStrings, RequestId)
- [ ] Group middleware covers a route collection (web, api, admin, etc.)
- [ ] Route-level middleware is used for per-endpoint configuration
- [ ] No middleware registered globally that queries the database or performs I/O

## Common Failures

- Auth or role-checking middleware registered globally — cannot access route context
- Database-querying middleware registered globally — adds load to health checks and 404 pages
- Session middleware applied to API routes — adds unnecessary overhead to stateless requests
- `web` group applied to API routes — session and CSRF middleware run on every API call

## Decision Points

- If middleware needs to run on most but not all routes, create a custom group instead of registering globally
- If middleware is needed on a single route, use route-level middleware, not group-level

## Performance Considerations

Global middleware runs on EVERY request including static assets and health checks. A globally registered database query adds 2-10ms to every request. Route-level middleware only runs on matched routes.

## Security Considerations

The additive-only constraint is a safety feature — once registered at a higher tier, the middleware always runs. `withoutMiddleware()` only works on named route middleware, not global or group middleware.

## Related Rules

- Register Middleware at the Most Restrictive Tier (global-route-group-middleware:5)
- Do Not Register Global Middleware That Requires Route Context (global-route-group-middleware:5)
- Do Not Apply the Web Group to API Routes (global-route-group-middleware:5)
- Register Cross-Cutting Concerns at the Most Restrictive Tier (cross-cutting-concerns:5)

## Related Skills

- Modify Default Middleware Groups Without Full Replacement
- Maintain a Documented Middleware Inventory

## Success Criteria

Every middleware is registered at the narrowest tier that covers all required routes. Global middleware contains only infrastructure concerns. Group and route middleware have route context available.

---

# Skill: Modify Default Middleware Groups Without Full Replacement

## Purpose

Add, prepend, or remove middleware from default groups (web, api) in Laravel 11+ using targeted modification methods, preserving all default middleware for future framework upgrades.

## When To Use

When adding custom middleware to the `web` or `api` group, removing default middleware from a group, or prepending middleware before existing group middleware.

## When NOT To Use

When defining a completely custom group with no connection to default groups — use `$middleware->group('custom-name', [...])`.

## Prerequisites

- Laravel 11+ application using `bootstrap/app.php`
- Knowledge of which default middleware exists in `web` and `api` groups

## Inputs

- Middleware to add or remove
- Target group name (web or api)

## Workflow

1. Identify the target group — `web` for stateful routes, `api` for stateless routes
2. To add middleware at the end: `$middleware->web(append: [CustomMiddleware::class])`
3. To add middleware at the beginning: `$middleware->web(prepend: [CustomMiddleware::class])`
4. To remove middleware: `$middleware->web(remove: [SomeMiddleware::class])`
5. To modify multiple groups, chain calls: `$middleware->web(append: [...])->api(prepend: [...])`
6. Avoid `$middleware->group('web', [...])` full replacement — it drops all unspecified default middleware

## Validation Checklist

- [ ] `$middleware->web(append: [...])` used instead of `$middleware->group('web', [...])`
- [ ] Default middleware (EncryptCookies, StartSession, CSRF, SubstituteBindings) are NOT accidentally removed
- [ ] Group modification is documented in code comments
- [ ] After upgrade to new Laravel version, verify group modifications still work

## Common Failures

- Using `$middleware->group('web', [...])` with a partial list — CSRF, session, or other security middleware is omitted
- Removing CSRF from the web group globally because one route needs it disabled — affects all routes
- Forgetting that `$middleware->group('web', [...])` replaces the entire group, including future default additions

## Decision Points

- If the application intentionally removes default middleware (e.g., no session in a stateless app), use full replacement and document all omissions
- If a single route needs different middleware, use `->withoutMiddleware()` at the route level, not group removal

## Performance Considerations

Group modification has zero runtime overhead — it is resolved at bootstrap time. The performance impact comes from the middleware itself, not the modification method.

## Security Considerations

Full group replacement that omits CSRF, session, or other security middleware creates vulnerabilities on web routes. Always use `append`/`prepend`/`remove` for targeted changes.

## Related Rules

- Use Group Modification Instead of Full Group Replacement (global-route-group-middleware:5)
- Never Remove Middleware from a Higher Tier at a Lower Tier (global-route-group-middleware:5)
- Keep Nested Route Groups Flat to Limit Inherited Middleware (global-route-group-middleware:5)

## Related Skills

- Choose the Correct Registration Tier for Middleware
- Document Custom Middleware Groups

## Success Criteria

Default groups are modified via `append`/`prepend`/`remove` methods. Full group replacement is not used unless intentionally removing defaults with documented justification. All default middleware is preserved.
