# 3-11 Partial Indexes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-11 |
| Knowledge Unit Title | Partial Indexes |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.1 B-Tree | 3.27 Soft delete column indexing | 15.11 Soft delete with unique constraints |
| Last Updated | 2026-06-02 |

## Overview

Partial indexes index only a subset of rows matching a `WHERE` condition. They are smaller, faster to maintain, and more targeted than full-table indexes. Common use cases: index only active records, unprocessed queue items, or non-deleted rows. PostgreSQL exclusive (MySQL does not support partial indexes).

---

## Core Concepts

- **WHERE predicate**: `CREATE INDEX idx_active_users ON users (email) WHERE status = 'active'`. Only rows with `status = 'active'` are in the index.
- **Query matching**: The query's WHERE clause must match or imply the index predicate. PostgreSQL recognizes implied predicates.
- **Size benefit**: An index on 20% of rows is ~20% the size of a full index. Write maintenance is similarly reduced.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Filtered status queries**: Index on `(tenant_id, created_at)` WHERE `status = 'pending'` — optimized for "show me pending orders" queries.
- **Soft delete optimization**: `CREATE INDEX ON users (email) WHERE deleted_at IS NULL` — unique email constraint only for non-deleted users.
- **Queue processing**: Index on unprocessed queue items. Items are removed from the index (by updating their status) when processed.
- **Archived data exclusion**: Most queries filter `WHERE archived = false`. Partial index on active data keeps the index small and fast.


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
| 1 | Query predicate doesn't match index predicate**: Index `WHERE status = 'active'` but query `WHERE status = 'active' AND plan = 'premium'`. PostgreSQL recognizes this as matching (the index predicate is implied by the query). However, `WHERE status IN ('active', 'pending')` does NOT match. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Partial index on volatile columns**: Status changes frequently. Each change requires deleting+inserting the index entry. On a table with rapid status changes, the partial index maintenance overhead may exceed the benefit. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

