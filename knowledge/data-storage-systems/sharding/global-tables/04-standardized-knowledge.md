# 6-25 Global Tables

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Database Sharding & Horizontal Scaling |
| Knowledge Unit ID | 6-25 |
| Knowledge Unit Title | Global Tables |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 6.8 Cross-shard joins | 6.13 Shard groups |
| Last Updated | 2026-06-02 |

## Overview

Global tables contain reference data replicated to every shard. Tables like `countries`, `categories`, `tax_rates` — small, rarely updated, frequently joined. Replicating to all shards enables local JOINs without cross-shard queries. Update propagation: application-level double-write, CDC (Debezium), or materialized cache.

---

## Core Concepts

- **What goes global**: Small tables (< 1000 rows), rarely updated, frequently joined with sharded tables. Lookup/reference data.
- **Replication method**: Write to one source, propagate to all shards. CDC via Kafka, application-level double-write, or scheduled refresh.
- **Consistency**: Global tables are eventually consistent across shards. Acceptable for reference data.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Read from local shard, write to central**: Application reads global table from the local shard. Writes go to a central source that fans out to all shards.
- **Cache-as-global-table**: Store reference data in Redis (cache). Each shard reads from Redis. No replication needed. Redis is the source of truth.


## Architecture Guidelines

- Hash sharding for even distribution (full remap on N change). Range sharding for efficient range scans (range splitting needed). Directory sharding for flexible routing (simple remap).

## Performance Considerations

- Fan-out queries issue N parallel queries bounded by the slowest shard. Shard key selection determines query locality. Connection management must account for total connections across shards.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Treating large tables as global**: Tables with millions of rows should not be global. Replicating 10M rows to 16 shards wastes 160M rows of storage. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Cross-shard queries fan-out to all shards multiplying execution time. Cross-shard transactions are impossible with distributed XA. Hot shards from uneven distribution cause bottlenecks.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Database Sharding & Horizontal Scaling
- **Closely Related**: Other KUs within Database Sharding & Horizontal Scaling
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

