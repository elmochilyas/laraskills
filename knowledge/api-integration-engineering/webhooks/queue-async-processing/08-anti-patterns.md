# ECC Anti-Patterns — Queue and Async Processing for Webhooks

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 03-webhooks |
| **Knowledge Unit** | Queue and Async Processing for Webhooks |
| **Generated** | 2026-06-03 |

## Anti-Pattern Inventory

1. Synchronous Processing in Webhook Controller
2. Dispatching Jobs Before Database Transaction Commit
3. No Job Deduplication for Provider Retries
4. No Rate Limiting on Jobs Making Downstream Calls
5. Sensitive Payload in Plain Text Queue Data
6. Shared Queue for All Providers (No Isolation)

## Repository-Wide Anti-Patterns

- God Services
- Premature Optimization

---

## Anti-Pattern 1: Synchronous Processing in Webhook Controller

### Category
Performance | Reliability

### Description
Processing webhook business logic synchronously in the controller method instead of dispatching a queue job. Delays HTTP response.

### Why It Happens
Developers write processing logic directly in the controller during development and never refactor to async.

### Warning Signs
- Business logic (DB writes, API calls, email) in webhook controller
- Response time > 1 second
- Provider shows timeout retries for the same event

### Why It Is Harmful
Provider timeout triggers retry. First request is still processing when the second arrives. Both complete successfully. Customer gets two charges, two emails, or two records. Processing time exhausts PHP-FPM workers, starving other requests.

### Preferred Alternative
Dispatch a queue job from the controller and return 200 immediately.

### Refactoring Strategy
1. Create job class with webhook processing logic
2. Controller validates signature, dispatches job, returns 200
3. Add `ShouldBeUnique` for deduplication

### Related Rules
Dispatch Job from Controller, Return 200 Immediately (05-rules.md)

### Related Skills
Process Webhooks Asynchronously via Laravel Queues (06-skills.md)

### Related Decision Trees
Job Dispatch Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Dispatching Jobs Before Database Transaction Commit

### Category
Reliability | Data Integrity

### Description
Dispatching a webhook processing job inside a database transaction before the transaction commits.

### Why It Happens
The job dispatch is part of the same code block as the transaction. Developers don't consider the ordering.

### Warning Signs
- `dispatch()` inside `DB::transaction()` callback
- Phantom records processed after transaction rollback
- Orphan jobs referencing non-existent data

### Why It Is Harmful
The job dispatches and starts processing before the transaction commits. The queue worker reads data that isn't yet committed (read uncommitted or dirty read). If the transaction rolls back, the job processes data that never existed. The system has phantom side effects.

### Preferred Alternative
Use `dispatchIfCommitted()` to dispatch only after successful commit.

### Refactoring Strategy
1. Move `dispatch()` outside the `DB::transaction()` callback
2. Or replace with `dispatchIfCommitted()`
3. Ensure no side effects before the transaction commits

### Related Rules
Dispatch After Database Commit with dispatchIfCommitted (05-rules.md)

### Related Decision Trees
Job Dispatch Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: No Job Deduplication for Provider Retries

### Category
Reliability | Data Integrity

### Description
Webhook processing jobs without `ShouldBeUnique` or idempotency checks. Same event dispatched multiple times on provider retry.

### Why It Happens
Developers assume one delivery per event. Provider retry behavior is not well understood.

### Warning Signs
- No `ShouldBeUnique` on webhook jobs
- Same event ID processed multiple times
- Duplicate side effects observed

### Why It Is Harmful
Provider sends duplicate `order.completed` webhook due to HTTP timeout. Two identical jobs dispatch and process. The order is fulfilled twice. Two shipments created. Two billing entries.

### Preferred Alternative
Implement `ShouldBeUnique` with event ID as the unique key.

### Refactoring Strategy
1. Add `ShouldBeUnique` trait to webhook job
2. Implement `uniqueId()` returning event ID from payload
3. Set `$uniqueFor` to match provider retry window

### Related Rules
Use Unique Jobs with ShouldBeUnique for Deduplication (05-rules.md)

### Related Decision Trees
Job Deduplication Approach (07-decision-trees.md)

---

## Anti-Pattern 4: No Rate Limiting on Jobs Making Downstream Calls

### Category
Reliability | Performance

### Description
Webhook processing jobs that make downstream API calls without rate limiting middleware. Burst of webhooks overwhelms downstream services.

### Why It Happens
Developers don't anticipate bursts. "The downstream API handles it" is the assumption.

### Warning Signs
- Downstream API returns 429/rate-limited responses
- Job failures spike during provider catch-up events
- No `RateLimited` middleware on webhook jobs

### Why It Is Harmful
A provider catches up after downtime and sends 1000 webhooks in 5 minutes. All 1000 jobs reach the downstream API simultaneously. The API rate limits or fails. All 1000 jobs fail and retry simultaneously. The retry burst overwhelms again. Downstream stays overloaded.

### Preferred Alternative
Apply `RateLimited` middleware to webhook processing jobs.

### Refactoring Strategy
1. Add `middleware()` method to job returning `[new RateLimited('api-name', maxAttempts, decaySeconds)]`
2. Set limits based on downstream API documented limits
3. Adjust limits based on observed rate limit errors

### Related Rules
Implement Job Middleware for Rate Limiting (05-rules.md)

### Related Skills
Process Webhooks Asynchronously via Laravel Queues (06-skills.md)

---

## Anti-Pattern 5: Sensitive Payload in Plain Text Queue Data

### Category
Security | Compliance

### Description
Passing sensitive webhook payload data in job properties without `ShouldBeEncrypted`. Serialized job data stored in plain text in the queue.

### Why It Happens
Developers don't realize queue drivers (Redis, database) store serialized data in plain text accessible to anyone with infrastructure access.

### Warning Signs
- Job properties containing PII, tokens, payment data
- No `ShouldBeEncrypted` trait on webhook jobs
- Serialized job data visible in Redis/database queue storage

### Why It Is Harmful
Anyone with Redis CLI access can read serialized webhook payloads from the queue. Payment details, PII, and API keys are exposed. GDPR/PCI compliance is violated.

### Preferred Alternative
Implement `ShouldBeEncrypted` on jobs containing sensitive data.

### Refactoring Strategy
1. Add `ShouldBeEncrypted` trait to webhook processing jobs
2. Verify serialized payload is encrypted in queue storage
3. For large payloads, store reference ID and fetch data in job

### Related Rules
Use ShouldBeEncrypted for Jobs Containing Sensitive Data (05-rules.md)

---

## Anti-Pattern 6: Shared Queue for All Providers (No Isolation)

### Category
Architecture | Reliability

### Description
All webhook providers share the same queue. A high-volume provider's retry storm blocks low-volume provider processing.

### Why It Happens
Default queue configuration applies to all providers. Queue isolation requires additional configuration.

### Warning Signs
- All providers use the same `$connection` and `$queue`
- High-volume provider delays critical provider processing
- Single queue failure affects all providers

### Why It Is Harmful
Stripe sends 10,000 webhooks per hour. Slack sends 50. Stripe's volume fills the queue. Slack alerting webhooks are delayed behind 10,000 Stripe events. A critical Slack alert about production downtime arrives 30 minutes late.

### Preferred Alternative
Use per-provider or per-priority queue isolation.

### Refactoring Strategy
1. Evaluate provider throughput and criticality
2. Configure separate queues for high-volume vs critical providers
3. Set `$connection` and `$queue` on job classes
4. Configure separate workers per queue

### Related Rules
Isolate Queue Connection Per Service When Needed (05-rules.md)

### Related Decision Trees
Queue Isolation Strategy (07-decision-trees.md)
