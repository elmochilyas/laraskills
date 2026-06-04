# Skill: Configure Middleware Priority

## Purpose
Set the execution order of middleware from different sources (global, group, route) to satisfy dependency chains without modifying group arrays or disrupting unrelated routes.

## When To Use
- Custom middleware depends on framework middleware (session, auth, SubstituteBindings)
- Middleware from different sources must execute in a specific relative order
- Adding middleware that accesses route model bindings (must run after SubstituteBindings)
- Resolving ordering conflicts from multi-source middleware merging

## When NOT To Use
- When all middleware comes from the same array (order the array directly)
- For trivial applications with few middleware
- As a crutch for messy group array ordering (fix the arrays first)
- For route-group-specific ordering (priority is global -- affects all routes)

## Prerequisites
- Laravel 11+ project with `bootstrap/app.php`
- Understanding of the default priority dependency chain
- Custom middleware that needs ordering constraints

## Inputs
- Custom middleware class FQCN
- Framework middleware it must run before or after
- Position in the priority list

## Workflow
1. Study the default priority list: `EncryptCookies` -> `AddQueuedCookiesToResponse` -> `StartSession` -> `ShareErrorsFromSession` -> `Authenticate` -> `Authorize` -> `SubstituteBindings`
2. Identify where your custom middleware fits in the dependency chain (before or after which framework middleware)
3. Open `bootstrap/app.php` and locate `->withMiddleware(function (Middleware $middleware) { ... })`
4. Add your middleware to the priority list with `$middleware->priority([...])`
5. Only add your custom middleware entries -- do not repeat or reorder default entries
6. Ensure middleware that accesses route bindings appears AFTER `SubstituteBindings`
7. Ensure auth-dependent middleware appears AFTER `Authenticate`
8. Add priority in the same commit/deploy as middleware registration
9. Run `php artisan route:list -v` and verify the execution order
10. Test that priority change affects all routes as expected

## Validation Checklist
- [ ] Default priority entries are preserved (not reordered or removed)
- [ ] Custom middleware position respects framework dependency chain
- [ ] Middleware accessing route bindings is after `SubstituteBindings`
- [ ] Auth-dependent middleware is after `Authenticate`
- [ ] Priority added in same change as middleware registration
- [ ] `route:list -v` shows correct order
- [ ] No circular priority dependencies exist

## Common Failures
- Reordering default priority entries (breaks framework middleware ordering)
- Adding middleware to priority list in a separate deploy from registration
- Assuming priority is per-route-group (it's global -- affects all routes)
- Creating circular priority dependencies (A before B, B before A)
- Using priority to fix ordering that should be resolved in group arrays

## Decision Points
- Use priority or group array ordering? -> Group array if same source; priority if cross-source
- Does the ordering need apply to every route? -> If not, prefer group array ordering
- Before or after `SubstituteBindings`? -> After if accessing route models; before if not

## Performance Considerations
- Priority sorting is O(n*m) where n = middleware count, m = priority array size
- Sorting happens every request (not cached) but cost is negligible (~microseconds)
- Algorithm uses C-optimized PHP array functions (`array_intersect`, `array_diff`, `array_merge`)

## Security Considerations
- Missing priority entry can cause middleware to run before its dependencies
- Auth before session means no authenticated user
- Authorization before binding means null models
- Stale priority list (middleware removed but entry remains) is harmless but misleading

## Related Rules
- Use Priority Sparingly -- Prefer Group Array Ordering First
- Always Place Middleware That Depends on Route Bindings After `SubstituteBindings`
- Never Remove or Reorder Default Priority Entries -- Only Extend
- Add Middleware to the Priority List at the Same Time as Registration
- Understand That Priority Affects All Routes Globally
- Audit the Priority List During Framework Upgrades
- Do Not Create Circular Priority Dependencies

## Related Skills
- Configure Middleware in Bootstrap
- Create and Manage Middleware Groups
- Resolve Middleware and Route Binding Ordering

## Success Criteria
- Custom middleware runs in correct order relative to framework middleware
- Default priority is unchanged
- Priority list is small and only contains middleware with cross-source ordering needs
- All routes execute middleware in the expected order
