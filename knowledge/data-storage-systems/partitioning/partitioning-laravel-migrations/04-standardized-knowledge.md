# 8-9 Partitioning Laravel Migrations

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Table Partitioning Data Lifecycle |
| Knowledge Unit ID | 8-9 |
| Knowledge Unit Title | Partitioning Laravel Migrations |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 8.1 Range partitioning | 8.6 Partition management | 1.13 Migration structure |
| Last Updated | 2026-06-02 |

## Overview

Laravel migrations support partition syntax via raw SQL in `DB::statement()`. No native partition builder in Laravel Schema Builder. Partition-related migration commands: `DB::statement('ALTER TABLE ... PARTITION BY RANGE ...')` after table creation. Partition management (ADD/DROP) also via raw SQL.

---

## Core Concepts

- **Create table with partitions**: `Schema::create('orders', function ($table) { ... });` then `DB::statement('ALTER TABLE orders PARTITION BY RANGE ...')`.
- **Partition management migrations**: `DB::statement('ALTER TABLE orders ADD PARTITION ...')` in up(). `DB::statement('ALTER TABLE orders DROP PARTITION ...')` in down().
- **MySQL requirement**: Partition must be declared at table creation or via `ALTER TABLE ... PARTITION BY`. Cannot partition an existing non-partitioned table without rebuilding.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Partition migration template**: `up()` creates table and applies partitioning. `down()` drops table (no partition cleanup needed).
- **Partition management in separate migrations**: One migration per partition addition. Tracked in schema. Rollback drops the partition.


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
| 1 | Partitioning after data exists**: `ALTER TABLE ... PARTITION BY ...` locks table and rebuilds data. For large tables, use pt-online-schema-change or gh-ost. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

