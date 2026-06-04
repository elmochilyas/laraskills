# Anti-Patterns: Failed Job Events (`Queue::failing`)

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K022 — Failed Job Events |
| Classification | Foundation |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Heavy I/O in Queue::failing Listener | Performance | High |
| 2 | Not Filtering Failure Types in Global Listener | Observability | High |
| 3 | Registering Listeners in Wrong Scope (Accumulation) | Reliability | Critical |
| 4 | Using Queue::failing for Job-Specific Cleanup | Design | Medium |
| 5 | No Queue::failing Listener at All | Observability | High |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Centralized Failure Monitoring | failed-job-events, failed-jobs-storage | High |
| Duplicate Failure Handling (Event + Per-Job Logging) | failed-job-events, failed-method-cleanup | Medium |

---

## Anti-Pattern 1: Heavy I/O in Queue::failing Listener

### Category
Performance — Worker Blocked

### Description
Performing synchronous heavy I/O (HTTP calls to Slack, PagerDuty, external APIs) directly in a `Queue::failing` event listener. The listener is synchronous — it blocks the worker from returning to job processing until the I/O completes.

### Why It Happens
Developers register the simplest possible listener — a closure that makes an API call. They don't consider synchronous blocking because the failure event feels like a "fire and forget" notification.

### Warning Signs
- Listeners making `Http::post()`, `Mail::send()`, or similar synchronous I/O calls
- High failure rate causes worker throughput to drop (blocked on notifications)
- Workers spend more time sending alerts than processing jobs
- Backlog grows during failure bursts
- `Queue::failing` listener timing dominates worker performance metrics

### Why Harmful
A Slack webhook that takes 500ms blocks the worker for 500ms. During a failure burst (100 failures/minute), the worker spends 50 seconds/minute sending Slack messages instead of processing jobs — a 45% reduction in throughput.

### Real-World Consequences
A team registers a `Queue::failing` listener that sends a PagerDuty alert via HTTP. The PagerDuty API response time averages 800ms. A configuration error causes 500 jobs to fail in 5 minutes. The workers are blocked for 400 seconds (800ms x 500) sending PagerDuty alerts. During this time, 400 seconds of job processing capacity is lost, and the queue backlog grows by 400 job-seconds.

### Preferred Alternative
Keep listeners lightweight (log, increment counter). Dispatch heavy operations (Slack, PagerDuty) as queued jobs.

### Refactoring Strategy
1. Move HTTP calls out of the listener into a queued job
2. Keep only lightweight operations in the listener: logging, counter increment
3. Dispatch a queued notification job for each failure
4. Monitor listener execution time — alert if average > 50ms
5. Under high failure rates, consider sampling (notify on every Nth failure)

### Detection Checklist
- [ ] Heavy I/O in `Queue::failing` listener
- [ ] Worker throughput drops during failure bursts
- [ ] Listener execution time > 50ms
- [ ] Slack/PagerDuty dispatched synchronously

### Related Rules/Skills/Decision Trees
- **Rule 1**: keep-failing-listeners-lightweight (`05-rules.md`)
- **Skill**: Listen to Queue::failing (`06-skills.md`)

---

## Anti-Pattern 2: Not Filtering Failure Types in Global Listener

### Category
Observability — Alert Fatigue

### Description
A `Queue::failing` listener that handles ALL failures without filtering by exception type, queue, or connection. Transient failures (rate limits, timeouts) trigger the same alert as systemic failures (validation errors, database outages) — causing alert fatigue.

### Why It Happens
Developers register a single listener that fires on every failure. They don't distinguish between failure types because the initial implementation is "just log it."

### Warning Signs
- Single `Queue::failing` listener handling all exceptions
- PagerDuty/Slack alerts for every failure including rate limits
- Operators learn to ignore failure alerts due to high noise
- Real systemic failures are buried in the noise
- No filtering by exception class, queue name, or connection

### Why Harmful
Alert fatigue sets in when 90% of failure notifications are transient noise. Operators stop responding to failure alerts. A genuine systemic failure (database down, service unavailable) triggers the same notification as a rate limit — and is ignored alongside the noise.

### Real-World Consequences
A team has a `Queue::failing` listener that fires on every failure and sends a Slack message. A third-party API has frequent rate limits (5-10/min) during peak hours. The Slack channel receives hundreds of rate limit failure messages per hour. The team pins the channel. Two weeks later, the same API changes its endpoint and all jobs begin failing with 404 errors. The Slack channel shows these alongside rate limit messages — the team doesn't notice the new error type for 4 hours.

### Preferred Alternative
Filter `Queue::failing` listeners by exception type, queue, or connection. Route different failure types to different channels.

### Refactoring Strategy
1. Classify failure types: transient (rate limits, timeouts) vs permanent (validation, data)
2. Add filtering to the listener: `if ($event->exception instanceof RateLimitException) { return; }`
3. Route transient failures to a low-priority notification channel
4. Route permanent failures to a high-priority channel (PagerDuty)
5. Log all failures but only alert on actionable types

### Detection Checklist
- [ ] No exception type filtering in listener
- [ ] Transient and permanent failures treated identically
- [ ] Alert fatigue from noise
- [ ] No routing to different notification channels

### Related Rules/Skills/Decision Trees
- **Rule 2**: use-for-infrastructure-monitoring (`05-rules.md`)
- **Decision**: Event-Based vs Direct Notification (`07-decision-trees.md`)

---

## Anti-Pattern 3: Registering Listeners in Wrong Scope (Accumulation)

### Category
Reliability — Memory Leak and Duplicate Execution

### Description
Registering `Queue::failing` listeners inside controllers, commands, or other code that runs repeatedly in a daemon worker. Each registration adds a new listener without removing the previous one — listeners accumulate, causing memory growth and duplicate execution.

### Why It Happens
Developers don't understand the difference between short-lived web requests and long-lived daemon workers. In a daemon worker, service providers boot once — if listeners are registered in a loop, each iteration adds a new listener.

### Warning Signs
- `Queue::failing` registered in a controller or command
- Worker memory usage grows over time
- Each failure triggers the same listener multiple times (duplicate logs, duplicate notifications)
- `Queue::failing` listener count increases with job count
- Worker restart resolves "memory leak" temporarily

### Why Harmful
After processing 10K jobs, 10K identical listeners are registered. On each failure, all 10K execute — logging 10K identical entries, sending 10K duplicate notifications. Memory grows linearly with job count. The worker eventually runs out of memory and crashes.

### Real-World Consequences
A team registers `Queue::failing` in a job middleware that runs before each job. After 50,000 jobs, 50,000 listeners are registered. A failure occurs — 50,000 logs are written, 50,000 Slack notifications are dispatched (rate limited by Slack after the first 10). Worker memory is at 500MB and growing. The worker crashes 10 minutes later.

### Preferred Alternative
Register `Queue::failing` listeners in `AppServiceProvider::boot()` — once per worker lifecycle.

### Refactoring Strategy
1. Move all `Queue::failing` registrations to `AppServiceProvider::boot()` or dedicated service provider
2. Remove registrations from controllers, commands, and middleware
3. If dynamic listener configuration is needed: unregister old listeners before registering
4. Verify worker memory is stable over long-running sessions
5. Add listener count metric to detect accumulation

### Detection Checklist
- [ ] `Queue::failing` registered outside service provider
- [ ] Worker memory grows over time
- [ ] Duplicate listener execution on each failure
- [ ] Listener count proportional to job count

### Related Rules/Skills/Decision Trees
- **Rule 3**: prevent-listener-accumulation (`05-rules.md`)
- **Skill**: Listen to Queue::failing (`06-skills.md`)

---

## Anti-Pattern 4: Using Queue::failing for Job-Specific Cleanup

### Category
Design — Wrong Abstraction

### Description
Using the global `Queue::failing` listener to perform job-specific cleanup (refund order, release lock, invalidate cache). `Queue::failing` fires for ALL failures — job-specific cleanup in the global listener requires type-checking and duplicating logic that belongs in each job's `failed()` method.

### Why It Happens
Developers find one place for all failure handling and put everything there. They don't separate cross-cutting concerns (monitoring) from job-specific concerns (cleanup).

### Warning Signs
- `Queue::failing` listener has `if ($event->job->resolveName() === 'ProcessOrder')` type checks
- Duplicate cleanup logic for similar jobs
- Adding a new job class requires updating the global listener
- Listener has extensive business logic, not just infrastructure monitoring
- Job-specific cleanup is in the listener instead of the job's `failed()` method

### Why Harmful
Tight coupling: adding a new job class requires modifying the global listener. The listener grows with business logic, making it harder to maintain. Job classes aren't self-contained — cleanup logic is hidden in a global listener.

### Real-World Consequences
A `Queue::failing` listener handles cleanup for 15 different job classes. Each has `if/elseif` branches for specific cleanup logic. Adding a 16th job class requires editing the listener. A developer misses the listener during a job refactor — the job's cleanup logic is now incorrect but the listener still has the old logic. The listener is 300 lines of business logic that belongs in individual job classes.

### Preferred Alternative
Use `Queue::failing` for infrastructure monitoring only. Use each job's `failed()` method for job-specific cleanup.

### Refactoring Strategy
1. Extract job-specific logic from the listener into each job's `failed()` method
2. Simplify the listener to: log failure, increment metric, dispatch async notification
3. Remove all `if ($event->job->resolveName() === ...)` branches
4. Verify each job class has its own `failed()` method for cleanup
5. Test that cleanup runs correctly after extraction

### Detection Checklist
- [ ] Global listener has job-specific type checks
- [ ] Cleanup logic spread across listener and job classes
- [ ] Adding new jobs requires updating listener
- [ ] Listener contains business logic

### Related Rules/Skills/Decision Trees
- **Rule 2**: use-for-infrastructure-monitoring (`05-rules.md`)
- **Decision**: Global vs Per-Job Failure Handling (`07-decision-trees.md`)

---

## Anti-Pattern 5: No Queue::failing Listener at All

### Category
Observability — Blind to Failures

### Description
Not registering any `Queue::failing` listener. Permanent job failures go undetected by monitoring — no logging, no metrics, no alerting. The only visibility is checking `failed_jobs` table manually.

### Why It Happens
Teams rely on Horizon's built-in failure display or assume `failed_jobs` storage is sufficient. They don't set up proactive failure notification.

### Warning Signs
- No `Queue::failing` listener registered
- No central logging of job failures
- No alerting on failure rate thresholds
- Failures discovered only during manual dashboard review
- Team is surprised by production failures they "didn't know about"

### Why Harmful
Job failures become invisible. A failure rate spike from 1/hour to 100/hour goes unnoticed until a user complains. Systemic failures (API changes, data issues) silently degrade the system with no operational visibility.

### Real-World Consequences
A third-party API adds a new required header. All jobs calling this API begin failing. No `Queue::failing` listener is registered — no logs, no alerts. The `failed_jobs` table grows from 10 rows to 3,000 rows over the weekend. On Monday, the on-call engineer checks Horizon and sees the failures. The backlog of 3,000 failed jobs takes 4 hours to reprocess.

### Preferred Alternative
Register at minimum a logging `Queue::failing` listener. Add alerting on failure thresholds.

### Refactoring Strategy
1. Add a `Queue::failing` listener in `AppServiceProvider::boot()`
2. At minimum: log the failure with job name and exception message
3. Add failure rate metric (Prometheus counter, Redis counter)
4. Set up alert: if failure rate > threshold over 5 minutes
5. Add dashboard panel showing failure rate by job type

### Detection Checklist
- [ ] No `Queue::failing` listener registered
- [ ] No centralized failure logging
- [ ] Failures discovered only via manual `failed_jobs` check
- [ ] No failure rate alerting

### Related Rules/Skills/Decision Trees
- **Decision**: Event-Based vs Direct Notification (`07-decision-trees.md`)
