# Skill: Implement Tenant Segmentation by Tiers

## Purpose

Group tenants into tiers based on usage, revenue, or requirements, and assign different isolation models and resource allocations per tier.

## When To Use

- Platform serves tenants with diverse needs (free, pro, enterprise)
- Different pricing tiers require different isolation guarantees
- Graduated resource allocation is needed

## When NOT To Use

- Single pricing tier for all tenants
- All tenants have identical requirements
- Infrastructure is homogeneous

## Prerequisites

- Tenant plan/subscription data
- Isolation model options (shared, schema, DB, dedicated)
- Resource allocation automation

## Inputs

- Tenant plan assignment (free, pro, enterprise)
- Tier definitions with resource limits and isolation model
- Tier assignment rules

## Workflow (numbered steps)

1. Define tiers: Free (shared-table, rate limited, 100MB max), Pro (schema-per-tenant, 2GB max), Enterprise (DB-per-tenant, dedicated server option)
2. Assign tier based on subscription plan or automatic detection (usage-based graduation)
3. Configure per-tier resource limits (connections, storage, QPS, cache size)
4. Implement tier-based isolation model selection in bootstrapper
5. Monitor tier utilization and auto-promote tenants exceeding limits
6. Support manual override for custom enterprise agreements

## Validation Checklist

- [ ] Isolation model differs per tier
- [ ] Resource limits enforced per tier
- [ ] Auto-promotion triggers work correctly
- [ ] Manual override works for custom agreements

## Common Failures

- Free tier tenant accidentally gets Pro isolation (cost leak)
- Tenant stuck in wrong tier after plan change
- Tier assignment race condition during signup

## Decision Points

- 3 tiers vs more granular segmentation
- Automatic promotion vs manual approval
- Upgrade path: immediate vs scheduled

## Performance Considerations

- Enterprise tier tenants may need dedicated infrastructure provisioning
- Free tier tenants on shared infrastructure need strict rate limiting
- Tier changes should not require data migration between tiers

## Security Considerations

- Tenant must not be able to self-assign to a higher tier
- Isolation boundary between tiers must be enforced
- Audit tier changes for billing purposes

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Per-Tenant Scaling
- Implement Isolation Escalation Paths
- Implement Billing Alignment

## Success Criteria

- Tenants correctly assigned to isolation tier based on plan
- Resource limits enforced per tier
- Tier changes are seamless and within SLA

---

# Skill: Build Tier-Based Provisioning Pipeline

## Purpose

Create a provisioning pipeline that allocates different isolation resources based on a tenant's tier, enabling efficient resource management across diverse tenant types.

## When To Use

- Automated tenant provisioning must respect plan limits
- Provisioning needs to set up different isolation models per tier
- Resource allocation must match tier guarantees

## When NOT To Use

- Single-tier platform with uniform provisioning
- Manual provisioning for enterprise customers

## Prerequisites

- Provisioning automation (scripts, queue jobs, or IaC)
- Tier definitions with resource specs
- Infrastructure provider API access

## Inputs

- Tenant signup data including plan/tier
- Provisioning configuration per tier
- Infrastructure resource pool

## Workflow (numbered steps)

1. Receive signup with plan selection
2. Look up tier provisioning spec (isolation model, storage limit, connection limit)
3. Provision according to tier:
   - Free: add tenant to shared database, configure rate limits
   - Pro: create schema, configure 2GB storage limit
   - Enterprise: create database, configure dedicated cache prefix
4. Set resource limits (connection pool size, storage quota, cache TTL)
5. Initialize tier-specific monitoring and alerting thresholds
6. Confirm provisioning with tenant-specific access details

## Validation Checklist

- [ ] Isolation model matches tier specification
- [ ] Resource limits applied correctly
- [ ] Monitoring configured per tier
- [ ] Provisioning time within SLA per tier

## Common Failures

- Provisioning uses wrong tier spec (e.g., free tier gets enterprise isolation)
- Resource limits not set (tenant gets unlimited)
- Provisioning fails at one step, leaving inconsistent state

## Decision Points

- Infrastructure pool: shared pool vs tier-specific pools
- Limit enforcement: database-level vs application-level

## Performance Considerations

- Enterprise provisioning is slower (DB creation, migrations, seeding)
- Free tier provisioning is fast (no new resources needed)
- Queue provisioning for all tiers to ensure reliability

## Security Considerations

- Tier assignment must be verified by payment/subscription status
- Provisioning pipeline must not leak credentials
- Resource limits must be enforced at infrastructure level

## Related Rules

- Skip (no direct rules file reference)

## Related Skills

- Implement Tenant Segmentation
- Implement Tenant Provisioning Lifecycle
- Implement Tenant Resource Limits

## Success Criteria

- Provisioning completes within 5s (free), 15s (pro), 60s (enterprise)
- Resource limits are correctly applied and enforced
- Zero provisioning failures across all tiers
