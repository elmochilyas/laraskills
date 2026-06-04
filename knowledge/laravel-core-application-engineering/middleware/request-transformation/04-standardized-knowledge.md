# ECC Standardized Knowledge — Request Transformation

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Request Transformation |
| **Difficulty** | Advanced |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Request transformation middleware modifies the incoming HTTP request before it reaches the controller. These modifications include sanitizing input (trimming strings, converting empty strings), enriching the request with resolved data (tenant context, request IDs), correcting request metadata (trusted proxies), and handling cross-origin preflight requests (CORS).

The engineering significance of request transformation is that it centralizes request normalization so that controllers and services receive a consistent, enriched request regardless of how the client sent it. Global middleware handles transformations that apply to all routes; route-group middleware handles transformations specific to route collections.

---

## Core Concepts

### Request as Passable Object

In Laravel, the `$request` object is passed through the pipeline by reference. Middleware receives the same `$request` instance. Modifications made by one middleware are visible to all subsequent middleware and the controller. This shared mutability is by design — it allows middleware to enrich the request as it travels inward.

### Attributes vs Input

The `$request` object has two distinct storage areas. Input (`$request->input()`, `$request->all()`) is user-provided data. Attributes (`$request->attributes->set()`, `$request->attribute()`) is server-side data added by middleware. Middleware should use attributes for data it adds. Modifying user input via `$request->merge()` is appropriate only for sanitization, not for adding new data.

### TrustedProxies Mechanics

`TrustProxies` configures which proxies are trusted and which headers to trust. It modifies `$request->ip()`, `$request->getScheme()`, `$request->getHost()`, and `$request->getPort()` to reflect the client's values rather than the proxy's. Without TrustedProxies behind a load balancer, all requests appear to come from the load balancer's IP.

### HandleCors Mechanics

`HandleCors` handles CORS preflight (OPTIONS requests) by returning immediately without calling `$next`. For non-OPTIONS requests, it adds CORS headers to the response. Preflight requests should never reach the controller.

---

## When To Use

- **TrustedProxies** globally when the application runs behind a reverse proxy, load balancer, or CDN.
- **HandleCors** globally when the application serves cross-origin requests.
- **Input sanitization** (TrimStrings, ConvertEmptyStringsToNull) globally to normalize user input.
- **Request ID generation** globally or per-group for request tracing across services.
- **Tenant resolution** at the route group level for multi-tenant applications.
- **Locale detection** at the route group level to set application locale per request.
- **Force JSON** at the API route group level to ensure consistent JSON error responses.
- **Request enrichment** in general when resolved data (tenant, user preferences) is needed by downstream middleware and controllers.

---

## When NOT To Use

- Do NOT use `$request->merge()` to add data that did not come from the client — use `$request->attributes->set()` instead.
- Do NOT place heavy database queries in global request transformation middleware — cache aggressively or move to route-level registration.
- Do NOT configure `TrustedProxies` with `*` in production — this trusts ALL proxies, which is insecure when external traffic passes through intermediate proxies.
- Do NOT forget `HandleCors` for applications serving cross-origin requests — OPTIONS preflight requests reach the controller and return 404/405.

---

## Best Practices (WHY)

- **Use `$request->attributes` for middleware-to-controller communication.** This separation ensures that controllers can distinguish between "what the user sent" (input) and "what the system resolved" (attributes). Attributes are serialized when the request is serialized (for queue jobs).
- **Use `$request->merge()` ONLY for sanitization.** Modifying input format (trimming, type casting) is appropriate. Adding new data (tenant ID, request ID) via `$request->merge()` pollutes user input — controllers using `$request->all()` or `$request->validated()` receive the non-user data.
- **Cache expensive transformations.** Middleware that resolves data from databases (tenant, feature flags) should cache results. A tenant resolution middleware querying the database on every 404 page adds unnecessary load.
- **Configure TrustedProxies explicitly.** Use specific IP ranges (`'10.0.0.0/8'`, `'172.16.0.0/12'`) instead of `*`. This is one of the most common deployment issues.
- **Register response-modifying transformations (Force JSON, CORS) at the appropriate group level, not globally.** Only API routes need Force JSON. Web routes returning HTML should not have JSON forced.

---

## Architecture Guidelines

- **TrustedProxies:** Global middleware. Configures Symfony Request trusted proxy settings. Affects IP, scheme, host, and port resolution.
- **HandleCors:** Global middleware. Intercepts OPTIONS preflight, adds CORS headers to responses.
- **Input sanitization (TrimStrings, ConvertEmptyStringsToNull):** Global middleware. Uses `$request->merge()` to replace input with sanitized versions.
- **Request enrichment:** Uses `$request->attributes->set('key', $value)`. Values accessible via `$request->attribute('key')` downstream.
- **Global transformations:** TrustedProxies, HandleCors, TrimStrings, ConvertEmptyStringsToNull, Request ID.
- **Group transformations:** Tenant resolution, Locale detection, Force JSON.
- **Octane safety:** `$request->attributes` is per-request — does not persist across requests. However, data stored on singleton services referenced by request attributes must be cleared after use.

---

## Performance

TrustedProxies (~0.001ms) and HandleCors (~0.01ms) are negligible. Input sanitization iterates all input fields — 100 fields ~0.05ms, 1000+ fields ~0.5ms. Database-backed resolution (tenant, locale) adds 2-10ms of database time — cache aggressively. HandleCors actually improves performance for OPTIONS requests by short-circuiting before the controller.

---

## Security

TrustedProxies configuration is critical for security behind load balancers. Without it, `$request->ip()` returns the proxy IP, making IP-based access controls and rate limiting ineffective. CORS middleware prevents cross-origin data access. Input sanitization prevents malformed input from causing downstream errors. Middleware that enriches requests must not accidentally expose resolved data through user-accessible endpoints (e.g., via `$request->all()`).

---

## Common Mistakes

- **Modifying input instead of attributes.** Middleware uses `$request->merge()` to add tenant ID or request context. Controllers using `$request->all()` or `$request->validated()` receive the data as if it came from the user.
- **TrustedProxies not configured behind a proxy.** Behind any reverse proxy without TrustedProxies, `$request->ip()` returns the proxy IP, `$request->getScheme()` returns `http` instead of `https`, and `$request->getHost()` may return incorrect values.
- **Not handling CORS for OPTIONS.** Without `HandleCors`, OPTIONS preflight requests reach the controller and return 404/405. The browser receives no CORS headers and blocks the subsequent request.
- **Heavy database queries in global middleware.** A global middleware querying the database for every request adds load to static asset requests, health checks, and 404 pages.
- **Input sanitization breaking expected types.** `ConvertEmptyStringsToNull` converts `''` to `null`. Controllers expecting an empty string receive `null`, causing type errors in strict types.

---

## Anti-Patterns

- **Global middleware for tenant resolution.** A tenant resolution middleware that queries the database for every request should be at the route group level, not global. Health checks and static asset requests should not pay the tenant query cost.
- **`$request->merge()` for non-sanitization data.** Adding tenant ID, user ID, or request context via `$request->merge()` pollutes user input. Downstream code cannot distinguish between client-provided data and middleware-provided data.
- **TrustedProxies `*` in production.** Trusting ALL proxies allows IP spoofing through intermediate proxies. Always specify trusted IP ranges explicitly.
- **Attribute namespace collisions.** Two middleware setting `$request->attributes->set('id', ...)` with different meanings cause silent data corruption. Use namespaced keys: `'request_id'`, `'tenant.id'`.

---

## Examples

### Request ID Generation
```php
class RequestIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->headers->get('X-Request-Id') ?? (string) Str::uuid();
        $request->attributes->set('request_id', $requestId);
        $response = $next($request);
        $response->headers->set('X-Request-Id', $requestId);
        return $response;
    }
}
```

### Tenant Resolution
```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::findByDomain($request->getHost());
        if (! $tenant) {
            abort(404, 'Tenant not found');
        }
        $request->attributes->set('tenant', $tenant);
        return $next($request);
    }
}
```

### Force JSON for API Routes
```php
class ForceJsonMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');
        return $next($request);
    }
}
```

---

## Related Topics

- **Middleware Fundamentals** (prerequisite) — the Pipeline pattern and handle() contract.
- **Middleware Lifecycle** (prerequisite) — where request transformation occurs in the flow.
- **Custom Middleware** — creating request transformation middleware.
- **Global, Route Group, and Route Middleware** — where to register transformation middleware.
- **Cross-Cutting Concerns** — deciding whether a transformation belongs in middleware.
- **Response Transformation** — the outbound counterpart to request transformation.
- **Parameterized Middleware** — passing configuration to transformation middleware.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Custom Middleware (prerequisite). Serves as prerequisite for cross-cutting-concerns.
- **Key distinction:** Use `$request->attributes->set()` for resolved data. Use `$request->merge()` ONLY for sanitization.
- **TrustedProxies:** Critical behind any load balancer. Without it, `$request->ip()` returns proxy IP.
- **HandleCors:** Intercepts OPTIONS preflight before controller. Adds CORS headers to non-OPTIONS responses.
- **Global vs group:** TrustedProxies, HandleCors, TrimStrings = global. Tenant resolution, Locale = group.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Attributes vs input distinction clear | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| TrustedProxies, CORS, sanitization documented | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples | ✓ |
| Related topics mapped | ✓ |
