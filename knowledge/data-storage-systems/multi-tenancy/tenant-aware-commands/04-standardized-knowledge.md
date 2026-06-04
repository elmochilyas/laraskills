# 5-8 Tenant Aware Commands

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-8 |
| Knowledge Unit Title | Tenant Aware Commands |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.7 Tenant-aware queue jobs | 5.9 Migration orchestration |
| Last Updated | 2026-06-02 |

## Overview

Artisan commands in multi-tenant apps must support per-tenant or all-tenant execution. A `--tenant` option selects a specific tenant. No option means process all tenants in a loop. Each tenant iteration rebinds context before running tenant-specific logic.

---

## Core Concepts

- **--tenant option**: Accepts tenant ID. Single-tenant mode allows targeted maintenance, debugging, or backfill.
- **Batch mode**: With no `--tenant`, iterate all tenants, rebind context per iteration, run command logic.
- **Progress feedback**: Use `$this->output->progressStart(count($tenants))` for visibility in batch mode.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **TenantCommand base class**: Abstract command with `getTenants()` and `handleTenant(Tenant $tenant)` methods. Batch command just calls `handleTenant` in a loop.
- **Error isolation**: `try/catch` per tenant in batch mode. One tenant failure doesn't stop processing for others.


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
| 1 | No progress output**: Multi-tenant commands processing 1000+ tenants run for hours with no feedback. Always show progress. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

