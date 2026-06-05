# 8-15 Partition Switching Archiving

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-15 |
| Knowledge Unit Title | Partition Switching Archiving |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.6 Partition management | 8.14 Backup/restore |
| Related KUs | 8.1 Range partitioning |
| Last Updated | 2026-06-02 |

## Overview

Partition switching (`ALTER TABLE ... EXCHANGE PARTITION WITH TABLE`) atomically replaces a partition's data with an external table. The external table becomes the partition, and the partition becomes a standalone table. Used for zero-downtime archival: exchange old partition with an archive table, then drop or compress the old table.

---

## Core Concepts

- **EXCHANGE PARTITION**: `ALTER TABLE orders EXCHANGE PARTITION p2024 WITH TABLE orders_2024_archive`. Instant metadata operation. No data copy.
- **Requirements**: Both tables must have identical structure (same columns, indexes, storage engine). The external table must be empty (for exchange) or have matching row structure.
- **Use cases**: Instant archival (swap partition to archive table), data migration (load new data into a staging table, swap into partition).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Monthly archival**: (1) Create archive table. (2) `EXCHANGE PARTITION p202401 WITH TABLE orders_202401_archive`. (3) Archive table is now standalone. (4) Drop or compress.
- **Data loading**: (1) Load data into staging table. (2) Validate. (3) `EXCHANGE PARTITION p_new WITH TABLE staging`. Instant availability.


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
| 1 | Exchange with non-matching structure**: Columns, indexes, storage engine must be identical. CHECK FOR MORE careful. Must match exactly. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

