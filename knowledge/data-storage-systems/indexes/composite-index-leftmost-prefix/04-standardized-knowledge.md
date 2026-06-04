# 3-8 Composite Index Leftmost Prefix

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-8 |
| Knowledge Unit Title | Composite Index Leftmost Prefix |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 3.1 B-Tree | 3.9 Composite index best practices | 3.10 Covering indexes | 3.18 Composite index selectivity |
| Last Updated | 2026-06-02 |

## Overview

Composite indexes index multiple columns in a defined order (left to right). The leftmost prefix rule determines which query patterns the index can serve: queries must reference a leftmost subset of the indexed columns. Column ordering within a composite index is the most impactful index design decision.

---

## Core Concepts

- **Leftmost prefix**: Index on `(a, b, c)` serves queries on `(a)`, `(a, b)`, and `(a, b, c)`. Does NOT serve queries on `(b)`, `(c)`, or `(b, c)`.
- **Sort order**: The index is sorted by column a first, then within equal a values by column b, then within equal b values by column c.
- **Skip scan (PostgreSQL)**: Can use index for non-leading column if there are few distinct values in leading columns. MySQL 8.0.13+ supports similar functionality.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Equality first, range after**: Columns used in `=` conditions should come before columns used in range/order conditions. `WHERE a = 1 AND b > 5` benefits from index `(a, b)` — jump to a=1, scan b range within it.
- **High cardinality first**: Put columns with more distinct values first to maximize early pruning.
- **Covering index**: Add all columns used in SELECT to the index (via INCLUDE) to enable index-only scans.


## Architecture Guidelines

- | Query Pattern | Index Order | Rationale |
- |--------------|------------|-----------|
- | WHERE a = ? AND b = ? | (a, b) | Both equality, order doesn't matter much |
- | WHERE a = ? AND b > ? | (a, b) | Equality first, range second |
- | WHERE a = ? ORDER BY b | (a, b) | Index provides sorted output |
- | WHERE b = ? | (b) only | Leftmost prefix means (a, b) won't help |


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
| 1 | Wrong column order**: Index `(status, created_at)` but the query filters by `created_at` first. The index is not used. Place the most selective equality column first. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Indexing all queryable columns in one index**: A 6-column composite index where only the first 2 columns serve the query. Remaining columns add maintenance cost without benefit. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Not verifying index usage**: Adding a composite index without running EXPLAIN. The optimizer may not use it as expected. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

