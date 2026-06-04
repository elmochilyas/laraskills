# Spot Interruption Costs

## Metadata
- **ID**: KU-07-SPOT-INTERRUPTION-COSTS
- **Subdomain**: compute-commitment-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Spot Interruption Costs
- **Version**: 1.0
- **Classification**: Speculative
- **Maturity**: Medium

## Overview
LeanOps 2026 research found that 41% of Spot workloads lose money after factoring interruption recovery costs. The savings from Spot pricing (up to 90%) are offset by: (1) re-execution of interrupted work, (2) additional compute for recovery/checkpointing, (3) engineering time managing Spot complexity, (4) higher On-Demand usage during fallback. Spot is not automatically cost-effective — it requires workload-specific analysis to determine if the discount compensates for interruption overhead.

## Core Concepts
- **41% failure rate**: 41% of Spot workloads have negative net ROI (LeanOps 2026)
- **Recovery costs**: Re-execution of interrupted jobs, checkpointing writes, data transfer
- **Fallback costs**: On-Demand usage when Spot capacity unavailable
- **Engineering overhead**: Automation, monitoring, graceful shutdown handling
- **Success factors**: Short jobs (<5 min), stateless design, checkpointing, diversified pools
- **Net savings formula**: Gross Spot savings - (Recovery costs + Fallback costs + Engineering overhead)

## When To Use
- Spot interruption analysis: Before committing to Spot at scale (>20% of fleet)
- Short jobs (<5 min): Low recovery cost on interruption — almost always net positive
- Stateless workers with retry: SQS consumers, CI/CD runners — negligible recovery cost
- Diversified Spot pools (3+ types, 2+ AZs): Lower interruption rate, higher net savings
- Fargate Spot: Less recovery overhead (container orchestration handles restart)

## When NOT To Use
- Long-running jobs without checkpointing: High recovery cost may exceed Spot savings
- Stateful processing: Recovery cost includes data reconstruction, not just re-execution
- Single-pool Spot: Higher interruption rate increases recovery costs
- Time-critical workloads: Interruption delay may cause business cost exceeding compute savings
- Minimal engineering bandwidth: Spot optimization requires ongoing attention

## Best Practices
- **Calculate net Spot savings before scaling**: Track gross savings and recovery costs for 30 days (WHY: gross Spot savings (70-90% of On-Demand) is visible in billing; recovery costs (re-execution compute, fallback On-Demand, engineering time) are hidden; 30-day measurement reveals true net savings)
- **Prioritize Spot for short-lived stateless jobs**: Jobs <5 minutes have near-zero recovery cost (WHY: a job interrupted at 4 minutes loses 4 minutes of work vs a job interrupted at 4 hours loses 4 hours; short jobs restart quickly; mean time to recovery is proportional to job length)
- **Implement checkpointing for jobs >5 minutes**: Save progress at regular intervals (WHY: checkpointing limits recovery cost to work done since last checkpoint; reduces worst-case recovery from full job length to checkpoint interval; DynamoDB or S3 for checkpoint state)
- **Use capacity-rebalancing for proactive replacement**: Replaces instances before interruption (WHY: AWS sends rebalance recommendation 2+ minutes before termination; capacity-rebalancing proactively launches replacement instances in different capacity pools; reduces fallback to On-Demand)
- **Monitor Spot interruption rate per pool**: Track interruption frequency by instance type (WHY: some instance types have higher interruption rates (e.g., g-series GPU instances) than others (r-series, t-series); high-interruption pools may have negative net savings; switch to lower-interruption types)

## Architecture Guidelines
- Start with 20% of workers on Spot, measure net savings over 30 days, scale up if positive
- Use mixed instances ASG with On-Demand fallback (avoids forced On-Demand at peak Spot prices)
- Implement Spot termination handling: SIGTERM → stop accepting work → finish current → checkpoint
- For Laravel Horizon: Spot interruption causes job timeout → Horizon retries → no data loss
- Track "Spot savings realized" vs "On-Demand fallback cost" in Cost Explorer

## Performance Considerations
- Spot recovery cost is measured in compute time, not user-facing latency
- For queue workers, recovery cost is ~1 job timeout (typically 60 seconds for Laravel Horizon)
- CI/CD recovery cost = full pipeline re-run (5-30 minutes depending on pipeline)
- Web server recovery cost is highest (dropped connections, session loss, cache rebuild)
- Fargate Spot recovery cost is minimal (containers restart in seconds)

## Security Considerations
- Interruption handling code must handle SIGTERM securely (no credential leakage on shutdown)
- Checkpoint state must be stored securely (S3 server-side encryption, DynamoDB encryption at rest)
- Fallback to On-Demand should preserve same security group and IAM boundaries
- Monitor Spot termination notification access (instance metadata endpoint)

## Common Mistakes
1. **Assuming Spot is always cheaper**: Ignoring recovery costs in net savings calculation (Cause: focusing on gross discount percentage; Consequence: negative net ROI on 41% of workloads; Better: calculate net savings including recovery overhead)
2. **No checkpointing for long-running jobs**: Losing hours of work per interruption (Cause: treating Spot like On-Demand; Consequence: recovery cost may exceed Spot savings; Better: checkpoint every 5 minutes or use short jobs)
3. **Single-pool Spot without fallback**: All instances in one type/AZ; high interruption rate (Cause: simplest configuration; Consequence: frequent total capacity loss; Better: diversify 3+ types, 2+ AZs, On-Demand fallback)

## Anti-Patterns
- **Spot for everything without analysis**: Blind Spot adoption without workload-specific cost modeling
- **No Spot interruption monitoring**: Cannot calculate net savings without interruption tracking
- **Ignoring engineering overhead**: Spot complexity requires automation and monitoring investment
- **Long-running stateful jobs on Spot**: Maximum recovery cost, minimum net savings

## Examples
- **Net positive**: Laravel queue workers (100% Spot). Average job: 30 seconds. Interruption rate: 5%/hr. Recovery cost: 1-2 job retries per interruption. Gross savings: $3,000/month. Net savings: $2,900/month (97% of gross).
- **Net negative**: Data processing pipeline, 2-hour jobs, no checkpointing. Spot savings: $2,000/month. Interrupted jobs: 8/month (16 hours wasted compute). Recovery re-runs: 16 hours On-Demand. Net savings: -$400/month.

## Related Topics
- Spot Instances Strategy (ku-06)
- Compute Savings Plans (ku-04)
- Fargate Spot Workers (ku-25)
- Queue Worker Scaling (ku-10)

## AI Agent Notes
- Default: check net savings before scaling Spot beyond 20% of fleet
- Short-lived stateless jobs (<5 min) are almost always net positive
- Implement checkpointing for jobs >5 minutes
- 41% of Spot workloads lose money — analyze before blind adoption
- For Laravel queue workers: generally net positive due to short job duration

## Verification
- [ ] Net Spot savings calculated (gross - recovery - fallback - engineering)
- [ ] 30-day measurement period completed before scaling Spot
- [ ] Checkpointing implemented for jobs >5 minutes
- [ ] Spot interruption rate monitored per pool
- [ ] On-Demand fallback cost tracked in Cost Explorer
- [ ] Engineering overhead for Spot management included in cost model
