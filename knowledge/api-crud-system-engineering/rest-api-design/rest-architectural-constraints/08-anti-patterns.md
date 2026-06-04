# REST Architectural Constraints: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | rest-architectural-constraints |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **REST as HTTP Checklist** — Treating REST as just GET/POST/PUT/DELETE + status codes, ignoring the six architectural constraints
2. **Session-Auth for APIs** — Using Laravel's session-based authentication on API routes
3. **No Cache Headers** — Assuming browsers and proxies won't cache API responses without explicit headers
4. **Server-Side Session State** — Storing client context in server-side sessions for API clients
5. **Layered System Violation** — Writing application code that depends on specific intermediary behavior

## Repository-Wide Anti-Patterns

- Adding `web` middleware to API routes to access `session()` breaks statelessness
- Not setting correlation IDs for request tracing in stateless environments
- Mixing API and web concerns in the same route group
- Missing `Cache-Control` headers on all API responses
- Using session-based auth with Sanctum instead of token-based auth

---

## 1. REST as HTTP Checklist

### Category
Conceptual Misunderstanding

### Description
Believing that using HTTP methods (GET, POST, PUT, DELETE) and status codes constitutes REST. The six architectural constraints define REST — HTTP methods alone produce an HTTP API, not a REST API.

### Why It Happens
Most tutorials teach "REST = HTTP verbs + JSON + status codes." The architectural constraints are presented as academic background, not as the actual definition of REST.

### Warning Signs
- API described as "REST" but lacks statelessness, caching headers, or uniform interface
- Team can name HTTP methods but not the six constraints
- No `Cache-Control` headers on any response
- Session-based auth used with API routes
- API documentation says "RESTful" but doesn't mention constraints

### Why Harmful
The API misses the key benefits of REST architecture — scalability (statelessness), performance (caching), and evolvability (uniform interface). The team prioritizes HTTP verb usage over the architectural properties that make REST valuable.

### Real-World Consequences
An API claims to be REST but has no caching headers, uses session-based auth, and stores client state server-side. When traffic grows 10x, the API cannot scale horizontally because of session affinity requirements. The team spends months refactoring to add statelessness.

### Preferred Alternative
Study and apply all six constraints: client-server, statelessness, cacheability, layered system, uniform interface, and code on demand (optional). Understand that constraints work as a system.

### Refactoring Strategy
1. Audit current API against all six constraints
2. Prioritize gaps by business impact (statelessness and cacheability are most impactful)
3. Implement token-based auth, cache headers, and remove session dependency
4. Update documentation to accurately describe the API's constraint compliance
5. Add architecture tests that verify constraint adherence

### Detection Checklist
- [ ] Only HTTP methods and status codes considered
- [ ] Six constraints cannot be named by the team
- [ ] No caching strategy exists
- [ ] Session state persists on server
- [ ] API described as "REST" but violates core constraints

### Related Rules/Skills/Trees
- Rule: API-ARCH-001 (Constraint Compliance)
- Skill: rest-architectural-constraints
- Tree: rest-fundamentals

---

## 2. Session-Auth for APIs

### Category
Statelessness Violation

### Description
Using Laravel's session-based authentication (login via `Auth::login()`, session middleware, cookies) for API routes. This breaks statelessness because the server must maintain session state.

### Why It Happens
Developers are familiar with Laravel's web authentication and apply the same pattern to API routes. Sanctum's SPA authentication also uses cookies, which can be mistaken for session-based auth.

### Warning Signs
- API routes use `web` middleware group
- `session()` or `Auth::login()` called in API controllers
- Session middleware included in API middleware stack
- CSRF token required for API requests
- Session files or database entries created by API requests

### Why Harmful
Server-side session state prevents horizontal scaling — requests must be routed to the same server (sticky sessions). Session storage grows with each unique client. Session hijacking becomes a vector (session ID in cookies).

### Real-World Consequences
An API deployed across 10 servers with session-based auth requires sticky sessions. When one server fails, all clients connected to it lose their sessions. The load balancer cannot route requests evenly because it must maintain session affinity, causing uneven load distribution.

### Preferred Alternative
Use token-based authentication (Sanctum tokens or Passport OAuth). Each request carries its own authentication context, enabling stateless, horizontally-scalable API servers.

### Refactoring Strategy
1. Implement token-based auth (Sanctum tokens)
2. Remove `session()` and `Auth::login()` from API controllers
3. Remove session middleware from API middleware group
4. Update clients to send token in `Authorization` header
5. Remove sticky session requirement from load balancer

### Detection Checklist
- [ ] API routes use session middleware
- [ ] API controllers call `Auth::login()`
- [ ] CSRF tokens required for API requests
- [ ] Session files created by API requests
- [ ] Sticky sessions required for API servers

### Related Rules/Skills/Trees
- Rule: API-STATELESS-001 (Token-Based Auth)
- Skill: sanctum-token-auth
- Tree: authentication

---

## 3. No Cache Headers

### Category
Cacheability Ignored

### Description
Not setting `Cache-Control` or other caching headers on API responses, leaving HTTP intermediaries (browsers, CDNs, proxies) to guess the cacheability of responses.

### Why It Happens
During development, caching is not noticeable — responses are fast. Developers assume the same applies in production. Cache headers seem like an optimization, not a requirement.

### Warning Signs
- No `Cache-Control` header on any API response
- `Expires` or `ETag` headers consistently absent
- CDN caching is ineffective or unpredictable
- Identical requests always hit the server
- Response times don't improve with repeated requests

### Why Harmful
Without explicit cache headers, browsers and CDNs may cache private data (user profiles, account details) and serve them to other users. Or they may not cache public data at all, wasting server resources. HTTP intermediaries default to unpredictable caching behavior.

### Real-World Consequences
A user profile API returns user data without cache headers. A corporate proxy caches the response. The next user behind the same proxy requests their profile and receives the first user's data, exposing personal information.

### Preferred Alternative
Set explicit cache headers on every response. For private data: `Cache-Control: private, no-cache`. For public data: `Cache-Control: public, max-age=3600`.

### Refactoring Strategy
1. Add middleware that sets default cache headers
2. Override cache headers per endpoint as needed
3. Set `Cache-Control: no-store` on all 4xx/5xx responses
4. Configure CDN to respect origin cache headers
5. Test cache behavior with curl and browser dev tools

### Detection Checklist
- [ ] No `Cache-Control` header on responses
- [ ] No `ETag` or `Last-Modified` headers
- [ ] Identical requests always return 200 (never 304)
- [ ] Private responses potentially cached by intermediaries
- [ ] CDN caching policy is "guess" instead of explicit

### Related Rules/Skills/Trees
- Rule: API-CACHE-001 (Explicit Cache Headers)
- Skill: response-caching-headers
- Tree: caching-strategy

---

## 4. Server-Side Session State

### Category
Statelessness Violation

### Description
Storing client-specific state in server-side sessions for API clients — shopping cart contents, multi-step wizard progress, pagination cursors, or authentication context.

### Why It Happens
Developers are accustomed to web applications where session state is the default. It's easier to store data in `session()` than to model it as a resource.

### Warning Signs
- `session()->put()` or `session()->get()` used in API controllers
- API behavior depends on session data
- Pagination cursors stored in session instead of sent by client
- Multi-step wizard state in server session
- API breaks when session expires

### Why Harmful
Prevents horizontal scaling — each request must reach the same server. Session data creates a hidden state dependency that makes the API behavior non-deterministic. Session expiry causes data loss mid-workflow.

### Real-World Consequences
A multi-step checkout API stores cart contents in the session. When the server is restarted for deployment, all active checkout sessions are lost. Users see empty carts and must restart the checkout process.

### Preferred Alternative
Model client-specific state as API resources: `POST /carts` creates a cart, `POST /carts/{cart}/items` adds items. Send pagination cursors and auth tokens with each request.

### Refactoring Strategy
1. Identify all server-side session state in API routes
2. Model each state as a resource with CRUD endpoints
3. Move pagination state to client-sent parameters
4. Remove `session()` calls from API code
5. Remove session middleware from API route groups

### Detection Checklist
- [ ] `session()` used in API routes
- [ ] API behavior depends on prior requests
- [ ] Pagination state in session
- [ ] Multi-step workflow state in session
- [ ] API servers require sticky sessions

### Related Rules/Skills/Trees
- Rule: API-STATELESS-002 (No Server Session State)
- Skill: rest-architectural-constraints
- Tree: scalability

---

## 5. Layered System Violation

### Category
Tight Coupling

### Description
Writing application code that depends on or assumes specific intermediary behavior — hardcoding proxy IPs, relying on specific CDN behavior, or writing code that bypasses architecture layers.

### Why It Happens
Developers optimize for their specific deployment topology without considering that layers (load balancers, CDNs, API gateways) may change.

### Warning Signs
- Code references specific proxy or load balancer IPs
- Application depends on CDN stripping specific headers
- Routes bypass middleware intentionally
- HTTPS termination assumptions in application code
- Hardcoded references to intermediary hostnames

### Why Harmful
Changing infrastructure (switching CDN providers, adding an API gateway, migrating cloud providers) requires application code changes. The benefits of layered architecture (flexibility, independent evolution) are lost.

### Real-World Consequences
An application reads `$_SERVER['HTTP_X_FORWARDED_FOR']` directly to get client IP. When the company switches from AWS ALB to Cloudflare, the header name changes, and all IP-dependent features (geolocation, rate limiting) break.

### Preferred Alternative
Use abstraction layers — `$request->ip()` instead of raw headers, configuration for intermediary behavior, and middleware for cross-cutting concerns.

### Refactoring Strategy
1. Find all references to specific intermediaries
2. Replace with abstraction methods (`$request->ip()`, `$request->header()`)
3. Move intermediary-specific logic to middleware
4. Use configuration for intermediary behavior
5. Add tests that work with different intermediary configurations

### Detection Checklist
- [ ] Hardcoded proxy/CDN IPs in code
- [ ] Direct header access instead of abstraction methods
- [ ] Specific intermediary behavior assumed
- [ ] Middleware bypassed by specific routes
- [ ] Infrastructure changes require code changes

### Related Rules/Skills/Trees
- Rule: API-ARCH-002 (Layer Abstraction)
- Skill: rest-architectural-constraints
- Tree: architecture-design
