# ECC Standardized Knowledge — Middleware Ordering and Priority

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Middleware Ordering and Priority |
| **Difficulty** | Advanced |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Middleware ordering and priority determine the execution sequence of middleware in the route pipeline. Without priority sorting, the execution order would be determined by the arbitrary order in which middleware arrays are merged (controller middleware + route middleware + group middleware). The priority system, implemented by `SortedMiddleware`, reorders this merged list into a deterministic sequence based on a configurable priority array.

The engineering significance of middleware ordering is that it controls the pipeline's safety properties. Session middleware must run before CSRF middleware (CSRF needs the session). Rate limiting should run before auth (to protect login endpoints). Auth must run before SubstituteBindings (bindings may depend on user context). An incorrect ordering creates security vulnerabilities and subtle bugs.

---

## Core Concepts

### The Merging Problem

Middleware is gathered from three independent sources and merged into a single array: controller middleware first, then route middleware, then group middleware. Without sorting, controller middleware runs first and group middleware runs last — which is almost never the desired order (group middleware like session should run before controller middleware like auth).

### SortedMiddleware Algorithm

The `SortedMiddleware` class takes the merged middleware array and the priority array. It iterates through the priority array, finding matching middleware in the merged array (by class name), removing matched items, and placing them in priority order. All remaining (non-priority) middleware is appended at the end, preserving their original relative order.

### The Priority Array

The default priority chain establishes a logical execution sequence: Cookies → Session → CSRF → Throttle → Auth → Authorize → SubstituteBindings. Each step depends on the previous. Priority matching uses exact class name string comparison. Aliases are resolved to FQCNs before priority sorting.

### Priority in Laravel 11+

In Laravel 11+, priority is configured via the fluent `Middleware` object: `$middleware->priority([...])` (replace entire list), `$middleware->prependToPriorityList(...)` (insert before), `$middleware->appendToPriorityList(...)` (insert after).

---

## When To Use

- **Priority chain pattern** by default — the default Laravel priority chain establishes a safe execution order that should be maintained.
- **Custom priority insertion** when custom middleware must run before or after specific framework middleware (e.g., `EnsureUserIsActive` must run before `Authenticate`).
- **Complete priority override** in applications with complex middleware stacks where full control over ordering is needed.
- **Priority addition** when a new custom middleware modifies the request and must run early in the pipeline (request transformation, enrichment).

---

## When NOT To Use

- Do NOT add custom middleware to the priority array if its position relative to framework middleware does not matter — it can remain non-priority and run at the end.
- Do NOT assume registration order equals execution order — the priority array overrides registration order. A middleware added last in the group array but listed first in the priority array runs first.
- Do NOT override the entire priority array without including all framework middleware — omitted framework middleware runs at the end (non-priority), which can break version-specific behavior.
- Do NOT rely on non-priority middleware order for critical behavior — non-priority middleware order is determined by merge order, not pipeline logic.

---

## Best Practices (WHY)

- **Add custom middleware to priority if position matters.** A custom middleware that modifies the request before auth runs must be placed before `Authenticate` in the priority array. Without priority placement, it runs after all priority middleware (including auth), defeating its purpose.
- **Document why each custom middleware is placed where it is.** Future developers need to know that `EnsureUserIsActive` must run before `Authenticate` because inactive users should not be allowed to authenticate.
- **Review priority array on each major Laravel upgrade.** New framework middleware may have been added to the default priority list. Applications that override the entire priority array must include all new framework middleware.
- **Use `prependToPriorityList` and `appendToPriorityList` (Laravel 12+) for targeted insertion.** These methods insert before or after a specific priority item without replacing the entire array.
- **Use exact FQCNs in the priority array.** Priority matching uses exact class name string comparison. If the priority list uses an alias but middleware is registered as FQCN, the match fails.

---

## Architecture Guidelines

- **Priority sort algorithm:** Iterate priority array → find matching middleware in merged array → remove and add to sorted list in priority order → append remaining non-priority items at end preserving relative order.
- **Priority chain (default):** HandlePrecognitiveRequests → EncryptCookies → AddQueuedCookiesToResponse → StartSession → ShareErrorsFromSession → VerifyCsrfToken → ... → SubstituteBindings.
- **Non-priority middleware:** Always runs after all priority middleware. Relative order is determined by merge order (controller → route → group).
- **Alias resolution:** Middleware aliases are resolved to FQCN before priority sorting via `MiddlewareNameResolver`.
- **O(n*m) complexity:** Priority items × middleware items. For 40 priority items and 10 route middleware: 400 comparisons, ~0.001ms.
- **Laravel 11+ priority API:** `$middleware->priority([...])` (replace), `->prependToPriorityList(before: Auth::class, prepend: Custom::class)`, `->appendToPriorityList(...)`.
- **Laravel 10- priority API:** `protected $middlewarePriority = [...]` array in `Kernel.php`.

---

## Performance

`SortedMiddleware` performs an O(n*m) comparison (priority items × middleware items). For typical applications with 40 priority items and 10 route middleware, this is ~400 comparisons (~0.001ms). Alias resolution before sorting adds ~0.005ms per alias. The priority array is read from the container each request — it is not cached or compiled. Negligible performance impact.

---

## Security

The priority array is a safety guarantee that security-critical middleware runs in the correct order. Auth after SubstituteBindings means user info is not available during route model binding — potentially exposing data to unauthorized users. Rate limiting after auth means unauthenticated requests bypass throttling. CSRF before session (without session started) means CSRF tokens cannot be validated. The priority chain prevents these security failures by enforcing the order: Cookies → Session → CSRF → Throttle → Auth → Authorize → SubstituteBindings.

---

## Common Mistakes

- **Not adding custom middleware to priority.** A custom middleware expected to run before auth is added to the `web` group. Without priority placement, it runs after all priority middleware (including auth). The middleware's pre-auth logic never executes.
- **Assuming registration order equals execution order.** A developer registers middleware in a specific order in the group array and expects that order to be preserved. If any middleware is in the priority array, the order shifts.
- **Priority array out of sync after Laravel upgrade.** The application overrides the entire priority array. After an upgrade, new framework middleware is missing from the override — it runs at the end (non-priority), potentially breaking version-specific behavior.
- **Class name mismatch between priority array and registration.** The priority list uses a middleware alias but the route definition uses the FQCN (or vice versa). The match fails and the middleware becomes non-priority.

---

## Anti-Patterns

- **Auth after SubstituteBindings.** If auth runs after model binding, user info is not available during binding. Routes that scope queries by the authenticated user fail because `Auth::user()` is null during `Route::bind()`.
- **Rate limiting after auth.** Unauthenticated requests are never throttled. A bot can brute-force the login endpoint without rate limits because the throttle middleware runs after auth, and auth short-circuits before reaching throttle.
- **CSRF before session.** If CSRF verification runs before the session starts, the CSRF token cannot be read from the session. Every POST request fails CSRF verification.
- **Complete priority override without framework middleware.** Replacing the entire priority array and omitting new framework middleware causes that middleware to run at the end (non-priority), potentially breaking intended behavior.

---

## Examples

### Custom Priority Insertion (Laravel 12+)
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->prependToPriorityList(
        before: \Illuminate\Auth\Middleware\Authenticate::class,
        prepend: \App\Http\Middleware\EnsureUserIsActive::class,
    );

    $middleware->appendToPriorityList(
        before: \Illuminate\Auth\Middleware\Authenticate::class,
        prepend: \App\Http\Middleware\LogAuthAttempts::class,
    );
})
```

### Complete Priority Override (Laravel 11+)
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->priority([
        \App\Http\Middleware\RequestId::class,
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
        \App\Http\Middleware\SetLocale::class,
        \Illuminate\Auth\Middleware\Authenticate::class,
        // ... include all framework middleware
    ]);
})
```

### Priority in Laravel 10-
```php
class Kernel extends HttpKernel
{
    protected $middlewarePriority = [
        \Illuminate\Session\Middleware\StartSession::class,
        \App\Http\Middleware\CustomBeforeAuth::class,
        \Illuminate\Auth\Middleware\Authenticate::class,
        // ...
    ];
}
```

---

## Related Topics

- **Middleware Fundamentals** (prerequisite) — understanding the Pipeline pattern.
- **Global, Route Group, and Route Middleware** (prerequisite) — how middleware from different tiers is merged.
- **Controller Middleware** — how controller-level middleware is gathered.
- **Custom Middleware** — creating middleware that needs priority positioning.
- **Parameterized Middleware** — how parameters interact with priority sorting.
- **Middleware Lifecycle** — how priority affects the overall request flow.
- **Laravel 11 vs 10 Registration** — the fluent priority API differences.
- **Cross-Cutting Concerns** — deciding which middleware needs priority positioning.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Global/Route Group Middleware (prerequisite). Serves as prerequisite for cross-cutting-concerns.
- **SortedMiddleware algorithm:** Priority items sorted to front in priority order. Non-priority items appended at end preserving relative merge order.
- **Priority is NOT a general-purpose sort.** It only moves priority items to the front. Non-priority items maintain their relative merge order.
- **Default chain:** Cookies → Session → CSRF → Throttle → Auth → Authorize → SubstituteBindings.
- **Alias resolution before sorting:** Aliases resolved to FQCNs before priority matching.
- **`prependToPriorityList`/`appendToPriorityList`** added in Laravel 12 for targeted insertion without full array replacement.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Merging problem explained | ✓ |
| SortedMiddleware algorithm documented | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Default priority chain documented | ✓ |
| Performance analysis | ✓ |
| Security implications documented | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples | ✓ |
| Related topics mapped | ✓ |
