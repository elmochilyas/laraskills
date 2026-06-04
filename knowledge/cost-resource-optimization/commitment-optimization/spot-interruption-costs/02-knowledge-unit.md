# K04: Spot Interruption Costs

## Metadata
- **ID**: K04
- **Subdomain**: Compute Commitment Optimization
- **Topic**: Spot Interruption Costs
- **Source**: LeanOps Research (May 2026)
- **Reliability**: Medium

## Executive Summary
LeanOps 2026 research found that 41% of Spot workloads lose money after factoring interruption recovery costs. The savings from Spot pricing (up to 90%) are offset by: (1) re-execution of interrupted work, (2) additional compute for recovery/checkpointing, (3) engineering time managing Spot complexity, (4) higher On-Demand usage during fallback. Spot is not automatically cost-effective Ã¢â‚¬â€ it requires workload-specific analysis to determine if the discount compensates for interruption overhead.

## Core Concepts
- **41% failure rate**: 41% of Spot workloads have negative net ROI
- **Recovery costs**: Re-execution, checkpointing, data transfer for interrupted tasks
- **Fallback costs**: On-Demand usage when Spot unavailable
- **Engineering overhead**: Automation, monitoring, and handling Spot complexity
- **Success factors**: Short-running jobs (<5 min), stateless design, checkpointing

## Mental Models
- **Spot as lottery**: Sometimes you win (90% off), sometimes you lose (interruption costs exceed savings)
- **Hidden cost iceberg**: The 90% discount is visible; recovery costs are below the waterline

## Ecosystem Usage

- **Laravel Cloud**: Built on Fargate with Graviton by default; auto-hibernation reduces costs for low-traffic apps\n- **Laravel Forge**: Forge provisions EC2 instances; use Graviton (t4g) and right-size before Savings Plans\n- **Laravel Vapor**: Runs on Lambda behind CloudFront; Vapor's cost model is pay-per-invocation, separate from EC2 planning\n- **Queue workers**: Laravel Horizon on Spot instances for 60-90% cost reduction on queue processing

## Performance Considerations

- Savings Plans do not affect performance; they are purely billing mechanism applied to existing usage\n- Spot instances are identical hardware; no performance difference from on-demand\n- Spot interruption: handle gracefully with checkpoints, drain timeout, and fallback to on-demand\n- EC2 Instance Savings Plans: can upgrade to newer generation instances within same family at same discount

## Production Considerations

- Right-size instances before purchasing Savings Plans: monitor CloudWatch metrics for 2-4 weeks\n- Start with 1-year partial commitment (50% of expected usage) to build confidence\n- Use Savings Plans recommendations in AWS Cost Explorer for data-driven commit amounts\n- Combine Savings Plans (baseline) + Spot (flexible) + Auto Scaling to optimize cost across the board\n- Monitor unused commitment in Savings Plans dashboard; adjust next purchase accordingly

## Failure Modes

- Spot capacity insufficient during high-demand periods: primary instance types unavailable; diversify across types\n- Interruption wave: multiple Spot instances terminated simultaneously; ensure ASG can launch on-demand replacements\n- Savings Plans expire without renewal: usage reverts to on-demand pricing; set up expiration notifications 30 days before\n- Reservation misalignment: purchased Savings Plans for wrong region/family; AWS allows limited modification

## Architectural Decisions

- Compute Savings Plans vs EC2 Instance Savings Plans: choose Compute for multi-service coverage, EC2 for maximum savings\n- 1-year vs 3-year commitment: 3-year doubles savings but reduces flexibility; choose 1-year first\n- Spot for queue workers, staging environments, CI/CD; on-demand for production web servers\n- Fargate Spot for containerized workloads: 50-70% discount for interruptible ECS/EKS tasks

## Tradeoffs

- **Savings Plans vs on-demand**: 30-66% savings vs 1-3 year commitment and usage minimum\n- **Spot vs on-demand**: 60-90% cheaper vs 2-minute interruption notice and potential capacity gaps\n- **Compute vs Instance SP**: Compute covers more services; Instance SP offers deeper discount for specific families\n- **1-year vs 3-year**: 3-year nearly doubles savings but locks you in; consider cloud cost trajectory

## Patterns

- Compute Savings Plans: best flexibility (covers EC2, Fargate, Lambda), ~30-60% savings\n- EC2 Instance Savings Plans: highest savings (up to 72%) but locked to instance family in a region\n- Spot Instances: 60-90% discount for fault-tolerant, interruptible workloads (queue workers, CI/CD, batch)\n- Spot Fleet + mixed instances: diversify across instance types to reduce interruption risk\n- Savings Plans + Spot combination: commit to Savings Plans for baseline, use Spot for peak/overflow

## Internal Mechanics

Compute Savings Plans apply to EC2, Fargate, and Lambda usage across any region, instance family, or OS. 1-year plans offer ~30% savings vs on-demand; 3-year plans offer ~60-66%. Payments are per-hour commitment (e.g., /hour) that covers usage up to that amount; usage beyond commitment is billed at on-demand rates. Spot Instances offer 60-90% discount but can be interrupted with 2-minute notice.

## Common Mistakes

- Purchasing too much commitment: unused Savings Plans expire; start with partial coverage and increase\n- Not right-sizing first: buying Savings Plans based on unused capacity rather than needed capacity\n- Ignoring Spot for interruptible workloads: queue workers, batch jobs, CI/CD run perfectly on Spot\n- Not configuring interruption handling: Spot termination requires drain timeout and fallback strategy\n- Purchasing 3-year with short-term visibility: commit to 1-year if cloud strategy may change

## Related Knowledge Units
- K03: Spot Instances Strategy
- K25: Fargate Spot Workers
- K01: Compute Savings Plans

## Research Notes
The 41% figure is from LeanOps 2026 research. Success predictors: (1) Jobs <5 minutes duration, (2) Built-in checkpointing/resumption, (3) Diversified Spot instances (4+ types), (4) Automated fallback to On-Demand. For Laravel queue workers with Horizon (which handles job retries and timeouts), Spot is generally net-positive. For long-running data processing jobs without checkpointing, Spot is risky. Recommendation: Start with 20% of workers on Spot, measure net savings over 30 days, scale up if positive.
