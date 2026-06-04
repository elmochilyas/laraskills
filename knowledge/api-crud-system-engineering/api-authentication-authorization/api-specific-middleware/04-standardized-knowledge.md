# ECC Standardized Knowledge — API-Specific Middleware

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | API-Specific Middleware |
| Difficulty | Intermediate |
| Category | Middleware |
| Last Updated | 2026-06-02 |

## Overview

API-specific middleware handles cross-cutting concerns unique to API requests that web routes do not need. These middleware components ensure consistent behavior across all API endpoints — forcing JSON responses, adding request identifiers for tracing, logging audit trails, and measuring response timing. Without them, unauthenticated API requests return HTML login pages instead of JSON 401 responses, and correlating errors to log entries becomes nearly impossible.

## Core Concepts

- **ForceJson**: Sets `Accept: application/json` on the request, ensuring Laravel returns JSON on authentication failures instead of redirecting to `/login`.
- **Request ID (`X-Request-Id`)**: A UUID generated per request, propagated through the response header and logs for end-to-end tracing.
- **Audit middleware**: Logs method, URL, status code, duration, user ID, and IP for debugging and compliance.
- **Response timing**: `X-Response-Time` header in milliseconds. Helps clients diagnose latency issues.
- **Response compression**: Gzip/brotli compression for large JSON payloads. Not useful for payloads under 4KB.

## When To Use

- Every Laravel API, regardless of size
- APIs behind load balancers where request tracing is needed
- Compliance-heavy applications requiring audit trails
- APIs with mixed auth states (guest + authenticated) where ForceJson prevents HTML responses

## When NOT To Use

- ForceJson in the global middleware group (breaks web routes that return views)
- Audit middleware before rate limit middleware (rate-limited requests are not audited)
- Response compression for very small payloads (<4KB) where CPU cost outweighs bandwidth savings

## Best Practices

- **ForceJson as outermost middleware**: All downstream middleware sees JSON headers.
- **Server-generated request IDs**: Prefer server generation. If client provides one, validate UUID format.
- **Audit storage**: Use log channels (Redis, ELK) rather than synchronous DB inserts. Async prevents blocking.
- **Include Request ID in error responses**: Add `request_id` to error payloads for debugging correlation.
- **Strip sensitive data from audit logs**: Filter `Authorization` headers, passwords, credit cards, PII.

## Architecture Guidelines

- Register in the API middleware group in `bootstrap/app.php` (Laravel 11) or `app/Http/Kernel.php` (Laravel 9/10).
- Order: ForceJson → Request ID → Audit → Rate Limiter → Controller.
- In Laravel 11, the `api` middleware group must be explicitly defined and no longer includes `throttle:api` by default.
- Request ID should be stored in request attributes: `$request->attributes->set('request_id', $requestId)`.

## Performance Considerations

- ForceJson, AddRequestId, and timing add <0.1ms per request — irrelevant.
- Audit middleware adds log I/O. Use async logging (Redis channel) for high throughput.
- Response compression uses CPU. Compress only responses above 4KB.
- Request ID generation is a single `Str::uuid()` call — negligible.

## Security Considerations

- Audit logs can grow to ~2GB/month for 1M requests/day. Configure log rotation (30-90 day retention).
- Sensitive data in audit logs is a compliance risk. Implement a sanitizer middleware.
- Request ID prevents request forgery correlation but does not authenticate.
- ForceJson does not affect request encoding for file uploads.

## Common Mistakes

- **ForceJson in global middleware**: Breaks web routes expecting HTML/redirects. Only place in API group.
- **Request ID lost in exceptions**: When exception occurs before middleware runs the response handling path.
- **Logging full request body**: May contain PII, credentials, or sensitive data.
- **Audit after rate limiter**: Rate-limited requests (429s) are not audited, hiding abuse patterns.
- **Synchronous DB audit inserts**: Database becomes a bottleneck under load.

## Anti-Patterns

- **Duplicate request IDs**: Server generating a new ID when client already sent one. Use client's ID if valid.
- **Remove ForceJson for webhooks**: Webhook receivers often send `application/x-www-form-urlencoded`. Handle via route exclusion rather than removing the middleware.

## Examples

- ForceJsonResponse: Sets `Accept: application/json` on request → returns in API group → all errors return JSON.
- AddRequestId: `$requestId = $request->header('X-Request-Id') ?: Str::uuid()` → sets attribute → sets response header.
- AuditMiddleware: Logs method, full URL, status, duration (ms), user_id, ip, request_id to `api-audit` channel.

## Related Topics

- **Prerequisites**: Laravel middleware lifecycle, HTTP request/response cycle
- **Closely Related**: API Security Headers, CORS Configuration, Signed Request Pattern
- **Advanced**: Distributed tracing (OpenTelemetry, Zipkin, Jaeger), middleware priority ordering
- **Cross-Domain**: Laravel Core Application Engineering (middleware pipeline mechanics)

## AI Agent Notes

When generating API middleware: always include ForceJson and AddRequestId in the API group. Use server-generated UUIDs for request IDs. Implement audit logging with async storage. Include request_id in all error responses. Strip sensitive data from audit logs.

## Verification

Sources: Laravel `bootstrap/app.php`, `Illuminate\Http\Middleware\HandleCors`, Laravel 11 middleware documentation, domain-analysis.md.
