# Skill: Implement Shard-Level Backups

## Purpose

Back up each shard independently, enabling per-shard restore, point-in-time recovery, and granular data protection.

## When To Use

- Sharded database architecture
- Need to restore a single shard without affecting others
- Compliance requirements for data protection
- Disaster recovery per shard

## When NOT To Use

- Non-sharded database (single backup covers everything)
- All shards restored together (inflexible but simpler)
- Backup storage cost of per-shard backups is prohibitive

## Prerequisites

- Backup tooling (pg_dump, mysqldump, RDS snapshots)
- Backup storage per shard or shared storage with shard prefix
- Retention policy

## Inputs

- Shard database connection details
- Backup schedule (per shard or global)
- Retention policy

## Workflow (numbered steps)

1. Configure per-shard backup:
   - For each shard, run `pg_dump -h shard_host -d shard_db` or equivalent
   - Name backup files: `shard_{id}_backup_{timestamp}.sql`
   - Store in shard-scoped path: `backups/shard_{id}/{filename}`
2. Schedule backups: stagger times to avoid simultaneous load
3. Implement per-shard restore:
   - `psql -h shard_host -d shard_db < backup_file`
   - Or restore to new shard and swap
4. Test per-shard restore periodically
5. Monitor backup success/failure per shard

## Validation Checklist

- [ ] All shards backed up on schedule
- [ ] Per-shard restore tested and verified
- [ ] Backup retention enforced
- [ ] Backup monitoring alerts on failure

## Common Failures

- Backup of one shard fails — not detected until restore needed
- Restore affects other shards (shared backup file, wrong target)
- Retention not enforced — storage costs grow unbounded

## Decision Points

- Per-shard backup schedule vs global schedule
- Logical backup (dump) vs physical backup (snapshot)

## Performance Considerations

- Stagger backup times to avoid simultaneous load
- Parallel backups OK if shards are on different servers
- Snapshot backups are faster but less flexible for per-shard restore

## Security Considerations

- Backup files must be encrypted at rest
- Backup access must be restricted
- Restore process must verify shard identity

## Related Rules

- 6-18-1: Always Verify Backup Integrity Per Shard
- 6-18-2: Never Restore Backup To Wrong Shard

## Related Skills

- Implement Shard-Level Monitoring
- Implement Backup and Restore
- Implement Disaster Recovery

## Success Criteria

- All shards backed up within schedule window
- Per-shard restore completes within RTO
- Backup success rate > 99.9%
- Restore tested quarterly for each shard

---

# Skill: Monitor Shard Health and Performance

## Purpose

Monitor individual shard metrics (CPU, storage, IOPS, connections, query performance) to detect issues before they affect production.

## When To Use

- Sharded database architecture
- Proactive detection of shard-level issues
- Capacity planning per shard
- Performance troubleshooting

## When NOT To Use

- Non-sharded database (monitor single instance)
- All shards are identical in usage and capacity
- Simple monitoring at aggregate level is sufficient

## Prerequisites

- Monitoring system (Datadog, New Relic, Prometheus, CloudWatch)
- Per-shard query performance metrics enabled
- Alerting configuration

## Inputs

- Shard list with connection details
- Metric definitions per shard
- Alert thresholds

## Workflow (numbered steps)

1. Configure per-shard metric collection:
   - System: CPU, memory, disk, IOPS
   - Database: connections, query count, slow queries, replication lag
   - Application: query latency per shard, error rate per shard
2. Create dashboard per shard or aggregate with per-shard breakdown
3. Set alert thresholds per shard:
   - CPU > 80%, storage > 75%, connections > 80% of max
   - Replication lag > 10s, slow query rate increase > 50%
4. Monitor shard balance: data distribution, query distribution
5. Alert on shard imbalance: one shard significantly different from others
6. Review shard metrics daily in operations review

## Validation Checklist

- [ ] All shards have monitoring configured
- [ ] Per-shard dashboards show key metrics
- [ ] Alert thresholds configured and tested
- [ ] Shard balance monitoring active
- [ ] Operations team reviews shard metrics

## Common Failures

- Monitor aggregates but not per-shard — one bad shard hidden in averages
- Alert thresholds too sensitive — alert fatigue
- New shard added without monitoring configured

## Decision Points

- Per-shard dashboards vs aggregate with breakdown
- Alert sensitivity per shard vs uniform

## Performance Considerations

- Monitoring agent overhead: 1-3% CPU per shard
- Metrics storage: proportional to shard count
- Dashboard queries: use separate monitoring DB

## Security Considerations

- Monitoring data may reveal usage patterns
- Monitoring access must be restricted

## Related Rules

- 6-18-1: Always Verify Backup Integrity Per Shard

## Related Skills

- Implement Shard-Level Backups
- Implement Hot Shard Mitigation
- Implement Shard Rebalancing

## Success Criteria

- All shard metrics visible in real-time dashboards
- Alerts detect shard issues before user impact
- Shard balance monitored and reported
- Zero shard-level incidents undetected by monitoring
