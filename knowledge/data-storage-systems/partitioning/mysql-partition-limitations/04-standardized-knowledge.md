# 8-10 Mysql Partition Limitations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-10 |
| Knowledge Unit Title | Mysql Partition Limitations |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.8 Partition indexes | 15.1 Foreign key constraints |
| Last Updated | 2026-06-02 |

## Overview

MySQL partitioning has significant constraints: foreign keys are not supported on partitioned tables (cannot reference partitioned tables with FK), every unique index must include the partition key, and a maximum of 8192 partitions per table. These limitations often require architectural workarounds.

---

## Core Concepts

- **No foreign keys**: Partitioned tables cannot be referenced by or contain foreign keys. Workaround: application-level referential integrity or triggers.
- **Unique key restriction**: All columns in a unique index must be part of the partition key. `UNIQUE (user_id)` on a table partitioned by `created_at` is not allowed.
- **8192 partition limit**: Maximum total partitions across all partitioned tables on a MySQL instance. Practical limit: 500-1000 per table.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Application-level referential integrity**: Instead of FK, use application logic to verify existence. Accept eventual consistency for reference data.
- **Composite unique via partition key**: `UNIQUE (created_at, user_id)` — includes partition key. Works.


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
| 1 | Creating FK on partitioned table**: MySQL silently ignores the FK or returns an error. Always remove FK references from partitioned table schemas. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

