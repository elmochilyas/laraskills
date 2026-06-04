# ECC Standardized Knowledge — CORS Policy Governance

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | CORS Policy Governance |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

CORS (Cross-Origin Resource Sharing) policy governance defines how API origins are managed, how CORS headers are configured per environment, and what security reviews are required for origin additions. CORS is a browser-enforced permission system, not a security boundary — real security comes from authentication. Environment-specific origin lists, explicit origin echoing for authenticated endpoints, and a formal origin change request process ensure controlled access.

## Core Concepts

- **Origin**: Scheme + host + port (e.g., `https://app.example.com`). Validated per request.
- **Preflight request**: Browser-sent OPTIONS request checking CORS permissions before actual request.
- **Allowed origins**: List of origins permitted cross-origin access. Environment-specific.
- **Wildcard origin (*)**: Allows all origins — appropriate for public read-only endpoints, never for authenticated ones.
- **Credentials flag**: When withCredentials is true, server must specify explicit origins (not *).
- **Exposed headers**: Custom headers listed in `Access-Control-Expose-Headers` for browser JS access.

## When To Use

- Any browser-accessible API
- APIs consumed by SPAs, browser extensions, or web applications
- Public APIs with multiple client origins
- Multi-tenant SaaS APIs with tenant-specific origins

## When NOT To Use

- Server-to-server APIs (CORS is browser-only)
- Mobile or native applications (no CORS enforcement)
- Internal-only APIs accessed exclusively from backend services

## Best Practices

- **Environment-specific origin lists**: Dev allows `http://localhost:*`; staging allows internal domains; production has curated allowlist.
- **No wildcards for authenticated endpoints**: Always echo specific origin when credentials required.
- **Explicit header exposure**: List all custom response headers in `Access-Control-Expose-Headers`.
- **Preflight cache TTL**: Set `Access-Control-Max-Age: 86400` (24 hours) to reduce preflight overhead.
- **Formal origin change process**: Adding production origin requires security review and business justification.
- **Dynamic origin validation**: For multi-tenant SaaS, validate against tenant-specific allowlist.

## Architecture Guidelines

- Gateway (nginx) handles preflight OPTIONS; application handles dynamic origin validation.
- Static origins from environment variables; dynamic origins from database for consumer-managed allowlists.
- Keep origin lists under 100 entries per environment for O(n) validation performance.
- CORS headers must be present on error responses too (browser needs them to read error body).
- Provide CORS debugging endpoint (`GET /cors-check`) for developer troubleshooting.

## Performance Considerations

- Preflight adds one round-trip for cross-origin requests — caching with Max-Age minimizes this.
- Origin validation is O(n) against allowlist — keep lists under 100 entries.
- Dynamic origin resolution (database-backed) adds ~5ms — cache allowlist in memory.

## Security Considerations

- CORS does NOT protect against direct server-to-server requests. Authenticate all requests.
- Never use `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` (browsers reject).
- Do not allow `http://localhost:*` in production.
- Quarterly audit of origin allowlist to remove unused origins.

## Common Mistakes

- Using wildcard origin with credentials flag (browsers reject this combination).
- Forgetting to expose custom headers in `Access-Control-Expose-Headers` (browser hides them from JS).
- Setting Max-Age too low (many preflights) or too high (stale permissions).
- Allowing localhost in production.
- Not including CORS headers on error responses.

## Anti-Patterns

- **Treating CORS as a security mechanism**: CORS is browser-only. Real security requires authentication.
- **Wildcard origins on authenticated endpoints**: Any origin can use credentials if * is set.
- **No CORS on error responses**: Browser cannot read error body, masking issues.

## Examples

- Production config: `Access-Control-Allow-Origin: https://app.example.com, Access-Control-Allow-Credentials: true, Access-Control-Expose-Headers: X-Request-Id, Deprecation, Link`.
- Preflight response: `HTTP 204 No Content, Access-Control-Allow-Origin: https://app.example.com, Access-Control-Allow-Methods: GET, POST, PUT, DELETE, Access-Control-Max-Age: 86400`.

## Related Topics

- **Prerequisites**: Request Size Limits, API Monitoring and Alerting
- **Closely Related**: Team API Consistency Rules, API Audit Review Process
- **Advanced**: Dynamic CORS for multi-tenant APIs, CORS debugging tools and middleware, CORS vs CSP for API protection

## AI Agent Notes

When configuring CORS: use environment-specific origin lists, never use wildcard with credentials, expose all custom headers, set 24h preflight cache, include CORS headers on error responses, implement formal origin change process with security review, audit origin allowlist quarterly, remember CORS is browser-only (authenticate everything).

## Verification

Sources: MDN CORS documentation, Stripe CORS configuration, GitHub API /meta endpoint, domain-analysis.md.
