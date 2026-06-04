# Skill: Create and Manage Middleware Groups

## Purpose
Define custom middleware groups and modify default groups to organize middleware by route type, ensuring routes receive the correct middleware without duplication or unnecessary overhead.

## When To Use
- Creating distinct route types (admin panel, SPA, tenant-specific, API version)
- Moving session/cookie middleware out of API routes
- Reusing a middleware set across multiple routes without repeating
- Separating concerns between stateful (web) and stateless (API) routes

## When NOT To Use
- For infrastructure middleware that must run on every request (use global stack)
- For middleware that applies only to a single route (use route-level)
- When the default web/api groups already satisfy your needs

## Prerequisites
- Laravel 11+ project with `bootstrap/app.php`
- Route files already mapped to groups
- Clear understanding of which middleware belongs together

## Inputs
- Group name (e.g., `'admin'`, `'tenant'`)
- Middleware class list (FQCNs and/or aliases)
- Routes that should use the group

## Workflow
1. Identify route types that share middleware requirements (admin, SPA, public API, internal)
2. Open `bootstrap/app.php` and locate `->withMiddleware(function (Middleware $middleware) { ... })`
3. Define custom groups with `$middleware->group('admin', ['auth', 'verified', \App\Http\Middleware\LogActions::class])`
4. Modify default `web` group only if every web route needs the change: `$middleware->web(append: [\App\Http\Middleware\Localize::class])`
5. Modify default `api` group similarly: `$middleware->api(prepend: ['throttle:100,1'])`
6. Assign routes to groups: `Route::middleware('admin')->group(function () { ... })`
7. Verify group expansion with `php artisan route:list -v` on a route in the group
8. Check that no middleware is duplicated across groups applied to the same route

## Validation Checklist
- [ ] Custom groups defined for distinct route types, not modifying defaults
- [ ] Group name follows lowercase, hyphenated convention
- [ ] `route:list -v` shows expanded middleware list correctly
- [ ] No middleware duplication across combined groups
- [ ] API routes are in `routes/api.php`, web routes in `routes/web.php`
- [ ] Group nesting limited to one level

## Common Failures
- Placing API routes in `routes/web.php` (gains CSRF and session middleware unexpectedly)
- Adding middleware to default groups that should be in a custom group
- Deeply nesting groups (groups referencing groups referencing groups)
- Duplicating middleware across groups applied to the same route

## Decision Points
- Modify default group or create custom? -> Custom unless every route in the default group needs it
- Group or route-level middleware? -> Group if 2+ routes share it; route-level if one-off
- Nest groups or keep flat? -> Keep flat; one level of nesting maximum

## Performance Considerations
- Group expansion happens once per request during route matching
- Route caching serializes expanded lists (eliminates runtime expansion)
- Each additional group adds marginal memory for middleware list storage

## Security Considerations
- Wrong group assignment: API routes in `routes/web.php` get CSRF protection (419 errors on POST)
- Undefined group name throws `InvalidArgumentException`
- Groups can obscure which middleware actually runs (always verify with `route:list -v`)

## Related Rules
- Keep Routes in Their Correct File Based on Group Mapping
- Create Custom Groups for Distinct Route Types Instead of Modifying Defaults
- Verify Group Middleware Expansion with `route:list -v`
- Do Not Deeply Nest Groups Within Groups
- Do Not Use the Same Middleware in Multiple Groups Without Coordination

## Related Skills
- Configure Middleware in Bootstrap
- Assign Route Middleware Correctly
- Configure Global Middleware Stack

## Success Criteria
- All route types have appropriately named groups
- No unnecessary middleware runs on any route type
- Admin/SPA/tenant routes have their own groups, not modifications to defaults
- `route:list -v` on any route shows exactly the expected middleware stack
