# Skill: Implement Per-Tenant Scaling

## Purpose

Automatically detect whale tenants and escalate their isolation level from shared infrastructure to dedicated resources.

## When To Use

- Whale tenants consistently exceed platform median resource usage
- Platform has multiple isolation tiers (shared → schema → DB → dedicated server)
- Automated scaling is needed to avoid manual per-tenant migration

## When NOT To Use

- All tenants fit comfortably on shared infrastructure
- Tenant count is too small to justify automation
- Platform uses flat isolation model (all tenants same level)

## Prerequisites

- Per-tenant resource monitoring
- Multiple isolation model support
- Tenant migration automation

## Inputs

- Per-tenant resource metrics (storage, IOPS, query volume, connections)
- Isolation tier definitions
- Tenant migration pipeline

## Workflow (numbered steps)

1. Monitor per-tenant metrics: storage, query volume, IOPS, connection count
2. Flag tenants exceeding 2× platform median for any metric
3. Evaluate isolation escalation options:
   - Shared-table → schema-per-tenant: move tenant to dedicated schema
   - Schema-per-tenant → DB-per-tenant: create tenant database, migrate data
   - DB-per-tenant → dedicated server: provision new server, move tenant
4. Schedule migration during low-usage window
5. Execute migration: export data, create new isolation layer, import, verify, switch
6. Update tenant record with new isolation tier
7. Monitor tenant performance post-migration to verify improvement

## Validation Checklist

- [ ] Whale detection thresholds configured and accurate
- [ ] Migration pipeline tested for each isolation escalation path
- [ ] Tenant performance improves after migration
- [ ] Downtime during migration is within SLA

## Common Failures

- Whale detection too aggressive — tenant migrated unnecessarily
- Migration data inconsistent — data loss or corruption
- Tenant performance doesn't improve (bottleneck is elsewhere)

## Decision Points

- Automatic vs manual approval for isolation escalation
- Full migration vs replication-based cutover
- Tenant grouping: dedicated per tenant vs dedicated group of tenants

## Performance Considerations

- Whale detection runs daily (not real-time)
- Migration time depends on data volume: 1GB/min typical
- Schedule migrations during lowest traffic period

## Security Considerations

- Migrating tenant data must maintain encryption at rest and in transit
- Post-migration, verify tenant isolation is correct
- Clean up original data after successful migration

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Noisy Neighbor Detection
- Implement Tenant Segmentation
- Implement Tenant Provisioning Lifecycle

## Success Criteria

- Whale tenants automatically detected and migrated
- Zero data loss during any isolation escalation
- Tenant performance improves to within platform average after migration

---

# Skill: Design Isolation Escalation Paths

## Purpose

Create a graduated isolation model where tenants move from shared to dedicated resources as their usage grows, with automated escalation triggers and migration workflows.

## When To Use

- Platform serves tenants across a wide range of sizes
- Predictable, repeatable migration paths are needed
- Each isolation tier has different cost and operational characteristics

## When NOT To Use

- Single isolation model for all tenants
- All tenants are approximately the same size

## Prerequisites

- Understanding of all isolation models (shared, schema, DB, dedicated server)
- Tenant monitoring and detection
- Migration automation for each step

## Inputs

- Isolation tier definitions with resource limits
- Tenant growth projections
- Infrastructure provisioning automation

## Workflow (numbered steps)

1. Define isolation tiers:
   - Tier 1 (shared-table): < 100MB storage, < 1000 req/day, rate limited
   - Tier 2 (schema-per-tenant): < 1GB storage, < 10000 req/day
   - Tier 3 (DB-per-tenant shared server): < 10GB storage, < 50000 req/day
   - Tier 4 (DB-per-tenant dedicated server): any size, dedicated resources
2. Configure monitoring to trigger escalation when tenant approaches tier limits
3. Build migration path for each tier transition
4. Automate resource provisioning and data migration
5. Verify isolation at new tier post-migration

## Validation Checklist

- [ ] All tiers have clear resource limits and triggering conditions
- [ ] Migration paths tested for all transitions
- [ ] Automation provisions new resources within SLA
- [ ] Tenant data integrity verified after each escalation

## Common Failures

- Tenant bounces between tiers (oscillation)
- Migration path for Tier 3 → Tier 4 doesn't exist
- Resource limits overlap between tiers

## Decision Points

- Number of tiers (3-5 is practical)
- Over-provision threshold (migrate at 70% or 90% of limit?)
- Downgrade path for shrinking tenants

## Performance Considerations

- Each tier adds operational overhead (more infrastructure to manage)
- Migration at 70% utilization gives buffer for growth
- Downgrading may require data compaction

## Security Considerations

- Each tier transition must verify isolation is correct at new level
- Credentials and access controls must be updated per tier

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Tenant Segmentation
- Implement Per-Tenant Scaling
- Implement Compliance-Driven Isolation

## Success Criteria

- All tenants have an appropriate isolation tier based on their usage
- Escalation is automatic and within SLA
- No tenant exceeds their tier's resource limits without escalation
