# 3-27 Soft Delete Column Indexing

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-27 |
| Knowledge Unit Title | Soft Delete Column Indexing |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 3.11 Partial indexes | 15.10 Soft delete pattern | 15.11 Soft delete unique constraints |
| Last Updated | 2026-06-02 |

## Overview

Soft deletes add `WHERE deleted_at IS NULL` to every query. Without a properly designed index, this additional filter degrades query performance on large tables. The `deleted_at` column should be part of composite indexes, not queried in isolation.

---

## Core Concepts

- **Automatic filter**: `SoftDeletes` trait registers a global scope adding `WHERE deleted_at IS NULL`.
- **Selectivity**: `deleted_at IS NULL` is highly selective when most rows are active (not soft-deleted). Low selectivity when most rows are soft-deleted.
- **Composite integration**: `deleted_at` should be the last column in composite indexes that cover the query's other filter columns.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Composite with deleted_at**: Index `(tenant_id, status, deleted_at)` — the query filters by tenant, status, and non-deleted. The soft delete filter uses the last column.
- **Partial index for PostgreSQL**: `CREATE INDEX ON orders (tenant_id, status) WHERE deleted_at IS NULL` — only indexes active rows, reducing index size.


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
| 1 | Indexing deleted_at alone**: An index on just `deleted_at` is rarely used — 50-90% of rows are IS NULL, making the index less efficient than a table scan. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not considering soft delete in index design**: Adding indexes for hot queries without including `deleted_at`. The index covers WHERE conditions but not the soft delete filter, causing residual filtering. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

