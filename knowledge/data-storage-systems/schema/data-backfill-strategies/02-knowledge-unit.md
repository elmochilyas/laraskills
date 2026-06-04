# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.19 Data backfill strategies (chunked, queued, low-priority, throttled)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Data backfill populates existing rows with values for newly added columns or tables. On large tables, a single UPDATE blocks replication, holds locks, and may time out. Production backfill strategies use chunked processing, queued jobs, throttled execution, and idempotent operations to migrate data safely under live traffic.

---

# Core Concepts

- **chunkById**: Processes rows in chunks using a stable, ordered key (typically the primary key). More reliable than offset-based chunking because it doesn't skip or duplicate rows if data changes during iteration.
- **Queued backfill**: Each chunk dispatches a queue job. Enables parallel processing, retry on failure, and progress tracking.
- **Throttling**: Rate-limiting the backfill to prevent resource contention. Implemented via sleep intervals, batch sizes, or queue rate limiting.
- **Idempotency**: Backfill operations must be safe to run multiple times. Use `WHERE new_column IS NULL` or `ON CONFLICT DO NOTHING`.

---

# Mental Models

Backfill is a batch ETL process, not a database operation. Treat it as a data pipeline: extract from old structure, transform if needed, load into new structure. Monitor throughput, error rates, and completion progress.

---

# Internal Mechanics

**Chunked approach**: Selects rows using `WHERE id > ? ORDER BY id LIMIT ?`. The `?` markers are tracked via a cursor variable. After each chunk, the cursor advances to the last processed ID. This avoids offset drift.

**Queued approach**: Each chunk dispatches a job to the queue (Redis, database, SQS). The queue allows parallel processing across multiple workers, automatic retries, and rate limiting.

**Throttled approach**: Adds a `usleep()` or queue delay between chunks to control database load. In MySQL, backpressure from replication lag monitoring automatically throttles.

---

# Patterns

**Idempotent updates**: Use `WHERE new_column IS NULL` or `ON CONFLICT (id) DO UPDATE` to ensure the backfill can be retried without duplicating work.

**Progress tracking**: Record the last processed ID in a dedicated `backfill_progress` table or cache key. Mid-flight crashes resume from the checkpoint.

**Read replica backfill**: For read-heavy backfills, process from a read replica to avoid impacting primary write workload.

---

# Architectural Decisions

| Approach | When | When Not |
|----------|------|----------|
| chunkById direct | Small to medium tables (< 1M rows) | Very large tables (needs queued processing) |
| Queued chunks | Large tables, production environments | Real-time requirements (queue delay is acceptable) |
| Raw UPDATE set | Tables < 10K rows, simple computations | Any table > 100K rows (causes replication lag) |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
chunkById prevents skipped/duplicate rows | Requires monotonic key | Composite PKs may not work naturally
Queued processing enables parallel execution | Queue overhead, job monitoring | Additional infrastructure complexity
Throttling protects database | Slower completion | Must balance speed vs safety

---

# Performance Considerations

- Each chunk iteration issues its own query. Chunk size determines query count: smaller chunks = more queries but less per-query impact.
- Without throttling, chunked UPDATE sequences can cause replication lag spikes.
- Queue workers processing backfill jobs compete with application workers for database connections.

---

# Production Considerations

- **Low-priority queue**: Use a dedicated queue with lower worker priority. Configure Horizon with separate worker pools for backfill vs application jobs.
- **Monitor replication lag**: Backfill should pause if replica lag exceeds a threshold (checkable via database monitoring).
- **Cancellation**: Design the backfill so it can be paused and resumed. Checkpoint tracking is essential.

---

# Common Mistakes

**Not using chunkById**: Using regular `chunk()` (offset-based) on a table where rows are being modified. Rows can be skipped or duplicated between chunks.

**Backfill inside a migration**: Running a single UPDATE in the migration's `up()` method on a table with millions of rows. This blocks the migration, holds a transaction, and may time out.

**Non-idempotent backfill**: Running the backfill again produces different results (e.g., appending instead of setting). This makes retry unsafe.

---

# Failure Modes

- **Backfill exceeds transaction timeout**: A single chunk's UPDATE is too large and exceeds the database's statement timeout.
- **Queue backpressure**: Hundreds of backfill jobs saturate the queue, delaying application-critical jobs. Use a dedicated queue.
- **Cursor drift**: The chunk cursor loses its place due to a failed chunk in the middle of processing. Resuming from the checkpoint requires careful re-sync.

---

# Related Knowledge Units

1.18 Expand-contract pattern | 4.19 chunk/chunkById/cursor/lazy tradeoffs

---

# Ecosystem Usage

Data backfill strategies are critical in the Laravel ecosystem for schema evolution at scale. Laravel's built-in `chunkById` and `lazyById` methods are the standard tools for production backfills. Queue systems like Horizon and SQS are commonly used to dispatch backfill jobs asynchronously. Laravel Vapor's serverless architecture heavily relies on queued backfill patterns to avoid Lambda execution time limits. Packages like `spatie/laravel-queue-rate-limit` provide fine-grained throttling. Monitoring tools like Laravel Telescope and Pulse track backfill job completion and failure rates. The Laravel community widely adopts the pattern of separate schema and data migrations.

# Research Notes

The most common backfill failure is treating it as a one-step operation inside a migration. Backfill should be a separate, queued, monitored process with rollback capability. The `chunkById` method is fundamentally safer than `chunk` for production backfills.
