# 3-28 Sargability Rule

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-28 |
| Knowledge Unit Title | Sargability Rule |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 4.7 Sargable vs non-sargable query patterns | 4.8 whereDate sargability breakage | 4.10 Function wraps in WHERE |
| Last Updated | 2026-06-02 |

## Overview

Sargability (Search ARGument ABILITY) means the query condition can use an index. A condition is sargable when the indexed column appears alone (not wrapped in a function) on one side of the comparison. `WHERE DATE(created_at) = '2026-01-01'` is NOT sargable. `WHERE created_at >= '2026-01-01' AND created_at < '2026-01-02'` IS sargable.

---

## Core Concepts

- **Non-sargable patterns**: `WHERE LOWER(email) = ?`, `WHERE YEAR(date) = 2026`, `WHERE CAST(id AS CHAR) = ?`, `WHERE DATE(col) = ?`.
- **Why it breaks indexes**: The index stores raw column values. To use the index with a function, the database would need to compute the function for every index entry and compare.
- **Fix**: Rewrite the condition without wrapping the column. Use range queries instead of function extraction.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Replace WHERE DATE(col) = ? with range**: `WHERE col >= ? AND col < ?` (startOfDay to startOfNextDay).
- **Replace LOWER(col) with case-insensitive collation**: Set column collation to `utf8mb4_unicode_ci` (case-insensitive by default).
- **Replace YEAR(col) with range**: `WHERE col >= '2026-01-01' AND col < '2027-01-01'`.


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
| 1 | whereDate in Laravel**: `Model::whereDate('created_at', today())` generates `DATE(created_at) = ?`. Breaks index. Use `whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | LIKE with leading wildcard**: `LIKE '%search'` — cannot use B-Tree index because the starting character is unknown. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

