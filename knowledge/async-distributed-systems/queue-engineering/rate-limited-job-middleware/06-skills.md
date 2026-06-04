# Skill: Add RateLimited Middleware to Jobs

## Purpose
Apply `RateLimited` middleware to jobs that call rate-limited external APIs, proactively preventing execution when the rate limit is reached.

## When To Use
Jobs that call external APIs with documented rate limits; when proactive rate limiting is needed (before execution); per-resource rate limiting (different API keys, different limits).

## When NOT To Use
Reactive backpressure — use `ThrottlesExceptions` instead (detects failures, not prevents execution); jobs that don't call rate-limited external resources.

## Prerequisites
- Rate limiter defined via `RateLimiter::for()` in `AppServiceProvider`
- Cache driver with atomic increment (Redis/Memcached)
- Understanding of target API's rate limit parameters

## Inputs
- Rate limiter name from `RateLimiter::for()` definition
- Per-resource key callback (e.g., by API key, by user)
- List of job properties used for key scoping

## Workflow
1. Define named limiter in `AppServiceProvider::boot()`: `RateLimiter::for('api-requests', fn($job) => Limit::perMinute(60)->by($job->apiKey))`
2. Import: `use Illuminate\Queue\Middleware\RateLimited;`
3. In job's `middleware()`: `return [(new RateLimited('api-requests'))->key(fn($j) => $j->apiKey)]`
4. For Redis: prefer `RateLimitedWithRedis` for lower overhead
5. Don't override the default release delay (matches window reset time)
6. Set `decayMinutes` to match external API's reset period

## Validation Checklist
- [ ] Rate limit key scoped per resource with `->key()` callback
- [ ] `decayMinutes` matches external API's reset period
- [ ] `RateLimitedWithRedis` used instead of `RateLimited` when on Redis
- [ ] Default release delay not overridden
- [ ] Named limiter defined centrally via `RateLimiter::for()`

## Common Failures
- Not scoping keys — one user's API calls exhaust limit for all users
- Window shorter than max job time — counter resets mid-execution
- Confusing `RateLimited` with `ThrottlesExceptions` — proactive vs reactive
- Overriding default release delay — tight retry loop

## Decision Points
- Redis backend: use `RateLimitedWithRedis`
- Non-Redis: use generic `RateLimited`
- Per-resource scope: use `->key(fn($j) => $j->resourceKey)`

## Performance Considerations
- Each check adds ~1-5ms (cache read + increment)
- High key cardinality creates many cache keys
- Rate-limited jobs may spend 90% of time waiting for window reset

## Related Rules
- Rule 1: scope-rate-limit-keys-per-resource
- Rule 2: match-decay-to-api-reset
- Rule 3: prefer-rate-limited-with-redis
- Rule 4: dont-override-release-delay

## Related Skills
- Back Off Job Execution After Repeated Failures with ThrottlesExceptions
- Build Custom Rate Limiting with the RateLimiter Facade

## Success Criteria
Jobs are proactively prevented from executing when the rate limit for their resource is exhausted, they release with correct delay until window reset, and per-resource scoping prevents cross-resource starvation.
