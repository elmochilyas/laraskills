# Skill: Resolve Middleware and Route Binding Ordering

## Purpose
Ensure custom middleware that accesses route model bindings runs after `SubstituteBindings` to avoid null-reference errors and to place auth middleware before binding for performance optimization.

## When To Use
- Creating middleware that inspects or uses route model bindings (`$request->route('user')`)
- Adding authorization middleware that accesses bound models
- Building multi-tenant middleware that resolves the tenant from a route parameter
- Debugging "Call to a member function on null" errors in middleware

## When NOT To Use
- For middleware that only inspects headers, IP, or method (no binding dependency)
- For authentication-only middleware (should run before binding)
- For request normalization middleware (TrimStrings, ConvertEmptyStringsToNull)

## Prerequisites
- Middleware that accesses route model bindings
- Understanding of where `SubstituteBindings` runs in the default priority
- Route definitions with bound parameters (`{user}`, `{post}`, etc.)

## Inputs
- Custom middleware class that accesses route parameters
- Route binding parameter names
- Desired ordering (before or after `SubstituteBindings`)

## Workflow
1. Identify whether your middleware needs models (after binding) or raw IDs (before binding)
2. If middleware needs models:
   a. Add `SubstituteBindings` before your middleware in the group array
   b. Or add your middleware after `SubstituteBindings` in the priority list
3. If middleware does NOT need models (auth validation):
   a. Place it before `SubstituteBindings` to skip model loading on rejected requests
4. Open `bootstrap/app.php` and update group or priority ordering accordingly
5. For priority-based ordering: `$middleware->priority([\Illuminate\Routing\Middleware\SubstituteBindings::class, \App\Http\Middleware\YourMiddleware::class])`
6. For group-based ordering: place your middleware after `SubstituteBindings` in the array
7. Run `php artisan route:list -v` and verify the resolved order
8. Test with both authenticated and unauthenticated requests
9. Test that `$request->route('param')` returns a model (not a string ID) in your middleware

## Validation Checklist
- [ ] Binding-aware middleware runs after `SubstituteBindings`
- [ ] Auth middleware runs before `SubstituteBindings` for performance
- [ ] `$request->route('param')` returns a model instance in middleware
- [ ] Tested with authenticated request (model bound)
- [ ] Tested with unauthenticated request (auth rejects before binding)
- [ ] `can:update,post` authorization middleware receives bound model
- [ ] No manual binding resolution in middleware (order fix instead)

## Common Failures
- Adding resource-check middleware before `SubstituteBindings` (receives string ID)
- Not verifying with `route:list -v` (invisible ordering issue)
- Assuming all middleware has access to bound models
- Manually resolving bindings in middleware instead of fixing order
- Placing auth middleware after binding (wastes DB queries on rejected requests)

## Decision Points
- Does the middleware need model instances or raw IDs? -> Model: after binding; Raw: before binding
- Is this ordering needed globally or per-group? -> Global: priority; Per-group: array order
- Auth or resource check? -> Auth before binding; Resource check after binding

## Performance Considerations
- Auth before binding = unauthenticated requests skip model loading (saves DB queries)
- Each bound parameter triggers at least one DB query
- Priority sorting happens every request but is negligible cost

## Security Considerations
- Accessing `$request->route('param')` before binding returns raw string ID
- Calling model methods on a string ID throws fatal error
- `can:update,post` before binding always fails (model is null)
- Unauthenticated requests skip binding entirely when auth is before binding

## Related Rules
- Place Model-Accessing Middleware After `SubstituteBindings` in the Group Array
- Never Assume `$request->route('param')` Is a Model Instance
- Keep Auth Middleware Before `SubstituteBindings` for Performance
- Test Binding-Aware Middleware with Both Authenticated and Unauthenticated Requests
- Do Not Manually Resolve Bindings in Middleware -- Fix the Order Instead
- Place Authorization (`can:`) Middleware After, Not Before, `SubstituteBindings`

## Related Skills
- Configure Middleware Priority
- Create and Manage Middleware Groups
- Implement Parameterized Middleware

## Success Criteria
- Binding-aware middleware correctly receives model instances
- Auth middleware rejects before model loading (performance optimization)
- No "Call to a member function on string" errors in middleware
- Both authenticated and unauthenticated request paths work correctly
