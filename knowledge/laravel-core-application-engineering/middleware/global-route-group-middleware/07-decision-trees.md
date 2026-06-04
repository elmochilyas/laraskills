# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Global, Route Group, and Route Middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* Global vs Group vs Route Registration for New Middleware
* Custom Group Definition vs Group Modification on Default Groups
* Nested Group Structure vs Flat Group Structure
* Middleware Composition via Groups vs Per-Route Registration

---

# Architecture-Level Decision Trees

---

## Decision 1: Global vs Group vs Route Registration for New Middleware

---

## Decision Context

Which of the three registration tiers to use when adding middleware to the application.

---

## Decision Criteria

* Whether the concern must run before routing
* Whether the concern applies to every request
* Whether the concern is shared by a route collection
* Whether the concern is specific to individual routes

---

## Decision Tree

Must the middleware run before routing (request interpretation)?
↓
YES → Global — runs on every request before the router executes
NO → Does the middleware apply to every HTTP request unconditionally?
    ↓
    YES → Does it perform I/O or database queries?
        ↓
        YES → Group-level — never register I/O middleware globally
        NO → Global — infrastructure middleware (request ID, sanitization)
    NO → Is the middleware shared by a collection of routes?
        ↓
        YES → Group-level — define or use existing middleware group
        NO → Route-level — per-route middleware via `->middleware()`

---

## Rationale

Global tier runs before routing and cannot access route data. Group tier defines middleware stacks for route collections. Route tier applies to individual routes. The additive-only constraint means global middleware cannot be removed from any route — choose the most restrictive tier that covers all intended routes.

---

## Recommended Default

**Default:** Group-level registration. Define custom groups for application domains (admin, api-v2, webhooks). Use route-level for per-route configuration. Use global only for infrastructure that must run before routing.
**Reason:** Group-level provides the best balance of coverage and restriction — middleware applies to the intended set without running on unintended routes.

---

## Risks Of Wrong Choice

* Global for group concern: Middleware runs on every request including health checks, static assets, API routes
* Route-level for group concern: Must be manually added to every route; omission creates security gaps
* Group-level for single route: Adds middleware to all routes in the group unnecessarily

---

## Related Rules

* Keep Global Middleware Minimal
* Never Place Business Logic in Middleware

---

## Related Skills

* Register Custom Middleware at the Correct Tier
* Apply the Cross-Cutting Boundary Test to New Middleware

---

---

## Decision 2: Custom Group Definition vs Group Modification on Default Groups

---

## Decision Context

Whether to define a completely new middleware group or modify an existing default group (web, api) by appending middleware.

---

## Decision Criteria

* Whether the middleware applies to an existing default group's routes
* Whether the middleware should apply to all routes in the default group
* Whether the modification is an addition or a replacement

---

## Decision Tree

Does the middleware apply to routes already covered by the `web` or `api` group?
↓
YES → Should it apply to ALL routes in that group?
    ↓
    YES → Group modification — use `$middleware->web(append: [...])` (Laravel 11+) or append to group array (Laravel 10-)
    NO → Define a custom subgroup — create a new group with only the middleware needed
NO → Does the middleware define a completely new route domain (admin, webhooks, api-v2)?
    ↓
    YES → Custom group definition — `$middleware->group('admin', ['auth', 'verified'])`
    NO → Does it replace existing group middleware entirely?
        ↓
        YES → Full group replacement (risky) — include ALL default middleware explicitly
        NO → Targeted modification — append/prepend to existing group

---

## Rationale

Group modification (`$middleware->web(append: [...])`) keeps default group contents while adding targeted middleware. Full replacement requires including all default middleware explicitly — omitting session or CSRF from the web group removes security protections. Custom groups are for route collections that differ from the default web/api distinction.

---

## Recommended Default

**Default:** Use group modification (append/prepend) for existing default groups. Define custom groups for entirely new route domains.
**Reason:** Group modification preserves framework defaults. Custom groups provide clean separation for non-standard route collections.

---

## Risks Of Wrong Choice

* Full group replacement omitting defaults: Session, CSRF, or binding middleware missing from protected routes
* Custom group when modification suffices: Duplicate middleware lists; inconsistent with framework defaults
* Modification when custom group is needed: Web group becomes cluttered with admin-specific middleware that runs on all web routes

---

## Related Rules

* Keep Global Middleware Minimal
* Never Place Business Logic in Middleware

---

## Related Skills

* Register Custom Middleware at the Correct Tier
* Migrate Middleware Registration from Laravel 10 to 11

---

---

## Decision 3: Nested Group Structure vs Flat Group Structure

---

## Decision Context

Whether to organize routes using deeply nested groups (3+ levels) or flatten the group hierarchy.

---

## Decision Criteria

* Number of group nesting levels
* Whether attributes from different levels conflict
* Whether developers can trace the final attribute set for any route

---

## Decision Tree

Do routes require more than 2 levels of nesting?
↓
YES → Can the nesting be flattened by combining prefixes and middleware into fewer groups?
    ↓
    YES → Flatten — combine into 2 levels max; use explicit attribute declarations
    NO → Are the nested attributes merging predictably?
        ↓
        YES → Acceptable with strict documentation — document each route's effective attribute set
        NO → Flatten — unexpected merge behavior is a maintenance risk
NO → 1-2 levels of nesting
    ↓
    YES/Fine → Standard pattern — middleware merges, prefix concatenates, name prepends predictably
    NO → N/A

---

## Rationale

Route groups merge attributes predictably but the combined effect becomes non-obvious beyond 2 levels. Middleware arrays are merged without deduplication. Prefixes concatenate with `/`. Names prepend with `.`. At 3+ levels, developers must trace through multiple group closures to understand which middleware, prefix, and name apply to a given route.

---

## Recommended Default

**Default:** Maximum 2 levels of group nesting. Use explicit attribute declarations on inner groups rather than relying on deep inheritance.
**Reason:** Shallow nesting keeps attribute merging visible. Each level of nesting doubles the cognitive load of tracing effective attributes.

---

## Risks Of Wrong Choice

* 4+ levels of nesting: Impossible to determine effective middleware list without running `php artisan route:list`
* Duplicate middleware from nested merge: Middleware runs multiple times on the same route
* Name prefix concatenation errors: `admin` instead of `admin.` produces `adminusers.index` instead of `admin.users.index`

---

## Related Rules

* Keep Global Middleware Minimal
* Never Place Business Logic in Middleware

---

## Related Skills

* Register Custom Middleware at the Correct Tier
* Apply the Cross-Cutting Boundary Test to New Middleware

---

---

## Decision 4: Middleware Composition via Groups vs Per-Route Registration

---

## Decision Context

Whether to compose middleware stacks by defining named groups or by attaching middleware individually to each route.

---

## Decision Criteria

* Number of routes sharing the same middleware stack
* Whether the middleware stack changes per route within a collection
* Whether the group definition provides meaningful abstraction

---

## Decision Tree

Do 3+ routes share the exact same middleware stack?
↓
YES → Group composition — define a named group and apply it to all routes
NO → Do routes share most middleware but differ by 1-2 items?
    ↓
    YES → Base group + per-route overrides — use `withoutMiddleware()` for exclusions, `->middleware()` for additions
    NO → Do routes have entirely different middleware stacks?
        ↓
        YES → Per-route composition — individual `->middleware()` calls; groups provide no benefit
        NO → Group composition — even 2 routes with identical stacks benefit from group definition

---

## Rationale

Groups provide a single source of truth for middleware stacks. When the stack changes, only the group definition needs modification. Per-route registration requires updating every route. However, groups that are used by only 1-2 routes provide no benefit over per-route registration.

---

## Recommended Default

**Default:** Use named groups for middleware stacks shared by 3+ routes. Use per-route registration for unique or near-unique stacks.
**Reason:** Groups reduce duplication and provide a named abstraction. Below 3 routes, the group definition adds ceremony without proportional benefit.

---

## Risks Of Wrong Choice

* Per-route for shared stacks: Inconsistent middleware application; updates require touching every route
* Group for unique stacks: Unnecessary indirection; the group name hides which middleware actually runs
* Overly broad groups: Adding middleware to a group adds it to all routes, even those that don't need it

---

## Related Rules

* Keep Global Middleware Minimal
* Never Place Business Logic in Middleware

---

## Related Skills

* Register Custom Middleware at the Correct Tier
* Apply the Cross-Cutting Boundary Test to New Middleware
