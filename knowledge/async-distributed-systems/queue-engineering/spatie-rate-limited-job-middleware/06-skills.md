# Skill: Apply Conditional Rate Limiting with Spatie Middleware

## Purpose
Use the Spatie `laravel-rate-limited-job-middleware` package to apply per-instance conditional rate limiting with explicit configuration syntax.

## When To Use
When you need per-instance conditional rate limiting (premium users get higher limits); when the Spatie `RateLimited::allowed(10)->everySeconds(30)` syntax is preferred; when multiple rate limit configurations per job class are needed.

## When NOT To Use
Simple uniform rate limiting (use Laravel's built-in); projects minimizing package dependencies; when rate limiting logic is complex enough for a custom implementation.

## Prerequisites
- `spatie/laravel-rate-limited-job-middleware` package installed
- Cache driver with atomic increment support (Redis/Memcached)
- Rate limiter named definition (optional)

## Inputs
- Allowed calls per time window
- Time interval (seconds, minutes, hours, days)
- Conditional `when()` callback
- Release delay strategy

## Workflow
1. Install: `composer require spatie/laravel-rate-limited-job-middleware`
2. Import: `use Spatie\RateLimitedMiddleware\RateLimited;`
3. In job's `middleware()`: return `RateLimited::allowed(10)->everySeconds(60)`
4. Add `->when(fn($job) => $job->shouldRateLimit())` for conditional application
5. Add `->releaseAfterBackoff()` or `->releaseAfterSeconds(N)` for release behavior
6. Unit test the `when()` callback to verify it returns correct boolean
7. Do NOT mix with Laravel's built-in `RateLimited` on the same job

## Validation Checklist
- [ ] Spatie middleware added via `middleware()` method
- [ ] `when()` callback unit tested
- [ ] Not mixing Spatie and Laravel rate limiters on same job
- [ ] Package updated after Laravel version upgrades
- [ ] Release behavior configured (backoff or fixed seconds)

## Common Failures
- Using both Spatie and Laravel limiters on same job — two independent counters
- Not testing `when()` callback — rate limiting silently bypassed if always returns false
- `releaseAfterBackoff()` with null release time — release delay = 0 → tight loop

## Decision Points
- Simple uniform: use Laravel's built-in `RateLimited`
- Conditional per-instance: use Spatie's `RateLimited` with `when()`

## Performance Considerations
- Same underlying RateLimiter facade — identical cache overhead
- Conditional `when()` check adds negligible overhead

## Related Rules
- Rule 1: test-when-callback
- Rule 2: dont-mix-spatie-and-builtin
- Rule 3: update-spatie-package-after-laravel-upgrade

## Related Skills
- Add RateLimited Middleware to Jobs
- Build Custom Rate Limiting with the RateLimiter Facade

## Success Criteria
Rate limiting applies conditionally per job instance, uses clean Spatie syntax, and doesn't conflict with other rate limiters on the same job.
