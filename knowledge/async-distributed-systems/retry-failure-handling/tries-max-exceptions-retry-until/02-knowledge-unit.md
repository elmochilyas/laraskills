# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: `$tries`, `$maxExceptions`, `retryUntil()` Configuration
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Three properties control when a job stops retrying and becomes permanently failed: `$tries` (max retry attempts), `$maxExceptions` (max exceptions before failing even if `$tries` remains), and `retryUntil()` (time-based cutoff). These form a three-dimensional retry policy: a job fails when it exceeds `$tries` attempts, OR when it exceeds `$maxExceptions` exceptions per attempt window, OR when `retryUntil()` returns a past timestamp. Understanding their interaction is critical — `retryUntil()` overrides `$tries`, and `$maxExceptions` provides a per-attempt cap within the `$tries` limit.

# Core Concepts
- **`$tries`**: Integer. Maximum number of times the job's `handle()` will be attempted. Default `null` (no limit unless set).
- **`$maxExceptions`**: Integer. Maximum number of unhandled exceptions allowed before failing. Each attempt counts. Default `null` (unlimited).
- **`retryUntil()`**: Method returning a `Carbon`/timestamp. The job retries until this time, regardless of `$tries` value.
- **Interaction**: If both `$tries` and `retryUntil()` are set, the first-to-expire wins. `$maxExceptions` is checked independently — if exceeded, the job fails even if `$tries` and `retryUntil()` are not exhausted.
- **`$tries` vs `--tries`**: `$tries` on the job class takes precedence over the `--tries` worker flag. Worker flag is the fallback.

# Mental Models
- **Three-strike rule**: `$tries` = maximum swings (attempts). `$maxExceptions` = maximum strikes (errors). `retryUntil()` = final inning (time limit). You're out when any limit is reached.
- **Safety fuse**: `$tries` is the amp rating. `$maxExceptions` is the ground fault interrupter. `retryUntil()` is the timer cutoff. Each trips the circuit independently.

# Internal Mechanics
- On job execution failure:
  1. Worker checks `$job->retryUntil()` — if in the past, fail immediately.
  2. Worker checks `$job->attempts() >= $job->maxTries()` — if exceeded, fail.
  3. Worker checks `$job->maxExceptions()` — uses internal counter: if exceptions >= `$maxExceptions`, fail.
  4. If none triggered: `$job->release($backoff)` — retry.
- `maxTries()` reads from: `$this->job->maxTries` (property) → `$this->maxTries` (command property) → `$this->maxTries` (from payload) → config/worker fallback.
- `retryUntil()` is stored as a timestamp in the job payload.
- `maxExceptions()` reads from the payload envelope.

# Patterns
## Time-Bound Retry for Time-Sensitive Jobs
- **Purpose**: Jobs that must complete within a deadline (password reset, payment processing).
- **Benefit**: Automatic abandonment after deadline — no stale processing.
- **Tradeoff**: Must set realistic deadlines; too short = unnecessary failures.

## Exception-Tolerant Jobs
- **Purpose**: Jobs that can tolerate transient exceptions but should fail on sustained errors.
- **Benefit**: Combines high `$tries` with low `$maxExceptions` — fails fast on persistent issues.
- **Tradeoff**: Confusing interaction; must test carefully.

## Attempt-Based with Deadline Cap
- **Purpose**: Set both `$tries` and `retryUntil()` for defense-in-depth.
- **Benefit**: Neither dimension alone can keep the job alive indefinitely.
- **Tradeoff**: Two policies to tune; cleanup is automatic.

# Architectural Decisions
- **Set `$tries` explicitly on every job**: Default `null` means retries until `retryUntil()` or forever. Explicit protection against infinite retry loops.
- **Use `retryUntil()` over `$tries` for**: External API calls (retry for N minutes, not N times), time-boxed operations.
- **Use `$maxExceptions` for**: Jobs talking to unreliable services where transient errors are expected but sustained errors should abort.

# Tradeoffs
`$tries = null` (unlimited) | Only stops via retryUntil or intervention | Risk of infinite retry loop
`$tries = 1` | Fast failure, no wasted retries | Transient errors kill jobs
`$maxExceptions` | Graceful handling of error rates | Complex interaction with `$tries`
`retryUntil()` | Time-boxed retry, predictable | Clock dependency; time zones matter

# Performance Considerations
- Each retry attempt costs full job execution time + backoff delay.
- Jobs with high `$tries` (10+) that consistently fail on early attempts waste significant queue capacity.
- `retryUntil()` is checked on every attempt — no extra cost.
- `$maxExceptions` is checked after each exception — no extra cost.

# Production Considerations
- Set `$tries` as a maximum safety limit on all jobs, even if `retryUntil()` is also set. Defense in depth.
- Use worker `--tries` flag as server-level default for jobs that don't set `$tries` explicitly.
- Monitor retry rates — a job that consistently uses 3/3 tries before succeeding is consuming 3× resources and indicating a reliability issue.
- Jobs with `$maxExceptions` must be carefully tested — the interaction with `$tries` and backoff can produce unexpected failure timing.

# Common Mistakes
- **Setting `$tries = 0` or omitting it**: A job with `$tries = 0` or `$tries = null` may retry indefinitely if `retryUntil()` is not set. Always set an explicit limit.
- **Setting `$maxExceptions > $tries`**: `$maxExceptions > $tries` has no effect — the job will exhaust `$tries` before reaching `$maxExceptions`. `$maxExceptions` should be ≤ `$tries`.
- **Not returning a value from `retryUntil()`**: If `retryUntil()` returns null/void, it defaults to unlimited. The method must return a `Carbon` instance.
- **Confusing `$tries` with `attempts`**: `$tries` is the MAX. `attempts()` returns the CURRENT count (starts at 1 for the initial attempt).

# Failure Modes
- **retryUntil() returns inconsistent time**: If the job's timestamp is computed in a different timezone than the worker, the deadline may be misinterpreted.
- **$maxExceptions off-by-one**: The counter includes the current failing attempt. If `$maxExceptions = 1`, even the first exception causes failure — no room for a single retry.
- **Server-level `--tries` overriding class-level `$tries` expectation**: Worker `--tries` is a fallback — but if the class doesn't set `$tries`, the worker's value applies, which may be unexpected.

# Ecosystem Usage
- **Laravel framework**: `Worker::getNextJob()` reads `maxTries` from payload. `Worker::markJobAsFailedIfAlreadyExceedsMaxAttempts()` orchestrates all three checks.
- **Laravel Horizon**: Horizon supervisors set per-supervisor `tries` that apply to all jobs under that supervisor.
- **Spatie webhook-server**: Uses `$tries` and `$backoff` on webhook job classes for configurable retry.

# Related Knowledge Units
- K018 Backoff Strategies (how delay between retries works) | K016 Failure Taxonomy (context)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
