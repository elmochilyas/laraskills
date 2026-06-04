# Spatie `laravel-rate-limited-job-middleware` Package — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Job Middleware
- **Knowledge Unit:** K053 — Spatie `laravel-rate-limited-job-middleware` Package
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Package installed: `composer require spatie/laravel-rate-limited-job-middleware`
- [ ] Familiar with Laravel's built-in `RateLimited` middleware
- [ ] Know the difference between proactive and reactive rate limiting

## Implementation Checklist
- [ ] Use `RateLimited::allowed(N)->everySeconds(N)` or `->times(N)->everySeconds(N)` syntax
- [ ] Apply conditional rate limiting with `->when(fn($job) => ...)` callback
- [ ] Set release behavior: `releaseAfterBackoff()` or `releaseAfterSeconds()`
- [ ] Use appropriate interval: `everySeconds()`, `everyMinutes()`, `everyHour()`, `everyDay()`
- [ ] Return middleware instance from job's `middleware()` method in array

## Verification Checklist
- [ ] `when()` callback correctly identifies which jobs should be rate-limited
- [ ] Rate limit counter works as expected under load
- [ ] Release delay is appropriate (no tight retry loop)
- [ ] Tests confirm `when()` callback doesn't silently disable rate limiting
- [ ] Not using both Spatie and Laravel built-in rate limiters on same job

## Security Checklist
- [ ] Conditional `when()` callback doesn't expose internal logic
- [ ] Rate limit keys don't leak sensitive data

## Performance Checklist
- [ ] Same underlying `RateLimiter` facade overhead as Laravel's built-in
- [ ] Conditional `when()` check adds negligible overhead
- [ ] No additional Redis connections beyond the built-in rate limiter

## Production Readiness Checklist
- [ ] Package version tested with current Laravel version
- [ ] `when()` callback has unit tests
- [ ] Fallback release delay configured if `releaseAfterBackoff()` returns null
- [ ] Dependency update schedule accounts for Spatie package releases

## Common Mistakes to Avoid
- [ ] Using both Spatie and Laravel limiters on same job (independent counters)
- [ ] Not testing `when()` callback (rate limiting silently bypassed)
- [ ] `releaseAfterBackoff()` with null release time (creates tight retry loop)
