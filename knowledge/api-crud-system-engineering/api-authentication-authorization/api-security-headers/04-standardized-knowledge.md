# ECC Standardized Knowledge — API Security Headers

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | API Security Headers |
| Difficulty | Intermediate |
| Category | Security |
| Last Updated | 2026-06-02 |

## Overview

Security headers are HTTP response headers that instruct clients to enforce security behaviors. For APIs, they protect against MIME sniffing, SSL stripping, clickjacking, data injection, and sensitive data caching. While each header adds only bytes to the response, collectively they form a critical defense layer that prevents entire classes of web vulnerabilities at negligible performance cost.

## Core Concepts

- **`X-Content-Type-Options: nosniff`**: Prevents MIME type sniffing. The browser trusts `Content-Type`.
- **`Strict-Transport-Security` (HSTS)**: Forces HTTPS communication. Prevents SSL stripping. Uses `max-age`, `includeSubDomains`, `preload`.
- **`Content-Security-Policy` (CSP)**: Controls allowed resources. For JSON APIs, use `default-src 'none'` to restrict everything.
- **`Cache-Control: no-store, private`**: Prevents caching of sensitive API responses in shared proxies.
- **`Referrer-Policy: no-referrer`**: Prevents API URL leakage via Referer header.
- **`Permissions-Policy`**: Restricts browser features. Deny all for API endpoints.

## When To Use

- Every API response, including error responses
- Static assets served by Laravel (not just API routes)
- OPTIONS preflight responses
- Development environments (catch issues before production)

## When NOT To Use

- HSTS over HTTP (browsers ignore it; only send over HTTPS)
- CSP with `'unsafe-inline'` for JSON APIs (restrict to `'none'`)
- `X-XSS-Protection` (deprecated; CSP handles XSS)
- Headers already set at reverse proxy level (Nginx, Cloudflare) to avoid duplication

## Best Practices

- **Use a single middleware class** that sets all security headers at once. Register in the API middleware group.
- **HSTS gradual rollout**: Start with `max-age=86400`, monitor for HTTPS issues, increase to `31536000` (1 year).
- **CSP for JSON APIs**: `default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests`.
- **Remove `X-Powered-By` header** to avoid revealing PHP version.
- **Vary headers by environment**: Only send HSTS in production. Use stricter CSP in production.
- **Test with securityheaders.com** or Mozilla Observatory to verify coverage.

## Architecture Guidelines

- Add security headers in a dedicated middleware that runs after the response is built but before it's sent.
- Middleware approach is fine for most APIs. For higher performance, set headers at the Nginx/load balancer level.
- If using both Laravel and proxy-level headers, disable Laravel's to avoid duplication.
- Cache-Control headers should be set based on route type (authenticated vs public).

## Performance Considerations

- Security headers add 200-400 bytes per response — negligible.
- CSP enforcement is purely client-side; no server overhead.
- Headers set in middleware add ~0.01ms to response time.
- HSTS preload registration requires no ongoing server cost.

## Security Considerations

- **HSTS misconfiguration**: `includeSubDomains` breaks any subdomain not supporting HTTPS. Verify all subdomains first.
- **Cache-Control missing**: Shared proxy caches can serve authenticated responses to other users. Always set `no-store, private` on authenticated routes.
- **Header stripping by CDN**: Cloudflare or Akamai may strip non-standard headers. Verify pass-through configuration.
- **Referrer-Policy**: API URLs containing tokens in path are leaked via `Referer` without this header.

## Common Mistakes

- **HSTS sent over HTTP**: Browsers ignore HSTS from insecure connections. Only send over HTTPS.
- **Using `X-XSS-Protection`**: Deprecated and may introduce XSS vulnerabilities in some browsers. Use CSP instead.
- **CSP `default-src 'self'` for JSON APIs**: Meaningless for non-HTML responses. Use `default-src 'none'`.
- **Forgetting Cache-Control for authenticated routes**: Cached responses in shared proxies leak user data.
- **HSTS on development domains** (`.dev`, `.local`): Browsers still enforce HSTS, causing development issues.

## Anti-Patterns

- **Copy-pasting security header lists without understanding**: Each header addresses specific attack classes. Know why each is present.
- **Setting `Access-Control-Allow-Origin: *` alongside credentials**: Covered in CORS, but this combination is invalid by spec.
- **Overly permissive CSP**: `default-src 'self'` for API responses is unnecessarily permissive. Restrict to `'none'`.

## Examples

- SecurityHeadersMiddleware: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Referrer-Policy: no-referrer`, `Permissions-Policy: geolocation=(), camera=(), microphone=()`.

## Related Topics

- **Prerequisites**: HTTP headers fundamentals, HTTPS/TLS basics
- **Closely Related**: CORS Configuration, API-Specific Middleware
- **Advanced**: HSTS preload submission, CSP violation reporting (report-uri, report-to)
- **Cross-Domain**: Security & Identity Engineering

## AI Agent Notes

When generating API security code: always include `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Cache-Control: no-store, private` for authenticated routes, and `Referrer-Policy: no-referrer`. Use a dedicated middleware. Remove `X-Powered-By`. Never set HSTS over HTTP.

## Verification

Sources: OWASP Secure Headers Project, MDN Web Docs, Mozilla Observatory, domain-analysis.md (api-authentication-authorization section).
