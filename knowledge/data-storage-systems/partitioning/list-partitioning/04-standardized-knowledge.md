# 8-2 List Partitioning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-2 |
| Knowledge Unit Title | List Partitioning |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.1 Range partitioning | 8.3 Hash partitioning | 8.13 Default partition |
| Last Updated | 2026-06-02 |

## Overview

List partitioning assigns rows to partitions based on a discrete value list. `PARTITION BY LIST (status) (PARTITION p_active VALUES IN ('active', 'pending'), PARTITION p_inactive VALUES IN ('inactive', 'deleted'))`. Useful for partitioning by category, region, status — columns with a small set of known values.

---

## Core Concepts

- **Explicit value list**: Each partition specifies which values belong. `VALUES IN ('value1', 'value2')`.
- **Default partition**: `PARTITION p_other VALUES IN (DEFAULT)` — catches unmatched values. Use with caution (can grow unbounded).
- **No range overlap**: A row's value must match exactly one partition's list.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Status-based partitioning**: Active records in one partition (hot), archived in another (cold). Hot partition stays small, queries are faster.
- **Multi-region partitioning**: `PARTITION BY LIST (region)`. European data in one partition, US in another. Useful for data locality.


## Architecture Guidelines

- RANGE for time-series. LIST for discrete categories. HASH for even distribution. KEY for auto-hash on PK.

## Performance Considerations

- Partition pruning eliminates irrelevant partitions from query scan. Range partitioning enables partition-level DROP for instant archival.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | List partitioning on high-cardinality columns**: 10,000 values need 10,000 partition definitions. Not practical. Use range or hash for high-cardinality columns. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Partition pruning fails when queries don't include the partition key. Excessive partitions cause metadata overhead. Hash partition data skew from poor hash function.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Table Partitioning Data Lifecycle
- **Closely Related**: Other KUs within Table Partitioning Data Lifecycle
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

