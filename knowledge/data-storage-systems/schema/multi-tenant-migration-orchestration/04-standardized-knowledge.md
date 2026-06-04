# 1-21 Multi Tenant Migration Orchestration

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Schema Design & Migration Engineering |
| Knowledge Unit ID | 1-21 |
| Knowledge Unit Title | Multi Tenant Migration Orchestration |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.9 Migration orchestration across tenants | 5.19 Schema version ledger per tenant | 5.29 Tenant migration canary rollout |
| Last Updated | 2026-06-02 |

## Overview

In multi-tenant architectures with per-tenant databases, running migrations requires fan-out across potentially hundreds or thousands of databases. Orchestration strategies include sequential (one tenant at a time), parallel (batch concurrency), and queued (each tenant's migration as a job). The choice determines total migration time, resource usage, and failure handling complexity.

---

## Core Concepts

- **Fan-out problem**: A single `php artisan migrate` applies to one database. With N tenant databases, the migration must run N times.
- **Sequential fan-out**: Loop through tenants, run migration on each. Total time = N * time_per_migration. Simple but slow for 1000+ tenants.
- **Parallel fan-out**: Run migrations on multiple tenants concurrently. Batch size limits concurrency. Faster but requires connection pool management.
- **Queued fan-out**: Each tenant's migration is a separate queue job. Workers process tenant migrations in parallel. Includes built-in retry and failure handling.
- **Canary rollout**: Migrate a subset of tenants (1-5%) first, verify, then roll out to all tenants.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Queued migration per tenant**: Instead of an Artisan command, dispatch a `RunTenantMigration` job per tenant. Horizon workers process them. Benefits: parallel processing, automatic retry, rate limiting, failure isolation.
- **Canary tenants**: Run migrations on a small group of "canary" tenants first. Monitor for errors, schema inconsistencies, and performance degradation before rolling to all tenants.
- **Tenant migration version ledger**: Maintain a `schema_versions` table in the central database tracking which schema version each tenant is on. This enables per-tenant migration management.


## Architecture Guidelines

- | Strategy | Total Time (1000 tenants) | Complexity | Risk |
- |----------|--------------------------|------------|------|
- | Sequential | ~17 hours (1 min each) | Low | Simple, slow |
- | Parallel (10 at a time) | ~1.7 hours | Medium | Connection pool exhaustion |
- | Queued (50 workers) | ~20 minutes | Medium-High | Queue infrastructure dependency |
- | Canary + Queued | ~25 minutes | High | Safest, requires monitoring |


## Performance Considerations

- - Each tenant migration creates its own database connection. With parallel approaches, connection count = concurrency * connections_per_migration.
- - Large tenants take longer to migrate (more rows to scan for DDL validation). Sequential ordering can put large tenants first to avoid blocking small tenant migrations.
- - PostgreSQL's concurrent DDL operations (CREATE INDEX CONCURRENTLY) should be used per-tenant for large indexes.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Running all tenant migrations in one transaction**: A single failure rolls back the entire batch, undoing successfully migrated tenants. Wrap each tenant migration in its own transaction. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not testing on a subset first**: A migration that works on a small tenant database with 10K rows may time out on a large tenant with 100M rows. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Ignoring tenant database versions**: Not all tenants may be at the same schema version. The orchestrator must handle tenants with pending migrations correctly. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Partial rollout failure**: 50 tenant databases fail to migrate. The system is in a mixed state — some tenants on new schema, others on old. Application code must be forward-compatible.
- - **Connection pool exhaustion**: Running 100 parallel tenant migrations opens 100+ database connections simultaneously, exceeding the database server's max_connections.
- - **Tenant outage during long migration**: During a migration that modifies a large table on a large tenant, other operations on that tenant's database are blocked or slowed.


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

