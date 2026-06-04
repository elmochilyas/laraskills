# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Policy Design for APIs
**Generated:** 2026-06-03

---

# Decision Inventory

* Authorization location (Policies vs Controllers vs Middleware)
* Admin override pattern (Gate::before vs per-method check)
* Policy for listing endpoints (viewAny with scopes vs per-item check)

---

# Architecture-Level Decision Trees

---

## Authorization Location — Policies vs Controllers vs Middleware

---

## Decision Context

Where should authorization logic live? Arises when deciding where to place permission checks for API endpoints.

---

## Decision Criteria

* testability — ability to unit test authorization rules in isolation
* reusability — sharing the same rule across controllers and actions
* separation of concerns — keeping business logic separate from access control
* complexity — simple boolean checks vs complex attribute-based rules

---

## Decision Tree

What type of authorization is needed?
↓
Instance-level check (ownership, role-based on a specific model)?
YES → Laravel Policy class
NO → Feature-level check (can user access this feature)?
    YES → Gate or ability check (middleware-level)
    NO → System-level check (IP whitelist, maintenance mode)?
        YES → Middleware
        NO → Simple boolean on user model?
            YES → Still use Policy for consistency

---

## Rationale

Policies are the correct layer for instance-level authorization (can this user edit this post?). They are testable, reusable, and follow Laravel conventions. Controller-level authorization leads to duplication. Middleware is for system-level checks that apply to all routes, not instance-level.

---

## Recommended Default

**Default:** All instance-level authorization goes in Policy classes
**Reason:** Centralized, testable, reusable, and consistent with Laravel's authorization architecture.

---

## Risks Of Wrong Choice

Authorization in controllers: duplicated logic across endpoints, harder to test, inconsistent application. Authorization in middleware: lacks access to model instances, cannot handle instance-level checks.

---

## Related Rules

- Always Use Policies for Authorization, Never Controllers (from 05-rules.md)

---

## Related Skills

- Design API Policy Authorization (from 06-skills.md)
- Token Ability Design (from 06-skills.md)

---

## Admin Override Pattern — Gate::before vs Per-Method Check

---

## Decision Context

How should admin/super-admin users bypass policy checks? Arises when implementing authorization for resources that need admin override.

---

## Decision Criteria

* maintenance — adding a new policy method should automatically grant admin access
* safety — catch-all overrides must not unintentionally grant access to future actions
* clarity — explicit conditions visible in each method
* framework integration — using Laravel's Gate::before hook

---

## Decision Tree

Does the admin need access to ALL current and future policy methods?
↓
YES → Use `Gate::before()` — a single hook that returns true for admins before any policy method
NO → Does the admin need access to SPECIFIC methods only?
    YES → Per-method admin check — explicit `if ($user->isAdmin()) return true;` in each method
    NO → No admin override needed — ownership-only checks

---

## Rationale

`Gate::before()` is the cleaner approach when admins should have universal access (most common scenario). It automatically covers new policy methods without modification. Per-method checks are needed when admins should have access to some actions but not others (e.g., read but not delete). Never use a catch-all `return true` in a single method without conditions.

---

## Recommended Default

**Default:** `Gate::before()` super-admin bypass
**Reason:** Automatically covers all policy methods, no maintenance when adding new methods, and is the framework's intended mechanism.

---

## Risks Of Wrong Choice

Per-method check in every method: forgotten in new methods, admin denied access unintentionally. Catch-all `return true` without conditions: grants unintended access, especially dangerous if placed early in a policy method.

---

## Related Rules

- Implement Admin Override Pattern with Explicit Conditions (from 05-rules.md)

---

## Related Skills

- Design API Policy Authorization (from 06-skills.md)

---

## Policy for Listing Endpoints — viewAny with Scopes vs Per-Item Check

---

## Decision Context

How should authorization work for index/list endpoints that return collections of resources? Arises when implementing authorization for GET /resources endpoints.

---

## Decision Criteria

* performance — per-item policy checks cause N+1 authorization queries
* architecture — filtering should happen at the query level, not after loading
* scalability — collections of hundreds of items cannot be checked individually
* user experience — unauthorized items should be excluded from results, not returned as errors

---

## Decision Tree

Does the list need to filter results by user permissions?
↓
YES → Can filtering be expressed as a query scope?
    YES → Use `viewAny` policy method + query scope to filter results at DB level
    NO → Complex authorization per item?
        YES → Reconsider architecture — query-level filtering is almost always possible
        NO → Use `viewAny` with no additional filtering
NO → All authenticated users see all items?
    YES → `viewAny` returns true, no query scope needed

---

## Rationale

Authorizing each item in a collection individually is an N+1 anti-pattern. The `viewAny` method gates whether the user can access the list at all, and query scopes filter which items are returned. This prevents loading items the user cannot see and avoids per-item authorization calls.

---

## Recommended Default

**Default:** `viewAny` returns conditional access + query scope for filtering
**Reason:** Performance-safe pattern that scales to any collection size without N+1 authorization.

---

## Risks Of Wrong Choice

Per-item policy check in index: N+1 authorization overhead, excessive database queries, memory waste from loading unauthorized items. No `viewAny` method: default returns false, blocking all users from index endpoints.

---

## Related Rules

- Always Use Policies for Authorization, Never Controllers (from 05-rules.md)

---

## Related Skills

- Design API Policy Authorization (from 06-skills.md)
