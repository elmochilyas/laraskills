# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.24 Schema and data migration separation (data changes in separate files/jobs)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Schema changes (ALTER TABLE, CREATE TABLE) and data migrations (UPDATE, backfill, transform) should be in separate files. Schema migrations should run in the deployment pipeline. Data migrations should be queued jobs that run asynchronously. This separation prevents long-running data operations from blocking deployment, enables independent rollback, and allows data migrations to be idempotent and retryable.

---

# Core Concepts

- **Schema migration**: DDL operations on table structure. Fast (milliseconds to seconds). Must run before code that depends on the new schema.
- **Data migration**: DML operations on existing rows. Potentially long-running (minutes to hours). Does not block deployment if run asynchronously.
- **Separation rationale**: A data migration that takes 2 hours should not block a deployment pipeline. The schema migration (adding the column) is fast. The data migration (backfilling values) is a background job.

---

# Mental Models

Schema changes are deployment gates — they must complete before the new code runs. Data changes are background tasks — they can complete after the deployment is live. Separating them decouples deployment velocity from data volume.

---

# Internal Mechanics

- Schema migration: Runs in `database/migrations/` as part of `php artisan migrate --force` in the deploy script.
- Data migration: Dispatched as a queue job from a service provider, a migration's `up()` method (that uses `dispatch()`), or a dedicated Artisan command run post-deploy.

---

# Patterns

**Migration dispatches job**: A migration's `up()` dispatches a single `BackfillSlugs` job via `dispatch()->onQueue('low-priority')`. The job handles chunked processing internally.

**Separate files in migrations directory**: Use a naming convention: `2026_06_02_000001_add_slug_to_articles.php` (schema) and `2026_06_02_000002_backfill_article_slugs.php` (data). The backfill migration's `up()` only dispatches the job — no direct data work.

**Defer data migration**: If the data can be backfilled asynchronously, use `Schema::table` to add the column, then deploy a separate queued job that runs for minutes/hours without blocking.

---

# Architectural Decisions

| Aspect | Schema Migration | Data Migration |
|--------|-----------------|----------------|
| Timing | Synchronous in deploy | Async via queue |
| Fail behavior | Block deploy | Retry via queue |
| Rollback | via down() method | via corrective migration |
| Transaction | Single DDL transaction | Per-chunk transaction |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Fast deployment pipeline | Data may be temporarily incomplete | Schema added, values are NULL initially
Independent rollback of schema vs data | More files to manage | Clear separation of concerns
Data migration can be retried | Additional monitoring needed | Track data migration completion status

---

# Common Mistakes

**Running a heavy UPDATE in a schema migration**: A schema migration adds a column, then runs `User::query()->update(['slug' => '...'])`. This locks the table, blocks the deploy, and may time out.

**Not making data migrations async**: A data migration that takes 10 minutes runs synchronously in the deploy pipeline. All other servers deploy faster and start using the new schema before the data migration completes on the first server.

---

# Related Knowledge Units

1.19 Data backfill strategies | 1.23 Model usage inside migrations anti-pattern | 1.25 Rollback strategy

---

# Ecosystem Usage

The separation of schema and data migrations is a standard practice in the Laravel community, documented in Laravel's own deployment guides and reinforced by community best practices from Laravel News, Laracasts, and Spatie. Packages like `spatie/laravel-queueable-actions` simplify dispatching backfill jobs from migrations. Laravel Vapor's architecture inherently enforces this separation because Lambda functions have a 15-minute execution limit. Forge and Envoyer deployment scripts commonly run schema migrations synchronously while triggering data backfill jobs asynchronously. Enterprise Laravel deployments with PCI or SOC2 compliance use this separation to ensure schema changes are audited independently from data transformations.

# Failure Modes

- **Schema migration succeeds, data migration fails**: The column exists but remains NULL for all rows. Application code referencing the new column gets NULL values. Mitigation: always add columns as nullable initially, use application-level defaults, and defer NOT NULL enforcement until backfill completes.
- **Data migration runs before schema migration**: A queued backfill job is processed by a worker running the old code version. The column doesn't exist yet; the job fails. Mitigation: version the backfill jobs and delay dispatch until the deploy completes.
- **Concurrent backfill conflicts**: Two backfill jobs attempt to update the same rows simultaneously, causing deadlocks. Mitigation: use chunkById with ordered processing, never parallel chunks on the same table.
- **Orphaned data migration entries**: A backfill migration is recorded in the `migrations` table (via `up()` that dispatches a job) but the job itself isn't tracked. Rolling back the migration doesn't undo the backfill. Use a dedicated `backfill_progress` table.

# Performance Considerations

- Schema migrations are fast (ms to seconds) and can run synchronously in the deploy pipeline.
- Data migrations should use chunked processing with configurable sleep intervals. A backfill on a 10M-row table at 1000 rows per chunk takes ~10,000 queries. With a 100ms sleep between chunks, total time ≈ 17 minutes.
- Queue workers processing backfill jobs consume database connections. Backfill workers should use a separate connection pool to avoid starving application requests.
- The `low-priority` queue in Laravel uses less resources but may delay completion. Monitor backfill completion time against the deploy window.

# Production Considerations

- **Dispatch after deploy completes**: Use `dispatchAfterResponse()` or a post-deploy Artisan command to trigger data migrations, ensuring the application code that references the new schema is active.
- **Separate queue for backfill**: Configure a dedicated Horizon queue worker for backfill jobs with lower CPU priority and fewer processes than application queues.
- **Idempotency guard**: Data migrations must be safe to run multiple times. Use `WHERE new_column IS NULL` or `ON CONFLICT DO NOTHING` to prevent double-processing.
- **Backfill completion monitoring**: Track backfill progress in a dashboard. Alert if a backfill job fails or stalls. Use Laravel Pulse or custom monitoring.
- **Rollback consideration**: Rolling back a schema migration that added a column is safe only after verifying the backfill has been reversed or is no longer running.

---

# Research Notes

The separation of schema and data migrations is a hallmark of mature Laravel deployment practices. Teams that mix them inevitably experience deployment failures caused by long-running data operations timing out.
