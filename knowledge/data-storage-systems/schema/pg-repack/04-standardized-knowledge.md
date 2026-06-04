# 1-15 Pg Repack

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-15 |
| Knowledge Unit Title | Pg Repack |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | - **Online DDL tools**: gh-ost (GitHub Online Schema Transitions), pt-online-schema-change (Percona Toolkit) — trigger-based approaches for MySQL that replicate data to a shadow table, then swap atomically. |
| Last Updated | 2026-06-02 |

## Overview

pg_repack is a PostgreSQL extension that removes table bloat and reorganizes indexes without requiring an ACCESS EXCLUSIVE lock. It works by creating a new copy of the table, applying changes via triggers or a logged table, and swapping in the new copy with only a brief ACCESS EXCLUSIVE lock during the final swap. Essential for reclaiming storage and improving query performance in high-write PostgreSQL environments.

---

## Core Concepts

- **Bloat**: Dead tuples in PostgreSQL tables and indexes caused by UPDATE and DELETE operations. Autovacuum reclaims space but may not fully compact the table.
- **ACCESS EXCLUSIVE lock**: The most restrictive PostgreSQL lock — blocks all reads and writes. pg_repack avoids holding this lock for the duration of the reorganization.
- **Trigger-based sync**: Like pt-osc, pg_repack uses triggers to capture ongoing changes during the rebuild.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Schedule regular pg_repack**: For high-write tables, schedule pg_repack during low-traffic periods (e.g., weekly).
- **Monitor bloat levels**: Use `pgstattuple` or `pg_bloat_check` queries to identify tables with > 20% bloat.
- **Combine with autovacuum tuning**: pg_repack handles compacting, but properly tuned autovacuum reduces how often pg_repack is needed.


## Architecture Guidelines

- | Decision | When | When Not |
- |----------|------|----------|
- | pg_repack | Tables with > 20% bloat, frequent UPDATE-heavy workloads | Tables with low write activity (autovacuum suffices) |
- | Full table repack vs index-only repack | Table bloat AND index bloat | Index-only bloat |


## Performance Considerations

- - pg_repack requires free disk space approximately equal to the target table's size.
- - During repack, write performance degrades due to trigger overhead and IO competition.
- - After repack, query performance improves due to compacted storage and reduced index depth.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Running on a table without sufficient free space**: pg_repack fails mid-operation because disk space is exhausted. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not rescheduling**: A one-time repack is insufficient for high-write tables — bloat returns. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Disk space exhaustion**: pg_repack requires ~2x the table size in free disk space during operation. Running out of space mid-repack corrupts the temporary table and requires manual cleanup of the `repack` schema.
- - **Exclusive lock wait**: The final swap phase requires a brief ACCESS EXCLUSIVE lock. If a long-running query holds a conflicting lock, pg_repack hangs. Monitor `pg_locks` for blocking sessions and use `--no-kill-backends` carefully.
- - **Trigger conflict**: pg_repack installs triggers on the target table. If another process (replication, CDC tool) also uses triggers, conflicts may cause the repack to fail.
- - **WAL explosion**: High-write tables generate significant WAL during repack, potentially exhausting WAL archiving storage or causing replica lag.
- - **Failed cleanup**: An interrupted repack leaves behind temporary tables in the `repack` schema and repack triggers on the target table. Manual cleanup with `DROP SCHEMA repack CASCADE` is required.


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

