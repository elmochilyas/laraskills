# 7-9 Automatic Failover

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-9 |
| Knowledge Unit Title | Automatic Failover |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.8 Replica promotion failover | 7.1 Master-replica topology | 7.5 Replica lag |
| Last Updated | 2026-06-04 |

## Overview

Automatic failover detects primary failure and promotes a replica without human intervention. Orchestration tools (Orchestrator, Patroni, RDS Multi-AZ) handle health checking, replica promotion, and connection routing. The goal is minimizing RTO while preventing false positives and split-brain.

---

## Core Concepts

- **Health checks**: Connection test, query test, and lag monitoring to detect primary failure.
- **Failure detection**: Consecutive health check failures before declaring primary dead.
- **Replica promotion**: Automatically promoting the best candidate based on lag, location, and version.
- **Split-brain prevention**: Ensuring only one node accepts writes after failover.
- **Quorum**: Majority of nodes must agree on failover decision.

## When To Use

- Production databases requiring 99.99%+ availability
- Teams that cannot respond immediately to failures
- Multi-AZ or multi-region deployments

## When NOT To Use

- Manual oversight required per failover decision
- RPO must be zero with async replication
- False positive risk outweighs downtime risk

## Best Practices

- Use odd number of control nodes for quorum
- Test automatic failover monthly
- Implement alerting for every failover event

## Architecture Guidelines

| Tool | Database | RTO | Split-brain Prevention |
|------|----------|-----|----------------------|
| Orchestrator | MySQL | 10-30s | Raft-based recovery |
| Patroni | PostgreSQL | 10-30s | DCS (etcd/consul) quorum |
| RDS Multi-AZ | MySQL/PostgreSQL | 60-120s | AWS-managed |
| ProxySQL | MySQL | 1-5s | Hostgroup monitoring |

## Performance Considerations

- Health check frequency: 500ms-5s tradeoff between detection speed and load
- Failover time: 5-30 seconds depending on lag and promotion steps

## Security Considerations

- Orchestrator must use encrypted connections
- Orchestration tool access must be restricted

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | False positive failover | Network blip triggers failover | Unnecessary downtime | Set conservative failure thresholds |
| 2 | Split-brain | No fencing mechanism | Data divergence | Implement STONITH or quorum |
| 3 | Application doesn't retry | Connection pool not configured | Outage persists after failover | Configure retry logic in connection pool |

## Anti-Patterns

- No health check validation before declaring failure
- Promoting wrong replica (most lagging)
- Operating without quorum enforcement

## Verification

- [ ] Health checks detect primary failure correctly
- [ ] Failover completes within RTO
- [ ] No split-brain events during testing
- [ ] Application recovers without manual intervention
