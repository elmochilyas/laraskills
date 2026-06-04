# ECC Standardized Knowledge — Sanctum SPA Cookie Auth

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Sanctum SPA Cookie Auth |
| Difficulty | Intermediate |
| Category | Authentication |
| Last Updated | 2026-06-02 |

## Overview

Sanctum's SPA cookie authentication enables API auth for single-page applications using Laravel's session cookies and CSRF protection instead of tokens. Cookies are HTTP-only, immune to XSS-based token theft, and automatically sent with requests. This eliminates the token storage dilemma (localStorage vs cookies) for first-party SPAs on the same or subdomain.

## Core Concepts

- **Same-domain constraint**: SPA and Laravel backend must share the same top-level domain. Cookies are not sent cross-origin.
- **Stateful guard**: `auth:sanctum` checks the session cookie (like `web` guard) but applied to API routes.
- **CSRF protection**: SPA fetches `/sanctum/csrf-cookie` to get `XSRF-TOKEN` cookie, then sends as `X-XSRF-TOKEN` header on mutating requests.
- **Session driver must be `cookie`**: Sanctum reads session data from the encrypted cookie. `file`/`database`/`redis` drivers do not work.

## When To Use

- First-party SPAs (Vue, React, Next.js) on the same domain or subdomain
- Inertia.js applications using Laravel Breeze
- When you want to avoid token storage in browser-accessible locations
- When same-origin constraint is acceptable for your architecture
- API-first applications where the frontend is built with a modern JS framework

## When NOT To Use

- Mobile apps (use Sanctum token auth instead — cookies not available in native apps)
- Third-party API consumers (they cannot share your domain)
- Cross-origin scenarios where cookies are blocked (browser third-party cookie deprecation)
- Server-to-server communication (use API keys or token auth)
- When the SPA cannot share the top-level domain with the API

## Best Practices

- **HTTPS is mandatory**: Set `SESSION_SECURE_COOKIE=true` in production.
- **SameSite cookie**: Use `none` for subdomain separation; `lax` for same-origin.
- **CORS with credentials**: `supports_credentials: true`, explicit origins (no `*`), expose needed headers.
- **CSRF cookie route unauthenticated**: `/sanctum/csrf-cookie` must not require auth.
- **Handle 419 (CSRF mismatch)**: Catch and re-fetch CSRF cookie, then retry.
- **Set `SESSION_DOMAIN`**: For subdomain setups, set `.example.com` to share cookies across subdomains.

## Architecture Guidelines

- Sanctum automatically detects stateful vs stateless requests via `EnsureFrontendRequestsAreStateful` middleware.
- Keep session data minimal to avoid oversized cookies (some proxies reject >8KB).
- `SANCTUM_STATEFUL_DOMAINS` must match the SPA's exact domain (no protocol).
- For Axios, `withCredentials: true` and default `xsrfCookieName`/`xsrfHeaderName` work automatically.

## Performance Considerations

- Session cookie size grows with stored data. Keep minimal data in session.
- Every request decrypts the cookie. AES-256-GCM is fast.
- CSRF token regeneration adds slight overhead. Configurable via `csrf_expiration`.

## Security Considerations

- **HTTP-only cookie**: Immune to XSS-based token theft. Cannot be read by JavaScript.
- **Third-party cookie deprecation**: Chrome's phased rollout makes cross-origin SPA cookie auth increasingly fragile. Plan token-based fallback.
- **CSRF token expiration**: Default 2 hours. Increase to match session lifetime for long-lived SPA sessions.
- **Load balancer trust**: Configure `TrustProxies` so Laravel generates correct URLs in CSRF cookies.

## Common Mistakes

- **Non-`cookie` session driver**: SPA cookie auth requires the `cookie` session driver.
- **Missing `withCredentials: true`**: Cookies are not sent — all requests appear unauthenticated.
- **Wrong `SANCTUM_STATEFUL_DOMAINS`**: Sanctum falls back to token auth and returns 401.
- **`X-CSRF-TOKEN` instead of `X-XSRF-TOKEN`**: Laravel uses Angular-style header name.
- **Cross-origin with different top-level domains**: Cookies blocked by browser. Use token auth instead.

## Anti-Patterns

- **Storing sensitive data in session**: Cookie size limits apply. Use server-side session store for large data.
- **CSRF cookie on authenticated routes**: Must be accessible before login. Serve at root level, unauthenticated.
- **SameSite=Strict with subdomain separation**: Browser blocks cookie sending across subdomains.

## Examples

- Login flow: `GET /sanctum/csrf-cookie` (unauthenticated) → `POST /login` with `X-XSRF-TOKEN` header → session established → subsequent requests include cookie automatically.

## Related Topics

- **Prerequisites**: CSRF protection, HTTP cookies and SameSite attribute, CORS configuration
- **Closely Related**: Sanctum vs Passport Decision, Sanctum Token Auth, CORS Configuration
- **Advanced**: Session fixation mitigation, cookie prefixing for subdomain isolation
- **Cross-Domain**: Security & Identity Engineering, Laravel Core Application Engineering

## AI Agent Notes

When generating Sanctum SPA code: ensure session driver is `cookie`, configure CORS with explicit origins and credentials, set `SANCTUM_STATEFUL_DOMAINS`, require HTTPS in production, handle 419 with CSRF refresh, use `X-XSRF-TOKEN` header.

## Verification

Sources: Laravel Sanctum documentation, `EnsureFrontendRequestsAreStateful` middleware source, domain-analysis.md.
