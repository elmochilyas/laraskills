# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: Backoff Strategies: Fixed, Exponential, Exponential+Jitter
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Backoff strategies determine how long the worker waits before retrying a failed job. Laravel supports three patterns: **fixed** (constant delay), **exponential** (delay doubles each attempt), and **exponential with jitter** (exponential plus random variance). The choice of strategy directly impacts downstream service load, thundering herd prevention, and time-to-completion for transient failures. Fixed backoff is simple but ineffective under load. Exponential backoff with jitter is the production standard for distributed systems.

# Core Concepts
- **Fixed backoff**: Single integer `$backoff = 30`. Every retry waits 30 seconds. Predictable but causes thundering herds.
- **Exponential backoff**: Array `$backoff = [10, 30, 120]`. Each element corresponds to the delay for attempt 2, 3, 4. Doubling effect when values increase geometrically.
- **Exponential with jitter**: Explicit array or custom backoff function that adds random variance to each delay. Prevents synchronized retry storms across workers.
- **Default backoff**: If not specified, no delay between retries — the job is re-queued immediately, causing tight retry loops.
- **Worker-level backoff**: Horizon supervisors can specify per-supervisor backoff arrays.

# Mental Models
- **Crowded elevator**: Fixed backoff = everyone waits exactly 30 seconds before pressing the button again. Exponential = wait doubles each time. Jitter = randomizes the wait so not everyone pushes at once.
- **Fishing net**: Fixed net = mesh size stays the same. Exponential = mesh gets wider each cast (catches fewer fish). Jitter = mesh shifts randomly — no two casts are the same.

# Internal Mechanics
- `$backoff` is read by `Worker::getBackoff()`.
- If `$backoff` is an integer: used for all retries. `$backoff * ($attempts - 1)` if multiplicative.
- If `$backoff` is an array: the array index corresponds to `$attempts - 2` (0-indexed for first retry).
- The backoff is passed to `$job->release($backoff)`.
- `release()` stores the delay in the job payload. The queue backend uses this delay: for Redis, a sorted set with score = timestamp + delay; for database, a `available_at` column.
- Jobs with no `$backoff` set get `$this->release(0)` — immediate re-queue.

# Patterns
## Progressive Backoff Array
- **Purpose**: First retries are fast (catching transient blips), later retries are increasingly spaced out.
- **Benefit**: Fast recovery for minor issues, reduced load on failing systems for persistent issues.
- **Tradeoff**: Must tune values per job type; array length must match expected retry pattern.

## Jitter Implementation via Custom Backoff
- **Purpose**: Prevent synchronized retries across multiple workers processing similar jobs.
- **Benefit**: Avoid thundering herd when a downstream service recovers.
- **Tradeoff**: Additional complexity; randomness makes debugging harder.

## Horizon Supervisor Backoff
- **Purpose**: Set backoff per queue/supervisor without modifying job classes.
- **Benefit**: Centralized configuration; consistent policy for all jobs on a queue.
- **Tradeoff**: Overrides job-level `$backoff`; can't differentiate per job.

# Architectural Decisions
- **Use exponential + jitter for API calls**: Downstream services expect this pattern. Fixed backoff is considered aggressive and may trigger abuse protections.
- **Use fixed backoff for internal infrastructure**: Database failovers, cache warmups — predictable timing is more important.
- **Use zero backoff only for testing**: Immediate retry in production causes CPU spikes and may fail the same transient error repeatedly without recovery time.
- **Match array length to `$tries`**: Backoff array should have `$tries - 1` elements. Extra elements are ignored; missing elements use last value.

# Tradeoffs
Fixed backoff | Simple, predictable timing | Thundering herd at scale; too fast for first retries, too slow for late ones
Exponential array | Tailored per-attempt delays | Manual tuning; array size mismatch
Exponential + jitter | Industry standard for production | Slightly unpredictable; harder to debug

# Performance Considerations
- Backoff delay means the job stays in the queue longer, occupying queue storage.
- With zero backoff, a failing job can consume 10K retries/minute, saturating workers.
- Exponential backoff with large late values (e.g., 3600 seconds) means the job sits for an hour before the final retry. Plan monitoring accordingly.
- Jitter randomness doesn't add significant CPU overhead.

# Production Considerations
- Monitor "time in queue before retry" — if actual delays don't match configured backoff, there may be worker starvation or backoff misconfiguration.
- Log the backoff value on each retry for debugging.
- Alert if a job's total retry window (sum of all backoff values) exceeds acceptable SLA time.
- Backoff arrays with total window > 24 hours are rarely useful — the job's context is likely stale by then.

# Common Mistakes
- **Not setting any backoff**: `$backoff = []` or missing. The job retries immediately, causing tight error loops that burn CPU and log noise.
- **Single integer backoff for all retry attempts**: `$backoff = 30` means every retry waits 30 seconds. Late retries should wait longer.
- **Backoff array longer than `$tries`**: A `$backoff = [10, 30, 60, 120]` with `$tries = 3` — the fourth element is never used but may mislead developers.
- **Assuming jitter is automatic**: Laravel does NOT add jitter by default. You must implement it via custom backoff or middleware.

# Failure Modes
- **Thundering herd on retry**: All N workers retry at the same fixed interval, all hitting the downstream service simultaneously. Mitigation: jitter.
- **Backoff array underflow**: `$backoff = [60]` with `$tries = 5` — retries 2-5 all use 60 seconds (the last value), not increasing.
- **Millisecond delay interpreted as seconds**: If backoff values are milliseconds (PHP integer), they are treated as seconds. A 500ms delay becomes 500 seconds.
- **Negative backoff**: A backoff of -1 or 0 causes immediate retry, potentially creating tight loops.

# Ecosystem Usage
- **Laravel framework**: `Worker::getBackoff()` reads from `$backoff` property → payload → Horizon overrides.
- **Laravel Horizon**: Supervisor-level `backoff` configuration overrides job-level `$backoff`.
- **Spatie webhook-server**: Uses `ExponentialBackoffStrategy` class with configurable initial delay and multiplier.

# Related Knowledge Units
- K017 `$tries`, `$maxExceptions`, `retryUntil()` (retry policy) | K019 `$backoff` Array for Progressive Delays (advanced)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
