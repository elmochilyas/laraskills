# Skill: Configure Automatic Failover

## Purpose

Automate the detection of primary failure and promotion of a replica to minimize downtime without manual intervention.

## When To Use

- Production databases requiring high availability (99.99%+)
- Team cannot respond immediately to failures
- Automated failover is acceptable (no human judgment required)

## When NOT To Use

- Manual oversight is required for every failover decision
- RPO requirement is zero (data loss risk with async replication)
- RTO of minutes is acceptable with manual failover
- Failover risk outweighs downtime risk (false positives)

## Prerequisites

- Orchestration tool installed (Orchestrator, ProxySQL, Patroni, RDS Multi-AZ)
- Monitoring of primary and replica health
- Failover procedure tested and validated

## Inputs

- Cluster topology (primary and replica hosts)
- Health check configuration
- Orchestration tool configuration
- Failover policies (which replica to promote, when to failover)

## Workflow (numbered steps)

1. Choose orchestration tool based on your stack:
   - MySQL: Orchestrator, ProxySQL, MHA, InnoDB Cluster
   - PostgreSQL: Patroni, repmgr, pg_auto_failover
   - Cloud: RDS Multi-AZ, Aurora, Cloud SQL
2. Configure health checks:
   - Connection check (can we connect?)
   - Query check (can we run a SELECT?)
   - Lag check (is replica lagging?)
3. Configure failover policies:
   - Number of consecutive failures before declaring primary dead
   - Replica selection criteria (lag, location, version)
   - Post-failover actions (update DNS, alert team)
4. Test automatic failover:
   - Kill primary process → verify automatic promotion
   - Simulate network partition → no false failover
   - Verify application recovers without manual intervention

## Validation Checklist

- [ ] Orchestration tool installed and configured
- [ ] Health checks running and detecting failures
- [ ] Automatic failover tested (primary killed, replica promoted)
- [ ] Application reconnects to new primary automatically
- [ ] False failover prevented during network partitions
- [ ] Monitoring alerts for failover events

## Common Failures

- False positive failover (network blip kills primary, replicas fine)
- Split-brain: both old and new primary accept writes
- Application connection pool doesn't retry — outage persists
- Orchestrator promoted wrong replica (lagging replica)

## Decision Points

- Automatic vs semi-automatic (require approval) failover
- Which replica to promote (closest, least lag, highest version)
- Whether to failover cross-region or same-region

## Performance Considerations

- Health check frequency: 500ms-5s (tradeoff: detection speed vs load)
- Failover time: 5-30 seconds depending on lag and promotion steps
- New primary has no replicas until they are reattached or rebuilt

## Security Considerations

- Orchestrator must use encrypted connections
- Orchestration tool access should be restricted
- Failover actions must be logged and audited

## Related Rules

- 7-9-1: Always Validate Health Checks Before Automatic Failover
- 7-9-2: Never Allow Split-Brain In Automatic Failover

## Related Skills

- Implement Replica Promotion and Failover
- Implement Master-Replica Topology
- Configure Health Checks for Failover

## Success Criteria

- Automatic failover completes within RTO
- Zero data loss (sync replication) or within RPO (async)
- No split-brain events
- Application recovers without manual intervention
