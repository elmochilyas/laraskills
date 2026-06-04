# 3-10 Covering Indexes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-10 |
| Knowledge Unit Title | Covering Indexes |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.1 B-Tree | 3.8 Composite indexes | 3.16 INCLUDE columns | 4.4 Extra column flags |
| Last Updated | 2026-06-02 |

## Overview

A covering index contains all columns needed by a query, allowing the database to satisfy the query entirely from the index without accessing the table (heap fetch). This eliminates the most expensive part of query execution: reading rows from the table. In PostgreSQL, this is achieved by adding non-key columns via `INCLUDE`.

---

## Core Concepts

- **Index-only scan**: The database reads only the index, never the table. Marked as "Using index" in MySQL EXPLAIN, or "Index Only Scan" in PostgreSQL.
- **Heap fetch elimination**: The index has all needed data. The database avoids the random I/O of reading table pages.
- **INCLUDE columns (PostgreSQL)**: `CREATE INDEX ON orders (tenant_id, status) INCLUDE (total)` — adds `total` to the index leaf pages without affecting the tree structure. Useful for adding payload columns without violating uniqueness or leftmost prefix rules.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Dashboard queries**: Index all columns needed for dashboard aggregation queries. The entire query runs from the index.
- **List endpoints**: Include frequently selected columns in the index to avoid heap fetches.
- **INCLUDE for unique indexes**: Add `INCLUDE (payload)` to a unique index to make it covering without breaking uniqueness semantics.


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
| 1 | Over-covering**: Adding 15 columns to an index to cover a query. The index becomes nearly as large as the table, eliminating the benefit. Selectively include only the columns that reduce heap fetches. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not using INCLUDE in PostgreSQL**: Adding payload columns as regular index columns when they should be INCLUDE. This unnecessarily increases B-Tree depth and uniqueness constraints. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

