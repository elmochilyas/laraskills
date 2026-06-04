# Anti-Patterns — Queued Processing

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | Queued Processing |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Synchronous Processing in Controller
2. Default Queue Sink
3. No Job Timeout Configuration
4. Missing Retry Governance
5. Idempotency Bypass

---

## 1. Synchronous Processing in Controller

### Category
Architecture

### Description
Processing webhook business logic synchronously within the HTTP controller instead of dispatching to a queue, tying up the HTTP worker and risking upstream provider timeouts.

### Why It Happens
Developers implement webhook logic directly in the controller as a natural first step, mirroring how regular API endpoints work. The queue-first pattern adds complexity (job classes, workers, monitoring) that seems unnecessary for simple processing. Performance issues only appear under load or with slow downstream operations.

### Warning Signs
- Webhook controller contains business logic beyond signature validation and storage
- Controller makes API calls, database writes, or file operations directly
- HTTP response time correlates with processing complexity
- Provider dashboard shows timeout-related retries

### Why Harmful
Synchronous processing violates the webhook receiving contract — respond quickly to acknowledge receipt. Slow responses cause upstream timeouts and automatic retries, creating duplicate processing. The HTTP worker is blocked for the entire processing duration, reducing throughput and increasing latency for all requests.

### Consequences
- Upstream providers timeout and retry, causing duplicate deliveries
- HTTP worker pool exhausted by slow webhook processing
- No automatic retry for processing failures (failure during synchronous processing is lost)
- Queue retry, backoff, and monitoring benefits are unavailable

### Alternative
Dispatch webhook processing to a queue job after signature validation, returning 200 immediately. Process business logic asynchronously in the job.

### Refactoring Strategy
1. Extract business logic from controller into a queued job class implementing `ShouldQueue`
2. Replace inline processing with `ProcessWebhook::dispatch($validatedData)->onQueue('webhooks')`
3. Configure `$tries`, `$backoff`, and job middleware on the job class
4. Verify HTTP response time stays under 1 second

### Detection Checklist
- [ ] Controller returns response within 1 second
- [ ] No business logic processing in HTTP controller
- [ ] All processing dispatched to queue jobs
- [ ] Provider dashboard shows no timeout-related retries

### Related Rules
Always Use Queue-First Processing

### Related Skills
Implement Queued Processing of Incoming Webhooks

### Related Decision Trees
Queue Dispatcher Strategy (Spatie ProcessWebhookJob vs Custom Job)

---

## 2. Default Queue Sink

### Category
Scalability

### Description
Routing all webhook processing jobs to the default queue alongside application jobs (emails, notifications, report generation), creating resource contention and cascading failures.

### Why It Happens
The default queue is the path of least resistance — `dispatch(new Job())` requires no additional configuration. Dedicated queue configuration adds complexity to Horizon setup, worker deployment, and monitoring. The isolation benefits aren't apparent until a webhook backlog impacts application responsiveness.

### Warning Signs
- Webhook jobs dispatched without `->onQueue('webhooks')` or similar
- All application queues share the same worker pool
- Webhook processing backlog delays email and notification delivery
- Application performance degrades during webhook storms

### Why Harmful
Webhook processing can spike unpredictably during promotions, partner integrations, or security events. A shared queue means this spike competes directly with all other application jobs. Slow webhook processing (API calls, data processing) blocks fast application jobs, causing cascading delays.

### Consequences
- Email and notification delivery delayed during webhook storms
- Report generation jobs queued behind large webhook batches
- Unable to isolate and scale webhook processing independently
- Harder to monitor and alert on webhook-specific queue metrics

### Alternative
Route webhook jobs to a dedicated `webhooks` queue with a separate Horizon worker pool, isolating resource consumption and enabling independent scaling.

### Refactoring Strategy
1. Configure dedicated queue name in webhook job dispatch: `->onQueue('webhooks')`
2. Add dedicated worker pool in `config/horizon.php` for the webhooks queue
3. Configure separate worker count, timeout, and memory limits for webhook pool
4. Monitor webhook queue depth independently from application queues

### Detection Checklist
- [ ] Webhook jobs dispatched to dedicated queue name
- [ ] Separate Horizon worker pool for webhook processing
- [ ] Webhook backlog does not affect application job processing
- [ ] Independent monitoring for webhook queue depth

### Related Rules
Use Dedicated Queue Workers for Webhooks

### Related Skills
Implement Queued Processing of Incoming Webhooks

### Related Decision Trees
Queue Configuration Strategy (Connection, Name, Timeout)

---

## 3. No Job Timeout Configuration

### Category
Reliability

### Description
Not configuring an explicit timeout on webhook processing jobs, allowing them to run indefinitely or using the default timeout that may be too short for production processing.

### Why It Happens
The default queue timeout (60 seconds in Laravel) works for simple jobs and testing. Developers don't consider that webhook processing involves external API calls, database operations, and business logic that may take longer. The timeout is only noticed when jobs fail under load.

### Warning Signs
- Job class has no `$timeout` property
- Webhook processing fails intermittently with queue worker timeouts
- Error logs show jobs being killed after default timeout period
- Processing time varies significantly per webhook payload

### Why Harmful
Jobs that exceed the timeout are force-killed by the queue worker, often in the middle of processing. This can leave data in an inconsistent state, cause partial writes, or mask the real failure reason. The job fails permanently as a timeout rather than being retried for the actual issue.

### Consequences
- Legitimate processing fails due to insufficient timeout
- Partial data writes from force-killed jobs
- Debugging confusion — timeout masks the underlying processing issue
- Jobs with variable processing time fail unpredictably

### Alternative
Set `$timeout` on the job class to exceed the maximum expected processing time by at least 50%, and ensure the queue worker timeout exceeds the job timeout.

### Refactoring Strategy
1. Measure actual webhook processing time under peak load
2. Set `public $timeout = 120;` or higher on webhook job classes
3. Ensure queue worker `--timeout` exceeds the job timeout
4. Monitor actual job duration and adjust timeout as needed

### Detection Checklist
- [ ] `$timeout` explicitly set on all webhook job classes
- [ ] Job timeout exceeds maximum expected processing time by 50%+
- [ ] Queue worker timeout exceeds job timeout
- [ ] No unexpected timeout failures in production

### Related Rules
Configure Job Timeout Exceeding Expected Processing Time

### Related Skills
Implement Queued Processing of Incoming Webhooks

### Related Decision Trees
Queue Configuration Strategy (Connection, Name, Timeout)

---

## 4. Missing Retry Governance

### Category
Reliability

### Description
Not configuring `$tries`, `$backoff`, or `$maxExceptions` on webhook processing jobs, relying on default behavior that either retries indefinitely without delay or fails too quickly.

### Why It Happens
Default Laravel queue behavior retries jobs indefinitely unless `$tries` is set. Developers assume this is acceptable because retries will eventually succeed. The lack of explicit retry governance means every processing failure triggers immediate retry without backoff, and transient blips exhaust the retry count.

### Warning Signs
- Job class has no `$tries`, `$backoff`, or `$maxExceptions` properties
- Same webhook fails repeatedly within seconds (immediate retry)
- Failed jobs show high attempt counts with no delay between attempts
- Webhook processing fails permanently after a brief service blip

### Why Harmful
Without explicit retry governance, every transient failure triggers immediate retry, potentially flooding the failing downstream service. A 3-second network blip can cause 10 immediate retries that all fail, exhausting the retry count for a recoverable issue. The downstream service gets no breathing room to recover.

### Consequences
- Retry storms that prevent downstream service recovery
- Jobs exhaust retry count during recoverable transient failures
- Queue resources wasted on ineffective immediate retries
- Permanent data loss for recoverable processing failures

### Alternative
Configure `$tries = 10`, `$backoff` with exponential delays (e.g., `[2, 5, 15, 30, 60, 120, 240, 480, 960, 1920]`), and `$maxExceptions = 3` to tolerate transient blips.

### Refactoring Strategy
1. Add `$tries` to webhook job class with a reasonable maximum (10)
2. Add `$backoff` array with exponential delays and jitter
3. Add `$maxExceptions = 3` to distinguish transient blips from persistent failures
4. Monitor retry attempt distribution to verify backoff effectiveness

### Detection Checklist
- [ ] `$tries` explicitly set on webhook jobs
- [ ] `$backoff` configured with exponential delays
- [ ] `$maxExceptions` set to tolerate transient failures
- [ ] No immediate retry patterns in production logs

### Related Rules
Configure Exponential Backoff with Jitter, Set $maxExceptions to 3

### Related Skills
Implement Queued Processing of Incoming Webhooks

### Related Decision Trees
Job Failure and Retry Strategy

---

## 5. Idempotency Bypass

### Category
Reliability

### Description
Not implementing idempotency checks in webhook processing jobs, allowing duplicate deliveries to cause duplicate side effects (double charges, duplicate notifications, duplicate records).

### Why It Happens
Webhook delivery is at-least-once by nature — providers may retry any webhook that doesn't receive a 200 response. Developers assume duplicates are rare and implement processing without idempotency. The first duplicate charge or notification triggers a production incident, revealing the vulnerability.

### Warning Signs
- Webhook processing creates records without uniqueness checks
- Duplicate charges, orders, or notifications in production
- No `ShouldBeUnique` trait or manual deduplication in job class
- Provider retry behavior not considered in processing logic

### Why Harmful
A webhook that triggers a payment, order fulfillment, or notification will create duplicate effects on every retry. A 5-second provider timeout can result in 3 deliveries of the same event, each creating a separate charge. The financial and reputational damage from double charges far exceeds the engineering cost of adding idempotency.

### Consequences
- Financial losses from duplicate charges
- Customer dissatisfaction from duplicate notifications
- Data corruption from duplicate records
- Difficult to detect and reverse after the fact

### Alternative
Implement idempotency checks at the start of job `handle()` using the webhook event ID as a uniqueness key, storing processed IDs in cache or database.

### Refactoring Strategy
1. Identify the unique webhook event ID from the provider's payload
2. Add idempotency check at the start of `handle()` using `Cache::add()` or database unique constraint
3. Set cache TTL appropriately (24-48 hours for typical retry windows)
4. Test by simulating duplicate deliveries and verifying no duplicate side effects

### Detection Checklist
- [ ] Idempotency check at the start of webhook job processing
- [ ] Unique webhook event IDs used as deduplication key
- [ ] Cache or database storage for processed IDs
- [ ] Duplicate delivery test verifies idempotent behavior

### Related Rules
Implement Idempotency Check at Start of handle()

### Related Skills
Implement Queued Processing of Incoming Webhooks

### Related Decision Trees
Job Failure and Retry Strategy
