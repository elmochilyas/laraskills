# Skill: Implement Master-Replica Topology

## Purpose

Configure a primary (write) database node with one or more replica (read) nodes to scale read capacity and provide high availability.

## When To Use

- Read traffic exceeds single database capacity
- Need read scalability without scaling writes
- High availability requirement (replica for failover)
- Reporting/analytics queries that shouldn't impact primary

## When NOT To Use

- Read traffic is within single node capacity
- Write workload is the bottleneck (replicas don't help writes)
- Application cannot tolerate eventual consistency (stale reads)
- Operational complexity of replication is prohibitive

## Prerequisites

- Database server (MySQL, PostgreSQL)
- Replication configured (async, semi-sync, or sync)
- Read replica provisioned

## Inputs

- Primary database connection details
- Replica database connection details
- Replication configuration

## Workflow (numbered steps)

1. Configure primary for replication: enable binlog (MySQL) or WAL archiving (PostgreSQL)
2. Provision replica server with same database version and configuration
3. Configure replication: point replica to primary, start replication
4. Monitor initial sync: replica catches up to primary
5. Configure Laravel read/write connections: primary for writes, replicas for reads
6. Monitor replication lag and alert on excessive lag
7. Test failover: promote replica to primary, verify application works

## Validation Checklist

- [ ] Replication is active (IO and SQL threads running)
- [ ] Data written to primary appears on replica
- [ ] Laravel read/write splitting works correctly
- [ ] Failover procedure is documented and tested

## Common Failures

- Replication lag causes stale reads
- Replica runs out of disk space (binlog storage)
- Network partition causes replication to stop
- Read-only queries accidentally routed to primary

## Decision Points

- Async vs semi-sync vs sync replication
- Number of replicas (1 for HA, 2+ for read scaling)
- Replica placement (same AZ vs cross-AZ vs cross-region)

## Performance Considerations

- Write latency: async (none), semi-sync (1 RTT), sync (N RTT)
- Read capacity: scales linearly with replica count
- Replication lag: async (sub-second to seconds), sync (zero)

## Security Considerations

- Replication must use TLS encryption between nodes
- Replica must have same access controls as primary
- Replication credentials must be managed securely

## Related Rules

- 7-1-1: Always Monitor Replica Lag
- 7-1-2: Never Write To Replicas

## Related Skills

- Configure Laravel Read/Write Connections
- Implement Read/Write Splitting
- Implement Replica Promotion and Failover

## Success Criteria

- Replication lag < 1 second (async) or zero (sync)
- Read traffic served from replicas, write traffic to primary
- Failover procedure tested and documented

---

# Skill: Select Replication Mode

## Purpose

Choose between asynchronous, semi-synchronous, and synchronous replication based on durability requirements and latency tolerance.

## When To Use

- Designing master-replica topology
- Evaluating data loss risk vs performance tradeoff
- Defining RPO (Recovery Point Objective) requirements

## When NOT To Use

- Non-replicated database
- Single-node deployment

## Prerequisites

- Understanding of replication modes
- RPO and RTO requirements
- Network latency between nodes

## Inputs

- RPO requirement (acceptable data loss on failure)
- Write latency budget
- Network RTT between nodes

## Workflow (numbered steps)

1. Asynchronous replication:
   - Primary commits without waiting for replica
   - Lowest write latency impact
   - RPO: up to seconds of data loss on primary failure
   - Use for: read replicas, reporting, analytics
2. Semi-synchronous replication:
   - Primary waits for at least one replica to acknowledge
   - Zero data loss if at least one replica is synced (MySQL `AFTER_SYNC`)
   - Write latency: +1 network RTT
   - Use for: production primary with RPO=0 requirement
3. Synchronous replication:
   - Primary waits for all replicas to acknowledge
   - Highest durability, highest write latency
   - Use for: zero data loss, multi-node clusters (Galera, PostgreSQL synchronous_commit)
4. Choose based on RPO requirement and latency budget

## Validation Checklist

- [ ] Replication mode matches RPO requirements
- [ ] Write latency within acceptable range
- [ ] Failover RPO validated (no data loss for semi-sync/sync)
- [ ] Mode change tested before production deployment

## Common Failures

- Async replication for critical data — data loss on failover
- Sync replication with high network latency — write latency unacceptable
- Semi-sync degrades to async if no replica acknowledges (MySQL)

## Decision Points

- Durability vs performance tradeoff
- Number of synchronous replicas required

## Performance Considerations

- Async: no latency impact on writes
- Semi-sync: +1 network RTT per write (same region: 1-5ms)
- Sync: +max(replica_RTT) per write

## Security Considerations

- All modes require encrypted replication
- Replication credentials must be distinct from application credentials

## Related Rules

- 7-1-1: Always Monitor Replica Lag

## Related Skills

- Implement Master-Replica Topology
- Implement Semi-Sync Replication
- Implement Synchronous Replication

## Success Criteria

- RPO met for chosen replication mode
- Write latency within budget
- Failover tested with verified data loss (RPO met)
