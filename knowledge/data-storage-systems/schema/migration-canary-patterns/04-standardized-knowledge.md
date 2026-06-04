# 11-15 Migration Canary Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-15 |
| Knowledge Unit Title | Migration Canary Patterns |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.29 Tenant migration canary | 11.16 Testing migrations in CI |
| Last Updated | 2026-06-02 |

## Overview

Canary migration: apply schema changes to a small subset of production traffic first. For multi-tenant: apply to internal tenants → low-usage tenants → high-usage tenants. For single-database: run on a read replica first, promote if successful. Canary reduces blast radius of bad migrations. Monitor error rates, latency, and replica lag during canary.

---

## Core Concepts

- **Multi-tenant canary**: Apply migration to 1% of tenants (internal/test tenants). Monitor for 15 minutes. If no errors, apply to 10%. Then 50%. Then 100%.
- **Replica canary**: Run migration on a read replica first. Verify schema, performance, and data integrity. Then run on primary during maintenance window.
- **Canary metrics**: Error rate (5xx, query exceptions), latency (P50/P99), replication lag, deadlock rate.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Canary migration command**: `php artisan migrate:canary --connection=tenant --percentage=5`. Runs migration on randomly selected 5% of tenants. Logs results.
- **Automated rollback**: Canary detects error rate increase. Automatically rolls back on canary tenants. Migration marked as failed. Not applied to remaining tenants.


## Architecture Guidelines

- gh-ost: MySQL 8.0+, binlog trigger-free, millisecond lock. pt-osc: MySQL 5.7+, trigger-based, millisecond lock. pgroll: PostgreSQL 14+, view-based, no exclusive locks.

## Performance Considerations

- Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | No canary for significant migrations**: "I'll just run it on all tenants at once" — bad migration corrupts all data. Always canary. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Trigger overhead from pt-osc degrades write performance. gh-ost cut-over fails under high write load. Insufficient disk space during online DDL.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Production Schema Operations
- **Closely Related**: Other KUs within Production Schema Operations
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

