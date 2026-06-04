# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Cross-Cutting Concerns
**Generated:** 2026-06-03

---

# Decision Inventory

* Middleware vs Service/Action for a New Concern
* Single Concern per Middleware vs Grouped Concerns
* Split Concern Pattern (HTTP + Domain) vs All-in-One
* Middleware Registration Tier Selection

---

# Architecture-Level Decision Trees

---

## Decision 1: Middleware vs Service/Action for a New Concern

---

## Decision Context

Whether a new cross-cutting concern should be implemented as middleware (HTTP pipeline) or as a service/action (business logic).

---

## Decision Criteria

* Whether the concern operates on HTTP primitives (headers, request, response, status codes)
* Whether the concern operates on domain primitives (models, entities, business rules)
* Whether the concern applies to multiple routes/controllers
* Whether the concern can short-circuit the request independently of business outcome

---

## Decision Tree

Does the concern operate on HTTP primitives (headers, request, response, cookies, session, status codes)?
↓
YES → Does it also operate on domain primitives (models, entities, business rules)?
    ↓
    YES → Split concern — HTTP part in middleware, domain part in service/action
    NO → Middleware — purely HTTP-level concern
NO → Does the concern operate on domain primitives?
    ↓
    YES → Does it apply to multiple routes/controllers?
        ↓
        YES → Service/Action — domain logic extracted from HTTP context
        NO → Controller — single-operation domain logic belongs in controller or action
    NO → Neither — concern may not belong in the application at all
NO → Can the concern short-circuit the request independently of business outcome?
    ↓
    YES → Middleware — short-circuit is an HTTP-level decision
    NO → Service/Action — non-short-circuiting business logic

---

## Rationale

The boundary between middleware and business logic is defined by two questions: "Does this operate on HTTP primitives?" (→ middleware) and "Does this operate on domain primitives?" (→ service/action). If both, split: the HTTP part goes in middleware, the domain part goes in a service/action. This is the most frequently violated boundary in Laravel applications.

---

## Recommended Default

**Default:** Middleware for HTTP-level concerns (auth, CORS, headers, rate limiting). Services/actions for domain logic (business rules, calculations, side effects). Split pattern for concerns with both HTTP and domain aspects.
**Reason:** The middleware/business boundary is the most important architectural separator in the HTTP pipeline. Misplacing either side creates coupling and testing problems.

---

## Risks Of Wrong Choice

* Business logic in middleware: Coupled to HTTP; untestable without HTTP simulation; unreusable from CLI/queue
* HTTP logic in service: Service depends on Request/Response; cannot be tested without HTTP boot
* Split concern not split: HTTP+domain combined in middleware creates the worst of both worlds
* Cross-cutting concern in controller: Every controller duplicates the concern; easy to miss one

---

## Related Rules

* Never Place Business Logic in Middleware
* Never Split a Single Concern Across Middleware and Controller Logic

---

## Related Skills

* Apply the Cross-Cutting Boundary Test to New Middleware
* Identify and Fix Business Logic Leaking into Middleware

---

---

## Decision 2: Single Concern per Middleware vs Grouped Concerns

---

## Decision Context

Whether to design one middleware class per cross-cutting concern or group related concerns into a single class.

---

## Decision Criteria

* Whether the concerns are independently testable
* Whether the concerns have different registration requirements
* Whether the concerns can be composed selectively

---

## Decision Tree

Can each concern be tested independently of the others?
↓
NO → Grouped — concerns are tightly coupled (e.g., EncryptCookies + AddQueuedCookiesToResponse)
YES → Do the concerns need different registration tiers or priority positions?
    ↓
    YES → Separate — each registered at its appropriate tier
    NO → Can the concerns be applied to routes independently?
        ↓
        YES → Separate — route-level composition requires independent classes
        NO → Are the concerns semantically identical (all security headers)?
            ↓
            YES → Grouped — bundle tightly related concerns (e.g., SecurityHeadersMiddleware)
            NO → Separate — unrelated concerns must not share a class

---

## Rationale

Single-responsibility middleware can be independently enabled, disabled, reordered, and tested. A `UserSetupMiddleware` that checks auth, loads profile, checks subscription, and sets locale cannot be composed selectively — routes that need locale but not auth cannot use it without auth running.

---

## Recommended Default

**Default:** One middleware per cross-cutting concern. Group only for tightly related, always-applied concerns (security headers bundle).
**Reason:** Independent testing and selective composition are more valuable than reduced file count.

---

## Risks Of Wrong Choice

* Grouped unrelated concerns: Cannot compose selectively; testing requires all concerns to be satisfied
* Excessive single-concern middleware: Registration file bloat; minor overhead from additional file inclusion
* Tightly coupled concerns separated: Race conditions or order dependencies between separate middleware
* Concern hidden inside grouped middleware: Developers don't know a concern exists until it causes a bug

---

## Related Rules

* Never Place Business Logic in Middleware
* Never Split a Single Concern Across Middleware and Controller Logic

---

## Related Skills

* Apply the Cross-Cutting Boundary Test to New Middleware
* Implement Custom Middleware with Single-Responsibility Pattern

---

---

## Decision 3: Split Concern Pattern (HTTP + Domain) vs All-in-One

---

## Decision Context

Whether to split concerns that have both HTTP and domain aspects into separate middleware (HTTP) and service (domain) or keep them together.

---

## Decision Criteria

* Whether the concern has both HTTP-level and domain-level operations
* Whether the domain part can be tested independently
* Whether the domain part is reusable outside the HTTP context

---

## Decision Tree

Does the concern have both HTTP-level operations and domain-level operations?
↓
NO → All-in-one — purely HTTP or purely domain; no split needed
YES → Can the domain part be tested independently of the HTTP part?
    ↓
    YES → Can the domain part be reused outside HTTP context (CLI, queue, events)?
        ↓
        YES → Split — middleware for HTTP, service/action for domain; domain is independently reusable
        NO → Split — benefit of independent testing still justifies separation
    NO → All-in-one — concerns are too tightly coupled to split cleanly
NO → Does the split create cleaner boundaries?
    ↓
    YES → Split — even without current reuse, separation pays off as the application grows
    NO → All-in-one — premature separation adds ceremony without benefit

---

## Rationale

The split concern pattern (HTTP part in middleware, domain part in service) is the recommended approach for concerns like authentication. Auth middleware checks the session/token (HTTP), the login service verifies credentials (domain). The middleware handles HTTP gating and redirects; the service handles credential verification, token generation, and event dispatching.

---

## Recommended Default

**Default:** Split for authentication, authorization (role-level), and any concern that mixes HTTP checks with domain logic. All-in-one for pure infrastructure concerns (CORS, security headers).
**Reason:** Splitting is the mature pattern that prevents HTTP coupling from leaking into domain logic. It's rarely documented as a pattern but is consistently used in well-architected Laravel applications.

---

## Risks Of Wrong Choice

* All-in-one middleware with domain logic: Business rules in middleware; coupled to HTTP; cannot be reused
* Split without clear boundary: Both middleware and service contain overlapping logic; confusion about ownership
* Service calling middleware: Inverted dependency — domain code should not depend on HTTP
* Middleware calling service directly: Tight coupling; service cannot be tested in isolation from middleware

---

## Related Rules

* Never Place Business Logic in Middleware
* Never Split a Single Concern Across Middleware and Controller Logic

---

## Related Skills

* Identify and Fix Business Logic Leaking into Middleware
* Apply the Cross-Cutting Boundary Test to New Middleware

---

---

## Decision 4: Middleware Registration Tier Selection

---

## Decision Context

Which registration tier (global, group, route, controller) to use for a given cross-cutting concern.

---

## Decision Criteria

* Scope of the concern (all routes, route collection, individual routes)
* Whether the concern must run before routing
* Whether the concern has I/O dependencies

---

## Decision Tree

Must the concern run before routing (affects request interpretation)?
↓
YES → Global — infrastructure concerns (trusted proxies, CORS, maintenance mode)
NO → Does the concern apply to every request?
    ↓
    YES → Does the concern perform I/O or database queries?
        ↓
        YES → Group — never register I/O middleware globally
        NO → Is the concern purely infrastructure (input sanitization, request ID)?
            ↓
            YES → Global — in-memory, applies to all requests
            NO → Group — application concern should be scoped
    NO → Is the concern shared by a well-defined route collection?
        ↓
        YES → Group — define or use existing middleware group
        NO → Does the concern apply to individual routes?
            ↓
            YES → Route-level — per-route via `->middleware()`
            NO → Controller-level — via HasMiddleware or #[Middleware]

---

## Rationale

Each tier has different characteristics: global runs before routing, group and route run after routing. Global middleware cannot be removed from any route (additive-only constraint). Route-level middleware is visible in route definitions. Controller-level middleware is less visible but provides method-level granularity.

---

## Recommended Default

**Default:** Group-level for most application concerns. Route-level for per-route configuration. Global only for infrastructure. Controller-level for method-specific middleware.
**Reason:** Group-level provides the best balance of scope coverage and restriction. Route-level is explicit in route files. Global is too broad for most concerns.

---

## Risks Of Wrong Choice

* Global for group concern: Runs on every request including unintended routes; I/O middleware adds unnecessary load
* Route-level for group concern: Must be added to every route manually; easy to forget
* Controller-level for route concern: Hidden in controller; not visible in route definitions
* Global for I/O middleware: Database queries on health checks, assets, and OPTIONS requests

---

## Related Rules

* Keep Global Middleware Minimal
* Never Place Business Logic in Middleware

---

## Related Skills

* Register Custom Middleware at the Correct Tier
* Apply the Cross-Cutting Boundary Test to New Middleware
