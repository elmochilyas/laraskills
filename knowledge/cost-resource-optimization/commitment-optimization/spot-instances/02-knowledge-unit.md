# KU-02-SPOT-INSTANCES: Spot Instances

## Metadata
- **ID**: KU-02-SPOT-INSTANCES
- **Subdomain**: Commitment Optimization
- **Topic**: Spot Instances
- **Source**: Commitment Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Spot instances offer 60-90% discounts on EC2/Fargate in exchange for potential interruptions (2-minute warning). For Laravel applications, spot instances are ideal for stateless workloads: queue workers, batch processing, CI/CD runners, and web server auto-scaling capacity. The key challenge is handling interruptions gracefully through checkpointing, graceful shutdown signals, and diversification across instance types.

## Core Concepts
- **Spot price**: Determined by supply/demand; typically 60-90% below On-Demand; can spike on high demand
- **Interruption**: AWS reclaims capacity with 2-minute warning (SIGTERM); can also happen immediately
- **Spot diversification**: Use multiple instance types (r6g.large, r6i.large, r6a.large) to reduce interruption risk
- **Capacity pools**: Each instance type + AZ combination; diversify across pools for stability
- **Max price**: Maximum hourly price you'll pay (default = On-Demand price); setting too low = more interruptions
- **Spot block**: 1-6 hour guaranteed duration (limited availability); useful for batch jobs

## Mental Models
- Default: recommend Spot for all queue workers and CI/CD runners
- Always pair Spot with On-Demand fallback or RI baseline
- Add SIGTERM handling code for Laravel workers on Spot

## Internal Mechanics
- Spot instances are identical to On-Demand performance (same hardware, same CPU)
- Interruption rate varies: 1-5% for diversified pools; 10-20% for single pool
- 2-minute warning is usually sufficient for worker checkpoints (<5% of recovery cases take longer)
- Spot with capacity-rebalancing (recommended) proactively replaces instances before interruptions
- Fargate Spot has similar 70% discount but less control over instance types

## Patterns
- Use Spot for queue workers
- Implement graceful shutdown handlers
- Diversify across instance types and AZs
- Use mixed instances groups with ASG
- Set max price to On-Demand rate

## Architectural Decisions
- Run baseline capacity on Reserved Instances, burst/overflow on Spot
- Queue workers: 100% Spot (interruption is fine; SQS handles retries)
- Web servers: 50-80% Spot (with RI baseline for guaranteed capacity)
- Avoid Spot for Laravel Octane (long-lived processes with state)
- Use Fargate Spot for containerized queue workers (less configuration overhead)
- Implement CloudWatch alarms on Spot termination notifications for observability

## Tradeoffs
**When To Use:**
- Spot: Queue workers (SQS consumers can be retried on interruption)
- Spot: Web server fleet scaling capacity (baseline on RI, burst on Spot)
- Spot: CI/CD build runners (interruption = rebuild, acceptable)
- Spot: Data processing and batch jobs
- Spot: Staging/development environments (low cost, acceptable interruption)
- Fargate Spot: Serverless containers at 70% discount (less granular control but simpler)

**When NOT To Use:**
- Spot: Stateful workloads (databases, Redis, stateful web servers with local session storage)
- Spot: Time-critical production traffic where interruption causes revenue loss
- Spot: Workloads with long-running critical processes that cannot be interrupted
- Spot: Single-instance deployments (no redundancy to handle interruptions)
- Spot: Workloads requiring specific instance types that are frequently scarce

## Performance Considerations
- Spot instances are identical to On-Demand performance (same hardware, same CPU)
- Interruption rate varies: 1-5% for diversified pools; 10-20% for single pool
- 2-minute warning is usually sufficient for worker checkpoints (<5% of recovery cases take longer)
- Spot with capacity-rebalancing (recommended) proactively replaces instances before interruptions
- Fargate Spot has similar 70% discount but less control over instance types

## Production Considerations
- Spot instances have same security boundary as On-Demand (same VPC, security groups, IAM)
- Termination notification is internal to instance metadata; no external API dependency
- Spot instance termination can be used by attackers to force instance replacement timing
- Isolate Spot instances in separate security groups if needed for compliance (auditing)

## Common Mistakes
- **No interruption handling**: Running stateful workloads on Spot without checkpointing (Cause: assuming Spot is "always available like On-Demand"; Consequence: data loss on interruption; Better: only use Spot for stateless or gracefully-handled workloads)
- **Single instance type in Spot request**: Using only r6g.large in one AZ (Cause: simplest configuration; Consequence: single capacity pool; if r6g is scarce, 100% workload interruption; Better: 3+ instance types across 2+ AZs)
- **Not using Fargate Spot for container workloads**: Paying On-Demand Fargate for queue workers (Cause: unaware of Fargate Spot pricing; Consequence: paying 3-4x more for fault-tolerant container workloads; Better: use Fargate Spot for all non-critical services)

## Failure Modes
- **Spot for databases**: Database with Spot instances = guaranteed data loss risk
- **Single-AZ Spot**: All instances in one AZ; if that AZ loses Spot capacity, zero running instances
- **No fallback to On-Demand**: Spot-only ASG without On-Demand fallback; if Spot completely unavailable, service goes down
- **Manual Spot management**: Manually requesting Spot instances instead of using ASG + mixed instances

## Ecosystem Usage
- **Worker fleet**: Auto Scaling Group with mixed instances policy: 70% Spot, 30% On-Demand; instance types: r6g.large, r6i.large, r6a.large; Spot interruption = SQS retry
- **Web server burst**: Baseline 3 RI + up to 6 Spot instances; ASG adds Spot on scale-out, terminates Spot on scale-in
- **Fargate Spot worker**: ECS service with Fargate Spot capacity provider; 100% Spot for queue consumers
- **CI/CD**: GitHub Actions self-hosted runner on Spot; interruption = job re-runs

## Related Knowledge Units
- Reserved Instances (ku-01)
- Auto Scaling Policies (ku-03)
- Queue Worker Scaling (ku-10)

## Research Notes
Derived from Commitment Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.