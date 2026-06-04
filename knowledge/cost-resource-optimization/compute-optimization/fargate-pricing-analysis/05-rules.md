## Use ARM/Graviton for All Fargate Tasks
---
## Cost Optimization
---
Always select ARM/Graviton architecture for Fargate tasks; never default to x86.
---
ARM Fargate provides 20% cost reduction at identical performance; most Laravel container images work unchanged on ARM.
---
ECS task definition: `cpuArchitecture: ARM64`, same container image, 20% lower cost.
---
Defaulting to x86 Fargate architecture.
---
Workloads with x86-only binary dependencies; migrate those services or use mixed architecture.
---
20% higher Fargate costs than necessary.
---
## Right-Size Task Memory
---
## Cost Optimization
---
Always allocate Fargate task memory based on actual monitoring data; never allocate "extra for safety" without measurement.
---
Fargate charges for allocated memory, not used memory; a 2GB task using 500MB still pays for 2GB. Monitoring actual usage and reducing allocation directly cuts cost.
---
CloudWatch: container uses 800MB peak. Allocate 1GB (P95 + 20% headroom).
---
Allocating 4GB memory "to be safe" when container uses 500MB.
---
Applications with unpredictable memory spikes; still allocate based on P99 + headroom.
---
8x higher memory cost than needed; thousands of dollars in annual waste per service.
---
## Use Fargate Spot for Queue Workers
---
## Cost Optimization
---
Always use Fargate Spot capacity provider for queue workers and batch processing tasks.
---
Fargate Spot offers up to 70% discount for interruptible workloads; queue workers handle interruptions gracefully via SQS visibility timeout retries.
---
Queue worker ECS service: Fargate Spot capacity provider, On-Demand fallback.
---
Running queue workers on Fargate On-Demand.
---
Time-critical jobs that cannot tolerate any interruption delay; even then, mix Spot + On-Demand.
---
Paying 3-4x more for queue processing than necessary.
---
## Use ECS Service Auto Scaling
---
## Cost Optimization
---
Always configure ECS Service Auto Scaling with target tracking on CPU, memory, or ALB request count.
---
Auto-scaling prevents over-provisioning during low traffic and under-provisioning during peaks; Fargate tasks scale down to minimum when not needed.
---
Service Auto Scaling: target CPU 60%, min=2, max=10, scale-in cooldown=300s.
---
Fixed 10 Fargate tasks running 24/7 regardless of traffic.
---
Scheduled tasks with predictable, constant load; auto-scaling still provides safety net.
---
Over-provisioned during low traffic (waste) or under-provisioned during peaks (degradation).
---
## Use FireLens for Log Routing
---
## Cost Optimization
---
Always use FireLens to route Fargate container logs to S3 or OpenSearch; avoid sending verbose application logs to CloudWatch Logs.
---
CloudWatch Logs ingest costs can exceed Fargate compute costs for verbose logging; FireLens provides cost-effective log routing with configurable destinations.
---
Fluentd config: route access logs to S3 Glacier, error logs to CloudWatch Logs.
---
Sending all application debug logs to CloudWatch Logs at $0.50/GB ingested.
---
Compliance requirements mandating CloudWatch Logs for audit trails; use metric filters to control volume.
---
Log ingest costs exceeding compute costs; thousands in unnecessary CloudWatch Logs spend.
---
## Prefer ECS Over EKS
---
## Cost Optimization
---
Prefer ECS over EKS for Fargate deployments unless Kubernetes-specific features are required.
---
EKS adds a $73/month per-cluster fee that increases small-to-medium Fargate costs by 20-100%; ECS provides equivalent functionality at zero cluster cost for most Laravel apps.
---
2 Fargate services on ECS: $0 cluster fee. Same on EKS: $73/month + Fargate costs.
---
Running a single Fargate service on EKS "for future Kubernetes needs."
---
Multi-service deployments requiring Kubernetes-native features (custom schedulers, Istio, etc.).
---
$876/year minimum extra cost for cluster management you may not need.
---
## Avoid Cross-AZ Data Transfer
---
## Cost Optimization
---
Always colocate Fargate tasks and their dependent services (RDS, ElastiCache) in the same Availability Zone.
---
Fargate tasks in AZ-a communicating with RDS in AZ-b incur $0.01/GB data transfer charges; these charges accumulate silently and can add 10-20% to total infrastructure cost.
---
ECS service in us-east-1a, RDS in us-east-1a, all traffic stays within AZ.
---
Fargate tasks in us-east-1a, RDS in us-east-1b, paying for cross-AZ data transfer.
---
Multi-AZ deployments requiring cross-AZ replication for HA; accept the cost for resilience.
---
10-20% hidden cost from silent cross-AZ data transfer.
