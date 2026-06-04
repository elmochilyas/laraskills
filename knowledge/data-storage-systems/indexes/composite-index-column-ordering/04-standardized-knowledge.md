# 3-9 Composite Index Column Ordering

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-9 |
| Knowledge Unit Title | Composite Index Column Ordering |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 3.1 B-Tree | 3.8 Composite/compound indexes | 3.10 Covering indexes | 4.4 Extra column flags |
| Last Updated | 2026-06-02 |

## Overview

The most important composite index design rule: place columns used in equality conditions (`=`, `IN`) before columns used in range conditions (`>`, `<`, `BETWEEN`, `ORDER BY`). This maximizes the portion of the index that can be efficiently searched.

---

## Core Concepts

- **Equality columns first**: The database can match exact values using the tree structure. Multiple equality columns can be matched exactly.
- **Range columns after**: The first range column ends the index's ability to support further columns. Subsequent columns beyond the first range column are not used for lookup.
- **ORDER BY alignment**: If the query has ORDER BY, that column should be last in the index (after all equality columns).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Standard pattern**: `WHERE tenant_id = ? AND status = ? AND created_at > ? ORDER BY created_at` → Index `(tenant_id, status, created_at)`. Equality filters first, range filter last.
- **IN as equality**: `WHERE status IN ('a', 'b')` behaves like multiple equality conditions. The database may transform IN to multiple range scans.
- **Covering sort**: If the index already sorts by the ORDER BY column, the database skips the explicit sort step. Look for "Using index" in Extra column (no "Using filesort").


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
| 1 | Range column in leading position**: Index `(created_at, status)` for query `WHERE created_at > ? AND status = ?`. The index can't use `status` for lookup — it scans the entire date range and then filters by status. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | ORDER BY column not in index**: Query sorts by a column not in the index. The database loads all matching rows into memory and sorts them (filesort). | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

