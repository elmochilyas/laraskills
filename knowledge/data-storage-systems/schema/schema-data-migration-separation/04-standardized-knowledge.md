# 1-24 Schema Data Migration Separation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-24 |
| Knowledge Unit Title | Schema Data Migration Separation |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.19 Data backfill strategies | 1.23 Model usage inside migrations anti-pattern | 1.25 Rollback strategy |
| Last Updated | 2026-06-02 |

## Overview

Schema changes (ALTER TABLE, CREATE TABLE) and data migrations (UPDATE, backfill, transform) should be in separate files. Schema migrations should run in the deployment pipeline. Data migrations should be queued jobs that run asynchronously. This separation prevents long-running data operations from blocking deployment, enables independent rollback, and allows data migrations to be idempotent and retryable.

---

## Core Concepts

- **Schema migration**: DDL operations on table structure. Fast (milliseconds to seconds). Must run before code that depends on the new schema.
- **Data migration**: DML operations on existing rows. Potentially long-running (minutes to hours). Does not block deployment if run asynchronously.
- **Separation rationale**: A data migration that takes 2 hours should not block a deployment pipeline. The schema migration (adding the column) is fast. The data migration (backfilling values) is a background job.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Migration dispatches job**: A migration's `up()` dispatches a single `BackfillSlugs` job via `dispatch()->onQueue('low-priority')`. The job handles chunked processing internally.
- **Separate files in migrations directory**: Use a naming convention: `2026_06_02_000001_add_slug_to_articles.php` (schema) and `2026_06_02_000002_backfill_article_slugs.php` (data). The backfill migration's `up()` only dispatches the job — no direct data work.
- **Defer data migration**: If the data can be backfilled asynchronously, use `Schema::table` to add the column, then deploy a separate queued job that runs for minutes/hours without blocking.


## Architecture Guidelines

- | Aspect | Schema Migration | Data Migration |
- |--------|-----------------|----------------|
- | Timing | Synchronous in deploy | Async via queue |
- | Fail behavior | Block deploy | Retry via queue |
- | Rollback | via down() method | via corrective migration |
- | Transaction | Single DDL transaction | Per-chunk transaction |


## Performance Considerations

- - Schema migrations are fast (ms to seconds) and can run synchronously in the deploy pipeline.
- - Data migrations should use chunked processing with configurable sleep intervals. A backfill on a 10M-row table at 1000 rows per chunk takes ~10,000 queries. With a 100ms sleep between chunks, total time ≈ 17 minutes.
- - Queue workers processing backfill jobs consume database connections. Backfill workers should use a separate connection pool to avoid starving application requests.
- - The `low-priority` queue in Laravel uses less resources but may delay completion. Monitor backfill completion time against the deploy window.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Running a heavy UPDATE in a schema migration**: A schema migration adds a column, then runs `User::query()->update(['slug' => '...'])`. This locks the table, blocks the deploy, and may time out. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not making data migrations async**: A data migration that takes 10 minutes runs synchronously in the deploy pipeline. All other servers deploy faster and start using the new schema before the data migration completes on the first server. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Schema migration succeeds, data migration fails**: The column exists but remains NULL for all rows. Application code referencing the new column gets NULL values. Mitigation: always add columns as nullable initially, use application-level defaults, and defer NOT NULL enforcement until backfill completes.
- - **Data migration runs before schema migration**: A queued backfill job is processed by a worker running the old code version. The column doesn't exist yet; the job fails. Mitigation: version the backfill jobs and delay dispatch until the deploy completes.
- - **Concurrent backfill conflicts**: Two backfill jobs attempt to update the same rows simultaneously, causing deadlocks. Mitigation: use chunkById with ordered processing, never parallel chunks on the same table.
- - **Orphaned data migration entries**: A backfill migration is recorded in the `migrations` table (via `up()` that dispatches a job) but the job itself isn't tracked. Rolling back the migration doesn't undo the backfill. Use a dedicated `backfill_progress` table.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

