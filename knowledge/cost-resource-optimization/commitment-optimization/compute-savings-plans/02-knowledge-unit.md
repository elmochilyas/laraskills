# K01: Compute Savings Plans

## Metadata
- **ID**: K01
- **Subdomain**: Compute Commitment Optimization
- **Topic**: Compute Savings Plans
- **Source**: AWS Documentation, Holori (2026), CloudBurn (2026)
- **Reliability**: High

## Executive Summary
Compute Savings Plans offer up to 66% discount across EC2, Fargate, and Lambda with the highest flexibility among AWS commitment models. You commit to a $/hour spend for 1 or 3 years, and AWS automatically applies discounted rates to any eligible compute usage. Unlike Reserved Instances, there is no instance family, region, or OS lock-in. The flexibility makes Compute Savings Plans the default recommendation for most teams.

## Core Concepts
- **Max savings**: Up to 66% vs On-Demand (3-year All Upfront)
- **Coverage**: EC2 instances, Fargate, Lambda
- **Flexibility**: Applies to any instance family, region, OS, tenancy
- **Commitment**: $/hour, not specific resources
- **Term**: 1-year or 3-year
- **Payment**: All Upfront, Partial Upfront, No Upfront

## Mental Models
- **SP as compute budget**: You tell AWS "I'll spend at least $X/hour on compute" and get discounted rates on everything
- **Savings plan vs RI**: SPs are like a debit card (any compute works); RIs are like a gift card (specific store only)

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
- K02: EC2 Instance Savings Plans
- K03: Spot Instances Strategy
- K48: RDS Savings Plans

## Research Notes
Compute Savings Plans are the most flexible commitment model. The ~66% max discount requires 3-year All Upfront. Best practice: commit to 80-90% of minimum hourly usage (floor not ceiling). Monitor utilization monthly; if consistently >90%, increase commitment. There's no downside to starting small and increasing later. Compute SPs are preferred over RIs for most scenarios due to flexibility. The 7-day refund window allows correction of over-commitment.
