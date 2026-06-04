# Skill: Implement Named Rate Limiters for API Routes

## Purpose

Define named rate limiters via `RateLimiter::for()` in a service provider and apply them to route groups via the `throttle` middleware, providing reusable, centrally configurable rate limiting that prevents API abuse without duplicating configuration.

## When To Use

- API endpoints exposed to external consumers
- Authentication routes to prevent brute force
- Webhook endpoints to control processing rate
- Public forms to prevent spam submissions
- Any route that needs request throttling

## When NOT To Use

- Internal-only routes behind VPN or firewall
- Routes with their own rate limiting logic (avoid double limiting)
- Real-time features where rate limiting would break functionality
- Development-only routes

## Prerequisites

- Cache driver configured for production (Redis recommended)
- Service provider (AppServiceProvider or dedicated provider)
- Understanding of the `throttle` middleware

## Inputs

- Limiter name (string identifier)
- Max attempts per time window
- Time window (perMinute, perSecond, perDay, or custom)
- Rate limit key strategy (by user ID, IP, or combination)

## Workflow

1. Open the service provider's `boot()` method
2. Call `RateLimiter::for('name', fn($job) => ...)` to define the limiter
3. Use `Limit::perMinute($max)` or equivalent to set the attempt window
4. Set the rate limit key via `->by($job->user?->id ?: $job->ip)` to segment by auth status
5. Apply the limiter to routes: `Route::middleware('throttle:name')->group(...)`
6. Test that the limit is enforced: exceed the limit and verify 429 response
7. Verify `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` headers are present
8. Configure different limits for different endpoint categories (auth endpoints stricter than general API)

## Validation Checklist

- [ ] Named limiter registered via `RateLimiter::for()` — not inline `throttle:60,1`
- [ ] Rate limit key segments by authentication status (`$job->user?->id ?: $job->ip`)
- [ ] Limiter registered in service provider `boot()` — not in route files
- [ ] Redis configured as cache driver for production
- [ ] 429 response includes standard rate limit headers
- [ ] Different limits defined for different endpoint categories
- [ ] Rate limiting is NOT duplicated in controller business logic

## Common Failures

### Not segmenting rate limits
Using the same limit for authenticated and guest users penalizes authenticated users behind NAT or gives guests excessive limits. Always segment by authentication status.

### Forgetting rate limiter registration
Applying `throttle:api` without registering the `api` limiter causes `RuntimeException`. Always register limiters before applying them.

### Using inline limits for complex scenarios
`throttle:60,1` cannot segment by user/IP. Use named limiters for all production routes.

## Decision Points

### Named vs Inline Limiters?
Named limiters for all production routes — they support segmentation, are reusable, and centrally configurable. Inline limits only for temporary development routes.

### perMinute vs perSecond vs perDay?
perMinute for general API endpoints. perSecond for burst-sensitive endpoints. perDay for daily quota limits.

## Performance Considerations

- Each throttled request performs one cache read + one cache write (~1-5ms with Redis)
- File cache is NOT suitable for rate limiting (not atomic under concurrent access)
- Redis provides atomic increment operations essential for accurate counting

## Security Considerations

- Rate limiting state is stored in cache — use a dedicated prefix if cache is shared across applications
- In multi-server deployments, Redis ensures consistent state across all servers
- Rate limiting does NOT replace authentication or authorization
- Authentication endpoints (login) need stricter limits (~5/min) than general API (~100/min)

## Related Rules

- Define Named Limiters Instead of Inline Limits
- Segment by Authentication Status
- Register Limiters Before Route Dispatch
- Use Redis for Production Rate Limiting
- Do Not Implement Rate Limiting in Business Logic

## Related Skills

- Configure Segmented Rate Limiting by Authentication Status
- Organize Routes with Route Groups
- Define Application Routes

## Success Criteria

- Named limiters centrally defined in a service provider
- Authenticated users limited by user ID; guests by IP
- 429 responses returned with correct headers when limit exceeded
- Different endpoints have appropriately different limits
- Redis used for production rate limiting

---

# Skill: Configure Segmented Rate Limiting by Authentication Status

## Purpose

Design rate limit keys that differentiate authenticated users from guest visitors, ensuring fair limits for both groups — authenticated users are tracked by user ID (consistent across IPs) and guests by IP address.

## When To Use

- All API routes accessible by both authenticated and guest users
- Applications behind NAT where multiple authenticated users share an IP
- APIs requiring different rate limits for authenticated vs unauthenticated traffic

## When NOT To Use

- Authentication-only endpoints (login) where there is no authenticated user yet — key by IP only
- Internal services where all requests are authenticated
- Routes where authentication status is irrelevant to the limit

## Prerequisites

- Named rate limiter registered via `RateLimiter::for()`
- Authentication system configured (guards, middleware)

## Inputs

- Limiter name
- Max attempts for authenticated users
- Max attempts for guest users
- Time window

## Workflow

1. In the `RateLimiter::for()` callback, access `$job->user` to check authentication status
2. Use `$job->user?->id ?: $job->ip` as the rate limit key
3. Optionally return different `Limit::perMinute()` values based on auth status: `$job->user ? Limit::perMinute(200) : Limit::perMinute(20)`
4. Apply the limiter via `throttle:name` middleware to the relevant route group
5. Test authenticated requests — verify they are tracked by user ID (same user, different IPs share the limit)
6. Test guest requests — verify they are tracked by IP

## Validation Checklist

- [ ] Authenticated users keyed by `$job->user->id`
- [ ] Guest users keyed by `$job->ip`
- [ ] Authenticated limits are higher than guest limits
- [ ] Login/register endpoints key by IP only (no authenticated user)
- [ ] Rate limit headers show correct remaining count per user/IP
- [ ] Users behind NAT are not penalized (authenticated users have individual limits)

## Common Failures

### Keying all users by IP
Authenticated users behind NAT share one IP and get unfairly limited. Always use `$job->user?->id ?: $job->ip`.

### Keying all users by user ID
Guest users have no user ID and would share a null key, causing global limits. Always fall back to IP for guests.

## Decision Points

### Same limit vs different limits by auth status?
Use different limits: higher for authenticated users (proven identity), lower for guests (potential abuse).

## Performance Considerations

Same as standard named limiters — one cache read + write per throttled request. The key segmentation adds no overhead.

## Security Considerations

- Authentication-only limiters (login) should key by IP since there is no authenticated user
- Authenticated session limits protect against brute-force via stolen credentials
- Guest limits protect against anonymous abuse and DoS

## Related Rules

- Segment by Authentication Status
- Define Named Limiters Instead of Inline Limits
- Register Limiters Before Route Dispatch

## Related Skills

- Implement Named Rate Limiters for API Routes
- Organize Routes with Route Groups
- Define Application Routes

## Success Criteria

- Authenticated users have individual rate limit counters not affected by other users on the same IP
- Guest users are limited by IP with lower thresholds
- Login/register endpoints are limited by IP only
- Rate limit headers accurately reflect remaining attempts for each user/IP
