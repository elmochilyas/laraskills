# 7-8 Replica Promotion Failover

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-8 |
| Knowledge Unit Title | Replica Promotion Failover |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.1 Master-replica topology | 7.5 Replica lag | 7.12 Cascading replication |
| Last Updated | 2026-06-04 |

## Overview

Failover promotes a replica to primary when the current primary fails. Manual failover involves ops team promoting a replica and updating config. Automated failover uses orchestrators (Orchestrator, Patroni) to handle detection, promotion, and routing updates. RPO and RTO determine strategy.

---

## Core Concepts

- **Manual failover**: Ops identifies failure, promotes replica, updates config. RTO: 5-30 minutes.
- **Automated failover**: Orchestrator detects failure, promotes most advanced replica, reassigns VIP. RTO: 10-60 seconds.
- **RPO**: Data loss during failover. Async: up to N seconds. Semi-sync: zero.
- **Split-brain prevention**: Old primary must be fenced (STONITH) to prevent dual-write.

## When To Use

- Production databases requiring high availability
- Planned maintenance requiring primary replacement
- Disaster recovery testing

## When NOT To Use

- Single-node database (no failover target)
- Application can tolerate extended downtime

## Best Practices

- Test failover monthly in staging
- Document runbook with exact promotion steps
- Always monitor lag before promoting

## Architecture Guidelines

| Approach | RTO | RPO | Complexity |
|----------|-----|-----|------------|
| Manual failover | 5-30 min | Seconds to minutes | Low |
| Automated (Orchestrator) | 10-60s | Configurable | Medium |
| Automated (Patroni) | 10-30s | Zero (sync) | Medium |
| Cloud (RDS Multi-AZ) | 60-120s | Zero | None |

## Performance Considerations

- Promotion time depends on WAL/binlog replay
- New primary has no replicas — zero read scaling until replicas rebuilt

## Security Considerations

- Failover must not expose data to unauthorized access
- Split-brain prevention is critical for data integrity

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | No failover testing | Assumption it works | Failover fails when needed | Monthly failover drills |
| 2 | Promoting with lag | Ignoring lag check | Data loss | Always verify lag < RPO before promoting |
| 3 | No split-brain prevention | Missing fencing | Data divergence | Implement STONITH or quorum fencing |

## Anti-Patterns

- Never testing failover until production incident
- Promoting replica without verifying lag
- Old primary reconnecting and causing split-brain

## Verification

- [ ] Failover procedure documented and tested
- [ ] RTO measured and met
- [ ] RPO measured and met
- [ ] Split-brain prevention verified
