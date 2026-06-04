# Anti-Patterns: Dead-Letter Queue Pattern and Poison Messages

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K023 — Dead-Letter Queue and Poison Messages |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No Poison Message Detection | Reliability | Critical |
| 2 | DLQ Without Monitoring | Observability | High |
| 3 | Infinite DLQ Reprocessing Loop (No Cool-Off) | Reliability | Critical |
| 4 | Using `failed_jobs` Table as a Dead-Letter Queue | Design | Medium |
| 5 | Infrastructure DLQ Without Application Fallback | Operations | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Poison Messages Burning Retry Attempts Undetected | dead-letter-queue-pattern, failure-taxonomy | High |
| No DLQ for Terminal Failures | dead-letter-queue-pattern, retry-workflow | High |
| Growing DLQ Without Alerting | dead-letter-queue-pattern | Medium |

---

## Anti-Pattern 1: No Poison Message Detection

### Category
Reliability — Wasted Retries

### Description
Not implementing poison message detection — jobs that can never succeed (invalid data, deleted model, revoked API key) burn through all retry attempts before permanently failing. Each retry wastes worker time, queue capacity, and log storage.

### Why It Happens
Teams configure retries assuming transient failures. They don't distinguish between temporary errors (network blip) and permanent errors (invalid payload). The retry mechanism treats all failures the same.

### Warning Signs
- Jobs consistently fail on the same exception across all retries
- All retry attempts consumed for the same permanent error
- Worker capacity wasted on doomed retries
- High ratio of retries to unique failed jobs
- `failed_jobs` table shows many entries with identical exception patterns

### Why Harmful
A poison message with `$tries=10` burns 9 retries before landing in `failed_jobs`. At scale, 100 poison messages x 9 retries = 900 wasted job executions. Each execution includes serialization/deserialization, database writes, backoff delays, and log entries — all completely wasted.

### Real-World Consequences
A data import job processes 50,000 records. 200 records have invalid data (missing required fields). Each record creates a job that fails immediately with a validation error. `$tries = 5`. 200 jobs x 4 wasted retries = 800 wasted worker executions. Each retry takes 500ms (serialization, queue push, log write). 800 x 500ms = 400 seconds of wasted worker time. The valid records wait behind the poison messages, delaying legitimate processing.

### Preferred Alternative
Implement poison message detection: detect jobs that fail rapidly on early retries and redirect to DLQ immediately.

### Refactoring Strategy
1. Add time-to-failure detection: if first retry fails in <100ms, it's likely a poison message
2. After 2 rapid failures, mark the job as poison and dispatch to DLQ
3. Fail the job immediately: `$this->fail('Poison message')`
4. Log poison message detection for monitoring
5. Set up alerting on poison message rate increase

### Detection Checklist
- [ ] No poison message detection
- [ ] Jobs burn all retries on permanent errors
- [ ] High retry-to-unique-failure ratio
- [ ] Worker capacity wasted on doomed executions

### Related Rules/Skills/Decision Trees
- **Rule 1**: implement-poison-message-detection (`05-rules.md`)
- **Decision**: Poison Message Detection Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 2: DLQ Without Monitoring

### Category
Observability — Silent Failure Accumulation

### Description
Implementing a dead-letter queue without monitoring its depth or the age of its oldest message. The DLQ becomes a "black hole" — failed jobs go in and never come out, and nobody notices until the backlog is massive.

### Why It Happens
Teams focus on implementing the DLQ routing but forget the monitoring piece. The DLQ inherently feels like "storage" rather than "processing pipeline."

### Warning Signs
- DLQ depth is unknown — no dashboard or alert
- Oldest message age in DLQ is unspecified
- Periodic manual checks of DLQ are the only monitoring
- Team discovers DLQ buildup only during incidents
- DLQ has thousands of messages but no alert triggered

### Why Harmful
A growing DLQ indicates a systemic failure (invalid data format, API change, bug). Without monitoring, the systemic failure goes undetected. Jobs keep failing, keep going to DLQ, and the backlog grows. By discovery time, hundreds or thousands of jobs have failed silently.

### Real-World Consequences
A third-party API changes its response format. All jobs calling this API fail validation and go to the DLQ. The DLQ grows: 10 jobs/hour, then 50, then 200. After 72 hours, 14,400 jobs are in the DLQ. The team discovers this during a routine review — 3 days of data processing has been silently lost. Recovery requires replaying 14,400 jobs, which takes another 2 days.

### Preferred Alternative
Monitor DLQ depth and oldest message age. Alert on anomalies.

### Refactoring Strategy
1. Add monitoring query: `Queue::size('dead-letter')`
2. Schedule check every 5 minutes
3. Alert if DLQ depth > 100 or oldest message > 1 hour
4. Create a dashboard panel for DLQ metrics
5. Set up weekly DLQ review in team operations

### Detection Checklist
- [ ] DLQ depth not monitored
- [ ] Oldest message age unknown
- [ ] Silent failure accumulation
- [ ] No alerting on DLQ metrics

### Related Rules/Skills/Decision Trees
- **Rule 2**: monitor-dlq-depth-and-age (`05-rules.md`)
- **Skill**: Implement a Dead-Letter Queue (`06-skills.md`)

---

## Anti-Pattern 3: Infinite DLQ Reprocessing Loop (No Cool-Off)

### Category
Reliability — Resource Burn

### Description
Implementing DLQ reprocessing that immediately re-dispatches failed jobs to the main queue. If the underlying issue hasn't resolved, jobs fail again, go back to DLQ, are immediately reprocessed — creating an infinite loop that burns worker resources.

### Why It Happens
Teams set up automatic reprocessing from DLQ to solve the "what about retry?" question. They don't add a delay before reprocessing. The reprocessing runs on a timer or event that triggers immediately after the job enters the DLQ.

### Warning Signs
- DLQ reprocessing runs more than once per hour
- Same job appears in DLQ multiple times with the same exception
- `failed_jobs` shows the same job failing identically on each pass
- Worker load is high even when no new jobs are dispatched
- No delay between DLQ→queue cycles

### Why Harmful
The DLQ→reprocess→fail→DLQ cycle can complete in seconds. Workers spin in an infinite loop of failing and reprocessing the same jobs. The underlying issue never gets time to resolve (API outage, data fix, config change). Worker capacity is consumed by the loop instead of processing real work.

### Real-World Consequences
A DLQ reprocessing script runs every 5 minutes. It takes all jobs from DLQ and re-dispatches them. The underlying API has been down for 2 hours. Each re-dispatched job fails in 2 seconds and goes back to DLQ. In 5 minutes, the next script run finds them and re-dispatches again. This loop produces 12 cycles per hour x 500 jobs = 6,000 wasted job executions per hour. Workers are saturated with the reprocessing loop, delaying processing of real jobs.

### Preferred Alternative
Implement DLQ reprocessing with a cool-off period (e.g., 1 hour). Only reprocess jobs that have been in the DLQ for at least the cool-off period.

### Refactoring Strategy
1. Add `failed_at` timestamp tracking in DLQ
2. Only reprocess jobs where `failed_at < now() - coolOffPeriod`
3. Set cool-off period based on expected issue resolution time (1 hour minimum)
4. Log each reprocessing attempt and its outcome
5. If same job fails 3 times after reprocessing, stop reprocessing and alert

### Detection Checklist
- [ ] No cool-off period in DLQ reprocessing
- [ ] Immediate re-dispatch from DLQ
- [ ] Same job fails identically across reprocessing cycles
- [ ] High worker load from reprocessing loop

### Related Rules/Skills/Decision Trees
- **Rule 3**: dlq-reprocessing-with-cool-off (`05-rules.md`)
- **Skill**: Implement a Dead-Letter Queue (`06-skills.md`)

---

## Anti-Pattern 4: Using `failed_jobs` Table as a Dead-Letter Queue

### Category
Design — Passive Storage vs Active Queue

### Description
Treating the `failed_jobs` database table as a dead-letter queue. `failed_jobs` is passive storage — it can't route messages, apply backpressure, or prioritize based on severity. A true DLQ uses a queue that can be monitored for depth, processed with priority, and routed to different workers.

### Why It Happens
`failed_jobs` is the default failure mechanism in Laravel. It stores the full job payload and exception, making it the obvious place to look for permanently failed jobs. Teams don't realize a queue-based DLQ provides additional capabilities.

### Warning Signs
- `failed_jobs` is the only failure mechanism — no queue-based DLQ
- Team can't prioritize or route different types of failures differently
- No way to apply backpressure when failure rates spike
- Manual triage of `failed_jobs` is the standard workflow
- Retry from `failed_jobs` is done manually via `queue:retry`

### Why Harmful
All failures are treated equally — a critical payment failure and a trivial logging failure sit side by side in the same table. There's no way to route high-priority failures to dedicated workers. The `failed_jobs` table becomes a catch-all that grows unbounded without pruning.

### Real-World Consequences
A production issue causes 10,000 validation failures and 3 critical payment API failures. Both types end up in `failed_jobs`. The team monitoring `failed_jobs` sees "10,003 failures" and panics. They assume it's all from the validation issue. They fix the validation data. Meanwhile, the 3 payment failures sit unnoticed in the noise. Customers aren't charged. The finance team discovers the missing charges 3 days later.

### Preferred Alternative
Use a queue-based DLQ for routing and triage. Use `failed_jobs` as the permanent audit trail.

### Refactoring Strategy
1. Implement queue-based DLQ for each failure criticality level
2. Route critical failures (payments, orders) to high-priority DLQ queue
3. Route non-critical failures (logging, analytics) to low-priority DLQ queue
4. Retain `failed_jobs` as the permanent storage/audit trail
5. Monitor each DLQ queue separately with appropriate thresholds

### Detection Checklist
- [ ] `failed_jobs` used as the only failure mechanism
- [ ] No queue-based DLQ for routing/priority
- [ ] All failure types treated equally
- [ ] No backpressure or priority processing

### Related Rules/Skills/Decision Trees
- **Rule 4**: no-failed-jobs-as-dlq (`05-rules.md`)
- **Decision**: Application-Level DLQ vs Infrastructure-Level DLQ (`07-decision-trees.md`)

---

## Anti-Pattern 5: Infrastructure DLQ Without Application Fallback

### Category
Operations — Missing Application-Level Fallback

### Description
Relying solely on infrastructure-level DLQ (SQS Redrive Policy, RabbitMQ DLX) without an application-level fallback. Infrastructure DLQs handle broker-specific failures but can't implement application-level routing logic, poison message detection, or custom retry policies.

### Why It Happens
Infrastructure DLQ is easy to configure and "just works." Teams don't think about failure modes that the broker can't detect — like logical validation errors or business rule violations.

### Warning Signs
- Infrastructure DLQ configured but no `failed()` method on job classes
- Jobs fail due to application-level errors (validation, missing data) but go to infrastructure DLQ
- No poison message detection in application code
- No custom triage for different failure types
- Team assumes infrastructure DLQ handles everything

### Why Harmful
Infrastructure DLQ routes messages based on broker-level criteria (`maxReceiveCount`, dead-letter exchanges). It can't detect that a message is poison because of invalid data (application-level concern). The message will be retried up to `maxReceiveCount`, then moved to DLQ — all retries wasted.

### Real-World Consequences
An SQS queue has a Redrive Policy that moves messages to DLQ after 3 receives. Jobs with invalid payloads fail immediately, are retried by the worker (2 more times in SQS terms), then moved to the infrastructure DLQ. 3 attempts each = 2 wasted retries per message. With 1,000 poison messages, 2,000 wasted executions. The application has no `failed()` method, so no cleanup or alerting fires.

### Preferred Alternative
Combine infrastructure DLQ (for broker-level failures) with application-level DLQ (for logic-level failures). Always implement `failed()`.

### Refactoring Strategy
1. Keep infrastructure DLQ for connectivity/visibility failures
2. Add application-level DLQ routing in `failed()` for logic failures
3. Implement poison message detection at application level
4. Route different failure types to different DLQ queues
5. Document which failures go to infrastructure vs application DLQ

### Detection Checklist
- [ ] Infrastructure DLQ without application-level `failed()`
- [ ] App-level errors not routed by infrastructure DLQ
- [ ] No poison message detection
- [ ] No custom triage for failure types

### Related Rules/Skills/Decision Trees
- **Decision**: Application-Level DLQ vs Infrastructure-Level DLQ (`07-decision-trees.md`)
