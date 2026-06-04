# 4-3 Type Column Values

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-3 |
| Knowledge Unit Title | Type Column Values |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 4.1 EXPLAIN output interpretation | 4.2 EXPLAIN ANALYZE |
| Last Updated | 2026-06-02 |

## Overview

The `type` column in EXPLAIN is the most important indicator of query efficiency. From best to worst: `system` (0 or 1 row), `const` (unique index lookup), `eq_ref` (unique index for each row in join), `ref` (non-unique index match), `range` (indexed range scan), `index` (full index scan), `ALL` (full table scan).

---

## Core Concepts

- **const**: Primary key or unique index lookup. At most one row. Optimal.
- **eq_ref**: Each row from previous table matches exactly one row via unique index. Good for joins.
- **ref**: Non-unique index lookup. Multiple rows may match. Acceptable.
- **range**: Indexed range scan (>, <, BETWEEN, IN). Acceptable for moderate ranges.
- **index**: Full index scan (reads entire index). Better than ALL but still expensive.
- **ALL**: Full table scan. Worst. Usually requires adding an index.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Target const or eq_ref for PK lookups**: `User::find(1)` should always be const or eq_ref. If it's not, check that the PK is indexed.
- **Accept range for filtered list queries**: `WHERE created_at > ?` is a range scan. Acceptable if the date range is narrow relative to table size.
- **Investigate index or ALL**: These indicate the query lacks proper index support. EXPLAIN the specific WHERE conditions and add matching indexes.


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
| 1 | Accepting ALL on small tables**: "The table only has 1000 rows." On a table that will grow to 1M, the ALL scan becomes a problem. Add indexes preemptively based on query patterns. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Confusing ref with eq_ref**: `ref` means multiple rows may match. If the query expects one row but gets ref, the column lacks a unique index or the query has a range condition. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

