# retryUntil — Dynamic Deadline-Based Retry — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** retryUntil — Dynamic Deadline-Based Retry
- **Last Updated:** 2026-06-22

---

## Prerequisites Checklist
- [ ] Understand the difference between `retryUntil()`, `$tries`, and `$maxExceptions`
- [ ] Familiar with `CarbonImmutable` and timezone handling
- [ ] Know how the queue worker evaluates retry conditions (Laravel 10+ re-evaluation)
- [ ] Access to Horizon or queue monitoring for attempt tracking

## Implementation Checklist
- [ ] Implement `retryUntil()` method returning a `\DateTime` instance
- [ ] Use `CarbonImmutable` (not mutable `Carbon`) for deadline calculations
- [ ] Set `$tries` as a safety cap alongside `retryUntil()`
- [ ] Configure `$backoff` with delays that fit within the deadline window
- [ ] Specify timezone explicitly for business-hours deadlines
- [ ] For dynamic deadlines (Laravel 10+), handle null/missing external state gracefully
- [ ] Return `CarbonImmutable::now()` when the deadline source is unavailable (immediate failure)
- [ ] Return `null` if `retryUntil()` should be disabled entirely

## Verification Checklist
- [ ] Job retries while `now() < deadline` and stops when `now() >= deadline`
- [ ] `$tries` cap triggers before deadline if attempts are exhausted first
- [ ] Backoff delays do not exceed the remaining deadline window
- [ ] Dynamic deadline recalculates correctly on each retry evaluation (Laravel 10+)
- [ ] Deadline does not drift with mutable Carbon (verified with multiple evaluation test)
- [ ] Business-hours deadlines tested across timezone boundaries
- [ ] Deadline behavior tested with time travel (`Carbon::setTestNow()`, `travelTo()`)

## Security Checklist
- [ ] Timezone explicitly specified for business-hour deadlines to avoid geographic confusion
- [ ] Dynamic closures gracefully handle unavailable external state (no uncaught exceptions)
- [ ] Deadline source (cache key, DB column) does not expose sensitive information

## Performance Checklist
- [ ] `$tries` cap prevents thousands of retries in long deadline windows
- [ ] Escalating backoff used for deadlines > 10 minutes to reduce retry frequency
- [ ] External state lookups in dynamic `retryUntil()` closures are cached (not raw DB queries every retry)
- [ ] Horizon `attempts` metric monitored for unexpected retry counts
- [ ] `failed_jobs` table does not accumulate excessive entries from tight retry loops

## Production Readiness Checklist
- [ ] Server timezone (`config('app.timezone')`) aligned with business timezone or overridden in `retryUntil()`
- [ ] Clock skew across worker servers identified and documented (NTP sync verified)
- [ ] Horizon configured to display `retryUntil` deadline in job detail view
- [ ] Alerting configured for jobs exceeding expected retry counts
- [ ] `failed_jobs` entries distinguish between deadline-expired failures and execution failures
- [ ] Recovery procedure documented: how to manually retry a job whose deadline was too tight
- [ ] Rollback strategy: if `retryUntil()` is causing issues, fallback to `$tries`-only configuration

## Common Mistakes to Avoid
- [ ] Not pairing `retryUntil()` with `$tries` cap (risk: thousands of retries)
- [ ] Using mutable `Carbon` instead of `CarbonImmutable` (risk: deadline drift on Laravel 10+)
- [ ] Setting backoff delays longer than the deadline window (risk: jobs fail without another attempt)
- [ ] Ignoring timezone in business-hours deadlines (risk: off-hours retries or premature cutoff)
- [ ] Using `retryUntil()` for transient failures where `$tries` alone is sufficient
- [ ] Dynamic deadline closures that crash when external state is unavailable
- [ ] Not testing deadlines with time travel (risk: untested retry behavior in CI)

## Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review: `retryUntil()` is the correct mechanism for the job's retry constraint
- [ ] Security review: timezone handling, external state access, error handling in closures
- [ ] Performance review: `$tries` cap, backoff strategy, Horizon metrics
- [ ] Testing review: time-travel tests cover before/after deadline scenarios
- [ ] Anti-pattern review: none of the 5 anti-patterns present
- [ ] Production readiness: monitoring, alerting, recovery procedures documented
