# Anti-Patterns — retryUntil: Dynamic Deadline-Based Retry

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | retryUntil — Dynamic Deadline-Based Retry |
| Version | 1.0 |
| Last Updated | 2026-06-22 |

## Anti-Pattern Inventory

1. Uncapped Deadline Retry Loop
2. Mutable Carbon Deadline Drift
3. Backoff Exceeds Deadline
4. Timezone-Blind Business Deadline
5. retryUntil for Transient Failures
6. Stale Dynamic Deadline

---

## 1. Uncapped Deadline Retry Loop

### Category
Resource Exhaustion

### Description
Implementing `retryUntil()` with a long deadline but without a `$tries` cap, causing potentially thousands of retries that consume queue resources.

### Why It Happens
The developer sets a generous deadline (e.g., 24 hours) assuming jobs will resolve quickly. But with a short backoff (1 second), the job retries 86,400 times. Each retry writes to the queue, consumes a worker slot, and generates a `failed_jobs` entry on failure. The queue is flooded with retries.

### Warning Signs
- `$tries` not set on a job with `retryUntil()`
- Attempt count in Horizon climbs into the hundreds or thousands
- Queue depth spikes with retried jobs
- Worker throughput drops as workers process the same failing job repeatedly

### Why Harmful
A payment processing job with a 24-hour deadline and 1-second backoff retries 86,400 times for a failed payment. Every retry hits the payment gateway API, potentially triggering rate limiting or fraud detection. The queue backlog causes legitimate jobs to wait. The failed_jobs table accumulates tens of thousands of entries. On-call alerts fire for queue depth. The root cause (payment decline) is buried under the retry noise.

### Consequences
- Queue exhaustion from retry storms
- External API rate limiting triggered by excessive retries
- failed_jobs table bloat
- Legitimate jobs delayed by retry backlog
- Monitoring alert fatigue

### Alternative
Always set `$tries` alongside `retryUntil()`. The effective limit becomes `min($tries, deadline)`.

### Refactoring Strategy
1. Add `public $tries = 10` (or appropriate cap) to all jobs with `retryUntil()`
2. Calculate the cap as: max expected resolution time / min backoff
3. For long deadlines, use escalating backoff to reduce retry frequency
4. Monitor attempt counts in Horizon to verify the cap works

### Detection Checklist
- [ ] Every job with `retryUntil()` also has `$tries` set
- [ ] Attempts in Horizon never exceed the `$tries` cap
- [ ] Backoff strategy matches the deadline window
- [ ] No retry storms observed in queue monitoring

### Related Rules
pair-retryuntil-with-tries-cap

### Related Skills
Implement Deadline-Based Job Retry with retryUntil

### Related Decision Trees
Retry Strategy: Deadline-Based vs Attempt-Count-Based

---

## 2. Mutable Carbon Deadline Drift

### Category
Correctness

### Description
Using mutable `Carbon` (not `CarbonImmutable`) in the `retryUntil()` closure, causing the deadline to shift forward with each re-evaluation in Laravel 10+.

### Why It Happens
The developer uses `Carbon::now()->addMinutes(15)`. In Laravel 10+, the `retryUntil()` closure is re-evaluated before each retry. The first evaluation creates `Carbon(now + 15 min)`. The second evaluation mutates that same instance by adding another 15 minutes — deadline is now `now + 30 min`. After 10 retries, the deadline is 2.5 hours away. The job never stops retrying.

### Warning Signs
- Deadline keeps extending in Horizon retry detail view
- Job retries far exceed the expected deadline window
- `Carbon` used instead of `CarbonImmutable`
- Attempt count climbs but the deadline never seems to arrive

### Why Harmful
A webhook processing job is configured to retry for 15 minutes. Due to mutable Carbon drift, the deadline adds 15 minutes with each retry. After 4 retries, the deadline is 1 hour away. The job retries for hours, processing stale webhook data. Downstream systems receive duplicate webhook events because the retry window never closed.

### Consequences
- Job retries indefinitely past intended cutoff
- Stale data processed
- Duplicate side effects from endless retries
- Business workflows continue past their safe window

### Alternative
Always use `CarbonImmutable` or `Carbon::now()->copy()->addMinutes(N)`.

### Refactoring Strategy
1. Replace all `Carbon::now()->addMinutes(N)` with `CarbonImmutable::now()->addMinutes(N)`
2. Add `use Carbon\CarbonImmutable;` to job files
3. If using `Carbon`, wrap in `->copy()`: `Carbon::now()->copy()->addMinutes(N)`
4. Test: verify deadline does not shift after multiple retry evaluations

### Detection Checklist
- [ ] All `retryUntil()` closures use `CarbonImmutable`
- [ ] No mutable `Carbon` operations inside `retryUntil()`
- [ ] Deadline is identical across multiple evaluations (write test)
- [ ] Static analysis rule (PHPStan) flags `Carbon::now()->add*` in `retryUntil()` closures

### Related Rules
use-immutable-carbon-for-deadline

### Related Skills
Implement Deadline-Based Job Retry with retryUntil

### Related Decision Trees
Deadline Type: Fixed vs Dynamic

---

## 3. Backoff Exceeds Deadline

### Category
Correctness

### Description
Configuring `$backoff` delays that are longer than the remaining time until the deadline, causing jobs to be re-queued but fail immediately on pickup.

### Why It Happens
The developer sets `public $backoff = 300` (5 minutes) but `retryUntil()` returns a deadline 2 minutes away. On the first failure, the job is released with a 5-minute delay. Five minutes later, a worker picks it up, evaluates `retryUntil()`, finds the deadline is 3 minutes in the past, and immediately marks the job as failed. The retry was pointless — the job never had a chance to execute again.

### Warning Signs
- Jobs fail with "Job has timed out" immediately after being picked up from a release
- Backoff values are larger than the deadline window
- Horizon shows jobs being retried but never reaching `handle()` again
- Misleading failure entries — the job didn't fail during execution, it failed during evaluation

### Why Harmful
A payment retry job has a 1-minute deadline and a 2-minute backoff. The first attempt fails. The job is released for 2 minutes. When picked up, the deadline is expired — the job fails without a second attempt. The payment was never retried. The business loses revenue from a retry that was configured but never executed.

### Consequences
- Jobs never get a second attempt despite retry configuration
- Wasted queue cycles (release + immediate fail)
- Misleading failure logs (failure reason is "deadline" not "execution error")
- Missed business operations

### Alternative
Ensure `max($backoff values) < (deadline - now - 1 second)`. Use dynamic backoff that adjusts based on remaining time.

### Refactoring Strategy
1. Calculate: `max_backoff = (deadline_in_seconds * 0.5)` as a safety margin
2. Use escalating backoff that starts small and grows, but caps at half the deadline
3. For dynamic deadlines, use a backoff closure: `fn($attempt) => min($attempt * 10, $remainingDeadline - 1)`
4. Add a manual check in the job's `failed()` method to log when backoff exceeded the window

### Detection Checklist
- [ ] All backoff values are less than the deadline window duration
- [ ] Escalating backoff arrays don't exceed the deadline
- [ ] Dynamic backoff closures cap at remaining deadline
- [ ] Horizon shows retries reaching `handle()` after release

### Related Rules
match-backoff-to-deadline-window

### Related Skills
Implement Deadline-Based Job Retry with retryUntil

### Related Decision Trees
Backoff Strategy With Deadline Constraints

---

## 4. Timezone-Blind Business Deadline

### Category
Correctness

### Description
Setting a business-hours deadline (e.g., "retry until 5 PM") without specifying the timezone, using the server's default timezone which may differ from the business location.

### Why It Happens
The developer calls `CarbonImmutable::now()->setTime(17, 0, 0)` assuming "5 PM local time." But the application server runs in UTC, and the business operates in Eastern Time. 5 PM UTC is actually 1 PM Eastern — the job stops retrying 4 hours early. Conversely, a European team deploys to UTC servers — the job retries 5 hours past business close.

### Warning Signs
- Jobs stop retrying at unexpected times
- Deadline times don't match business hours
- Application `config('app.timezone')` differs from business operations timezone
- On-call alerts fire during actual business hours because jobs stopped

### Why Harmful
A customer support ticket creation job retries until 5 PM Eastern. The server runs UTC. At 5 PM UTC (1 PM Eastern), the job stops. Customers can't create tickets after 1 PM. Support operations are impacted for 4 hours of the business day. Alternatively, a report generation job retries until 6 PM CET, but runs on UTC servers — it continues retrying until 7 PM CET, generating outdated reports.

### Consequences
- Business operations disrupted during actual business hours
- Jobs retry during off-hours, triggering unnecessary alerts
- Customer-facing features degrade before business close
- Time-sensitive operations fail at the wrong clock time

### Alternative
Always specify the timezone explicitly: `CarbonImmutable::now('America/New_York')->setTime(17, 0, 0)`.

### Refactoring Strategy
1. Identify the business timezone for each job with business-hours deadlines
2. Add explicit timezone to all `CarbonImmutable::now()` calls in `retryUntil()`
3. Store business timezone in config: `config('business.timezone')`
4. Document timezone assumptions in job class PHPDoc
5. Test with different `config('app.timezone')` values to verify independence

### Detection Checklist
- [ ] All business-hours deadlines specify explicit timezone
- [ ] Application timezone (config) and business timezone independently configured
- [ ] Tests verify deadline behavior across timezone boundaries
- [ ] No bare `setTime()` calls without preceding `now('Timezone')`

### Related Rules
specify-timezone-in-business-deadlines

### Related Skills
Implement Deadline-Based Job Retry with retryUntil

### Related Decision Trees
Deadline Type: Fixed vs Dynamic

---

## 5. retryUntil for Transient Failures

### Category
Architecture

### Description
Using `retryUntil()` for jobs where failures are transient (network blips, deadlocks) and a simple `$tries = 3` would suffice.

### Why It Happens
The developer reads about `retryUntil()` and applies it broadly — "if retry is needed, use retryUntil." A simple API call that fails on network blips gets a 15-minute deadline. But network blips resolve in seconds. The job retries for 15 minutes when 3 retries over 30 seconds would be sufficient.

### Warning Signs
- `retryUntil()` on jobs with no business time constraint
- All jobs in the project use `retryUntil()` regardless of failure type
- Deadline is set arbitrarily ("15 minutes seems reasonable")
- Review comment: "Why does this job need a deadline?"

### Why Harmful
A simple notification job (send push notification) uses `retryUntil()` with a 10-minute deadline. The push service is temporarily down. The job retries for 10 minutes with short backoff — 200 retries. The queue depth builds. Other jobs wait. Meanwhile, the push service recovers after 30 seconds. The notification was sent on retry #3, but the job still exists in the queue for 9 more minutes of pointless retries.

### Consequences
- Unnecessary complexity (timezone, clock skew, Carbon immutability concerns)
- Queue resources wasted on jobs that should have a simple attempt cap
- Developer cognitive overhead from reasoning about time-based constraints where count-based is sufficient
- Longer recovery times (the job waits for deadline instead of reaching max tries quickly)

### Alternative
Use `$tries = 3` (or appropriate count) with escalating backoff for transient failures.

### Refactoring Strategy
1. Categorize jobs: time-sensitive (use `retryUntil`) vs transient-failure (use `$tries`)
2. For transient failure jobs: remove `retryUntil()`, set `$tries = 3-5`
3. Add escalating backoff: `public $backoff = [5, 15, 45]`
4. If unsure, start with `$tries` and only add `retryUntil()` when a time constraint is identified

### Detection Checklist
- [ ] `retryUntil()` only on jobs with a documented business time constraint
- [ ] Transient-failure jobs use `$tries` only
- [ ] Job class PHPDoc explains WHY a deadline is needed (not just present)
- [ ] No arbitrary deadline values ("15 minutes" for every job)

### Related Rules
None specific — architectural decision.

### Related Skills
Implement Deadline-Based Job Retry with retryUntil, Configure Job Retry Logic with $tries and $maxExceptions

### Related Decision Trees
Retry Strategy: Deadline-Based vs Attempt-Count-Based

---

## 6. Stale Dynamic Deadline

### Category
Correctness

### Description
Using a dynamic deadline in `retryUntil()` (Laravel 10+) that references external state without handling the case where that state becomes unavailable.

### Why It Happens
The `retryUntil()` closure reads a campaign deadline from the database: `Campaign::find($this->campaignId)->ends_at`. On the first evaluation, the campaign exists and the deadline is returned. On a later retry, the campaign was deleted (or the DB is slow, or the cache expired). The closure throws an exception, crashes the retry evaluation, and the job is marked as failed — not because the operation couldn't be retried, but because the deadline calculation crashed.

### Warning Signs
- `retryUntil()` closures with external calls (DB, cache, HTTP)
- Jobs failing with "Trying to get property of non-object" in the retryUntil closure
- Campaign/entity deleted but jobs still retrying
- Intermittent failures during retry evaluation (not execution)

### Why Harmful
A promotional notification job reads the promotion end time from cache. The promotion was cancelled and the cache key was deleted. On retry, the closure crashes with a Cache miss exception. The job fails not because sending notifications is impossible, but because the deadline couldn't be calculated. Meanwhile, other jobs queued for the same promotion also crash on retry evaluation. The failed_jobs table fills with jobs that failed at the wrong layer.

### Consequences
- Jobs fail due to deadline calculation, not operation failure
- Cascading failures when external deadline source becomes unavailable
- Orphaned jobs after campaign/entity deletion
- Misleading failure metrics

### Alternative
Wrap external deadline lookups in null-safe checks and return an immediate deadline (`CarbonImmutable::now()`) when the external source is unavailable.

### Refactoring Strategy
1. Wrap all external lookups in `retryUntil()` closures with try/catch
2. Return `CarbonImmutable::now()` (immediate deadline) when external source is unavailable
3. Add null-coalescing: `Cache::get("deadline:{$id}")` → `CarbonImmutable::now()`
4. For soft-deleted entities, check `trashed()` status and return immediate deadline
5. Log when dynamic deadline resolves to "now" for observability

### Detection Checklist
- [ ] Dynamic `retryUntil()` closures have null/error handling
- [ ] External state lookups default to immediate deadline on failure
- [ ] Soft-deleted entities properly terminate retry via deadline
- [ ] No uncaught exceptions in `retryUntil()` evaluation path

### Related Rules
test-deadlines-with-time-travel

### Related Skills
Implement Deadline-Based Job Retry with retryUntil

### Related Decision Trees
Deadline Type: Fixed vs Dynamic
