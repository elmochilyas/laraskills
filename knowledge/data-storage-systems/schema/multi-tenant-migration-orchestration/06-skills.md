# Skill: Orchestrate Migrations Across Multi-Tenant Databases

## Purpose

Run schema migrations across hundreds or thousands of per-tenant databases using queued fan-out with canary rollout, ensuring each tenant's migration is isolated, retryable, and failure does not cascade to other tenants while maintaining a central version ledger for drift detection.

## When To Use

- Multi-tenant SaaS with per-tenant databases
- Environments with 10+ tenant databases
- Staggered rollout to production tenants

## When NOT To Use

- Single-database applications
- Shared-table multi-tenancy
- Environments with fewer than 5 tenant databases

## Prerequisites

- Tenant database connection mapping (tenant_id → connection config)
- Per-tenant migration state tracking (migrations table per DB or central ledger)
- Queue infrastructure for fan-out

## Inputs

- Migration files to apply
- Tenant list and connection configurations
- Concurrency limits
- Canary tenant list

## Workflow

1. Identify target schema version and required migrations
2. For canary rollout: dispatch migration jobs to 1-5% of tenants first
3. Monitor canary tenants for errors, performance, and data integrity
4. If canary passes, dispatch to remaining tenants in batches (e.g., 10-50 at a time)
5. Each tenant migration runs as an isolated queue job with its own connection
6. After each tenant migration, update the central schema version ledger
7. On failure: isolate the failed tenant, log the error, and continue with other tenants
8. Run drift detection after all migrations complete

## Validation Checklist

- [ ] Canary tenants are selected and monitored first
- [ ] Migration jobs are isolated per tenant
- [ ] Central ledger tracks each tenant's migration state
- [ ] Concurrency is limited to prevent connection pool exhaustion
- [ ] Failed tenants are isolated without blocking others
- [ ] Drift detection runs post-migration

## Common Failures

### Connection pool exhaustion
Running 100 parallel tenant migrations opens 100+ connections, exceeding `max_connections`. Limit concurrency based on available connections.

### Partial rollout with mixed schema states
Some tenants are on the new schema, others on the old. Application code must be forward-compatible during the rollout window.

## Decision Points

### Sequential vs parallel vs queued?
Sequential for < 20 tenants. Queued for 20-1000+ tenants (parallel with retry). Parallel Artisan commands for special cases requiring immediate execution.

### Canary percentage?
5% for the initial canary. If that passes, expand to 25%, then 100%. For high-risk migrations, use smaller canaries and longer observation windows.

## Performance Considerations

Each tenant migration creates its own database connection. Large tenants take longer to migrate (more rows to scan for DDL validation). Order large tenants first to avoid blocking small tenant migrations.

## Security Considerations

Use a dedicated database user per tenant or a restricted user with only migration privileges. Tenant connection credentials must be stored securely. The central ledger's integrity is critical — use transactional updates.

## Related Rules

- Always canary high-risk migrations
- Isolate tenant migration failures
- Track schema versions in a central ledger

## Related Skills

- Manage Migration Version Ledger Per Tenant
- Execute Migration Canary Patterns
- Run Database-Specific Migrations

## Success Criteria

- All tenant databases are migrated to the target schema version
- Migration failures are isolated to individual tenants
- Canary rollout catches issues before full deployment
- Central ledger accurately tracks each tenant's schema version
- Connection pool limits are respected during parallel execution
