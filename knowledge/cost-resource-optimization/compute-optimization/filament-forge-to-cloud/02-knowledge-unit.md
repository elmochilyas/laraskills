# K39: Filament Forge to Cloud Cost Reduction

## Metadata
- **ID**: K39
- **Subdomain**: Compute Optimization
- **Topic**: Filament Forge to Cloud Migration
- **Source**: Laravel Blog (2026)
- **Reliability**: Medium

## Executive Summary
Filament (the Laravel admin panel framework) migrated from Forge (EC2) to Laravel Cloud (Fargate) and achieved 3x faster requests and 4x smaller replica footprint. The cost reduction came from Octane's throughput gains combined with Cloud's auto-scaling and auto-hibernation. This case study illustrates the compounding effect of platform + runtime optimization Ã¢â‚¬â€ the 4x replica reduction translated directly to 75% lower compute costs.

## Core Concepts
- **Before**: Forge on EC2 with PHP-FPM; 8-12 replicas to handle traffic
- **After**: Laravel Cloud with Octane (FrankenPHP); 2-3 replicas
- **3x speedup**: Octane's in-memory lifecycle eliminated per-request bootstrap
- **4x replica reduction**: Each replica handles 4x throughput, reducing total compute by 75%
- **Compound effect**: Octane (3-10x throughput) Ãƒâ€” Graviton (20% cheaper) Ãƒâ€” Auto-scaling (right-sized)

## Ecosystem Usage

- **Laravel Cloud**: Fargate-based with auto-hibernation; ideal for low-traffic applications\n- **Laravel Forge**: EC2 and VPS management with Graviton support via t4g instances\n- **Laravel Vapor**: Lambda-based deployment; each HTTP request generates 9+ Lambda invocations\n- **Bref PHP runtime**: Open-source PHP on Lambda for custom Laravel deployments

## Performance Considerations

- Graviton3/4: 30-40% better performance than Graviton2 at same vCPU count\n- Fargate tasks: 30-120s startup time (image pull + init); use smaller images and eager pull\n- Lambda: memory allocation directly impacts CPU; 1769MB = 1 full vCPU\n- EC2: dedicated instances (no noise neighbors) vs default (shared) for consistent performance

## Production Considerations

- Right-size instances using 4-week CloudWatch utilization data before committing to Savings Plans\n- Enable detailed billing and tag all resources for cost allocation per environment/team\n- Set budgets and alerts for unexpected cost spikes (AWS Budgets, Cost Anomaly Detection)\n- Use Compute Savings Plans for multi-service coverage; start with partial commitment\n- Implement auto-scaling for production workloads; over-provision by 20% for safety margin

## Failure Modes

- Instance type unavailable in AZ during scale-up: configure multiple AZs and instance types in ASG\n- Spot interruption during peak: Spot capacity reclaimed; ensure ASG launches on-demand as fallback\n- Savings Plans expiration: usage reverts to on-demand; set 30-day pre-expiry alerts\n- Compute cost spike from un-monitored auto-scaling events: set scaling cooldowns and usage limits

## Architectural Decisions

- Choose Graviton for all new compute: 20-40% better price-performance; PHP/Laravel has excellent ARM support\n- Fargate for variable workloads where server management cost is high; EC2 for steady high-utilization workloads\n- Lambda for spiky workloads that scale to zero; EC2/Fargate for predictable steady traffic\n- Savings Plans before Reserved Instances: Compute Savings Plans cover most services with better flexibility

## Tradeoffs

- **Graviton vs x86**: 20-34% cheaper vs rare binary compatibility issues (check PHP extensions)\n- **Fargate vs EC2**: 20-40% premium vs zero server management; Evaluate at 50+ tasks\n- **Lambda vs EC2**: Pay-per-use (ideal for spiky) vs flat-rate (cheaper for steady 24/7)\n- **Spot vs on-demand**: 60-90% cheaper vs interruption risk and 2-minute termination notice

## Patterns

- Rightsizing methodology: monitor CPU/memory utilization for 2-4 weeks, downsize underutilized instances\n- Graviton migration: switch from x86 to ARM for immediate 20-34% cost reduction, zero code changes for PHP\n- Fargate vs EC2 comparison: Fargate 20-40% premium over EC2 is cost of zero server management\n- Lambda vs EC2 breakeven: Lambda wins for spiky workloads scaling to zero; steady traffic favors EC2/Fargate\n- Spot + Savings Plans combo: Savings Plans for baseline, Spot for peak/overflow for maximum savings

## Internal Mechanics

AWS compute pricing is driven by instance family, size, purchase option (on-demand, reserved, spot), and region. EC2 bills per-second with 1-minute minimum. Fargate bills per vCPU-hour and GB-hour. Lambda bills per request and GB-second. Graviton (ARM) offers 20-40% better price-performance than x86.

## Common Mistakes

- Not migrating to Graviton (leaving 20-34% savings on table)\n- Over-provisioning instances without monitoring utilization data\n- Using on-demand exclusively without Savings Plans or Spot mix\n- Not factoring data transfer costs (cross-AZ, NAT Gateway) into compute decisions\n- Ignoring Fargate Spot for containerized queue workers (50-70% savings available)

## Related Knowledge Units
- K38: Laravel Octane Throughput
- K27: Laravel Cloud vs Vapor
- K40: PyleSoft Cost Reduction

## Research Notes
Filament's case study demonstrates that compute optimization is rarely a single change Ã¢â‚¬â€ it's the combination of runtime (Octane) + platform (Cloud/Fargate) + configuration (auto-scaling). The 4x replica reduction validates Octane's throughput claims in production. Key insight: fewer, larger instances often beat many small ones for Laravel workloads.

## Mental Models

- **Cost as a metric**: Treat cloud cost as a first-class operational metric alongside latency, error rate, and throughput. Track cost per request, cost per user, and cost per feature.
- **Provisioning vs. consumption**: Reserved capacity buys a discount in exchange for commitment. On-demand pays full price for flexibility. Choose based on workload predictability.
- **Waste as debt**: Over-provisioned resources, unused instances, and orphaned storage are cost debt that compounds monthly. Regular cost audits identify and eliminate waste.
- **Economies of scale**: Larger instances, savings plans, and reserved capacity reduce per-unit costs. Consolidate workloads to benefit from volume discounts.
