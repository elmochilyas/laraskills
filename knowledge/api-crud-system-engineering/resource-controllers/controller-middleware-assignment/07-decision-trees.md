# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Middleware Assignment
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Middleware Assignment Location

---

## Decision Context

Choosing between route-level, controller-level (static), and controller-level (constructor) middleware assignment.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Is the middleware broadly applied to most or all actions (auth, throttle)?
├── YES → Apply at route group level (visible in route file)
└── NO → Is the middleware specific to certain actions within a resource?
    ├── YES → Is the project on Laravel 11+?
    │   ├── YES → Use static `middleware()` method on controller
    │   └── NO → Use constructor-based `$this->middleware()` with `only()`/`except()`
    └── NO → Apply at route level with `->middleware()` on the resource declaration

Is there a risk of duplicating middleware at both route and controller levels?
├── YES → Check both levels; each middleware must appear exactly once
└── NO → Apply each middleware at a single level

---

## Rationale

Route-level middleware is visible in route files and `php artisan route:list -v`. Controller-level middleware is hidden inside the class. Static middleware (Laravel 11+) enables lazy controller resolution without instantiating the controller needlessly.

---

## Recommended Default

**Default:** Route-group-level for broad middleware (auth, throttle); static `middleware()` method (Laravel 11+) for per-action differentiation
**Reason:** Maximizes visibility while enabling lazy resolution.

---

## Risks Of Wrong Choice

Duplicate middleware runs twice. Constructor middleware in Laravel 11+ prevents lazy resolution optimization. Hiding auth middleware in controllers makes security audit harder.

---

## Related Rules

* Prefer Route-Level Middleware For Broad Auth
* Use Static middleware() Method In Laravel 11+
* Never Duplicate Middleware At Both Levels
* Order Middleware Correctly

---

## Related Skills

* Implement Controller Middleware Assignment
