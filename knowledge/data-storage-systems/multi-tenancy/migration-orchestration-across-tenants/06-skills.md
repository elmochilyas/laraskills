# Skill: Orchestrate Migrations Across Tenants

## Purpose

Apply database migrations to all tenant schemas or databases safely, with batched execution, rollback capability, and minimal downtime.

## When To Use

- Deploying schema changes to schema-per-tenant or DB-per-tenant architectures
- Adding new columns, tables, or indexes across all tenants
- Regulatory changes requiring data transformation across tenants

## When NOT To Use

- Shared-table architecture (run migrations once — no orchestration needed)
- Emergency hotfix requiring immediate deployment on all tenants

## Prerequisites

- Migration files compatible with existing tenant schemas
- Tenant schema version ledger
- Rollback scripts prepared

## Inputs

- Tenant list with current schema versions
- Migration batch (list of migration files)
- Batch size configuration

## Workflow (numbered steps)

1. Read tenant list and their current schema versions from central ledger
2. Sort tenants by migration canary ring: canary (5%) → low-usage (20%) → medium (30%) → enterprise (45%)
3. For each batch of 20 tenants, loop and apply migrations
4. Between batches, verify lag, errors, and performance
5. On failure in any batch, halt subsequent rings and rollback affected tenants
6. Update schema version ledger for each successfully migrated tenant

## Validation Checklist

- [ ] All tenants at target migration version
- [ ] Schema version ledger consistent with actual schema state
- [ ] Rollback tested on a canary tenant
- [ ] No data loss or corruption from migration

## Common Failures

- Migration fails on one tenant but ledger marks it as complete
- Batch too large causes database CPU spike
- Migration references data that doesn't exist in older tenant schemas

## Decision Points

- Synchronous batch vs async queue per tenant
- Rollback all vs rollback only failed tenants
- Blocking deployment vs zero-downtime (blue-green)

## Performance Considerations

- Process 20 tenants per batch with cooldown
- Monitor primary CPU and replica lag between batches
- Total time = tenants / batch_size × per_tenant_migration_time

## Security Considerations

- Migrations must not expose sensitive data
- Audit log each migration run per tenant
- Ensure migration rollback is possible for all migration types

## Related Rules

- 5-9-1: Always Verify Migration Per Tenant Before Continuing
- 5-9-2: Never Skip Schema Version Ledger Update

## Related Skills

- Implement Schema Version Ledger
- Implement Tenant Migration Canary
- Implement Migration Replication Compatibility

## Success Criteria

- Zero failed tenant migrations across deployment
- Rollback restores only affected tenants within SLA
- Schema version ledger is always consistent with actual schema state

---

# Skill: Build a Tenant Migration Pipeline

## Purpose

Create an automated pipeline that discovers, validates, and applies pending migrations across all tenant schemas or databases.

## When To Use

- CI/CD deployment pipeline for multi-tenant applications
- Automated tenant schema management
- Ensuring all tenants are at the same schema version

## When NOT To Use

- Manual migration per tenant is acceptable for < 10 tenants
- Shared-table architecture (single migration run)

## Prerequisites

- Central tenant registry
- Schema version ledger table
- Migration files stored in standard Laravel structure

## Inputs

- Migration files from `database/migrations/tenant/`
- Tenant list from central registry
- Pipeline configuration (batch size, timeouts, retry policy)

## Workflow (numbered steps)

1. Detect pending migrations by comparing tenant schema versions against filesystem
2. Validate migration files (syntax check, dry-run on test tenant)
3. Execute migration pipeline with canary → ring → production rollout
4. Monitor error rates and performance per ring
5. On success, update deployment status and notify team
6. On failure, trigger rollback of affected ring and alert

## Validation Checklist

- [ ] Pipeline detects pending migrations correctly
- [ ] Dry-run on test tenant passes before production rollout
- [ ] Rollback tested and working
- [ ] Alerting configured for pipeline failures

## Common Failures

- Pipeline skips inactive tenants (should still apply, just not activate)
- Pipeline timeout during large tenant migration
- Multiple pipelines running concurrently (race conditions)

## Decision Points

- CI/CD pipeline vs Artisan command
- Rolling deployment vs all-at-once

## Performance Considerations

- Pipeline total time = max(per-tenant time) × (tenants / concurrency)
- Monitor pipeline duration and optimize slowest tenants

## Security Considerations

- Pipeline must use secure credentials (no plaintext passwords in config)
- Pipeline logs must not expose tenant data

## Related Rules

- 5-9-1: Always Verify Migration Per Tenant Before Continuing

## Related Skills

- Implement Tenant Migration Canary
- Implement Schema Version Ledger
- Implement Migration Replication Compatibility

## Success Criteria

- Pipeline completes all tenant migrations within deployment window
- Zero manual intervention required for successful migrations
- Rollback is automated and tested
