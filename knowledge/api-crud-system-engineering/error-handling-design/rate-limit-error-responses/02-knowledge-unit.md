# Rate Limit Error Responses

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
All rate-limit exceeded scenarios return a consistent 429 response shape with mandatory `Retry-After` header, enabling clients to implement transparent back-off and preventing cascading failure. The envelope includes retry timing and limit state for client-side rate-limit awareness.

## Core Concepts
- **HTTP 429 Too Many Requests**: Status for all rate-limit violations.
- **Retry-After Header**: Required; value is seconds (integer) until the next available request window.
- **Error Codes**: `SYSTEM.RATE_LIMITED` (global), `USER.AUTH_RATE_LIMITED` (login-specific), `API.RATE_LIMITED` (endpoint-specific).
- **Limit Context Detail**: `detail.limit` shows the quota, remaining, and reset timestamp so clients can self-regulate.
- **X-RateLimit Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` on all responses (not just 429) for proactive client throttling.

## Mental Models
Rate limiting is a traffic light. 429 is the red light; `Retry-After` tells you how long until it turns green. `X-RateLimit-Remaining` on every response is the countdown timer before the light turns red.

## Internal Mechanics
1. Laravel's `ThrottleRequests` middleware detects limit exceeded.
2. `ThrottleRequestsException` is thrown with headers containing retry info.
3. Handler catches, extracts headers, builds response.
4. Rate limit headers are attached to all responses via middleware, not just 429s.

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

## Patterns
- **Header-First**: The HTTP headers (`Retry-After`, `X-RateLimit-*`) are the canonical rate-limit communication channel; the body mirrors them for convenience.
- **Distinct Codes Per Limiter**: Login endpoint uses `USER.AUTH_RATE_LIMITED`; general API uses `SYSTEM.RATE_LIMITED`; specific endpoints use `API.RATE_LIMITED`.
- **Retry-After in Seconds**: Always integer seconds; never a date string.
- **Remaining Header on All Responses**: Attach `X-RateLimit-Remaining` to every successful and error response so clients never reach a 429 unexpectedly.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Retry-After format | Integer seconds | Simpler client parsing than HTTP-date |
| Rate limit headers | On all responses | Proactive client throttling |
| Error code distinction | Per-limiter codes | Enables client to show different messages |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Retry-After format | Seconds (integer) | HTTP-date | Seconds — easier for programmatic clients |
| Detail content | Only retry time | Full limit state | Full limit state — useful for dashboards |
| Code granularity | One code for all 429s | Per-endpoint codes | Per-limiter — balances utility and complexity |

## Performance Considerations
- Rate-limit check (cache hit) is O(1).
- 429 response generation is identical to any other error response.
- The cache backend (Redis/Memcached) adds sub-millisecond latency.

## Production Considerations
- Ensure `Retry-After` never exceeds a reasonable bound (default: max 3600 seconds).
- Monitor 429 rates: sustained high rates indicate misconfigured clients or DoS.
- Log rate-limit hits with user ID, IP, and endpoint for abuse analysis.
- Set up rate-limit alerts: P3 if individual user hit limit; P1 if many users simultaneously hit limit (potential DoS).
- Reset rate-limit counters on deploy to avoid immediate post-deploy throttling.

## Common Mistakes
- Missing the `Retry-After` header (mandatory per RFC 6585).
- Forgetting to include `X-RateLimit-Remaining` on success responses.
- Having different rate-limit header names per environment (breaks client parsing).
- Using the same limiter for login and general API (allows login brute force to block legitimate traffic).
- Applying rate limits after authentication (unauthenticated requests bypass limit).

## Failure Modes
- **Cascading Throttling**: A critical webhook endpoint hits rate limit, causing downstream system retries that amplify load. Mitigation: exclude webhooks from standard rate limits.
- **Cache Stampede**: Rate limit counter expires, and all requests check at once. Mitigation: use atomic increment (Redis INCR), not read-then-write.
- **Distributed Inconsistency**: Multiple app nodes have different rate-limit states. Mitigation: use a shared Redis backend.

## Ecosystem Usage
- **Laravel**: `ThrottleRequests` middleware uses cache for counters; throws `ThrottleRequestsException`.
- **GitHub API**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` on every response.
- **Twitter API**: 429 with `Retry-After` and `x-rate-limit-*` headers.
- **OpenAPI**: 429 response documented with rate-limit headers and detail schema.

## Related Knowledge Units
### Prerequisites
- KU-02 Standardized Error Envelope

### Related Topics
- Kubernetes horizontal pod autoscaling (rate limiting at LB level)
- Redis cache configuration for rate-limit storage

### Advanced Follow-up Topics
- Distributed rate limiting with sliding window counters and Lua scripts (Phase 4).

## Research Notes
### Source Analysis
RFC 6585 makes `Retry-After` mandatory for 429. GitHub API conventions for `X-RateLimit-*` headers are the de facto standard. Stripe uses a similar pattern with `x-request-id` for correlation.

### Key Insight
The most important principle of rate-limit errors is **proactive communication**. Clients that see `X-RateLimit-Remaining: 3` on every call can slow themselves down before hitting 429. A 429 should never be a surprise to a well-behaved client.

### Version-Specific Notes
- Laravel 10+ `ThrottleRequestsException` extends `TooManyRequestsHttpException` with full header access.
- Laravel 11+ rate limiter can be configured per endpoint in `AppServiceProvider`.
