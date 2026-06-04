# Metadata

**Domain:** Laravel Execution Lifecycle & Framework Internals
**Subdomain:** Boot Order & Timing
**Knowledge Unit:** ku-06-middleware-registration-order
**Generated:** 2026-06-03

---

# Decision Inventory

1. Middleware Placement: Global vs group vs route-specific
2. Middleware Ordering: Dependency-based ordering within the pipeline
3. Middleware Priority: When `$middlewarePriority` is needed vs correct group assignment

---

# Architecture-Level Decision Trees

---

## Decision Name: Middleware Placement Level

---

## Decision Context

Choosing whether to register middleware as global (`$middleware`), group (`web`/`api`), or route-specific.

---

## Decision Criteria

* performance — global middleware runs on EVERY request; route middleware runs only on matched routes
* architectural — execution order: global → group → route middleware
* security — auth middleware must be correctly placed in the appropriate group
* maintainability — least-privilege placement reduces unnecessary operations

---

## Decision Tree

Does the middleware need to run on EVERY request (all routes, all groups)?
↓
YES → Register as global middleware — but audit first; can it be limited to specific groups?
NO → Does the middleware apply to a logical group of routes (web or API)?
↓
YES → Register in the appropriate middleware group (`web` or `api`)
NO → Does the middleware apply to individual routes only?
↓
YES → Register as route middleware alias and apply per-route
NO → Is the middleware an authentication or session dependency?
↓
YES → Place in the appropriate group; auth in `web` group, token auth in `api` group
NO → Default to route-specific; promote to group if needed across many routes

---

## Rationale

Global middleware runs on every request — the least-privilege principle dictates placing middleware at the most specific level that covers all needed routes. Route-specific middleware runs only on matched routes. Group middleware balances coverage with specificity. Over-globalization is a common performance anti-pattern.

---

## Recommended Default

**Default:** Route-specific middleware for single-route concerns; group middleware for cohesive route sets; global middleware only for framework-essential operations.
**Reason:** Minimizes unnecessary middleware execution on routes that don't need it.

---

## Risks Of Wrong Choice

- Over-globalization: every request pays for middleware that only a few routes need — auth on a public health check endpoint.
- Wrong group assignment: CORS middleware in `web` group (runs after session start) should be in global middleware.
- Route middleware on every route: same effect as global but with more registration overhead — promote to global if truly needed everywhere.

---

## Related Rules

- Least-privilege middleware placement (05-rules.md, Rule 1)
- Use middleware aliases for convenient route assignment (05-rules.md, Rule 3)

---

## Related Skills

- Register and Order Middleware (middleware-pipeline)

---

## Decision Name: Middleware Ordering Strategy

---

## Decision Context

Determining the correct execution order when middleware has dependencies on each other (e.g., session middleware must run before auth middleware).

---

## Decision Criteria

* performance — no impact
* architectural — execution order: global (array order) → group (array order) → route (definition order)
* security — auth must run after session; CORS must run before auth
* maintainability — draw the pipeline order before configuring

---

## Decision Tree

Does Middleware A modify state that Middleware B reads?
↓
YES → A must run BEFORE B in the pipeline
NO → Does Middleware B depend on a service that A initializes (e.g., session before auth)?
↓
YES → A must run BEFORE B
NO → Does the middleware need to run before the framework's built-in middleware (e.g., before `SubstituteBindings`)?
↓
YES → Use `$middlewarePriority` to control position relative to framework middleware
NO → Are both middleware in the same group?
↓
YES → Order by array position — first in array runs first in the pipeline
NO → If no dependency exists, order does not matter

---

## Rationale

Middleware execution order determines the state available to each middleware. Session middleware must run before auth middleware (auth reads the session). `SubstituteBindings` must run after auth (model binding may depend on authenticated user). CORS middleware must run before auth (preflight requests are unauthenticated). The pipeline follows array order: first listed = first executed.

---

## Recommended Default

**Default:** Array order within each placement level (global, group, route) determines execution order; use `$middlewarePriority` only to interleave with framework middleware.
**Reason:** Array order is explicit and visible; priority should be an exception.

---

## Risks Of Wrong Choice

- Reverse order: middleware that expects session data runs before session middleware — null session.
- Ignoring `SubstituteBindings` position: custom middleware that uses route model binding must run AFTER `SubstituteBindings`.
- Using `$middlewarePriority` to fix wrong group assignment: the issue is placement level, not priority.

---

## Related Rules

- Order by dependency — A before B if A modifies what B reads (05-rules.md, Rule 2)
- Use `$middlewarePriority` sparingly (05-rules.md, Rule 4)

---

## Related Skills

- Register and Order Middleware (middleware-pipeline)
