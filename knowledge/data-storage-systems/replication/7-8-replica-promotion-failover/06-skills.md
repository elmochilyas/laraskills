# Skill: Implement Replica Promotion and Failover

## Purpose

Promote a read replica to become the new primary when the existing primary fails or requires maintenance, with minimal downtime.

## When To Use

- Primary database instance fails
- Planned maintenance requiring primary reboot
- Blue/green deployment of database changes
- Need to failover to a different region

## When NOT To Use

- Only one database node (no failover target)
- Application can tolerate extended downtime
- Data loss from promotion exceeds RPO

## Prerequisites

- Read replica configured and running
- Replication lag within acceptable range before failover
- Application connection configuration supports failover
- Failover procedure documented and tested

## Inputs

- Current primary connection details
- Replica connection details
- Application configuration to update (DNS, connection string, Laravel config)

## Workflow (numbered steps)

1. For controlled failover (planned maintenance):
   a. Quiesce writes on the primary (read-only mode or stop application)
   b. Wait for replication lag to reach zero
   c. Promote replica to new primary
   d. Point application to new primary
   e. Verify application writes succeed on new primary
   f. Repoint old primary as replica (or rebuild as new replica)
2. For automatic failover (unplanned primary failure):
   a. Detect primary failure (health check timeout)
   b. Promote replica: `STOP REPLICA; RESET SLAVE ALL;` (MySQL)
   c. Update DNS or VIP to point to new primary
   d. Application retries with new primary
   e. If old primary comes back, it must be rebuilt (not re-added as replica)
3. For PostgreSQL:
   a. `pg_ctl promote` or `SELECT pg_promote()`
   b. Configure application with new primary
   c. Rebuild old primary using `pg_basebackup`

## Validation Checklist

- [ ] Failover procedure documented
- [ ] Failover tested in staging environment
- [ ] RTO (Recovery Time Objective) measured and met
- [ ] RPO (Recovery Point Objective) measured and met
- [ ] Application connects to new primary automatically
- [ ] Old primary either demoted or rebuilt correctly

## Common Failures

- Replica promoted with remaining lag — data loss
- Application DNS cache points to old primary
- Old primary restarts and conflicts with new primary (split-brain)
- Auto-increment IDs conflict (GTID or identical server IDs)

## Decision Points

- Manual vs automatic failover
- Orchestrator vs ProxySQL vs application-level failover
- DNS update vs VIP vs load balancer update

## Performance Considerations

- Promotion takes seconds to minutes depending on WAL/binlog replay
- Application must handle connection failures during failover
- New primary has no replicas — zero read scaling until new replicas created

## Security Considerations

- Failover must not expose data to unauthorized access
- Promotion should not require superuser access from application
- Split-brain prevention is critical (STONITH: Shoot The Other Node In The Head)

## Related Rules

- 7-8-1: Always Check Lag Before Promoting Replica
- 7-8-2: Never Promote A Replica With Lag > RPO

## Related Skills

- Implement Master-Replica Topology
- Monitor Replica Lag
- Configure Application for Automatic Failover
- Implement Backup Before Failover

## Success Criteria

- Failover completes within RTO
- Data loss within RPO (zero if sync replication)
- Application recovers and serves traffic within seconds of failover
- Old primary does not cause split-brain
