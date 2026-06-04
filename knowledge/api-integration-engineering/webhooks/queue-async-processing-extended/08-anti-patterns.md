# Anti-Patterns — Laravel Queue Integration for Async Webhook Processing

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | Laravel Queue Integration for Async Webhook Processing |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Default Queue Contamination
2. Retry Configuration Vacuum
3. Model Serialization Payload Bloat
4. Transaction Dispatch Desync
5. Rate Limit Absence in Job Processing

---

## 1. Default Queue Contamination

### Category
Architecture

### Description
Dispatching webhook processing jobs on the default queue alongside application jobs without isolation, allowing webhook processing issues to cascade to application-critical tasks.

### Why It Happens
The path of least resistance is `dispatch(new Job())` without specifying a queue. The default queue works correctly during development where volume is low. The isolation benefits of dedicated queues only become apparent during production incidents when a webhook backlog delays email delivery or notification processing.

### Warning Signs
- Webhook jobs dispatched without `->onQueue('webhooks')`
- No `$queue` property on webhook job classes
- Application job delays correlate with webhook volume spikes
- Horizon dashboard shows all job types on the same queue

### Why Harmful
Webhook processing often involves slow external API calls, retries with backoff, and variable processing time. A single slow webhook job blocks the entire queue, delaying all other jobs behind it. An email notification that should be sent in seconds waits minutes behind webhook processing. The cascading delay affects the entire application.

### Consequences
- Email and notification delivery delayed during webhook storms
- Application responsiveness degraded by webhook backlogs
- Cannot scale webhook workers independently
- Webhook retries delay application-critical jobs

### Alternative
Route webhook jobs to a dedicated `webhooks` queue with separate worker pool, isolating webhook processing from application jobs.

### Refactoring Strategy
1. Add `public $queue = 'webhooks';` to all webhook job classes
2. Configure dedicated worker pool in `config/horizon.php` for the webhooks queue
3. Set appropriate worker count, timeout, and memory limits for webhook pool
4. Monitor webhook queue depth independently

### Detection Checklist
- [ ] Webhook jobs dispatched to dedicated queue
- [ ] Separate worker pool for webhook processing
- [ ] Webhook backlog does not affect application jobs
- [ ] Independent monitoring for webhook queue depth

### Related Rules
Always Route Webhook Jobs to a Dedicated Queue

### Related Skills
Queue Incoming Webhook Processing for Async Handling

### Related Decision Trees
Queue Isolation Strategy (Dedicated vs Shared Queue)

---

## 2. Retry Configuration Vacuum

### Category
Reliability

### Description
Not configuring `$tries`, `$backoff`, and `$maxExceptions` on webhook processing jobs, relying on default unlimited retry behavior that either retries forever or fails too aggressively.

### Why It Happens
Default Laravel queue behavior retries jobs indefinitely. Developers implement `ShouldQueue` without considering retry governance. The job works in testing where it always succeeds. The retry configuration seems irrelevant until a downstream outage causes infinite retry loops.

### Warning Signs
- Webhook job class has no `$tries`, `$backoff`, or `$maxExceptions` properties
- Failing jobs retry indefinitely without escalating
- Same webhook fails repeatedly with millisecond-interval retries
- Failed jobs table receives no entries because retries never exhaust

### Why Harmful
Without `$tries`, jobs retry forever on permanent failures, consuming queue workers and delaying other jobs. Without `$backoff`, retries are immediate, flooding the failing downstream service. Without `$maxExceptions`, a brief transient blip exhausts the entire retry budget.

### Consequences
- Infinite retry loops on permanent failures
- Immediate retry storms during transient outages
- Retry budget consumed by transient blips instead of persistent issues
- No escalation path for permanently failing jobs

### Alternative
Set explicit `$tries` (10), `$backoff` array with exponential delays, and `$maxExceptions` (3) on every webhook job class.

### Refactoring Strategy
1. Add `public $tries = 10;` to webhook job classes
2. Add `public $backoff = [2, 5, 15, 30, 60, 120, 240, 480, 960, 1920];`
3. Add `public $maxExceptions = 3;`
4. Verify retry behavior in test with simulated failures
5. Monitor retry distribution to confirm backoff

### Detection Checklist
- [ ] `$tries` explicitly set on webhook jobs
- [ ] `$backoff` configured with growing delays
- [ ] `$maxExceptions` set for transient tolerance
- [ ] No infinite retry loops in production

### Related Rules
Set Explicit tries and backoff Properties on Every Webhook Job

### Related Skills
Queue Incoming Webhook Processing for Async Handling

### Related Decision Trees
Job Retry Configuration Strategy

---

## 3. Model Serialization Payload Bloat

### Category
Performance

### Description
Passing full Eloquent models to webhook queue jobs instead of model IDs, creating large job payloads that consume memory and fail on schema changes.

### Why It Happens
Passing `$webhookCall` directly to the job constructor is the most natural code: `dispatch(new ProcessJob($webhookCall))`. The developer doesn't consider serialization overhead until queue memory usage spikes or jobs fail after schema migrations.

### Warning Signs
- Job constructor accepts Eloquent model instances
- Job payload size in queue exceeds 10KB for simple jobs
- Failed jobs after schema migrations with serialization errors
- Redis memory usage correlates with webhook job count

### Why Harmful
Eloquent models serialize all loaded attributes and relationships. A `WebhookCall` with loaded relations can be 50-100KB serialized. With 10,000 webhooks per day, that's 500MB-1GB of queue storage daily. Schema changes break deserialization of queued jobs, causing permanent failures for jobs dispatched before the migration.

### Consequences
- Excessive Redis/Database memory consumption
- Jobs fail after schema migrations with serialization errors
- Longer queue latency from large payload transfer
- Higher network bandwidth between application and queue server

### Alternative
Pass only the model ID (primary key) to the job and re-query the model inside `handle()`.

### Refactoring Strategy
1. Change job constructor to accept `int $webhookCallId`
2. Re-query model: `$webhookCall = WebhookCall::findOrFail($this->webhookCallId)`
3. Update all dispatch calls to pass ID instead of model
4. Verify job payload size reduction after change

### Detection Checklist
- [ ] Jobs accept IDs, not model instances
- [ ] Models re-queried inside `handle()`
- [ ] Job payload size under 1KB
- [ ] No serialization errors after schema migrations

### Related Rules
Never Pass Full Eloquent Models to Queue Jobs

### Related Skills
Queue Incoming Webhook Processing for Async Handling

### Related Decision Trees
Queue Isolation Strategy (Dedicated vs Shared Queue)

---

## 4. Transaction Dispatch Desync

### Category
Reliability

### Description
Dispatching webhook processing jobs inside database transactions before the transaction is committed, causing jobs to process data that doesn't exist if the transaction rolls back.

### Why It Happens
Developers dispatch jobs inside transaction callbacks for convenience, assuming the transaction will commit. The code is concise and works in the happy path. The scenario of a transaction rollback mid-way is not considered — the job is already queued and will process phantom data.

### Warning Signs
- `dispatch()` called inside `DB::transaction()` closure
- Job processing errors for missing records that should exist
- Jobs process "deleted" data after failed transactions
- Inconsistent state between job results and database

### Why Harmful
When a transaction rolls back after job dispatch, the job is already queued with data references that don't exist in the database. The job processes phantom data, creates side effects based on non-existent records, or fails with `ModelNotFoundException`. The inconsistency is difficult to debug because the error message points to missing data, not a transaction ordering issue.

### Consequences
- Jobs process data that never committed
- Phantom records created from rolled-back transactions
- Hard-to-debug `ModelNotFoundException` errors
- Data integrity violations

### Alternative
Use `dispatchAfterCommit()` or `dispatchIfCommitted()` when dispatching jobs inside transactions.

### Refactoring Strategy
1. Identify all `dispatch()` calls inside transaction closures
2. Replace with `dispatchAfterCommit()` or `dispatchIfCommitted()`
3. For jobs dispatched outside transactions, verify they don't assume committed state
4. Test with forced transaction rollback to verify jobs are not dispatched

### Detection Checklist
- [ ] Jobs inside transactions use `dispatchAfterCommit()`
- [ ] Transaction rollback prevents job dispatch
- [ ] Jobs assume committed data exists
- [ ] No phantom data from rolled-back transactions

### Related Rules
Use dispatchAfterCommit Within Database Transactions

### Related Skills
Queue Incoming Webhook Processing for Async Handling

### Related Decision Trees
Job Retry Configuration Strategy

---

## 5. Rate Limit Absence in Job Processing

### Category
Reliability

### Description
Not applying rate limiting middleware to webhook processing jobs that make downstream API calls, allowing job bursts to overwhelm external services.

### Why It Happens
Rate limiting is typically implemented at the HTTP layer for API endpoints. Developers don't consider that queue jobs also need rate limiting — they assume job timing naturally spaces out requests. During catch-up scenarios (provider delivery backlog, queue recovery), jobs process in rapid succession and hammer the downstream API.

### Warning Signs
- Webhook job makes external API calls without rate limiting
- Downstream API returns 429 errors during webhook bursts
- Job failures spike after queue backlog is cleared
- No `RateLimited` middleware on webhook job classes

### Why Harmful
A queue backlog of 1000 webhooks after a provider downtime is processed as fast as workers can execute. Without rate limiting, all 1000 jobs immediately call the downstream API, causing rate limit errors, service degradation, or IP blocking. The retry mechanism then re-processes all 1000 jobs, creating a thundering herd pattern that compounds the problem.

### Consequences
- Downstream API rate limits exceeded
- IP blocking or temporary account suspension
- All webhook jobs fail simultaneously, overwhelming failed job storage
- Recovery delayed by repeated retry storms

### Alternative
Apply `RateLimited` middleware to webhook job classes, limiting the rate of downstream API calls to match the service's capacity.

### Refactoring Strategy
1. Identify webhook jobs that make external API calls
2. Add `RateLimited` middleware to the job's `middleware()` method
3. Configure rate limit based on downstream API's documented limits (with 20% headroom)
4. For multi-provider jobs, scope rate limit by provider
5. Monitor downstream API response codes to verify rate limiting effectiveness

### Detection Checklist
- [ ] Rate limiting middleware on all webhook jobs with external API calls
- [ ] Downstream API rate limits respected
- [ ] No 429 errors from downstream services
- [ ] Rate limit scoped by provider for multi-provider integrations

### Related Rules
Apply RateLimited Middleware to Webhook Jobs

### Related Skills
Queue Incoming Webhook Processing for Async Handling

### Related Decision Trees
Rate Limiting Strategy for Webhook Jobs
