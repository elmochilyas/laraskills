# Skill: Configure Replica Load Balancing Strategy

## Purpose

Distribute read queries across multiple replicas using a strategy (round-robin, least connections, weighted) that matches replica capacity and workload characteristics.

## When To Use

- Multiple read replicas of equal or varying capacity
- Replicas experience uneven query load
- Need predictable distribution of read traffic

## When NOT To Use

- Single replica (no balancing needed)
- Very low traffic where distribution doesn't matter
- Application can tolerate random skew (Laravel default)

## Prerequisites

- Multiple read replicas provisioned
- Replica capacity known (CPU, memory, IOPS)
- Connection pooler or custom DB connector available

## Inputs

- Replica count and specification (size, capacity)
- Read traffic volume per second
- Target per-replica utilization

## Workflow (numbered steps)

1. Enumerate replicas and their capacities
2. If all replicas are equal → round-robin (uniform distribution)
3. If replicas differ → weighted balancing via ProxySQL or custom connector
4. If query response time varies → least-connections routing
5. Implement strategy in connection pooler (ProxySQL) or custom Laravel DB connector
6. Monitor per-replica load and adjust weights or strategy
7. Document balancer configuration for operations team

## Validation Checklist

- [ ] Read traffic distribution matches configured weights
- [ ] No single replica exceeds 80% utilization while others are idle
- [ ] Failing replica is automatically removed from rotation
- [ ] Balancer adds negligible latency (<1ms per query)

## Common Failures

- Uneven load with Laravel random default: smaller replica becomes bottleneck
- Round-robin with heterogeneous replicas: overloads weak nodes
- No health check: dead replica still receives traffic

## Decision Points

- Strategy: round-robin (simple, equal replicas) vs weighted (heterogeneous) vs least-connections (variable query cost)
- Implementation: ProxySQL (MySQL) vs custom Laravel connector vs Octane pool
- Health check interval: shorter for critical traffic, longer for batch

## Performance Considerations

- Least-connections routing adds slight proxy overhead but best for variable query costs
- Weighted balancing maximizes aggregate throughput when replicas are heterogeneous
- Random (Laravel default) is zero-overhead but can skew under load

## Security Considerations

- Balancer must not expose replica internals to application
- ProxySQL admin interface must be firewalled

## Related Rules

- 7-9-1: Always Match Balancer Strategy to Replica Capacity
- 7-9-2: Always Health-Check Replicas Before Routing

## Related Skills

- Configure ProxySQL Query Routing
- Configure Connection Pooling for Read Replicas
- Monitor Replica Health

## Success Criteria

- Per-replica CPU utilization within 10% of each other (equal replicas)
- Weighted replicas match configured ratio within 5% tolerance
- Zero traffic routed to unhealthy replicas

---

# Skill: Implement Weighted Replica Routing with ProxySQL

## Purpose

Route proportionally more read traffic to larger replicas and less to smaller replicas using ProxySQL's weight-based hostgroup configuration.

## When To Use

- Replicas have different instance sizes (e.g., one 2xlarge, two xlarge)
- Need fine-grained control over per-replica traffic share
- ProxySQL is already deployed in the stack

## When NOT To Use

- All replicas are identically sized
- ProxySQL overhead is not justified

## Prerequisites

- ProxySQL installed and configured
- Replica specifications documented

## Inputs

- Replica hostnames, ports, and capacity ratios
- Weights (e.g., 2xlarge=100, xlarge=50)

## Workflow (numbered steps)

1. Add replicas to ProxySQL `mysql_servers` table with hostgroup_id for readers
2. Set `weight` column proportional to capacity (e.g., 100 for large, 50 for medium, 25 for small)
3. Configure query rules to route SELECT queries to reader hostgroup
4. Configure health check interval and `max_connections` per replica
5. Verify distribution with ProxySQL stats (`stats_mysql_query_digest`)
6. Monitor and adjust weights based on actual load

## Validation Checklist

- [ ] Traffic ratio matches configured weights within 5%
- [ ] All replicas have appropriate health check settings
- [ ] Failing replica weight automatically set to 0
- [ ] ProxySQL stats show balanced distribution

## Common Failures

- Weight too low: replica receives negligible traffic, underutilized
- Weight too high: replica overwhelmed, query latency spikes
- No health check: dead replica gets connections, timeouts

## Decision Points

- Weight calculation: base on CPU count, memory, or benchmark throughput
- Heavier replicas get higher weight; lighter replicas get proportionally lower

## Performance Considerations

- ProxySQL adds ~0.1ms per query routing
- Weighted balancing ensures maximum aggregate replica throughput

## Security Considerations

- ProxySQL admin port must not be publicly accessible
- MySQL user credentials stored in ProxySQL must match database

## Related Rules

- 7-9-1: Always Match Balancer Strategy to Replica Capacity

## Related Skills

- Configure Replica Load Balancing Strategy
- Configure ProxySQL Query Routing

## Success Criteria

- Replica utilization proportional to weight within 5%
- No replica consistently overloaded
