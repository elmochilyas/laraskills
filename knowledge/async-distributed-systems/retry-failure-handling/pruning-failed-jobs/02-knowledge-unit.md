# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: Pruning Failed Jobs
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
The `failed_jobs` table grows unbounded as jobs fail over time. Left unpruned, it degrades query performance, increases storage costs, and slows down retry operations (`queue:retry` scans the table). Laravel provides `queue:prune-failed` to delete records older than a given age, and you can run it via the scheduler. Pruning should be part of standard queue maintenance — typically keep 7-30 days of failure history.

# Core Concepts
- **`queue:prune-failed`**: Artisan command that deletes `failed_jobs` records older than `--hours` (default 24).
- **Scheduler integration**: Run `$schedule->command('queue:prune-failed --hours=168')->daily()` for weekly pruning.
- **`FailedJobProviderInterface::prune()`**: Implemented by both `DatabaseFailedJobProvider` and `DynamoDbFailedJobProvider`.
- **Selective pruning**: You can't prune by exception type or queue without custom code — it's all-or-nothing by age.
- **Pruning does not affect in-flight retries**: Jobs currently being retried from `failed_jobs` are not affected because they've already been read.

# Mental Models
- **Archiving old files**: `failed_jobs` is like a filing cabinet. Pruning moves old files (older than N days) to the shredder. You don't need to keep every failed job forever — just enough for failure analysis.
- **Gardening**: Pruning removes dead leaves. If you never prune, the dead leaves pile up and smother the healthy plant (query performance).

# Internal Mechanics
- `DatabaseFailedJobProvider::prune(Carbon $before)` runs `DELETE FROM failed_jobs WHERE failed_at < ?`.
- `DynamoDbFailedJobProvider::prune()` scans the table for items older than `$before`, then batch-deletes them.
- The `$before` timestamp is `now()->subHours($hours)`.
- The database version uses a simple `DELETE` — no chunking by default. For large tables, this may lock rows.
- DynamoDB version uses `Scan` + `BatchWriteItem` (batch delete) — consumes read/write capacity.

# Patterns
## Tiered Retention
- **Purpose**: Keep recent failures (7 days) for quick inspection, archive older ones.
- **Benefit**: Fast queries for recent data, historical data preserved.
- **Tradeoff**: Extra infrastructure for archiving.

## Pruning via Queue
- **Purpose**: Offload the prune operation to a queue job.
- **Benefit**: Pruning doesn't block the CLI or scheduler.
- **Tradeoff**: If pruning queue is backed up, table grows.

## Notification on Prune Count
- **Purpose**: Log the number of pruned records.
- **Benefit**: Track failure volume over time.
- **Tradeoff**: Additional logging; log volume scales with failure rate.

# Architectural Decisions
- **Prune daily during low-traffic periods**: Nightly prune avoids contention with peak job processing.
- **Keep 7 days for most applications**: 7 days of failure history is sufficient for debugging. Financial/regulated apps may need 30-90 days.
- **Custom prune for selective retention**: If you need to keep specific failures longer, implement a custom command that archives before pruning.

# Tradeoffs
7-day retention | Low storage, fast queries, sufficient for debugging | Historical failure trends lost
30-day retention | Good for trend analysis, compliance | Larger table, slower queries
No pruning (keep forever) | Complete failure history | Table bloat, slow queries, expensive storage

# Performance Considerations
- Pruning a large `failed_jobs` table (>100K rows) with `DELETE` may lock the table in MySQL (InnoDB locks rows, not table, but bulk DELETE still impacts performance).
- For very large tables, consider chunking: `while (true) { DB::delete('DELETE FROM failed_jobs WHERE failed_at < ? LIMIT 1000', [$cutoff]); }`.
- DynamoDB pruning consumes read capacity for scan + write capacity for deletes. Monitor consumed capacity during prune.
- Bloat in `failed_jobs` slows `queue:retry all` (which scans all records).

# Production Considerations
- Always schedule pruning. A cron error or missed schedule shouldn't cause unbounded growth.
- Monitor `failed_jobs` table size. Alert if it exceeds a threshold (e.g., 1GB or 100K rows).
- After a major incident that generates many failures, run an extra prune after resolution.
- The `exception` column contains full stack traces — these are large. Pruning frees significant storage.
- For DynamoDB, the scan-delete cycle can be expensive. Use `--hours` to limit the scan range.

# Common Mistakes
- **Never setting up pruning**: The table grows indefinitely. Months later, a simple `queue:retry` takes seconds to scan.
- **Pruning too aggressively**: 1-hour retention means failures older than 1 hour are gone. If you don't notice an incident until later, the evidence is deleted.
- **Pruning during peak hours**: A large prune operation on the database impacts application query performance. Schedule during off-peak.
- **Not considering DynamoDB costs**: DynamoDB prune (scan + delete) consumes provisioned capacity. At high volume, this can throttle other operations or incur costs.

# Failure Modes
- **Prune lock timeout**: Table-locking on MyISAM (uncommon but possible). Switch to InnoDB.
- **DynamoDB throttle during prune**: Scan consumes read capacity. If other reads are happening concurrently, prune may be throttled, causing incomplete deletion.
- **Accidental prune of recent data**: If system clock is wrong or --hours misconfigured, recent failures could be deleted.
- **Replica delay causing re-insertion**: If pruning runs on the primary but the application reads from a replica with lag, the pruned records may appear to still exist temporarily.

# Ecosystem Usage
- **Laravel framework**: `queue:prune-failed` and `PrunableBatchRepository` for pruning `job_batches`.
- **Laravel Horizon**: Horizon does NOT automatically prune failed jobs. It relies on the system-wide `queue:prune-failed`.
- **Spatie packages**: Spatie webhook-server tracks failed webhooks in its own `webhook_calls` table — separate pruning needed.

# Related Knowledge Units
- K020 `failed_jobs` Table (storage structure) | K087 Ignoring Missing Models (related to failed job processing)

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
