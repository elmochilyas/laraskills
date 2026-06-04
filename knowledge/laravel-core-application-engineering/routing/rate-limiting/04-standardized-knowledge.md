# ECC Standardized Knowledge — Rate Limiting

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Rate Limiting |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Laravel's rate limiting system (`RateLimiter::for()`) provides a configurable API for defining rate limiters and applying them to routes via the `throttle` middleware. Rate limiters define how many requests a specific "key" (typically user ID + IP) can make within a time window. The system supports multiple limiters per application, segmented limiting (by IP, user, or custom criteria), and configurable response behavior.

Rate limiting is the primary defense against API abuse, brute-force attacks, and unintentional traffic spikes. It operates at the routing level, not the application level, meaning throttled requests never reach controller logic.

---

## Core Concepts

### RateLimiter::for()
Defines a named limiter in `App\Providers\AppServiceProvider::boot()`:
```php
RateLimiter::for('api', fn ($job) => Limit::perMinute(60)->by($job->user?->id ?: $job->ip));
```

### Limit Classes
- `Limit::perMinute($maxAttempts)` — resets every 60 seconds
- `Limit::perSecond($maxAttempts)` — resets every second
- `Limit::perDay($maxAttempts)` — resets daily
- Custom limits via `Limit::allow($maxAttempts)->every($seconds)`

### by() Method
Specifies the rate limit key — the unique identifier for counting requests. Common keys: user ID, IP address, combination of both.

### throttle Middleware
Applied to routes or groups: `Route::middleware('throttle:api')` or `Route::middleware('throttle:10,1')`.

### Response Behavior
When a limit is exceeded, a `429 Too Many Requests` response is returned with headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.

---

## When To Use

- API endpoints to prevent abuse
- Authentication routes to prevent brute force
- Webhook endpoints to control processing rate
- Public forms to prevent spam submissions
- Any route exposed to external consumers

---

## When NOT To Use

- Internal-only routes behind VPN or firewall
- Routes with their own rate limiting logic (avoid double limiting)
- Real-time features where rate limiting would break functionality

---

## Best Practices

### Define Named Limiters Over Inline Limits
Define limiters via `RateLimiter::for()` instead of inline `throttle:60,1` strings.

**Why:** Named limiters are reusable across routes, centrally configurable, and support complex segmentation logic. Inline limits are duplicated and hard to audit.

### Segment by User and IP
Use `$job->user?->id ?: $job->ip` as the key to distinguish authenticated vs guest users.

**Why:** Authenticated users should be limited by their user ID (consistent across IPs). Guests should be limited by IP. Combining both prevents IP-based limits from affecting all users behind a NAT.

### Use Multiple Limits for Different Endpoints
Define different limits for different route groups (e.g., 60/min for general API, 5/min for auth endpoints).

**Why:** Different endpoints have different abuse profiles. Authentication endpoints need stricter limits. Data retrieval endpoints can have higher limits.

### Return Appropriate Rate Limit Headers
The default 429 response includes rate limit headers. Don't override this behavior without preserving the headers.

**Why:** Rate limit headers allow clients to implement backoff strategies. Without them, clients can't programmatically respect limits.

---

## Architecture Guidelines

### Named Limiter Definition
```php
// In AppServiceProvider::boot()
RateLimiter::for('api', function (object $job) {
    return Limit::perMinute(100)->by($job->user?->id ?: $job->ip);
});
```

### Application on Routes
```php
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('users', UserController::class);
});
```

### Inline Limiter
```php
Route::middleware('throttle:10,1')->post('/login', [AuthController::class, 'login']);
```

---

## Performance Considerations

Rate limiting uses cache (default: Redis) to store attempt counts. Each throttled request performs at least one cache read + one cache write. Redis-based rate limiting adds ~1-5ms per request under normal load. Cache driver choice affects performance — file cache is not suitable for rate limiting under concurrent access.

---

## Security Considerations

### Cache Store Security
Rate limiting state is stored in the cache. If the cache is shared across applications, rate limits may interact between apps. Use a dedicated cache prefix or separate cache store.

### Distributed Rate Limiting
In multi-server deployments, ensure the cache driver supports atomic operations with proper concurrency handling. Redis is recommended for distributed rate limiting.

### Authenticated vs Guest Limits
Authenticated requests should have higher limits than guest requests. Always segment the rate limit key by authentication status.

---

## Common Mistakes

### Not Segmenting Rate Limits
Desc: Using the same limit for authenticated and guest users.
Cause: Not customizing the `by()` method.
Consequence: Authenticated users get the same low limit as guests, or guests get the same high limit as authenticated users.
Better: Segment by authentication status.

### Using Inline Limits for Complex Scenarios
Desc: `throttle:60,1` for all routes without named limiters.
Cause: Convenience — inline is simpler.
Consequence: Cannot customize key segmentation; limits are duplicated across routes.
Better: Define named limiters for segmented or complex limits.

### Forgetting Rate Limiter Registration
Desc: Applying `throttle:api` without registering the `api` limiter.
Cause: Not adding `RateLimiter::for('api', ...)` in the service provider.
Consequence: RuntimeException at route dispatch — unregistered limiter.
Better: Always register limiters before applying them.

---

## Anti-Patterns

### Rate Limiting in Business Logic
Implementing rate limiting logic inside controllers or services instead of using the routing-level throttle middleware. Rate limiting is a cross-cutting concern that belongs at the HTTP boundary.

### Extremely Low Limits
Setting limits so low that legitimate users are frequently blocked. Test limits under expected peak load and provide clear error messages when limits are exceeded.

---

## Examples

### Segmented API Limiter
```php
RateLimiter::for('api', function (object $job) {
    return Limit::perMinute(100)->by($job->user?->id ?: $job->ip);
});

RateLimiter::for('auth', function (object $job) {
    return Limit::perMinute(5)->by($job->ip);
});
```

### Route Limiter Application
```php
Route::middleware('throttle:api')->group(function () {
    Route::apiResource('posts', PostController::class);
});

Route::middleware('throttle:auth')->post('/login', [AuthController::class, 'login']);
```

---

## Related Topics

### Prerequisites
- **Route Groups** — Applying throttle middleware to groups
- **Service Provider Strategies** — Registering rate limiters

### Closely Related
- **Middleware** — The throttle middleware implementation
- **Route Definition** — Middleware application on routes

### Cross-Domain
- **Security & Identity Engineering** — Brute-force protection patterns

---

## AI Agent Notes

### Important Decisions
- Rate limiters are registered in `AppServiceProvider::boot()` via `RateLimiter::for()`
- The `throttle` middleware accepts either a named limiter or inline `attempts,minutes`
- Rate limiting state is stored in the cache driver — Redis is recommended for production
- The `by()` method determines the rate limit key (user ID, IP, or combination)

### Important Constraints
- Rate limiters must be registered before routes are dispatched
- The cache driver must support atomic operations for accurate counting
- Rate limiting does NOT replace authentication or authorization

### Rules Generation Hints
- Enforce named limiters over inline limits for all production routes
- Enforce segmentation by authentication status in limiter keys

---

## Verification

This document has been validated against:
- `Illuminate\Cache\RateLimiter` — rate limiting cache interaction
- `Illuminate\Routing\Middleware\ThrottleRequests` — throttle middleware
- `Illuminate\Routing\Router::middleware()` — throttle middleware application
