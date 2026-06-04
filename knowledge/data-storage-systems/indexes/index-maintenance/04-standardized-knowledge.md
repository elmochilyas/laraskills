# 3-19 Index Maintenance

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-19 |
| Knowledge Unit Title | Index Maintenance |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.15 pg_repack | 3.1 B-Tree | 3.20 Concurrent index creation |
| Last Updated | 2026-06-02 |

## Overview

Indexes degrade over time due to bloat (dead entries), fragmentation, and stale statistics. PostgreSQL uses VACUUM and REINDEX for maintenance. MySQL uses OPTIMIZE TABLE and ALGORITHM=INPLACE index rebuilds. Regular maintenance prevents performance degradation.

---

## Core Concepts

- **Bloat**: Dead index entries from UPDATE/DELETE operations. PostgreSQL B-Tree doesn't reuse dead space immediately.
- **fillfactor**: Percentage of each index page reserved for future updates. Default 90 (PostgreSQL). Lower values reduce page splits.
- **pg_repack**: Rebuilds indexes without ACCESS EXCLUSIVE lock. Essential for production.
- **REINDEX**: PostgreSQL rebuilds index from scratch. Requires exclusive lock. CONCURRENTLY option in PG 12+.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Monitor index bloat quarterly**: Use `pgstattuple` or bloat estimation queries. Schedule REINDEX or pg_repack for tables with > 20% bloat.
- **Set fillfactor for high-update columns**: If a column is frequently updated, reduce fillfactor to 70-80 so updates stay within the same page.
- **Vacuum frequency**: Aggressive autovacuum reduces index bloat accumulation. Tune `autovacuum_vacuum_scale_factor` for high-write tables.


## Architecture Guidelines

- Index types: B-Tree for equality/range/sort. GIN for JSONB and full-text. GiST for geospatial and ranges. BRIN for large ordered tables. Hash for equality-only in PostgreSQL.

## Performance Considerations

- B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index adds write amplification. BRIN indexes are efficient for large ordered datasets.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Not monitoring bloat**: Index performance degrades silently. A query that took 50ms now takes 200ms — and no index maintenance was ever run. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | REINDEX without planning**: REINDEX blocks writes. Use `REINDEX TABLE CONCURRENTLY` (PG 12+) or pg_repack for production. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Query planner ignores indexes when column types mismatch query parameter types. Implicit type conversion prevents index usage. Index bloat from heavy UPDATE/DELETE workloads degrades performance. Missing indexes on FK columns cause full table scans on JOIN queries.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Indexing Strategy Physical Design
- **Closely Related**: Other KUs within Indexing Strategy Physical Design
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

