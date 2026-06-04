# 8-13 Default Partition Considerations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-13 |
| Knowledge Unit Title | Default Partition Considerations |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.1 Range partitioning | 8.2 List partitioning |
| Last Updated | 2026-06-02 |

## Overview

A default/catch-all partition (`VALUES LESS THAN (MAXVALUE)` or `VALUES IN (DEFAULT)`) catches rows that don't match any defined partition. Dangerous: if a new value appears but no partition exists for it, the default partition grows unbounded. Missed partition addition = hot default partition degrading performance.

---

## Core Concepts

- **MAXVALUE partition**: `PARTITION p_future VALUES LESS THAN (MAXVALUE)` — last partition. Catches all data beyond defined ranges.
- **DEFAULT list partition**: `PARTITION p_other VALUES IN (DEFAULT)` — catches unmatched values for list partitioning.
- **Unbounded growth**: If you forget to add a partition for 2025, all 2025 data goes into MAXVALUE partition. It becomes the hot partition.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **No default partition**: Do not define MAXVALUE. Instead, pre-create partitions N periods ahead. If data arrives for an unpartitioned range, the INSERT fails — immediately alerts you to add the partition.
- **Monitor default partition size**: If you must use default, monitor its row count. Alert if it exceeds expected fraction of total data.


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
| 1 | MAXVALUE partition as "set and forget"**: "I'll add partitions later" → default grows for months. Partition pruning becomes useless. All queries scan the giant default. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

