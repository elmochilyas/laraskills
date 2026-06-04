# 11-1 Zero Downtime Migration Taxonomy

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-1 |
| Knowledge Unit Title | Zero Downtime Migration Taxonomy |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 11.6 Expand-contract | 11.2 gh-ost | 11.3 pt-online-schema-change |
| Last Updated | 2026-06-02 |

## Overview

Zero-downtime migrations prevent application outages during schema changes. Three approaches: expand-contract pattern (add new column/app code/remove old — multi-deploy), online DDL (database-native: MySQL INSTANT/INPLACE, PostgreSQL without locks), shadow tables (create new table, dual-write, swap). Choose based on migration type, database engine, and risk tolerance.

---

## Core Concepts

- **Expand-contract**: Step 1 (expand): add column, app writes to both old and new. Step 2 (migrate): backfill data. Step 3 (contract): remove old column/app code. Multi-deploy, safe.
- **Online DDL**: MySQL `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` — non-blocking DML during DDL. PostgreSQL `ALTER TABLE ... ADD COLUMN` — fast if no default.
- **Shadow table**: Create `new_orders` with desired schema. Set up triggers or dual-write. Backfill data. Atomic rename.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Expand-contract for risky migrations**: Column type changes, constraint additions, nullable→NOT NULL. Multiple deploys, rollback-safe at each step.
- **Online DDL for simple additions**: Add column, add index. Use MySQL ALGORITHM=INPLACE or PostgreSQL native.


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
| 1 | Blocking ALTER TABLE in production**: `ALTER TABLE ... ALGORITHM=COPY` locks table for minutes/hours. Production outage. Always check algorithm. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

