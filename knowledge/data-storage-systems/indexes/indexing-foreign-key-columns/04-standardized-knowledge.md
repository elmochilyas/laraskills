# 3-24 Indexing Foreign Key Columns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-24 |
| Knowledge Unit Title | Indexing Foreign Key Columns |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 1.4 Foreign key definition | 15.2 Foreign key index requirements |
| Last Updated | 2026-06-02 |

## Overview

Foreign key columns must be indexed for JOIN performance. Laravel's `->constrained()` automatically adds an index. Manual FK definitions do NOT. Unindexed FK columns cause full table scans on every JOIN.

---

## Core Concepts

- **constrained() auto-index**: `$table->foreignId('user_id')->constrained()` creates FK constraint AND index.
- **Manual FK without index**: `$table->foreign('user_id')->references('id')->on('users')` creates FK constraint only. No index. Full table scan on every JOIN.
- **MySQL InnoDB**: Automatically indexes FK columns if no index exists. PostgreSQL does not.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Always use constrained()**: Reduces FK errors and ensures indexes exist. Exception: when custom index name or type is needed.
- **Verify indexes in code review**: Check that all FK columns have indexes. Look for `foreign()` without `index()` as a red flag.


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
| 1 | Manual FK without index**: The most common FK performance mistake. JOIN queries on the FK column perform full table scans. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

