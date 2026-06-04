# 3-15 Descending Indexes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-15 |
| Knowledge Unit Title | Descending Indexes |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.1 B-Tree | 3.9 Composite index column ordering |
| Last Updated | 2026-06-02 |

## Overview

Descending indexes store index entries in descending order, aligning with `ORDER BY col DESC` queries to avoid explicit reverse scans. Available in both PostgreSQL and MySQL 8.0+. Especially useful for queries that filter by one column and sort descending by another.

---

## Core Concepts

- **Index direction**: `CREATE INDEX ON orders (tenant_id, created_at DESC)` — stores entries in descending order for the created_at column.
- **Multi-column direction**: Each column can have its own direction. `(a ASC, b DESC)` — sorts by a ascending, then b descending.
- **Query alignment**: If the query orders by the same direction, the index provides sorted output without additional sort step.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Latest records per group**: Index `(user_id, created_at DESC)` for queries like "get user's most recent orders".
- **Timeline queries**: Index `(status, created_at DESC)` — filter by status, show most recent first.


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
| 1 | Not needed for single-column DESC**: MySQL and PostgreSQL both reverse-scan single-column indexes efficiently. Descending indexes matter most for composite indexes. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

