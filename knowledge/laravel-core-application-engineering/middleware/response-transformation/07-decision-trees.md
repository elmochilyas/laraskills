# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Response Transformation
**Generated:** 2026-06-03

---

# Decision Inventory

* Security Headers in Middleware vs Web Server
* Global vs Route-Group Response Transformation
* ETag Cache Headers vs Manual Cache Control
* JSON Envelope Middleware vs Per-Controller Response Formatting

---

# Architecture-Level Decision Trees

---

## Decision 1: Security Headers in Middleware vs Web Server

---

## Decision Context

Whether to add security headers (CSP, HSTS, X-Frame-Options) via Laravel middleware or the web server (nginx, Apache).

---

## Decision Criteria

* Whether the header value depends on application state
* Whether the header applies to all responses including non-Laravel assets
* Whether the team manages the web server configuration

---

## Decision Tree

Does the header value depend on application state (environment, user context, request data)?
↓
YES → Middleware — application-level logic needed to determine the header value
NO → Is the header static and identical for all responses?
    ↓
    YES → Web server — nginx/Apache adds headers efficiently for ALL responses including static assets
    NO → Middleware — header varies per route or response type
NO → Does the header need to be applied to non-Laravel responses (static assets served by nginx)?
    ↓
    YES → Web server — middleware only runs on Laravel requests
    NO → Middleware — all responses are Laravel responses

---

## Rationale

Web server headers apply to ALL responses including static assets (CSS, JS, images) and are set before the application processes the request. Middleware headers only apply to Laravel responses and can vary based on application state. A combination is recommended: web server for static headers (HSTS, X-Frame-Options), middleware for dynamic headers (CSP with nonces, cache control based on auth).

---

## Recommended Default

**Default:** Web server for static security headers (HSTS, X-Frame-Options, X-Content-Type-Options). Middleware for dynamic headers (CSP with nonces, environment-dependent HSTS).
**Reason:** Web server headers are more efficient and apply to all assets. Middleware headers provide application-aware flexibility.

---

## Risks Of Wrong Choice

* Middleware-only security headers: Missing on error responses from exception handler (404, 500 bypass middleware); missing on static assets served by web server
* Web server headers for dynamic values: Cannot vary by environment or user context; all environments get production headers
* Duplicate headers: Both middleware and web server set the same header — no error but confusing during debugging
* Missing headers on error responses: 404 and 500 responses bypass middleware pipeline; security headers missing unless web server adds them

---

## Related Rules

* Never Place Business Logic in Middleware
* Always Return the Result of $next($request)

---

## Related Skills

* Implement a Response Transformation Middleware for Response Decoration
* Implement a Correct handle() Method with Two-Pass Execution

---

---

## Decision 2: Global vs Route-Group Response Transformation

---

## Decision Context

Whether to register response transformation middleware globally or only on specific route groups.

---

## Decision Criteria

* Whether the transformation applies to all response types (HTML, JSON, files)
* Whether the transformation is specific to API or web routes
* Whether the transformation could break non-JSON responses

---

## Decision Tree

Does the transformation apply to ALL response types (security headers, timing headers)?
↓
YES → Global — security headers and timing apply to every response regardless of type
NO → Is the transformation specific to JSON responses (CORS, envelope wrapping)?
    ↓
    YES → API route-group only — HTML, redirects, and file responses should not receive JSON transformations
    NO → Does the transformation check response type before modifying?
        ↓
        YES → Global with type guard — check `$response instanceof JsonResponse` before modifying
        NO → Route-group — applying transformation to all responses without type check causes errors
NO → Is the transformation specific to authenticated routes (private cache headers)?
    ↓
    YES → Route-group — authenticated responses need different cache control than public responses
    NO → Route-group — transformation is scoped to specific routes

---

## Rationale

Response transformations can break non-target response types. JSON envelope middleware applied to all routes attempts `getData()` on HTML responses, causing errors. Security headers apply to all responses and are safe globally. Response-type-aware middleware with instanceof checks can be global but adds unnecessary processing for non-target responses.

---

## Recommended Default

**Default:** Route-group for transformations specific to response types (JSON envelope, CORS). Global only for universal transformations (security headers, timing).
**Reason:** Group-scoped transformations avoid modifying unintended response types. Global transformations with type guards add overhead and complexity.

---

## Risks Of Wrong Choice

* Global JSON envelope: HTML responses broken; `getData()` fails on non-JsonResponse types
* Route-group security headers: Some responses (error pages, redirects) missing security headers
* CORS on web routes: Unnecessary CORS headers added to every HTML response
* Private cache headers on public routes: Browser caches authenticated content, causing cache poisoning

---

## Related Rules

* Never Place Business Logic in Middleware
* Keep Global Middleware Minimal

---

## Related Skills

* Implement a Response Transformation Middleware for Response Decoration
* Register Custom Middleware at the Correct Tier

---

---

## Decision 3: ETag Cache Headers vs Manual Cache Control

---

## Decision Context

Whether to use the `cache.headers` middleware with ETag generation or manually set cache headers in controllers.

---

## Decision Criteria

* Whether the response content is deterministic (same input → same output)
* Whether the response is large (file downloads, paginated collections)
* Whether cache behavior varies per route

---

## Decision Tree

Is the response content deterministic and reproducible from the same input?
↓
YES → Is the response large (>1MB response body)?
    ↓
    YES → Manual cache control — ETag reads full response into memory for MD5 hashing; doubles memory
    NO → `cache.headers` middleware with `etag` — automatic conditional GET; saves bandwidth on 304
NO → Is the response specific to the authenticated user?
    ↓
    YES → Manual `Cache-Control: private` — `cache.headers` can set `private` but user-specific content needs manual handling
    NO → Manual cache control — dynamic or streaming responses aren't suited for ETag
NO → Does cache behavior vary per route?
    ↓
    YES → Route-level `cache.headers` middleware — cache configuration visible in route definition
    NO → Middleware with static cache headers — if all routes share the same cache policy

---

## Rationale

`cache.headers` middleware generates ETags by MD5-hashing the full response body. For large responses, this doubles memory consumption (response body + hash input). `SetCacheHeaders` returns 304 Not Modified when the ETag matches `If-None-Match`, saving bandwidth. Manual cache control is more efficient for large responses and gives finer-grained control.

---

## Recommended Default

**Default:** `cache.headers` middleware at the route level for small to medium JSON/HTML responses with deterministic content. Manual cache control for large responses, user-specific content, or streaming responses.
**Reason:** The middleware provides automatic conditional GET with minimal configuration. Manual control is needed when ETag overhead or response variability make the middleware unsuitable.

---

## Risks Of Wrong Choice

* ETag on large responses: Memory consumption doubles during hashing; potential OOM for file downloads
* Public cache on authenticated responses: Cache poisoning — authenticated data served to all users from shared cache
* No cache headers on public responses: Browsers and CDNs cache aggressively with no control
* Missing 304 support: Clients re-download unchanged content, wasting bandwidth

---

## Related Rules

* Never Place Business Logic in Middleware
* Always Return the Result of $next($request)

---

## Related Skills

* Implement a Response Transformation Middleware for Response Decoration
* Configure Route-Level Cache Headers with cache.headers Middleware

---

---

## Decision 4: JSON Envelope Middleware vs Per-Controller Response Formatting

---

## Decision Context

Whether to standardize JSON response format via middleware (single envelope structure) or format responses individually in each controller.

---

## Decision Criteria

* Whether all JSON responses should follow a consistent envelope structure
* Whether the envelope structure is simple and uniform
* Whether there are exceptions to the envelope pattern

---

## Decision Tree

Do all JSON responses need a consistent envelope structure (`{ data: ..., meta: ..., errors: ... }`)?
↓
NO → Per-controller formatting — no need for envelope; return data directly
YES → Is the envelope structure simple and uniform across all endpoints?
    ↓
    YES → Are there endpoints that should NOT use the envelope?
        ↓
        YES → Conditional middleware — check route or response type; skip for non-envelope endpoints
        NO → JSON envelope middleware — single middleware for all API responses; consistent format
    NO → Complex envelope with per-endpoint variations → API Resources — per-resource formatting is cleaner than middleware branching
NO → Is this an API-only application?
    ↓
    YES → Middleware on the API group — clean, consistent, centralized
    NO → Middleware only on API group — HTML responses must not be enveloped

---

## Rationale

JSON envelope middleware centralizes response formatting so controllers return plain data and middleware wraps it. This ensures consistency across all endpoints. However, complex envelope structures with per-endpoint variations are better handled by API Resources, which provide per-resource formatting control.

---

## Recommended Default

**Default:** JSON envelope middleware for the API group when all endpoints share a simple, uniform envelope. API Resources for complex or varying envelope structures.
**Reason:** Middleware provides consistent formatting with zero controller changes. Resources provide per-resource control when endpoints differ in structure.

---

## Risks Of Wrong Choice

* Global JSON envelope: HTML responses broken — `getData()` called on non-JsonResponse
* Middleware with complex branching: Envelope logic becomes as complex as per-controller formatting; testing is harder
* Per-controller formatting inconsistency: Some endpoints return `{ data: ... }`, others return `{ status: ..., result: ... }`
* Middleware that modifies non-JSON responses: TypeError when operating on BinaryFileResponse or StreamedResponse

---

## Related Rules

* Never Place Business Logic in Middleware
* Always Return the Result of $next($request)

---

## Related Skills

* Implement a Response Transformation Middleware for Response Decoration
* Apply the Cross-Cutting Boundary Test to New Middleware
