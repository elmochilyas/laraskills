# Skill: Implement Deadline-Based Job Retry with retryUntil

## Purpose
Implement `retryUntil()` on queue jobs to provide dynamic, deadline-based retry logic that aligns with business time windows rather than arbitrary attempt counts.

## When To Use
When job retry decisions depend on time (business hours, payment windows, SLA deadlines, webhook timeouts); when you need the job to stop retrying after a specific cutoff time regardless of how many attempts have been made.

## When NOT To Use
When retry logic depends solely on attempt count (use `$tries`); when failures are always transient and 3-5 retries always succeed; when the deadline is always the same and can be expressed as `$tries` × `$backoff`.

## Prerequisites
- Understanding of Laravel queue job lifecycle
- Carbon/CarbonImmutable familiarity
- Knowledge of `$tries` and `$maxExceptions` distinction
- Queue worker configuration (Horizon or queue:work)

## Inputs
- Job class implementing `ShouldQueue`
- Business deadline definition (time window, cutoff time)
- Acceptable maximum attempt count (for `$tries` cap)
- Backoff strategy (fixed, escalating, or dynamic)

## Workflow
1. Implement `retryUntil()` on the job class, returning a `CarbonImmutable` deadline
2. Set `$tries` as a safety cap (e.g., `public $tries = 10`)
3. Configure `$backoff` appropriate for the deadline window
4. Use `CarbonImmutable` for immutable deadline calculation
5. For business-hours deadlines, specify the timezone explicitly
6. For dynamic deadlines (Laravel 10+), recalculate based on external state in the closure
7. Test deadlines with time travel (`Carbon::setTestNow()` or Pest `travelTo()`)
8. Monitor retry attempts in Horizon to verify deadline behavior

## Validation Checklist
- [ ] `retryUntil()` returns a `CarbonImmutable` (not mutable `Carbon`) deadline
- [ ] `$tries` cap set alongside `retryUntil()`
- [ ] `$backoff` delays fit within the deadline window
- [ ] Timezone explicitly specified for business-hours deadlines
- [ ] Dynamic deadline closure handles null/edge cases
- [ ] Tested with time travel for both before-deadline and after-deadline scenarios
- [ ] Horizon monitoring confirms expected retry count under deadline

## Common Failures
- Not pairing `retryUntil()` with `$tries` — thousands of retries consume the queue
- Using mutable `Carbon` — deadline shifts on re-evaluation (Laravel 10+)
- Long backoff exceeding remaining deadline — jobs fail immediately on pickup
- Ignoring timezone — deadline evaluated in wrong timezone
- Not testing with time travel — deadline behavior untested in CI

## Decision Points
- Retry based on time: use `retryUntil()`
- Retry based on attempt count: use `$tries`
- Both constraints: combine `retryUntil()` + `$tries`
- Distinguish failure types: also use `$maxExceptions`
- Adaptive deadlines (changing external state): use dynamic `retryUntil()` closure (Laravel 10+)

## Performance Considerations
- Closure evaluation: ~microseconds for Carbon operations
- External state checks in closure: ~1-5ms per retry (DB/cache query)
- Monitor `attempts` in Horizon to detect tight retry loops
- Short backoff + long deadline = many retries, queue storage overhead

## Security Considerations
- Deadline timezone must match business rules — mismatched timezones can cause retries outside business hours, triggering on-call alerts
- Dynamic `retryUntil()` closures that check external state must handle failures gracefully — a DB timeout in the closure should not crash the worker

## Related Rules
- Rule 1: pair-retryuntil-with-tries-cap
- Rule 2: use-immutable-carbon-for-deadline
- Rule 3: match-backoff-to-deadline-window
- Rule 4: specify-timezone-in-business-deadlines
- Rule 5: test-deadlines-with-time-travel

## Related Skills
- Configure Job Retry Logic with $tries and $maxExceptions
- Implement Job Backoff Strategies
- Monitor Queue Health with Horizon

## Success Criteria
Jobs retry within the defined deadline window, stop retrying after the deadline passes, avoid resource exhaustion from uncapped retries, and deadline behavior is verified through time-travel tests.
