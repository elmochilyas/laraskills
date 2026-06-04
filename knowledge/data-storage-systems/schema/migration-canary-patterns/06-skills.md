# Skill: Execute Canary Rollouts for Production Schema Changes

## Purpose

Apply schema changes to a small subset of production traffic first — internal tenants, low-usage tenants, or a read replica — before rolling to full production, monitoring error rates, latency, and replication lag during the canary to detect issues before they affect all users.

## When To Use

- High-risk schema changes on production databases
- Multi-tenant deployments with staggered rollout capability
- First-time use of a new migration tool or approach

## When NOT To Use

- Trivial additive changes on small tables
- Emergency hotfixes requiring immediate full deployment
- Environments where canary infrastructure is not available

## Prerequisites

- Tenant segmentation or read replica for canary testing
- Monitoring for error rates, latency, and replication lag
- Automated rollback trigger criteria

## Inputs

- Migration files
- Canary group definition (tenant list, percentage)
- Rollback threshold criteria

## Workflow

1. Define canary groups: internal/test tenants first, then low-usage, then high-usage
2. Apply migration to 1-5% of tenants (canary group)
3. Monitor for 15-30 minutes: error rates, query latency, replication lag, deadlock rate
4. If canary passes without issues, expand to 10-25% of tenants
5. Monitor again for 15-30 minutes
6. If still clean, roll out to remaining tenants in batches
7. If canary detects issues, automatically roll back the canary group and halt further rollout

## Validation Checklist

- [ ] Canary group represents realistic production traffic
- [ ] Monitoring covers error rate, latency, replication lag
- [ ] Automated rollback triggers defined and tested
- [ ] Rollout increments are small enough to limit blast radius
- [ ] Observation windows between increments are adequate

## Common Failures

### No canary for significant migrations
Applying a risky migration to all tenants at once can corrupt all tenant data. Always canary significant schema changes.

### Too-small canary group
A 0.1% canary may not trigger edge cases that exist in 0.5% of tenants. Use at least 1-5% for the initial canary.

## Decision Points

### Multi-tenant canary vs replica canary?
Multi-tenant canary for DB-per-tenant architectures (independent databases). Replica canary for single-database deployments (run on read replica first).

### Fixed percentage vs specific tenants?
Specific tenants for known low-risk groups (internal, test accounts). Percentage for random sampling across all tenant types.

## Performance Considerations

Canary monitoring must detect increased error rates and latency quickly. Use metrics-based alerting, not log-based. Replication lag monitoring is essential for replica canaries.

## Security Considerations

Canary tenants see the new schema first. If the migration has data integrity issues, canary tenants' data is affected. Ensure rollback is tested and automated.

## Related Rules

- Always canary high-risk migrations
- Monitor error rates and latency during canary
- Automate rollback on threshold breach

## Related Skills

- Orchestrate Migrations Across Multi-Tenant Databases
- Track Per-Tenant Schema Versions
- Verify Data Integrity During Migrations

## Success Criteria

- Schema changes are rolled out incrementally to production
- Canary detection catches issues before full rollout
- Automated rollback protects canary tenants
- Monitoring provides actionable feedback during each phase
- Full rollout proceeds only after canary validation passes
