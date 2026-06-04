# 11-3 Pt Online Schema Change

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-3 |
| Knowledge Unit Title | Pt Online Schema Change |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 11.1 Zero-downtime taxonomy | 11.2 gh-ost |
| Last Updated | 2026-06-02 |

## Overview

pt-online-schema-change (pt-osc) uses triggers to keep a shadow table in sync. Creates a copy of the table, adds triggers (INSERT/UPDATE/DELETE) on the original table replicating changes to the shadow table. Runs `ALTER TABLE` on the shadow table (no lock), then atomic rename. Works on all MySQL versions.

---

## Core Concepts

- **Trigger-based sync**: AFTER INSERT/UPDATE/DELETE triggers on the original table write changes to the shadow table. Overhead: triggers fire on every DML. ~5-10% performance impact during migration.
- **Chunked copy**: Copies data in chunks (default 1000 rows per chunk). Sleep between chunks. Chunk size configurable.
- **Dry run**: `pt-online-schema-change --dry-run` — checks for FK issues, triggers, replicas. No actual migration.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **pt-osc for older MySQL (< 5.6)**: MySQL versions before 5.6 don't support online DDL. pt-osc is the only zero-downtime option.
- **pt-osc with foreign keys**: Requires `--alter-foreign-keys-method=auto`. Rebuilds FK relationships on the new table.


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
| 1 | Trigger overhead on write-heavy tables**: Triggers add latency to every INSERT/UPDATE/DELETE. For tables with > 1000 writes/second, use gh-ost (triggerless). | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

