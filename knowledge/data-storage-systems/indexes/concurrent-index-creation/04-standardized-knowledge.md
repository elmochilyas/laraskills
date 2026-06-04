# 3-20 Concurrent Index Creation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-20 |
| Knowledge Unit Title | Concurrent Index Creation |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.19 Index maintenance | 13.5 Online DDL |
| Last Updated | 2026-06-02 |

## Overview

Concurrent index creation prevents table locking during index builds. PostgreSQL uses `CREATE INDEX CONCURRENTLY`. MySQL uses `ALGORITHM=INPLACE LOCK=NONE`. Essential for adding indexes to large tables under live traffic.

---

## Core Concepts

- **PostgreSQL CONCURRENTLY**: Builds index in background without blocking writes. Takes 2-3x longer. Can't run inside a transaction.
- **MySQL ALGORITHM=INPLACE LOCK=NONE**: Rebuilds table in-place while allowing concurrent DML. Supports most index operations.
- **Tradeoff**: Both methods take longer than standard index creation but allow zero-downtime index addition.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Always use CONCURRENTLY for large tables**: Any table with > 1M rows actively written to should use CONCURRENTLY.
- **Single statement per transaction**: CONCURRENTLY can't run inside a transaction. Each index creation must be its own migration.
- **MySQL: explicit ALGORITHM**: Specify `ALGORITHM=INPLACE LOCK=NONE` explicitly rather than relying on defaults.


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
| 1 | CONCURRENTLY inside transaction**: PostgreSQL raises error. Must use raw `DB::statement()` outside transaction. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Multiple CONCURRENTLY in one migration**: Each CONCURRENTLY triggers an implicit commit. Only one per migration file. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Ignoring invalid indexes**: If CONCURRENTLY fails, the index remains in INVALID state. Must be dropped and recreated. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Query planner ignores indexes when column types mismatch query parameter types. Implicit type conversion prevents index usage. Index bloat from heavy UPDATE/DELETE workloads degrades performance. Missing indexes on FK columns cause full table scans on JOIN queries.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Indexing Strategy Physical Design
- **Closely Related**: Other KUs within Indexing Strategy Physical Design
- **Closely Related**: 1.27 Online index creation
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

