# 4-12 Type Mismatch Implicit Casts

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-12 |
| Knowledge Unit Title | Type Mismatch Implicit Casts |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 3.29 Implicit type conversion | 3.28 Sargability rule |
| Last Updated | 2026-06-02 |

## Overview

Comparing a string column to an integer (or vice versa) triggers implicit type conversion that bypasses indexes. MySQL casts the column value, wrapping it in an implicit function. Non-numeric strings cast to 0, producing wrong results and full table scans.

---

## Core Concepts

- **String vs integer**: `WHERE varchar_status = 0` — MySQL casts every `varchar_status` value to integer. 'pending' becomes 0, 'active' becomes 0. Wrong results. Full scan.
- **Fix**: Compare with the correct type. `WHERE varchar_status = '0'` or cast the input.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Cast in PHP before querying**: `where('status', (string) $request->status)` — ensure the bound parameter matches the column type.
- **Use same types in FK relationships**: Foreign key and referenced PK must be the same type. `foreignId()` = `unsignedBigInteger`. The referenced PK must also be `unsignedBigInteger`.


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
| 1 | Request parameter not cast**: `Model::where('uuid', $request->uuid)` — if `uuid` is a string column and `$request->uuid` is missing (null), MySQL compares `string_column = NULL` (always false) or `string_column = 0` (implicit cast). | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

