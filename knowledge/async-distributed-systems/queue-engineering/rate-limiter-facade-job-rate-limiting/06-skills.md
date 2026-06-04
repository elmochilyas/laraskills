# Skill: Build Custom Rate Limiting with the RateLimiter Facade

## Purpose
Use the `RateLimiter` facade to implement custom rate limiting logic in job middleware, handling counter race conditions and proper reset on success.

## When To Use
When building custom job middleware for rate limiting; when you need fine-grained control beyond `RateLimited` middleware; when checking rate limits before dispatching jobs.

## When NOT To Use
Standard rate limiting scenarios — use the built-in `RateLimited` middleware instead; reactive backpressure — use `ThrottlesExceptions` middleware instead.

## Prerequisites
- Cache driver with atomic increment support (Redis or Memcached)
- Understanding of rate limiting concepts (window, attempts, TTL)

## Inputs
- Rate limit key (e.g., `api:{job->apiKey}`)
- Max attempts per window
- Window duration (seconds)
- Rate limiter name (for named limiters)

## Workflow
1. Define a named limiter in `AppServiceProvider`: `RateLimiter::for('api', fn($job) => Limit::perMinute(60)->by($job->apiKey))`
2. In custom middleware, call `RateLimiter::attempt()` for atomic check + increment
3. If rate limited: call `$job->release(RateLimiter::availableIn($key))` and return (skip `$next`)
4. On success in throttle middleware: call `RateLimiter::clear()` to reset counter
5. For custom counter inspection: use `hit()` + `tooManyAttempts()` separately

## Validation Checklist
- [ ] Cache driver supports atomic increment (Redis/Memcached, not file/array)
- [ ] `RateLimiter::attempt()` used for atomic check-increment
- [ ] `RateLimiter::clear()` called on success in throttle implementations
- [ ] Named limiters registered via `RateLimiter::for()` for reuse
- [ ] Rate limit key is properly scoped (per-entity, not global)
- [ ] Job releases with correct delay when rate limited

## Common Failures
- Using with `file` or `array` cache — no atomic increment, race conditions
- Not checking `attempt()` return value — callback runs even when rate limited
- Not clearing counter on success in throttle — counter accumulates over time

## Decision Points
- Simple window: use `RateLimiter::attempt()`
- Need counter value: use `hit()` + `tooManyAttempts()` separately
- Reusable across middleware + HTTP: use `RateLimiter::for()` named limiter

## Performance Considerations
- Each `hit()` is a cache increment + TTL set: ~1-3ms
- Redis handles 100K+ INCREMENT ops/sec — not a bottleneck

## Security Considerations
- Rate limiting prevents abuse of external API calls from jobs
- Cache key collisions could allow bypass — scope keys properly

## Related Rules
- Rule 1: prefer-attempt-for-simple-windows
- Rule 2: clear-counter-on-throttle-success
- Rule 3: use-named-limiters-for-configuration
- Rule 4: use-cache-with-atomic-increment

## Related Skills
- Add RateLimited Middleware to Jobs
- Create Custom Job Middleware

## Success Criteria
Custom rate limiting middleware correctly limits job throughput, uses atomic operations, resets on success in throttle scenarios, and centrally defines limits via named limiters.
