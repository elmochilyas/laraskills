# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Custom Middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* Guard Middleware vs Logging/Enrichment Middleware Pattern
* Class Middleware with Injection vs Closure Middleware
* Parameterized Middleware vs Separate Middleware Classes
* Global vs Group vs Route-Level Registration for Custom Middleware

---

# Architecture-Level Decision Trees

---

## Decision 1: Guard Middleware vs Logging/Enrichment Middleware Pattern

---

## Decision Context

Whether to design custom middleware as a guard (short-circuits requests that fail conditions) or as an enrichment/logging middleware (modifies request/response without short-circuiting).

---

## Decision Criteria

* Whether the middleware evaluates a precondition that can fail
* Whether the middleware adds data without changing the request outcome
* Whether the middleware modifies the request or response

---

## Decision Tree

Does the middleware evaluate a precondition that may block the request?
↓
YES → Can the precondition failure be resolved by the client (auth, subscription)?
    ↓
    YES → Guard pattern — short-circuit with redirect or error response
    NO → Enrichment pattern — precondition is always met; no short-circuit needed
NO → Does the middleware add data to the request or response?
    ↓
    YES → Does it modify the request for downstream use?
        ↓
        YES → Enrichment pattern — use `$request->attributes->set()` for data passing
        NO → Does it add data to the response (headers, logging)?
            ↓
            YES → Post-processing enrichment — capture response, modify, return
            NO → No middleware needed — concern may not be cross-cutting
    NO → Does the middleware capture data for observability?
        ↓
        YES → Logging pattern — post-processing, no modification, may throw on dependency failure
        NO → No middleware needed

---

## Rationale

Guard middleware (auth, role check) short-circuits to prevent unauthorized access. Enrichment middleware (tenant resolution, request ID) adds data without blocking. Logging middleware (audit, metrics) observes without modifying. Each pattern has distinct testing and error handling requirements.

---

## Recommended Default

**Default:** Design guard middleware for authorization checks with short-circuit responses. Design enrichment middleware using `$request->attributes->set()` with no short-circuit. Design logging middleware as post-processing only.
**Reason:** The three patterns correspond to the three execution paths — pass-through, short-circuit, and modify-and-pass. Each has specific testing and failure handling needs.

---

## Risks Of Wrong Choice

* Guard middleware that doesn't short-circuit: Failed precondition silently passes; controller receives invalid state
* Enrichment middleware that short-circuits: Request data resolution failure blocks the entire request unnecessarily
* Logging middleware that throws on failure: Observability failure crashes the entire request
* Enrichment using `$request->merge()`: Pollutes user input; `$request->all()` and `$request->validated()` include non-user data

---

## Related Rules

* Place Pre-Processing Code Before $next and Post-Processing Code After
* Use $request->attributes->set() for Middleware-to-Controller Communication

---

## Related Skills

* Implement a Correct handle() Method with Two-Pass Execution
* Implement a Request Transformation Middleware for Request Enrichment

---

---

## Decision 2: Class Middleware with Injection vs Closure Middleware

---

## Decision Context

Whether to define custom middleware as a class (supports dependency injection, testable) or as an inline closure on the route definition.

---

## Decision Criteria

* Whether the middleware has dependencies that need injection
* Whether the middleware needs isolated unit testing
* Whether the middleware is reused across multiple routes
* Whether the middleware logic is complex enough to warrant a separate file

---

## Decision Tree

Does the middleware need dependencies resolved from the container?
↓
YES → Class middleware — closures have no constructor injection mechanism
NO → Is the middleware used on more than one route?
    ↓
    YES → Class middleware — DRY; avoid duplicating closure logic
    NO → Does the middleware logic exceed 5-10 lines?
        ↓
        YES → Class middleware — complexity warrants separate testable class
        NO → Closure middleware — acceptable for trivial single-use checks

---

## Rationale

Class middleware is resolved via `Container::make()` with full constructor injection. Closure middleware is called directly without container resolution. Class middleware supports direct unit testing via `$middleware->handle($request, $next)`; closures require HTTP feature tests.

---

## Recommended Default

**Default:** Class middleware for all custom middleware except trivial single-route inline checks.
**Reason:** Class middleware is testable, maintainable, and supports constructor injection. The cost of a file is negligible for the benefits gained.

---

## Risks Of Wrong Choice

* Closure middleware with facades or `app()`: Hidden dependencies that cannot be mocked in tests
* Class middleware for a single-route null check: Unnecessary file
* Closure middleware with 20+ lines: Untestable logic in route file

---

## Related Rules

* Always Return the Result of $next($request)
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement a Correct handle() Method with Two-Pass Execution
* Write Direct Unit Tests for Custom Middleware

---

---

## Decision 3: Parameterized Middleware vs Separate Middleware Classes

---

## Decision Context

Whether to create a single parameterized middleware (e.g., `CheckRole:admin,editor`) or separate middleware classes for each configuration variant.

---

## Decision Criteria

* Whether the middleware differs only in configuration values, not in logic
* Whether the number of configuration variants is small and stable
* Whether the parameter values are static or dynamic

---

## Decision Tree

Does the middleware differ only in configuration values (guard name, rate limit, role name)?
↓
YES → Are the configuration values static and known at route definition time?
    ↓
    YES → Parameterized middleware — single class, colon-delimited parameters
    NO → Do the values depend on runtime state (user tier, subscription plan)?
        ↓
        YES → Named resolvers or dynamic configuration — parameterized middleware with static values
        NO → Separate classes — fundamentally different behaviors need separate classes
NO → Does the middleware logic differ fundamentally per configuration?
    ↓
    YES → Separate middleware classes — different behaviors cannot share a handle() method
    NO → Parameterized middleware — single class with branching on parameter values

---

## Rationale

Parameterized middleware eliminates configuration duplication by accepting colon-delimited parameters from the route definition. Parameters are positional and mapped to `handle()` arguments after `$request` and `$next`. Named limiters and resolvers provide dynamic configuration for runtime-dependent values.

---

## Recommended Default

**Default:** Parameterized middleware for concerns that differ only in configuration values. Separate classes for fundamentally different behaviors.
**Reason:** Parameterized middleware reduces class proliferation. The colon-syntax is the Laravel convention used by `auth:sanctum`, `throttle:60,1`, and `can:update,post`.

---

## Risks Of Wrong Choice

* Separate classes per configuration: Class explosion (10+ middleware files for 10 auth guard variants)
* Parameterized middleware for different behaviors: Complex `if/else` chains in `handle()`; violates single responsibility
* Missing default values for optional parameters: TypeError when middleware used without parameters

---

## Related Rules

* Never Place Business Logic in Middleware
* Use $request->attributes->set() for Middleware-to-Controller Communication

---

## Related Skills

* Implement Parameterized Middleware with Colon-Delimited Syntax
* Write Direct Unit Tests for Custom Middleware

---

---

## Decision 4: Global vs Group vs Route-Level Registration for Custom Middleware

---

## Decision Context

Which registration tier to use when adding custom middleware to the application.

---

## Decision Criteria

* Whether the middleware applies to every request
* Whether the middleware applies to a route collection
* Whether the middleware applies to individual routes
* Whether the middleware needs route context

---

## Decision Tree

Does the middleware apply to every HTTP request without exception?
↓
YES → Does it need to run before routing (request interpretation)?
    ↓
    YES → Global — infrastructure concerns (trusted proxies, CORS, request ID)
    NO → Does it perform I/O or database queries?
        ↓
        YES → Group-level — never register I/O middleware globally
        NO → Global — input sanitization, request ID generation
NO → Does the middleware apply to a well-defined set of routes?
    ↓
    YES → Group-level — define middleware group for the route collection
    NO → Does it apply to individual routes with varying configuration?
        ↓
        YES → Route-level — per-route configuration via colon-delimited parameters
        NO → Does it apply to controller methods?
            ↓
            YES → Controller-level — via HasMiddleware interface or #[Middleware] attribute
            NO → No registration needed — middleware may not be cross-cutting

---

## Rationale

The three registration tiers provide granularity from application-wide to per-route. Global runs on every request before routing. Group runs on route collections after routing. Route-level runs on individual routes. Controller-level runs per controller method. Choosing the right tier prevents unnecessary middleware execution.

---

## Recommended Default

**Default:** Register at the most restrictive tier that covers all intended routes. Group-level for shared concerns, route-level for per-route concerns, global only for truly universal infrastructure.
**Reason:** Restrictive registration prevents middleware from running on unintended routes and avoids unnecessary overhead.

---

## Risks Of Wrong Choice

* Global registration for group-specific middleware: Runs on asset requests, health checks, API routes that don't need it
* Route-level registration for group-wide middleware: Must be added to every route individually; easy to forget
* Group registration for a single route: Adds middleware to entire group unnecessarily
* Controller-level middleware in global array: Controller method signature detection fails; middleware never runs

---

## Related Rules

* Keep Global Middleware Minimal
* Never Place Business Logic in Middleware

---

## Related Skills

* Register Custom Middleware at the Correct Tier
* Implement a Correct handle() Method with Two-Pass Execution
