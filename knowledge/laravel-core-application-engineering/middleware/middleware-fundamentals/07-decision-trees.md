# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Middleware Fundamentals
**Generated:** 2026-06-03

---

# Decision Inventory

* Global vs Route Pipeline Registration
* Pre-Processing vs Post-Processing in Middleware
* Class Middleware vs Closure Middleware
* Single Concern vs Multi-Concern Middleware Design

---

# Architecture-Level Decision Trees

---

## Decision 1: Global vs Route Pipeline Registration

---

## Decision Context

Whether to register middleware in the global pipeline (runs before routing on every request) or the route pipeline (runs after routing on matched routes).

---

## Decision Criteria

* Whether the middleware modifies how the request is interpreted for routing
* Whether the middleware needs access to matched route data
* Whether the middleware applies to every request regardless of route
* Whether the middleware has database or I/O overhead

---

## Decision Tree

Does the middleware modify request interpretation (trusted proxies, CORS, maintenance mode)?
↓
YES → Global pipeline — must run before routing affects IP/scheme resolution
NO → Does the middleware need route parameters or matched route data?
    ↓
    YES → Route pipeline — route data is only available after routing
    NO → Does the middleware apply to every request including health checks, assets, OPTIONS?
        ↓
        YES → Does it perform database queries or I/O?
            ↓
            YES → Neither — move to route-group pipeline; global I/O middleware is an anti-pattern
            NO → Global pipeline — infrastructure concern (request ID, input sanitization)
        NO → Route pipeline — scoped to specific route groups

---

## Rationale

The global pipeline runs before routing and cannot access route context. The route pipeline runs after routing and provides full route data. Infrastructure middleware (trusted proxies, CORS) must run globally because they modify how the request is interpreted by the router. Application middleware (auth, throttle) needs route context and belongs in the route pipeline.

---

## Recommended Default

**Default:** Register middleware at the most restrictive tier possible — route-level for per-route concerns, group-level for shared concerns, global only for truly application-wide infrastructure.
**Reason:** Global middleware runs on EVERY request including health checks and assets. Unnecessary global middleware adds overhead with no benefit.

---

## Risks Of Wrong Choice

* Infrastructure middleware in route pipeline: Route matching uses incorrect IP/scheme/host; CORS preflight fails because routes don't match before middleware runs
* Application middleware globally: Cannot access route parameters; runs on asset requests and health checks; database queries on every request
* I/O middleware globally: Database connection pool exhaustion, increased latency on all endpoints

---

## Related Rules

* Never Place Business Logic in Middleware
* Keep Global Middleware Minimal

---

## Related Skills

* Implement a Correct handle() Method with Two-Pass Execution
* Apply the Cross-Cutting Boundary Test to New Middleware

---

---

## Decision 2: Pre-Processing vs Post-Processing in Middleware

---

## Decision Context

Whether a middleware should execute logic on the inbound pass (before `$next`), the outbound pass (after `$next`), or both.

---

## Decision Criteria

* Whether the logic operates on the request (inbound) or the response (outbound)
* Whether the middleware needs to short-circuit the request
* Whether the middleware needs data from both the request and the response

---

## Decision Tree

Does the middleware need to inspect or modify the request before the controller runs?
↓
YES → Does it need to short-circuit the request (return response without reaching controller)?
    ↓
    YES → Pre-only: place condition and short-circuit before `$next` — guard middleware pattern
    NO → Pre-only: place modification before `$next` — request enrichment pattern
NO → Does the middleware need to inspect or modify the response after the controller runs?
    ↓
    YES → Post-only: place logic after `$next` — response transformation, logging pattern
    NO → Does it need both request data AND response data (timing, audit)?
        ↓
        YES → Combined: capture inbound data before `$next`, process after — timing/logging pattern
        NO → The middleware does nothing — remove it from the pipeline

---

## Rationale

Code before `$next` runs during the inbound pass; code after runs during the outbound pass. Placing pre-processing code after `$next` causes it to execute on the response path, too late for request modifications. Placing post-processing before `$next` prevents access to the final response.

---

## Recommended Default

**Default:** Use combined pattern (pre + post) only when both directions are needed. Pre-only for guards and enrichment. Post-only for response decoration and logging.
**Reason:** Combined middleware is the most flexible but should be used intentionally — most middleware only needs one direction.

---

## Risks Of Wrong Choice

* Pre code after `$next`: Request modifications never reach the controller; the middleware appears to do nothing
* Post code before `$next`: Response modifications happen before the controller runs; the middleware modifies the wrong response object
* Missing post-processing: Security headers, CORS headers, or logging data are missing from the response

---

## Related Rules

* Place Pre-Processing Code Before $next and Post-Processing Code After
* Always Return the Result of $next($request)

---

## Related Skills

* Implement a Correct handle() Method with Two-Pass Execution
* Implement a Response Transformation Middleware for Response Decoration

---

---

## Decision 3: Class Middleware vs Closure Middleware

---

## Decision Context

Whether to define middleware as a dedicated class with constructor injection or as an inline closure on the route definition.

---

## Decision Criteria

* Whether the middleware needs dependency injection
* Whether the middleware is used on multiple routes
* Whether the middleware needs to be tested in isolation
* Whether the middleware is simple enough for a closure

---

## Decision Tree

Does the middleware need constructor injection (repositories, services, gateways)?
↓
YES → Class middleware — closures cannot receive constructor injection
NO → Is the middleware used on more than one route?
    ↓
    YES → Class middleware — DRY principle; avoid duplicating closure logic
    NO → Is the middleware complex enough to warrant its own test class?
        ↓
        YES → Class middleware — testable in isolation
        NO → Closure middleware — acceptable for trivial single-route checks

---

## Rationale

Class middleware is resolved via `Container::make()` and supports full dependency injection. Closure middleware is called directly and cannot receive injected dependencies. Class middleware can be unit tested with direct `handle()` invocation; closure middleware can only be tested through HTTP feature tests.

---

## Recommended Default

**Default:** Use class middleware for all middleware that has dependencies or is used on multiple routes. Use closure middleware only for trivial single-route checks.
**Reason:** Class middleware is testable, injectable, and reusable. Closure middleware is a convenience for one-off cases.

---

## Risks Of Wrong Choice

* Closure middleware with hidden `app()` calls: Bypasses explicit dependency declaration; cannot be mocked in tests
* Class middleware for a truly one-off check: File proliferation without benefit
* Closure middleware on multiple routes: Code duplication; inconsistency risk

---

## Related Rules

* Use $request->attributes->set() for Middleware-to-Controller Communication
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement a Correct handle() Method with Two-Pass Execution
* Implement Custom Middleware with Single-Responsibility Pattern

---

---

## Decision 4: Single Concern vs Multi-Concern Middleware Design

---

## Decision Context

Whether to create one middleware per cross-cutting concern or group multiple concerns into a single middleware class.

---

## Decision Criteria

* Whether the concerns are independently testable
* Whether the concerns have different registration tiers or priority positions
* Whether the concerns can be enabled/disabled independently
* Whether the concerns are semantically related

---

## Decision Tree

Can each concern be independently tested in isolation?
↓
NO → Merge into single middleware — concerns are tightly coupled (e.g., encrypt cookies + add queued cookies)
YES → Do the concerns need different registration tiers or priority positions?
    ↓
    YES → Separate middleware — each registered at appropriate tier
    NO → Can the concerns be enabled/disabled independently per route?
        ↓
        YES → Separate middleware — per-route composition requires independent classes
        NO → Are the concerns semantically related (e.g., all security headers)?
            ↓
            YES → Single middleware grouping related concerns — one class, one registration
            NO → Separate middleware — unrelated concerns must not share a class

---

## Rationale

Single-responsibility middleware is independently testable, composable, and selectively registrable. Multi-concern middleware (`UserSetupMiddleware` that checks auth, loads profile, checks subscription, sets locale) cannot be composed selectively — routes that need locale but not auth cannot use it.

---

## Recommended Default

**Default:** One middleware per cross-cutting concern. Use single-class grouping only for tightly related, always-applied concerns (e.g., security headers bundle).
**Reason:** Independent middleware is the foundation of composable pipelines. Loss of independence is the primary maintainability risk.

---

## Risks Of Wrong Choice

* Multi-concern middleware: Cannot enable/disable concerns independently; testing requires all concerns to be satisfied
* Excessive single-concern middleware (10+ trivial classes): Registration file bloat; pipeline construction overhead
* Coupled concerns in separate middleware: Race conditions or order dependencies between separate middleware classes

---

## Related Rules

* Never Place Business Logic in Middleware
* Keep Global Middleware Minimal

---

## Related Skills

* Apply the Cross-Cutting Boundary Test to New Middleware
* Identify and Fix Business Logic Leaking into Middleware
