# ECC Standardized Knowledge — CORS Configuration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | CORS Configuration |
| Difficulty | Intermediate |
| Category | Security / Configuration |
| Last Updated | 2026-06-02 |

## Overview

CORS (Cross-Origin Resource Sharing) is a browser security mechanism controlling which origins, methods, and headers can access API resources from a different origin. In Laravel APIs, CORS configuration via `config/cors.php` defines allowed origins, HTTP methods, headers, and credential support. Misconfiguration causes blocked browser requests or security vulnerabilities.

## Core Concepts

- **Origin**: Protocol + domain + port (`https://app.example.com:3000`). Same origin = same protocol + host + port.
- **Preflight request**: An `OPTIONS` request sent before non-simple requests to check CORS permissions.
- **Simple request**: GET/HEAD/POST with CORS-safelisted headers and no credentials. No preflight needed.
- **Credentials mode**: Cookies or auth headers. When `true`, `Access-Control-Allow-Origin` must be an explicit origin, not `*`.
- **Preflight cache**: Cached for `Access-Control-Max-Age` duration, reducing OPTIONS traffic.

## When To Use

- Browser-based SPA clients accessing your API from a different origin
- Third-party frontend integrations
- Development setups with separate frontend and backend servers (Vite on `localhost:5173`)
- Sanctum SPA cookie auth (requires credentials and explicit origin)

## When NOT To Use

- Mobile apps and native clients (CORS is browser-only)
- Server-to-server API calls (no browser enforcement)
- Same-origin SPA and API (no cross-origin requests)
- When API Gateway handles CORS at the proxy level

## Best Practices

- **Explicit origins, never `*` with credentials**: `allowed_origins: ['*']` + `supports_credentials: true` is forbidden by spec.
- **Whitelist known origins**: Explicit list for production. Dynamic origins only when multi-tenant.
- **Allow all needed methods and headers**: Include `OPTIONS` in methods, `Authorization` and `Content-Type` in headers.
- **Set `Access-Control-Max-Age: 86400`** (24 hours) for production. Shorter for development.
- **Expose rate limit headers via CORS**: `Access-Control-Expose-Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset`.
- **Handle CORS in one layer only**: Either Laravel or Nginx, not both.

## Architecture Guidelines

- Place `HandleCors` middleware early in the global stack, before authentication middleware.
- Use `config/cors.php` for standard setups. For per-route CORS policies, apply different middleware groups.
- For Sanctum SPA mode: set `supports_credentials: true`, explicit origins matching `SANCTUM_STATEFUL_DOMAINS`, and include `X-CSRF-TOKEN` in allowed headers.
- Set `Vary: Origin` header (Laravel's CORS middleware includes this automatically).

## Performance Considerations

- OPTIONS preflight requests do not reach controllers — Laravel's CORS middleware returns early.
- Preflight caching at 24 hours means one OPTIONS request per origin per day.
- Dynamic origin matching adds overhead. Pre-compute and cache allowed origins if using closures.
- No database queries in CORS middleware. Keep origin matching efficient.

## Security Considerations

- `Access-Control-Allow-Origin: *` + credentials = browser rejects the request. Always use explicit origins with credentials.
- `Access-Control-Allow-Origin: null` is disallowed by browsers. Use the exact origin.
- Trailing slash in origins (`https://app.example.com/`) is invalid. Origins do not include paths.
- CORS does not protect the API from malicious requests — it only restricts browser-based access.

## Common Mistakes

- **`*` origin with credentials**: The most common CORS failure. Browser rejects this combination.
- **Missing `Authorization` in allowed headers**: Authenticated requests fail at the browser level.
- **Missing `OPTIONS` in allowed methods**: Preflight requests get 404.
- **Trailing slash in origin**: Origins have no path component.
- **CORS in both Laravel and Nginx**: Headers duplicated or overwritten. Use one layer.

## Anti-Patterns

- **Allowing all origins with `*`**: Defeats CORS protection. Only acceptable for truly public APIs with no authentication.
- **Dynamic origins from database on every request**: Adds latency to every API call. Cache or use static lists.
- **Stale preflight cache hindering configuration changes**: Use short `Max-Age` during development with a note to switch to longer in production.

## Examples

- Sanctum SPA: `allowed_origins => ['https://app.example.com']`, `supports_credentials => true`, `allowed_headers => ['Authorization', 'Content-Type', 'X-CSRF-TOKEN', 'X-Requested-With']`.

## Related Topics

- **Prerequisites**: HTTP methods and headers, Same-origin policy
- **Closely Related**: Sanctum SPA Cookie Auth, API Security Headers
- **Advanced**: CORS spec (Fetch Standard), reverse proxy CORS handling
- **Cross-Domain**: Laravel Core Application Engineering

## AI Agent Notes

When generating CORS configuration: use explicit origins with credentials for Sanctum SPA, include `Authorization` and `Content-Type` in allowed headers, set `Max-Age: 86400`, expose rate limit headers, never use `*` with credentials.

## Verification

Sources: Laravel `config/cors.php`, `HandleCors` middleware source, Sanctum SPA auth documentation, domain-analysis.md.
