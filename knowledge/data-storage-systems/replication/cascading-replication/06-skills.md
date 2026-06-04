# Skill: Implement Cascading Replication Topology

## Purpose

Chain replicas so that downstream replicas replicate from upstream replicas rather than directly from the primary, reducing primary load and enabling multi-region fan-out.

## When To Use

- Primary has too many direct replica connections (binlog dump overhead)
- Multi-region deployment: replicate from regional replica, not cross-region primary
- Need to limit direct connections to primary for performance or security

## When NOT To Use

- Few replicas (1-3) — direct connections are simpler
- Lag requirements are strict — each cascade hop adds latency
- Team lacks monitoring depth for chained replication

## Prerequisites

- Master-replica topology working with direct replication
- Understanding of lag accumulation per cascade hop
- Intermediate replica server provisioned

## Inputs

- Primary connection details
- Intermediate replica(s) connection details
- Target downstream replicas
- Acceptable lag per hop

## Workflow (numbered steps)

1. Configure primary → intermediate replica (standard replication)
2. Configure intermediate replica to log binlog (`log_slave_updates=ON` in MySQL)
3. For each downstream replica: point replication at intermediate replica, not primary
4. Verify replication chain: primary → intermediate → downstream
5. Monitor lag at each level (lag accumulates: hop1 + hop2 + ...)
6. Document topology, naming each replica's position in chain
7. Plan for intermediate replica failure (all downstream replicas lose source)

## Validation Checklist

- [ ] Primary binlog dump connections reduced (only to intermediate replicas)
- [ ] All downstream replicates show positive lag but within limits
- [ ] Intermediate replicas have `log_slave_updates` enabled
- [ ] Topology diagram documented and accessible

## Common Failures

- Deep chains (>3 levels): lag grows too large, failure diagnosis complex
- Intermediate replica failure breaks entire downstream branch
- `log_slave_updates` disabled on intermediate — downstream replicas get no data
- Monitoring gap: aggregating lag across the chain is harder

## Decision Points

- Cascading depth: 2-3 levels max (primary → region → AZ → application)
- Branching factor: how many downstream replicas per intermediate (10-20 is safe)
- Intermediate placement: same AZ (low lag) vs cross-region (adds latency)

## Performance Considerations

- Primary load reduction: binlog dump limited to 1-2 intermediate replicas instead of 20
- Lag accumulation: each hop adds network RTT + apply time
- Recovery time after failure: downstream replicas must catch up from intermediate's relay log

## Security Considerations

- Intermediate replica must have same access controls as primary
- Replication traffic between cascade hops must be encrypted
- Downstream replicas authenticate to intermediate, not primary

## Related Rules

- 7-12-1: Limit Cascade Depth to 3 Levels
- 7-12-2: Enable log_slave_updates on All Intermediate Replicas

## Related Skills

- Configure Multi-Region Replication
- Implement Master-Replica Topology
- Monitor Replica Lag

## Success Criteria

- Primary binlog dump connections ≤ number of intermediate replicas
- Lag at deepest downstream replica within acceptable range (e.g., <5s)
- Topology documented with clear naming and monitoring

---

# Skill: Plan Cascading Replication for Multi-Region Deployment

## Purpose

Design a cascading replication topology that minimizes cross-region primary connections while serving reads in multiple regions with acceptable lag.

## When To Use

- Deploying replicas in 3+ regions
- Primary must be isolated from direct cross-region replica connections
- Each region needs its own set of downstream replicas

## When NOT To Use

- Single-region deployment
- Two-region with direct replication is simple enough

## Prerequisites

- List of target regions and latency measurements between them
- Replica count per region
- Primary region identified

## Inputs

- Region list with inter-region RTT
- Replica count per region
- Acceptable read lag per region

## Workflow (numbered steps)

1. Primary region hosts the primary database
2. Intermediate replicas in the primary region (1-2) replicate directly from primary
3. Cross-region replicas replicate from intermediate replicas in the primary region
4. Each cross-region replica serves as intermediate for in-region downstream replicas
5. Configure `log_slave_updates` on all intermediates
6. Set region-specific lag alert thresholds based on cascading depth
7. Test failure scenarios: intermediate replica failure, cross-region link failure

## Validation Checklist

- [ ] Cross-region replicas replicate from primary-region intermediate, not primary
- [ ] In-region downstream replicas replicate from their regional intermediate
- [ ] Lag at each region within defined SLA
- [ ] Failure of one intermediate doesn't cascade to unrelated regions

## Common Failures

- Cross-region link failure breaks entire downstream region — plan for local read-only fallback
- Intermediate replica in primary region fails — all regions lose replication
- Cascading lag too high for latency-sensitive queries — use lag-aware routing

## Decision Points

- Hub regions: intermediate replicas may be placed in hub regions (e.g., us-east-1 as hub for Americas)
- Redundancy: deploy paired intermediate replicas per region for HA

## Performance Considerations

- Region farthest from primary has highest lag (each hop adds RTT)
- Cross-region bandwidth costs: cascading reduces primary egress but still pays for replication traffic

## Security Considerations

- Cross-region traffic must be encrypted (TLS)
- Data residency: ensure replicas comply with regional laws

## Related Rules

- 7-12-3: Never Cascade Across More Than 3 Regions

## Related Skills

- Implement Cascading Replication Topology
- Configure Multi-Region Replication
- Implement Lag-Aware Read Splitting

## Success Criteria

- All regions serve reads from local replicas
- Lag within SLAs for every region
- No region's failure impacts other regions' replication
