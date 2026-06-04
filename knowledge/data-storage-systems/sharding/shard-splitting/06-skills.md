# Skill: Implement Shard Splitting

## Purpose

Split an overloaded shard into two smaller shards to distribute data and throughput, preventing performance degradation.

## When To Use

- A shard exceeds capacity (storage, CPU, IOPS, connections)
- Data distribution is significantly uneven
- Hot shard detected from monitoring

## When NOT To Use

- Even distribution across shards is maintained
- Shard capacity is sufficient for projected growth
- Adding new shards via rebalancing is more efficient

## Prerequisites

- Monitoring system showing shard utilization
- Target shard(s) for receiving split data
- Data migration mechanism

## Inputs

- Shard to split
- Split point(s) (key ranges, hash ranges, or key list)
- New shard(s) for receiving data

## Workflow (numbered steps)

1. Identify overloaded shard from monitoring metrics
2. Determine split strategy:
   - Range split: divide key range into two
   - Hash split: redistribute hash space
   - Directory split: move subset of keys to new shard
3. Provision new shard infrastructure
4. Migrate subset of data from overloaded shard to new shard
5. Update routing to reflect new shard layout
6. Verify data integrity on both shards
7. Reduce capacity on old shard if needed

## Validation Checklist

- [ ] Overloaded shard utilization reduced to acceptable level
- [ ] Both resulting shards have balanced data/traffic
- [ ] Data migration completes without data loss
- [ ] Routing updated correctly
- [ ] Performance impact during split is acceptable

## Common Failures

- Split creates uneven shards (one still overloaded)
- Migration causes high load on source shard — worsens the problem
- Routing not updated — queries go to wrong shard

## Decision Points

- 50/50 split vs proportional split
- Offline (maintenance window) vs live split
- Manual split trigger vs automatic (based on thresholds)

## Performance Considerations

- Split time proportional to data volume being moved
- Throttle migration rate to limit source shard impact
- Schedule split during low-traffic period

## Security Considerations

- Data migration must maintain encryption
- New shard must have proper access controls
- Verify data integrity after split

## Related Rules

- 6-11-1: Always Monitor Shard Utilization
- 6-11-2: Never Split Without Verified Data Integrity

## Related Skills

- Implement Shard Rebalancing
- Implement Hot Shard Mitigation
- Implement Range-Based Sharding

## Success Criteria

- Overloaded shard utilization reduced to within acceptable range
- Both resulting shards have balanced load
- Zero data loss during split
- Application unaffected during live split

---

# Skill: Automate Shard Split Detection

## Purpose

Monitor shard utilization metrics and automatically trigger shard splits when predefined thresholds are exceeded.

## When To Use

- Large sharded deployment (10+ shards)
- Data growth is rapid or unpredictable
- Team cannot manually monitor and trigger all splits

## When NOT To Use

- Small number of shards (manual monitoring sufficient)
- Data volume is stable and predictable
- Manual operations preferred for safety

## Prerequisites

- Shard monitoring system (CPU, storage, IOPS, connections)
- Automated shard provisioning (IaC)
- Split automation scripts

## Inputs

- Shard utilization thresholds
- Automated provisioning target
- Split strategy configuration

## Workflow (numbered steps)

1. Configure per-shard monitoring: storage > 80%, CPU > 70%, IOPS > 70%
2. When threshold exceeded for N minutes, trigger split evaluation
3. Evaluate split viability: can the shard be split evenly?
4. If viable, automatically execute split:
   - Provision new shard infrastructure
   - Migrate subset of data
   - Update routing
   - Verify data integrity
5. Alert team about automated split
6. Log split event with before/after metrics

## Validation Checklist

- [ ] Thresholds trigger split evaluation correctly
- [ ] Automated split executes without errors
- [ ] Alert sent for manual verification
- [ ] Split log contains complete audit trail

## Common Failures

- Threshold too sensitive — unnecessary splits
- Automation triggers during peak traffic — performance impact
- Split fails — manual intervention needed (automation must roll back)

## Decision Points

- Automatic execution vs auto-evaluation with manual approval
- Threshold sensitivity: conservative vs aggressive

## Performance Considerations

- Monitoring overhead: minimal
- Split execution: resource-intensive, schedule during low traffic
- Auto-rollback on failure prevents data issues

## Security Considerations

- Automation must have restricted access (damage potential)
- Split logs must not expose data contents
- Rollback plan must be tested

## Related Rules

- 6-11-1: Always Monitor Shard Utilization

## Related Skills

- Implement Shard Splitting
- Implement Hot Shard Mitigation
- Implement Shard Rebalancing

## Success Criteria

- Automated splits trigger within 5 minutes of threshold breach
- Zero false-positive splits
- All automated splits complete with verified data integrity
