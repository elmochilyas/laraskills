# Aurora Serverless v2 Pricing

## Metadata
- **ID**: KU-06-AURORA-SERVERLESS-V2
- **Subdomain**: database-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Aurora Serverless v2 Pricing
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Aurora Serverless v2 costs $0.12/ACU-hour (Standard) or $0.156/ACU-hour (I/O-Optimized) with minimum capacity of 0.5 ACU (~$43/month minimum). Each ACU provides approximately 2GB memory with proportional CPU. While promising for variable workloads, the pricing model has pitfalls: minimum ACU settings, no RI equivalents, and the trap of setting min ACU too low causing buffer pool thrashing. For dev/test, setting min ACU to 0 enables auto-pause, dropping compute charges to zero.

## Core Concepts
- **ACU-hour**: $0.12 (Standard), $0.156 (I/O-Optimized) per ACU-hour in us-east-1
- **1 ACU**: ~2GB memory + proportional CPU + networking
- **Min capacity**: 0.5 ACU (~$43/month minimum if kept alive)
- **Auto-pause**: Set min 0 ACU for dev/test; compute drops to $0 when idle
- **No RI available**: Serverless v2 discounts only via On-Demand pricing
- **Scale speed**: Up/down in seconds, not minutes
- **I/O-Optimized**: 30% more expensive compute but eliminates per-I/O charges

## When To Use
- Variable workloads with >3:1 peak-to-trough ratio (Serverless v2's auto-scaling matches cost to usage)
- Dev/test databases: set min ACU to 0 for auto-pause; storage-only cost when idle
- Unpredictable traffic: Serverless v2 scales automatically without over-provisioning
- New deployments with unknown traffic patterns (avoids sizing mistakes)
- Hybrid: provisioned writer + Serverless v2 readers for read-heavy variable workloads

## When NOT To Use
- Steady workloads with <2:1 peak-to-trough (provisioned + RI is 20-60% cheaper)
- Workloads needing RI discounts (Serverless v2 has no commitment discount option)
- Maximum cost minimization for predictable workloads
- Write-heavy workloads with minimal read variation (benefit of auto-scaling is limited)
- Small deployments where RDS Proxy minimum 8 ACU charge (~$300/month) applies

## Best Practices
- **Set minimum ACU to 4+ for production**: Never use 0.5 ACU minimum for production databases (WHY: 0.5 ACU = 1GB memory; insufficient for any production working set; causes constant buffer pool thrashing, increasing I/O costs by 50-200%; 4 ACU minimum adds ~$86/month floor cost but prevents performance degradation)
- **Use auto-pause (min=0 ACU) for all dev/test instances**: Compute drops to $0 when idle (WHY: dev/test databases used intermittently; auto-pause saves 60-80% vs always-on; storage-only cost when idle; 0 ACU minimum is perfect for non-production)
- **Evaluate I/O-Optimized when I/O charges exceed 25% of compute**: Switch configuration at no downtime (WHY: Standard charges $0.20/M I/O requests; I/O-Optimized charges $0.156/ACU-hour with free I/O; breakeven occurs when I/O cost > ~25% of compute cost; Aurora allows switching at any time without downtime)
- **Monitor ServerlessDatabaseCapacity and ACUUtilization metrics**: Track scaling patterns (WHY: capacity metric shows actual ACU usage; ACUUtilization shows headroom; if capacity is consistently at minimum, you may be over-provisioned; if consistently at maximum, you're capped and may need higher max ACU setting)
- **Right-size min ACU by monitoring buffer pool hit ratio**: Target >95% hit rate (WHY: buffer pool hit ratio directly indicates whether working set fits in memory; <95% hit rate means too many I/O requests; increase min ACU until hit rate exceeds 95%; each ACU adds ~2GB buffer pool)

## Architecture Guidelines
- Provisioned + RI for steady workloads; Serverless v2 for variable
- Min ACU = working set size ÷ 2GB (buffer pool size per ACU)
- Max ACU = peak traffic capacity + 20% headroom
- For RDS Proxy with Serverless v2: factor minimum 8 ACU charge (~$300/month)
- Use Aurora Standard for dev/test; I/O-Optimized for production with high I/O
- Upgrade to Aurora Platform v4 for 28% cost reduction (immediate, free, no code changes)

## Performance Considerations
- Scale-up: near-instant (seconds); scale-down: slower (minutes)
- Buffer pool hit ratio drops if min ACU is too low → increased I/O charges
- No cold starts: Serverless v2 is always warm at configured minimum
- Connection pooling recommended (RDS Proxy or PgBouncer)
- Aurora v4: 27% faster queries, 28% lower cost vs v3

## Security Considerations
- Same encryption, IAM, and network security as provisioned Aurora
- IAM database authentication supported
- RDS Proxy for connection management with IAM auth
- Audit logs via Aurora Advanced Auditing
- Encryption at rest with AWS KMS (same as provisioned)

## Common Mistakes
1. **Setting min ACU to 0.5 for production**: Buffer pool thrashing causes 50-200% higher I/O costs (Cause: "minimum is cheapest"; Consequence: I/O performance degrades, queries slow down, costs increase; Better: minimum 4 ACU for any production workload)
2. **Not auto-pausing dev/test instances**: Running 24/7 when used 8 hours/day (Cause: "keep warm for responsiveness"; Consequence: paying ~$43/month minimum for idle databases; Better: set min=0 ACU, auto-pause; 500ms wake time is acceptable for non-production)
3. **Choosing Serverless v2 for steady workloads**: Provisioned + RI is 20-60% cheaper (Cause: "serverless is always cheaper" misconception; Consequence: paying 2-3x more for steady workload; Better: evaluate peak-to-trough ratio; <2:1 = provisioned wins)
4. **Ignoring the minimum ACU charge when comparing costs**: 0.5 ACU minimum = $43/month even at idle (Cause: focusing on per-ACU-hour rate; Consequence: comparing $0.12/hour to provisioned $0.26/hour and missing minimum floor; Better: include minimum ACU charge in all cost comparisons)

## Anti-Patterns
- **Min ACU = 0.5 in production**: Guaranteed buffer pool thrashing
- **Serverless v2 + RDS Proxy without cost analysis**: Combined minimum = 8.5 ACU
- **No max ACU limit**: Unbounded scaling can create surprise bills
- **Serverless v2 for write-heavy workloads**: Auto-scaling primarily benefits reads

## Examples
- **Variable production**: 8 ACU peak, 4 ACU min (working set = 8GB), 2 ACU trough night; cost = $0.48-0.96/hour
- **Dev/test with auto-pause**: min=0, max=2 ACU; compute cost = $0 when idle, ~$0.24/hour when active
- **Hybrid**: Provisioned db.r7g.large writer + 2-8 ACU Serverless v2 readers = best of both worlds

## Related Topics
- Aurora Serverless v2 Breakeven (ku-07)
- Aurora Platform v4 (ku-09)
- RDS Reserved Instances (ku-05)
- RDS Proxy Pricing (ku-34)

## AI Agent Notes
- Default: min ACU = 4 for production (not 0.5!)
- Default: auto-pause (min=0) for dev/test
- Monitor buffer pool hit ratio >95% for right-sizing
- Evaluate I/O-Optimized when I/O > 25% of compute
- Serverless v2 has no RI — provisioned + RI wins for steady workloads <2:1 ratio
