# Skill: Configure Read Replicas Per Shard

## Purpose

Deploy and configure read replicas for each shard to scale read capacity and provide read redundancy within the sharded architecture.

## When To Use

- Read-heavy workload on one or more shards
- Need to offload read traffic from shard primaries
- Reporting or analytics queries running against shards
- Read availability requirements

## When NOT To Use

- Write-heavy workload (replicas may not help)
- Read traffic is within shard primary capacity
- Infrastructure cost of per-shard replicas is prohibitive

## Prerequisites

- Sharded database architecture
- Replication configured per shard (primary → replica)
- Read/write splitting configured per shard connection

## Inputs

- Shard list with read traffic metrics
- Replica count per shard (based on read volume)
- Connection configuration per shard (read + write)

## Workflow (numbered steps)

1. Deploy read replicas for shards with high read traffic
2. Configure replication: each shard primary → its replica(s)
3. Configure Laravel read/write connections per shard:
   ```php
   'shard_0' => [
       'read' => ['host' => ['shard0-replica']],
       'write' => ['host' => ['shard0-primary']],
       // ...
   ]
   ```
4. For shards with low read traffic, share replicas or skip
5. Configure sticky writes per shard (read-after-write consistency)
6. Monitor replica lag per shard
7. On replica failure, route reads to primary for that shard

## Validation Checklist

- [ ] Read replicas configured for each shard
- [ ] Read/write splitting works per shard connection
- [ ] Replica lag monitored per shard
- [ ] Read traffic offloaded to replicas

## Common Failures

- Replica lag causes stale reads on one shard but not others
- Read replica failure not detected — reads return errors
- Connection pooling not configured per shard — connection exhaustion

## Decision Points

- One replica per shard vs N replicas per shard
- Shared replicas across shards vs dedicated per shard

## Performance Considerations

- Replica count per shard proportional to read load on that shard
- Cross-shard fan-out queries read from each shard's replicas (consistent)
- Replica lag varies per shard — monitor individually

## Security Considerations

- Replicas must have same access controls as primaries
- Replication must be encrypted (TLS between primary and replica)

## Related Rules

- 6-17-1: Always Monitor Replica Lag Per Shard
- 6-17-2: Never Route Critical Reads To High-Lag Replicas

## Related Skills

- Implement Read/Write Splitting
- Configure Laravel Read/Write Connections
- Implement Shard Monitoring

## Success Criteria

- Read traffic offloaded to replicas for all shards
- Replica lag within acceptable threshold per shard
- Read replica failure doesn't cause service disruption

---

# Skill: Route Shard Reads to Replicas Based on Workload

## Purpose

Dynamically route read queries to replicas per shard based on query type, latency requirements, and replica health.

## When To Use

- Per-shard replicas deployed for read scaling
- Different read workloads have different freshness requirements
- Replica health varies per shard

## When NOT To Use

- No replicas per shard (single node per shard)
- All reads require fresh data (always read from primary)

## Prerequisites

- Read replicas per shard configured
- Query classification (freshness-critical vs tolerant)
- Per-shard replica health monitoring

## Inputs

- Query type classification
- Per-shard replica lag metrics
- Per-shard replica health status

## Workflow (numbered steps)

1. Classify queries per shard:
   - Freshness-critical: user profile, order status → read from primary
   - Freshness-tolerant: reports, search → read from replicas
2. Configure Laravel read/write splitting per shard:
   - Freshness-critical queries: `DB::connection('shard_0_write')->select(...)`
   - Tolerant queries: `DB::connection('shard_0')->select(...)` (routes to replica)
3. Replica health check: if replica lag > threshold, route all reads to primary for that shard
4. Implement lag-aware routing per shard
5. Monitor read distribution per shard (primary vs replica)

## Validation Checklist

- [ ] Freshness-critical reads go to primary
- [ ] Tolerant reads go to replicas
- [ ] Replica health check redirects to primary on lag
- [ ] Read distribution balanced per shard

## Common Failures

- All reads go to replicas — stale data served for critical queries
- Replica lag check adds latency to every query
- Read distribution uneven — one replica overloaded

## Decision Points

- Global routing policy vs per-shard routing
- Lag threshold per shard (based on workload characteristics)

## Performance Considerations

- Primary reads: latest data, higher load on primary
- Replica reads: may be stale, distributes load
- Lag check: periodic (not per-query) for performance

## Security Considerations

- Read routing must respect data access controls
- Replica access must be logged for audit

## Related Rules

- 6-17-1: Always Monitor Replica Lag Per Shard

## Related Skills

- Configure Read Replicas Per Shard
- Implement Lag-Aware Read Splitting
- Implement Sticky Writes

## Success Criteria

- Freshness-critical reads always served fresh
- Replica reads offload significant traffic from primaries
- Zero stale data served for freshness-critical queries
