# 3-29 Implicit Type Conversion

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Indexing Strategy Physical Design |
| Knowledge Unit ID | 3-29 |
| Knowledge Unit Title | Implicit Type Conversion |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 3.28 Sargability rule | 4.12 Type mismatch implicit casts |
| Last Updated | 2026-06-02 |

## Overview

Implicit type conversion (type coercion) in WHERE comparisons can bypass indexes. When a string column is compared to an integer, the database casts the column to integer, wrapping it in an implicit function and breaking sargability.

---

## Core Concepts

- **String vs integer**: `WHERE varchar_col = 0` — MySQL casts `varchar_col` to integer. Non-numeric strings become 0. Index cannot be used.
- **Fix**: Compare with the correct type. `WHERE varchar_col = '0'` or cast the input to the column's type.
- **Detection**: In EXPLAIN, look for "Using where" with type=ALL. Check CAST operations in Extra.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Cast input, not column**: If the column is `VARCHAR`, cast the PHP value: `->where('status', (string) $request->status)`.
- **Use the same type in schema**: Ensure FK columns and the PK they reference are the same type.


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
| 1 | Eloquent's automatic type binding**: Eloquent passes values as-is to PDO. If the controller passes an integer from request validation, it compares against a string column without explicit casting. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

