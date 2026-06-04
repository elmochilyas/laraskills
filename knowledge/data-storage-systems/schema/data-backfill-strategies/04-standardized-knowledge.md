# 1-19 Data Backfill Strategies

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-19 |
| Knowledge Unit Title | Data Backfill Strategies |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.18 Expand-contract pattern | 4.19 chunk/chunkById/cursor/lazy tradeoffs |
| Last Updated | 2026-06-02 |

## Overview

Data backfill populates existing rows with values for newly added columns or tables. On large tables, a single UPDATE blocks replication, holds locks, and may time out. Production backfill strategies use chunked processing, queued jobs, throttled execution, and idempotent operations to migrate data safely under live traffic.

---

## Core Concepts

- **chunkById**: Processes rows in chunks using a stable, ordered key (typically the primary key). More reliable than offset-based chunking because it doesn't skip or duplicate rows if data changes during iteration.
- **Queued backfill**: Each chunk dispatches a queue job. Enables parallel processing, retry on failure, and progress tracking.
- **Throttling**: Rate-limiting the backfill to prevent resource contention. Implemented via sleep intervals, batch sizes, or queue rate limiting.
- **Idempotency**: Backfill operations must be safe to run multiple times. Use `WHERE new_column IS NULL` or `ON CONFLICT DO NOTHING`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Idempotent updates**: Use `WHERE new_column IS NULL` or `ON CONFLICT (id) DO UPDATE` to ensure the backfill can be retried without duplicating work.
- **Progress tracking**: Record the last processed ID in a dedicated `backfill_progress` table or cache key. Mid-flight crashes resume from the checkpoint.
- **Read replica backfill**: For read-heavy backfills, process from a read replica to avoid impacting primary write workload.


## Architecture Guidelines

- | Approach | When | When Not |
- |----------|------|----------|
- | chunkById direct | Small to medium tables (< 1M rows) | Very large tables (needs queued processing) |
- | Queued chunks | Large tables, production environments | Real-time requirements (queue delay is acceptable) |
- | Raw UPDATE set | Tables < 10K rows, simple computations | Any table > 100K rows (causes replication lag) |


## Performance Considerations

- - Each chunk iteration issues its own query. Chunk size determines query count: smaller chunks = more queries but less per-query impact.
- - Without throttling, chunked UPDATE sequences can cause replication lag spikes.
- - Queue workers processing backfill jobs compete with application workers for database connections.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Not using chunkById**: Using regular `chunk()` (offset-based) on a table where rows are being modified. Rows can be skipped or duplicated between chunks. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Backfill inside a migration**: Running a single UPDATE in the migration's `up()` method on a table with millions of rows. This blocks the migration, holds a transaction, and may time out. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Non-idempotent backfill**: Running the backfill again produces different results (e.g., appending instead of setting). This makes retry unsafe. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Backfill exceeds transaction timeout**: A single chunk's UPDATE is too large and exceeds the database's statement timeout.
- - **Queue backpressure**: Hundreds of backfill jobs saturate the queue, delaying application-critical jobs. Use a dedicated queue.
- - **Cursor drift**: The chunk cursor loses its place due to a failed chunk in the middle of processing. Resuming from the checkpoint requires careful re-sync.


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

