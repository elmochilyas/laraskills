# Anti-Patterns: `$tries`, `$maxExceptions`, `retryUntil()`

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K017 — Retry Limits |
| Classification | Intermediate |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | `$tries` Not Set (Unlimited Retries) | Reliability | Critical |
| 2 | `$maxExceptions` > `$tries` (Ineffective Setting) | Design | Medium |
| 3 | Fixed `$tries` for Time-Sensitive External API Calls | Design | High |
| 4 | `$tries = null` Without `retryUntil()` (Infinite Retries) | Reliability | Critical |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Explicit $tries on Any Job Class | tries-max-exceptions-retry-until | Critical |
| retryUntil() Missing on Time-Sensitive Jobs | tries-max-exceptions-retry-until | High |

---

## Anti-Pattern 1: `$tries` Not Set (Unlimited Retries)

### Category
Reliability — Infinite Retry Loop

### Description
Not setting `$tries` on a job class, leaving it at the default `null`. A job with a permanent bug retries forever — consuming worker time, queue capacity, and log storage indefinitely until manually killed.

### Why It Happens
Default value is `null` (unlimited). Developers assume it has a reasonable default or that `--tries` on the worker covers it. They don't realize a missing `$tries` means no upper bound on retry attempts.

### Warning Signs
- Job class without `$tries` property
- A buggy job retries hundreds of times without permanent failure
- Worker repeatedly processes the same job
- `failed_jobs` has no entry for the job (it never permanently fails)
- Job has been running for hours/days without resolution

### Why Harmful
A job with a validation bug (e.g., accessing a null property) retries forever. Each retry takes 2 seconds, with a 10-second backoff. That's 12 seconds per cycle. In one hour, the job executes 300 times. In one day, 7,200 times. The worker is locked on this job, not processing any others. The queue backlog grows indefinitely.

### Real-World Consequences
A `ProcessOrder` job has a bug: it calls `$order->items->count()` where `items` can be null. No `$tries` set. The bug deploys on Friday. By Monday morning, the job has executed 86,400 times (3 days), consuming approximately 12 days of worker time (86,400 * 12s = ~1,036,800s = ~12 days on a single worker). The queue backlog is enormous.

### Preferred Alternative
Set `$tries` explicitly on every job class. Use `retryUntil()` for time-based cutoff if needed.

### Refactoring Strategy
1. Audit all job classes — add `public $tries = 3` to every class missing it
2. For jobs with `retryUntil()`: `$tries` can remain null (time-based safety net)
3. Set worker `--tries` to a high upper bound (e.g., `--tries=10`) as a system-level safety net
4. Monitor for jobs exceeding expected retry count
5. Add a CI linting rule to require `$tries` or `retryUntil()` on every job class

### Detection Checklist
- [ ] Job class without `$tries` property
- [ ] `$tries` defaults to null (unlimited)
- [ ] Buggy job retries indefinitely
- [ ] No `retryUntil()` as safety net

### Related Rules/Skills/Decision Trees
- **Rule 1**: always-set-explicit-tries (`05-rules.md`)
- **Skill**: Write Retry-Safe Job Classes (`06-skills.md`)
- **Decision**: Fixed tries vs retryUntil (`07-decision-trees.md`)

---

## Anti-Pattern 2: `$maxExceptions` > `$tries` (Ineffective Setting)

### Category
Design — Dead Configuration

### Description
Setting `$maxExceptions` to a value greater than `$tries`. The job exhausts `$tries` before reaching `$maxExceptions`, making the exception limit useless. It's a configuration that has no effect.

### Why It Happens
Developers misunderstand the relationship. They think `$maxExceptions` is checked independently regardless of `$tries`, not as a within-tries secondary limit.

### Warning Signs
- `$maxExceptions = 5` with `$tries = 3`
- Job always fails due to `$tries` exhaustion, not `$maxExceptions`
- Changing `$maxExceptions` has no observable effect on job behavior
- Team can't explain what `$maxExceptions` does for their job
- Configuration that could be removed without changing behavior

### Why Harmful
The `$maxExceptions` setting is dead code — it has no effect on job execution. The developer who wrote it intended to limit exception-heavy jobs, but the limit is never reached. The effective behavior is the same as having no `$maxExceptions` at all.

### Real-World Consequences
A job has `$tries = 3` and `$maxExceptions = 5`. The developer intended "fail after 5 exceptions." But with only 3 total attempts, at most 3 exceptions can occur. The job always exhausts `$tries` at attempt 3, regardless of `$maxExceptions`. The developer's intent (failing early on exception bursts) is never realized. The job always does 3 attempts.

### Preferred Alternative
Keep `$maxExceptions ≤ $tries`. Use `$maxExceptions` to fail earlier than `$tries` would allow.

### Refactoring Strategy
1. Review all job classes with both `$maxExceptions` and `$tries`
2. Ensure `$maxExceptions <= $tries`
3. If `$maxExceptions` was meant as a secondary check: set it lower than `$tries`
4. If `$maxExceptions` was not intentional: remove it
5. Test that the exception limit fires before the attempt limit

### Detection Checklist
- [ ] `$maxExceptions > $tries`
- [ ] Changing `$maxExceptions` has no effect
- [ ] Job always exhausts `$tries` first
- [ ] `$maxExceptions` could be removed with no change

### Related Rules/Skills/Decision Trees
- **Rule 3**: max-exceptions-less-than-tries (`05-rules.md`)
- **Decision**: maxExceptions Setting Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 3: Fixed `$tries` for Time-Sensitive External API Calls

### Category
Design — Inaccurate Retry Budget

### Description
Using a fixed `$tries` count for jobs that call external APIs with variable response times. `$tries` is count-based — it gives a fixed number of attempts regardless of timing. For time-sensitive operations, `retryUntil()` is better because it adapts to variable execution times.

### Why It Happens
Developers learn `$tries` first and use it for all jobs. `retryUntil()` requires implementing a method, which feels like more work than setting a property.

### Warning Signs
- External API jobs use `$tries` instead of `retryUntil()`
- Job fails even though the time window hasn't expired
- During slow API responses, few retries are attempted
- During fast API responses, many retries are wasted
- Job has a natural deadline (password reset, payment window)

### Why Harmful
With `$tries`, the job gets a fixed number of attempts regardless of time. If the API responds slowly (30 seconds each), 10 attempts take 300+ seconds. If the deadline is 60 seconds, the job may miss it — even though the API eventually returns a success. Conversely, with fast responses (1 second each), the job exhausts all retries in 10 seconds and stops retrying, even though the deadline is 60 seconds away.

### Real-World Consequences
A payment job uses `$tries = 5` with a payment window of 2 minutes. The payment gateway responds in 30 seconds during peak (slow). 5 attempts take 150+ seconds. The payment window closes at 120 seconds. The job fails permanently at 150 seconds — but the deadline was 120 seconds. If `retryUntil(now()->addMinutes(2))` was used, the job would attempt as many retries as fit within 2 minutes.

### Preferred Alternative
Use `retryUntil()` for time-sensitive jobs. It adapts to variable execution times and ensures the job stops at the deadline.

### Refactoring Strategy
1. Identify jobs with natural deadlines (payment windows, reset tokens, promotional periods)
2. Replace `$tries=N` with `retryUntil()` returning the deadline timestamp
3. Keep `$tries` as a secondary safety bound (e.g., `$tries = 10` as max)
4. Test with both fast and slow responses to verify timing behavior
5. Monitor actual retry counts against the time window

### Detection Checklist
- [ ] External API jobs use `$tries` without `retryUntil()`
- [ ] Job has a natural deadline
- [ ] Fixed `$tries` doesn't adapt to variable response times
- [ ] Job may miss deadline or waste retry budget

### Related Rules/Skills/Decision Trees
- **Rule 2**: prefer-retryuntil-for-api-calls (`05-rules.md`)
- **Decision**: Fixed tries vs retryUntil (`07-decision-trees.md`)

---

## Anti-Pattern 4: `$tries = null` Without `retryUntil()` (Infinite Retries)

### Category
Reliability — No Upper Bound

### Description
Leaving `$tries` as `null` (default) and not defining `retryUntil()`. The job has no upper bound on retries — it can retry indefinitely, consuming worker capacity forever on a permanently failing condition.

### Why It Happens
Not setting `$tries` explicitly is an oversight. The developer may not realize the default is `null` (unlimited). Combined with `retryUntil()`, `null` is safe — but alone, it's dangerous.

### Warning Signs
- `$tries` not set on job class (defaults to null)
- No `retryUntil()` method defined
- Job retries indefinitely on permanent error
- Worker is stuck processing the same job for hours
- No permanent failure entry in `failed_jobs`

### Why Harmful
A job that throws an exception every execution retries forever. The worker(s) assigned to that queue are consumed by a single doomed job. Other jobs in the queue never get processed. The system appears to stop processing work, but no failure alert fires because the job never "fails" permanently.

### Real-World Consequences
A job calls an external API that has been decommissioned. `$tries` is not set (default `null`). No `retryUntil()`. The job throws `ConnectionException` every time. The worker retries with backoff. The job executes 300 times per hour. After 24 hours, 7,200 attempts. The single job has consumed a worker for an entire day. Other jobs in the queue have a 24-hour processing delay. No alert fires because the job never permanently "fails."

### Preferred Alternative
Always set `$tries` explicitly, OR define `retryUntil()` for a time-based cutoff.

### Refactoring Strategy
1. Audit all job classes for `$tries === null` and no `retryUntil()`
2. Add `public $tries = 3` to each
3. For jobs with a natural deadline: implement `retryUntil()` instead
4. Set `--tries` on worker command (e.g., `queue:work --tries=10`) as a system-level safety bound
5. Add CI linting to flag jobs without retry limits

### Detection Checklist
- [ ] `$tries` not set (null)
- [ ] No `retryUntil()` method
- [ ] Job retries indefinitely on permanent error
- [ ] Worker consumed by single job without alerting

### Related Rules/Skills/Decision Trees
- **Rule 4**: no-infinite-retries-without-until (`05-rules.md`)
- **Skill**: Write Retry-Safe Job Classes (`06-skills.md`)
