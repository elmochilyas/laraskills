# Middleware Priority
## Metadata (Domain: Laravel Execution Lifecycle & Framework Internals, Subdomain: Middleware Pipeline, Last Updated: 2026-06-02)
## Executive Summary
Middleware priority controls the execution order of middleware classes when they belong to different groups (global, group, route) but must run in a specific sequence. Laravel's `$middlewarePriority` array (and the `priority()` method in Laravel 11) defines an ordering guarantee that overrides natural sorting. This ensures that certain middleware (e.g., session, cookie) always runs before dependent middleware (e.g., auth, CSRF).

## Core Concepts
Without priority, middleware order is determined by the order they appear in the merged array (global first, then groups, then route). Priority reorders middleware globally to enforce dependencies. Priority is defined as an array where each entry must run before all entries that follow it. Middleware not listed in the priority array retains its original relative order. Priority is applied in `Kernel::sortMiddleware()`.

## Mental Models
**VIP Lane:** Priority middleware gets bumped to the front of the line regardless of where it was originally placed. Like airport priority boarding — even if you check in late, you board first.

**Prerequisite Chain:** Think of it as a dependency graph. Session middleware must start before auth middleware can check login status. Priority enforces this chain.

## Internal Mechanics
The priority algorithm in `Illuminate\Foundation\Http\Kernel::sortMiddleware()` iterates the middleware array and uses the priority list to determine placement. If middleware A and B both appear in the priority list and A comes before B in that list, then A is guaranteed to appear before B in the final sorted array. Middleware not in the priority list stays in its original relative position. The algorithm uses `array_intersect()` and `array_diff()` to extract priority-ordered items and merge them back.

```php
// Laravel's default priority (simplified)
protected $middlewarePriority = [
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Auth\Middleware\Authenticate::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
];
```

## Patterns
- **Priority Queue:** Middleware is reordered based on a global priority list.
- **Dependency Inversion:** Priority inverts the natural order to place prerequisites first.
- **Stable Sort:** Non-priority middleware retains its original relative ordering (stable sort property).

## Architectural Decisions
The priority mechanism exists because middleware comes from three independent sources (global, group, route) and the merge order does not guarantee correct execution. Rather than forcing developers to manually align middleware across all groups, Laravel provides a centralized priority override. The stable sort property ensures that adding priority for a subset of middleware does not disrupt the overall ordering.

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized order control | Priority is global — affects all routes | Cannot have different priority per route group |
| Ensures prerequisites run first | Priority list must be maintained as middleware changes | Outdated priority lists cause subtle bugs |
| Stable sort for non-priority middleware | Priority algorithm is O(n*m) for n middleware, m priority items | Negligible for typical stacks |

## Performance Considerations
Priority sorting happens once per request during middleware gathering. The algorithm uses array operations (intersect, diff, merge) that are O(n*m). For typical stacks (<30 middleware), this is microseconds. Route caching does not pre-sort by priority.

## Production Considerations
If you add custom middleware that depends on session or auth, check whether it needs priority. Failing to set priority can cause middleware to receive an unauthenticated request because `Authenticate` hasn't run yet. Keep the priority list in source control and review it during upgrades.

## Common Mistakes
**Why it happens:** Developers add authentication middleware to routes but don't realize session middleware must run first. **Why it's harmful:** Auth middleware tries to check the user before the session is started, resulting in null user. **Better approach:** Ensure `StartSession` appears before `Authenticate` in the priority list.

## Failure Modes
- **Missing priority entry:** Middleware runs in wrong order, causing data unavailability.
- **Circular priority:** Two middleware require each other to run first (not prevented by framework).
- **Stale priority list:** After removing a middleware class, leftover priority entry is harmless but misleading.

## Ecosystem Usage
- **Laravel Spark:** Adds middleware priority for team/subscription middleware.
- **Laravel Telescope:** Registers priority for its middleware to ensure session/context availability.
- **Laravel Horizon:** Uses priority for authentication middleware on dashboard routes.

## Related Knowledge Units
### Prerequisites
- Pipeline Pattern Fundamentals (pipe execution order)
- Middleware Groups (multi-source middleware merging)
- Global Middleware Stack (base ordering constraints)

### Related Topics
- Route Middleware (per-route middleware and sort interaction)
- Middleware vs Route Binding Ordering (priority effects on SubstituteBindings)

### Advanced Follow-up Topics
- Middleware Configuration in Bootstrap (Laravel 11+ priority API)
- Boot Order Timing (when priority sorting occurs in request lifecycle)
- Kernel Architecture (sortMiddleware algorithm internals)

## Research Notes
**Source Analysis:** `Illuminate\Foundation\Http\Kernel::sortMiddleware()` (vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php).
**Key Insight:** The priority system solves a fundamental problem of multi-source middleware merging. It's a stable sort with a global override.
**Version-Specific Notes:** Laravel 11 introduced `Middleware::priority()` method. The algorithm remains the same.
