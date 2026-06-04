# ECC Standardized Knowledge — Rate Limiter Definition

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Authentication & Authorization |
| Knowledge Unit | Rate Limiter Definition |
| Difficulty | Intermediate |
| Category | Rate Limiting |
| Last Updated | 2026-06-02 |

## Overview

Laravel's `RateLimiter` facade provides a fluent API for defining rate limits via named limiters registered in service providers. Each definition specifies max attempts, time window, and consumer identifier. These named limiters are applied to routes via the `throttle` middleware. Proper definition is the foundation of API protection, ensuring fair usage and abuse prevention.

## Core Concepts

- **Named limiter**: A string identifier (`'api'`, `'login'`, `'exports'`) registered via `RateLimiter::for()`. Reusable across routes.
- **Limit instance**: Defines `maxAttempts`, `decaySeconds`, and `key` (consumer identifier).
- **Consumer key**: Identifies the consumer — IP, user ID, API key, or composite.
- **Decay window**: Seconds after which the attempt counter resets (60, 3600, 86400).
- **Multiple buckets**: Array of `Limit` instances for multiple windows (per-minute AND per-hour).
- **Atomic operations**: Uses cache INCR with TTL to prevent race conditions in concurrent requests.

## When To Use

- Every API endpoint that should be protected from abuse
- Login/authentication endpoints (low limits)
- Export/file generation endpoints (rate limit to prevent resource exhaustion)
- Webhook receivers (rate limit by source IP)
- Public-facing endpoints consumed by anonymous users

## When NOT To Use

- Internal service health checks and monitoring endpoints
- WebSocket connections (rate limiting handled at the transport level)
- Endpoints already protected by API Gateway rate limiting
- Development/local environments (unless testing rate limiting behavior)

## Best Practices

- **Named limiters over inline `throttle:60,1`**: Named limiters are reusable, testable, and maintainable.
- **Redis as cache backend**: File-based caching is unreliable for rate limiting (race conditions). Redis supports atomic INCR + EXPIRE.
- **Composite keys**: Include both the consumer identifier and limiter context to avoid collision: `login:'.$request->ip()` vs `api:'.$request->ip()`.
- **Multi-bucket for burst + sustain**: Define both per-minute and per-hour limits for comprehensive protection.
- **Key composition includes type prefix**: `user:`, `ip:`, `service:` prefixes prevent collisions across identifier types.

## Architecture Guidelines

- Define limiters in `AppServiceProvider::boot()` or a dedicated `RateLimiterServiceProvider`.
- Apply via `throttle:limiter-name` middleware on route groups.
- Rate limiting runs early in the middleware stack — before controllers, auth, and DB queries.
- For Octane + Redis, use `ThrottleRequestsWithRedis` for optimized atomic operations.

## Performance Considerations

- Redis INCR + EXPIRE is O(1) — handles 100K+ ops/second on modest hardware.
- Multi-bucket limits make N cache calls (N buckets). Use Redis pipelining for high throughput.
- Keys should auto-expire (TTL = decay window + 10% buffer) to prevent Redis memory exhaustion.
- Fixed window can allow 2X traffic at boundaries. For strict limits, implement sliding window with Redis sorted sets.

## Security Considerations

- Redis outage causes rate limiting to fail open (all requests pass). Implement circuit breaker or fail-closed fallback.
- Key collisions can cause cross-endpoint rate limiting. Include endpoint prefix in keys.
- `perMinute(0)` blocks all requests — use only for intentional blocking. Use `PHP_INT_MAX` for effectively unlimited.
- Cache stampede at window reset: all clients hit boundary simultaneously. Use sliding window or staggered TTLs.

## Common Mistakes

- **`perMinute(0)` blocks all**: Use `PHP_INT_MAX` for unlimited, not 0.
- **Missing consumer key**: Defaults to endpoint URL, incorrectly grouping all consumers.
- **Mutable Limit instances**: Return a new instance each time; reusing causes state leaks.
- **`decaySeconds` too low** (e.g., 1 second): Clock skew causes premature rate limiting.
- **Defining limiters inside route closures**: Every request re-registers. Always use service provider boot method.
- **Not testing rate limiters**: Rate limit state persists between tests. Use `RateLimiter::clear()` to reset.

## Anti-Patterns

- **Inline `throttle:60,1` everywhere**: Inconsistent limits, harder to test, not reusable.
- **File-based cache for rate limiting**: Race conditions under concurrent requests produce inaccurate counts.
- **Same limit for all endpoints**: Login needs 5/min, data endpoint needs 60/min, exports need 1/min.
- **Rate limit check after resource-intensive operations**: Reject early, before expensive processing.

## Examples

- Per-IP guest: `RateLimiter::for('guest', fn($request) => Limit::perMinute(30)->by($request->ip()))`.
- Multi-bucket: `RateLimiter::for('api', fn($request) => [Limit::perMinute(60), Limit::perHour(1000)])`.
- Login with IP+email: `Limit::perMinute(5)->by($request->ip().'|'.$request->input('email'))`.

## Related Topics

- **Prerequisites**: Laravel Cache system, Redis fundamentals
- **Closely Related**: Rate Limiting by Auth Tier, Rate Limit Headers, IP-Based Rate Limiting
- **Advanced**: Sliding window rate limiting with Lua, token bucket algorithm, distributed rate limiting
- **Cross-Domain**: Data & Storage Systems (Redis configuration)

## AI Agent Notes

When generating rate limiter definitions: use named limiters in service providers, always include consumer keys with type prefixes, prefer Redis cache driver, use multi-bucket for comprehensive protection, and register via `RateLimiter::for()` in boot method.

## Verification

Sources: `Illuminate\Cache\RateLimiter`, `ThrottleRequests` middleware, `Limit` class source, domain-analysis.md.
