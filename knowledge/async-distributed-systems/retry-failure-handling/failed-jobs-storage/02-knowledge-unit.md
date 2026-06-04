# Metadata
Domain: Async & Distributed Systems
Subdomain: Retry & Failure Handling
Knowledge Unit: `failed_jobs` Table and DynamoDB Storage
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Failed jobs are persisted for inspection and retry in either the `failed_jobs` database table or an Amazon DynamoDB table. The database implementation is the default — a simple table with columns for ID, UUID, connection, queue, payload, exception, and timestamps. DynamoDB is an alternative for high-volume failure storage with automatic scaling and no schema management. Both implementations implement `FailedJobProviderInterface` and are swappable via config. The storage choice affects retry workflow performance, cost, and operational overhead.

# Core Concepts
- **Database storage**: Default `failed_jobs` table with columns: `id`, `uuid`, `connection`, `queue`, `payload` (TEXT), `exception` (TEXT), `failed_at` (timestamp).
- **DynamoDB storage**: Configurable table keyed by `uuid`. No schema migrations required. Uses AWS SDK.
- **`FailedJobProviderInterface`**: Contract with `log()`, `find()`, `all()`, `forget()`, `flush()` methods.
- **Payload storage**: The full job payload is stored — serialized job object, connection, queue, and timestamps.
- **Exception storage**: The full exception string (stack trace) is stored for debugging.

# Mental Models
- **Black box recorder**: `failed_jobs` is the flight recorder for queue operations. Every crash (failure) records the state (payload) and error (exception) for later analysis and replay.
- **Hospital morgue**: Failed jobs go to the morgue (failed_jobs). You can visit the morgue to examine the body (inspect), revive it (retry), or dispose of it (prune).

# Internal Mechanics
- `Worker::failJob()` calls `$this->failer->log($exception, $job->getJobId(), $job->payload())`.
- `DatabaseFailedJobProvider::log()` inserts: `uuid`, `connection`, `queue`, `payload`, `exception`, `failed_at`.
- `DynamoDbFailedJobProvider::log()` calls `DynamoDbClient::putItem()` with the same data as attributes.
- `config/queue.php` has `failed` section: `driver` (database/dynamodb), `database` (table or connection), `dynamodb` (table name, key).
- `find($id)` for database: `SELECT * FROM failed_jobs WHERE uuid = ?`. For DynamoDB: `GetItem` with key.
- `flush()` deletes all failed jobs. `forget($id)` deletes one. Both implementations batch deletes for DynamoDB.

# Patterns
## Dedicated Failed Job Store
- **Purpose**: Store failed jobs in a separate database (or DynamoDB) from the application database.
- **Benefit**: Failure storage doesn't compete with application queries.
- **Tradeoff**: Additional infrastructure, cross-DB queries.

## Structured Exception Logging
- **Purpose**: Parse the exception string to extract structured failure data.
- **Benefit**: Programmatic analysis of failure patterns.
- **Tradeoff**: Exception string is formatted for humans, not machines; parsing is fragile.

## Automated Failed Job Triage
- **Purpose**: Periodically inspect failed jobs and categorize by exception type.
- **Benefit**: Proactive failure detection before alerting.
- **Tradeoff**: Processing overhead on the failed_jobs table.

# Architectural Decisions
- **Use database for failed jobs when**: You want a simple, no-infrastructure setup, or you're already monitoring the application database.
- **Use DynamoDB for failed jobs when**: High failure volume (>1000 failed jobs/day), want to avoid bloat on application DB, or already on AWS.
- **Use custom provider when**: You need to send failures to an external logging system (DataDog, Sentry) immediately, bypassing local storage.

# Tradeoffs
Database failed_jobs | Simple, no extra infra, easy to query | Competes with app DB; TEXT columns slow queries at scale
DynamoDB | Auto-scaling, no schema management, fast lookups | AWS dependency; cost per write; limited query capabilities
Custom provider | Send to any destination | Must implement the full interface

# Performance Considerations
- Database `failed_jobs` queries scale poorly at high volume. `SELECT *` on 1M rows is slow. Paginate or prune frequently.
- DynamoDB writes cost ~$1.25/million writes (on-demand). At high failure rates, this cost adds up.
- The `exception` TEXT column stores the full stack trace — a single failed job can add 2-10KB to the table.
- `flush()` on large database tables can lock the table. DynamoDB `Scan` + `BatchWriteItem` may throttle.

# Production Considerations
- Prune failed jobs regularly via `queue:prune-failed` or scheduled job. Default: keep for 7 days.
- Monitor failed_jobs table size. Bloat affects retry performance and maintenance.
- For DynamoDB, monitor consumed write capacity. Throttling causes failed job records to be lost.
- The `payload` column contains serialized job data — may include sensitive information. Consider encryption at rest.
- Retry via `queue:retry` reads the job from failed_jobs and re-dispatches. It does NOT delete the failed record until successful.

# Common Mistakes
- **Never pruning failed jobs**: The table grows unbounded. Queries slow down, storage costs increase, and retry operations become slow.
- **Storing sensitive data in job payload**: The payload is stored permanently in failed_jobs. If payloads contain PII or secrets, this is a compliance risk.
- **Relying on DynamoDB for failure analytics**: DynamoDB can't do complex queries. If you need to analyze failure patterns, stream to a proper analytics store.
- **Assuming failed_jobs is the only failure record**: The `Queue::failing` event fires before storage. Event listeners may also process failures.

# Failure Modes
- **Failed job storage failure**: If the database or DynamoDB is unavailable when a job fails, the failure is lost. The exception is logged but not persisted.
- **Payload too large for database**: The `payload` TEXT column has limits (64KB for MySQL TEXT, 4GB for LONGTEXT). Extremely large payloads may be truncated.
- **DynamoDB throttling**: Under high concurrent failure rates, DynamoDB may throttle writes. Unthrottled failures are silently dropped.
- **Corrupted payload in storage**: If a job fails due to serialization issues, the payload stored in failed_jobs may also be corrupted, preventing retry.

# Ecosystem Usage
- **Laravel framework**: `FailedJobProviderInterface` is implemented by `DatabaseFailedJobProvider` and `DynamoDbFailedJobProvider`.
- **Laravel Horizon**: Horizon uses the configured failed job provider for its retry functionality. The Horizon dashboard shows failed jobs from the provider.
- **Laravel Pulse**: Tracks failed job counts from the failed_jobs provider for the Failures chart.

# Related Knowledge Units
- K021 `failed()` Method on Jobs | K086 Pruning Failed Jobs | K087 Ignoring Missing Models

## Research Notes
- Laravel's failure taxonomy separates transient failures (network timeouts, deadlocks) from permanent failures (validation errors, missing models) — the 	ries and maxExceptions properties handle the former, while ailed() methods handle the latter.
- The etryUntil method takes precedence over 	ries when both are defined — the job will retry until the absolute timestamp, regardless of how many attempts that takes.
- Exponential backoff in Laravel uses a base delay doubled with each attempt: ackoff => [10, 20, 40, 80, 160] — the array length defines the number of attempts before the job fails permanently.
- The dead letter queue pattern is natively supported by SQS (via Redrive Policy) and RabbitMQ (via DLX), but Laravel does not have a built-in DLQ — community solutions involve separate queue connections for failed job inspection.
- Pruning failed jobs (ailed_jobs table) should be scheduled to prevent unbounded growth — model:prune with the Prunable trait on a custom failed job model can automate this.
- The ailed() method on jobs is called when all retry attempts are exhausted — it runs in the worker process and should be lightweight (logging, notification) to avoid delaying the worker.
- Idempotency patterns for job processing require a unique job identifier and a deduplication check before processing — this is critical for payment and notification jobs where duplicate execution has real-world consequences.
- Model hydration failures in queued jobs (Illuminate\Contracts\Database\ModelIdentifier) are silent — the job fails without clear error indication, often confused with timeout issues.
