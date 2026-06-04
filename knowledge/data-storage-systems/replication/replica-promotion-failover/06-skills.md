# Skill: Implement Automated Replica Promotion Failover

## Purpose

Automatically detect primary database failure, promote the most advanced replica to primary, and reconnect application traffic with minimal downtime.

## When To Use

- Production database requires high availability (RTO < 60s)
- Primary failure would cause significant revenue or user impact
- Team has operational capacity to maintain failover infrastructure

## When NOT To Use

- Manual failover is acceptable (RTO > 5 minutes)
- Single-node database with acceptable downtime
- Application can't handle connection state changes during failover

## Prerequisites

- Orchestrator tool installed (Orchestrator for MySQL, Patroni for PostgreSQL, RDS Multi-AZ)
- At least one replica fully synced
- Application configured to reconnect on connection loss
- Failover testing environment

## Inputs

- Primary and replica connection details
- Orchestrator configuration
- RPO and RTO targets
- Health check parameters (failure detection interval, retry count)

## Workflow (numbered steps)

1. Deploy orchestrator on control nodes (2-3 nodes for quorum)
2. Configure health checks: ping primary every N seconds, mark dead after M failures
3. Configure promotion rules: promote replica with most advanced GTID/binlog position
4. Configure post-failover: update DNS/VIP, update ProxySQL hostgroups, update Laravel config cache
5. Test failover: kill primary, verify promotion completes within RTO
6. Verify application reconnects without manual intervention
7. Document runbook: failover procedure, rollback, post-failover validation

## Validation Checklist

- [ ] Orchestrator detects primary failure within health check interval
- [ ] Replica promoted within RTO
- [ ] Application queries succeed after failover (no manual config change)
- [ ] Old primary, when restored, doesn't rejoin as primary (split-brain prevention)
- [ ] Failover logged and alert sent

## Common Failures

- Split-brain: old primary comes back and accepts writes — use VIP/storage fencing
- Replication lag at failover time: data loss exceeds RPO — check lag before promotion
- Application holds stale connection pool — configure automatic reconnect
- Orchestrator quorum lost in multi-AZ network partition

## Decision Points

- Orchestrator selection: Orchestrator (MySQL) vs Patroni (PostgreSQL) vs RDS Multi-AZ (managed)
- Automatic vs semi-automatic: automatic for critical, semi-automatic with human approval for less critical
- Replica selection: most advanced vs designated replica

## Performance Considerations

- Failover time = detection + promotion + DNS propagation (10-60s typical)
- Orchestrator overhead: negligible (<1% CPU)
- Frequent health checks add slight load to primary

## Security Considerations

- Orchestrator must have administrative database access
- All orchestrator-to-database communication must be encrypted
- Access to orchestrator UI/API must be restricted

## Related Rules

- 7-11-1: Always Test Failover Monthly
- 7-11-2: Always Monitor Replication Lag Before Promotion

## Related Skills

- Implement Master-Replica Topology
- Configure Multi-Region Replication
- Monitor Replica Health

## Success Criteria

- Failover completes within RTO (<60s automated, <5min manual)
- Data loss within RPO (<1s for semi-sync, seconds for async)
- Zero manual intervention for automated failover

---

# Skill: Execute Manual Planned Switchover

## Purpose

Perform a controlled primary-to-replica role swap for maintenance (upgrades, patching, resizing) with minimal application impact.

## When To Use

- Planned database maintenance requires primary restart
- Primary instance upgrade (version, instance size)
- Testing failover procedure in a controlled manner

## When NOT To Use

- Emergency failover (use automated failover)
- Application can't tolerate brief read-only window

## Prerequisites

- Replica caught up (lag < defined threshold)
- Application maintenance window confirmed
- Rollback plan documented

## Inputs

- Maintenance window start time and duration
- Replica lag threshold for safe switchover
- Connection drain timeout

## Workflow (numbered steps)

1. Announce maintenance window to stakeholders
2. Verify replica lag is near zero
3. Stop application writes or redirect to maintenance page
4. Verify replica is fully caught up (lag = 0)
5. Set primary to read-only (`SET GLOBAL read_only = ON`)
6. Promote replica to primary (`STOP SLAVE; RESET SLAVE ALL; SET GLOBAL read_only = OFF`)
7. Update application config (DNS, ProxySQL, Laravel .env) to point to new primary
8. Verify application reads/writes work on new primary
9. Restore old primary as replica of new primary
10. End maintenance window, verify monitoring

## Validation Checklist

- [ ] Zero data loss (replica fully caught up before promotion)
- [ ] Application successfully reads/writes after switchover
- [ ] Old primary replicating from new primary correctly
- [ ] Monitoring alerts re-targeted to new primary
- [ ] Duration within maintenance window

## Common Failures

- Application writes during switchover causing data divergence
- Replica not fully caught up — data loss on promotion
- DNS cache not flushed — application connects to old primary
- Old primary automatically becomes primary again (split-brain)

## Decision Points

- Switchover method: manual (full control) vs orchestrator-planned (faster, less manual steps)
- Application downtime: zero-downtime (connection drain + reconnect) vs brief maintenance page

## Performance Considerations

- Switchover duration: 1-5 minutes depending on DNS propagation, config updates
- Zero-downtime switchover possible with ProxySQL automatic detection

## Security Considerations

- All authentication must work with new primary after switchover
- Replication credentials must be configured for reverse replication

## Related Rules

- 7-11-3: Always Verify Replica Lag Before Switchover

## Related Skills

- Implement Automated Replica Promotion Failover
- Configure Automatic Query Routing

## Success Criteria

- Zero data loss during switchover
- Application functional within maintenance window
- Old primary rejoins as replica without issues
