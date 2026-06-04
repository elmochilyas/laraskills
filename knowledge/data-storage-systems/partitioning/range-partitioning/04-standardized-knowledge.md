# 8-1 Range Partitioning

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-1 |
| Knowledge Unit Title | Range Partitioning |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.15 Partition switching |
| Related KUs | Partition pruning, Partition management |
| Last Updated | 2026-06-02 |

## Overview

Range partitioning divides a table into partitions by column value ranges. Most common for date-based partitioning: `PARTITION BY RANGE (YEAR(created_at)) (PARTITION p2023 VALUES LESS THAN (2024), ...)`. Enables partition pruning (querying only relevant partitions) and efficient old-data archival via partition drop.

---

## Core Concepts

- **Range definition**: Each partition has `VALUES LESS THAN (value)`. Rows go to the first partition whose range includes their value.
- **Partition pruning**: Query `WHERE created_at BETWEEN '2024-01-01' AND '2024-03-01'` scans only partition(s) containing that date range.
- **MySQL RANGE COLUMNS**: `PARTITION BY RANGE COLUMNS(created_at)` — allows string, date, or multiple columns in range definition.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Monthly partitioning**: `PARTITION BY RANGE (TO_DAYS(created_at)) (PARTITION p202401 VALUES LESS THAN (TO_DAYS('2024-02-01')), ...)`. 12 partitions per year.
- **Archival by partition drop**: `ALTER TABLE orders DROP PARTITION p2020;` — instant metadata operation. No DELETE + vacuum.


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
| 1 | Too many partitions**: MySQL max 8192 partitions per table. PostgreSQL max depends on implementation (thousands). 100-500 is practical. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

