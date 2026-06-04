# Anti-Patterns — Retry & Failure

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | Retry & Failure |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Immediate Retry Storm
2. Circuit Breaker Absence
3. Max Exceptions Neglect
4. Permanent Failure Black Hole
5. Failure Monitoring Blindness

---

## 1. Immediate Retry Storm

### Category
Reliability

### Description
Configuring webhook processing jobs to retry immediately without backoff, causing retry storms that flood downstream services and prevent recovery.

### Why It Happens
Developers set `$tries` on the job class but don't configure `$backoff`, leaving Laravel's default behavior of immediate retry. The assumption is that retrying quickly increases the chance of success, without considering that transient failures (network blips, rate limits, service degradation) often need time to resolve.

### Warning Signs
- Webhook job has `$tries` set but no `$backoff` property
- Failed jobs are retried within milliseconds of failure
- Downstream API logs show rapid-fire requests from retries
- Error logs show the same error repeated at high frequency

### Why Harmful
Immediate retries during a transient outage compound the problem. Each retry adds load to the already-stressed downstream service, preventing recovery. The retry storm also consumes queue worker resources, delaying processing of other webhooks and application jobs.

### Consequences
- Downstream service recovery delayed by sustained retry pressure
- Queue worker resources wasted on futile immediate retries
- Rate limits exceeded faster, compounding failure
- Log noise from repeated identical errors

### Alternative
Configure exponential backoff with jitter on webhook jobs, starting with short delays and increasing geometrically, with a configurable maximum delay.

### Refactoring Strategy
1. Add `public $backoff = [2, 5, 15, 30, 60, 120, 240, 480, 960, 1920];` to webhook job class
2. Alternatively implement `backoff()` method for dynamic delay calculation
3. Verify retry delays increase exponentially after each attempt
4. Monitor retry distribution to confirm backoff is working

### Detection Checklist
- [ ] `$backoff` configured with exponential array or dynamic method
- [ ] No immediate retry pattern in production logs
- [ ] Retry delays increase with attempt count
- [ ] Downstream services have recovery time between retries

### Related Rules
Configure Exponential Backoff with Jitter

### Related Skills
Manage Retry and Failure of Incoming Webhook Processing

### Related Decision Trees
Retry Backoff Strategy (Exponential vs Fixed)

---

## 2. Circuit Breaker Absence

### Category
Reliability

### Description
Not applying circuit breaker middleware to webhook processing jobs, allowing retries to continue hammering a failing downstream service indefinitely.

### Why It Happens
Circuit breaker middleware adds an architectural layer that seems unnecessary for simple retry scenarios. Developers rely on `$tries` alone to limit retry attempts, assuming the job will fail fast enough. The circuit breaker pattern is less familiar than basic retry configuration.

### Warning Signs
- Webhook job has only `$tries` configured, no middleware
- Downstream service logs show sustained load during outages
- Same webhook fails in batches with identical downstream errors
- Retry count exhausted quickly during prolonged outages

### Why Harmful
Without circuit breaker, every webhook job retries independently during a downstream outage. With 10 providers and 10 webhooks each, that's 100 independent retry sequences all hammering the failing service. The sustained load prevents recovery and wastes all retry capacity on futile attempts.

### Consequences
- Downstream service recovery prevented by sustained retry pressure
- All webhook processing jobs exhaust retries during a single outage
- Recovery requires manual intervention to re-process failed webhooks
- Network and compute costs for futile retry traffic

### Alternative
Apply Fuse `CircuitBreakerMiddleware` or similar to webhook job classes, stopping retry attempts when the downstream service is degraded.

### Refactoring Strategy
1. Install and configure Fuse or equivalent circuit breaker library
2. Add `CircuitBreakerMiddleware` to the job's `middleware()` method
3. Configure circuit breaker thresholds (failure count, half-open timeout)
4. Set `$tries = 0` on the job to delegate retry control to the circuit breaker
5. Monitor circuit breaker state transitions (open, half-open, closed)

### Detection Checklist
- [ ] Circuit breaker middleware applied to webhook jobs
- [ ] Circuit breaker stops retries during downstream outages
- [ ] `$tries` configured appropriately for circuit breaker delegation
- [ ] Circuit breaker state monitored

### Related Rules
Apply Circuit Breaker Middleware

### Related Skills
Manage Retry and Failure of Incoming Webhook Processing

### Related Decision Trees
Circuit Breaker Integration Strategy

---

## 3. Max Exceptions Neglect

### Category
Reliability

### Description
Not configuring `$maxExceptions` on webhook jobs, causing transient error blips to exhaust the entire retry budget and permanently fail recoverable jobs.

### Why It Happens
`$maxExceptions` is a lesser-known Laravel queue feature. Without it, every exception thrown by a job decrements the remaining retry count. Developers see `$tries = 10` and assume 10 attempts are available, not realizing that 3 rapid exceptions during a 2-second network blip consume 3 retry attempts.

### Warning Signs
- Webhook job has no `$maxExceptions` property
- Failed jobs show low attempt numbers (2-3) despite high `$tries` setting
- Error pattern shows burst of same error at same timestamp
- Jobs fail permanently after brief transient issues

### Why Harmful
A service that has a 3-second hiccup (common in cloud environments) causes every webhook job to throw an exception 3 times. Without `$maxExceptions`, each exception consumes a retry. A job with `$tries = 5` is permanently failed after one brief hiccup. The retry safety net is illusory — it protects against isolated failures but not common burst patterns.

### Consequences
- Jobs fail permanently from brief, recoverable blips
- Retry budget exhausted in seconds during transient events
- False confidence in retry configuration
- Manual retry required for every transient incident

### Alternative
Set `$maxExceptions = 3` on webhook job classes, allowing jobs to tolerate multiple exceptions without decrementing the retry count.

### Refactoring Strategy
1. Add `public $maxExceptions = 3;` to webhook job classes
2. Keep an appropriate `$tries` value (10+ for production)
3. Monitor exception patterns to tune `$maxExceptions` threshold
4. Consider higher values for jobs with multiple external dependencies

### Detection Checklist
- [ ] `$maxExceptions` configured on all webhook jobs
- [ ] Transient blips don't exhaust retry budget
- [ ] Exception burst patterns handled gracefully
- [ ] `$maxExceptions` value tuned to observed exception patterns

### Related Rules
Set $maxExceptions to Tolerate Occasional Failures

### Related Skills
Manage Retry and Failure of Incoming Webhook Processing

### Related Decision Trees
Retry Backoff Strategy (Exponential vs Fixed)

---

## 4. Permanent Failure Black Hole

### Category
Maintainability

### Description
Not providing manual retry capability for webhooks that have exhausted all automatic retry attempts, causing permanent data loss for events that could be recovered after manual intervention.

### Why It Happens
Queue job retry is automatic and invisible — when a job exhausts its retries, it moves to the `failed_jobs` table. Without explicit investment in a retry UI or command, these failed jobs remain inaccessible to operators. The assumption is that if automatic retry didn't work, the job is permanently lost.

### Warning Signs
- No Horizon/Telescope dashboard used for retrying failed webhooks
- No Artisan command exists for manual webhook retry
- Failed webhooks accumulate in the database without review
- No process for periodically retrying permanently failed webhooks

### Why Harmful
Many webhook failures are temporary but exceed the automatic retry budget: a 30-minute downstream outage exhausts 10 retries with exponential backoff. Without manual retry, these events are permanently lost. The downstream service may recover minutes after the last retry, but the webhook data is gone.

### Consequences
- Permanent data loss from recoverable failures
- Customer-facing impact from missed webhook events
- No operational path to recover from incidents
- Trust in webhook reliability eroded

### Alternative
Provide a dashboard (Horizon/Telescope) or Artisan command for manually retrying failed webhooks.

### Refactoring Strategy
1. Enable Horizon dashboard for failed job review and retry
2. Create an Artisan command `webhooks:retry {id}` that resets and re-dispatches failed webhooks
3. Implement a batch retry option for reprocessing all failed webhooks from a specific provider
4. Document the manual retry procedure for on-call engineers

### Detection Checklist
- [ ] Manual retry UI or command available for failed webhooks
- [ ] Operators can retry individual or batch failed webhooks
- [ ] Retry procedure documented in runbook
- [ ] Failed webhooks reviewed regularly for retry opportunity

### Related Rules
Implement Manual Retry for Failed Webhooks

### Related Skills
Manage Retry and Failure of Incoming Webhook Processing

### Related Decision Trees
Final Failure Escalation Strategy

---

## 5. Failure Monitoring Blindness

### Category
Observability

### Description
Not monitoring webhook failure rates, allowing silent accumulation of processing failures that go undetected until a customer reports missing data or a downstream integration breaks.

### Why It Happens
Queue job failures are technical events that don't directly affect the application's user-facing behavior — the HTTP endpoint returns 200 regardless. Without explicit monitoring, these failures accumulate silently in the `failed_jobs` table. The operational impact only becomes visible when the webhook subscriber notices missing data.

### Warning Signs
- No alerting on webhook failure rates
- Failed webhook count in database grows without notice
- Webhook events stop flowing but HTTP endpoint remains healthy
- Customer reports of missing data trigger investigation

### Why Harmful
Silent failures in webhook processing can accumulate for days or weeks before detection. During this time, all webhook events from affected providers are lost. The gap between the first failure and detection represents potentially massive data loss. Recovery requires replaying events from the provider, which may not be possible for all events.

### Consequences
- Extended periods of undetected webhook processing failure
- Massive data loss before detection
- Provider replay windows may have expired
- Reputational damage from missed events

### Alternative
Track webhook failure rates per provider, alert on abnormal increases, and set up a dashboard for real-time monitoring.

### Refactoring Strategy
1. Listen to `FinalWebhookCallFailedEvent` for permanent failures
2. Implement per-provider failure rate metrics
3. Set up alert thresholds (e.g., >5% failure rate over 5 minutes)
4. Create a monitoring dashboard with webhook throughput, success rate, and failure rate
5. Integrate with incident management for critical failure thresholds

### Detection Checklist
- [ ] Webhook failure rate monitored per provider
- [ ] Alerts configured for abnormal failure rate increases
- [ ] Dashboard shows real-time webhook processing health
- [ ] Failure rate trends reviewed regularly

### Related Rules
Monitor Failed Webhook Rates

### Related Skills
Manage Retry and Failure of Incoming Webhook Processing

### Related Decision Trees
Final Failure Escalation Strategy
