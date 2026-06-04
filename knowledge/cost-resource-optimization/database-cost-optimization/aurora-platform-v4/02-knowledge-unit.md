# K09: Aurora Platform v4

## Metadata
- **ID**: K09
- **Subdomain**: Database Cost Optimization
- **Topic**: Aurora Platform v4
- **Source**: AWS Blog (April 2026), CloudBurn
- **Reliability**: High

## Executive Summary
Aurora Platform Version 4 (released April 2026) delivers 27% faster query completion and 28% lower cost compared to v3. The improvements come from optimized distributed storage, improved query execution, and better I/O path efficiency. This is a free upgrade (no migration cost) for existing Aurora users and directly reduces both performance bottlenecks and database spend.

## Core Concepts
- **Query speed**: 27% faster completion vs v3
- **Cost reduction**: 28% lower total cost vs v3
- **Free upgrade**: No additional licensing or migration fee
- **Compatibility**: Full backward compatibility with v3
- **Storage improvements**: Optimized distributed storage layer

## Ecosystem Usage

- **Laravel Forge**: Supports Aurora and RDS provisioning via UI; manages database user creation and SSL\n- **Laravel Vapor**: Aurora Serverless v2 is the default database option for Vapor-deployed applications\n- **Laravel Cloud**: Postgres with Neon integration for development branching\n- **Laravel Telescope**: Uses database for monitoring; ensure Telescope-specific database has adequate IOPS

## Performance Considerations

- Aurora Serverless v2 scaling: adds 1 ACU per 30 seconds; scale-out latency of 30-120 seconds under load spikes\n- RDS Provisioned: fixed performance; no scaling delay but no ability to handle unexpected bursts\n- Neon branching: zero performance impact on parent database; branches share storage until writes occur\n- Graviton RDS instances: 20% better price-performance than x86

## Production Considerations

- Aurora: configure minimum ACU to handle baseline load; maximum ACU for peak\n- RDS: enable Performance Insights for query-level cost analysis; identify expensive queries via top SQL\n- Backup retention: 7-35 days for point-in-time recovery; additional storage cost for backups\n- Multi-AZ failover: ~30-60 seconds for Aurora; applications should implement retry logic\n- Neon: production not recommended for primary workloads as of 2026; best for dev/staging

## Failure Modes

- Aurora Serverless scaling lag: sudden traffic spike exceeds ACU scaling rate; connection queuing\n- Storage auto-scaling limit: Aurora storage auto-scales to 128TB but has write limit based on instance size\n- RDS storage full: set CloudWatch alarm at 80% storage; consider storage auto-scaling\n- Read replica lag: replicas can lag 1-10 seconds for write-heavy workloads; route sensitive queries to primary

## Architectural Decisions

- Aurora Serverless v2 vs provisioned: Serverless for variable workloads; provisioned for steady traffic\n- RDS Reserved vs on-demand: Reserved for baseline; on-demand for burst/flexible\n- Neon vs Aurora: Neon for development/staging (branching, pay-per-use); Aurora for production (HA, mature)\n- Single-AZ vs Multi-AZ: Multi-AZ doubles cost; essential for production, skip for dev/staging

## Tradeoffs

- **Aurora Serverless vs provisioned**: Auto-scaling (0.5-128 ACU) vs fixed capacity\n- **RDS Reserved vs on-demand**: Up to 66% discount vs 1-3 year commitment\n- **Neon branching vs traditional DB copies**: Instant clones (shared storage) vs hours to restore from backup\n- **Aurora vs RDS Standard**: +20% cost vs faster failover, auto-scaling, and 5x better read replica throughput

## Patterns

- Aurora Serverless v2: best for variable workloads; scales ACUs up/down based on CPU/connections\n- RDS Reserved Instances: baseline steady-state databases; 55-66% discount for 1-3 year commitment\n- Neon branching: preview environments via instant DB clones; ideal for CI/CD and staging databases\n- Aurora vs RDS Standard: Aurora is 20% more expensive but offers faster failover and better read replicas\n- Read replicas: offload read traffic to replicas; reduce primary instance size by 30-50%

## Internal Mechanics

Aurora Serverless v2 bills per ACU (Aurora Capacity Unit) per hour, ranging from 0.5 to 128 ACU per instance. Each ACU includes ~2GB memory and proportional CPU. RDS Reserved Instances offer up to 55% discount for 1-year and 66% for 3-year commitments. Neon's database branching creates instant copy-on-write clones that share storage until modified.

## Common Mistakes

- Using Aurora Serverless v2 for steady workloads where provisioned RDS with Reserved Instance is 66% cheaper\n- Not right-sizing RDS instances: over-provisioning by 2x doubles costs\n- Running dev/staging databases 24/7: use Neon branching or Aurora pause-to-zero\n- Not using Graviton database instances: 20% savings available for PostgreSQL/MySQL\n- Multi-AZ for non-production: doubles instance cost; skip for dev/staging

## Related Knowledge Units
- K06: Aurora Serverless v2 Pricing
- K07: Aurora Serverless v2 Breakeven
- K05: RDS Reserved Instances

## Research Notes
Aurora Platform v4 (announced April 2026) is a significant release that improves both performance and cost simultaneously Ã¢â‚¬â€ rare in database platforms. The upgrade is automatic for managed Aurora upgrades during maintenance windows. For v3 users, upgrading should be prioritized as it immediately reduces costs by 28% with no effort. The performance improvement (27%) may also allow right-sizing to smaller instance classes, yielding additional savings.

## Mental Models

- **Cost as a metric**: Treat cloud cost as a first-class operational metric alongside latency, error rate, and throughput. Track cost per request, cost per user, and cost per feature.
- **Provisioning vs. consumption**: Reserved capacity buys a discount in exchange for commitment. On-demand pays full price for flexibility. Choose based on workload predictability.
- **Waste as debt**: Over-provisioned resources, unused instances, and orphaned storage are cost debt that compounds monthly. Regular cost audits identify and eliminate waste.
- **Economies of scale**: Larger instances, savings plans, and reserved capacity reduce per-unit costs. Consolidate workloads to benefit from volume discounts.
