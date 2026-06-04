# Spot Worker

## Metadata
- **ID**: KU-05-SPOT-WORKER
- **Subdomain**: queue-worker-cost-efficiency
- **Domain**: cost-resource-optimization
- **Topic**: Spot Worker
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Spot Workers use EC2 Spot or Fargate Spot instances for queue processing, reducing compute costs by 60-90% compared to On-Demand. Queue workers are ideal for Spot because they are stateless (jobs can be retried on interruption), fault-tolerant (SQS handles retries), and can be interrupted without user impact. For Laravel applications, the worker fleet (queue processing, batch jobs, cron replacements) is often the largest compute cost, and converting to Spot can save thousands per month.

## Core Concepts
- **EC2 Spot**: 60-90% discount; 2-minute termination warning; preemptible capacity
- **Fargate Spot**: 70% discount on Fargate; simpler management; no instance selection
- **Spot interruption**: AWS reclaims instance; 2-minute SIGTERM warning or immediate
- **SQS visibility timeout**: Message becomes visible again if worker doesn't delete it (retry mechanism)
- **Graceful handling**: Worker completes current job, marks as handled, exits on SIGTERM
- **Spot diversification**: Multiple instance types + AZs for higher availability
- **Mixed instances policy**: ASG with Spot + On-Demand mix; On-Demand as fallback

## When To Use
- EC2 Spot: Large worker fleets (>10 instances); maximum cost savings; full control
- Fargate Spot: Containerized workers; less operational overhead; simpler scaling
- Queue workers: Always default to Spot (fault-tolerant = interruption-safe)
- CI/CD runners: Spot is ideal (interruption = pipeline re-run)
- Data processing: Batch jobs that can be retried from checkpoint
- Web server overflow: Spot for ASG scaling beyond RI baseline

## When NOT To Use
- Spot for stateful workers: Workers holding local state (database connections are fine; in-memory state is not)
- Spot for time-critical jobs: If job must complete in <30 seconds and interruption causes SLA breach
- Spot without fallback: 100% Spot with no On-Demand capacity; if Spot is unavailable, workers stop
- Spot for long-running critical processes: Jobs that run > 15 minutes risk interruption mid-process
- Spot for database or cache: Stateful services must not use Spot

## Best Practices
- **Use Spot for ALL queue workers**: Queue workers are inherently fault-tolerant (WHY: SQS visibility timeout means interrupted jobs are automatically retried; Spot saves 70% on compute; there is no downside for queue workers)
- **Implement graceful shutdown handler**: Catch SIGTERM in worker to finish current job before exit (WHY: 2-minute warning allows worker to complete in-flight job; prevents unnecessary SQS retries that waste processing time)
- **Use mixed instances policy**: 70% Spot, 30% On-Demand in the same ASG (WHY: Spot handles the bulk of processing; On-Demand provides guaranteed capacity when Spot is scarce; interruption risk approaches zero with diversified pools)
- **Diversify instance types**: Use 3+ instance types (m7g.large, m7i.large, m6g.large) across 2+ AZs (WHY: Spot capacity is per-type-per-AZ; if m7g.large Spot is unavailable in us-east-1a, m7i.large in us-east-1b may still be available)
- **Set Spot interruption handler for long jobs**: Chunk long-running jobs (>5 min) into smaller atomic units with checkpoints (WHY: interruption of a 30-minute job wastes 30 minutes of compute; chunking into 1-minute units limits waste to 1 minute)
- **Monitor Spot interruption rate**: Track Spot instance lifecycle events; if interruption exceeds 10%/day, diversify further or increase On-Demand % (WHY: high interruption rate indicates Spot capacity pressure; adjust strategy before it affects processing throughput)

## Architecture Guidelines
- Worker ASG: mixed instances policy, 70% Spot, 30% On-Demand
- Instance types: 3+ types (m7g.large, m7i.large, m6g.large, c7g.large)
- AZs: 2+ (us-east-1a, us-east-1b)
- Lifecycle hook: 60s for graceful shutdown
- SQS visibility timeout: 2x max job duration + 60s buffer
- Spot rebalance recommendation: enable for proactive instance replacement
- Fargate Spot: use capacity provider with weight-based strategy

## Performance Considerations
- Spot instance performance identical to On-Demand (same hardware)
- Interruption rate: 1-5% with diversified pools; can spike to 20%+ in single-pool configuration
- Interruption notice time: 2 minutes (sufficient for most queue jobs)
- Chunked jobs: 1-minute checkpoints limit wasted compute on interruption
- Fargate Spot interruption: Same model, shorter notice (~30 seconds)

## Security Considerations
- Spot instances share hypervisor but are isolated via Nitro (no co-residency access)
- Termination notification instance metadata: `http://169.254.169.254/latest/meta-data/spot/termination-time`
- Workers should not hold sensitive data in memory across interruptions
- Instance metadata service v2 (IMDSv2) should be enforced on Spot instances
- Spot instance logs may not be available after termination (ship logs in real-time)

## Common Mistakes
1. **No graceful shutdown handler**: Workers interrupted mid-job; SQS retries, but latency increases (Cause: assuming worker won't be interrupted; Consequence: each interruption wastes 1-2 minutes of processing; Better: catch SIGTERM, finish current job, delete from queue, exit)
2. **Single instance type for Spot**: Using only m7g.large in us-east-1a (Cause: simplest launch template; Consequence: single capacity pool; if m7g.large is scarce, 100% of workers are interrupted; Better: 3+ instance types across 2+ AZs)
3. **100% Spot without On-Demand fallback**: Spot price spikes 3x, workers become more expensive than On-Demand (Cause: "Spot is always cheaper" assumption; Consequence: either pay premium or lose capacity; Better: 70/30 Split with On-Demand base)
4. **Not testing interruption handling**: Deploying Spot workers without ever testing termination (Cause: "it probably works"; Consequence: during real interruption, jobs fail or duplicate; Better: test with `aws ec2 simulate-spot-instance-interruption`)

## Anti-Patterns
- **Spot for databases**: Data loss risk; never use Spot for stateful workloads
- **Spot without monitoring**: No interruption tracking; unaware of capacity issues
- **Manual Spot request management**: Using EC2 console to request Spot instead of ASG integration
- **Ignoring Fargate Spot**: Running container workers on On-Demand Fargate when Fargate Spot exists

## Examples
- **Worker ASG**: Mixed policy: 70% Spot, 30% On-Demand; instances: m7g.large, m7i.large, c7g.large; AZs: us-east-1a, us-east-1b; lifecycle hook: 60s graceful shutdown
- **Fargate Spot**: ECS capacity provider with 100% Fargate Spot; fallback to On-Demand if Spot unavailable; KEDA for scaling
- **Graceful shutdown in Laravel**: `pcntl_signal(SIGTERM, function() { $worker->stop(); });` in custom worker; finish current job, delete from SQS, exit

## Related Topics
- Reserved Instances (ku-01 in compute-commitment)
- Worker Scaling (ku-01)
- Worker Failure Cost (ku-07)

## AI Agent Notes
- Default: Spot for all queue workers (70% Spot, 30% On-Demand)
- Default: graceful shutdown handler for SIGTERM
- Default: 3+ instance types, 2+ AZs
- Never Spot for stateful workloads

## Verification
- [ ] Queue workers use Spot instances (EC2 or Fargate)
- [ ] Graceful shutdown handler implemented
- [ ] Mixed instances policy (70/30 Spot/On-Demand)
- [ ] Diversified instance types (3+) and AZs (2+)
- [ ] SQS visibility timeout configured for interruption
- [ ] Interruption rate monitored (< 5% target)
- [ ] Fargate Spot considered for containerized workers
