# Spot Instances Strategy

## Metadata
- **ID**: KU-06-SPOT-INSTANCES-STRATEGY
- **Subdomain**: compute-commitment-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Spot Instances Strategy
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Spot Instances offer up to 90% discount vs On-Demand with a 5-15% per-hour interruption rate. They are ideal for stateless, fault-tolerant workloads: queue workers, batch processing, CI/CD, and non-production environments. The key to successful Spot usage is designing for interruptions — using Spot as the default with On-Demand fallback, distributing across instance types and AZs, and implementing graceful shutdown handling. For Laravel apps, queue workers are the highest-ROI use case.

## Core Concepts
- **Max discount**: Up to 90% off On-Demand
- **Interruption rate**: 5-15% per hour (varies by instance type, region, time)
- **2-minute notice**: AWS sends rebalance recommendation before interruption (SIGTERM)
- **Best for**: Stateless workers, batch, CI/CD, staging
- **Not for**: Stateful services, real-time user-facing apps, databases
- **Diversification**: 3+ instance types, 2+ AZs reduces interruption risk by 60-80%

## When To Use
- Spot: Queue workers (SQS, Redis) — fault-tolerant by design
- Spot: CI/CD build runners — interruption = rebuild, acceptable
- Spot: Web server burst capacity — On-Demand baseline, Spot for scale-out
- Spot: Staging/development environments — low cost, acceptable interruption
- Spot: Data processing and batch jobs — checkpoint and retry
- Spot: Fargate Spot containers — 70% discount with less configuration

## When NOT To Use
- Spot: Stateful workloads (databases, Redis with persistence, stateful web servers)
- Spot: Time-critical production traffic where interruption causes revenue loss
- Spot: Long-running critical processes without checkpointing (>5 min jobs)
- Spot: Single-instance deployments (no redundancy to handle interruptions)
- Spot: Workloads requiring specific instance types frequently scarce
- Spot: Laravel Octane long-lived processes (state in memory across requests)

## Best Practices
- **Use Spot for all queue workers**: SQS consumers, Horizon workers, Redis queue consumers (WHY: queues are inherently fault-tolerant; SQS retries on failure; Spot interruption triggers retry with zero data loss; Laravel Horizon already handles job timeouts and retries — free Spot compatibility)
- **Implement graceful shutdown handling**: SIGTERM signals 2 minutes before termination (WHY: 2-minute warning allows in-flight jobs to complete or be returned to queue; prevents duplicate processing; Laravel Horizon dispatches `QueueBusy` and stops accepting new jobs on SIGTERM)
- **Diversify instance types and AZs**: 3+ instance types across 2+ AZs (WHY: reduces probability of total capacity loss; if r6g.large is reclaimed in us-east-1a, r6i.large in us-east-1b may still be available; diversified pools reduce interruption rate 60-80%)
- **Use mixed instances groups with ASG**: Auto Scaling Group with multiple instance types (WHY: ASG automatically maintains capacity by switching instance types when one pool is depleted; fully automated — no manual intervention needed; sets On-Demand fallback when Spot unavailable)
- **Set max price to On-Demand rate**: Default max price = On-Demand (WHY: setting max price below current Spot price causes immediate termination when Spot price rises; default max price protects against short price spikes; Spot price rarely exceeds On-Demand)

## Architecture Guidelines
- Queue workers: 100% Spot (interruption is fine; SQS/Laravel handles retries)
- Web servers: 50-80% Spot with On-Demand baseline + Spot burst
- CI/CD: 100% Spot (build failure on interruption = restart)
- Use capacity-rebalancing (recommended) for proactive instance replacement
- Fargate Spot for containerized workers (less configuration, same savings)
- Implement CloudWatch alarms on Spot termination notifications
- Avoid Spot for Laravel Octane (long-lived processes with in-memory state)

## Performance Considerations
- Spot instances are identical hardware to On-Demand (same CPU, same performance)
- Interruption rate: 1-5% for diversified pools; 10-20% for single pool
- 2-minute warning handles >95% of graceful shutdown cases
- Capacity-rebalancing reduces interruption impact by proactively replacing instances
- Fargate Spot has same 70% discount but less instance type control

## Security Considerations
- Same security boundary as On-Demand (same VPC, security groups, IAM)
- Termination notification via instance metadata (no external API dependency)
- Isolate Spot instances in separate security groups for compliance auditing
- Spot termination can be used by attackers to force instance replacement timing
- Ensure IAM roles attached to Spot instances have minimum necessary permissions

## Common Mistakes
1. **No interruption handling**: Stateful workloads on Spot without checkpointing (Cause: assuming Spot is "always available"; Consequence: data loss on interruption; Better: only Spot for stateless workloads with retry logic)
2. **Single instance type in Spot request**: Using only r6g.large in one AZ (Cause: simplest configuration; Consequence: single capacity pool failure = 100% workload interruption; Better: 3+ types across 2+ AZs)
3. **Not using Fargate Spot for containers**: Paying On-Demand for fault-tolerant container workers (Cause: unaware of Fargate Spot; Consequence: paying 3-4x more; Better: Fargate Spot for all non-critical ECS/EKS services)

## Anti-Patterns
- **Spot for databases**: Guaranteed data loss risk on interruption
- **Single-AZ Spot**: All instances in one AZ; AZ loses Spot capacity = zero running instances
- **No On-Demand fallback**: Spot-only ASG; if Spot completely unavailable, service goes down
- **Manual Spot management**: Manually requesting Spot instead of ASG/mixed instances
- **Spot for Octane**: Long-lived PHP processes with state; interruption loses in-flight requests

## Examples
- **Worker fleet**: ASG with mixed instances: 70% Spot, 30% On-Demand; types: r6g.large, r6i.large, r6a.large; Spot interruption = SQS message retry via Laravel Horizon
- **Web server burst**: Baseline 3 RI + up to 6 Spot; ASG adds Spot on scale-out, terminates Spot on scale-in
- **Fargate Spot**: ECS service with Fargate Spot capacity provider; 100% Spot for queue consumers
- **CI/CD**: GitHub Actions self-hosted runner on Spot; interruption = job re-runs automatically

## Related Topics
- Spot Interruption Costs (ku-07)
- Compute Savings Plans (ku-04)
- Reserved Instances (ku-01)
- Auto Scaling Policies (ku-03)
- Fargate Spot Workers (ku-25)

## AI Agent Notes
- Default: recommend Spot for all queue workers and CI/CD runners
- Always pair Spot with On-Demand fallback or RI baseline
- Add SIGTERM handling for Laravel workers on Spot
- Diversify 3+ instance types, 2+ AZs
- Use Fargate Spot for containerized workers

## Verification
- [ ] Spot instances used for fault-tolerant stateless workloads
- [ ] Graceful shutdown handler (SIGTERM) implemented
- [ ] Diversified instance types (3+) and AZs (2+)
- [ ] Auto Scaling Group with mixed instances policy
- [ ] On-Demand fallback configured for critical capacity
- [ ] Fargate Spot considered for containerized workers
- [ ] Spot capacity-rebalancing enabled
