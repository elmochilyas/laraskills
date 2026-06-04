# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Middleware Lifecycle
**Generated:** 2026-06-03

---

# Decision Inventory

* Placement in Global Pipeline vs Route Pipeline
* Pre-Processing vs Post-Processing in Middleware Lifecycle
* Controller Constructor Initialization vs Lazy Initialization
* Terminable Middleware vs Queue-Based Post-Response Processing

---

# Architecture-Level Decision Trees

---

## Decision 1: Placement in Global Pipeline vs Route Pipeline

---

## Decision Context

Where in the two-pipeline architecture (global before routing, route after routing) a middleware should be placed.

---

## Decision Criteria

* Whether the middleware modifies request interpretation (trusted proxies, CORS, maintenance mode)
* Whether the middleware needs matched route data (parameters, named route, route middleware context)
* Whether the middleware applies to all requests or only matched routes

---

## Decision Tree

Does the middleware modify how the framework interprets the request (IP, scheme, host, OPTIONS handling)?
↓
YES → Global pipeline — must run before routing affects request interpretation
NO → Does the middleware need access to matched route data?
    ↓
    YES → Route pipeline — route data is only available after routing
    NO → Does the middleware apply to every request including unmatched (404) routes?
        ↓
        YES → Does it affect security or infrastructure (maintenance mode, IP validation)?
            ↓
            YES → Global pipeline — must run even before routing
            NO → Route pipeline — applies only to matched routes
        NO → Route pipeline — scoped to specific route collections

---

## Rationale

The global pipeline runs before routing. Middleware registered globally cannot access route parameters, the matched route name, or route-specific configuration. The route pipeline runs after the router has matched the request to a route. Middleware registered at the group or route level has full access to route context. Exceptions in global middleware prevent routing entirely; exceptions in route middleware prevent controller execution.

---

## Recommended Default

**Default:** Infrastructure middleware (trusted proxies, CORS, maintenance mode) in global pipeline. Application middleware (auth, throttle, bindings) in route pipeline.
**Reason:** Infrastructure must run before routing to affect request interpretation. Application middleware needs route context.

---

## Risks Of Wrong Choice

* Application middleware globally: Cannot access route parameters; `$request->route()` returns null
* Infrastructure middleware in route pipeline: Trusted proxies run after routing affected IP/scheme already; CORS OPTIONS routes may not match the route table
* Expensive middleware globally: Database queries on every request including 404s and health checks

---

## Related Rules

* Place Pre-Processing Code Before $next and Post-Processing Code After
* Understand Controller Instantiation Happens Before Middleware

---

## Related Skills

* Implement a Correct handle() Method with Two-Pass Execution
* Register Custom Middleware at the Correct Tier

---

---

## Decision 2: Pre-Processing vs Post-Processing in Middleware Lifecycle

---

## Decision Context

Where in a middleware's `handle()` method to place logic relative to the `$next($request)` call, considering the two-pass lifecycle.

---

## Decision Criteria

* Whether the logic should execute before the controller (inbound) or after (outbound)
* Whether the middleware needs to short-circuit the request
* Whether the middleware needs data from both inbound and outbound phases

---

## Decision Tree

Does the middleware need to evaluate a condition and potentially block the request?
↓
YES → Pre-processing before `$next` — short-circuit guards (auth, role check)
NO → Does the middleware modify the request for downstream use?
    ↓
    YES → Pre-processing before `$next` — request enrichment (tenant resolution, request ID)
    NO → Does the middleware modify the response for the client?
        ↓
        YES → Post-processing after `$next` — response transformation (headers, CORS, envelope)
        NO → Does the middleware capture data from both request and response?
            ↓
            YES → Combined — pre-processing before `$next`, post-processing after (timing, audit)
            NO → Post-processing after `$next` — logging, metrics (captures completed response)

---

## Rationale

Code before `$next` runs on the inbound pass as the request travels toward the controller. Code after `$next` runs on the outbound pass as the response travels back in reverse middleware order. The two passes are symmetrical — pre-processing runs in registration order, post-processing runs in reverse order.

---

## Recommended Default

**Default:** Pre-processing for guards and enrichment. Post-processing for response decoration and logging. Combined only when both directions are needed.
**Reason:** The two-pass model is the foundation of the Pipeline pattern. Placing logic in the wrong pass causes bugs that only manifest during specific execution paths.

---

## Risks Of Wrong Choice

* Request modification after `$next`: Modification runs on the outbound pass — too late to affect the controller
* Response modification before `$next`: The response hasn't been generated yet — modification runs on the wrong response object
* Short-circuit after `$next`: The controller has already executed; short-circuit wastes controller processing
* Combined middleware for simple logging: Unnecessary complexity — logging only needs the outbound pass

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

## Decision 3: Controller Constructor Initialization vs Lazy Initialization

---

## Decision Context

Whether to perform expensive initialization in the controller constructor (which executes before middleware) or defer to the controller method (which executes only if middleware passes).

---

## Decision Criteria

* Whether the controller is protected by guard middleware (auth, verified, role)
* Whether the initialization is expensive (database queries, API calls, file I/O)
* Whether the initialization is needed by all controller methods or only some

---

## Decision Tree

Does the controller have guard middleware that may short-circuit?
↓
YES → Can the initialization be deferred to individual controller methods?
    ↓
    YES → Lazy initialization — move expensive code to method bodies
    NO → Is the initialization cheap (<1ms, in-memory)?
        ↓
        YES → Constructor is acceptable — minimal cost even for short-circuited requests
        NO → Restructure — avoid expensive constructor work for guarded controllers
NO → Does the controller have no guard middleware (public routes)?
    ↓
    YES → Constructor initialization is acceptable — the controller always executes
    NO → N/A

---

## Rationale

Controllers are instantiated BEFORE middleware runs because the framework must gather controller middleware (via `HasMiddleware` or `#[Middleware]`). Expensive constructor initialization (database queries, API calls, file loads) executes even for requests that middleware short-circuits with 401 or 403. This is a commonly misunderstood framework behavior (GitHub issue laravel/framework#44177).

---

## Recommended Default

**Default:** Keep controller constructors lightweight — resolve dependencies but do not execute logic. Defer all expensive operations to controller methods.
**Reason:** Constructor logic executes unconditionally for every matched route. Lazy initialization ensures unauthorized requests don't pay the cost.

---

## Risks Of Wrong Choice

* Expensive constructor for guarded controller: Database queries execute on every matched route, including blocked auth requests
* Constructor that writes data: Side effects happen even for unauthorized requests; audit logs show phantom access
* Constructor throwing exceptions: Every matched route fails, even routes that would be short-circuited by middleware

---

## Related Rules

* Understand Controller Instantiation Happens Before Middleware
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement a Correct handle() Method with Two-Pass Execution
* Apply the Cross-Cutting Boundary Test to New Middleware

---

---

## Decision 4: Terminable Middleware vs Queue-Based Post-Response Processing

---

## Decision Context

Whether to use terminable middleware (runs after response sent, same process) or queue jobs (separate process) for post-response processing.

---

## Decision Criteria

* Whether the operation must execute on every request
* Whether the operation can tolerate async execution
* Whether the operation needs access to the Request and Response objects
* Whether the operation must execute reliably

---

## Decision Tree

Does the operation need access to the Request or Response object?
↓
NO → Queue job — `dispatch()->afterResponse()` or standard queue dispatch; more reliable
YES → Does the operation need guaranteed execution (must run even if server restarts)?
    ↓
    YES → Queue job with retries — terminable middleware may not fire in all server configurations
    NO → Is the operation lightweight (<100ms, no sync I/O)?
        ↓
        YES → Terminable middleware — runs in-process after response sent
        NO → Queue job — heavy processing in terminable blocks the web process
NO → Does the operation need to run in the same process (shared memory, connection pool)?
    ↓
    YES → Terminable middleware — same process context
    NO → Queue job — separate process, no blocking

---

## Rationale

Terminable middleware fires after `$response->send()` in the same process. It can access the completed request and response. However: a new instance is resolved for `terminate()` by default (register as singleton for state sharing), heavy processing blocks the web process, and `terminate()` may not fire in RoadRunner or some Swoole configurations. Queue jobs are more reliable but lose request/response context.

---

## Recommended Default

**Default:** Queue jobs for operations that must execute. Terminable middleware for lightweight, request/response-dependent operations that can tolerate not firing.
**Reason:** Queue jobs provide retry, async execution, and survive server crashes. Terminable middleware is for lightweight tasks that need the response context.

---

## Risks Of Wrong Choice

* Terminable middleware for critical operations: Server crash before `terminate()` means operation never runs
* Terminable middleware with heavy processing: Blocks the web process from handling the next request
* Queue for request/response-dependent operations: Request and response objects may not be serializable
* Terminable middleware without singleton registration: `terminate()` receives a fresh instance — state from `handle()` is lost

---

## Related Rules

* Do Not Store Per-Request State on Middleware Instance Properties
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement Terminable Middleware with Singleton Registration
* Write Direct Unit Tests for Custom Middleware
