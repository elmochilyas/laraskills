# Skill: Assign Route Middleware Correctly

## Purpose
Attach middleware to routes using inline definitions, route groups, and controller methods with correct ordering, avoiding duplication and ensuring proper resolution.

## When To Use
- Protecting specific routes with auth, throttle, or custom middleware
- Grouping routes that share common middleware
- Applying middleware to specific controller methods with `only`/`except`
- Adding route-specific middleware that is not in the group or global stack

## When NOT To Use
- For infrastructure middleware that must run on every request (use global stack)
- For middleware shared across many routes (use groups instead)
- For middleware that is already in the route's group (would duplicate)
- For closure middleware on routes that will be cached

## Prerequisites
- Route definitions (inline or grouped)
- Middleware aliases registered in `bootstrap/app.php`
- Understanding of the three middleware assignment levels (global, group, route)

## Inputs
- Route URI and handler
- Middleware alias or FQCN to apply
- Method filter (for resource controllers)

## Workflow
1. Determine which middleware source is appropriate: global (infrastructure), group (shared), or route (specific)
2. For shared middleware across multiple routes, create a route group: `Route::middleware(['auth', 'verified'])->group(...)`
3. For route-specific middleware, use inline: `Route::get('/admin', ...)->middleware('throttle:10,1')`
4. For resource controller method filtering: `$this->middleware('auth')->except(['index', 'show'])`
5. Prefer inline over controller middleware for new code
6. Use FQCN or aliases consistently (prefer aliases for readability)
7. Avoid closure middleware on routes that will be cached
8. Verify resolved stack with `php artisan route:list -v`
9. Check for middleware duplication across group and route levels

## Validation Checklist
- [ ] Middleware assigned at correct level (global, group, or route)
- [ ] No duplication of group middleware on individual routes
- [ ] Inline middleware used for new code (not controller constructor)
- [ ] Closure middleware not used on production routes
- [ ] `route:list -v` shows expected resolved middleware stack
- [ ] `only`/`except` correctly targets intended controller methods
- [ ] Infrastructure middleware not assigned at route level

## Common Failures
- Duplicating group middleware on individual routes (runs twice)
- Using closures for middleware in production (breaks route caching)
- Hiding middleware in controller constructors (invisible in route files)
- Typo in `only`/`except` method name (middleware applies to wrong method)
- Forgetting that infrastructure middleware (CORS) should be global, not route-level

## Decision Points
- Inline or controller middleware? -> Inline for visibility; controller for resource method filtering
- Group or individual? -> Group if 2+ routes share middleware; individual for one-offs
- Alias or FQCN? -> Alias for readability; FQCN for clarity in groups

## Performance Considerations
- Route caching serializes route middleware definitions (no per-request resolution)
- Closure middleware cannot be cached (avoids on production routes)
- Controller middleware resolved via reflection per-request (marginal overhead)
- Route caching with aliases resolves them at cache time

## Security Considerations
- Middleware duplication doubles execution time
- Hidden controller middleware is invisible in `route:list` output
- Alias not found throws `InvalidArgumentException` (prevents silent bypass)
- Priority conflicts when route middleware reorders relative to group/global

## Related Rules
- Prefer Inline Middleware Over Controller Constructor Middleware
- Use `only`/`except` Instead of Applying Middleware to Each Controller Method
- Avoid Closure Middleware on Production Routes
- Verify the Full Resolved Middleware Stack with `route:list -v`
- Do Not Duplicate Group Middleware on Individual Routes
- Use Route Groups for Middleware Shared Across Multiple Routes
- Do Not Add Infrastructure Middleware at the Route Level

## Related Skills
- Register and Use Middleware Aliases
- Create and Manage Middleware Groups
- Resolve Middleware and Route Binding Ordering

## Success Criteria
- All routes have the correct middleware at the correct assignment level
- No middleware duplication on any route
- `route:list -v` output matches expectations
- Route caching works without issues
- Infrastructure middleware remains in global stack, not on individual routes
