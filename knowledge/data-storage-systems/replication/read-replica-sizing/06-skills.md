# Skill: Size Read Replicas for Write-Heavy Workloads

## Purpose

Determine the required CPU, memory, and IOPS for read replicas such that they can replay the primary's write volume while serving read queries without falling behind.

## When To Use

- Replicas consistently lag behind the primary
- Replica CPU or IOPS is saturated during peak write hours
- Provisioning new replicas for a write-heavy application

## When NOT To Use

- Replica lag is consistently zero (sufficient capacity)
- Read traffic is negligible compared to write replay load

## Prerequisites

- Primary write throughput measured (writes/second, binlog bytes/second)
- Current replica resource utilization (CPU, IOPS, memory)
- Replica lag measurements over time

## Inputs

- Primary writes per second (peak and average)
- Primary binlog/WAL generation rate (MB/second)
- Current replica CPU utilization % at peak
- Current replica IOPS utilization % at peak
- Read query volume on replica (queries/second)

## Workflow (numbered steps)

1. Measure primary write throughput at peak: binlog bytes/second and write queries/second
2. Measure replica resource utilization at peak: CPU, disk IOPS, memory pressure
3. If replica CPU > 80%: increase CPU (larger instance) — replay + reads exceed capacity
4. If replica IOPS > 80%: increase IOPS (provisioned IOPS or faster storage) — binlog replay is I/O heavy
5. If replica memory > 90% with buffer pool evictions: increase RAM — larger buffer pool reduces disk reads
6. Apply the fix: upgrade replica instance size or storage type
7. Verify: monitor replica lag for 24-48 hours after change
8. Document final replica sizing for future reference

## Validation Checklist

- [ ] Replica CPU < 70% at peak write hours
- [ ] Replica IOPS < 70% of provisioned maximum
- [ ] Replica buffer pool hit ratio > 95%
- [ ] Replica lag < 1 second during peak
- [ ] Replica sizing documented with rationale

## Common Failures

- Under-provisioned replica: lag grows during peak and never catches up
- Only matching primary CPU: replicas need extra capacity for read workload on top of replay
- Ignoring IOPS: binlog replay is sequential write, but read queries add random read IO
- Memory too low: buffer pool evictions slow down both replay and read queries

## Decision Points

- Upgrade replica instance: easier, faster, but may require different instance class
- Add more replicas: spreads read load, but each still needs to replay primary writes
- Primary vs replica size: replica may need to be larger than primary if it serves heavy read workload

## Performance Considerations

- Replay load ≈ primary write load: replica does same writes plus read queries
- Sequential binlog replay is more efficient than random writes on primary
- Read workload adds random I/O — provision IOPS for both replay + reads
- Larger buffer pool on replica if it serves many read queries (different from primary)

## Security Considerations

- Replica sizing changes may require restart — plan maintenance window
- Storage encryption must match between primary and replica
- IOPS limits may affect replication heartbeat detection if hit

## Related Rules

- 7-16-1: Always Size Replicas at Least Equal to Primary
- 7-16-2: Increase Replicas Before Primary When Lag Persists

## Related Skills

- Monitor Replica Lag
- Monitor Replica Resource Utilization
- Configure Connection Pooling for Read Replicas

## Success Criteria

- Replica lag < 1s at peak write load
- Replica resource utilization < 70% across all metrics
- Zero lag accumulation over 24-hour cycle

---

# Skill: Right-Size Replicas for Read-Heavy Workloads

## Purpose

When replicas serve significantly more reads than the primary, determine the optimal size increase (CPU, memory, IOPS) so aggregate replica capacity matches the read workload.

## When To Use

- Replicas serve 80%+ of total database queries
- User-facing query latency increases on replicas under load
- Replica CPU is saturated by read queries, not replay

## When NOT To Use

- Read and write workloads are balanced (size similarly)
- Replica lag is the only issue (write replay constraint, not reads)

## Prerequisites

- Read traffic measurements: QPS per replica, query latency
- Replica CPU profile: % spent on read queries vs replay
- Buffer pool hit ratio per replica

## Inputs

- Read QPS per replica (peak and average)
- Average query latency per replica
- Replica CPU breakdown: system vs user, read vs replay
- Buffer pool hit ratio (target > 95%)

## Workflow (numbered steps)

1. Measure read QPS per replica and identify peak-to-average ratio
2. Check replica CPU: if user CPU is high due to read queries, upgrade CPU
3. Check buffer pool hit ratio: if < 95%, add RAM to increase buffer pool size
4. Check disk: if read I/O latency is high, provision more IOPS or faster storage
5. If single replica can't serve read traffic, add more replicas and load balance
6. After resizing, verify: read latency decreases and replica CPU drops below target
7. Document sizing: replica instances, their read capacity, and headroom

## Validation Checklist

- [ ] Read latency p99 < 100ms at peak load
- [ ] Replica CPU < 70% during peak read traffic
- [ ] Buffer pool hit ratio > 95% on all replicas
- [ ] Read workload distributed evenly across replicas (if multiple)
- [ ] Replica sizing scales linearly with read traffic growth

## Common Failures

- Adding more replicas without increasing load balancer capacity
- Sizing replicas identically but read traffic is skewed (use weighted balancing)
- Ignoring buffer pool: more RAM often helps more than more CPU for read-heavy workloads
- Not accounting for future growth: size with 30-50% headroom

## Decision Points

- Vertical scaling (larger replica): simpler, but single point of read traffic
- Horizontal scaling (more replicas): better read capacity scaling, more complex balancing
- Instance family: memory-optimized (R-family) for buffer pool, compute-optimized (C-family) for query processing

## Performance Considerations

- Each additional replica adds read capacity linearly but also adds write replay load per replica
- Buffer pool sizing is the single most impactful parameter for read-heavy replicas
- Storage type matters: gp3 vs io2 vs local NVMe for read-heavy workloads

## Security Considerations

- More replicas = more endpoints to secure — ensure consistent security groups
- Read-heavy replicas may need different parameter groups (query cache, buffer pool)
- Monitoring data from all replicas must be aggregated for complete visibility

## Related Rules

- 7-16-3: Always Provision 30-50% Headroom on Replicas
- 7-16-4: Buffer Pool Hit Ratio Must Exceed 95%

## Related Skills

- Size Read Replicas for Write-Heavy Workloads
- Configure Replica Load Balancing Strategy
- Monitor Replica Resource Utilization

## Success Criteria

- Read latency p99 < 100ms at peak
- Buffer pool hit ratio > 95% on all replicas
- Replica CPU < 70%
- Read capacity scales linearly with replica count
