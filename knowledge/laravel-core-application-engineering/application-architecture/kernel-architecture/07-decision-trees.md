# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture
**Knowledge Unit:** Kernel Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Laravel 10- vs 11+ Kernel Configuration
* Middleware Registration Level (Global vs Group vs Route)
* Console Schedule Task Strategy

---

# Architecture-Level Decision Trees

---

## Decision 1: Laravel 10- vs 11+ Kernel Configuration

---

## Decision Context

Which API to use for middleware, exception handling, and routing configuration based on the Laravel version.

---

## Decision Criteria

* Laravel version (10- vs 11+)
* Existing configuration approach in the project
* Upgrade plans
* Team familiarity

---

## Decision Tree

What Laravel version is the project?
↓
Laravel 11+?
YES → Use `bootstrap/app.php` fluent API:
    `->withMiddleware()` for middleware
    `->withExceptions()` for exception handling
    `->withRouting()` for routes
    `->withSchedule()` for console schedule (Laravel 11+)
NO → Laravel 10-?
    YES → Use Kernel class properties:
        `$middleware`, `$middlewareGroups`, `$routeMiddleware` in `app/Http/Kernel.php`
        `$commands`, `schedule()` in `app/Console/Kernel.php`
        Handler class for exceptions

Is the project upgrading from 10- to 11+?
YES → Migrate configuration from Kernel classes to `bootstrap/app.php`
    Migrate exception handling from Handler class to `->withExceptions()`
    Remove deprecated Kernel and Handler files

---

## Rationale

Laravel 11+ moved middleware, exception handling, and routing configuration to `bootstrap/app.php` for a unified configuration surface. The fluent API is the upgrade-safe path. Kernel classes in 10- are the standard approach for earlier versions.

---

## Recommended Default

**Default:** `bootstrap/app.php` fluent API for Laravel 11+; Kernel class properties for Laravel 10-
**Reason:** The fluent API is the framework's declared customization contract in 11+. Using the appropriate API for the version ensures compatibility and follows framework conventions.

---

## Risks Of Wrong Choice

* Using Kernel class properties in Laravel 11+: Works but bypasses the fluent API, may miss new 11+ features
* Using fluent API in Laravel 10-: Not available — the API was introduced in 11+
* Not migrating during upgrade: Duplicate configuration, confusing behavior, deprecated files remaining

---

## Related Rules

* Never Put Business Logic in Kernel Classes (05-rules.md)
* Enable All Caches in Production (05-rules.md)
* Validate Middleware Order After Framework Upgrades (05-rules.md)

---

## Related Skills

* Skill: Configure Middleware Pipeline via Kernel

---

## Decision 2: Middleware Registration Level (Global vs Group vs Route)

---

## Decision Context

Where to register a middleware — as global (all routes), in a group (web/api), or as a route-specific alias.

---

## Decision Criteria

* Whether the middleware should apply to every route
* Whether it applies to web routes, API routes, or both
* Whether it should be selectively applied per-route
* Need for parameterization

---

## Decision Tree

Should the middleware apply to every HTTP request?
↓
YES → Global middleware (`$middleware` array or `->withMiddleware()` append)
NO → Does it apply to a specific route group (web, api)?
    YES → Group middleware (add to `web` or `api` group)
NO → Should it be applied per-route selectively?
    YES → Route middleware alias (e.g., `'auth'`, `'verified'`, `'throttle'`)
    YES → Apply to routes: `Route::get(...)->middleware('alias')`
NO → Does the middleware need parameters (e.g., throttle limits, roles)?
    YES → Route middleware alias with parameters: `->middleware('throttle:60,1')`
    YES → Use route-level registration for parameterized middleware

---

## Rationale

Global middleware runs on every request and should be reserved for security/infrastructure that truly applies everywhere (CORS, trust proxies). Group middleware applies to a logical subset of routes. Route-specific aliases provide per-route control.

---

## Recommended Default

**Default:** Group middleware for most middleware (web or api group); global only for cross-cutting infrastructure; route alias for per-route security (auth, throttle)
**Reason:** Group registration makes middleware visible in one place and consistent across routes. Global middleware adds unnecessary overhead to routes that don't need it.

---

## Risks Of Wrong Choice

* Middleware in wrong level: Runs too broadly (unnecessary overhead) or too narrowly (security gap)
* Middleware duplication across levels: Runs twice per request
* Using global for route-specific middleware: Per-request overhead for all routes

---

## Related Rules

* Never Duplicate Middleware Across Registration Points (05-rules.md)
* Keep Middleware Priority Explicit (05-rules.md)
* Remove Unused Framework Middleware (05-rules.md)
* Never Use withoutMiddleware() in Production (05-rules.md)

---

## Related Skills

* Skill: Configure Middleware Pipeline via Kernel

---

## Decision 3: Console Schedule Task Strategy

---

## Decision Context

How to define and manage scheduled Artisan commands, including overlap prevention and multi-server coordination.

---

## Decision Criteria

* Task duration relative to schedule interval
* Number of application servers
* Task criticality during maintenance
* Need for output monitoring

---

## Decision Tree

Does the task take longer than its schedule interval?
↓
YES → Use `->withoutOverlapping()` to prevent concurrent execution
    YES → Is the application deployed on multiple servers?
        YES → Also use `->onOneServer()` to run on a single server
        NO → `->withoutOverlapping()` only
NO → Is the task critical (must run even during maintenance)?
    YES → Use `->evenInMaintenance()`
    NO → Accept default behavior (skips during maintenance)
NO → Does the task produce output that needs monitoring?
    YES → Use `->emailOutputTo($email)` for error notification
    NO → Add output to log file or use `->runInBackground()`

---

## Rationale

Scheduled tasks without overlap prevention can accumulate concurrent processes, exhausting server resources. On multi-server deployments, `->onOneServer()` prevents duplicate execution. Monitoring via email output provides early warning for failing tasks.

---

## Recommended Default

**Default:** `->withoutOverlapping()` for any task that might exceed its interval; `->onOneServer()` for multi-server deployments; `->evenInMaintenance()` only for critical infrastructure tasks
**Reason:** Overlapping tasks waste resources and can cause data corruption. Multi-server deployments need single-server execution for most maintenance tasks.

---

## Risks Of Wrong Choice

* No `->withoutOverlapping()` for long tasks: Accumulating processes, server resource exhaustion, data races
* No `->onOneServer()` on multi-server: Every server runs the same task — wasted resources, duplicate work
* `->evenInMaintenance()` for non-critical tasks: Unnecessary execution during maintenance windows

---

## Related Rules

* Never Put Business Logic in Kernel Classes (05-rules.md)

---

## Related Skills

* Skill: Configure Middleware Pipeline via Kernel
