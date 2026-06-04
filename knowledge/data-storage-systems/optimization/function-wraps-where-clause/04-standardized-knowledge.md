# 4-10 Function Wraps Where Clause

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-10 |
| Knowledge Unit Title | Function Wraps Where Clause |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 3.28 Sargability rule | 3.12 Functional/expression indexes | 4.7 Sargable vs non-sargable |
| Last Updated | 2026-06-02 |

## Overview

Any function that wraps an indexed column in a WHERE clause breaks sargability. Common culprits: `LOWER(col)`, `UPPER(col)`, `CAST(col AS type)`, `YEAR(col)`, `DATE(col)`, `TRIM(col)`. PostgreSQL functional indexes can mitigate some cases. MySQL functional indexes (8.0+) also support expression-based indexing.

---

## Core Concepts

- **Rule**: If the column is wrapped in a function, the B-Tree index on the raw column cannot be used.
- **Functional index solution**: Index the expression. `CREATE INDEX ON users (LOWER(email))`. Query must use the exact same expression.
- **Cast sargability**: `CAST(id AS CHAR) = '123'` — casting the column breaks the index. Cast the input instead.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Functional index in PostgreSQL**: `DB::statement('CREATE INDEX ON users (LOWER(email))')` — then query `WHERE LOWER(email) = ?`.
- **Cast input, not column**: `WHERE id = ?` with the value explicitly cast to integer in PHP before binding.


## Architecture Guidelines

- Query cache for read-heavy low-write workloads. Materialized views for complex aggregations. Read replicas for reporting offload.

## Performance Considerations

- EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table queries affects performance.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | orderByRaw with function**: `orderByRaw('LOWER(name)')` causes filesort. Use functional index or case-insensitive collation. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Missing indexes cause full table scans on large tables. Implicit type conversion prevents index usage. OR conditions break composite index leftmost prefix rules. LIKE leading wildcards prevent index usage.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
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

