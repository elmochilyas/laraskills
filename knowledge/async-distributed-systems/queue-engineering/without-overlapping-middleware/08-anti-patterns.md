# Anti-Patterns — `WithoutOverlapping` Middleware

## Metadata
| Field | Value |
|-------|-------|
| Domain | Async & Distributed Systems |
| Subdomain | Job Middleware |
| Knowledge Unit | `WithoutOverlapping` Middleware |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Global Lock Without Key Scoping
2. Zero Release Delay Tight Loop
3. Lock Expiry Shorter Than Job Duration
4. Non-Atomic Cache Driver Lock Bypass

---

## 1. Global Lock Without Key Scoping

### Category
Performance

### Description
Using `WithoutOverlapping` without `->byKey()` scoping, causing the lock to block ALL instances of the job class instead of just the same entity.

### Why It Happens
The `WithoutOverlapping` constructor accepts a key directly: `new WithoutOverlapping(5)`. The developer passes a fixed number (lock timeout in seconds) without realizing the first argument to the constructor was the lock key in earlier versions, or they use a generic key. Without `->byKey()`, the lock key is the job class name — a global singleton.

### Warning Signs
- `WithoutOverlapping` without `->byKey()` callback
- All instances of the job execute serially
- Jobs for different entities wait for each other
- Worker throughput drops as job count increases

### Why Harmful
A `ProcessOrder` job processes orders for thousands of customers. Without scoping, the lock key is `App\Jobs\ProcessOrder`. Only one order processes at a time globally. Order 100 waits for Order 1 to complete, even though they're completely independent. Throughput drops to 1 order at a time regardless of worker count. Adding more workers doesn't help — they all compete for the same global lock.

### Consequences
- All job instances execute serially regardless of entity
- Worker throughput capped at 1 regardless of worker count
- Unrelated entities block each other
- Adding workers doesn't improve throughput

### Alternative
Always use `->byKey(fn($job) => $job->entityId)` to scope the lock per entity.

### Refactoring Strategy
1. Add `->byKey(fn($job) => $job->orderId)` or similar entity scoping
2. Remove the constructor argument if it was being misused as a key
3. Verify different entities can run concurrently
4. Test: dispatch two jobs for different entities — they should run in parallel

### Detection Checklist
- [ ] `->byKey()` used to scope lock per entity
- [ ] Different entities execute concurrently
- [ ] Only same-entity jobs serialize
- [ ] Worker throughput scales with entity count

### Related Rules
always-scope-by-key

### Related Skills
Prevent Concurrent Job Execution with WithoutOverlapping

### Related Decision Trees
WithoutOverlapping vs ShouldBeUnique for Mutual Exclusion

---

## 2. Zero Release Delay Tight Loop

### Category
Performance

### Description
Not setting `releaseAfter` (defaults to 0), causing the job to retry immediately when the lock is held, creating a tight retry loop that burns CPU with no progress.

### Why It Happens
The `releaseAfter` parameter defaults to 0 — the job is released immediately if it can't acquire the lock. The developer doesn't set it, assuming the middleware handles contention gracefully. Without backoff, the job is released, immediately popped by the worker, fails to acquire the lock again, and is released again — infinitely looping.

### Warning Signs
- `WithoutOverlapping` without `->releaseAfter()` set
- Worker CPU spikes during lock contention
- Queue logs show rapid release-repop cycles
- Other jobs make no progress during contention

### Why Harmful
Job A holds the lock and takes 30 seconds. Job B tries to acquire the lock, fails, and is released with delay=0. The queue immediately re-pops Job B (it's at the top of the queue). Job B tries to acquire the lock, fails again, waits 0 seconds, and repeats. Over 30 seconds, Job B attempts and releases hundreds of times, consuming 100% of a worker's CPU. Meanwhile, other jobs in the queue make no progress because the worker is stuck in the Job B retry loop.

### Consequences
- Worker CPU consumed by tight retry loop
- No progress on other jobs during lock contention
- Queue processing stalls for all jobs, not just the contended one
- Infrastructure costs from wasted CPU cycles

### Alternative
Always set `releaseAfter` to a meaningful backoff (5-30 seconds).

### Refactoring Strategy
1. Add `->releaseAfter(10)` to all `WithoutOverlapping` middleware
2. Choose backoff based on job execution time: shorter for quick jobs, longer for slow jobs
3. Never set releaseAfter to 0
4. Test: during lock contention, verify job waits before retrying

### Detection Checklist
- [ ] `releaseAfter` set to 5-30 seconds
- [ ] No zero-delay release in middleware
- [ ] No tight retry loops under lock contention
- [ ] Workers process other jobs during lock wait

### Related Rules
set-release-after-backoff

### Related Skills
Prevent Concurrent Job Execution with WithoutOverlapping

### Related Decision Trees
WithoutOverlapping Lock Expiry

---

## 3. Lock Expiry Shorter Than Job Duration

### Category
Reliability

### Description
Setting `expireAfter` shorter than the job's p99 execution time, causing the lock to expire while the job is still running and allowing a second instance to overlap.

### Why It Happens
The developer sets `expireAfter` based on average execution time without considering tail latency or the job's p99. A job that usually takes 5 seconds but occasionally takes 60 seconds (database contention, slow API) has `expireAfter(30)`. The lock expires during the 60-second execution, a second instance acquires the lock and starts processing the same entity.

### Warning Signs
- `expireAfter` less than measured p99 execution time
- Two instances of the same job running simultaneously
- Concurrent execution despite `WithoutOverlapping`
- Data corruption incidents traceable to lock expiry

### Why Harmful
A billing job for invoice 123 usually takes 10 seconds but hits a database lock and takes 90 seconds. `expireAfter` is set to 30 seconds. The lock expires at 30 seconds. A second dispatch of the billing job for invoice 123 acquires the lock and starts processing. Now two jobs are reconciling the same invoice simultaneously, potentially double-charging or double-crediting. The `WithoutOverlapping` guarantee is violated.

### Consequences
- Concurrent execution of same-entity jobs
- Data corruption from race conditions
- `WithoutOverlapping` guarantee violated silently
- Hard-to-diagnose production incidents

### Alternative
Set `expireAfter` to at least 2x the job's measured p99 execution time.

### Refactoring Strategy
1. Measure job p99 execution time from monitoring data (7 days)
2. Set `expireAfter` to at least 2x p99
3. For unpredictable jobs, use a generous buffer (e.g., 4x average)
4. Monitor lock expiry events vs execution time to catch future violations
5. Review and adjust periodically

### Detection Checklist
- [ ] `expireAfter` >= 2x measured p99 execution time
- [ ] No lock expiry events during execution
- [ ] No concurrent same-entity execution
- [ ] Monitoring tracks execution time vs expiry

### Related Rules
expire-after-twice-p99

### Related Skills
Prevent Concurrent Job Execution with WithoutOverlapping

### Related Decision Trees
WithoutOverlapping Lock Expiry

---

## 4. Non-Atomic Cache Driver Lock Bypass

### Category
Reliability

### Description
Using `WithoutOverlapping` with a cache driver that doesn't support atomic locks (`array`, `file`), silently allowing concurrent execution despite the middleware.

### Why It Happens
Development environments often use `array` or `file` cache drivers. The developer adds `WithoutOverlapping` and tests it — in single-worker dev, it appears to work. The same code deploys to production. If production accidentally uses `file` cache (misconfiguration), the lock mechanism falls back to non-atomic file-based locking. Two workers can both acquire "the lock" simultaneously.

### Warning Signs
- `array` or `file` cache driver configured
- Concurrent execution of locked jobs in production
- `WithoutOverlapping` appears ineffective
- Cache driver changed without lock mechanism review

### Why Harmful
Two workers both check the lock file simultaneously. Worker A reads "lock=0", Worker B reads "lock=0". Worker A writes "lock=1" and proceeds. Worker B writes "lock=1" (overwrites) and proceeds. Both workers execute the same job for the same entity concurrently. The `WithoutOverlapping` guarantee is completely broken. No error is generated. Data corruption occurs silently.

### Consequences
- Concurrent execution despite WithoutOverlapping
- Lock guarantee broken silently without alert
- Data corruption from race conditions
- Cache misconfiguration invisible in monitoring

### Alternative
Always use a cache driver with atomic lock support (Redis, Memcached, Database).

### Refactoring Strategy
1. Verify `CACHE_DRIVER` is `redis` or `memcached` in production
2. Ensure Redis atomic lock support is available
3. Add configuration validation: check cache driver at deployment
4. Fail fast on misconfiguration: log warning if driver doesn't support atomic locks

### Detection Checklist
- [ ] Cache driver supports atomic locks (Redis/Memcached)
- [ ] No `array` or `file` cache in production with WithoutOverlapping
- [ ] Lock guarantee verified under concurrent worker access
- [ ] Configuration validation for atomic lock support

### Related Rules
use-atomic-lock-cache-driver

### Related Skills
Prevent Concurrent Job Execution with WithoutOverlapping

### Related Decision Trees
WithoutOverlapping Lock Expiry
