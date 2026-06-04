# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Front Controller pattern
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Front Controller customization point — middleware vs service provider vs index.php
* Decision 2: Middleware organization — global vs route middleware
* Decision 3: Bootstrap optimization — Octane vs traditional vs hybrid

---

# Architecture-Level Decision Trees

---

## Decision: Front Controller Customization Point — Middleware vs Service Provider vs index.php

---

## Decision Context

Choose where to add application-wide behavior in the Front Controller pipeline.

---

## Decision Criteria

* performance considerations: middleware adds request-time overhead; service providers are boot-time cost
* architectural considerations: middleware operates on request/response; service providers configure the container
* security considerations: middleware is ideal for auth, rate limiting, CORS
* maintainability considerations: middleware is the standard extension point; index.php modifications are dangerous

---

## Decision Tree

Does the behavior need to operate on every request (auth, logging, CORS, rate limiting)?
↓
YES → Middleware (standard Front Controller extension point)
    ↓
    Does the middleware need access to the request and response?
    YES → Middleware is the correct choice (request/response manipulation)
    ↓
    Should the middleware run before the controller (pre-processing) or after (post-processing)?
    → Pre-processing: authentication, validation, rate limiting
    → Post-processing: response transformation, logging
    NO → Service provider (behavior configures the container or registers services)
NO → Is the behavior a one-time setup (register bindings, configure services)?
    YES → Service provider (boot-time configuration, not request-time)
    ↓
    Does the behavior need to run before middleware?
    YES → Service provider (runs during boot, before any requests)
    NO → Service provider (this is the standard setup location)
NO → Should index.php be modified?
    NEVER → index.php changes are not testable, bypass the framework lifecycle
    ↓
    Add custom behavior via middleware, service providers, or bootstrappers instead
    index.php should only handle the framework bootstrap

---

## Rationale

Middleware is the standard Front Controller extension point for request/response behavior. Service providers handle boot-time configuration. `index.php` should never be modified — it's the framework's bootstrap entry point, not an application extension point. Adding logic to `index.php` bypasses middleware, routing, and testability.

---

## Recommended Default

**Default:** Middleware for request/response behavior. Service providers for configuration and bindings. Never modify `index.php`.

**Reason:** Middleware is the designed extension point — it's testable, orderable, and part of the framework lifecycle. Service providers handle boot-time concerns. `index.php` modifications are untestable and bypass framework features.

---

## Risks Of Wrong Choice

Logic in `index.php`: untestable, bypasses middleware and routing, hard to debug. Service provider for request-time behavior: container is configured, but middleware is the correct place. Middleware for boot-time setup: runs on every request, wasted computation.

---

## Related Rules

- Rule 1: Middleware is the Front Controller extension point — add request/response behavior here
- Rule 2: Service providers handle boot-time configuration, not request-time processing
- Rule 3: Never modify `index.php` — use middleware or service providers

---

## Related Skills

- Design Custom Middleware
- Configure Service Providers

---

## Decision: Middleware Organization — Global vs Route Middleware

---

## Decision Context

Choose whether middleware runs on all routes (global) or on specific routes only.

---

## Decision Criteria

* performance considerations: global middleware runs on every request (including static assets, API calls)
* architectural considerations: global middleware is convenient; route middleware is explicit
* security considerations: global security middleware is safer (can't forget to apply); route middleware requires intentional assignment
* maintainability considerations: global middleware is simpler; route middleware is more flexible

---

## Decision Tree

Does the middleware need to run on EVERY request to the application?
↓
YES → Global middleware (applied automatically to all routes)
    ↓
    Examples: CORS, request logging, maintenance mode check, trusted proxies
    ↓
    Would skipping it on some routes cause security or consistency issues?
    YES → Definitely global (must not be bypassable)
    NO → Consider route middleware (fewer unnecessary middleware invocations)
NO → Does the middleware apply to a group of related routes?
    YES → Route middleware assigned in route groups (grouped in routes file)
    ↓
    Can the group be defined once and assigned to all routes in the group?
    YES → Route group middleware (clean, DRY)
    ↓
    `Route::middleware(['auth', 'verified'])->group(...);`
    NO → Individual route middleware (assigned per route)
NO → Is the middleware applied to a single route?
    YES → Route-specific middleware
    ↓
    Can middleware parameters control behavior (e.g., `throttle:60,1`)?
    YES → Parameterized route middleware (flexible, configurable)
    NO → Simple route middleware assignment

---

## Rationale

Global middleware runs on every request — ideal for cross-cutting concerns that must never be bypassed. Route middleware (assigned to groups or individual routes) provides finer control. The rule: if skipping the middleware would be a security or consistency issue, it should be global. Otherwise, apply to specific routes/groups.

---

## Recommended Default

**Default:** Route group middleware for authorization, authentication, and feature-specific concerns. Global middleware for security, CORS, and request logging.

**Reason:** Route middleware is explicit and flexible. Global middleware is for concerns that must apply universally. Route group middleware provides the best balance of coverage and explicitness.

---

## Risks Of Wrong Choice

Global middleware for everything: unnecessary processing on every route, including static files. Route middleware for security: forget to apply to a new route, security gap. Global middleware for heavy operations: performance impact on every request.

---

## Related Rules

- Rule 4: Security middleware (auth, CORS) should be global or applied to all relevant routes
- Rule 5: Performance-sensitive middleware should be route-specific, not global

---

## Related Skills

- Configure Global Middleware
- Assign Route Middleware

---

## Decision: Bootstrap Optimization — Octane vs Traditional vs Hybrid

---

## Decision Context

Choose the application serving strategy to optimize Front Controller bootstrap cost.

---

## Decision Criteria

* performance considerations: Octane eliminates per-request bootstrap (20-50ms saved); traditional boots every request
* architectural considerations: Octane requires memory leak prevention and state management
* security considerations: Octane requires per-request state isolation to prevent data leakage
* maintainability considerations: traditional is simpler; Octane requires awareness of long-lived processes

---

## Decision Tree

Does the application have high traffic (>100 req/s average)?
↓
YES → Octane is worth the complexity
    ↓
    Is the team experienced with long-lived PHP processes?
    YES → Octane (max performance benefit)
    ↓
    Are there known memory leaks (large identity maps, static state)?
    YES → Address leaks before deploying Octane (or use Octane's reset capabilities)
    NO → Octane deployment is safe
    NO → Train team on Octane patterns first — then migrate
NO → Does the application have peak traffic bursts that require fast response?
    YES → Octane (reduces p99 latency by eliminating bootstrap)
    ↓
    Can the team handle Octane's state management requirements?
    YES → Octane (significant latency improvement)
    NO → Traditional + opcache is sufficient
NO → Traditional PHP-FPM + opcache (simpler, sufficient for <100 req/s)
    ↓
    Is the bootstrap cost acceptable (<50ms) for the user experience?
    YES → Traditional is fine
    ↓
    Optimize: route caching, config caching, view caching, opcache
    NO → Consider Octane for the critical paths only

---

## Rationale

Octane eliminates the per-request bootstrap cost by booting the application once and handling multiple requests in the same process. This provides significant performance improvements but requires careful state management. Traditional PHP-FPM is simpler and sufficient for low-traffic applications. The decision is a tradeoff between performance and operational complexity.

---

## Recommended Default

**Default:** Traditional PHP-FPM for most applications. Octane only when traffic volume or latency requirements justify the operational complexity.

**Reason:** Traditional FPM is simpler, well-understood, and doesn't require state management discipline. Octane's performance benefit is substantial but comes with added complexity.

---

## Risks Of Wrong Choice

Octane without state management: data leakage between requests, memory leaks, unpredictable behavior. Traditional for high traffic: unnecessary CPU waste on repeated bootstrap, higher p99 latency. Octane with global state: static variables persist between requests.

---

## Related Rules

- Rule 6: Octane requires explicit request-state isolation — no static state, flush identity maps
- Rule 7: Use route/config caching to reduce bootstrap cost in traditional mode

---

## Related Skills

- Configure Laravel Octane
- Optimize Front Controller Bootstrap
