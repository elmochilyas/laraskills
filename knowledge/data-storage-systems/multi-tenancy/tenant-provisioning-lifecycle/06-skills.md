# Skill: Implement Tenant Provisioning Lifecycle

## Purpose

Automate the end-to-end lifecycle of tenant creation, activation, deactivation, and archival with proper database, queue, cache, and storage initialization.

## When To Use

- Self-service tenant signup flow in multi-tenant SaaS
- Automated tenant provisioning during migration or onboarding
- Enterprise tenant onboarding requiring infrastructure setup

## When NOT To Use

- Manual tenant creation (acceptable for < 10 enterprise customers)
- Fixed tenant set that never changes

## Prerequisites

- Tenant registry (central database)
- Isolation model selected (shared-table, schema, or DB-per-tenant)
- Provisioning automation scripts or queue jobs

## Inputs

- Tenant signup data (name, plan, region, admin user)
- Provisioning pipeline configuration
- Seed data templates

## Workflow (numbered steps)

1. Create tenant record in central database with `provisioning` status
2. Provision isolation resources:
   - Shared-table: no infra changes
   - Schema-per-tenant: `CREATE SCHEMA tenant_{id}`
   - DB-per-tenant: `CREATE DATABASE tenant_{id}`, configure credentials
3. Run migrations against tenant's schema/database
4. Seed default data (settings, roles, categories, default content)
5. Initialize tenant-specific infrastructure:
   - Queue: create tenant queue or configure routing
   - Cache: configure cache prefix
   - Storage: create tenant directory or bucket with IAM policy
6. Mark tenant as `active`
7. Send welcome notification with tenant access details

## Validation Checklist

- [ ] Tenant database/schema created and migrations applied
- [ ] Seed data present and correct
- [ ] Queue routing configured for tenant jobs
- [ ] Cache prefix set and isolated
- [ ] Storage path/bucket created with access

## Common Failures

- Provisioning times out — tenant stuck in `provisioning` state
- Seed data leaks cross-tenant references
- Migration fails — tenant has schema but no seed data
- Infrastructure partially provisioned (DB created but no storage bucket)

## Decision Points

- Synchronous (block signup) vs async (queue provisioning)
- Single server vs multiple server pools
- Default resources vs plan-based resource allocation

## Performance Considerations

- Sync provisioning: target < 10 seconds for good UX
- Async provisioning: return immediately, show progress indicator
- Provisioning queue workload must be sized for peak signup rate

## Security Considerations

- Generate strong database credentials per tenant
- Never expose provisioning credentials in logs
- Validate tenant plan limits before provisioning resources

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Tenant Database Provisioning
- Implement Per-Tenant Backups and Restore
- Implement Tenant Configuration Defaults

## Success Criteria

- New tenant provisioned and accessible within 10 seconds (sync)
- Zero provisioning failures due to race conditions or timeouts
- All provisioned resources are monitored and accounted for

---

# Skill: Implement Tenant Deactivation and Archival

## Purpose

Safely deactivate and archive tenant data when a tenant cancels, downgrades, or is removed, with the ability to reactivate if needed.

## When To Use

- Tenant cancellation or subscription end
- GDPR right to deletion requests
- Tenant migration to different platform or isolation tier

## When NOT To Use

- Temporary suspension (use deactivation, not archival)
- Tenant that will be reactivated soon (use deactivation only)

## Prerequisites

- Tenant lifecycle state machine
- Backup/export mechanism
- Data retention policy

## Inputs

- Tenant ID to deactivate/archive
- Deactivation reason
- Archival target (cold storage, export file)

## Workflow (numbered steps)

1. Deactivation: set `active = false`, app rejects requests but data remains
2. Notify tenant admin of deactivation and data retention period
3. After retention period (e.g., 30 days), initiate archival:
   - Export tenant data to cold storage (S3 Glacier, archival dumps)
   - Drop tenant schema/database (DB-per-tenant)
   - Clean up tenant infrastructure (cache keys, storage buckets, queue jobs)
4. Update tenant status to `archived` in central registry
5. For reactivation: restore from archival dump, recreate infrastructure, set `active = true`

## Validation Checklist

- [ ] Tenant data fully exported to cold storage
- [ ] Schema/database dropped successfully
- [ ] Cache, queue, and storage cleaned up
- [ ] Reactivation tested from archival dump

## Common Failures

- Data deletion before retention period expires
- Archival export incomplete (missing tables or buckets)
- Reactivation fails due to schema version mismatch

## Decision Points

- Soft-delete (active=false) vs actual data deletion
- Immediate archival vs scheduled batch archival
- Full export vs selective export

## Performance Considerations

- Archival of large tenants may take hours (queue as background job)
- Multiple concurrent archival operations must be throttled

## Security Considerations

- GDPR right to deletion: ensure all tenant data is deleted across all systems
- Archival data must be encrypted at rest
- Reactivation must verify tenant data integrity

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Per-Tenant Backups and Restore
- Implement Compliance-Driven Isolation
- Implement Tenant Data Retention

## Success Criteria

- Tenant deactivated within 5 seconds of request
- Archival completes within retention period SLA
- Reactivation restores full tenant state correctly
- No orphaned resources after archival
