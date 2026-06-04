# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** ku-07-route-registration-order
**Generated:** 2026-06-03

---

# Decision Inventory

1. Route Ordering: Specific vs wildcard route positioning
2. Route Handler Strategy: Controller classes vs closures with caching
3. File Loading Strategy: Single file vs split route files per domain

---

# Architecture-Level Decision Trees

---

## Decision Name: Route Ordering Strategy

---

## Decision Context

Ordering routes within route files to ensure correct URL matching when specific and wildcard/parameterized routes coexist.

---

## Decision Criteria

* performance — no difference; first-match is O(n) on registration order
* architectural — Laravel Router returns the first matching route; order determines behavior
* security — wrong order can expose routes intended to be protected
* maintainability — specific-before-wildcard is a standard convention

---

## Decision Tree

Do you have routes with both literal segments AND parameterized segments at the same position (e.g., `/users/create` and `/users/{user}`)?
↓
YES → Place the literal (specific) route BEFORE the parameterized (wildcard) route
NO → Do you have a fallback/catch-all route (`Route::fallback()`)?
↓
YES → Register fallback LAST — after all other routes including wildcards
NO → Do you have multiple routes with the same HTTP method and URL prefix?
↓
YES → Order by specificity: most specific patterns first, most general last
NO → No ordering conflict — any order works

---

## Rationale

The Router iterates the route collection in registration order and returns the first match. A wildcard `{user}` parameter matches any segment, including "create". If the wildcard is registered first, the specific `/users/create` route is never reached. This is a first-match-wins architecture, not a most-specific-wins architecture.

---

## Recommended Default

**Default:** Specific literal routes before parameterized routes; fallback routes registered last.
**Reason:** First-match-wins semantics require specific routes to appear before broader patterns.

---

## Risks Of Wrong Choice

- Wildcard before specific: `/users/create` never matches — users see "show" action when they intended "create".
- Registering routes after fallback: fallback catches all unmatched requests before those routes are tried.
- Closure route with `route:cache`: `LogicException` — closures cannot be serialized.

---

## Related Rules

- Define specific routes before wildcard routes (05-rules.md, Rule 1)
- Register fallback routes last (05-rules.md, Rule 3)

---

## Related Skills

- Structure Service Provider boot() Methods (boot-phase-order)

---

## Decision Name: Route Handler Type Selection

---

## Decision Context

Choosing between controller classes and closure-based route handlers, particularly with respect to route caching.

---

## Decision Criteria

* performance — route caching eliminates registration time; closures prevent caching
* architectural — controller classes are serializable; closures are not
* security — closures capture scope; controllers are explicit
* maintainability — controllers separate concerns; closures inline logic

---

## Decision Tree

Will `php artisan route:cache` be used in production?
↓
YES → Use controller classes for ALL route handlers — closures throw `LogicException`
NO → Is the route handler a simple view return with no logic?
↓
YES → Closure is acceptable for simple, non-cached routes
NO → Is the route handler in a development-only route file excluded from caching?
↓
YES → Closure is acceptable for development-only routes
NO → Use controller classes — even without caching, controllers are better practice

---

## Rationale

`php artisan route:cache` serializes the route collection. Closures cannot be serialized — the command throws `LogicException` if any route uses a closure handler. Controller classes serialize to their class name string. For any production application using route caching, all route handlers must be controller classes. Even without caching, controllers provide better separation of concerns.

---

## Recommended Default

**Default:** Controller classes for all route handlers; closures only for development-only routes excluded from caching.
**Reason:** Enables route caching and maintains clean separation of concerns.

---

## Risks Of Wrong Choice

- Closure handlers with route caching: `php artisan route:cache` fails with `LogicException` — cannot cache.
- Closure handlers in production without caching: 20-40ms extra route registration time per request.
- Controller that doesn't exist: runtime error when route is matched — test with `php artisan route:list`.

---

## Related Rules

- Always use controller classes, not closures, with route caching (05-rules.md, Rule 2)

---

## Related Skills

- Structure Service Provider boot() Methods (boot-phase-order)
