# Fargate Pricing Analysis

## Metadata
- **ID**: KU-24-FARGATE-PRICING
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Fargate Pricing Analysis
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
AWS Fargate bills per vCPU-hour and GB-hour for container tasks with a 1-minute minimum. A 1vCPU/2GB task costs ~$35.90/month (x86) or ~$26.15/month (ARM) running 24/7. Fargate carries a 20-40% premium over equivalent EC2 instances, which is the price of zero server management. ARM/Graviton Fargate saves 20% vs x86. Fargate Spot offers up to 70% discount for interruptible workers. ECS control plane is free vs EKS at $73/month per cluster.

## Core Concepts
- **vCPU pricing**: $0.04048/hour (x86), $0.03238/hour (ARM) in us-east-1
- **Memory pricing**: $0.004445/GB-hour (x86), $0.003556/GB-hour (ARM)
- **Minimum charge**: 1 minute per task start, billed per-second after
- **Fargate vs EC2 premium**: 20-40% more expensive than equivalent EC2 instances
- **No free tier**: Fargate charges from the first second
- **Ephemeral storage**: First 20GB per task free; $0.000111/GB-hour beyond that
- **ECS vs EKS**: ECS control plane is free; EKS costs $73/month per cluster

## When To Use
- Teams lacking DevOps capacity for EC2 server management
- Variable workloads where bin-packing overhead is acceptable
- Containerized Laravel apps that need isolation per task
- Combined with Fargate Spot for queue worker cost optimization
- When task count is under 50 (management overhead vs premium tradeoff favors Fargate)

## When NOT To Use
- Steady, predictable workloads at scale (50+ tasks) — EC2 is 20-40% cheaper
- Workloads needing SSH access, custom AMIs, or placement group control
- Tasks requiring >4 vCPU or >30GB memory per container (Fargate per-task limit)
- Maximum cost minimization for predictable workloads (Fargate premium always applies)

## Best Practices
- **Use ARM/Graviton for all Fargate tasks** unless x86 binaries are required (WHY: 20% cost reduction at identical performance; most Laravel container images work unchanged)
- **Right-size task memory**: Fargate charges for allocated memory, not used memory; reduce allocation where possible (WHY: a 2GB task that uses 500MB still pays for 2GB; monitor actual usage and reduce allocation to fit)
- **Combine Fargate with ECS Service Auto Scaling**: Use target tracking on CPU, memory, or ALB request count (WHY: auto-scaling prevents over-provisioning during low traffic; Fargate tasks scale down to 0 when not needed)
- **Use FireLens for log routing**: Avoid CloudWatch Logs cost spike by routing logs to S3 or OpenSearch (WHY: CloudWatch Logs ingest costs can exceed Fargate compute for verbose logging; FireLens provides cost-effective log routing)
- **Prefer ECS over EKS**: EKS $73/month cluster fee adds 20-100% to smaller Fargate deployments (WHY: for most Laravel apps, ECS provides equivalent functionality at zero cluster cost)

## Architecture Guidelines
- Use Fargate for containerized Laravel apps when team size < 5 DevOps engineers
- Combine Fargate with Compute Savings Plans for baseline (up to 66% off on-demand)
- Use Fargate Spot for all queue workers and batch processing tasks
- Distribute tasks across multiple AZs for high availability
- Use smaller, more tasks for variable traffic; fewer, larger tasks for steady traffic
- Monitor Fargate task-level resource utilization via CloudWatch Container Insights

## Performance Considerations
- Task startup: 30-120 seconds (image pull + init); use eager pull and smaller images
- CPU bursting: Fargate tasks can burst briefly; sustained high CPU requires proper task sizing
- Network throughput scales with task size; larger tasks get better network performance
- Graviton4 tasks offer up to 30% better performance than Graviton3 at same vCPU count
- Cross-AZ data transfer costs apply between Fargate tasks and RDS in different AZs

## Security Considerations
- Fargate tasks run in isolated AWS-managed infrastructure
- No SSH access to underlying hosts; reduces attack surface
- IAM task roles for least-privilege permissions
- Container images should be scanned for vulnerabilities before deployment
- Use AWS KMS for ECR image encryption at rest

## Common Mistakes
1. **Using Fargate for background workers without Spot**: Spot Fargate saves 50-70% for interruptible workloads (Cause: "Spot is unreliable" assumption; Consequence: paying 3-4x more for queue processing; Better: use Spot for all queue workers with On-Demand fallback)
2. **Over-allocating task memory**: Allocating 4GB when container uses 500MB (Cause: "give it room to grow" heuristic; Consequence: 8x higher memory cost than needed; Better: monitor actual memory usage and set allocation at P95 + 20% headroom)
3. **Running 24/7 Fargate tasks without scale-to-zero**: Tasks idle when no traffic (Cause: "keep warm for responsiveness"; Consequence: paying for idle compute; Better: use scheduled tasks or ECS Service Auto Scaling with min=0)
4. **Not factoring cross-AZ data transfer**: Fargate tasks in AZ-a communicating with RDS in AZ-b (Cause: colocation not enforced in deployment config; Consequence: $0.01/GB hidden data transfer costs; Better: ensure Fargate tasks and RDS are in the same AZ)

## Anti-Patterns
- **Task-per-PHP-worker**: Creating one Fargate task per PHP-FPM worker (max utilization but excessive overhead)
- **Always-on for dev/staging**: Fargate running 24/7 for non-production environments
- **EKS for single-service Fargate**: Paying $73/month EKS fee for one or two Fargate services

## Examples
- **Production web app**: 4 Fargate tasks (2 vCPU/4GB each) running Laravel Octane, ARM Graviton, Auto-scaling on CPU at 60%, min=2, max=10
- **Queue processing**: Fargate Spot tasks (1 vCPU/2GB each) with ECS Service Auto Scaling on SQS queue depth, min=1, max=20, 70% Spot + 30% On-Demand
- **Staging environment**: 1 Fargate task (1 vCPU/2GB), scheduled to run 8AM-8PM weekdays only

## Related Topics
- Fargate Spot Workers (ku-25)
- Lambda vs EC2 Breakeven (ku-23)
- Graviton Price-Performance (ku-26)
- Compute Savings Plans (ku-01)

## AI Agent Notes
- Default: use ARM/Graviton Fargate for all containerized Laravel workloads
- Default: use Fargate Spot for queue workers
- Right-size memory based on actual usage, not estimates
- Cross-AZ data transfer is a hidden cost; colocate resources in same AZ
- Fargate premium is worth it for teams lacking DevOps capacity
