# 5-12 Without Global Scope Guardrails

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-12 |
| Knowledge Unit Title | Without Global Scope Guardrails |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 5.5 Global scopes | 5.11 Cross-tenant leak prevention |
| Last Updated | 2026-06-02 |

## Overview

`withoutGlobalScope` bypasses tenant isolation — it must be treated as a privileged operation. Every call should have documented justification and explicit approval. Permitted uses: cross-tenant admin reports, tenant provisioning/cleanup, system-wide analytics. Prohibited uses: feature queries, dashboard widgets, user-facing endpoints.

---

## Core Concepts

- **Principle**: Tenant isolation is the default. `withoutGlobalScope` is an explicit opt-out requiring justification.
- **Permitted uses**: Admin panels with proper authorization, tenant provisioning code, data export/import tools, system maintenance commands.
- **Prohibited uses**: Any user-facing controller, API endpoint, or service method that returns data to non-admin users.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Annotations/comments**: Every `withoutGlobalScope` call annotated with `// @tenant-escape: ISSUE-1234, reason`. CI validates annotation exists.
- **Custom withoutGlobalScopeFor macro**: Wraps scope bypass with logging, tracks usage in production, alerts on unexpected calls.


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
| 1 | withoutGlobalScope in feature queries**: "Just this one time, I need all tenants' data for a dashboard." — Instead, add a dedicated admin query with explicit authorization. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

