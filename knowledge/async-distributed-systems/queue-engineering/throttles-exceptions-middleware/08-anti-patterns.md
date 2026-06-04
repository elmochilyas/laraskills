# Anti-Patterns — `ThrottlesExceptions` Middleware

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Job Middleware |
| Knowledge Unit | `ThrottlesExceptions` Middleware |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Decay Window Shorter Than Recovery Time
2. Uniform Backoff for All Exception Types
3. Wrong Middleware Order — Reactive Before Proactive
4. Confusing Throttle with Permanent Failure

---

## 1. Decay Window Shorter Than Recovery Time

### Category
Reliability

### Description
Setting `decayMinutes` shorter than the downstream service's typical recovery time, causing the job to be released while the service is still down and immediately fail again.

### Why It Happens
The developer sets a convenient decay window (1 minute, 2 minutes) without understanding the downstream service's recovery characteristics. A downstream API that takes 5 minutes to recover from a 503 error gets a 1-minute decay window. The job waits 1 minute, retries, fails again, increments the counter again, and repeats the cycle.

### Warning Signs
- `decayMinutes` set to arbitrary low value (1-2 minutes)
- Jobs cycle through all retry attempts during a single outage
- Failed_jobs table fills with jobs that exhausted attempts during recovery
- Downstream service recovery observed but jobs already failed permanently

### Why Harmful
A downstream payment API has a 10-minute planned maintenance window. The `ThrottlesExceptions` window is 2 minutes. The job fails, hits 5 exceptions in 2 minutes, and is released. After 2 minutes, it retries — the API is still down. The pattern repeats. With 10 max attempts, the job exhausts all attempts within 20 minutes. The API recovers at 10 minutes, but the job is already permanently failed. The throttle didn't help — it was too short.

### Consequences
- Jobs exhaust retry attempts during single outage
- Permanent failure before downstream recovery
- Throttle window too aggressive for recovery characteristics
- Operator intervention required for mass job failures

### Alternative
Set `decayMinutes` longer than the downstream service's typical recovery time (start with 10 minutes).

### Refactoring Strategy
1. Measure downstream service recovery time from historical incidents
2. Set `decayMinutes` to at least 2x the typical recovery time
3. For unknown recovery, start with 10-15 minutes
4. Monitor: validate that jobs survive typical outages without exhausting attempts
5. Adjust based on observed recovery patterns

### Detection Checklist
- [ ] `decayMinutes` > downstream recovery time
- [ ] Jobs survive typical transient outages
- [ ] Retry attempts not exhausted during outages
- [ ] Recovery time documented per downstream service

### Related Rules
decay-exceeds-recovery-time

### Related Skills
Back Off Job Execution After Repeated Failures with ThrottlesExceptions

### Related Decision Trees
throttlesExceptions vs Manual Release Strategy

---

## 2. Uniform Backoff for All Exception Types

### Category
Reliability

### Description
Not using the `backoff` callback to provide exception-specific release delays, causing all exceptions (429, 503, connection timeout) to receive the same backoff despite having different recovery characteristics.

### Why It Happens
The `backoff` callback is optional — the middleware works without it. The developer adds `ThrottlesExceptions(5, 10)` without `->backoff(...)`. All exceptions get the same default release delay (time until window reset). But a 429 error usually includes a `Retry-After` header specifying the exact wait time, while a 503 needs a generic backoff.

### Warning Signs
- `ThrottlesExceptions` without `backoff` callback
- Rate limit exceptions (429) treated same as server errors (503)
- 429 retries too early: wastes attempts because Retry-After not respected
- 503 retries too late: unnecessarily delayed

### Why Harmful
A downstream API returns 429 with `Retry-After: 60`. The default backoff releases the job after 10 minutes (window reset) instead of 60 seconds. The job waits unnecessarily long. Conversely, a 503 with 30-second typical recovery gets the same 10-minute delay — the job waits 10 minutes when it could have retried in 30 seconds. The uniform backoff is never optimal for any exception type.

### Consequences
- Rate limit retries delayed far longer than necessary
- Server error retries unnecessarily delayed
- Suboptimal throughput during partial outages
- Wasted recovery time for different failure modes

### Alternative
Use the `backoff` callback to provide exception-specific release delays.

### Refactoring Strategy
1. Add `->backoff(fn(Throwable $e) => ...)` to `ThrottlesExceptions`
2. Map exception types to appropriate delays: 429 → parse Retry-After, 503 → 30s, timeout → 60s
3. Provide a sensible default for unknown exception types
4. Test: verify each exception type triggers appropriate backoff

### Detection Checklist
- [ ] `backoff` callback provides exception-specific delays
- [ ] 429 errors respect Retry-After header
- [ ] 503 errors have shorter delays than rate limit errors
- [ ] Default fallback for unknown exceptions

### Related Rules
use-backoff-callback-for-exception-types

### Related Skills
Back Off Job Execution After Repeated Failures with ThrottlesExceptions

### Related Decision Trees
throttlesExceptions vs Manual Release Strategy

---

## 3. Wrong Middleware Order — Reactive Before Proactive

### Category
Architecture

### Description
Applying `ThrottlesExceptions` before `RateLimited` in the middleware stack, allowing the job to execute and fail before the proactive rate limit check runs.

### Why It Happens
The developer adds middleware in the order they write them: first the exception handler, then the rate limiter. The middleware array order is the execution order. `ThrottlesExceptions` wraps the outermost layer, running its `$next($job)` call which triggers `RateLimited`. By the time `RateLimited` checks, the job has already executed — the reactive middleware ran first.

### Warning Signs
- `ThrottlesExceptions` appears before `RateLimited` in `middleware()` array
- Rate limit exceptions occur despite having `RateLimited` middleware
- Proactive rate limiting doesn't prevent executions
- Jobs execute but then get rate-limited retroactively

### Why Harmful
The job executes, calls the external API, and gets a 429. `ThrottlesExceptions` catches the exception and increments the failure counter. But the API call was already made — the rate limit was already hit. `RateLimited` (which runs inside `ThrottlesExceptions`) would have prevented the call entirely. By reversing the order, the proactive protection is ineffective, and each rate limit violation still consumes an API call.

### Consequences
- Rate-limited API calls still executed despite `RateLimited`
- Reactive middleware catches failures that proactive should have prevented
- API quota consumed unnecessarily
- ThrottlesExceptions counters inflated by preventable failures

### Alternative
Apply `RateLimited` before `ThrottlesExceptions` in the middleware array: proactive first, reactive second.

### Refactoring Strategy
1. Reorder middleware in `middleware()`: `RateLimited` first, then `ThrottlesExceptions`
2. Verify the new execution order: `RateLimited` (outer) → `ThrottlesExceptions` (inner)
3. Test: hit rate limit → job prevented by `RateLimited` before `ThrottlesExceptions` sees it
4. Confirm: no API call made when rate limit prevents execution

### Detection Checklist
- [ ] `RateLimited` before `ThrottlesExceptions` in middleware array
- [ ] Proactive check prevents reactive counter from incrementing
- [ ] Rate-limited jobs don't make API calls
- [ ] ThrottlesExceptions only sees failures from non-rate-limited causes

### Related Rules
rate-limited-before-throttles-exceptions

### Related Skills
Back Off Job Execution After Repeated Failures with ThrottlesExceptions, Add RateLimited Middleware to Jobs

### Related Decision Trees
throttlesExceptions vs Manual Release Strategy

---

## 4. Confusing Throttle with Permanent Failure

### Category
Reliability

### Description
Using `ThrottlesExceptions` when the intent is permanent failure after N exceptions, or using `$maxExceptions` when the intent is temporary backoff, applying the wrong pattern.

### Why It Happens
Both `ThrottlesExceptions` and `$maxExceptions` count exceptions, both trigger after a threshold. The developer sees "5 exceptions" and uses `ThrottlesExceptions(5, 10)`, expecting the job to permanently fail after 5 exceptions. But `ThrottlesExceptions` only temporarily releases — it doesn't send the job to `failed_jobs`. The job keeps retrying indefinitely.

### Warning Signs
- `ThrottlesExceptions` used when permanent failure is desired
- `$maxExceptions` used when temporary backoff is desired
- Jobs expected to fail permanently but keep retrying
- Jobs expected to back off temporarily but permanently fail

### Why Harmful
Using `ThrottlesExceptions` for permanent failure: a job with a deterministic bug should fail after a few attempts and alert operators. Instead, it retries forever (released by throttle), never reaching `failed_jobs`, and operators are never alerted. The bug persists silently. Using `$maxExceptions` for temporary backoff: a downstream API is temporarily unavailable, but `$maxExceptions` permanently fails the job after N exceptions instead of temporarily backing off.

### Consequences
- `ThrottlesExceptions` jobs retry indefinitely for deterministic bugs
- `$maxExceptions` jobs permanently fail for transient issues
- Wrong pattern delays operator notification or causes unnecessary failures
- Debugging confusion from unexpected behavior

### Alternative
Use `$maxExceptions` for permanent failure after N exceptions (send to `failed_jobs`). Use `ThrottlesExceptions` for temporary backoff (release and retry).

### Refactoring Strategy
1. Identify the desired behavior: permanent failure or temporary backoff
2. For permanent failure: set `$maxExceptions` on the job class
3. For temporary backoff: use `ThrottlesExceptions` middleware
4. For both: combine — `ThrottlesExceptions` for backoff, `$maxExceptions` as ultimate ceiling

### Detection Checklist
- [ ] Permanent failure: `$maxExceptions` used (job goes to failed_jobs)
- [ ] Temporary backoff: `ThrottlesExceptions` used (job stays in queue)
- [ ] Pattern matches intention
- [ ] No unexpected permanent or infinite retry behavior

### Related Rules
decay-exceeds-recovery-time

### Related Skills
Back Off Job Execution After Repeated Failures with ThrottlesExceptions

### Related Decision Trees
throttlesExceptions vs Manual Release Strategy
