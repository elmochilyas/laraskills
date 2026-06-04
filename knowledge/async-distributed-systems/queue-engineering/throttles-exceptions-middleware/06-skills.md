# Skill: Back Off Job Execution After Repeated Failures with ThrottlesExceptions

## Purpose
Use `ThrottlesExceptions` middleware to reactively back off job execution when repeated exceptions occur within a time window, preventing tight retry loops on unstable downstream services.

## When To Use
Jobs making downstream API calls where failure indicates transient issues (500s, timeouts); when you want gradual backoff after failure bursts without permanent job failure.

## When NOT To Use
Jobs with deterministic failures (validation errors, logic errors) — fix the bug; when you want permanent failure after N exceptions — use `$maxExceptions` instead; jobs that handle their own retry logic internally.

## Prerequisites
- Cache driver with atomic increment (Redis/Memcached)
- Understanding of downstream service recovery time

## Inputs
- Max exceptions per window (threshold)
- Window duration (decay minutes)
- Exception-specific backoff durations

## Workflow
1. Import: `use Illuminate\Queue\Middleware\ThrottlesExceptions;`
2. Add to `middleware()`: `return [(new ThrottlesExceptions(5, 10))]` (5 exceptions per 10 minutes)
3. Add `->backoff(fn($e) => ...)` for exception-specific release delays
4. Set `decayMinutes` longer than downstream service's typical recovery time
5. Apply `RateLimited` before `ThrottlesExceptions` in middleware array (proactive first, reactive second)
6. Success clears the counter automatically

## Validation Checklist
- [ ] Threshold set based on observed failure rates (not arbitrary)
- [ ] `decayMinutes` > downstream service recovery time
- [ ] `backoff` callback provides exception-specific release delays
- [ ] `RateLimited` applied before `ThrottlesExceptions` in middleware order
- [ ] Not confusing with `$maxExceptions` (permanent failure vs temporary backoff)

## Common Failures
- Too-low threshold (e.g., 2 in 1 min) — job constantly backs off on flaky services
- Not using `backoff` callback — 429 gets same backoff as 503
- Confusing with `$maxExceptions` — throttling when you meant to fail permanently
- `decayMinutes` too short — job released while service still down

## Decision Points
- Transient downstream failures: use ThrottlesExceptions
- Permanent logic failures: use $maxExceptions
- Both proactively limit + reactively backoff: use RateLimited + ThrottlesExceptions

## Performance Considerations
- Exception counting via `RateLimiter::hit()` adds cache write per exception (~1-3ms)
- Job released via throttle doesn't consume a retry attempt
- Minimal overhead on happy path (no exception)

## Related Rules
- Rule 1: decay-exceeds-recovery-time
- Rule 2: use-backoff-callback-for-exception-types
- Rule 3: rate-limited-before-throttles-exceptions

## Related Skills
- Add RateLimited Middleware to Jobs
- Build Custom Rate Limiting with the RateLimiter Facade

## Success Criteria
After a burst of exceptions, jobs back off until the window resets, exception-specific delays are applied, and the counter resets on success — preventing false throttling after recovery.
