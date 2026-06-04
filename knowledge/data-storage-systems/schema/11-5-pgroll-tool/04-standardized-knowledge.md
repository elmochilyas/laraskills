# 11-5 Pgroll Tool

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-5 |
| Knowledge Unit Title | Pgroll Tool |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 11.1 Zero-downtime taxonomy | 11.6 Expand-contract |
| Last Updated | 2026-06-02 |

## Overview

pgroll is a PostgreSQL migration tool that creates a new version of the schema, supports dual-write (write to both old and new schema), and cuts over atomically. Unlike MySQL tools, pgroll is PostgreSQL-native, understanding PostgreSQL features (NOT VALID, GENERATED columns, RLS). Provides rollback capability without data loss.

---

## Core Concepts

- **Version-based**: Create schema version V2 alongside V1. Write to both during migration. Reads served from V1 until cutover.
- **PostgreSQL-native**: Uses PostgreSQL features: `NOT NULL` via `NOT VALID`, defaults via `SET DEFAULT`, column renames via views.
- **Rollback**: Since V1 schema/data is preserved during migration, rollback is instant (just stop writing to V2).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **pgroll for production**: Run pgroll in `--mode=read-write` (dual-write). Monitor. At cutover, switch to `--mode=read-write-new` (reads from new schema). Then `--complete`.
- **pgroll for NOT NULL addition**: Add column as nullable. Backfill. `pgroll` changes constraint to NOT NULL via `NOT VALID` — no table scan.


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
| 1 | pgroll requires dual application awareness**: Application must be compatible with both V1 and V2 schemas during migration. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

