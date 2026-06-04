# 5-13 Tenant Connection Caching Pooling

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-13 |
| Knowledge Unit Title | Tenant Connection Caching Pooling |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.2 Schema-per-tenant | 5.3 DB-per-tenant | 10.4 Connection pooling |
| Last Updated | 2026-06-02 |

## Overview

In schema-per-tenant and DB-per-tenant models, every request potentially uses a different database connection. Creating a new PDO connection per request is expensive (handshake, auth, SSL). Connection pooling and caching strategies reduce overhead: persistent connections, connection pool middleware, connection factory caching.

---

## Core Concepts

- **Connection setup cost**: TCP handshake + SSL negotiation + MySQL auth handshake ~50-200ms per new connection. For 100 tenants per minute per worker, this is unsustainable.
- **Persistent connections**: `pdo.options' => [PDO::ATTR_PERSISTENT => true]` reuses connections across requests. Risks: stale connections, maximum connection limits.
- **Connection factory caching**: Cache the resolved PDO instance keyed by tenant ID. Flush cache when credentials rotate.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **ProxySQL connection routing**: Route per-tenant connections through ProxySQL. ProxySQL pools connections to backend databases. Laravel connects to ProxySQL, not directly to tenant DB.
- **Octane connection reuse**: Laravel Octane keeps connections alive across requests. Tenant-aware connection factory reuses existing pooled connections.
- **Read/write split pooling**: Separate pools for read replicas and primary. Tenant-aware routing per pool.


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
| 1 | Creating connection per request without pooling**: 1000 tenants × 10 PHP-FPM workers = 10,000 connections. Pooling reduces this to N tenants × 1-2 connections. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

