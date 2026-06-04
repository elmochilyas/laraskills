# 3-12 Functional Expression Indexes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-12 |
| Knowledge Unit Title | Functional Expression Indexes |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.11 Partial indexes | 3.28 Sargability rule | 12.23 Expression/functional indexes |
| Last Updated | 2026-06-02 |

## Overview

Functional indexes index the result of an expression rather than a raw column value. Essential for making sargable queries that use functions in WHERE clauses. PostgreSQL and MySQL 8.0+ support them. Common use cases: case-insensitive search, date extraction, JSON path extraction.

---

## Core Concepts

- **Expression index**: `CREATE INDEX ON users (LOWER(email))`. The index stores `LOWER(email)` values.
- **Query matching**: The expression in WHERE must exactly match the index expression. `WHERE LOWER(email) = 'test@example.com'` uses the index. `WHERE LOWER(email) LIKE '%test%'` does not.
- **MySQL 8.0+**: Functional indexes on expressions. Pre-8.0 required generated columns.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Case-insensitive unique constraint**: `CREATE UNIQUE INDEX ON users (LOWER(email))` — enforce unique email regardless of case.
- **Date-part indexing**: `CREATE INDEX ON orders (EXTRACT(YEAR FROM created_at))` — optimize queries that filter by year.
- **JSON path indexing**: `CREATE INDEX ON users ((data->>'zip_code'))` — index a specific JSON path.


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
| 1 | Expression mismatch**: Index on `LOWER(email)` but query uses `LCASE(email)`. Different function, index not used. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Expression index on volatile function**: `CREATE INDEX ON users (random())` — useless because the value changes constantly. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

