# Skill: Implement Plan Replication Topology

## Purpose

Design the overall replication architecture — determining the number of replicas, their hierarchy, and placement — to meet availability, scalability, and durability requirements.

## When To Use

- Designing new database architecture
- Scaling existing replication to handle growth
- Evaluating topology for disaster recovery
- Migrating from single-node to replicated setup

## When NOT To Use

- Single-node database (no replication needed)
- Cloud-managed database (RDS, Aurora, Cloud SQL) — topology is managed
- Prototyping or early development stage

## Prerequisites

- Requirements: RPO, RTO, read scaling needs
- Infrastructure: compute, storage, network topology
- Budget constraints (replicas cost money)

## Inputs

- Read traffic: peak QPS
- Write traffic: peak WPS
- Availability requirements (99.9%, 99.99%, 99.999%)
- Recovery objectives (RPO, RTO)
- Geographic distribution requirements

## Workflow (numbered steps)

1. Determine minimum replica count:
   - 1 replica: HA (failover target), basic read scaling
   - 2 replicas: HA + dedicated read replica
   - 3 replicas: HA + read scaling + regional distribution
   - N replicas: N-1 for read scaling, 1 for HA
2. Choose topology:
   - Single-tier: primary + N replicas (simple, all replicas equal)
   - Multi-tier: primary → intermediate replicas → leaf replicas (higher latency but reduces failover impact)
   - Ring topology: primary → replica1, replica1 → replica2 (cascading)
3. Apply placement:
   - Same AZ: lowest latency, single point of failure (AZ failure)
   - Multi-AZ: low latency, AZ-fault tolerant, each AZ has RTO < 1 second
   - Multi-region: higher latency, region-fault tolerant, 100ms-1s lag
4. Decide replication mode per tier:
   - Same AZ: semi-sync (RPO=0)
   - Cross-AZ: semi-sync (RPO=0, 1-5ms additional latency)
   - Cross-region: async (acceptable lag for disaster recovery)
5. Document topology with node IPs, roles, replication modes, and failover priority

## Validation Checklist

- [ ] Replica count meets read scaling requirements
- [ ] Topology supports failover RTO and RPO
- [ ] Cross-AZ placement verified
- [ ] Replication modes configured correctly for each tier
- [ ] Topology diagram documented and shared
- [ ] Capacity planning accounts for replica growth

## Common Failures

- Too few replicas for read traffic (replicas overloaded)
- Too many replicas causing replication overhead on primary
- Cross-region replicas with sync replication (unacceptable latency)
- All replicas in same AZ — single point of failure
- Cascading replication adds unnecessary latency

## Decision Points

- Single-tier vs multi-tier replication
- Number of replicas per tier
- Same-AZ vs multi-AZ vs multi-region
- Replication mode per tier (sync, semi-sync, async)
- Proxy vs direct application connection to replicas

## Performance Considerations

- Primary impact: each replica adds ~5-10% CPU/IO overhead on primary (binlog processing)
- Replica apply: single-threaded by default (MySQL), can bottleneck at high write rates
- Cross-AZ: 1-5ms RTT vs same-AZ: 0.1-0.5ms

## Security Considerations

- Intra-VPC: encryption optional but recommended
- Cross-region: mandatory TLS encryption
- Topology documentation should not expose connection strings or credentials

## Related Rules

- 7-13-1: Always Place Replicas in Different AZs
- 7-13-2: Never Design Topology Without RPO/RTO Targets

## Related Skills

- Implement Multi-Region Replication
- Implement Master-Replica Topology
- Implement Replica Health Monitoring

## Success Criteria

- Topology meets RPO and RTO requirements
- Read traffic served without replica overload
- Replication modes aligned with availability requirements
- Topology is cost-effective and documented
- Failover path is clear (which replica becomes primary)
