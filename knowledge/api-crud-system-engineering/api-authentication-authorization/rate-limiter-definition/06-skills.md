# Skill: Implement Rate Limiter Definitions

## Purpose
Define rate limiters in `App\Http\Kernel` or `RouteServiceProvider` with named configurations per endpoint and auth tier, using Redis for distributed limits and proper decay intervals.

## When To Use
- All API endpoints that need protection
- Different tiers (guest, authenticated, premium) with different limits
- Endpoint-specific rate limiting

## When NOT To Use
- Non-API routes (web, CLI)
- Internal-only services with trusted consumers

## Prerequisites
- Laravel RateLimiter facade
- Cache driver configuration (Redis recommended)

## Inputs
- Rate limits per endpoint and auth tier
- Decay intervals per configuration

## Workflow
1. Define named rate limiters in `App\Providers\RouteServiceProvider::configureRateLimiting()`
2. Use `RateLimiter::for('api', fn (Request $request) => Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()))`
3. Set different limits per auth tier: `Limit::perMinute(100)->by('user:'.$request->user()->id)` for authenticated
4. Set per-endpoint limiters: `RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)->by($request->ip()))`
5. Apply limiters to routes: `Route::middleware(['throttle:login'])->group(...)`
6. Always specify `by()` with unique identifier — never use global counter
7. Use Redis for distributed rate limiting — file/database cache not atomic
8. Configure exponential backoff decay intervals: `perMinute(60)`, `perHour(1000)`
9. Respond with 429 Too Many Requests and `Retry-After` header
10. Log rate limit hits for abuse detection analysis

## Validation Checklist
- [ ] Rate limiters defined in `configureRateLimiting()`
- [ ] Different limits per auth tier (guest, authenticated, premium)
- [ ] `by()` uses unique identifier per consumer
- [ ] Per-endpoint limiters for sensitive operations
- [ ] Redis cache driver for distributed rate limiting
- [ ] Decay intervals configured per limiter
- [ ] 429 response with `Retry-After` header
- [ ] Rate limit hits logged for abuse detection
- [ ] Limiters applied to route groups via `throttle:` middleware
- [ ] Tests verify rate limit enforcement

## Common Failures
- No `by()` on limiter — global limit counter, first consumer exhausts limit for all
- File/database cache for rate limiting — not atomic under concurrent requests
- Guest and authenticated sharing same limiter — authenticated users shouldn't be limited by guest pool
- One limiter for all endpoints — login attempts shouldn't share limit with data fetches
- No `Retry-After` header — client doesn't know when to retry
- Rate limit not tested — silently not enforced

## Decision Points
- Per-minute vs per-second vs per-hour — per-minute for general, per-second for burst control
- Identifier strategy — IP for guests, user ID for authenticated, API key for services
- Redis vs database — Redis for production distributed, database for single-server dev

## Performance Considerations
- Redis atomic operations add ~0.1ms per rate check
- Limiter key expiration handled by Redis TTL — no cleanup needed
- `throttle:api` on every request adds measurable but acceptable overhead (<0.5ms)
- Consider caching limiter config for repeated bucket lookups

## Security Considerations
- Rate limiting is primary DoS mitigation — never skip on public endpoints
- Guest and authenticated limiters separate — prevents IP-based attacks from affecting authenticated users
- Sensitive endpoints (login, password reset) need stricter limits
- Log rate limit events for security incident response
- Consider using `X-Forwarded-For` for IP detection behind load balancers

## Related Rules
- Use RateLimiter::for() For Named Configurations
- Always Specify by() With Unique Consumer Identifier
- Define Different Limits Per Auth Tier
- Use Redis For Distributed Rate Limiting
- Apply Per-Endpoint Limiters For Sensitive Operations
- Log Rate Limit Exceeded Events

## Related Skills
- Rate Limit Headers — for header response
- IP-based Rate Limiting — for IP-specific patterns
- Rate Limiting by Auth Tier — for tier design
- Abuse Detection — for monitoring rate limit events

## Success Criteria
- All API endpoints have rate limiters assigned
- Guest and authenticated users have separate limit pools
- Sensitive endpoints (login, register) have stricter limits
- Redis provides atomic, distributed rate counting
- 429 responses include `Retry-After` header
- Rate limit events logged for analysis
