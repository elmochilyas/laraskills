# Skill: Implement Tenant Migration Canary

## Purpose

Roll out database migrations to tenants in phases (canary → rings), detecting issues early before affecting all tenants.

## When To Use

- High-risk schema changes (data transformation, column removal, table restructuring)
- Large tenant base where full rollback is expensive
- Compliance-driven change management requiring phased rollout

## When NOT To Use

- Emergency hotfix (apply to all tenants immediately)
- Additive changes only (new columns, new tables) — low risk
- Very small number of tenants (< 10)

## Prerequisites

- Schema version ledger
- Tenant classification by usage/risk level
- Monitoring and alerting for error rates and performance
- Rollback scripts for each migration

## Inputs

- Tenant list with ring assignments (canary, ring 1, ring 2, ring 3)
- Migration batch files
- Rollback threshold configuration

## Workflow (numbered steps)

1. Assign tenants to rings:
   - Canary: 5% (internal/test tenants)
   - Ring 1: 20% (low-usage tenants)
   - Ring 2: 30% (medium-usage tenants)
   - Ring 3: 45% (high-value enterprise tenants, last)
2. Apply migration to canary group, monitor for 15 minutes
3. Check: error rate change, performance metrics, data integrity
4. If canary OK, proceed to Ring 1, monitor 15 minutes
5. Continue through rings, monitoring between each
6. If error rate exceeds threshold at any phase, halt and rollback current ring
7. After all rings complete, mark deployment as successful

## Validation Checklist

- [ ] Canary group defined and migrations applied
- [ ] Monitoring thresholds configured and tested
- [ ] Rollback tested for each phase
- [ ] All rings processed with cooldown between

## Common Failures

- Canary group doesn't include diverse schemas — misses edge cases
- Error threshold too sensitive — false positive rollback
- Threshold not sensitive enough — data corruption spreads to next ring
- Rollback not possible for backward-incompatible changes (column removal)

## Decision Points

- Ring composition: usage-based vs random vs manual
- Cooldown period between rings
- Rollback: automatic (threshold-based) vs manual approval

## Performance Considerations

- Total deployment time = rings × (migration time + cooldown)
- For 1000 tenants and 15-min cooldowns: ~1 hour total
- Parallel migration within a ring speeds up processing

## Security Considerations

- Canary tenants should include security test tenants
- Enterprise tenants always last (lowest risk)
- Failed migration at any phase must alert team immediately

## Related Rules

- 5-29-1: Always Canary Before Full Rollout
- 5-29-2: Never Skip Monitoring Between Rings

## Related Skills

- Implement Schema Version Ledger
- Implement Migration Orchestration Across Tenants
- Implement Migration Replication Compatibility

## Success Criteria

- Canary detection prevents bad migration from reaching > 5% of tenants
- Rollback is tested and verified for each migration
- Zero production incidents from tenant migrations

---

# Skill: Configure Migration Rollback Automation

## Purpose

Automatically detect migration failures during canary rollout and trigger rollback procedures to minimize tenant impact.

## When To Use

- Automated canary migration pipeline
- Large tenant base requiring fast rollback
- Critical infrastructure where downtime must be minimized

## When NOT To Use

- Manual migration process with small tenant base
- Additive-only changes (low risk, manual rollback sufficient)

## Prerequisites

- Monitoring system with real-time alerting
- Rollback scripts for each migration
- Automated deployment pipeline

## Inputs

- Error rate monitoring data
- Rollback threshold (e.g., 2% error rate increase)
- Rollback trigger configuration

## Workflow (numbered steps)

1. Configure monitoring: error rate, slow query rate, CPU usage, connection count
2. Set rollback threshold: if error rate increases by > 2% after migration, trigger rollback
3. On threshold breach, automatically:
   - Halt further ring deployments
   - Execute rollback on current ring
   - Alert operations team
4. Rollback process:
   - Reverse migration files: `artisan migrate:rollback --tenant={ring}`
   - Update schema version ledger for rolled back tenants
   - Verify tenant data integrity post-rollback
5. After rollback, analyze failure cause and document

## Validation Checklist

- [ ] Monitoring thresholds configured
- [ ] Rollback automated and tested
- [ ] Alerting configured for rollback events
- [ ] Rollback verified with data integrity check

## Common Failures

- Rollback fails because migration can't be reversed (destructive change)
- Monitoring detects false positive — unnecessary rollback
- Rollback affects more tenants than the failed ring

## Decision Points

- Automatic vs manual rollback approval
- Full rollback vs partial (rollback only failed tenants within ring)

## Performance Considerations

- Rollback time proportional to number of tenants in current ring
- Parallel rollback within a ring speeds up process
- Rollback should complete within deployment window

## Security Considerations

- Rollback automation must not expose data during reverse migration
- Alert must include details for incident response
- Post-rollback data integrity audit required

## Related Rules

- 5-29-1: Always Canary Before Full Rollout

## Related Skills

- Implement Tenant Migration Canary
- Implement Migration Orchestration Across Tenants
- Implement Schema Version Ledger

## Success Criteria

- Rollback triggered within 60 seconds of threshold breach
- Rollback completes within deployment window
- All affected tenants restored to pre-migration state
- Zero data loss from rollback
