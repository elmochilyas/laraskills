# 4-1 Explain Output Interpretation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-1 |
| Knowledge Unit Title | Explain Output Interpretation |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | None |
| Related KUs | EXPLAIN ANALYZE, Type column values, Extra column flags |
| Last Updated | 2026-06-02 |

## Overview

EXPLAIN shows how the database executes a query. Key columns: `type` (access method), `possible_keys` (candidate indexes), `key` (chosen index), `rows` (rows examined estimate), `Extra` (additional operations), `filtered` (percentage of rows kept after WHERE). Reading EXPLAIN is the primary skill for query optimization.

---

## Core Concepts

- **type (access method)**: const > eq_ref > ref > range > index > ALL. const = best (unique lookup). ALL = worst (full table scan).
- **possible_keys vs key**: possible_keys shows which indexes could be used. key shows which was chosen. If possible_keys is non-empty but key is NULL, the optimizer chose not to use any index.
- **rows**: Estimated rows the database must examine. Lower is better. Compare to actual row count to see estimation accuracy.
- **Extra flags**: "Using index" = covering index (no table access). "Using filesort" = sort not using index. "Using temporary" = temp table created. "Using where" = post-filter applied.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Identify full table scans**: `type: ALL` with high `rows` = the query needs an index.
- **Detect missing composite index**: Query filters by 3 columns. possible_keys shows 3 separate single-column indexes, but the composite index on all 3 is missing.
- **Verify index choice**: The `key` column shows which index is used. If it's using a suboptimal index, consider index hints or rewriting the query.


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
| 1 | Running EXPLAIN without ANALYZE**: EXPLAIN shows estimates, not actuals. Use `EXPLAIN ANALYZE` (PostgreSQL) or `EXPLAIN ANALYZE` (MySQL 8.0.18+) for actual execution data. For MySQL pre-8.0.18, use `EXPLAIN` for estimates and `SHOW PROFILE` for actuals. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Ignoring filtered column**: MySQL's `filtered` shows percentage of rows kept after WHERE. Low filtered = many rows examined but few returned = missing or poorly designed index. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Not comparing before/after**: Run EXPLAIN before and after adding an index. The type, rows, and Extra changes prove the index is effective. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

