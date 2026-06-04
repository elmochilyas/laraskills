# Skill: Track Per-Tenant Schema Versions with a Central Ledger

## Purpose

Maintain a `tenant_schema_versions` table in the central database that records which migrations have been applied to each tenant database, enabling staggered rollouts, per-tenant rollbacks, canary testing, drift detection, and version pinning across hundreds of tenant databases.

## When To Use

- Schema-per-tenant or DB-per-tenant architectures
- Environments with 10+ tenant databases needing schema version tracking
- Canary or phased migration rollouts

## When NOT To Use

- Single-database applications
- Shared-table multi-tenancy
- Environments where all tenants are always on the same schema version

## Prerequisites

- Central database accessible by the migration orchestrator
- Tenant identification and connection mapping
- Understanding of migration version tracking

## Inputs

- Tenant list
- Migration files
- Central ledger table schema
- Rollout phase definitions

## Workflow

1. Create `tenant_schema_versions(tenant_id, migration_name, batch, applied_at, status)` in the central database
2. Index the ledger on `(tenant_id, batch)` for efficient queries
3. Before migrating a tenant, check the ledger for the tenant's current schema version
4. After each tenant migration succeeds, insert a ledger entry with status 'applied'
5. For canary rollouts, mark canary tenants in the ledger and verify their migration status first
6. Run periodic drift detection: compare ledger entries with each tenant's actual `SELECT * FROM migrations`
7. For version pinning, allow specific tenants to skip migrations and record their pinned version

## Validation Checklist

- [ ] Central ledger table exists with proper indexes
- [ ] Ledger is updated atomically after each successful tenant migration
- [ ] Pre-migration check reads the ledger before applying
- [ ] Drift detection compares ledger with tenant migrations tables
- [ ] Ledger supports canary/phased rollout tracking

## Common Failures

### Updating ledger before migration succeeds
If the ledger is updated and the migration fails, the ledger says "migrated" but the tenant DB disagrees. Update the ledger only AFTER successful migration completion.

### Ledger drift
The central ledger says a tenant is migrated, but the tenant's `migrations` table disagrees. This happens when migrations are applied manually outside the orchestrator. Run periodic reconciliation.

## Decision Points

### Central ledger vs per-tenant migrations table?
Both! The per-tenant `migrations` table is the source of truth. The central ledger is a queryable aggregate for orchestration. They should be reconciled periodically.

### Single ledger entry per tenant or per migration?
Per migration entry for granular tracking. Per batch entry for simpler queries. Per migration is recommended for canary rollouts and per-tenant rollbacks.

## Performance Considerations

The central ledger is a hot path for 1000+ tenant deployments. Index on `(tenant_id, batch)`. Querying for "tenants at version X but not Y" runs as a range scan — consider materialized views for 10K+ tenants. The ledger update is a single row UPSERT per tenant — negligible overhead.

## Security Considerations

Use a dedicated database connection for ledger operations. Implement atomic upserts with version columns to prevent race conditions. Soft-delete tenant records and skip migration for deleted tenants.

## Related Rules

- Update ledger only after successful migration
- Reconcile ledger with tenant migrations tables
- Index ledger on tenant_id and batch

## Related Skills

- Orchestrate Migrations Across Multi-Tenant Databases
- Execute Migration Canary Patterns
- Detect Schema Drift

## Success Criteria

- Central ledger accurately reflects each tenant's schema version
- Pre-migration checks prevent redundant migration execution
- Drift detection identifies and reports inconsistencies
- Canary rollouts are tracked and verified in the ledger
- Version pinning enables selective tenant migration skipping
