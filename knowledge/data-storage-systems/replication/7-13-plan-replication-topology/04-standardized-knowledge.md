# 7-13 Plan Replication Topology

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-13 |
| Knowledge Unit Title | Plan Replication Topology |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.1 Master-replica topology | 7.5 Replica lag | 7.12 Multi-region replication |
| Last Updated | 2026-06-04 |

## Overview

Designing replication topology involves determining replica count, hierarchy, and placement to meet availability, scalability, and durability requirements. Factors include RPO/RTO, read traffic volume, geographic distribution, and budget.

---

## Core Concepts

- **Replica count**: 1 for HA, 2 for HA + read scaling, 3+ for regional distribution.
- **Single-tier topology**: Primary → N replicas. Simple, all replicas equal.
- **Multi-tier topology**: Primary → intermediate replicas → leaf replicas. Reduces failover blast radius.
- **Placement**: Same-AZ (0.1-0.5ms), Multi-AZ (1-5ms), Multi-region (10-200ms).
- **Replication mode**: Sync (RPO=0, higher latency), Semi-sync (RPO=0 within AZ), Async (acceptable lag).

## When To Use

- Designing new database architecture
- Scaling existing replication to handle growth
- Evaluating topology for disaster recovery

## When NOT To Use

- Single-node database (no replication needed)
- Cloud-managed database with auto-scaling

## Best Practices

- Place replicas in different AZs for production
- Define RPO/RTO before choosing topology
- Document topology with node roles and failure priority

## Architecture Guidelines

| Topology | Read Scaling | Failover Complexity | Latency Impact |
|----------|-------------|-------------------|----------------|
| Single-tier (1 replica) | Minimal | Low | None |
| Single-tier (2 replicas) | Good | Low | None |
| Multi-tier (cascading) | Excellent | Medium | Adds per-hop latency |
| Multi-region | Global reads | High | Cross-region lag |

## Performance Considerations

- Each replica adds ~5-10% CPU/IO on primary (binlog processing)
- MySQL replica apply is single-threaded by default — bottleneck at high write rates
- Cross-AZ adds 1-5ms RTT vs same-AZ 0.1-0.5ms

## Security Considerations

- Intra-VPC encryption recommended
- Cross-region replication requires mandatory TLS

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | All replicas in same AZ | Cost savings | Single point of failure | Spread across AZs |
| 2 | Too many replicas | Over-provisioning | Primary overhead | Right-size based on read QPS |
| 3 | No topology documentation | Skipped planning | Confusion during failover | Document node roles and IPs |

## Anti-Patterns

- Designing topology without RPO/RTO targets
- All replicas in same availability zone
- Cascading replication without understanding added latency

## Verification

- [ ] Replica count meets read scaling requirements
- [ ] Topology supports failover RTO and RPO
- [ ] Cross-AZ placement verified
- [ ] Replication modes configured per tier
- [ ] Topology diagram documented
