# 3-1 B Tree Index Structure

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-1 |
| Knowledge Unit Title | B Tree Index Structure |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 3.8 Composite/compound indexes | 3.10 Covering indexes | 3.21 Index management in migrations |
| Last Updated | 2026-06-02 |

## Overview

B-Tree (balanced tree) indexes are the default and most common index type in both MySQL and PostgreSQL. They organize data in a sorted tree structure enabling fast lookups (O(log n)) for equality, range, prefix, and sorted access. Understanding B-Tree structure is essential for composite index design, covering index strategies, and query plan analysis.

---

## Core Concepts

- **Structure**: Balanced tree with root, internal nodes, and leaf pages. Each node contains sorted key values and pointers.
- **Lookup types**: Equality (`WHERE id = 5`), Range (`WHERE id > 100`), Prefix (`WHERE name LIKE 'Jon%'`), Sort (`ORDER BY name`).
- **Leaf pages**: Contain the actual index entries and pointers to heap tuples (PostgreSQL) or clustered index entries (MySQL InnoDB).
- **Clustered vs non-clustered**: InnoDB's primary key is a clustered index (data stored with index). Secondary indexes point to PK. PostgreSQL uses heap with separate index entries pointing to TIDs.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **B-Tree for most indexes**: Default choice for equality and range queries on scalar data. Supports ORDER BY without extra sort.
- **Index for ORDER BY**: If the ORDER BY column is the leading column of a B-Tree index and the WHERE conditions are on earlier columns, the result is already in sorted order.
- **Prefix matching**: `LIKE 'prefix%'` uses B-Tree range scan. `LIKE '%suffix'` does not.


## Architecture Guidelines

- | Query Type | B-Tree Suitable | Alternative |
- |-----------|----------------|-------------|
- | WHERE id = ? | YES | Hash (PG) |
- | WHERE col > ? | YES | — |
- | ORDER BY col | YES | — |
- | LIKE 'prefix%' | YES | Full-text |
- | JSONB containment | NO | GIN |
- | Spatial query | NO | GiST (PG), R-Tree (MySQL) |


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
| 1 | Indexing low-cardinality columns alone**: An index on `status` (with only 3 distinct values) is rarely used by the optimizer — scanning 33% of a table is cheaper than the index. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Assuming B-Tree for text search**: `LIKE '%value%'` cannot use B-Tree range scan. It falls back to full table scan. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

