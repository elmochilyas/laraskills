# Middleware Priority

## Metadata
- **ID:** ku-08-middleware-priority
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Middleware Pipeline
- **Last Updated:** 2026-06-02

## Overview
Middleware priority controls the execution order of middleware classes when they belong to different sources (global, group, route) but must run in a specific sequence. Laravel's `$middlewarePriority` array (and the `priority()` method in Laravel 11) defines an ordering guarantee that overrides natural sorting. This ensures that certain middleware (e.g., session, cookie) always runs before dependent middleware (e.g., auth, CSRF). Priority is the mechanism that resolves ordering conflicts from multi-source middleware merging.

## Core Concepts
- **Multi-Source Problem**: Middleware comes from global, group, and route sources. The merge order (global → group → route) doesn't guarantee correct execution dependencies.
- **Priority Array**: Each entry must run before all entries that follow it. Middleware not in the array retains its original relative order (stable sort).
- **sortMiddleware() Algorithm**: Uses `array_intersect()` and `array_diff()` to extract priority-ordered items and merge them back. This is a stable sort with a global override.
- **Default Priority**: Ensures `EncryptCookies` → `StartSession` → `ShareErrorsFromSession` → `Authenticate` → `SubstituteBindings` — the dependency chain for Laravel's default middleware.

## When To Use
- **Middleware with dependencies**: When middleware A must run before middleware B (session before auth, cookie before session).
- **Custom middleware depending on framework middleware**: Your middleware needs a resolved authenticated user — must run after `Authenticate`.
- **Resolving ordering conflicts**: When merging middleware from different sources produces wrong execution order.
- **Package middleware ordering**: Third-party middleware may need to run at a specific point in the stack.

## When NOT To Use
- **Single-source middleware**: If all middleware comes from the same array (e.g., all in global), order the array correctly instead.
- **Trivial applications**: With 5 or fewer middleware, explicit array ordering is simpler.
- **Overriding default priority without understanding**: Changing default priority can break framework middleware ordering.
- **Route-group-specific ordering**: Priority is global — affects all routes. Cannot prioritize differently per route group.

## Best Practices (WHY)
- **Use priority sparingly**: Most ordering needs can be solved by correctly ordering entries in group arrays. Priority is a global override. *Why: Priority affects every route — changing it for one route's needs affects all other routes unnecessarily.*
- **Place custom middleware relative to SubstituteBindings**: If your middleware accesses route model bindings, ensure it runs after `SubstituteBindings`. *Why: Middleware before SubstituteBindings receives raw route parameters (IDs), not model instances — a common source of null reference errors.*
- **Keep the priority list in source control and review during upgrades**: Framework updates may add new middleware that needs priority positioning. *Why: An outdated priority list can cause subtle ordering bugs that are hard to trace — the middleware runs, just in the wrong order.*
- **Prefer explicit group ordering over priority**: Adding middleware to the correct position in a group array is simpler and more localized than adding it to the global priority list. *Why: Group ordering is visible in the group definition; priority is a separate list that's easy to forget or misconfigure.*

## Architecture Guidelines
- **Priority Queue pattern**: Middleware reordered based on a global priority list.
- **Stable Sort**: Non-priority middleware retains original relative ordering — adding priority for a subset doesn't disrupt overall ordering.
- **Dependency Inversion**: Priority inverts the natural merge order to place prerequisites first.
- **Global override, not per-route**: Cannot have different priority per route group — a known limitation.

## Performance
- **Priority sorting**: O(n*m) where n = middleware count, m = priority array size. For typical stacks (<30 middleware), this is microseconds.
- **Algorithm operations**: Uses `array_intersect()`, `array_diff()`, and `array_merge()` — all C-optimized in PHP.
- **Route caching**: Does not pre-sort by priority — sorting happens every request. Sorting cost is negligible.
- **No memory allocation**: Sorting operates on existing arrays — no significant memory impact.

## Security
- **Missing priority entry**: Middleware runs in wrong order — auth before session means no authenticated user; authorization before binding means null models.
- **Circular priority**: Two middleware require each other to run first — framework doesn't prevent this.
- **Stale priority list**: After removing a middleware class, leftover priority entry is harmless but misleading.
- **Priority bypassing security**: If custom auth middleware isn't prioritized correctly, it may run before session starts and always see an unauthenticated user.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not adding custom middleware to priority | Assuming array order is sufficient | Middleware runs in wrong order relative to framework middleware | Check dependencies and add to priority if needed |
| Using priority instead of group ordering | Convenience | Affects all routes unnecessarily | Reorder group array first; priority only when cross-source |
| Changing default priority | Unfamiliar with implications | Breaks framework middleware ordering | Extend priority array, don't reorder defaults |
| Adding middleware to priority after registration | Forgetting priority when adding middleware | Order bug in production | Add to priority at same time as middleware registration |

## Anti-Patterns
- **Priority as crutch for messy middleware**: Using priority to "fix" ordering that should be resolved by correctly organizing group arrays.
- **Hundreds of priority entries**: Adding every middleware to the priority list. Priority is for ordering across sources, not all middleware.
- **Circular priority definition**: Adding A before B and B before A — framework doesn't validate this.
- **Priority list drift**: Adding middleware to groups without updating priority — list becomes stale and misleading.

## Examples

```php
// Default priority (Laravel)
protected $middlewarePriority = [
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Auth\Middleware\Authenticate::class,
    \Illuminate\Auth\Middleware\Authorize::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
];

// Laravel 11+: bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->priority([
        \App\Http\Middleware\CustomSession::class,
        \App\Http\Middleware\VerifyTenant::class,
        \Illuminate\Routing\Middleware\SubstituteBindings::class,
    ]);
})

// Custom middleware that must run after auth
// The priority ensures VerifyTenant runs after Authenticate
// even if they come from different middleware sources
```

## Related Topics
- **Pipeline Pattern Fundamentals**: Pipe execution order.
- **Middleware Groups**: Multi-source middleware merging.
- **Global Middleware Stack**: Base ordering constraints.
- **Middleware vs Route Binding Ordering**: Priority effects on SubstituteBindings.
- **Middleware Configuration in Bootstrap**: Laravel 11+ priority API.

## AI Agent Notes
- The priority algorithm in `Illuminate\Foundation\Http\Kernel::sortMiddleware()` uses `array_intersect()` to extract priority-ordered items and `array_diff()` to handle non-priority items. It's a stable sort with a global override.
- The priority system solves a fundamental problem of multi-source middleware merging.
- Laravel 11 introduced `Middleware::priority()` method. The algorithm remains the same.
- Priority affects the final sorted array, not the merge process. Merge happens first, then sort by priority.

## Verification
- [ ] List the default middleware priority order and understand the dependency chain
- [ ] Add custom middleware that depends on session — verify it runs after StartSession
- [ ] Add custom middleware without priority — observe it may run before its dependencies
- [ ] Add it to the priority list — verify correct ordering
- [ ] Test priority's global nature — verify priority change affects all routes
- [ ] Compare `route:list -v` output with and without priority changes
