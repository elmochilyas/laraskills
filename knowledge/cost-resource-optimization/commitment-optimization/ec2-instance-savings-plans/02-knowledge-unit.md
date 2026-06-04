# K02: EC2 Instance Savings Plans

## Metadata
- **ID**: K02
- **Subdomain**: Compute Commitment Optimization
- **Topic**: EC2 Instance Savings Plans
- **Source**: AWS Documentation, Finout (2026), Hyperglance (2026)
- **Reliability**: High

## Executive Summary
EC2 Instance Savings Plans offer up to 72% discount (vs 66% for Compute SPs) but lock you to a specific instance family in a specific region. They are optimal for teams with stable, predictable workloads that won't change instance family or region. The higher discount compensates for reduced flexibility. For Laravel apps sure to stay on the same instance type, this can save an additional 6% over Compute SPs.

## Core Concepts
- **Max savings**: Up to 72% vs On-Demand (3-year All Upfront)
- **Lock-in**: Instance family and region (e.g., all m7g in us-east-1)
- **Size flexibility**: Can change instance sizes within the family
- **vs Compute SP**: +6% max savings in exchange for less flexibility
- **Payment**: All Upfront, Partial Upfront, No Upfront

## Mental Models
- **Family discount**: Higher savings for committing to a specific "family" of instances
- **Bulk vs individual**: Like buying a case of one wine (cheaper) vs a mixed case (more expensive)

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
- K01: Compute Savings Plans
- K03: Spot Instances Strategy
- K04: Spot Interruption Costs

## Research Notes
EC2 Instance SPs are most valuable when: (1) Instance family is stable and known for 3 years, (2) You need maximum discount, (3) You're not planning to migrate to Graviton or different instance types. The risk is if you switch instance families Ã¢â‚¬â€ the SP becomes stranded (applies to zero usage). Combine with Compute SPs for a layered strategy: Compute SP for flexible workloads, EC2 Instance SP for known baseline.
