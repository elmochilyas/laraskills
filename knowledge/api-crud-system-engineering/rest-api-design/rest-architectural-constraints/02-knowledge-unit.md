# REST Architectural Constraints

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** REST Architectural Constraints
- **Last Updated:** 2026-06-02

---

## Executive Summary

REST (Representational State Transfer) is defined by six architectural constraints that collectively produce the properties of scalability, simplicity, modifiability, visibility, portability, and reliability. Roy Fielding's dissertation introduced these constraints as design rules that guide distributed hypermedia system architecture.

The six constraints are: client-server separation, statelessness, cacheability, layered system, uniform interface, and code on demand (optional). Each constraint restricts certain architectural freedoms in exchange for specific benefits. The uniform interface constraint is further decomposed into four sub-constraints: resource identification in requests, resource manipulation through representations, self-descriptive messages, and hypermedia as the engine of application state (HATEOAS).

In Laravel applications, statelessness is the most practically impactful constraint — every request must carry all information the server needs, which means authentication tokens, session state, and request context cannot rely on server-side session storage. Laravel's `Sanctum` and `Passport` packages enforce this via token-based authentication, while API middleware strips session state to ensure request independence.

---

## Core Concepts

### The Six Constraints

| Constraint | Description | Benefit |
|---|---|---|
| Client-Server | Separation of concerns between user interface (client) and data storage (server) | Portability, independent evolution |
| Stateless | Each request contains all information needed; no server-side session state | Visibility, scalability, reliability |
| Cacheable | Responses must implicitly or explicitly declare cacheability | Performance, reduced latency |
| Layered System | Intermediaries (proxies, gateways, load balancers) can be inserted transparently | Scalability, security encapsulation |
| Uniform Interface | Consistent contract between components — same URI structure, methods, status codes | Simplicity, discoverability |
| Code on Demand (optional) | Servers can extend client functionality via downloadable code (e.g., JavaScript) | Extensibility |

### Uniform Interface Sub-Constraints

1. **Resource identification in requests:** URIs identify resources, not actions. `GET /users/42` identifies a user, not an action performed on a user.
2. **Resource manipulation through representations:** Clients manipulate resources by sending representations (JSON, XML) that contain enough information to modify the server state.
3. **Self-descriptive messages:** Each message includes enough metadata (Content-Type, Content-Language, Content-Encoding) to describe how to process the representation.
4. **HATEOAS:** The server guides client state transitions by embedding hypermedia links in responses (see HATEOAS KU).

### Statelessness in Practice

Statelessness does not mean applications cannot have state — it means state lives on the client or is stored as resource state on the server. Session state, shopping carts, multi-step wizards must be either client-held (cookies, local storage) or modeled as server resources (`/carts/abc123`). In Laravel APIs, this means:

- No calls to `session()` in API routes
- Authentication via tokens (Bearer) rather than session cookies
- Request validation includes all necessary context
- Rate limiting by IP or token, not by session

---

## Mental Models

### REST as Constraint-Based Design
REST is not a protocol or specification — it is a set of architectural constraints that, when applied together, produce a specific set of non-functional properties. Removing any constraint weakens those properties. Adding constraints beyond REST produces different architectural styles (e.g., SOAP adds strict contract and operation orientation).

### The "Uniform Interface Tax"
The uniform interface constraint trades expressive power for simplicity. RPC-style APIs can express any action (`POST /users/42/deactivate`), while REST constrains to a fixed set of operations on resources. The tax is paid when actions don't naturally map to standard HTTP methods (see resource-vs-action-orientation KU).

### Statelessness as Deployability Enabler
Stateless servers can be horizontally scaled, load-balanced, and replaced without session affinity concerns. Each server instance is interchangeable because no server holds client-specific state. This property is the foundation of cloud-native API deployment patterns.

---

## Internal Mechanics

### How Laravel Enforces/Supports Statelessness

Laravel's API middleware stack (`api` guard) excludes `StartSession`, `ShareErrorsFromSession`, and `EncryptCookies` middleware that are present in the `web` group. This means:

- `Request::session()` returns null in API routes
- `auth:api` and `auth:sanctum` guards validate tokens on every request
- CSRF protection is disabled (not needed for token-based auth)
- Cookie encryption/decryption is skipped

The `Kernel.php` defines two middleware groups:

```php
'api' => [
    \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    'throttle:api',
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
],
```

### Cache Headers in Laravel Responses

Laravel does not set cache headers by default. The `Cache-Control`, `Expires`, and `ETag` headers must be explicitly added via middleware or response macros:

```php
return response($data)->header('Cache-Control', 'public, max-age=3600');
```

The `Http\Middleware\SetCacheHeaders` middleware provides a declarative approach:

```php
Route::get('users', [UserController::class, 'index'])->middleware('cache.headers:public;max_age=3600;etag');
```

### Layered System via Laravel Middleware

Laravel's middleware pipeline implements the layered system constraint naturally. Each middleware layer can:
- Transform the request before it reaches the controller
- Short-circuit the pipeline (authentication failures, rate limiting)
- Modify the response after the controller returns
- Pass control to the next layer or terminate

This architecture mirrors the proxy/gateway pattern described in Fielding's dissertation.

---

## Patterns

### Token-Based Authentication for Stateless APIs
Issue a bearer token on login, validate on every request. Sanctum token scopes limit what each token can access. No session state on the server.

### Explicit Cache Declaration
Every response that can be cached sets explicit `Cache-Control` headers. Resources that should not be cached set `Cache-Control: no-cache, no-store, must-revalidate`. This fulfills the cacheability constraint.

### Gateway Pattern via Reverse Proxy
Deploy behind Nginx or a CDN (CloudFront, Cloudflare) to add a caching layer without modifying application code. The layered system constraint ensures these intermediaries do not affect correctness.

### Content-Type Versioning for Self-Descriptive Messages
Use `Accept: application/vnd.myapp.v2+json` to allow clients to specify the expected representation format. The server returns the appropriate representation (self-descriptive messages constraint).

---

## Architectural Decisions

### API vs Web Middleware Stack
Laravel's dual middleware stacks (`api` and `web`) reflect the client-server constraint. The `api` stack omits session and cookie middleware, enforcing statelessness by default. This decision is correct for API-first applications but causes confusion when developers mix web and API routes under the same middleware group.

### Stateless Authentication Provider Choice
Sanctum (stateful tokens for SPAs, simple tokens for APIs) vs Passport (OAuth2 full implementation) vs JWT packages (tymon/jwt-auth). Decision factors: token type (UUID vs JWT), OAuth2 requirements, SPA vs third-party client support.

### Cache Strategy Selection
Full response caching (CDN, reverse proxy) vs ETag-based conditional requests vs no caching. The decision depends on data freshness requirements, write frequency, and client compatibility.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Statelessness enables horizontal scaling | Every request must re-authenticate | Higher latency per request (token validation) |
| Cacheability reduces server load | Stale data risk if cache headers are misconfigured | Clients may see outdated representations |
| Uniform interface simplifies client integration | Actions that don't map to CRUD require workarounds | RPC-style endpoints leak through as "action" resources |
| Layered system allows transparent intermediaries | Debugging becomes harder (which layer caused the error?) | Requires correlation IDs and request tracing |
| Code on demand enables thin clients | Security risk from arbitrary code execution | Rarely implemented in practice |

---

## Performance Considerations

### Stateless Overhead
Token validation on every request adds 1-5ms per request (Sanctum token lookup). JWT validation (no database lookup) reduces this to ~0.5ms but introduces token revocation complexity.

### Cache Hit Ratio Impact
A 90% cache hit ratio on read-heavy endpoints reduces server load by 90%. Cache invalidation on writes requires careful design (cache tags, surrogate keys, or manual purging).

### Middleware Pipeline Depth
Each middleware layer adds ~0.1-0.5ms per request. The `api` middleware group is typically shallower than `web`, contributing to faster API response times.

---

## Production Considerations

### Stateless Request Logging
Every request must include a correlation ID (generated client-side or injected by the load balancer) for production debugging. Without sessions, correlating requests from the same client requires this identifier.

### Load Balancer Configuration
Stateless servers allow round-robin load balancing with no session affinity. Ensure the load balancer does not attempt to pin clients to specific servers.

### Cache Invalidation Strategy
Plan cache invalidation before implementing caching. Common strategies: time-based TTL, event-driven purging (model events trigger cache clear), surrogate-key based purging via CDN.

---

## Common Mistakes

### Mixing API and Web Middleware
Why it happens: Developers add `web` middleware to API routes to access `session()` or `auth()->user()` in a session-based context. Why it's harmful: Breaks statelessness, prevents horizontal scaling, introduces CSRF requirements. Better approach: Use token-based auth for APIs; never add session middleware to API routes.

### Assuming REST = HTTP API
Why it happens: Many tutorials treat "building a REST API" as synonymous with "building an HTTP API." Why it's harmful: Violates the uniform interface constraint, produces RPC-style APIs that don't benefit from REST's properties. Better approach: Apply all six constraints, not just HTTP verb usage.

### Ignoring Cache Headers
Why it happens: Cache headers are invisible in development — everything works without them. Why it's harmful: Production traffic hits the server for every request, degrading performance. Better approach: Set explicit cache headers on every response, even if the answer is "do not cache."

### Server-Side Session State in APIs
Why it happens: Convenience — session state is easier than passing context with every request. Why it's harmful: Prevents horizontal scaling, complicates deployment. Better approach: Model client-specific state as resources or require the client to pass state with each request.

---

## Failure Modes

### Statelessness Violation Due to Middleware
If a developer accidentally adds `StartSession` middleware to an API route group, the application silently begins storing session state. The failure mode is gradual — the app works fine under single-server deployment but fails under load balancing with sticky sessions off.

### Cache Poisoning
If cache headers are too aggressive (long max-age on mutable resources), clients see stale data. The server thinks it's correct because it never receives requests for the stale resource until the TTL expires.

### Layered System Transparency Issues
A CDN or reverse proxy that caches responses may hide backend errors from monitoring. The error response is cached and served to subsequent clients, masking the failure from alerting systems.

---

## Ecosystem Usage

### GitHub API
GitHub implements most REST constraints: stateless token auth, explicit cache headers (ETags, `Cache-Control`), link headers for pagination (HATEOAS), and a layered architecture behind CloudFlare. GitHub breaks statelessness only for OAuth flows.

### Stripe API
Stripe's API is pragmatic-REST: stateless authentication via API keys, explicit idempotency keys (compensating for non-idempotent POST), versioned API via `Accept` header, and consistent resource naming. Stripe does not implement HATEOAS.

### Twilio API
Twilio's API is closer to RPC style than pure REST, demonstrating the pragmatic tradeoff. Resources exist but many actions are modeled as sub-resources (`/Accounts/{sid}/Calls/{call_sid}/Recordings`). Statelessness is strictly enforced.

---

## Related Knowledge Units

### Prerequisites
- HTTP Protocol Fundamentals — Status codes, methods, headers
- Client-Server Architecture — Separation of concerns basics

### Related Topics
- Resource vs Action Orientation — Uniform interface constraint in practice
- REST Maturity Model — Measuring constraint adherence
- HATEOAS / Hypermedia Controls — The most controversial constraint
- URL Structure Design — Resource identification via URI

### Advanced Follow-up Topics
- CQRS/Event Sourcing — Alternative architectural styles for APIs
- GraphQL — Contrast to REST constraints
- gRPC — RPC-style alternative with different constraints

---

## Research Notes

### Source Analysis
- Fielding, Roy T. "Architectural Styles and the Design of Network-based Software Architectures." Dissertation, UC Irvine, 2000 — Chapter 5 defines the REST architectural style
- Webber, Jim, et al. "REST in Practice." O'Reilly, 2010 — Practical application of REST constraints in enterprise systems

### Key Insight
The six constraints must be applied together. Partial application (only using HTTP methods without HATEOAS or self-descriptive messages) produces an HTTP API that does not qualify as REST. Fielding explicitly states that REST APIs must be hypertext-driven.

### Version-Specific Notes
- Laravel 11: The `api` route file is no longer generated by default — must be created with `php artisan install:api`
- Laravel 10: Both `web` and `api` route files are generated by default
- Laravel 9: Sanctum replaces Passport as the recommended API authentication for first-party SPAs
