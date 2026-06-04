# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: `$backoff` Property with Array for Progressive Delays
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Laravel's `$backoff` property accepts an array of integers to define per-attempt delay progression: `$backoff = [10, 30, 60, 120, 300]`. Each element corresponds to the delay (in seconds) before retry attempt N. Array index 0 = delay before first retry, index 1 = delay before second retry, etc. If `$tries` exceeds the array length, the last value is reused for all subsequent retries. This enables fine-grained control over retry timing — fast initial retries for transient blips, progressively slower retries for persistent failures.

# Core Concepts
- **Array indexing**: `$backoff[0]` = seconds before attempt 2 (first retry). `$backoff[n]` = seconds before attempt `n+2`.
- **Last-value reuse**: If `$tries > count($backoff) + 1`, the last array element repeats for all remaining retries.
- **First attempt timing**: The first attempt has no delay — it dispatches immediately. Delays only apply to retries.
- **Integer mode**: Single integer `$backoff = 30` is syntactic sugar for an array where all elements equal 30.
- **Override precedence**: Job-level `$backoff` < Horizon supervisor `backoff` override.

# Mental Models
- **Staircase**: Each step (retry) has a different height (delay). First steps are short, later steps are taller. If there are more steps than the staircase length, the last step height repeats.
- **Graduated pressure**: First retry — gentle nudge (10s). Second — moderate push (30s). Third — significant wait (120s). Fourth — back off almost entirely (300s).

# Internal Mechanics
- `$backoff` is stored in the job payload envelope as `backoff` key.
- `Worker::getBackoff($job)` reads from payload: `$job->payload()['backoff']`.
- If array: `$backoff[($attempts - 2)]` where `$attempts` starts at 1. For attempt 2 (first retry), index = 0.
- If index out of bounds: `last($backoff)`.
- The backoff value is passed to `$job->release($backoff)` which calls `$queue->release($delay)`.
- For Redis: the job is inserted into a delayed queue sorted by `available_at`. For database: `available_at` column is set.

# Patterns
## Aggressive-First, Conservative-Last
- **Purpose**: First retry quickly (5s), last retry slowly (600s).
- **Benefit**: Catches transient dips instantly; reduces load on persistently failing systems.
- **Tradeoff**: Early fast retries may hit the same transient failure window.

## Total Retry Window Calculation
- **Purpose**: Design backoff array to fit within a specific time budget.
- **Benefit**: Predictable maximum delay before failure declared.
- **Tradeoff**: Sum of array + execution time must be ≤ acceptable SLA.

## Backoff Mirrors SLA Tiers
- **Purpose**: Critical jobs have shorter backoff arrays; non-critical have longer.
- **Benefit**: Differentiated recovery time per job priority.
- **Tradeoff**: More configuration to maintain.

# Architectural Decisions
- **Array length should match `$tries - 1`**: Add one element per retry attempt. `$tries = 5` → `$backoff = [a, b, c, d]` (4 retries).
- **Use last element as maximum acceptable delay**: The last value should be the longest delay you're willing to wait before a retry.
- **First element should be > 0**: Avoid 0 for first retry — even transient errors need a moment to resolve.
- **Consider jitter for critical production paths**: Array values are precise. Add random variance to avoid thundering herd.

# Tradeoffs
Array backoff per attempt | Fine-grained control, predictable timing | Manual sizing; mismatch with `$tries`
Reuse last value | Graceful degradation if array too short | Unintended behavior if `$tries` grows but array doesn't
Single integer backoff | Simple, no sizing worries | All retries wait the same; no progression

# Performance Considerations
- The backoff array is stored in the job payload — larger arrays add negligible overhead.
- The delay calculation is O(1) — direct index lookup.
- The cumulative delay (sum of array) determines how long a job occupies the queue before failing. For `$backoff = [300, 600, 1800, 3600]`, total = 6300 seconds (1.75 hours) of queued time.

# Production Considerations
- Document the backoff strategy per job class. Include the total retry window.
- Log the `attempts` count and backoff value on each retry for observability.
- Monitor the "last retry before failure" pattern — if jobs consistently fail on the final attempt, increase `$tries` or adjust backoff.
- After a deployment, old in-flight jobs use the old backoff array stored in their payload.

# Common Mistakes
- **Array longer than `$tries - 1`**: Extra elements never used. Creates confusion about retry behavior.
- **First element is 0**: Immediate first retry. No recovery window for transient errors.
- **Exponential growth too steep**: `[10, 60, 600, 3600]` — jump from 60s to 600s is too abrupt. Gradual doubling is better.
- **Not accounting for attempt 1**: `$backoff` only applies to retries (attempts 2+). The first execution is always immediate.

# Failure Modes
- **Array index underflow on attempt 1**: If code tries to read `$backoff[attempt - 2]` for attempt 1, it gets index -1. Laravel guards against this, but custom backoff logic may not.
- **Missing backoff for last retry**: If `$tries` is increased but backoff array is not, the last retries reuse the last element's value, which may be too short or too long.
- **Very large last element (>86400)**: A retry delayed by >24 hours means the job's context may be stale. The downstream system may have changed state.

# Ecosystem Usage
- **Laravel framework**: `Worker::getBackoff()` handles both integer and array forms. Array support added in Laravel 8.x.
- **Laravel Horizon**: Horizon supervisor `backoff` accepts both integer and array, overriding job-level values.
- **Spatie webhook-server**: Uses `ExponentialBackoffStrategy` with configurable parameters — a different approach than the array pattern.

# Related Knowledge Units
- K016 Failure Taxonomy | K017 `$tries`, `$maxExceptions`, `retryUntil()` | K018 Backoff Strategies (foundational)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
