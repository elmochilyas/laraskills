# Skill: Implement a Request Transformation Middleware for Request Enrichment

## Purpose

Create middleware that enriches the incoming request with resolved data (tenant, request ID, locale, user preferences) using `$request->attributes->set()` for clean separation between client input and server-enriched data.

## When To Use

When middleware needs to add resolved data to the request for downstream middleware and controllers, such as tenant resolution, request ID generation, locale detection, or feature flag loading.

## When NOT To Use

For input sanitization (trimming strings, type casting) — use `$request->merge()` instead. The two use cases have different storage mechanisms.

## Prerequisites

- Understanding of the attributes vs input distinction
- Knowledge of the two-pass execution model

## Inputs

- Data to resolve and attach to the request
- Source of the data (header, hostname, database, cache)

## Workflow

1. Implement `handle(Request $request, Closure $next): Response`
2. Resolve the data before `$next($request)` — this is pre-processing that runs on the inbound pass
3. Store resolved data using namespaced keys: `$request->attributes->set('scope.key', $value)` — e.g., `'tenant.id'`, `'request.trace_id'`
4. Use `$request->headers->get()`, `$request->getHost()`, or other request primitives to derive the data
5. Cache expensive resolutions (database queries, API calls) — use `Cache::remember()` or in-memory request-scoped caching
6. Call `$response = $next($request)` to pass the enriched request downstream
7. Downstream middleware and controllers access the data via `$request->attributes->get('scope.key')`

## Validation Checklist

- [ ] Data stored via `$request->attributes->set()` — NOT `$request->merge()`
- [ ] Keys are namespaced to prevent collisions (e.g., `'tenant.id'`, `'request.trace_id'`)
- [ ] Expensive lookups are cached with appropriate TTL
- [ ] Downstream controllers read via `$request->attributes->get('key')` — not `$request->input()`
- [ ] Middleware handles the case where resolution fails (tenant not found, invalid header)

## Common Failures

- Using `$request->merge()` to add resolved data — pollutes user input and affects `$request->validated()`
- Using generic attribute keys (`'id'`, `'key'`, `'data'`) — collisions with other middleware overwrite data silently
- No caching for database lookups — 2-10ms database query on every request, including 404s and health checks
- Global registration for tenant resolution — database query runs on static assets and health checks

## Decision Points

- For tenant resolution, register at the route group level, not globally — health checks should not query for tenants
- For request ID generation, register globally — every request benefits from tracing
- For locale detection, register after session (route group) if locale is stored in session

## Performance Considerations

In-memory resolution (request ID, headers) is ~0.001ms. Database-backed resolution (tenant, locale) adds 2-10ms without caching. Cache aggressively with an appropriate TTL.

## Security Considerations

Use namespaced keys to prevent attribute collision between different middleware. Validate resolved data — a middleware that enriches with tenant data must not expose cross-tenant data.

## Related Rules

- Use $request->attributes for Resolved Data, $request->merge Only for Sanitization (request-transformation:5)
- Cache Expensive Request Transformations (request-transformation:5)
- Use Namespaced Keys in Request Attributes to Prevent Collisions (request-transformation:5)
- Use $request->attributes->set() for Middleware-to-Controller Communication (custom-middleware:5)

## Related Skills

- Configure TrustedProxies and CORS Correctly
- Implement a Response Transformation Middleware for Security Headers

## Success Criteria

Middleware enriches the request with namespaced attributes. No data is stored via `$request->merge()`. Expensive lookups are cached. Controllers access data cleanly via `$request->attributes->get()`.

---

# Skill: Configure TrustedProxies and CORS Correctly

## Purpose

Configure `TrustedProxies` with explicit IP ranges and register `HandleCors` as global middleware, ensuring correct client IP resolution and CORS preflight handling behind load balancers.

## When To Use

When deploying behind any reverse proxy, load balancer, or CDN. When serving cross-origin requests. When debugging IP-based features returning incorrect values.

## When NOT To Use

In local development without proxies — default configuration is sufficient. For same-origin-only applications — `HandleCors` is not needed.

## Prerequisites

- Knowledge of the application's proxy infrastructure
- List of trusted proxy IP ranges or CIDR notations

## Inputs

- Load balancer/proxy IP ranges
- CORS configuration (allowed origins, methods, headers)

## Workflow

1. Configure `TrustProxies` in `bootstrap/app.php` or `config/trustedproxy.php`:
   - Specify explicit IP ranges: `'proxies' => ['10.0.0.0/8', '172.16.0.0/12']`
   - NEVER use `'*'` in production — this trusts ALL proxies and allows IP spoofing
2. Register `HandleCors` as global middleware (not route-level) — OPTIONS preflight must be handled before routing
3. Configure CORS in `config/cors.php`:
   - Set `allowed_origins` explicitly — avoid `['*']` with credentials
   - Set `allowed_methods` as needed
   - Set `supports_credentials` if using cookies/authorization headers
4. Test behind the proxy: verify `$request->ip()`, `$request->getScheme()`, and `$request->getHost()` return correct values
5. Test CORS preflight: send an OPTIONS request and verify CORS headers in the response

## Validation Checklist

- [ ] `TrustProxies` uses explicit IP ranges — no wildcard in production
- [ ] `HandleCors` is registered as global middleware
- [ ] CORS configuration has explicit allowed origins (not `['*']` with credentials)
- [ ] `$request->ip()` returns client IP behind the proxy, not proxy IP
- [ ] `$request->getScheme()` returns `https` when behind SSL-terminating proxy
- [ ] OPTIONS preflight requests return 204 with CORS headers, not 404

## Common Failures

- `TrustProxies` not configured at all behind a load balancer — `$request->ip()` returns the load balancer IP
- `TrustProxies` set to `'*'` in production — IP spoofing through intermediate proxies
- `HandleCors` registered as route middleware — OPTIONS preflight returns 404 without CORS headers
- CORS `allowed_origins` set to `['*']` with `supports_credentials: true` — browser rejects the response

## Decision Points

- For AWS ALB, trust `'10.0.0.0/8'` and `'172.16.0.0/12'` (VPC CIDR)
- For Cloudflare, use Cloudflare's IP list (published at their API)
- For multiple proxies, list all trusted intermediary IP ranges

## Performance Considerations

TrustedProxies is ~0.001ms per request. HandleCors for OPTIONS is a net performance gain (returns 204 without controller execution).

## Security Considerations

Trusting all proxies with `'*'` allows IP spoofing. Explicit IP ranges restrict trust to known infrastructure. CORS misconfiguration can expose API endpoints to unauthorized origins.

## Related Rules

- Configure TrustedProxies Explicitly — Never Use Wildcard in Production (request-transformation:5)
- Register HandleCors Globally — Never as Route Middleware (request-transformation:5)
- Apply Force JSON Middleware Only to API Route Groups, Not Globally (request-transformation:5)

## Related Skills

- Implement a Request Transformation Middleware for Request Enrichment
- Choose the Correct Registration Tier for Middleware

## Success Criteria

TrustedProxies configured with explicit IP ranges. `HandleCors` registered globally. Client IP resolves correctly behind the proxy. OPTIONS preflight returns proper CORS headers.
