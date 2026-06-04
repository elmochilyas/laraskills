# 3-2 Hash Indexes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-2 |
| Knowledge Unit Title | Hash Indexes |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.1 B-Tree index structure | 3.4 GIN indexes | 3.5 BRIN indexes |
| Last Updated | 2026-06-02 |

## Overview

Hash indexes in PostgreSQL store a 32-bit hash code of the indexed value, enabling fast equality lookups. They are smaller than B-Tree indexes for equality-only queries but do not support range queries, sorting, or prefix matching. WAL-logged since PostgreSQL 10.

---

## Core Concepts

- **Hash function**: Computes a 32-bit hash of the key. Index stores (hash, TID) pairs.
- **Equality only**: `WHERE col = ?` can use hash index. `WHERE col > ?`, `ORDER BY col`, `LIKE` cannot.
- **Collisions**: Hash collisions are handled by storing multiple entries per hash value.
- **WAL logging**: Pre-PostgreSQL 10, hash indexes were not WAL-logged and were lost on crash. Since PG 10, they are fully crash-safe.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use when B-Tree is overkill**: Single-column equality lookups on large tables where the index is primarily used for WHERE conditions with no ORDER BY.
- **Smaller than B-Tree**: Hash index typically uses less storage than B-Tree for the same column (no tree structure, just hash buckets).


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
| 1 | Using hash when B-Tree is needed**: Adding a hash index for a column that later requires range queries or ORDER BY. Must switch to B-Tree. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

