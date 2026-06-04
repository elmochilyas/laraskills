# Skill: Implement Multi-Region Replication

## Purpose

Replicate data across geographically distributed data centers or cloud regions to reduce read latency, provide disaster recovery, and comply with data residency requirements.

## When To Use

- Global user base with high read traffic from multiple regions
- Disaster recovery across regions (active-passive or active-active)
- Data residency compliance (keep data in specific geographic regions)
- Regulatory requirements for data locality

## When NOT To Use

- Single-region user base
- Write latency impact unacceptable (cross-region replication adds latency)
- Application requires strong global consistency
- Cost of cross-region data transfer is prohibitive

## Prerequisites

- Database nodes in multiple regions
- Network connectivity between regions (VPN, Direct Connect, private network)
- Understanding of cross-region latency and bandwidth
- Data residency requirements documented

## Inputs

- Multi-region topology design
- Region list with latency and bandwidth measurements
- Replication configuration (async, semi-sync, or sync)
- Data residency policies

## Workflow (numbered steps)

1. Design multi-region topology:
   - Active-passive: one primary region, replica regions for reads
   - Active-active: multiple regions accept writes (multi-master or multi-primary)
   - Hub-and-spoke: central region replicates to all other regions
2. Configure cross-region replication:
   - Primary mirror: async replication from primary region to replica regions
   - Multi-master: Galera (sync, but high latency impact) or BDR/Tungsten (async)
   - Kafka-based: CDC (Debezium) streams to Kafka, Kafka replicates to other regions
3. For read replicas in other regions:
   - Route reads to nearest replica based on geo-DNS or latency-based routing
   - Accept eventual consistency for cross-region reads
4. For multi-master setup:
   - Each region writes locally, replicates async to other regions
   - Conflict resolution handles concurrent writes (see Conflict Resolution skill)
   - Higher latency tolerance for cross-region sync
5. Monitor cross-region replication lag (typically 100ms-several seconds)
6. Test disaster recovery: failover primary region, verify reads/writes work

## Validation Checklist

- [ ] Cross-region replication configured and running
- [ ] Replication lag meets SLAs (e.g., < 1 second for critical, < 5s for standard)
- [ ] Reads route to nearest region
- [ ] Writes go to primary region (active-passive) or local region (active-active)
- [ ] Failover between regions works correctly
- [ ] Data residency compliance met (data stays in required regions)

## Common Failures

- Cross-region latency causes write timeouts (async replication)
- Network partition between regions stops all replication
- Conflict resolution causes data loss across regions
- Compliance violation: data replicated to disallowed region
- Cost: cross-region data transfer can be expensive

## Decision Points

- Active-passive vs active-active topology
- Async vs synchronous cross-region replication
- Single primary region vs multi-primary (write in each region)
- CDC-based replication (Debezium + Kafka) vs native database replication

## Performance Considerations

- Cross-region latency: 10-200ms depending on distance
- Async replication: zero write latency impact, 100ms-sec lag
- Sync replication: write latency = cross-region RTT (unacceptable for most)
- Bandwidth costs: data transfer between cloud regions

## Security Considerations

- Cross-region replication must use TLS encryption
- Data transferred across borders must comply with regulations
- Access controls must be consistent across regions

## Related Rules

- 7-12-1: Always Monitor Cross-Region Replication Lag
- 7-12-2: Never Replicate Data To Geographically Restricted Regions

## Related Skills

- Implement Multi-Master Replication
- Implement Conflict Resolution for Multi-Master
- Implement Geo-DNS Routing
- Implement CDC-Based Replication (Kafka/Debezium)

## Success Criteria

- Cross-region replication lag within SLA
- Read traffic served from nearest region
- Failover between regions tested and working
- Data residency compliance verified
- Cost within budget for cross-region data transfer
