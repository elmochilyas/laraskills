# 11-9 Data Backfill Best Practices

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-9 |
| Knowledge Unit Title | Data Backfill Best Practices |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 11.6 Expand-contract | 11.10 Verification during migrations |
| Last Updated | 2026-06-02 |

## Overview

Data backfill fills new columns/tables with data from existing structures. Backfill best practices: batch processing (100-1000 rows per batch), rate limiting (sleep between batches to reduce load), progress tracking (process X of N rows), error handling (retry per batch, skip bad rows), and verification (compare counts between old and new).

---

## Core Concepts

- **Batch size**: 500-1000 rows per batch for general use. Smaller (100) for write-heavy tables. Larger (5000) for archival.
- **Rate limiting**: `usleep(100_000)` (100ms) between batches. Adjust based on replication lag and CPU impact.
- **Progress tracking**: Store last processed ID in a `backfill_progress` table. Enables resume after failure.
- **Verification**: Compare `COUNT(*)`, hash aggregates (`MD5(GROUP_CONCAT(...))`), or sample comparisons.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **ID-based batch backfill**: `while ($maxId) { $rows = DB::table('orders')->where('id', '>', $lastId)->orderBy('id')->limit(500)->get(); if ($rows->isEmpty()) break; $lastId = $rows->last()->id; // process... }`. Resume by storing `$lastId`.
- **Rate-limited backfill command**: Artisan command with `--batch-size=500`, `--throttle-ms=100`, `--progress` options.


## Architecture Guidelines

- gh-ost: MySQL 8.0+, binlog trigger-free, millisecond lock. pt-osc: MySQL 5.7+, trigger-based, millisecond lock. pgroll: PostgreSQL 14+, view-based, no exclusive locks.

## Performance Considerations

- Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | No progress tracking**: Backfill fails at 70%. Restart from beginning. Hours wasted. Always checkpoint progress. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Trigger overhead from pt-osc degrades write performance. gh-ost cut-over fails under high write load. Insufficient disk space during online DDL.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Production Schema Operations
- **Closely Related**: Other KUs within Production Schema Operations
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

