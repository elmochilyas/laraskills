# 8-17 Partition Aware Rls

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-17 |
| Knowledge Unit Title | Partition Aware Rls |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.14 PostgreSQL RLS | 8.5 Partition pruning |
| Last Updated | 2026-06-02 |

## Overview

PostgreSQL supports RLS policies on partitioned tables. RLS policies defined on the parent table automatically apply to all partitions. Partition pruning respects RLS — PostgreSQL prunes partitions first, then applies RLS. Combining RLS + partitioning provides both security isolation and data lifecycle management.

---

## Core Concepts

- **RLS propagation**: `CREATE POLICY tenant_policy ON orders USING (tenant_id = current_setting('app.tenant_id')::int)` — applies to all partitions of `orders`.
- **Partition pruning with RLS**: PostgreSQL prunes partitions using the partition key before evaluating RLS. A user querying `WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31'` scans only January 2024 partition, then RLS filters tenant.
- **Performance**: RLS does not prevent partition pruning. Pruning operates on the partition key, RLS operates on the partition's rows.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Partitioning + RLS for multi-tenant + retention**: Partition by month for archival. RLS by tenant_id for isolation. Both work independently.
- **RLS on detached partitions**: Detached partition is a standalone table. RLS policy no longer applies. Re-attach to reapply RLS.


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
| 1 | Assuming RLS bypasses pruning**: RLS evaluates per-row. Partition pruning still applies. Best: query includes both partition key and tenant_id for optimal performance. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

