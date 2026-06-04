# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Security Hardening |
| Knowledge Unit | CORS Configuration |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

CORS (Cross-Origin Resource Sharing) controls which origins can access your application's resources from a browser. Laravel's `config/cors.php` (or `config/cors.php` in older versions) configures allowed origins, methods, headers, and whether credentials (cookies) are allowed. For Sanctum SPA auth, CORS must allow the SPA's origin and include `supports_credentials: true`. For public APIs, restrict origins to known clients. The most permissive setting (`allowed_origins: ['*']`) allows any website to make requests to your API in the browser.

---

## Core Concepts

- **CORS**: Browser security mechanism that blocks requests from different origins unless the server explicitly allows them.
- **Origin**: Protocol + domain + port (e.g., `https://app.example.com:3000`). Path is not part of the origin.
- **Preflight Request**: Browser sends an OPTIONS request before the actual request to check CORS permissions.
- **`allowed_origins`**: List of origins allowed to access the resource. `*` allows all (public API).
- **`supports_credentials`**: When `true`, `Access-Control-Allow-Credentials: true` is sent. Required for Sanctum cookie auth.
- **`allowed_methods`**: HTTP methods allowed (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`).

---

## When To Use

- Every application that serves browser-based clients from different origins
- Sanctum SPA auth (requires credentials + specific origins)
- Public APIs consumed by browser-based third-party apps
- Admin panels and APIs served from different subdomains

## When NOT To Use

- Same-origin applications (API and frontend on same domain) — no CORS needed
- Server-to-server API calls (CORS is a browser-only mechanism)
- Native mobile apps (no CORS restrictions for non-browser clients)

---

## Best Practices

- **Restrict Origins**: Replace `*` with specific known origins in production. `*` allows any website to make browser requests.
- **Credentials with Specific Origins**: When `supports_credentials = true`, `allowed_origins` must be specific domains (not `*`).
- **Sanctum SPA Config**: Set `SANCTUM_STATEFUL_DOMAINS` in `.env` and ensure CORS allows the SPA origin with `supports_credentials = true`.
- **Preflight Caching**: Set `Access-Control-Max-Age` to reduce OPTIONS requests for repeated requests.

---

## Architecture Guidelines

- CORS config in `config/cors.php` (Laravel 9+) or via middleware
- `allowed_origins`: specific domains for production, `*` for development (if acceptable risk)
- `supports_credentials`: `true` if using Sanctum cookie auth, `false` for public API
- Preflight cache: set `max_age` to 86400 (24 hours) for repeated requests
- Exclude CORS middleware from routes that don't need it (CLI commands, queue workers)

---

## Performance Considerations

- CORS headers are set on every response — negligible overhead
- Preflight (OPTIONS) requests: one request per distinct method/header combination. Cached via `Access-Control-Max-Age`.
- No database impact — purely HTTP header manipulation

---

## Security Considerations

- **`allowed_origins: ['*']`**: Any website can make browser-based requests to your API. Acceptable for public APIs, but never pair with credentials.
- **Credentials Restriction**: With `supports_credentials = true`, `allowed_origins` must not be `*`. Browser requirement.
- **Overly Permissive Methods**: Only allow methods your application actually needs. `DELETE` on a read-only API is unnecessary.
- **Exposed Headers**: Only expose headers that clients need access to (`Authorization`, `X-Request-ID`, etc.).

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| `allowed_origins: ['*']` with credentials | Copying dev config | Browser rejects CORS (credentials + wildcard mismatch) | Use specific origins with credentials |
| Missing Sanctum stateful domains | Only configuring CORS | SPA auth returns 401 | Set SANCTUM_STATEFUL_DOMAINS |
| Too many allowed origins | Adding every known domain | Broad attack surface | Use exact origins needed |
| Allowing all methods | Convenience | Unintended DELETE/PUT access | Only allow methods your app uses |

---

## Anti-Patterns

- **Reflecting Origin from Request**: `allowed_origins: [request()->header('Origin')]` — allows ANY origin (security bypass)
- **Allowing all headers**: `allowed_headers: ['*']` — broad, but acceptable if credentials are not enabled
- **No CORS for public API**: Public APIs should still have CORS configured — blocking all cross-origin requests may break legitimate clients

---

## Examples

**Sanctum SPA CORS configuration:**
```php
// config/cors.php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('APP_FRONTEND_URL', 'http://localhost:3000')],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

**.env for Sanctum SPA:**
```dotenv
APP_FRONTEND_URL=https://app.example.com
SANCTUM_STATEFUL_DOMAINS=app.example.com
SESSION_DOMAIN=.example.com
```

**Public API CORS:**
```php
// config/cors.php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST'],
    'allowed_origins' => ['*'], // Public API — any origin can read
    'allowed_headers' => ['Content-Type', 'Authorization'],
    'supports_credentials' => false, // No cookies
];
```

---

## Related Topics

- Sanctum SPA vs Token auth
- Session configuration
- CSRF protection
- Security headers

---

## AI Agent Notes

- CORS misconfiguration is a common cause of Sanctum SPA auth failures. First check: `allowed_origins` + `supports_credentials` + `SANCTUM_STATEFUL_DOMAINS`.
- `allowed_origins: ['*']` is acceptable for public APIs but never with credentials.
- If CORS errors appear in the browser console but the request works in Postman, it's a CORS issue (Postman does not enforce CORS).

---

## Verification

- [ ] CORS configured for all origins that need access
- [ ] `allowed_origins` specific domains (not `*`) when using credentials
- [ ] `supports_credentials` matches auth method (true for Sanctum SPA, false for public API)
- [ ] `SANCTUM_STATEFUL_DOMAINS` configured (if using Sanctum SPA auth)
- [ ] Allowed methods restricted to what the app actually uses
- [ ] Preflight (OPTIONS) requests handled correctly
- [ ] Public API CORS reviewed (any origin access acceptable?)
- [ ] No origin reflection vulnerability
