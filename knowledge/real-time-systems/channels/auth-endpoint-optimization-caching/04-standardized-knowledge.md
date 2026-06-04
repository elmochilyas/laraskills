# Standardized Knowledge: Auth Endpoint Optimization & Caching

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Channel Types & Authorization |
| Knowledge Unit ID | K36 |
| Knowledge Unit | Auth Endpoint Optimization & Caching |
| Difficulty | Advanced |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

The `/broadcasting/auth` endpoint is a critical performance bottleneck in Laravel's broadcasting system, especially during reconnection storms when thousands of clients simultaneously request channel authorization. Each request requires user authentication and authorization callback execution. Without optimization, slow auth endpoints cascade into application-wide degradation. Key strategies include: caching authorization decisions, minimizing database queries in callbacks, using fast auth guards, implementing rate limiting, and distributing auth requests across queue workers.

## Core Concepts

Channel authorization is a synchronous HTTP request within the WebSocket subscription flow. Every private and presence channel subscription blocks on the auth response. If the auth endpoint is slow, the client sees delayed subscription confirmation. During reconnection storms, the auth endpoint receives a concentrated wave of requests that can overwhelm application servers, database, and queue systems.

The `BroadcastController::authenticate()` method resolves the authenticated user, extracts channel parameters, matches patterns, and invokes the callback. The entire process is synchronous within the HTTP request lifecycle.

## When To Use

- Applications with more than ~1000 concurrent WebSocket connections
- High-churn applications with frequent subscription/reconnection patterns
- Live event platforms where thousands of users join at scheduled times
- Mobile applications with unreliable network connectivity
- Any application using private or presence channels at scale

## When NOT To Use

- Small applications (<100 concurrent connections) where auth overhead is negligible
- Public-channel-only broadcasting (no auth endpoint calls)
- Development environments where caching adds unnecessary complexity

## Best Practices (WHY)

- **Cache auth decisions**: Use `Cache::remember("auth:channel:{$channel}:user:{$userId}", $ttl, fn() => ...)` to avoid repeated callback execution
- **Minimal callback logic**: Use simple ID comparisons; avoid database queries except where absolutely necessary
- **Fast guard resolution**: Token-based guards (Sanctum, JWT) are faster than session-based for stateless, cacheable auth
- **Rate limiting per guard**: Apply different rate limits for web session vs. API token auth requests
- **Pre-warm auth cache**: On application boot, warm common authorization decisions for known channel patterns

## Architecture Guidelines

- Auth is synchronous—it blocks the WebSocket subscription; optimize for latency
- The framework provides no caching layer for auth decisions; it's the developer's responsibility
- Authorization is checked once at subscription time, not per-event
- Cache invalidation is manual: permission changes don't take effect until cache expires or is invalidated
- Auth endpoint rate limiting protects the entire application infrastructure

## Performance Considerations

- Target auth endpoint response time: <50ms at P95 under load
- Database queries in auth callbacks are the primary bottleneck; each callback should execute at most 1 query
- Redis-based cache lookup adds ~1-3ms; database queries add 5-50ms depending on complexity
- During reconnection storms, auth endpoint throughput must match peak reconnect rate
- Cache stampede: simultaneous expiry of auth cache entries causes mass database queries

## Security Considerations

- Cached auth decisions may serve stale results if user permissions change between cache writes
- Rate limiting must handle legitimate reconnection traffic without false positives
- Cache keys must include user and channel identifiers to prevent cross-user auth bypass
- Auth endpoint should be rate-limited per IP and per user
- Monitor auth failure rates for security anomalies (brute-force attempts)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Multiple DB queries in callbacks | Complex authorization logic | Slow auth response under load | Cache auth decisions; use simple comparisons |
| No auth caching | Assuming framework handles it | Repeated database load on every subscription | Implement auth cache with appropriate TTL |
| Default throttle too low (60/min) | Not tuned for reconnection storms | Legitimate clients rate-limited during reconnection | Set higher limits for auth endpoint specifically |
| Not separating auth metrics from app metrics | Single monitoring dashboard | Auth performance issues hidden in app averages | Monitor auth endpoint latency separately (P50/P95/P99) |
| Cache stampede vulnerability | All cache entries expire simultaneously | Mass database queries during peak load | Use cache stampede prevention (locks, jittered TTL) |

## Anti-Patterns

- **No rate limiting on auth endpoint**: Leaves the application vulnerable to reconnection storm meltdown
- **Complex permission trees in callbacks**: Running multiple database queries and permission checks on every subscription
- **Generic auth endpoint middleware**: Applying the same rate limits to auth as to regular API routes
- **Eternal cache TTL**: Caching auth decisions indefinitely without invalidation mechanism

## Examples

```php
// Cached auth callback
Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return Cache::remember("auth:order:{$orderId}:user:{$user->id}", 300, function () use ($user, $orderId) {
        return $user->id === Order::find($orderId)?->user_id;
    });
});

// Rate-limited broadcast routes
Broadcast::routes([
    'middleware' => ['auth:sanctum', 'throttle:100,1'],
]);
```

## Related Topics

- K12: Channel Authorization (routes/channels.php)
- K15: Reconnection Strategies & Storm Mitigation
- K29: Private Channel Auth with JWT/Sanctum
- K14: Sticky Sessions & Load Balancing for WebSocket

## AI Agent Notes

- Auth endpoint optimization becomes critical above ~1000 concurrent connections
- The bubble.ro deep-dive (May 2026) identified auth endpoint overload as a primary failure mode during reconnection storms
- Redis-based caching provides the best balance of speed and invalidation flexibility
- For extreme scale, some teams implement a dedicated auth endpoint on separate infrastructure

## Verification

- [ ] Auth callback executes at most 1 database query
- [ ] Auth decisions are cached with appropriate TTL
- [ ] Rate limiting is applied to `/broadcasting/auth`
- [ ] Auth endpoint P95 latency is <50ms under load
- [ ] Cache stampede prevention is implemented
- [ ] Auth endpoint metrics are monitored separately from application metrics
- [ ] Auth cache can be invalidated when user permissions change
- [ ] Reconnection storm testing has been performed with realistic auth load
