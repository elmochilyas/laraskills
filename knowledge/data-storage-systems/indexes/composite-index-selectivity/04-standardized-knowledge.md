# 3-18 Composite Index Selectivity

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-18 |
| Knowledge Unit Title | Composite Index Selectivity |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.8 Composite indexes | 3.9 Column ordering | 3.1 B-Tree |
| Last Updated | 2026-06-02 |

## Overview

Cardinality (number of distinct values) determines index selectivity. High cardinality columns (ID, email) are highly selective — they narrow results to few rows. Low cardinality columns (status, boolean) are poorly selective. Composite index design must consider each column's cardinality and the query's access pattern.

---

## Core Concepts

- **Selectivity**: Fraction of rows returned per distinct value. `1/cardinality`. Higher = more selective = better index.
- **Cardinality distribution**: A column may have high cardinality overall but low cardinality in the queried subset.
- **Leading column selectivity**: The index's leading column should be selective enough to meaningfully reduce the search space.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **High cardinality first**: `(user_id, status)` — user_id is highly selective. The index quickly narrows to one user's records, then filters by status.
- **Low cardinality as second column**: Status alone has 3 values — 33% of table per value. Leading with status is inefficient.


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
| 1 | Misunderstanding cardinality distribution**: A column with 10 distinct values evenly distributed (10% each) is different from 10 values where one value covers 99% of rows. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Ignoring correlated columns**: `created_date` and `created_at` have similar cardinality because they're correlated. Indexing both provides little benefit over one. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

