# Middleware Ordering and Priority

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Middleware Ordering and Priority
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Middleware ordering and priority determine the execution sequence of middleware in the route pipeline. Without priority sorting, the execution order would be determined by the arbitrary order in which middleware arrays are merged (controller middleware + route middleware + group middleware). The priority system, implemented by `SortedMiddleware`, reorders this merged list into a deterministic sequence based on a configurable priority array.

The engineering significance of middleware ordering is that it controls the pipeline's safety properties. Session middleware must run before CSRF middleware (CSRF needs the session). Rate limiting should run before auth (to protect login endpoints). Auth must run before SubstituteBindings (bindings may depend on user context). An incorrect ordering creates security vulnerabilities and subtle bugs: rate limiting after auth allows unauthenticated brute-force attacks, SubstituteBindings before auth exposes model data to unauthorized users.

---

## Core Concepts

### The Merging Problem
Middleware is gathered from three independent sources and merged into a single array:

1. Controller middleware (from `HasMiddleware`, `#[Middleware]`, or constructor)
2. Route middleware (from `->middleware('auth')`)
3. Group middleware (from route groups like `web`, `api`)

The merge order is: controller middleware first, then route middleware, then group middleware. Without sorting, the pipeline would execute controller middleware first and group middleware last — which is almost never the desired order (group middleware like session should run before controller middleware like auth).

### SortedMiddleware
The `SortedMiddleware` class takes the merged middleware array and the priority array, then reorders middleware so that higher-priority items run first:

```php
$sorted = new SortedMiddleware($priority, $middleware);
return $sorted->sorted;
```

The sort algorithm:
1. Extract middleware that appear in the priority array into a separate list, ordered by priority.
2. Extract middleware that do NOT appear in the priority array into another list, preserving their relative order.
3. Concatenate: priority middleware first, then non-priority middleware.

This means middleware NOT in the priority array always runs AFTER middleware in the priority array, regardless of where they were in the merged array.

### The Priority Array
The priority array defines the execution order from highest priority (first to run) to lowest priority (last to run):

```php
protected $middlewarePriority = [
    \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class,
    // ... auth, throttle, bindings
    \Illuminate\Auth\Middleware\Authorize::class,
];
```

---

## Mental Models

### Priority as Pipeline Position
The priority array is a template for the pipeline. Priority items fill pre-defined positions in the template. Non-priority items get appended at the end, maintaining their relative order. Think of the priority array as a reserved seating chart — VIP guests sit in specific seats, and everyone else fills the remaining seats in the order they arrive.

### Priority as Safety Guarantee
The priority array is a safety guarantee that critical middleware runs in the correct order regardless of how middleware is registered. Without this guarantee, adding middleware in a different order in a group definition could accidentally put auth before session.

### Priority as API Contract
The priority array is an API contract: "These middleware will always run in this order." Custom middleware that must run before or after specific framework middleware must be placed in the priority array to guarantee its position.

---

## Internal Mechanics

### SortedMiddleware Algorithm
The `sorted()` method in `SortedMiddleware`:

```php
public function sorted(): array
{
    $sorted = [];
    
    // For each priority item, find it in middleware and add to sorted list
    foreach ($this->priority as $priorityItem) {
        foreach ($this->middleware as $key => $middleware) {
            if ($this->middlewareClass($middleware) === $priorityItem) {
                $sorted[] = $middleware;
                unset($this->middleware[$key]);
            }
        }
    }
    
    // Append remaining (non-priority) middleware in their original order
    return array_merge($sorted, array_values($this->middleware));
}
```

The algorithm:
1. Iterates through the priority array (in priority order).
2. For each priority item, finds matching middleware in the merged array (by class name).
3. Removes matched middleware from the merged array.
4. Appends all remaining (non-priority) middleware at the end.

### Stable Sort for Non-Priority Items
Non-priority items maintain their original relative order from the merged array. Since they are never reordered among themselves, the original merge order determines their execution sequence. This means:
- Non-priority items from controller middleware run before non-priority items from route middleware, which run before non-priority items from group middleware.
- This is usually NOT the desired order — it is why registering custom middleware in the priority array is essential.

### Priority in Laravel 11+ (Fluent API)
In Laravel 11+, priority is configured via the fluent `Middleware` object:

```php
->withMiddleware(function (Middleware $middleware) {
    // Replace entire priority list
    $middleware->priority([
        \App\Http\Middleware\Custom::class,
        \Illuminate\Auth\Middleware\Authenticate::class,
    ]);
    
    // Insert before a specific middleware
    $middleware->prependToPriorityList(
        before: \Illuminate\Auth\Middleware\Authenticate::class,
        prepend: \App\Http\Middleware\Custom::class,
    );
    
    // Insert after a specific middleware
    $middleware->appendToPriorityList(
        before: \Illuminate\Auth\Middleware\Authenticate::class,
        prepend: \App\Http\Middleware\Custom::class,
    );
})
```

### Middleware Class Resolution for Priority Matching
Priority matching uses the class name string. When middleware is specified as an alias (e.g., `'auth'`), it is resolved to its FQCN before priority sorting via `MiddlewareNameResolver`. The resolved class name is matched against the priority array.

---

## Patterns

### Priority Chain Pattern
The default Laravel priority chain establishes a logical execution sequence:

```
Cookies → Session → CSRF → Throttle → Auth → Authorize → SubstituteBindings
```

Each step depends on the previous:
- Cookies must be decrypted before session can read them.
- Session must be started before CSRF token can be verified.
- Rate limiting should protect auth endpoints (prevent brute force).
- Auth must run before authorization (needs authenticated user).
- SubstituteBindings runs last so bindings can use auth context.

- **Purpose**: Establish a safe default execution order for framework middleware.
- **Benefits**: Security properties are maintained regardless of middleware registration order.
- **Tradeoffs**: Adding new middleware to the chain requires updating the priority array.

### Custom Priority Insertion Pattern
Insert custom middleware at the correct position in the priority chain:

```php
$middleware->prependToPriorityList(
    before: \Illuminate\Auth\Middleware\Authenticate::class,
    prepend: \App\Http\Middleware\EnsureUserIsActive::class,
);
```

- **Purpose**: Ensure custom middleware runs before or after specific framework middleware.
- **Benefits**: Declarative positioning — no need to manage the entire priority array.
- **Tradeoffs**: The insertion is relative to existing priority items — if the referenced middleware is removed in a future Laravel version, the insertion position becomes undefined.

### Complete Priority Override Pattern
Replace the entire priority list:

```php
$middleware->priority([
    \App\Http\Middleware\RequestId::class,
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    // ... full custom list
]);
```

- **Purpose**: Full control over middleware ordering for applications with complex middleware stacks.
- **Benefits**: No hidden defaults — every middleware's position is explicit.
- **Tradeoffs**: Must keep the priority list in sync with framework updates. Omitted framework middleware runs at the end.

---

## Architectural Decisions

### Why Non-Priority Middleware Runs Last
The decision to place all non-priority middleware at the end of the sorted list is intentional. It ensures that framework middleware (session, auth, throttle) always runs before application middleware, regardless of where application middleware is registered. This prevents application middleware from accidentally running before critical framework middleware.

### When to Add Custom Middleware to Priority
Add custom middleware to the priority array when it must run before or after specific framework middleware. If the middleware's position relative to framework middleware does not matter (e.g., a logging middleware that captures request data after processing), it can remain non-priority.

The rule of thumb: if the middleware modifies the request (request transformation, enrichment), place it in priority so it runs early. If the middleware reads the request or modifies the response, it can run at the end.

### Priority vs Order of Registration
The priority array overrides the registration order. A middleware added last in the group array but listed first in the priority array runs first. This is by design — the priority array is the authoritative execution order, not the registration order.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Priority ensures deterministic ordering regardless of registration | Non-priority middleware always runs last | Add custom middleware to priority if position matters |
| Priority protects security-sensitive middleware ordering | Priority array must be maintained across Laravel upgrades | Review priority array on each major version upgrade |
| Non-priority middleware maintains relative order | Non-priority order is determined by merge order, not pipeline logic | Group middleware always runs after controller middleware for non-priority items |
| Fluent API (Laravel 11+) enables declarative insertion | Priority API changes between Laravel versions (array vs fluent) | Document the version-specific API for the team |

---

## Performance Considerations

### Sorting Overhead
`SortedMiddleware` performs an O(n*m) comparison (priority items × middleware items). For a typical application with 40 priority items and 10 route middleware, this is 400 comparisons — approximately 0.001ms. Negligible.

### Priority Cache
The priority array is read from the container (bound as a configuration array). It is not cached or compiled. Each request reads the priority configuration. For most applications, this is not a performance concern.

### Alias Resolution Before Sorting
Middleware aliases (like `auth`) are resolved to FQCN before priority sorting. The resolution adds a small overhead (~0.005ms per alias). Aliases are resolved for all route middleware before sorting begins.

---

## Production Considerations

### Documentation of Custom Priority
Every middleware added to the priority array should document WHY it is placed where it is. Future developers need to know that `EnsureUserIsActive` must run before `Authenticate` because inactive users should not be allowed to authenticate.

### Priority Audits on Upgrade
When upgrading Laravel, review the priority array. New framework middleware may have been added to the default priority list, changing the expected order. Use `php artisan middleware:show` or inspect the framework's `Kernel.php` to verify the current priority list.

### Middleware Class Name Consistency
Priority matching uses exact class name matching. If middleware is registered as an alias but the priority list uses the FQCN, the match works because aliases are resolved before sorting. If middleware is registered as an FQCN but the priority list uses an alias, the match fails — the middleware becomes non-priority.

---

## Common Mistakes

### Not Adding Custom Middleware to Priority
A custom middleware is added to the `web` group and expected to run before auth. Without adding it to the priority array, it runs after all priority middleware (including auth). The middleware's pre-auth logic never executes before auth.

### Assuming Registration Order Equals Execution Order
A developer registers middleware in a specific order in the group array and expects that order to be preserved. Without priority entries, the group order is preserved only for non-priority middleware. If any middleware in the group is in the priority array, the order shifts.

### Duplicate Priority Matches
If two middleware classes share the same base class or interface but have different FQCNs, only the exact match is sorted by priority. This is rarely an issue but can cause confusion when a subclass is expected to inherit the parent's priority position.

### Priority Array Out of Sync
After a Laravel upgrade, the framework's `$middlewarePriority` array may have changed. If the application overrides the entire priority array and does not include the new framework middleware, that middleware runs at the end (non-priority). This can break version-specific behavior.

---

## Failure Modes

### Auth After SubstituteBindings
If auth middleware runs after `SubstituteBindings`, user information is not available during route model binding. Bindings that depend on the authenticated user (e.g., scoping queries by user) fail because `Auth::user()` is null. The default priority list correctly places `SubstituteBindings` after auth.

### Rate Limiting After Auth
Rate limiting after auth means unauthenticated requests are never throttled. A bot can brute-force the login endpoint without rate limits because the throttle middleware runs after auth, and auth short-circuits before reaching throttle. The default priority list places throttle before auth.

### CSRF Before Session
If CSRF verification runs before the session starts, the CSRF token cannot be read from the session. Every POST request fails CSRF verification. The default priority list correctly places session before CSRF.

---

## Ecosystem Usage

### Laravel Framework
The framework defines a default priority array in `Illuminate\Foundation\Http\Kernel`. This array is merged with any application-defined priority in `SortedMiddleware`. Framework middleware ALWAYS has priority entries — the priority array ensures the framework's internal middleware order is protected.

### Laravel Horizon
Horizon does not modify the middleware priority. It uses route-level middleware that runs at the end of the priority chain.

### Spatie Laravel Permission
Spatie's middleware (`role`, `permission`) does not include priority configuration. These middleware should be added to the application's priority array if they must run before or after specific framework middleware.

### Laravel Debugbar
The Debugbar adds middleware for collecting debug data. It registers as a singleton and does not require priority positioning — its position relative to framework middleware does not affect its behavior.

---

## Related Knowledge Units

### Prerequisites
- Middleware Fundamentals — understanding the Pipeline pattern
- Global, Route Group, and Route Middleware — how middleware from different tiers is merged
- Controller Middleware — how controller-level middleware is gathered

### Related Topics
- Custom Middleware — creating middleware that needs priority positioning
- Parameterized Middleware — how parameters interact with priority sorting
- Middleware Lifecycle — how priority affects the overall request flow

### Advanced Follow-up Topics
- Laravel 11 vs 10 Registration — the fluent priority API differences
- Cross-Cutting Concerns — deciding which middleware needs priority positioning

---

## Research Notes

- The `SortedMiddleware` algorithm is a stable sort for non-priority items and a positional sort for priority items. It is NOT a general-purpose sort — it only reorders priority items to the front. This design is intentional: it prevents arbitrary reordering of non-priority middleware that could break application assumptions.
- The default priority list in Laravel has grown with each version. New middleware added to the framework typically gets priority entries. Applications that override the entire priority list must include all new framework middleware to maintain correct ordering.
- `prependToPriorityList` and `appendToPriorityList` were added in Laravel 12. Before that, modifying priority required replacing the entire array. These methods reduce the maintenance burden but require the target middleware to exist in the priority array.
- The priority matching uses string comparison of FQCNs. Middleware aliases are resolved before sorting, so `auth` in the route definition matches `\Illuminate\Auth\Middleware\Authenticate::class` in the priority array.