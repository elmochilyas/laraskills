# REST Architectural Constraints — Decision Trees

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: rest-architectural-constraints
- Phase: 7-decision-trees
- Last Updated: 2026-06-02

## Decision Inventory

| ID | Decision | When Relevant |
|----|----------|---------------|
| D1 | Which middleware group to use for API routes | Route registration |
| D2 | Which authentication strategy to use for APIs | API security design |
| D3 | What cache headers to set on responses | Every API response |
| D4 | Whether to use session state in API handlers | Stateful operation requirements |
| D5 | Which constraints to apply vs skip | API architecture planning |
| D6 | How to handle client-specific state without sessions | Cart, wizard, multi-step workflows |

## Architecture-Level Decision Trees

### D1: Which middleware group to use for API routes

**Decision Context:**
Laravel provides `api` and `web` middleware groups. The `web` group includes session and cookie middleware that break statelessness. Using the wrong group is the most common REST constraint violation in Laravel APIs.

**Criteria:**
- Does the route need session state (session(), flash data)?
- Does the route need CSRF protection?
- Is the API consumed by non-browser clients?

**Decision Tree:**

```
Does the route need server-side session state?
├── YES
│   ├── Is this a same-domain SPA where Sanctum SPA auth is used?
│   │   ├── YES → Use api middleware + Sanctum's EnsureFrontendRequestsAreStateful
│   │   └── NO → This route may not be an API — reconsider route type
│   └── Outcome: Prefer stateless; only add stateful middleware for specific routes
│
└── NO — API route should be stateless
    ├── Use the `api` middleware group
    │   - No StartSession, ShareErrorsFromSession, or EncryptCookies
    │   - Token-based authentication
    │   - Stateless by design
    └── Outcome: api middleware group for all API routes
```

**Rationale:**
The `api` middleware group excludes session middleware by design, enforcing statelessness. Adding session middleware to API routes breaks horizontal scaling (requiring sticky sessions), introduces CSRF requirements, and creates hidden server state.

**Default Decision:**
Use the `api` middleware group for all API routes. Never add session middleware.

**Risks:**
- Same-domain SPAs need stateful Sanctum middleware — add selectively, not globally
- Accidentally using `Route::resource()` (web routes) instead of `Route::apiResource()` for APIs
- Adding `web` middleware for convenience leads to stateful API anti-pattern

**Related Rules:**
- Use The API Middleware Group For Statelessness

**Related Skills:**
- Laravel Middleware Architecture
- Sanctum Authentication

---

### D2: Which authentication strategy to use for APIs

**Decision Context:**
Laravel supports session-based (web), token-based (Sanctum/Passport), and OAuth authentication for APIs. Session-based auth breaks the statelessness constraint.

**Criteria:**
- Is the consumer a browser-based SPA on the same domain?
- Is the consumer a third-party API client?
- Is horizontal scaling required?

**Decision Tree:**

```
Is the API consumer a browser-based SPA on the same domain?
├── YES
│   └── Sanctum SPA authentication (cookie + CSRF)
│       Stateful only for the initial auth endpoint
│       Subsequent requests use API tokens
│
├── NO — API consumer is a mobile app, third-party, or other server
│   ├── Is OAuth 2.0 required (third-party app authorization)?
│   │   ├── YES → Laravel Passport (full OAuth2 implementation)
│   │   └── NO → Sanctum tokens (simpler, sufficient for most APIs)
│   └── Outcome: Token-based — always stateless
│
└── Session-based auth (auth:web) for APIs?
    → NEVER — breaks statelessness, prevents horizontal scaling
    Use token-based auth for all API routes
```

**Rationale:**
Tokens are self-contained or database-backed credentials the client sends with every request. This enables any server instance to authenticate without session affinity, enabling horizontal scaling.

**Default Decision:**
Sanctum token-based authentication for all API routes.

**Risks:**
- SPA Sanctum auth uses cookies (stateful) — document as exception
- Token storage on client (mobile/web) must be secure
- Token revocation requires server-side check (database or cache lookup)

**Related Rules:**
- Use Token-Based Authentication For APIs

**Related Skills:**
- Sanctum Authentication
- API Security Patterns

---

### D3: What cache headers to set on responses

**Decision Context:**
Every API response should declare its cacheability. Without explicit headers, intermediaries make unpredictable caching decisions.

**Criteria:**
- Is the response user-specific (authenticated, personalized)?
- Is the response public (shared across users)?
- Should the response be cached at all?

**Decision Tree:**

```
Does the response contain user-specific data?
├── YES (profile, dashboard, personal settings)
│   └── Cache-Control: private — browser-only, no shared caching
│       private, max-age=3600
│       Also: private, no-cache (no caching at all for sensitive data)
│
├── NO — public data (product catalog, blog posts, public listings)
│   ├── Should the response be cached?
│   │   ├── YES → Cache-Control: public with max-age
│   │   │   public, max-age=3600  (also: s-maxage for CDN)
│   │   └── NO → Cache-Control: no-cache, no-store
│   │       (rare for public data)
│   └── Outcome: public for shared, private for user-specific
│
└── Error response (4xx/5xx)?
    → Cache-Control: no-store — never cache errors
```

**Rationale:**
`public` allows CDNs to cache and serve to any user. `private` restricts caching to the browser. `no-store` prevents all caching. Explicit headers prevent unpredictable behavior regardless of the infrastructure layer.

**Default Decision:**
Always set explicit `Cache-Control` on every response. `public` for shared data, `private` for user-specific data, `no-store` for errors.

**Risks:**
- `public` on user-specific data leaks private data to other users
- Missing cache headers leads to unpredictable caching by intermediaries
- `no-cache` vs `no-store` confusion — `no-store` is stronger

**Related Rules:**
- Set Explicit Cache Headers On Every Response
- Distinguish Public vs Private Cache Headers

**Related Skills:**
- Response Caching Headers
- Conditional Requests

---

### D4: Whether to use session state in API handlers

**Decision Context:**
Statelessness requires every request to carry all information the server needs. Session state in API handlers is the most common violation of the REST statelessness constraint.

**Criteria:**
- Does the handler need data from a previous request?
- Can the client send that data with every request?
- Is there a resource-based alternative?

**Decision Tree:**

```
Does the handler need to access data from a previous request?
├── NO → No session dependency — stateless by design (good)
├── YES
│
│   Can the client send the needed data with every request?
│   ├── YES → Pass data via request body, headers, or query params
│   │   Example: cart ID in header instead of session
│   └── NO
│
│       Can the needed state be modeled as a server resource?
│       ├── YES → Create a resource endpoint for the state
│       │   POST /carts (create cart), POST /carts/{cart}/items (add item)
│       │   State is stored in DB, not session — fully stateless
│       └── NO
│
│           Is this a legacy constraint that cannot be changed?
│           ├── YES → Document as constraint violation; plan migration
│           └── NO → Refactor to stateless alternative
```

**Rationale:**
Using `session()` in API routes introduces server-side state between requests, breaking statelessness. This prevents horizontal scaling and creates hidden dependencies. State should be modeled as resources.

**Default Decision:**
Never access `session()` in API routes. Model client-specific state as server resources.

**Risks:**
- Legacy code may heavily depend on session state — migration is expensive
- Some operations genuinely benefit from session (multi-step wizards) — model as resources instead
- SPA Sanctum auth uses limited state — acceptable documented exception

**Related Rules:**
- Never Access session() In API Routes

**Related Skills:**
- Resource Controllers
- Stateless Design Patterns

---

### D5: Which constraints to apply vs skip

**Decision Context:**
The six REST constraints are interdependent and produce their architectural benefits when applied together. However, some constraints (HATEOAS, code on demand) provide diminishing returns for many use cases.

**Criteria:**
- Is the API public or internal?
- Are clients hypermedia-aware?
- Is horizontal scaling needed?
- Is caching beneficial?

**Decision Tree:**

```
Apply these constraints always (Pareto 80%):
├── Client-Server → Always — Laravel enforces this naturally
├── Stateless → Always — API middleware, token auth
├── Cacheable → Always — explicit headers on every response
└── Layered System → Always — middleware, reverse proxy, CDN naturally

Consider these constraints:
├── Uniform Interface (Level 2)
│   ├── Apply: Resource URLs, HTTP methods, status codes, content-type headers
│   └── Relax: HATEOAS sub-constraint (see below)
│
├── HATEOAS (Uniform Interface sub-constraint, Level 3)
│   ├── Apply if: Clients are hypermedia-aware or public API
│   ├── Skip if: Simple CRUD, internal API, no client benefit
│   └── Partial: Self links + pagination links (pragmatic minimum)
│
└── Code on Demand
    → Almost never applicable to API design (security risk)
    Skip unless there's a specific requirement for downloadable code
```

**Rationale:**
REST constraints are designed for specific architectural properties. Applying 4 of 6 constraints delivers the most important benefits (scalability, caching, decoupling). The remaining 2 (HATEOAS, code on demand) provide diminishing returns for most APIs.

**Default Decision:**
Apply client-server, stateless, cacheable, layered system, and uniform interface (partial — Level 2). Skip HATEOAS unless justified. Skip code on demand always.

**Risks:**
- Cherry-picking constraints without understanding interdependencies
- Partial constraint adoption produces an "HTTP API" not "REST API" — use accurate terminology
- Constraints skipped today may be needed later — design for evolvability

**Related Rules:**
- Apply All Six Constraints As A System
- Use Correlation IDs For Request Tracing
- Design For Horizontal Scaling Without Session Affinity

**Related Skills:**
- REST Maturity Model
- REST Purity vs Pragmatic

---

### D6: How to handle client-specific state without sessions

**Decision Context:**
Multi-step wizards, shopping carts, and other stateful workflows need to persist state across requests. Without sessions, this state must be modeled as API resources.

**Criteria:**
- Does the state belong to a single client?
- Does the state change across multiple requests?
- Is the state short-lived or long-lived?

**Decision Tree:**

```
Can the state be represented as a server-side resource?
├── YES
│   ├── Is it a cart or collection of items?
│   │   ├── YES → Create Cart resource with CartItem sub-resource
│   │   │   POST /carts, POST /carts/{cart}/items
│   │   └── NO → Create the appropriate resource structure
│   └── Outcome: Model as resource with CRUD operations
│
├── NO — state is ephemeral or doesn't map to a resource
│   ├── Can the client hold the state and send it with each request?
│   │   ├── YES → Client-side state management (localStorage, client memory)
│   │   └── NO → Consider a temporary resource with TTL
│   └── Outcome: Client-managed or ephemeral resource
│
└── Session → Never for APIs
    Sessions create hidden server state that prevents horizontal scaling
```

**Rationale:**
Shopping carts, wizards, and multi-step forms should store state as server resources (`/carts/abc123`), not in server-side sessions. This enables horizontal scaling and provides standard CRUD semantics.

**Default Decision:**
Model client-specific state as API resources with CRUD operations.

**Risks:**
- Temporary resources need cleanup (TTL, scheduled task, or explicit delete)
- Client-held state increases payload size with each request
- Resource-based state requires authentication to prevent data leakage

**Related Rules:**
- Never Access session() In API Routes

**Related Skills:**
- Stateless Design Patterns
- Resource Controllers
