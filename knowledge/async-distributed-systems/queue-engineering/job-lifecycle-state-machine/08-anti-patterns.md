# Anti-Patterns: Job Lifecycle State Machine

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Queue Engineering |
| Knowledge Unit | K073 — Job Lifecycle State Machine |
| Classification | Expert |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | release() Without Delay | Reliability | Critical |
| 2 | Calling Both delete() and release() | Reliability | Critical |
| 3 | Changing $tries While Jobs In Flight | Operational | High |
| 4 | Assuming Failed Jobs Auto-Retry | Design | Critical |
| 5 | maxExceptions Mismatch With Job Behavior | Configuration | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No retry_after / timeout Alignment | job-lifecycle-state-machine, retry-workflow | Critical |
| Missing Job State Monitoring | job-lifecycle-state-machine, queue-observability | High |
| Overriding Framework State Transitions Unnecessarily | job-lifecycle-state-machine, job-middleware | Medium |

---

## Anti-Pattern 1: release() Without Delay

### Category
Reliability — Tight Retry Loop

### Description
Calling `$this->release()` without a delay parameter. The job is re-queued instantly and the worker picks it up immediately — creating a tight retry loop that consumes 100% CPU on the worker while making no progress.

### Why It Happens
Developers need to defer processing temporarily (e.g., waiting for a resource to be ready) and call `$this->release()` without considering the delay. The default delay (0) re-queues immediately.

### Warning Signs
- `$this->release()` called without arguments in error handlers
- Worker CPU spikes to 100% on a single job that keeps failing
- Job attempts counter increments rapidly (multiple attempts per second)
- Queue monitoring shows a single job consuming all worker time
- Other jobs on the same queue are starved

### Why Harmful
A single misbehaving job can consume an entire worker process indefinitely. Other jobs queue up behind the tight retry loop, causing starvation. Database connections are tied up, and the queue backlog grows.

### Real-World Consequences
A job that processes API responses calls `$this->release()` when the API returns 429 (rate limited). Without a delay, the worker retries instantly, hitting the rate limit again immediately — the job loops at 100% CPU for hours. Other jobs on the same queue never process. The team discovers the issue when a user complains about a password reset email that took 4 hours to arrive.

### Preferred Alternative
Always provide a delay parameter to `release()`. Use the backoff mechanism for retry delay.

### Refactoring Strategy
1. Find all `$this->release()` calls without a delay argument
2. Add a delay: `$this->release(5)` for a 5-second delay
3. For dynamic delays, calculate based on attempt number: `$this->release(min(60, $this->attempts() * 5))`
4. Consider using `$this->backoff` property instead of manual release
5. Monitor for jobs with rapid attempt counts

### Detection Checklist
- [ ] `$this->release()` called without delay argument
- [ ] Job attempt count increments faster than expected
- [ ] Worker CPU spikes correlate with specific job execution
- [ ] Queue backlog grows despite available workers

### Related Rules/Skills/Decision Trees
- **Rule 1**: always-delay-on-release (`05-rules.md`)
- **Decision 1**: Release vs Fail Decision (`07-decision-trees.md`)

---

## Anti-Pattern 2: Calling Both delete() and release()

### Category
Reliability — Silent Job Loss

### Description
Calling both `$this->delete()` and `$this->release()` in the same error handler. These methods set mutually exclusive states on the job — one removes it, the other re-queues it. The outcome is unpredictable and often results in the job being silently lost.

### Why It Happens
Developers write defensive error handlers that attempt to clean up the job while also scheduling a retry — hoping both will happen. In reality, only one operation takes effect.

### Warning Signs
- Both `$this->delete()` and `$this->release()` appear in the same method
- Error handlers call both in sequence (delete then release, or vice versa)
- Jobs that should retry are never seen again (delete() wins)
- Jobs that should be removed appear again after deletion (release() wins)
- Confusion in code reviews about which operation takes precedence

### Why Harmful
Developer intent is subverted. If `delete()` runs after `release()`, the retry is silently skipped — the job is lost forever. If `release()` runs after `delete()`, a phantom job reappears, potentially causing duplicate processing.

### Real-World Consequences
An error handler calls `$this->delete(); $this->release(30);` — the developer intended to remove the job but ensure retry as a fallback. `delete()` removes the job from the queue, `release()` has no effect (the job is already gone). The job is silently lost. The customer never receives their order confirmation, and the error is invisible because the handler ran without throwing.

### Preferred Alternative
Choose one outcome: call `release()` for retry or `delete()` for removal. Never call both. Let the framework handle default state transitions.

### Refactoring Strategy
1. Remove one of the two calls from each error handler
2. If retry is intended: keep only `$this->release($delay)`
3. If removal is intended: keep only `$this->delete()`
4. If unsure: call neither — let the framework handle it based on exception presence
5. Add code review check for `delete()` and `release()` co-occurrence

### Detection Checklist
- [ ] Both `delete()` and `release()` in the same method
- [ ] Job silently disappears from queue
- [ ] Phantom job re-appears after deletion
- [ ] Error handler intent unclear

### Related Rules/Skills/Decision Trees
- **Rule 2**: never-call-delete-and-release (`05-rules.md`)
- **Decision 2**: delete() vs release() Conflict Resolution (`07-decision-trees.md`)

---

## Anti-Pattern 3: Changing $tries While Jobs In Flight

### Category
Operational — Inconsistent Retry Behavior

### Description
Changing the `$tries` property on a job class while jobs of that class are already queued. The `$tries` value is evaluated when the job is popped, not when dispatched — in-flight jobs get the new value, receiving more or fewer retries than originally intended.

### Why It Happens
Teams tweak retry configuration in response to production issues without considering in-flight jobs. Configuration changes are deployed without draining the queue first.

### Warning Signs
- `$tries` changed in a deployment while jobs are still in the queue
- Jobs receive an unexpected number of retries (too many or too few)
- "Impossible" failures — jobs that should have retried are failing immediately
- Jobs retry more times than expected after a configuration change
- No queue drain step in deployment checklist

### Why Harmful
Jobs dispatched under the old configuration may fail prematurely (if `$tries` decreased) or retry excessively (if `$tries` increased). Both cause unexpected behavior — lost processing or delayed failure detection.

### Real-World Consequences
A team reduces `$tries` from 10 to 3 because a flaky API has stabilized. They deploy without draining the queue. 50 in-flight jobs that were dispatched when the API was flaky now get only 3 attempts instead of the expected 10. Half of them fail permanently, and the corresponding orders are never processed. The team spends hours debugging "why did our retry fix not work?"

### Preferred Alternative
Drain the queue before changing `$tries` configuration. Process remaining jobs under the original configuration, then deploy the change and restart workers.

### Refactoring Strategy
1. Stop workers or pause the specific queue
2. Process remaining jobs or move them to a hold queue
3. Deploy the `$tries` change
4. Restart workers to pick up new configuration
5. Resume or re-queue held jobs

### Detection Checklist
- [ ] `$tries` changed while jobs are in queue
- [ ] No queue drain in deployment process
- [ ] Unexpected retry counts after deploy
- [ ] "Impossible" failures observed

### Related Rules/Skills/Decision Trees
- **Rule 3**: drain-queue-before-changing-tries (`05-rules.md`)

---

## Anti-Pattern 4: Assuming Failed Jobs Auto-Retry

### Category
Design — Silent Failure

### Description
Assuming that jobs in the `failed_jobs` table are automatically retried by the framework. Failed jobs are terminal — they sit in `failed_jobs` permanently until manually retried via `queue:retry` or Horizon's retry button.

### Why It Happens
The term "retry" is used in multiple contexts (job retries, failed job retry), creating confusion. Developers familiar with other queue systems that auto-retry assume Laravel does the same.

### Warning Signs
- Team believes failed jobs are retried automatically
- No scheduled `queue:retry` command in the scheduler
- No monitoring or alerting on `failed_jobs` table
- Failed jobs sit unattended for days
- Horizon dashboard's "failed jobs" section is never checked

### Why Harmful
Critical failures go unnoticed. A payment processing job fails, but no one checks the failed jobs table. The customer doesn't receive their service, and the business doesn't realize there's an issue until the customer complains — possibly days later.

### Real-World Consequences
An `InvoiceGeneration` job fails due to a temporary database outage. The team assumes it will be auto-retried and moves on. After a week, 500 unpaid invoices have accumulated. The finance team runs a report and discovers the issue. The team must manually retry all 500 jobs and apologize to customers for the delay.

### Preferred Alternative
Treat failed jobs as terminal failures that require explicit retry. Set up monitoring on the failed jobs table and schedule automated retry where appropriate.

### Refactoring Strategy
1. Set up alerting on `failed_jobs` table (count > 0 triggers notification)
2. Add `$schedule->command('queue:retry all')->hourly()` for non-critical retryable jobs
3. For critical jobs, add immediate notification on failure via `failed()` method
4. Implement a failed job dashboard or review process
5. Educate the team that failed jobs require explicit action

### Detection Checklist
- [ ] No `queue:retry` schedule configured
- [ ] No alerting on failed jobs
- [ ] Critical `failed()` methods missing on important jobs
- [ ] Failed jobs sit for days before discovery

### Related Rules/Skills/Decision Trees
- **Rule 4**: failed-jobs-are-terminal (`05-rules.md`)
- **Decision 3**: maxExceptions vs $tries Boundary (`07-decision-trees.md`)

---

## Anti-Pattern 5: maxExceptions Mismatch With Job Behavior

### Category
Configuration — Premature Failure

### Description
Setting `maxExceptions` too low for jobs that are susceptible to timeouts or transient errors. The job may exhaust its exception limit before exhausting its retry count, causing premature permanent failure.

### Why It Happens
Developers set `maxExceptions` without considering the job's specific error profile. The default behavior (no maxExceptions) lets the job retry until `$tries` is exhausted — introducing `maxExceptions` without understanding its interaction creates a more restrictive limit than intended.

### Warning Signs
- Job fails with "too many exceptions" even though remaining retries exist
- `maxExceptions` is lower than `$tries` for jobs that encounter transient errors
- Timeout exceptions count against `maxExceptions` alongside business exceptions
- Jobs fail permanently during temporary outages (network blips, DB failover)
- Team repeatedly increases `maxExceptions` after each production incident

### Why Harmful
The job fails permanently before all retry attempts are used. A brief network timeout that the next retry would survive causes permanent failure — the job is lost until manual retry.

### Real-World Consequences
A job calls an external API with `$tries=5` and `maxExceptions=2`. The first attempt throws a timeout exception (maxExceptions=1), the second attempt throws a different transient error (maxExceptions=2, triggered). Even though the job has 3 remaining `tries`, it fails permanently. The API call that would have succeeded on the third attempt never happens, and the customer doesn't receive their service.

### Preferred Alternative
Set `maxExceptions` higher than `$tries` for timeout-susceptible jobs. Only set `maxExceptions` explicitly when different exception vs timeout behavior is needed.

### Refactoring Strategy
1. Audit all job classes with `maxExceptions` set
2. For timeout-susceptible jobs, set `maxExceptions` to `$tries + 2` or higher
3. For jobs that should fail early on exceptions (e.g., validation), set `maxExceptions <= $tries`
4. Consider removing `maxExceptions` entirely for jobs where `$tries` alone is sufficient
5. Monitor for premature permanent failures

### Detection Checklist
- [ ] `maxExceptions < $tries` for timeout-susceptible jobs
- [ ] Jobs fail permanently with remaining retries
- [ ] "Too many exceptions" failures correlate with transient outages
- [ ] No documentation of why maxExceptions is set

### Related Rules/Skills/Decision Trees
- **Decision 3**: maxExceptions vs $tries Boundary (`07-decision-trees.md`)
- **Rule 4**: failed-jobs-are-terminal (`05-rules.md`)
