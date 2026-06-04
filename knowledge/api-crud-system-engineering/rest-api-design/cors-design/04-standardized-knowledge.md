# CORS Design

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: cors-design
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Cross-Origin Resource Sharing (CORS) is a browser security mechanism that controls which web origins can access a server's resources. When a browser-based client makes a request to a different origin than the page's origin, the browser checks CORS headers to determine whether to allow the request. CORS is enforced by the browser, not by the server — the server simply declares its policy via headers.

In Laravel, CORS is configured in `config/cors.php` via the `HandleCors` middleware. Configuration covers allowed origins, methods, headers, exposed headers, credentials, and preflight max age. Production CORS policies should be as restrictive as possible — allow only specific origins, not wildcard `*`. CORS is a browser mechanism, not an API security mechanism; it does not protect against server-to-server, mobile app, or CLI access.

## Core Concepts
- **Same-Origin Policy**: Browsers restrict JavaScript from making requests to a different origin (protocol, domain, or port). CORS relaxes this restriction.
- **Simple Requests**: GET, HEAD, POST with simple headers and Content-Type (`text/plain`, `multipart/form-data`, `application/x-www-form-urlencoded`). No preflight needed.
- **Preflight Requests**: Browser sends OPTIONS before non-simple requests (PUT, PATCH, DELETE, custom headers, `application/json` Content-Type).
- **CORS Headers**: `Access-Control-Allow-Origin`, `Allow-Methods`, `Allow-Headers`, `Expose-Headers`, `Allow-Credentials`, `Max-Age`.
- **Preflight Flow**: Browser OPTIONS → Server responds with CORS headers → Browser checks against origin → Allows or blocks actual request.

## When To Use
- Any browser-based client accessing the API from a different origin (SPA, admin panel, embeddable widgets)
- APIs consumed by JavaScript fetch/XMLHttpRequest from different domains
- Multi-domain frontend architectures (app.example.com, admin.example.com)
- SPA authentication with Sanctum (requires specific CORS config for cookies)

## When NOT To Use
- Server-to-server integrations (CORS is browser-only — no configuration needed)
- Mobile apps (native apps are not subject to CORS)
- CLI tools and API clients (Postman, curl — no CORS enforcement)
- Same-origin deployments (frontend and API on same domain)
- Public APIs with no browser-based consumers

## Best Practices (WHY)
- **Use specific origins, not wildcard**: `Access-Control-Allow-Origin: *` with `supports_credentials: true` is rejected by browsers. List explicit origins in production.
- **Never use wildcard with credentials**: Wildcard origins are incompatible with `Access-Control-Allow-Credentials: true`. The browser rejects the combination.
- **Set reasonable Max-Age**: `Access-Control-Max-Age: 86400` (24 hours) reduces preflight requests but delays policy changes. Balance freshness with overhead.
- **Expose only needed headers**: By default, browsers expose only simple headers. Add `Access-Control-Expose-Headers` for `X-Request-Id`, `Link`, rate-limit headers.
- **Handle OPTIONS before authentication**: CORS preflight must not require authentication. Ensure `HandleCors` middleware runs before auth middleware for OPTIONS requests.

## Architecture Guidelines
- Use environment variables for allowed origins: `CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com`.
- Keep staging CORS policies broader than production — but never point staging frontend at production API.
- For Sanctum SPA auth: add `sanctum/csrf-cookie` to paths, set `supports_credentials: true`, specify exact frontend URL.
- Review and prune the allowed origins list quarterly — unused origins become security liabilities.
- CORS errors appear only in the browser console, not in server logs (the server doesn't know the browser blocked the request).

## Performance
- Every non-simple request triggers a preflight OPTIONS — doubling request count for writes.
- OPTIONS responses return 204 with no body — fast (~1ms) but adds network round-trip time.
- `Access-Control-Max-Age: 86400` saves ~1000 OPTIONS requests per day for an API with 1000 write operations.
- CDN caching of OPTIONS responses is not possible (browsers don't cache preflight across origins).

## Security
- CORS is not a replacement for authentication — server-to-server and mobile requests bypass CORS entirely.
- Misconfigured CORS (wildcard + credentials → rejected) creates a false sense of security. Implement proper auth regardless.
- Exposing custom headers (`X-Debug-Info`, `X-Debug-Token`) via `Access-Control-Expose-Headers` leaks internal information.
- Origin validation must be exact (including trailing slash, protocol) — `https://app.example.com` vs `https://app.example.com/` are different origins.
- Credentialed requests require `Access-Control-Allow-Origin` to match the requesting origin exactly — no wildcard allowed.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Wildcard with credentials | `Access-Control-Allow-Origin: *` with `credentials: true` | Development config carried to production | Browser rejects the CORS response | List explicit origins when using credentials |
| No OPTIONS handling | Custom middleware blocks OPTIONS before CORS middleware runs | Middleware order not considered | Preflight fails, browser blocks actual request | Ensure HandleCors runs before auth for OPTIONS |
| Forgetting CSRF cookie path | Sanctum CORS allows requests but CSRF cookie endpoint not in paths | Incomplete Sanctum config | SPA requests fail with CSRF token mismatch | Add `sanctum/csrf-cookie` to CORS paths |
| Too many allowed origins | Additive origin list grows unchecked | Every new frontend adds an origin | Security surface expands; unused origins persist | Review and prune origins quarterly |
| Exposing sensitive headers | `X-Debug-*` headers exposed via `Access-Control-Expose-Headers` | Convenience for debugging | Internal info leaked to browser-side code | Only expose headers the client needs to read |
| CORS as only security | Relying on CORS to protect the API | Misunderstanding CORS vs auth | Non-browser clients bypass CORS entirely | Always implement authentication regardless of CORS |

## Anti-Patterns
- **CORS as Security Mechanism**: CORS is browser-only; it does not protect against direct API access.
- **Wildcard Origin in Production**: Using `*` for allowed origins. List specific origins.
- **Credentials Without Specific Origins**: Enabling `supports_credentials` but keeping wildcard origins. Browsers reject this.
- **CORS Configuration in Code**: Hardcoding origins in middleware instead of `config/cors.php`.
- **ALLOW-ALL for Development Carried to Production**: Development environment with permissive CORS leaked to production config.

## Examples
```php
// config/cors.php for production
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    'allowed_origins' => [
        'https://app.example.com',
        'https://admin.example.com',
    ],
    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
    'exposed_headers' => ['X-Request-Id', 'Link'],
    'max_age' => 86400,
    'supports_credentials' => true,
];

// Environment-aware origins
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')),

// Sanctum SPA CORS
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'supports_credentials' => true,
'allowed_origins' => [env('SPA_URL', 'http://localhost:3000')],
```

## Related Topics
- **Prerequisites**: rest-architectural-constraints, http-method-semantics
- **Related**: api-authentication-authorization, url-structure-design
- **Advanced**: content-security-policy, csrf-protection

## AI Agent Notes
- Configure CORS in `config/cors.php`, never in individual middleware or controllers.
- Use environment variables for allowed origins — never hardcode.
- For Sanctum SPA auth: specific origins, credentials enabled, `sanctum/csrf-cookie` path included.
- Handle OPTIONS before authentication in middleware order.
- Review allowed origins quarterly — remove unused entries.
- CORS errors appear in browser console only — use curl to verify server-side CORS headers.

## Verification
- Only specific origins are allowed in production — no wildcard `*`.
- `supports_credentials: true` is paired with explicit origins, never wildcard.
- OPTIONS preflight requests return 204 with correct CORS headers before authentication.
- `Access-Control-Expose-Headers` only exposes headers the client needs.
- Sanctum SPA endpoints (`sanctum/csrf-cookie`) are included in CORS paths.
- `curl -H "Origin: https://app.example.com" -I` returns correct CORS headers.
