# ECC Standardized Knowledge — Rate Limit Headers

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Rate Limit Headers |
| Difficulty | Intermediate |
| Category | Rate Limiting |
| Last Updated | 2026-06-02 |

## Overview

Rate limit headers communicate a client's current rate limit status via HTTP response headers, enabling clients to self-regulate request rates and implement intelligent backoff strategies. Without headers, clients cannot build intelligent retry logic, leading to "thundering herd" problems where all clients retry simultaneously after a 429.

## Core Concepts

- **`X-RateLimit-Limit`**: Maximum requests allowed in the current time window.
- **`X-RateLimit-Remaining`**: Requests remaining in the current window. Decrements with each request.
- **`X-RateLimit-Reset`**: Unix timestamp when the window resets and the counter returns to Limit.
- **`Retry-After`**: Sent with 429 responses. Seconds the client must wait before retrying.
- **`X-RateLimit-Tier`** (custom): Current auth tier (guest, user, premium) for transparency.
- **Window type**: Fixed window (counter resets at specific time) or sliding window (counter decays continuously).

## When To Use

- Every rate-limited endpoint (mandatory for production APIs)
- Public API endpoints consumed by external developers
- Endpoints with tiered rate limits (guests vs authenticated vs premium)
- Any endpoint where 429 responses are possible

## When NOT To Use

- Internal-only APIs not exposed to external consumers
- Health check and monitoring endpoints (should not be rate limited)
- Non-HTTP interfaces (queues, WebSockets)
- When headers are already set by a proxy/API gateway

## Best Practices

- **Consistency across all endpoints**: Every endpoint returns rate limit headers, not just those with explicit `throttle` middleware.
- **Expose via CORS**: Include `Access-Control-Expose-Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After`.
- **Absolute timestamp for Reset**: Unix epoch seconds, not relative offset. Enables accurate client-side scheduling.
- **`Retry-After` in 429 responses**: Always include with the exact seconds to wait.
- **Include tier in headers**: Custom `X-RateLimit-Tier` helps clients understand which limits apply.
- **Support both `X-RateLimit-*` and `RateLimit-*`** (RFC 9213) for forward compatibility.

## Architecture Guidelines

- Laravel's `ThrottleRequests` middleware automatically sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.
- For multi-bucket limits, Laravel sends headers for the most restrictive bucket. Use custom middleware for per-bucket transparency.
- NTP-sync all servers to ensure Reset values are consistent across instances.
- For Octane, use `ThrottleRequestsWithRedis` for Redis-optimized atomic operations.

## Performance Considerations

- Setting headers on an already-built response object has zero measurable cost.
- Calculating Reset is a single `time() + availableIn` call — negligible.
- Multi-bucket limits compute the minimum `availableIn` across buckets — O(n) for n buckets.

## Security Considerations

- Clock skew causes Reset timestamps in the past. Clamp to `time() + 1` minimum.
- Stripped by reverse proxies (Nginx, Cloudflare). Configure pass-through or use standard `RateLimit-*` headers.
- Headers reveal rate limit capacity. Acceptable for public APIs but consider hiding for internal APIs.

## Common Mistakes

- **Reset as relative offset**: Must be absolute Unix timestamp, not seconds remaining.
- **Wrong Limit value with multi-bucket**: Should be most restrictive limit, not the sum.
- **Headers not exposed via CORS**: Browser clients cannot read them — defeats client-side backoff.
- **Missing `X-RateLimit-Remaining: 0` in 429 responses**: Clients cannot see why they were blocked.
- **Integer overflow on 32-bit**: Timestamp after 2038-01-19. Ensure 64-bit PHP.

## Anti-Patterns

- **No Retry-After on 429**: Clients retry immediately, creating thundering herd cascades.
- **Inconsistent header presence**: Some endpoints return headers, others don't — clients cannot rely on the pattern.
- **Headers stripped by CDN without documentation**: Clients see missing headers and cannot implement backoff.

## Examples

- Laravel default: `throttle:api` middleware automatically adds X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
- Custom 429: `return response()->json([...], 429)->header('Retry-After', $seconds)->header('X-RateLimit-Limit', $limit)->header('X-RateLimit-Remaining', 0)`.

## Related Topics

- **Prerequisites**: HTTP response headers, rate limiter definition
- **Closely Related**: Rate Limiting by Auth Tier, Rate Limiter Definition, IP-Based Rate Limiting
- **Advanced**: RFC 9213, client-side rate limiting algorithms, Retry-After spec (RFC 7231)
- **Cross-Domain**: Laravel Core Application Engineering

## AI Agent Notes

When generating rate limit header code: always include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset on rate-limited routes, expose via CORS, include Retry-After on 429, use absolute Unix timestamps for Reset.

## Verification

Sources: Laravel `ThrottleRequests` middleware source, RFC 9213, GitHub/Stripe rate limit header documentation, domain-analysis.md.
