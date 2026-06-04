# Skill: Implement Schema Version Ledger

## Purpose

Track which migration version each tenant has applied, enabling differential migrations, targeted rollbacks, and canary deployments.

## When To Use

- Schema-per-tenant or DB-per-tenant with independent migration versioning
- Canary migration deployments
- Auditing schema state across tenants
- Differential migration (only apply missing migrations per tenant)

## When NOT To Use

- Shared-table architecture (single migrations table)
- All tenants always at the same schema version
- No migration rollback capability needed

## Prerequisites

- Central database for tenant metadata
- Migration files with version identifiers
- Migration orchestration tool

## Inputs

- Tenant registry
- Migration batch definitions
- Schema version ledger table schema

## Workflow (numbered steps)

1. Create `tenant_schema_versions` table: `tenant_id`, `batch`, `migration_name`, `applied_at`, `status`
2. On migration for a specific tenant, record applied migration in ledger
3. Before migration, compare tenant's latest batch against current target
4. For differential migration: apply only migrations not yet recorded for that tenant
5. On rollback, update ledger to reflect previous state
6. Add ledger query endpoint for auditing: "Which tenants are at which schema version?"

## Validation Checklist

- [ ] Every tenant migration records in the ledger
- [ ] Ledger accurately reflects actual schema state
- [ ] Differential migration applies only pending changes
- [ ] Rollback updates ledger correctly

## Common Failures

- Ledger records migration but schema change fails (inconsistent state)
- Ledger not updated after manual migration
- Migration applied but ledger shows pending (stuck in retry loop)

## Decision Points

- Central ledger vs per-tenant ledger in each schema/database
- Optimistic (update after success) vs pessimistic (update before, verify after)
- Batch-level vs per-migration tracking

## Performance Considerations

- Ledger update adds < 5ms per tenant migration
- Querying ledger for all tenants: use index on `tenant_id`
- Ledger cleanup: archive old records periodically

## Security Considerations

- Ledger data is operational, not sensitive — but tampering could hide failed migrations
- Ledger should be append-only with audit trail
- Access to modify ledger should be restricted

## Related Rules

- 5-19-1: Always Record Migration In Ledger
- 5-19-2: Never Trust Ledger Without Verification

## Related Skills

- Implement Tenant Migration Canary
- Implement Migration Orchestration Across Tenants
- Implement Schema-Per-Tenant Migrations

## Success Criteria

- Ledger provides accurate schema version for every tenant
- Differential migration applies only pending changes
- Audit queries run in < 100ms for 10000 tenants

---

# Skill: Implement Canary Migrations Using Schema Ledger

## Purpose

Use the schema version ledger to implement canary migration deployments, applying changes to a subset of tenants first before rolling to all tenants.

## When To Use

- High-risk migrations that could cause data issues
- Large-scale tenant base where full rollback is expensive
- Compliance-driven change management

## When NOT To Use

- Emergency hotfix that must be applied immediately
- Shared-table architecture (single migration)
- Very small number of tenants (< 10)

## Prerequisites

- Schema version ledger
- Canary tenant group defined (test tenants)
- Rollback scripts for each migration

## Inputs

- Canary tenant group list
- Migration batch files
- Rollback threshold configuration

## Workflow (numbered steps)

1. Record target migration batch in deployment configuration
2. Phase 1 (Canary): Apply migration to canary tenants (5% of total, internal/test tenants first)
3. Monitor canary tenants for 15 minutes: error rate, performance, data integrity
4. Phase 2 (Ring 1): Apply to low-usage tenants (20%)
5. Monitor for 15 minutes
6. Phase 3 (Ring 2): Apply to medium-usage tenants (30%)
7. Phase 4 (Ring 3): Apply to high-value/enterprise tenants (45%)
8. If error rate exceeds threshold at any phase, roll back the current ring

## Validation Checklist

- [ ] Canary group defined and migrations applied
- [ ] Monitoring thresholds configured and tested
- [ ] Rollback tested for each phase
- [ ] Schema ledger updated correctly per tenant

## Common Failures

- Canary group doesn't include diverse tenant schemas (different data patterns)
- Monitoring doesn't catch data corruption (only error rate)
- Rollback not possible for backward-incompatible changes

## Decision Points

- Ring composition (usage-based vs random)
- Cooldown period between rings
- Rollback: automatic vs manual approval

## Performance Considerations

- Total deployment time = rings × (migration time + cooldown)
- Cooldown allows monitoring to detect issues before wider rollout
- Parallel migration within a ring speeds up processing

## Security Considerations

- Canary tenants should include security test tenants
- Enterprise tenants get migrations last (lowest risk)
- Migration failure at any phase must alert the team immediately

## Related Rules

- 5-19-1: Always Record Migration In Ledger

## Related Skills

- Implement Schema Version Ledger
- Implement Migration Orchestration Across Tenants
- Implement Tenant Migration Canary

## Success Criteria

- Canary detection prevents rollback for 100% of tenants
- Rollback is tested and verified for each migration
- Zero production incidents from tenant migrations
