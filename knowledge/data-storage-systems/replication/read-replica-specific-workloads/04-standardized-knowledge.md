# 7-15 Read Replica Specific Workloads

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication Read Write Splitting |
| Knowledge Unit ID | 7-15 |
| Knowledge Unit Title | Read Replica Specific Workloads |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 7.16 Read replica sizing | 7.5 Replica lag |
| Last Updated | 2026-06-02 |

## Overview

Dedicate replicas for specific workloads: reporting (heavy aggregation queries), analytics (full table scans), search (Elasticsearch indexing reads). These workloads consume CPU and IOPS that would degrade user-facing query performance. Separation via dedicated read replicas with different sizing.

---

## Core Concepts

- **Reporting replica**: Larger instance (more CPU/RAM). Run heavy aggregation queries, materialized view refreshes, report generation.
- **Analytics replica**: Connected to BI tools (Tableau, Metabase). Accepts high-latency queries. May be significantly behind in replication lag.
- **Search indexing replica**: Elasticsearch/Meilisearch indexing reads. Scans large tables. Separate from user-facing replicas.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Dedicated replica for reporting**: `'mysql_reporting' => ['read' => ['host' => 'reporting-replica'], ...]`. Connect via `DB::connection('mysql_reporting')` for reports.
- **Replica sizing per workload**: Reporting replica: 2x CPU, 4x RAM compared to user-facing replicas. Analytics replica: more storage.


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
| 1 | Running reports on user-facing replicas**: A heavy report query blocks user requests on the same replica. Dedicate replicas per workload type. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

