# 11-14 Schema Version Tracking

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Production Schema Operations |
| Knowledge Unit ID | 11-14 |
| Knowledge Unit Title | Schema Version Tracking |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.9 Migration orchestration | 5.19 Schema version ledger |
| Last Updated | 2026-06-02 |

## Overview

Each database connection has its own `migrations` table. Multi-tenant with DB-per-tenant: N migrations tables (one per tenant). `php artisan migrate --database=tenant_123` runs against a specific connection. Central `migrations` table tracks which tenants are at which version. Ensures schema consistency across all connections.

---

## Core Concepts

- **Per-connection migrations table**: Each database connection has its own `migrations` table. `migrate` command defaults to `database.connections.mysql` connection.
- **Multi-DB migration command**: `php artisan migrate --database=tenant_001; php artisan migrate --database=tenant_002; ...`. Scripted via loop.
- **Central version ledger**: A central database's `migrations` table doesn't track per-tenant state. Use a custom `tenant_schema_versions` table instead.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Migration batch per tenant**: `for each tenant: \Config::set('database.connections.tenant.database', $tenant->db); \DB::purge('tenant'); \Artisan::call('migrate', ['--database' => 'tenant', '--force' => true])`.
- **Central migration tracker**: `tenant_schema_versions(tenant_id, batch, migration_name, applied_at)`. Updates after each tenant migration.


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
| 1 | Running migration once assuming all connections are synchronized**: Each connection has its own `migrations` table. Running `migrate` once only updates the default connection. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

