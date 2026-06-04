# 3-26 Index Alignment With Query Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-26 |
| Knowledge Unit Title | Index Alignment With Query Patterns |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 3.8 Composite indexes | 3.15 Descending indexes | 4.24 Join optimization |
| Last Updated | 2026-06-02 |

## Overview

An index is optimal when it aligns with the full query access pattern: WHERE conditions, JOIN conditions, and ORDER BY direction. A composite index that matches all three eliminates both full table scans and explicit sort operations.

---

## Core Concepts

- **Index matching**: The index should cover WHERE columns (for filtering), JOIN columns (for lookups), and ORDER BY columns (for sorted output).
- **Filter + Sort alignment**: Best index: equality columns → range column → sort column. The index narrows the search and provides sorted results.
- **Join index**: The FK column in the JOIN condition must be indexed on the joined table.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Composite for filter + sort**: `WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC` → Index `(tenant_id, status, created_at DESC)`.
- **Covering index with INCLUDE**: Add SELECT columns to the index to avoid heap fetches.


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
| 1 | Indexing WHERE without ORDER BY**: The index narrows the search, but the database still sorts the result. Add the sort column to the index. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

