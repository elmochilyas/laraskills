# 5-26 Event Sourcing Multi Tenant

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-26 |
| Knowledge Unit Title | Event Sourcing Multi Tenant |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 14.6 Projection building |
| Related KUs | Event store |
| Last Updated | 2026-06-02 |

## Overview

Event sourcing in multi-tenant systems requires per-tenant event streams. Each tenant's events are isolated — either in separate tables, separate schemas, or tagged with tenant_id in a shared event store. Projections must be tenant-aware. Event replay must scope to a single tenant.

---

## Core Concepts

- **Shared event store with tenant_id**: Single `stored_events` table partitioned by `tenant_id`. Most practical. Queries always filter by tenant.
- **Per-tenant event store**: Separate event store schema/database per tenant. Strongest isolation. Most complex projection management.
- **Tenant-scoped projections**: Projection rebuild scoped to one tenant's events. Not the entire event store.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Tenant-aware projectors**: Projector receives `$event` with `$event->tenantId`. Updates only the tenant's read model.
- **Tenant-scoped replay**: `Projectionist::replay(SomeProjector::class, tenantId: $tenantId)` — replays only events for that tenant.


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
| 1 | Global event replay across tenants**: Rebuilding projections from all events overwrites one tenant's read model with another's. Always scope replay to tenant. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

