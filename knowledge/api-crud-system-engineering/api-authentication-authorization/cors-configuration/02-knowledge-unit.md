# CORS Configuration

## Metadata (Domain: API & CRUD System Engineering, Subdomain: API Authentication & Authorization, Last Updated: 2026-06-02)

## Executive Summary
Cross-Origin Resource Sharing (CORS) is a browser security mechanism that controls which origins, methods, and headers are allowed when a web application on one domain makes requests to a different domain. For Laravel APIs, CORS configuration via `config/cors.php` (Laravel 9/10) or `config/cors.php` (Laravel 11+) defines the allowed origins, HTTP methods, headers, and whether credentials (cookies) can be included. Improper CORS configuration leads to blocked browser requests or security vulnerabilities.

## Core Concepts
- **Origin**: The combination of protocol, domain, and port (e.g., `https://app.example.com:3000`). Two URLs with the same origin share protocol + host + port.
- **Preflight request**: An `OPTIONS` request sent by the browser before the actual request to check CORS permissions. Triggered by non-simple requests (custom headers, non-standard methods, or credentialed requests).
- **Simple request**: A request that does not trigger a preflight. Must use GET/HEAD/POST, only CORS-safelisted headers, and no credentials or specific content types.
- **Allowed origins**: The origins the server permits to access its resources. Can be a list or `*` (any origin, but disallows credentials).
- **Allowed headers**: Which request headers the client is permitted to send (e.g., `Authorization`, `Content-Type`, `X-Requested-With`).
- **Exposed headers**: Which response headers the browser exposes to the client JavaScript (e.g., `X-RateLimit-Limit`, `X-Debug-Token`).
- **Credentials mode**: Cookies, authorization headers, or TLS client certificates. When `true`, `Access-Control-Allow-Origin` cannot be `*` — must be an explicit origin.
- **Preflight cache**: The browser caches the preflight response for the duration specified by `Access-Control-Max-Age`.

## Mental Models
- **CORS as border control**: Your API is a country. CORS configuration defines which other countries (origins) can visit, what they can bring (headers), and what they can take (exposed headers).
- **Preflight as visa check**: Before an actual visit (request), the browser asks "Can they come?" with an OPTIONS request. If approved (200 with correct headers), the browser allows the actual request.
- **Credentials as VIP pass**: When `withCredentials` is true, the browser attaches cookies to the request. CORS must explicitly allow this with specific origin + credentials header.

## Internal Mechanics
1. Browser decides to make a cross-origin request (e.g., `https://api.example.com` from `https://app.example.com`).
2. If the request is not "simple," the browser sends an OPTIONS preflight to `https://api.example.com` with headers:
   - `Origin: https://app.example.com`
   - `Access-Control-Request-Method: POST`
   - `Access-Control-Request-Headers: Authorization, Content-Type`
3. Laravel's CORS middleware intercepts the OPTIONS request and responds with:
   - `Access-Control-Allow-Origin: https://app.example.com`
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers: Authorization, Content-Type`
   - `Access-Control-Max-Age: 86400`
   - `Access-Control-Allow-Credentials: true` (if configured)
4. Browser compares the preflight response against the actual request's origin, method, and headers. If they match, the actual request proceeds.
5. For simple requests, no preflight is needed, but the response still includes `Access-Control-Allow-Origin` and related headers.

## Patterns
- **Single SPA origin**: Set `'allowed_origins' => ['https://app.example.com']` when there is a single known SPA frontend.
- **Multiple origins for multi-tenant SPA**: Dynamically match allowed origins via a closure:
  ```php
  'allowed_origins' => [
      'https://app.example.com',
      'https://admin.example.com',
      'https://partner.example.com',
  ],
  ```
- **Dynamic origin from database**: Use a closure in `allowed_origins` that checks the `Origin` header against a database whitelist (custom middleware).
- **Development CORS**: Allow `http://localhost:3000`, `http://localhost:5173` (Vite), and other dev servers. Use environment-specific config.
- **Credentials with specific origin**: When using Sanctum SPA cookie auth:
  ```php
  'supports_credentials' => true,
  'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
  ```
- **CORS per-route group**: Set different CORS configurations for different route prefixes (e.g., public API vs admin API) by applying different CORS middleware groups.

## Architectural Decisions
1. **Global vs per-route CORS**: Global CORS middleware (`HandleCors`) is simpler for single-frontend apps. Per-route CORS groups are necessary when different client types (browser, mobile, admin panel) need different CORS policies.
2. **`*` origin vs specific origins**: `*` is simple but incompatible with credentials. Always use specific origins when cookies are involved.
3. **Allowed headers whitelist**: Be explicit about which headers clients can send. `Authorization`, `Content-Type`, `X-Requested-With`, `X-CSRF-TOKEN`, and `X-Socket-Id` are common.
4. **Preflight cache duration**: 86400 seconds (24 hours) is recommended. Shorter for development (0 to disable caching). Longer reduces OPTIONS traffic but delays CORS policy updates.

## Tradeoffs (table)
| Aspect | `*` (any origin) | Specific origins | Dynamic origins |
|--------|-----------------|------------------|-----------------|
| Setup complexity | None | Medium | High |
| Security | Low (any site can call API) | High | High |
| Credentials support | No | Yes | Yes |
| Maintenance | None | Manual updates | Auto-managed |
| Caching | Max cache (24h) | Max cache (24h) | Reduced cache (updates common) |
| Flexibility | Max | Constrained | Adaptive |

## Performance Considerations
- OPTIONS preflight requests do not invoke controllers. Laravel's CORS middleware handles them and returns early.
- Preflight caching reduces OPTIONS traffic. A cached preflight for 24 hours means one OPTIONS request per origin per day.
- For APIs with many dynamically allowed origins, computing origin matching on every request adds overhead. Pre-compute the allowed origins list and cache it.
- CORS middleware runs early in the global middleware stack. Keep the origin matching logic efficient (no database queries in the CORS middleware).

## Production Considerations
- **CORS error debugging**: 99% of CORS errors are misconfigured origins or missing credentials support. Check the browser's network tab for the exact preflight response.
- **Caching layer integration**: If using Varnish or Cloudflare, ensure they pass through OPTIONS requests and CORS headers. Some CDNs strip custom headers.
- **SSR/API Gateway**: If using a reverse proxy (Nginx) or API Gateway (AWS), CORS can be handled at the proxy level, removing the need for Laravel CORS handling.
- **Preflight on every new tab**: Some browsers (Firefox) send preflight per tab. Ensure OPTIONS routes respond quickly.
- **`Vary: Origin` header**: Set `Vary: Origin` on responses to ensure CDNs cache responses correctly per origin. Laravel's CORS middleware includes this automatically.
- **Testing CORS**: Use `curl -H "Origin: http://example.com" -H "Access-Control-Request-Method: POST" -X OPTIONS -v https://api.example.com/api/test` to verify CORS responses.

## Common Mistakes
- Setting `supports_credentials: true` without listing specific origins (credentials requires explicit origin, not `*`).
- Allowing `*` origins in production with cookies involved — browser rejects the request.
- Not allowing the `Authorization` header in `allowed_headers`, causing authenticated requests to fail.
- Not enabling CORS for the `OPTIONS` method in `allowed_methods`.
- Setting `allowed_origins` with a trailing slash (`https://app.example.com/`) — origins do not include paths.
- Using `Access-Control-Allow-Origin: null` — disallowed by browsers. Use the exact origin instead.
- Configuring CORS in Laravel AND in Nginx — headers may be duplicated or overwritten. Handle CORS in one layer only.

## Failure Modes
1. **Preflight returns 404**: No CORS middleware registered for OPTIONS requests, or the CORS middleware responds before the route matches. Solution: Ensure `HandleCors` middleware runs before authentication middleware in the global stack.
2. **Credentials with wildcard**: `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` — browser rejects. Solution: Use the exact request origin in the response.
3. **Multiple origins in one header**: `Access-Control-Allow-Origin: https://a.com https://b.com` — only one origin is valid. Solution: Echo back the request's `Origin` header value.
4. **CORS blocked by Cloudflare**: Cloudflare's CORS proxy strips OPTIONS responses or modifies headers. Solution: Configure Cloudflare to pass CORS headers through unmodified.
5. **Stale preflight cache after CORS config change**: Browser caches a preflight for 24 hours. During this time, any CORS configuration change is not picked up. Solution: Set shorter `Access-Control-Max-Age` during development; use versioned origins in production.

## Ecosystem Usage
- **Laravel Sanctum SPA mode**: Requires `supports_credentials: true`, specific `allowed_origins` (no `*`), and `Authorization` + `X-CSRF-TOKEN` in allowed headers.
- **Laravel Breeze + Inertia**: The Breeze scaffolding automatically configures CORS for Inertia-based SPAs.
- **Laravel + Vite**: Vite dev server on `http://localhost:5173` must be in `allowed_origins` for development.
- **Laravel + Next.js**: Next.js on `http://localhost:3000` needs CORS configured. Next.js API routes can act as a proxy to avoid CORS entirely.

## Related Knowledge Units
### Prerequisites
- HTTP methods and headers
- Same-origin policy understanding

### Related Topics
- [sanctum-spa-cookie-auth](./phase-2/02-sanctum-spa-cookie-auth.md)
- [api-security-headers](./phase-2/13-api-security-headers.md)

### Advanced Follow-up Topics
- CORS specification deep dive (Fetch Standard)
- Reverse proxy CORS handling (Nginx, Cloudflare)
- CORS vs JSONP (legacy cross-origin technique)

## Research Notes
### Source Analysis
Laravel's `HandleCors` middleware (`vendor/laravel/framework/src/Illuminate/Http/Middleware/HandleCors.php`) is built on top of `fruitcake/php-cors` package. The `config/cors.php` file defines the configuration.

### Key Insight
The most common CORS failure in Laravel APIs is the combination of `allowed_origins: ['*']` and `supports_credentials: true`. The browser specification explicitly forbids this combination. When credentials (cookies) are needed, always use explicit origins.

### Version-Specific Notes
- **Laravel 9/10**: `config/cors.php` included by default. Uses `fruitcake/laravel-cors` under the hood.
- **Laravel 11**: CORS is still configured via `config/cors.php`. The `HandleCors` middleware is included in the global middleware stack by default.
- **Laravel 11+**: If using Sanctum SPA mode, CORS config must explicitly allow the SPA origin with credentials.

## Tradeoffs

**Benefit:** Centralized, consistent pattern. **Cost:** Additional abstraction layer, indirection. **Consequence:** Cleaner controllers but requires team discipline to maintain separation.