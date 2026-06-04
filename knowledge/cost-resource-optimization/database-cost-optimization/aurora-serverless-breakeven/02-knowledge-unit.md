# K07: Aurora Serverless v2 Breakeven

## Metadata
- **ID**: K07
- **Subdomain**: Database Cost Optimization
- **Topic**: Aurora Serverless v2 Breakeven
- **Source**: Industry Analysis, Wring Blog (2026)
- **Reliability**: Medium-High

## Executive Summary
Aurora Serverless v2 breaks even with provisioned Aurora at approximately a 3:1 peak-to-trough ratio. Below this ratio, provisioned instances with Reserved Instances are cheaper; above it, Serverless v2's pay-per-use model wins. The breakeven shifts with RI coverage: with 3-year RIs, provisioned is 60% cheaper per compute-hour, requiring even higher peak-to-trough ratios for Serverless v2 to compete.

## Core Concepts
- **Breakeven ratio**: ~3:1 peak-to-trough traffic variation
- **RI impact**: Provisioned with 3-year RI is ~$0.10/ACU-equivalent vs Serverless v2 $0.12/ACU-hour (20% cheaper)
- **On-Demand comparison**: Provisioned On-Demand is ~$0.26/hour (r6g.large 8GB) vs Serverless v2 $0.12/ACU-hour (2GB)
- **ACU to instance mapping**: 4 ACUs (~8GB) Ã¢â€°Ë† r6g.large (8GB)

## Mental Models
- **Breakeven as seesaw**: One side is traffic variation, the other is commitment discount
- **Floor commitment**: Serverless v2 costs stop at the floor; provisioned costs are fixed regardless of usage

## Internal Mechanics
Serverless v2 at 4 ACU (8GB, similar to r6g.large): $0.12 Ãƒâ€” 4 = $0.48/hour. r6g.large On-Demand: $0.26/hour. RI: $0.10/hour. Serverless v2 is 85% more expensive than RI provisioned at equivalent compute. But if workload varies 3:1 (4 ACU peak, 1 ACU trough), average cost = (peak$ + trough$) / 2. At 3:1 ratio, avg Serverless v2 = $0.30/hour vs RI provisioned $0.10/hour Ã¢â‚¬â€ still more expensive. Actual breakeven is higher than 3:1 when factoring RI discounts.

## Patterns
- **Highly variable (>5:1)**: Serverless v2 wins regardless of RI comparison
- **Moderately variable (2:1 to 5:1)**: Depends on RI coverage; compute with both
- **Steady (<2:1)**: Provisioned with RI always cheaper

## Architectural Decisions
- Run cost model with your actual traffic pattern before choosing
- Consider hybrid: provisioned writer for steady base, Serverless v2 readers for variable reads
- The 3:1 ratio is the breakeven for on-demand vs on-demand; with RI, threshold is ~5:1

## Tradeoffs
- **Predictable cost (provisioned) vs usage-matched cost (Serverless v2)**
- **Minimum charges**: Serverless v2 has a floor cost even at idle; provisioned has a fixed cost always

## Common Mistakes
- Comparing Serverless v2 On-Demand to provisioned On-Demand without factoring RI discounts
- Not modeling the actual peak-to-trough ratio over a 90-day period
- Ignoring that minimum ACU charge sets a floor on Serverless v2 savings

## Ecosystem Usage

- **Laravel Forge**: Supports Aurora and RDS provisioning via UI; manages database user creation and SSL\n- **Laravel Vapor**: Aurora Serverless v2 is the default database option for Vapor-deployed applications\n- **Laravel Cloud**: Postgres with Neon integration for development branching\n- **Laravel Telescope**: Uses database for monitoring; ensure Telescope-specific database has adequate IOPS

## Performance Considerations

- Aurora Serverless v2 scaling: adds 1 ACU per 30 seconds; scale-out latency of 30-120 seconds under load spikes\n- RDS Provisioned: fixed performance; no scaling delay but no ability to handle unexpected bursts\n- Neon branching: zero performance impact on parent database; branches share storage until writes occur\n- Graviton RDS instances: 20% better price-performance than x86

## Production Considerations

- Aurora: configure minimum ACU to handle baseline load; maximum ACU for peak\n- RDS: enable Performance Insights for query-level cost analysis; identify expensive queries via top SQL\n- Backup retention: 7-35 days for point-in-time recovery; additional storage cost for backups\n- Multi-AZ failover: ~30-60 seconds for Aurora; applications should implement retry logic\n- Neon: production not recommended for primary workloads as of 2026; best for dev/staging

## Failure Modes

- Aurora Serverless scaling lag: sudden traffic spike exceeds ACU scaling rate; connection queuing\n- Storage auto-scaling limit: Aurora storage auto-scales to 128TB but has write limit based on instance size\n- RDS storage full: set CloudWatch alarm at 80% storage; consider storage auto-scaling\n- Read replica lag: replicas can lag 1-10 seconds for write-heavy workloads; route sensitive queries to primary

## Related Knowledge Units
- K06: Aurora Serverless v2 Pricing
- K05: RDS Reserved Instances
- K48: RDS Savings Plans

## Research Notes
The 3:1 breakeven ratio emerged from community analysis (Ian Binder's detailed comparison). The actual ratio varies by region, instance family, and RI/SP coverage. AWS recommends Serverless v2 for truly variable workloads, not for marginal variation. For most Laravel applications with predictable daily patterns, provisioned Aurora with RI is the cost-effective choice.
