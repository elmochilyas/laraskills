# 5-18 Cross Tenant Analytics

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-18 |
| Knowledge Unit Title | Cross Tenant Analytics |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.19 Schema version ledger | 5.27 Per-tenant backups |
| Last Updated | 2026-06-02 |

## Overview

Cross-tenant analytics requires aggregating data from all tenants into a single analytical store. Approaches: federated queries across tenant databases (slow, complex), periodic ETL to a data warehouse (standard), CDC pipeline via Debezium or PostgreSQL logical replication (real-time). Each tenant's data is tagged with tenant_id in the warehouse for filtered and aggregate analysis.

---

## Core Concepts

- **Federated query**: Query across all tenant databases using foreign data wrappers (PostgreSQL FDW, MySQL FEDERATED) or Presto/Trino. No data duplication but query performance varies with tenant count.
- **ETL pipeline**: Cron or scheduled job extracts data from each tenant, transforms to common schema, loads to warehouse. Latency: minutes to hours.
- **CDC pipeline**: Database replication streams changes to Kafka/Redpanda → stream processor → warehouse. Real-time, less load on source databases.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Tenant-tagged warehouse tables**: Each row in warehouse has `tenant_id`. Reports filter by tenant or aggregate across all tenants.
- **Per-tenant extract jobs**: One queue job per tenant for ETL. Parallel extraction. If one tenant's extract fails, others continue.


## Architecture Guidelines

- Shared-table: Low isolation, single connection, low complexity. Schema-per-tenant: Medium isolation, single connection, medium complexity. Database-per-tenant: High isolation, N connections, high complexity.

## Performance Considerations

- Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include tenant ID filters.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Querying tenant databases directly for analytics**: Analytical queries (full table scans, aggregations) degrade OLTP performance. Always use a separate analytical store. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Cross-tenant data leaks when global scopes are bypassed. Tenant resolution failures expose all tenant data. Connection pool exhaustion from per-tenant connections. Migration drift between tenant databases.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Multi Tenancy Architecture
- **Closely Related**: Other KUs within Multi Tenancy Architecture
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

