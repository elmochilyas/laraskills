# 1-29 Foreign Key Planetscale Vitess

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-29 |
| Knowledge Unit Title | Foreign Key Planetscale Vitess |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.4 Foreign key definition | 15.1 Foreign key constraints | 15.16 Application-level vs database-level enforcement |
| Last Updated | 2026-06-02 |

## Overview

PlanetScale (based on Vitess) and standalone Vitess environments have significant limitations with foreign key constraints. Vitess does not fully support cross-shard FK constraints and has restrictions on schema changes that differ from standard MySQL. PlanetScale enforces branch-based schema management where FKs must be created within the context of a deploy request. Understanding these limitations is essential when deploying Laravel to Vitess-based platforms.

---

## Core Concepts

- **Vitess FK limitation**: Vitess does not guarantee FK enforcement across shards. FKs are only supported within a single shard or when the parent and child tables are co-located.
- **PlanetScale branching**: Schema changes are made in a branch, deployed via a deploy request, and applied using non-blocking DDL. FK constraints must be part of the deploy request workflow.
- **Application-level enforcement**: In Vitess environments, FK enforcement is often delegated to the application layer using Eloquent relationships and application validation.
- **Drop behavior**: Vitess may silently ignore FK constraint violations or fail unpredictably depending on configuration.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Skip FKs in migrations**: For Vitess deployments, omit `->constrained()` from migrations. Depend on application-level relationship logic for integrity.
- **Manual delete handling**: Instead of relying on CASCADE, delete related records in application code using Eloquent events (e.g., `deleting` callback).
- **Cross-shard join limitations**: Ensure related tables share the same shard key for co-location. Without co-location, FK-based joins are not supported.


## Architecture Guidelines

- | Approach | When | When Not |
- |----------|------|----------|
- | Application-level FKs | Vitess/PlanetScale, shared-table sharding | Single-node MySQL where DB FKs are supported |
- | Database-level FKs | Single-node MySQL, co-located shards | Cross-shard environments |


## Performance Considerations

- - Foreign key enforcement in PlanetScale/Vitess goes through VTGate (the Vitess proxy), adding latency compared to direct MySQL FK enforcement. Each FK check involves proxy-level planning and execution.
- - The Vitess-level FK implementation requires additional locking and communication with the MySQL server. High-concurrency workloads may experience degraded throughput compared to standard MySQL FK enforcement.
- - Disabling FK checks entirely (`SET FOREIGN_KEY_CHECKS=0`) in Vitess environments avoids the performance overhead but shifts all integrity responsibility to the application layer.
- - Batch operations (bulk inserts, mass updates) that trigger FK checks in Vitess should be chunked to avoid overwhelming the VTGate query planner.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Assuming FK cascade works in Vitess**: CASCADE operations may not propagate across shards. Related records in a different shard remain undeleted. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Relying on FK for data integrity**: In Vitess, the application must enforce all referential integrity. Missing application-level cleanup causes orphaned records. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Cross-shard FK violation**: In a sharded Vitess environment, FKs are not enforced across shards. If a parent row is deleted in shard 1 and child rows exist in shard 2, the cascade does not propagate. Application-level cleanup must handle cross-shard references.
- - **Unsupported cascade operations**: Vitess does not support `ON DELETE CASCADE` and `ON UPDATE SET NULL` in all configurations. Cascading deletes must be implemented in application code using Eloquent model events or queue jobs.
- - **Deploy request revert orphans**: Reverting a PlanetScale deploy request that added a FK constraint can leave orphaned rows in the child table. The constraint is dropped but invalid data remains. Warn operators before reverting FK-related changes.
- - **Constraint name changes**: PlanetScale appends a random suffix to FK constraint names on each deployment. Code that references constraint names by string literal breaks. Always reference constraints by the column or index, not the generated name.
- - **Circular FK rejection**: Vitess does not support circular foreign key references between tables. Self-referencing tables are supported, but mutual references between two tables are rejected. Redesign schemas to avoid circular dependencies.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Schema Design & Migration Engineering
- **Closely Related**: Other KUs within Schema Design & Migration Engineering
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

