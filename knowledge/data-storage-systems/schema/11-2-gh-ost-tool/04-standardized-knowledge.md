# 11-2 Gh Ost Tool

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-2 |
| Knowledge Unit Title | Gh Ost Tool |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 11.1 Zero-downtime taxonomy | 11.3 pt-online-schema-change |
| Last Updated | 2026-06-02 |

## Overview

gh-ost (GitHub Online Schema Translation) runs ALTER TABLE on MySQL without locks, triggers, or replicas. Creates a shadow table, streams binlog changes from the primary to keep the shadow table in sync, cuts over atomically. Supports throttling (replica lag, CPU), pause/resume, and dry-run mode. The safest MySQL schema migration tool.

---

## Core Concepts

- **Shadow table**: `_orders_gho` created with the desired schema. Triggerless — gh-ost uses binlog stream capture (hook on replicas or RDS binlog) to keep the shadow table in sync.
- **Cutover**: Atomic rename: rename original table (`orders→_orders_del`), rename shadow table (`_orders_gho→orders`). Instant (metadata only).
- **Throttle controls**: Replica lag threshold, CPU threshold, and manual `throttle` command. Pauses migration when load is high.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **gh-ost for large tables**: Tables > 50GB. gh-ost handles incremental copy + binlog streaming. Can pause/resume.
- **gh-ost migration workflow**: (1) `gh-ost --alter "ADD COLUMN status INT" --table orders --execute`. (2) Monitor progress via `/tmp/gh-ost.orders.sock`. (3) Verify after cutover.


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
| 1 | Running gh-ost without --exact-rowcount**: gh-ost estimates row count. Exact count via `SELECT COUNT(*)` takes time on large tables. Acceptable for accuracy. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

