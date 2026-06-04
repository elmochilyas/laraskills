# K24: Fargate Pricing Analysis

## Metadata
- **ID**: K24
- **Subdomain**: Compute Optimization
- **Topic**: Fargate Pricing Analysis
- **Source**: AWS Documentation, Wring Blog (March 2026), CloudZero (2026)
- **Reliability**: High

## Executive Summary
AWS Fargate bills per vCPU-hour and GB-hour for container tasks with a 1-minute minimum. A 1vCPU/2GB task costs ~$35.90/month (x86) or ~$26.15/month (ARM) running 24/7. Fargate's 20-40% premium over EC2 is the price of zero server management. ARM/Graviton Fargate saves 20% vs x86. Fargate Spot offers up to 70% discount for interruptible workers. ECS control plane is free vs EKS at $73/month per cluster.

## Core Concepts
- **vCPU pricing**: $0.04048/hour (x86), $0.03238/hour (ARM) in us-east-1
- **Memory pricing**: $0.004445/GB-hour (x86), $0.003556/GB-hour (ARM)
- **Minimum charge**: 1 minute per task start, billed per-second after
- **Fargate vs EC2 premium**: 20-40% more expensive than equivalent EC2 instances
- **No free tier**: Fargate charges from the first second
- **Ephemeral storage**: First 20GB per task free; $0.000111/GB-hour beyond that

## Mental Models
- **Hotel vs apartment**: Fargate is a hotel (pay per night, room service included); EC2 is an apartment (cheaper but you maintain)
- **Serverless containers**: Not truly serverless (you pay for allocated resources continuously) but removes OS management
- **Task as primitive**: Unlike EC2 where instances are shared, each Fargate task is an isolated billing unit

## Internal Mechanics
Fargate pricing covers: CPU allocation (vCPUs), memory allocation (GB), and ephemeral storage (first 20GB free). It does NOT cover: data transfer (standard AWS rates), container image storage (ECR separate), or any additional AWS services (ALB, CloudWatch, etc.). ECS control plane is free. Fargate tasks use AWS-managed infrastructure — you cannot SSH into the underlying host.

## Patterns
- **Bin-packing overhead**: Multiple small Fargate tasks cost more than a single larger task due to per-task minimums
- **Fargate Spot**: Up to 70% discount; use for queue workers, batch jobs, CI/CD runners
- **Savings Plans**: Compute Savings Plans cover Fargate (up to 66% off with 3-year commitment)
- **Graviton migration**: ARM tasks cost 20% less than x86 equivalent; most container images work unchanged

## Architectural Decisions
- Choose Fargate over EC2 when: team lacks DevOps capacity, workload is variable, task count < 50
- Choose Fargate over Lambda when: execution > 15 minutes, need persistent connections, steady traffic
- Use ARM/Graviton for all Fargate tasks unless x86 binaries required
- Fargate limits: max 4 vCPU and 30GB memory per task (EC2 has no per-task limit)

## Tradeoffs
- **Fargate premium vs EC2 management cost**: At 50+ tasks, EC2 management overhead may exceed the 20-40% premium
- **Per-task billing vs instance bin-packing**: EC2 allows mixing workloads on one instance; Fargate charges per task
- **Simplified operations vs limited control**: No SSH access, no custom AMIs, no placement group control

## Performance Considerations
- Task startup: 30-120 seconds (image pull + init); use eager pull, smaller images, and Fargate startup boost
- CPU bursting: Fargate tasks can burst briefly; sustained high CPU requires proper task sizing
- Network throughput scales with task size; larger tasks get better network performance
- Graviton4 tasks offer up to 30% better performance than Graviton3 at same vCPU count

## Production Considerations
- Use CloudWatch Container Insights for cost allocation per service
- Set task-level resource limits to avoid over-provisioning (Start asking: "does this container really need 4GB?")
- Combine Fargate with ECS Service Auto Scaling: use target tracking (CPU, memory, or ALB request count)
- Configure log driver to avoid CloudWatch Logs cost spike (use firelens for cost-effective log routing)

## Common Mistakes
- Using Fargate for background workers without Spot — Spot Fargate saves 50-70% for interruptible workloads
- Over-allocating task memory — Fargate charges for allocated memory, not used memory
- Running 24/7 Fargate tasks that should use Scale-to-Zero or scheduled tasks
- Not factoring data transfer costs between Fargate tasks and RDS across AZs

## Failure Modes
- Pricing shock from always-on Fargate tasks that should use Spot or scale-to-zero
- Task launch failures during scale-up due to image pull time (large images cause slow scaling)
- Cross-AZ data transfer costs unaccounted when ALB and tasks are in different AZs
- Fargate Spot capacity not available during high-demand periods

## Ecosystem Usage
- **Laravel Cloud**: Built on Fargate containers; auto-hibernation reduces cost for low-traffic apps
- **Laravel Forge + ECS**: Hybrid approach managing Fargate tasks via Forge UI
- **FrankenPHP on Fargate**: Octane workers running in Fargate tasks with auto-scaling
- **Laravel Horizon on Fargate**: Queue workers with Spot for cost optimization

## Related Knowledge Units
- K22: Lambda Pricing Breakdown
- K23: Lambda vs EC2 Breakeven
- K25: Fargate Spot Workers
- K26: Graviton Price-Performance
- K27: Laravel Cloud vs Vapor

## Research Notes
Fargate pricing decreased ~15% since 2023 with ARM support and improved bin-packing efficiency. ECS control plane remains free vs EKS $73/month. The 2026 trend favors Fargate for new containerized Laravel deployments due to reduced operational burden and competitive pricing with Compute Savings Plans. Fargate ecosystem grew significantly with Graviton4 support.
