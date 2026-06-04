# Skill: Configure Multi-Region Replication

## Purpose

Deploy read replicas in multiple geographic regions to reduce read latency for distant users and provide disaster recovery failover capability.

## When To Use

- User base spans multiple continents or distant regions
- Regulatory requirement for data residency in specific regions
- Disaster recovery requires cross-region failover
- Read latency from a single region is unacceptable

## When NOT To Use

- User base is concentrated in one region
- Cross-region data transfer costs exceed benefit
- Application requires strongly consistent cross-region reads

## Prerequisites

- Master database in primary region
- Secondary region with compute and network resources
- Cross-region network connectivity (VPC peering, Direct Connect, VPN)
- Understanding of cross-region latency characteristics

## Inputs

- Primary region and secondary region(s)
- Cross-region network latency (RTT in ms)
- Expected read traffic per region
- Data residency compliance requirements

## Workflow (numbered steps)

1. Provision replica server in target region (same DB version, spec as primary)
2. Configure async replication: primary binlog → replica over cross-region link
3. Enable TLS for cross-region replication traffic
4. Monitor initial sync completion
5. Configure application routing: route reads to nearest region's replica
6. Set up lag monitoring with cross-region alert threshold (higher than same-region)
7. Implement lag-aware routing: if replica lag > threshold, fall back to primary region
8. Document DR failover procedure: promote cross-region replica to primary

## Validation Checklist

- [ ] Replication active across regions (IO and SQL threads running)
- [ ] Cross-region replica lag within expected range (1-5s typical)
- [ ] Application reads served from nearest region
- [ ] Failover procedure tested and documented
- [ ] Data residency compliance verified

## Common Failures

- Expecting sub-second lag across intercontinental links (physical limits apply)
- Cross-region data transfer costs exceed budget (AWS: ~$0.02/GB)
- Replication breaks during network partition — requires manual recovery

## Decision Points

- Active-passive (single writable region) vs active-active (multi-primary, complex)
- Number of cross-region replicas: 1 for DR, 2+ for read scaling
- Sync vs async for cross-region: always async (sync would kill write latency)

## Performance Considerations

- Cross-region lag = network RTT + apply time (US-Europe: 100ms-5s)
- Read latency for in-region users drops from 200ms to <10ms
- Write latency unaffected (async replication, primary doesn't wait)

## Security Considerations

- TLS mandatory for cross-region replication
- Data residency: ensure replica storage complies with regional regulations
- Cross-region network must be in private subnets/VPC

## Related Rules

- 7-10-1: Always Use Async Replication for Cross-Region
- 7-10-2: Always Monitor Cross-Region Replication Lag

## Related Skills

- Implement Replica Promotion Failover
- Implement Lag-Aware Read Splitting
- Configure Multi-Region Disaster Recovery

## Success Criteria

- Cross-region read latency <20ms for in-region users
- Replication lag <5s during normal operation
- DR failover completed within RTO

---

# Skill: Select Multi-Region Replication Topology

## Purpose

Choose between active-passive (single writable region) and active-active (multi-primary) topology based on consistency requirements, write volume, and operational complexity tolerance.

## When To Use

- Designing a multi-region database architecture
- Evaluating tradeoffs between consistency and availability
- Planning disaster recovery strategy

## When NOT To Use

- Single-region deployment is sufficient
- Team lacks operational experience with multi-region systems

## Prerequisites

- Business RPO and RTO requirements
- Write volume per region
- Cross-region latency measurements
- Conflict resolution strategy (for active-active)

## Inputs

- RPO: acceptable data loss in seconds
- RTO: acceptable downtime in minutes
- Write volume per region (writes/second)
- Cross-region RTT

## Workflow (numbered steps)

1. If writes originate from a single region → active-passive (simpler)
2. If writes originate from multiple regions must be accepted locally → active-active
3. For active-passive: configure async replication from primary region to others
4. For active-active: deploy multi-primary with conflict resolution (CRDT, last-writer-wins, application-level)
5. Document DR failover: promote passive region replica to primary
6. Test failover quarterly

## Validation Checklist

- [ ] Topology chosen matches business consistency requirements
- [ ] Active-active conflict resolution strategy defined and tested
- [ ] Failover RPO measured and verified
- [ ] Cross-region replication lag within acceptable bounds

## Common Failures

- Active-active with unresolvable conflicts (data corruption)
- Active-passive with sync replication across regions (write latency killed)
- No conflict resolution testing before going active-active

## Decision Points

- Active-passive: simpler, eventual consistency, some data loss on failover
- Active-active: higher availability, complex conflict resolution, potential data divergence

## Performance Considerations

- Active-passive: write latency = local disk, no cross-region wait
- Active-active: write latency = max(regional ack), potentially high

## Security Considerations

- All cross-region replication must be encrypted
- Data residency laws may limit active-active topologies

## Related Rules

- 7-10-3: Prefer Active-Passive for Single-Region Writes

## Related Skills

- Configure Multi-Region Replication
- Implement Conflict Resolution
- Plan Disaster Recovery

## Success Criteria

- Topology meets RPO and RTO requirements
- No data divergence in active-active (verified with consistency checks)
