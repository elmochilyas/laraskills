# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Vertical Slice Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Per-Feature Route File vs Single routes/web.php
* Route Prefixing per Feature vs Centralized Prefix Management
* Route Closure vs Controller in Feature Routes

---

# Architecture-Level Decision Trees

---

## Decision 1: Per-Feature Route File vs Single routes/web.php

---

## Decision Context

Whether to define routes in per-feature route files loaded by service providers or in the traditional centralized `routes/web.php`.

---

## Decision Criteria

* Number of features with HTTP endpoints
* Total route count
* Whether features are expected to be extracted into packages
* Whether the team prefers navigational locality (routes near controllers) or central overview

---

## Decision Tree

Does the application have 5+ features with HTTP endpoints?
↓
YES → Total routes > 100?
    YES → Per-feature route files — `web.php` with 200+ lines is unmanageable
    NO → Does the team prefer routes co-located with controllers?
        YES → Per-feature route files — each feature's routes live in its directory
        NO → Is feature extraction into packages planned?
            YES → Per-feature route files — extraction is simpler with co-located routes
            NO → Per-feature route files — 5+ features benefit from modular route management
NO → Total routes < 50?
    YES → Single `routes/web.php` — simpler setup, all routes visible in one file
    NO → Evaluate per-feature approach — 50-100 routes, 3-4 features is a gray area

---

## Rationale

Per-feature route files co-locate route definitions with the feature code they belong to. This modularizes route management — each feature's routes are in one place, and removing a feature means deleting its directory. The tradeoff is losing the single-file overview. At 5+ features, the modular benefit outweighs the overview loss.

---

## Recommended Default

**Default:** Single `routes/web.php` for small applications (<50 routes, <5 features). Per-feature route files for larger applications.
**Reason:** The single route file provides a centralized view of all endpoints. This is valuable for small projects but becomes unwieldy as the application grows.

---

## Risks Of Wrong Choice

* Single file with 200+ routes: Impossible to find the route for a specific feature — scrolling for minutes
* Per-feature files for 10 routes: File overhead — three route files with 3-4 lines each
* No route naming convention: Prefix collision between features
* Route closure in feature file: Breaks `php artisan route:cache` — performance regression

---

## Related Rules

* Never Use Route Closures In Feature Files
* Feature Route Namespace Convention

---

## Related Skills

* Create And Register Feature Routes

---

---

## Decision 2: Route Prefixing per Feature vs Centralized Prefix Management

---

## Decision Context

Whether to define route prefixes (`/billing`, `/users`) inside each feature's route file or manage them centrally in a route group.

---

## Decision Criteria

* Whether the feature prefix is stable or likely to change
* Whether multiple features share the same base prefix
* Whether API versioning is in play (`/api/v1/billing`)
* Whether the team wants prefix changes to be a single-line change or a per-file change

---

## Decision Tree

Is the feature prefix stable and unlikely to change?
↓
YES → Does the feature's service provider load routes with a group?
    YES → Apply prefix in the feature route file or the `loadRoutesFrom()` call — `Route::prefix('billing')->group(...)`
    NO → Apply prefix in the feature route file — `Route::prefix('admin/billing')->group(...)`
NO → Is the prefix likely to change (rebranding, restructuring)?
    YES → Centralize prefix management — define in a route service provider or config file
    NO → Are multiple features under the same base prefix (`/admin/billing`, `/admin/users`)?
        ↓
        YES → Centralize the common prefix in a parent group — each feature applies its own sub-prefix
        NO → Apply prefix in the feature route file

---

## Rationale

Route prefixes define the URL namespace for each feature. Per-feature prefixing keeps the prefix with the routes it affects. Centralized prefixing makes bulk changes easier but separates the prefix from the route definitions. For stable prefixes, per-feature is simpler.

---

## Recommended Default

**Default:** Define feature-specific route prefixes in the feature's route file or service provider. Centralize only shared prefixes (admin, api/v1).
**Reason:** Co-location keeps the URL structure with the routes. Shared prefixes are a cross-cutting concern that belongs in a central group.

---

## Risks Of Wrong Choice

* Prefix in route file with frequent changes: Must edit each feature file when prefix changes
* Centralized prefix with stable URLs: Separation of concerns — prefix is far from routes
* No prefix convention: Billing routes at `/billing` in one feature, `/admin/billing` in another — inconsistent
* Prefix collision: Two features register `/dashboard` — last one wins

---

## Related Rules

* Feature Route Namespace Convention
* Group Route Prefixing

---

## Related Skills

* Create And Register Feature Routes

---

---

## Decision 3: Route Closure vs Controller in Feature Routes

---

## Decision Context

Whether to define route logic inline via a closure or use a controller class in feature route files.

---

## Decision Criteria

* Whether route caching is used in production
* Whether the route logic is simple (redirect, health check) or complex (business logic)
* Whether the route logic needs to be testable independently
* Whether the route logic is reused elsewhere

---

## Decision Tree

Is `php artisan route:cache` used in production?
↓
YES → NEVER use closures — route caching serializes controllers, closures can't be serialized
NO → Is the route logic trivial (redirect, static page, health check)?
    YES → Does the logic need to be tested independently?
        YES → Use a controller — testable via controller tests
        NO → Use closure — acceptable only if route caching is never used
    NO → Use a controller — complex logic in a closure is untestable and unreusable
NO → Is the route logic reused (called from multiple routes or endpoints)?
    YES → Use a controller — single responsibility, reusable
    NO → Use a controller — testable, consistent with framework conventions

---

## Rationale

Route closures cannot be serialized for route caching. Even if caching isn't used today, using controllers is the safer default — it doesn't prevent caching, and controllers are testable, reusable, and follow Laravel conventions. Closures belong only in truly trivial, non-cached routes where the overhead of a controller file isn't justified.

---

## Recommended Default

**Default:** Always use controller classes in feature route files. Never use route closures.
**Reason:** Controllers enable route caching, are testable, and follow Laravel conventions. Closures provide no benefit over single-action controllers but prevent route caching.

---

## Risks Of Wrong Choice

* Closure with route caching: Route skipped during caching — performance regression in production
* Closure for complex logic: Untestable business logic embedded in a routing file
* Controller for single no-cache route: File overhead for a simple redirect
* Mixed closures and controllers: Inconsistent — some routes cached, some not

---

## Related Rules

* Never Use Route Closures In Feature Files
* Controller-Based Route Definition

---

## Related Skills

* Create And Register Feature Routes
