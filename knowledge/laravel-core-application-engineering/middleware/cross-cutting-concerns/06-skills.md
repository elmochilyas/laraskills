# Skill: Apply the Cross-Cutting Boundary Test to New Middleware

## Purpose

Determine whether a proposed middleware belongs in the HTTP pipeline or in a service layer, preventing business logic from leaking into middleware and HTTP concerns from leaking into controllers.

## When To Use

When evaluating any new middleware class before implementation, or when reviewing existing middleware that may contain misplaced logic.

## When NOT To Use

Trivial middleware that only adds headers or logs requests (no domain data involved) passes the boundary test implicitly.

## Prerequisites

- Understanding of HTTP primitives vs domain primitives
- Knowledge of Laravel middleware handle() contract

## Inputs

- Proposed middleware purpose
- Proposed middleware code (or pseudocode)

## Workflow

1. Ask: "Does this operate on HTTP primitives?" (headers, request, response, status codes, cookies, sessions) — if yes, it belongs in middleware
2. Ask: "Does this operate on domain primitives?" (models, entities, repositories, business rules, domain events) — if yes, it belongs in a service or action
3. If both answers are yes: split the concern — create middleware for the HTTP part and a service for the domain part
4. If only HTTP: create the middleware
5. If only domain: do NOT create middleware — use a service/action instead

## Validation Checklist

- [ ] Middleware operates exclusively on `$request`, `$response`, headers, cookies, sessions, or status codes
- [ ] No domain models (Eloquent models, entities) are instantiated or queried in middleware
- [ ] No business rules (eligibility checks, calculations, side effects) exist in middleware
- [ ] If concern was split, middleware does not call the service — controller does

## Common Failures

- Middleware that queries `Order::find()` or checks business conditions like discount eligibility
- Controller that manually checks `Auth::check()` instead of relying on auth middleware
- Single middleware class handling auth + profile loading + subscription check + locale setting

## Decision Points

- If middleware needs to make a lightweight, read-only service lookup (e.g., tenant by domain), the look-up is acceptable in middleware — the result is stored on `$request->attributes` for downstream use
- If middleware calls a service with side effects, the service call must move to the controller

## Performance Considerations

Splitting concerns does not add overhead. Each dedicated middleware adds ~0.01-0.05ms closure allocation per request.

## Security Considerations

Business logic in middleware bypasses controller-level authorization and auditing. The split pattern ensures security concerns remain in the HTTP layer where they are consistently enforced.

## Related Rules

- Apply the Cross-Cutting Boundary Test Before Writing Middleware (cross-cutting-concerns:5)
- One Middleware Class Per Cross-Cutting Concern (cross-cutting-concerns:5)
- Never Split a Single Concern Across Middleware and Controller Logic (cross-cutting-concerns:5)

## Related Skills

- Implement Custom Middleware with Single-Responsibility Pattern
- Maintain Middleware Inventory

## Success Criteria

The middleware operates exclusively on HTTP primitives. Any domain logic it needed is delegated to a service called by the controller. The two-layer separation is independently testable.

---

# Skill: Maintain a Documented Middleware Inventory

## Purpose

Create and maintain a living document that lists every custom middleware, its concern, registration tier, priority position, and per-request cost to prevent middleware bloat and ensure pipeline transparency.

## When To Use

When the application has 5+ custom middleware, during quarterly architecture reviews, or when onboarding new team members.

## When NOT To Use

Applications with fewer than 3 custom middleware do not need a formal inventory — document inline in `bootstrap/app.php`.

## Prerequisites

- Complete list of registered custom middleware
- Access to bootstrap/app.php or Kernel.php

## Inputs

- Middleware registration file
- Middleware source files

## Workflow

1. List every custom middleware class name
2. Identify each middleware's cross-cutting concern (security, infrastructure, observability)
3. Note the registration tier (global, group, route) and the specific group name
4. Determine the priority position by checking the priority array or `prependToPriorityList`/`appendToPriorityList` calls
5. Estimate per-request cost — measure with microtime if unsure
6. Document in a table format in the project README or a dedicated file
7. Review quarterly: remove obsolete middleware, verify cost estimates, check registration tier correctness

## Validation Checklist

- [ ] Every custom middleware is listed with concern, tier, priority, and cost
- [ ] New middleware additions update the inventory before merge
- [ ] Quarterly review is scheduled or has been performed this quarter
- [ ] Obsolete middleware is removed from both code and inventory

## Common Failures

- Middleware accumulated over years without review — nobody knows why `AuditLog` runs before `SetLocale`
- New team members must read every middleware source to understand what runs on each route
- Cost estimates are never validated — a middleware assumed to be "fast" actually queries the database

## Decision Points

- If a middleware's concern is unclear from its name, rename it by concern (not usage location)
- If two middleware have the same concern, consider merging or removing one

## Performance Considerations

The inventory makes pipeline cost visible. A middleware costing 5ms on every request is immediately identified during review.

## Security Considerations

Missing middleware registration is a common security gap. The inventory audit catches routes that lack required security middleware.

## Related Rules

- Maintain a Documented Middleware Inventory (cross-cutting-concerns:5)
- Register Cross-Cutting Concerns at the Most Restrictive Tier (cross-cutting-concerns:5)
- Audit Security Middleware Coverage Quarterly (cross-cutting-concerns:5)

## Related Skills

- Apply the Cross-Cutting Boundary Test to New Middleware
- Choose the Correct Registration Tier for Middleware

## Success Criteria

The inventory contains every custom middleware with concern, tier, priority, and cost. Quarterly reviews produce documented removals or additions. New team members can understand the pipeline by reading the inventory.

---

# Skill: Audit Security Middleware Coverage Across All Routes

## Purpose

Verify that every protected route has the required security middleware applied, preventing accidental exposure of unprotected endpoints.

## When To Use

Quarterly, after adding new routes or route groups, after deploying new features, or after upgrading Laravel versions.

## When NOT To Use

During initial development of a new feature before routes are finalized.

## Prerequisites

- Architecture testing framework (Pest or PHPUnit)
- Knowledge of which middleware is required for each route group

## Inputs

- Route list (`php artisan route:list`)
- Middleware configuration (bootstrap/app.php or Kernel.php)

## Workflow

1. List all route groups and their required security middleware (auth, CSRF, rate limiting, verified)
2. For each group, write an architecture test that asserts every route in the group has the required middleware
3. Explicitly document public routes that intentionally bypass security middleware (login, password reset, webhooks)
4. Run the architecture tests in CI — fail the build if any protected route lacks required middleware
5. For uncovered routes found during audit, add the missing middleware or document the intentional exclusion

## Validation Checklist

- [ ] Every route group has an architecture test asserting required security middleware
- [ ] Public routes without security middleware are explicitly documented and excluded from tests
- [ ] CI pipeline fails when a new route is added to a group without the required middleware
- [ ] Architecture tests are run on every PR

## Common Failures

- A new route added to a group that does not include auth — the route is exposed without protection
- A developer copies a route from a public group to a protected group without adding auth middleware
- Architecture tests are written but never run in CI, giving false confidence

## Decision Points

- If a route legitimately needs different middleware than its group, apply route-level middleware explicitly rather than removing group middleware
- Use `withoutMiddleware()` sparingly and only on named route middleware — it does not work on global middleware

## Performance Considerations

Architecture tests add minimal CI time (~0.5-2 seconds). They prevent security incidents that cost far more.

## Security Considerations

This skill directly addresses the most common middleware security gap: unprotected routes. Automated enforcement catches human errors in route group assignment.

## Related Rules

- Audit Security Middleware Coverage Quarterly (cross-cutting-concerns:5)

## Related Skills

- Maintain a Documented Middleware Inventory
- Choose the Correct Registration Tier for Middleware

## Success Criteria

Architecture tests assert every protected route has the correct middleware. CI fails on violations. Quarterly audits produce zero unexpected unprotected routes.
