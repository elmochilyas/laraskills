# Anti-Patterns: Idempotency Patterns for Job Processing

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K075 — Idempotency Patterns |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No Idempotency for Side-Effect Jobs | Reliability | Critical |
| 2 | Cache-Based Dedup for Financial Operations | Reliability | Critical |
| 3 | Dedup TTL Too Short | Reliability | High |
| 4 | Using `array` Cache Driver for Dedup | Reliability | Critical |
| 5 | Not Logging Dedup Hits | Observability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Jobs Without Idempotency Guards for External API Calls | idempotency-patterns, backoff-strategies | Critical |
| Single Worker Dev Environment Hides Idempotency Gaps | idempotency-patterns | High |

---

## Anti-Pattern 1: No Idempotency for Side-Effect Jobs

### Category
Reliability — Duplicate Side Effects

### Description
Not implementing idempotency for jobs that produce side effects (API calls, payments, email sending). Laravel queues guarantee at-least-once delivery — jobs may execute multiple times due to worker crashes, retries, or network partitions. Without dedup, each execution produces duplicate side effects.

### Why It Happens
Developers assume jobs run exactly once. In development (single worker, no crashes), this is true. The at-least-once delivery guarantee is only exposed under failure conditions that are hard to reproduce locally.

### Warning Signs
- Jobs make API calls, send emails, or process payments without dedup
- Duplicate emails reported by customers
- Duplicate API operations observed in downstream systems
- Worker crash causes duplicate processing on restart
- Retry from `failed_jobs` produces duplicate side effects

### Why Harmful
Duplicate side effects cause real-world damage: customers charged twice, duplicate emails sent, API resources created multiple times. Each retry or worker crash multiplies the damage.

### Real-World Consequences
A `ProcessPayment` job charges a credit card. The job executes successfully (payment charged), but the worker crashes before acknowledging the job. The queue re-dispatches the job. Without idempotency, the customer is charged a second time. The merchant must process a refund, and the customer's trust is damaged.

### Preferred Alternative
Implement idempotency for all jobs with external side effects. Use a dedup key checked at the start of `handle()`.

### Refactoring Strategy
1. Identify all jobs that produce external side effects
2. Add dedup check at start of `handle()`: `if (Cache::has($key)) { return; }`
3. Set dedup key after successful processing: `Cache::put($key, true, $ttl)`
4. Log dedup skips for monitoring
5. For financial operations: use DB unique constraints instead of cache

### Detection Checklist
- [ ] Side-effect jobs without dedup guards
- [ ] Duplicate processing on retry
- [ ] No idempotency key in job constructor
- [ ] External side effects not protected from at-least-once delivery

### Related Rules/Skills/Decision Trees
- **Rule 4**: always-implement-idempotency-for-side-effects (`05-rules.md`)
- **Skill**: Implement Idempotency for Side-Effect Jobs (`06-skills.md`)
- **Decision**: Idempotency Key Strategy (`07-decision-trees.md`)

---

## Anti-Pattern 2: Cache-Based Dedup for Financial Operations

### Category
Reliability — Eviction-Sensitive Dedup

### Description
Using cache-based deduplication (Redis TTL, Cache facade) for financial operations like payment processing or billing. Cache evictions (LRU, memory pressure, key expiry) remove the dedup key — allowing the same job to run again and create duplicate charges.

### Why It Happens
Cache-based dedup is simpler to implement than DB constraints. Teams use it for all dedup needs without considering the durability difference between cache and database.

### Warning Signs
- Payment/billing jobs use `Cache::has()` for dedup
- Cache key TTL set to standard expiry (hours)
- Cache eviction policy may remove dedup keys under memory pressure
- No database unique constraint as a secondary guard
- Team has experienced unexpected duplicate payments

### Why Harmful
Cache is not durable — keys can be evicted at any time due to memory pressure, LRU policy, or infrastructure restarts. Once the dedup key is gone, the job runs again as if it were new. For financial operations, this means double charges with no protection.

### Real-World Consequences
A `ProcessPayment` job uses `Cache::put('payment_'.$id, true, 86400)` for dedup. The Redis instance runs at 90% memory. LRU eviction removes the oldest keys — including the dedup key for a payment processed 20 hours ago. The same payment job is retried (operator ran `queue:retry`). The dedup key is gone — the job charges the customer again. The second charge is only discovered during monthly reconciliation.

### Preferred Alternative
Use database unique constraints for financial operations. Cache dedup is a performance optimization, not a durability guarantee.

### Refactoring Strategy
1. Add a database table for processed operations with a unique constraint on the operation ID
2. Insert before processing: `DB::table('processed_payments')->insert(['id' => $paymentId])`
3. Catch unique constraint violation: if duplicate, return (already processed)
4. Keep cache dedup as a first-pass filter for performance
5. Remove cache-only dedup from financial jobs

### Detection Checklist
- [ ] Cache-only dedup for financial operations
- [ ] No DB unique constraint as secondary guard
- [ ] Cache eviction could allow duplicate payments
- [ ] Team relies on cache TTL for dedup durability

### Related Rules/Skills/Decision Trees
- **Rule 1**: prefer-db-constraints-for-financial (`05-rules.md`)
- **Skill**: Implement Idempotency for Side-Effect Jobs (`06-skills.md`)

---

## Anti-Pattern 3: Dedup TTL Too Short

### Category
Reliability — Retry Window Bypass

### Description
Setting dedup TTL shorter than the total retry window + buffer. A job that fails, enters `failed_jobs`, and is retried days later may find its dedup key expired — allowing the job to process again as if it were new.

### Why It Happens
Developers set dedup TTL to match the expected processing window (hours), not the potential retry window (days). They don't consider manual retry from `failed_jobs` or DLQ reprocessing.

### Warning Signs
- Dedup TTL < 48 hours
- Jobs retried from `failed_jobs` produce duplicate side effects
- Manual `queue:retry` bypasses idempotency
- DLQ reprocessing after cool-off period finds expired dedup keys
- Team unaware of total retry window (tries x backoff + failed_jobs retention)

### Why Harmful
The dedup key expires while the job's potential retry window is still open. An operator or automated process retries the job — the expired dedup offers no protection. The side effect runs again.

### Real-World Consequences
A job sends a welcome email with dedup TTL of 1 hour. The job fails after 3 retries (30 minutes total) and enters `failed_jobs`. The operator is busy and retries it 2 hours later — the dedup key expired at 1 hour. The welcome email is sent again. The customer receives a duplicate "Welcome!" email 2 hours after account creation.

### Preferred Alternative
Set dedup TTL to exceed the total retry window (`$tries * max($backoff) * 2`) plus a buffer of at least 24 hours.

### Refactoring Strategy
1. Calculate total retry window: sum of all backoff delays + job execution time per retry
2. Add failed_jobs retention window (typical: 7-30 days)
3. Set dedup TTL to at least: retry window + failed_jobs retention
4. For safety: use 7-day minimum TTL for all side-effect jobs
5. For financial operations: use DB constraints (TTL-independent)

### Detection Checklist
- [ ] Dedup TTL < 48 hours
- [ ] Manual retry from failed_jobs bypasses dedup
- [ ] Total retry window not calculated
- [ ] Duplicate side effects from delayed retries

### Related Rules/Skills/Decision Trees
- **Rule 2**: dedup-ttl-exceeds-retry-window (`05-rules.md`)
- **Skill**: Implement Idempotency for Side-Effect Jobs (`06-skills.md`)

---

## Anti-Pattern 4: Using `array` Cache Driver for Dedup

### Category
Reliability — Per-Worker Dedup

### Description
Using the `array` cache driver for deduplication keys. The `array` driver is per-process — each worker has its own independent cache store. A job processed by Worker A has its dedup key in Worker A's memory only; Worker B knows nothing about it.

### Why It Happens
Many Laravel applications default to `array` cache in development. Teams may accidentally use the same configuration in production, or configure `CACHE_DRIVER=array` for simplicity.

### Warning Signs
- `CACHE_DRIVER=array` in production
- Duplicate jobs run across different workers
- Same job processes successfully on multiple workers
- Dedup works in development (single worker) but fails in production (multi-worker)
- Cache facade methods return `null` for keys set by other workers

### Why Harmful
Each worker has its own dedup store. Job dispatched to multiple workers (due to queue issues, retries, or reprocessing) runs on every worker. With N workers, the same job can execute N times with no dedup between them.

### Real-World Consequences
A production system has 10 workers with `CACHE_DRIVER=array`. A job is dispatched to send a welcome email. Worker 1 processes it, stores the dedup key in worker 1's memory. The job is somehow re-dispatched (queue visibility timeout) — Worker 5 picks it up. Worker 5's `array` cache has no record of the dedup key. The email is sent again. The cycle repeats — 10 emails sent to the same customer.

### Preferred Alternative
Use a shared cache driver (Redis, Database) for dedup keys. Never use `array` in multi-worker deployments.

### Refactoring Strategy
1. Set `CACHE_DRIVER=redis` or `CACHE_DRIVER=database` in production
2. Configure Redis connection in `config/cache.php`
3. Verify all workers connect to the same Redis instance
4. Test dedup across multiple workers (dispatch same job twice)
5. For development: `array` cache is acceptable (single worker)

### Detection Checklist
- [ ] `array` cache driver in multi-worker production
- [ ] Duplicate job execution across workers
- [ ] Dev-only dedup behavior (works in single-worker but fails in multi-worker)
- [ ] No shared dedup store

### Related Rules/Skills/Decision Trees
- **Rule 3**: no-array-cache-for-dedup (`05-rules.md`)
- **Skill**: Implement Idempotency for Side-Effect Jobs (`06-skills.md`)

---

## Anti-Pattern 5: Not Logging Dedup Hits

### Category
Observability — Invisible Protection

### Description
Not logging when the dedup guard triggers (i.e., when a duplicate execution is prevented). Teams know how many jobs succeed and fail, but not how many were prevented from running by idempotency. The dedup mechanism's effectiveness is invisible.

### Why It Happens
Dedup is a "silent return" — `if (Cache::has($key)) { return; }`. No log, no counter, no trace. The protection works silently, and its value is invisible in metrics.

### Warning Signs
- Dedup guard returns without logging
- No metric for "duplicates prevented"
- Team cannot answer "how often does idempotency save us?"
- Idempotency bugs (keys not set, expired keys) go undetected
- Monitoring shows success rate but not duplicate prevention rate

### Why Harmful
Without dedup logging, the team can't verify the idempotency mechanism is working. A broken dedup (key not set, network error on cache check) silently allows duplicates — but no one knows. The idempotency system is essentially untested.

### Real-World Consequences
A bug in the dedup key generation uses different formats for set vs check: `Cache::has('payment_'.$id)` vs `Cache::put('payment_id_'.$id, ...)`. The check never finds the key — it's always a miss. Every duplicate execution runs without protection. No dedup hit is logged, so the bug is invisible. After months of operation, a customer reports being charged 17 times for the same order. Investigation reveals the dedup key format mismatch. If dedup hits were logged, the zero-hit rate would have been immediately suspicious.

### Preferred Alternative
Log every dedup hit. Track the dedup prevention rate as a metric.

### Refactoring Strategy
1. Add logging when dedup guard triggers: `Log::debug('Dedup hit', ['job' => static::class, 'key' => $key])`
2. Add a counter metric: `dedup_hits_total{job="..."}`
3. Create dashboard showing dedup hit rate per job class
4. Alert if dedup hit rate drops to zero (might indicate broken dedup)
5. Log when dedup key is set after processing

### Detection Checklist
- [ ] Dedup guard returns without logging
- [ ] Zero visibility into duplicate prevention
- [ ] Broken dedup undetected (always allows duplicates)
- [ ] No dedup hit metric

### Related Rules/Skills/Decision Trees
- **Skill**: Implement Idempotency for Side-Effect Jobs (`06-skills.md`)
