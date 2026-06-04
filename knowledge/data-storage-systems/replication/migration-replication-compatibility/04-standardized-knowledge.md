# 7-20 Migration Replication Compatibility

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-20 |
| Knowledge Unit Title | Migration Replication Compatibility |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 11.2 Online DDL | 11.6 ALTER TABLE strategies | 7.5 Replica lag |
| Last Updated | 2026-06-02 |

## Overview

DDL operations (ALTER TABLE, CREATE INDEX) on the primary replicate to replicas. Some DDL operations block replication until they complete on the replica. `ALGORITHM=INSTANT` DDL replicates instantly. `ALGORITHM=COPY` may cause replica lag. Always consider replication impact before running migrations in production.

---

## Core Concepts

- **DDL replication**: DDL statements are written to binlog and replayed on replicas. Long-running DDL (e.g., `ALTER TABLE ... ALGORITHM=COPY`) blocks replica apply thread.
- **Replica lock during DDL**: The replica executes the DDL sequentially (single-threaded for DDL). While DDL runs, no other events from primary are applied. Lag increases.
- **Migration strategies**: Use `ALGORITHM=INSTANT` or `INPLACE` for online DDL. Avoid long-running `COPY` during peak hours.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Migration window for DDL**: Run migrations during low-traffic periods. Monitor replica lag during and after.
- **pt-online-schema-change**: Percona Toolkit creates a shadow table, copies data incrementally, swaps. Minimizes replication impact.


## Architecture Guidelines

- Async MySQL binlog replication: zero write impact, seconds of data loss risk. Sync PostgreSQL replication: higher write latency, zero data loss. Aurora storage replication: minimal write impact, zero data loss.

## Performance Considerations

- Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual consistency.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | ALTER TABLE during peak hours**: Locks tables, blocks replication apply. Replicas fall behind. User-facing queries hit lagged replicas. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Read-after-write inconsistency from replication lag. Stale reads from replicas under heavy write loads. Connection pooling with transaction pooling breaks session state.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Replication Read Write Splitting
- **Closely Related**: Other KUs within Replication Read Write Splitting
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

