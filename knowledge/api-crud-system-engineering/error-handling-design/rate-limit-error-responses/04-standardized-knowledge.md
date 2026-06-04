# Rate Limit Error Responses

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-rate-limit-error-responses |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

All rate-limit exceeded scenarios return a consistent 429 response shape with mandatory `Retry-After` header, enabling clients to implement transparent back-off and preventing cascading failure. The envelope includes retry timing and limit state for client-side rate-limit awareness.

## Core Concepts

- **HTTP 429 Too Many Requests**: Status for all rate-limit violations.
- **Retry-After Header**: Required; value is seconds (integer) until the next available request window.
- **Error Codes**: `SYSTEM.RATE_LIMITED` (global), `USER.AUTH_RATE_LIMITED` (login-specific), `API.RATE_LIMITED` (endpoint-specific).
- **Limit Context Detail**: `detail.limit` shows the quota, remaining, and reset timestamp so clients can self-regulate.
- **X-RateLimit Headers**: Included on all responses (not just 429) for proactive client throttling.

## When To Use

- For any public-facing API (required for production)
- For authentication endpoints (login, register) to prevent brute force
- For resource-intensive endpoints that need protection
- For third-party APIs with usage tiers
- For any endpoint that should not be called at high frequency

## When NOT To Use

- For internal-only APIs behind a service mesh that handles rate limiting
- For local development environments (unless testing rate limit behavior)
- For webhook endpoints that process events asynchronously

## Best Practices (WHY)

- **Always include Retry-After header**: Mandatory per RFC 6585 for 429 responses.
- **Include X-RateLimit headers on ALL responses**: Clients that see `Remaining: 3` can slow down before hitting 429.
- **Use distinct codes per limiter**: Login limiter (`USER.AUTH_RATE_LIMITED`) vs general API limiter (`SYSTEM.RATE_LIMITED`).
- **Use Retry-After in integer seconds**: Simpler for programmatic clients than HTTP-date format.
- **Mirror retry info in body**: Headers are canonical; body provides convenience for header-restricted clients.
- **Apply rate limits before authentication**: Prevents unauthenticated requests from bypassing limits.
- **Use separate limiters for different concerns**: Login, general API, and specific endpoints should have independent limits.
- **Never let a 429 surprise a well-behaved client**: Proactive headers prevent unexpected throttling.

## Architecture Guidelines

- Map `ThrottleRequestsException` in the handler with retry-after from exception headers.
- Include `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` in 429 responses.
- Include `X-RateLimit-Remaining` on every successful response via middleware.
- Use distinct error codes for different rate limiters (login, general API, premium).
- Always return Retry-After as integer seconds, never HTTP-date.
- Ensure Retry-After never exceeds a reasonable bound (max 3600 seconds).
- Reset rate-limit counters on deploy to avoid immediate post-deploy throttling.

## Performance Considerations

- Rate-limit check (cache hit) is O(1) — sub-millisecond with Redis.
- 429 response generation is identical to any other error response.
- The cache backend (Redis/Memcached) adds sub-millisecond latency.
- Header attachment on successful responses adds no measurable overhead.

## Security Considerations

- Never reveal exact rate limit window start/end in ways that time-shift attacks.
- Use different limiters for login and general API to prevent login brute force from blocking legitimate traffic.
- Log rate-limit hits with user ID, IP, and endpoint for abuse analysis.
- Monitor 429 rates: sustained high rates indicate misconfigured clients or DoS.
- Cache stampede: Use atomic increment (Redis INCR), not read-then-write.
- Distributed rate limiting requires a shared Redis backend.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Missing Retry-After header | No retry timing | Not required by default Laravel | Client cannot implement back-off | Always include Retry-After in 429 |
| No X-RateLimit on success responses | Client doesn't know limit state | Rate limit considered an error-only feature | Client hits 429 unexpectedly | Include on every response via middleware |
| Same limiter for login and API | Login brute force blocks legitimate API calls | Single rate limiter | Denial of service | Use separate limiters |
| Rate limit after auth | Unauthenticated requests bypass limits | Middleware ordering | Bypass via unauthenticated requests | Apply rate limiting before auth middleware |
| Header name inconsistency | Different environments use different header names | Copy-pasted configurations | Client parsing breaks per environment | Standardize header names across all environments |
| Non-atomic counter | Read-then-write race conditions | Using cache::get() then cache::put() | Under-counting allows limit bypass | Use atomic increment (Redis INCR) |

## Anti-Patterns

- **Returning 429 without Retry-After**: Client has no way to know when to retry.
- **Rate limit information only on 429**: Clients need proactive headers to prevent hitting limits.
- **One-size-fits-all limit**: Same limit for authenticated and unauthenticated users.
- **Rate limiting after resource-intensive operations**: Check the limit before processing the request.
- **Logging full request body on rate limit events**: Ratelimit events are high-volume; log minimally.

## Examples

```php
public function renderRateLimitError(ThrottleRequestsException $e, Request $request): JsonResponse
{
    $retryAfter = $e->getHeaders()['Retry-After'] ?? 60;

    return response()->json(
        new ErrorEnvelope(
            code: ErrorCodes::SYSTEM_RATE_LIMITED,
            message: 'Too many requests. Please try again later.',
            status: 429,
            detail: [
                'retry_after_seconds' => (int) $retryAfter,
                'retry_after' => now()->addSeconds((int) $retryAfter)->toIso8601String(),
            ],
        ),
        429,
        [
            'Retry-After' => $retryAfter,
            'X-RateLimit-Limit' => $e->getHeaders()['X-RateLimit-Limit'] ?? null,
            'X-RateLimit-Remaining' => 0,
        ],
    );
}
```

## Related Topics

- Standardized Error Envelope
- Rate Limiting by Authentication Tier
- Rate Limiter Definition
- Rate Limit Headers
- Exception-to-Code Mapping (mapping ThrottleRequestsException)

## AI Agent Notes

- Always include `Retry-After` header as integer seconds in 429 responses.
- Include rate limit headers on all responses, not just errors.
- Use distinct limiters and error codes for different rate limit scenarios.
- Never expose rate limit internals (window boundaries, exact counter values) that could aid attacks.
- When generating rate-limited endpoints, ensure the limiter is checked before resource-intensive operations.

## Verification

- [ ] All 429 responses include `Retry-After` header (integer seconds)
- [ ] All responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- [ ] Distinct rate limiters exist for login, general API, and premium endpoints
- [ ] Rate limiting is applied before authentication middleware
- [ ] Rate limits are configured per tier (guest, authenticated, premium)
- [ ] Shared Redis backend is used for distributed rate limiting
- [ ] Integration tests verify 429 shape and headers for rate-limited scenarios
