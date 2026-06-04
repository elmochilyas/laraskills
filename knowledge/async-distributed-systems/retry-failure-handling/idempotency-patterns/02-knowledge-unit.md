# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: Idempotency Patterns for Job Processing
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Idempotency ensures that executing a job multiple times produces the same side effects as executing it once. In a distributed queue system, at-least-once delivery guarantees mean jobs can be processed more than once — due to worker crashes after execution but before acknowledgement, retry workflows, or network partitions. Idempotency is the application-level defense against duplicate processing. The core pattern uses a unique job identifier (UUID) tracked in a deduplication store — if the UUID was already processed, the job skips execution.

# Core Concepts
- **At-least-once delivery**: Laravel queues guarantee at-least-once delivery. Jobs may be processed more than once.
- **Idempotent operation**: An operation that produces the same result regardless of how many times it's executed (e.g., "set status to paid" is idempotent; "add 10 cents to balance" is not).
- **Deduplication key**: A unique identifier (job UUID, business key, idempotency key) stored after successful processing to detect duplicates.
- **Processing guard**: A check at the start of `handle()` — "has this already been processed?" — that returns early if true.
- **Idempotency store**: The cache, database, or Redis where processed IDs are stored, with appropriate TTL for cleanup.

# Mental Models
- **Stamped ticket**: Each job has a unique ticket number. At entry, the ticket is checked against a list. If the ticket number is already stamped, the job doesn't enter. Stamped tickets expire after a reasonable window.
- **VCR tape**: Recording the same show twice doesn't change the recording — it's the same content. Idempotent operations are like recording: running them multiple times doesn't change the outcome.

# Internal Mechanics
- Each job payload contains a `uuid` field, generated at dispatch time.
- The UUID is accessible via `$job->uuid()` on the underlying queue job.
- Idempotency middleware checks a cache store for the UUID before `handle()`.
- If found: job is deleted (or skipped) without executing business logic.
- If not found: `handle()` proceeds, and on success, the UUID is stored in the cache.
- The TTL of the cache entry should exceed the maximum retry window of the job.
- For database uniqueness: `INSERT ... ON DUPLICATE KEY` or `INSERT IGNORE` can enforce idempotency at the DB level.

# Patterns
## Cache-Based Deduplication
- **Purpose**: Prevent duplicate processing using the job UUID.
- **Benefit**: Simple, fast (Redis), zero schema changes.
- **Tradeoff**: Cache TTL must exceed retry window; cache eviction can cause re-processing.

## Database Unique Constraint
- **Purpose**: Enforce idempotency at the database level.
- **Benefit**: Strong guarantee — duplicate insert fails at the constraint level.
- **Tradeoff**: Requires a dedicated `processed_jobs` table; DB write per job.

## Business Key Deduplication
- **Purpose**: Use a business-meaningful key instead of job UUID.
- **Benefit**: Idempotency across different jobs with the same business effect.
- **Tradeoff**: Must extract the business key from the job payload.

# Architectural Decisions
- **Always implement idempotency for**: Jobs that create side effects (API calls, payment processing, email sending). Jobs that only read data don't need idempotency.
- **Prefer DB unique constraints over cache for**: Financial operations, any job where duplicate processing has real-world cost.
- **Skip idempotency for**: Read-only jobs, idempotent-by-nature operations (setting status, updating cache).
- **Idempotency TTL should be > total retry window + 24 hours**: Jobs may be retried from `failed_jobs` days later.

# Tradeoffs
Cache-based dedup | Fast, zero schema, auto-cleanup (TTL) | Cache eviction risks re-processing; TTL management
DB unique constraint | Strong guarantee, survives cache flush | Schema management; slower; cleanup required
Business key dedup | Covers different jobs with same effect | Must extract key; coupling to job payload structure

# Performance Considerations
- Cache check: ~1ms (Redis GET). DB check: ~5-10ms (indexed lookup).
- Dedup store grows with job volume. Set appropriate TTL to bound growth.
- For high-throughput jobs, cache-based dedup is preferred (lower latency, no DB load).
- The dedup check adds to job processing time. For sub-100ms jobs, the overhead is meaningful.

# Production Considerations
- Monitor dedup hit rate — high rate indicates excessive retries or systemic duplicate dispatching.
- The dedup store must survive worker restarts. In-memory cache (array) is insufficient — use Redis or database.
- If the dedup store is unavailable, fail closed (skip the job) or fail open (process anyway). The choice depends on whether duplicates are acceptable.
- Cleanup of old dedup entries must be automatic (TTL for cache, scheduled deletion for DB).
- The `job:uuid` collision probability is astronomically low but nonzero. For safety-critical systems, use a composite key (UUID + queue + job class).

# Common Mistakes
- **Not implementing idempotency for non-idempotent jobs**: The most common queue mistake. "It just runs once in development" is not a guarantee.
- **Using `array` cache for dedup**: Worker restart clears the dedup store. All jobs appear unprocessed.
- **Too-short dedup TTL**: If TTL is 1 hour but a job stays in dead letter for 2 hours, retry bypasses dedup.
- **Relying on DB transactions alone**: A job within a transaction that commits successfully but the worker crashes before deleting the job from the queue causes double processing. The transaction already committed.
- **Not checking dedup after retry**: If the job was processed once, fails on a subsequent step, and is retried — the dedup key exists and the job skips, but the later step didn't run.

# Failure Modes
- **Cache eviction causes duplicate**: Redis evicts the dedup key under memory pressure. The job runs again, causing duplicate side effects.
- **Distributed clock skew**: If job retention in dedup store is based on local time and worker clocks differ, a job may be considered "expired" prematurely.
- **Dedup store outage**: Redis is down. All jobs run as-if first-time. Duplicates proliferate until dedup store recovers.
- **False dedup (hash collision)**: Extremely rare, but possible. A job is incorrectly marked as processed because its UUID matches a different job. Mitigation: composite keys.

# Ecosystem Usage
- **Laravel framework**: The `ShouldBeUnique` contract is a form of idempotency enforcement — no two jobs with the same unique key can be in the queue simultaneously. This prevents overlap but not re-execution.
- **Spatie webhook-server**: Webhook calls include an idempotency key header for downstream API idempotency.
- **Laravel Horizon**: The `WithoutOverlapping` middleware prevents concurrent execution but does not prevent re-execution.

# Related Knowledge Units
- K016 Failure Taxonomy (why retries happen) | K052 `WithoutOverlapping` Middleware (related concurrency guard)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
