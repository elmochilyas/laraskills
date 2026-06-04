# Fargate Spot Workers

## Metadata
- **ID**: KU-25-FARGATE-SPOT-WORKERS
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Fargate Spot Workers
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Fargate Spot offers up to 70% discount on compute for interruptible container tasks, making it ideal for Laravel queue workers, batch processing, CI/CD runners, and stateless background jobs. The tradeoff is a 5-15% per-hour interruption rate requiring graceful shutdown handling. At $0.00971/vCPU-hour (ARM Spot), queue worker costs become nearly negligible — a single Horizon worker can cost <$5/month.

## Core Concepts
- **Discount**: Up to 70% off Fargate On-Demand pricing
- **Interruption rate**: 5-15% per hour depending on Spot capacity demand
- **2-minute warning**: AWS sends SIGTERM 2 minutes before reclaiming capacity
- **Best for**: Stateless, fault-tolerant, interruptible workloads
- **Not for**: Stateful services, user-facing APIs, databases
- **Capacity pool**: Spot draws from AWS spare compute; availability varies by instance type, region, and time

## When To Use
- Laravel Horizon queue workers and scheduled task runners
- Batch processing, data exports, image resizing, report generation
- CI/CD build agents and testing runners
- Stateless microservices with graceful shutdown handling
- Any workload where interruption is acceptable at the job level

## When NOT To Use
- User-facing web serving or API endpoints
- WebSocket connections (Laravel Reverb) requiring persistent connections
- Stateful services (databases, Redis, session stores)
- Workloads with jobs exceeding 5 minutes that cannot checkpoint progress
- Single-AZ deployments without fallback (AZ can be drained entirely)

## Best Practices
- **Use Spot + On-Demand mixed capacity**: Run baseline workers on On-Demand, overflow on Spot (WHY: ensures baseline throughput during Spot unavailability; On-Demand covers while Spot repopulates; mix of 30% On-Demand + 70% Spot is common)
- **Implement graceful SIGTERM handling**: Catch SIGTERM in Supervisor to stop workers cleanly (WHY: 2-minute warning allows in-flight jobs to complete; without handling, jobs terminate immediately causing invisible retries)
- **Set queue worker timeout < 2 minutes**: Configure `--timeout=90` on Horizon workers (WHY: Spot gives 2-minute warning; jobs exceeding 120 seconds get interrupted mid-execution; 90-second timeout ensures jobs complete before forced termination)
- **Use multiple instance types in Spot capacity provider**: Diversify across similar instance families (WHY: Spot capacity varies per instance type; t4g medium may be unavailable but m7g medium is available; diversification reduces interruption rate by 40-60%)
- **Distribute Spot tasks across multiple AZs**: Spread Fargate tasks across 3 AZs (WHY: AWS can drain an entire AZ; multi-AZ distribution reduces single-AZ interruption impact)
- **Monitor SpotInterruptionCount metric**: Track interruption frequency per service (WHY: sustained high interruption rate indicates Spot capacity issue; trigger fallback to On-Demand or switch instance types)

## Architecture Guidelines
- Worker ASG with mixed capacity: 70% Spot, 30% On-Demand, min=1, max=50
- Service Auto Scaling on SQS queue depth (target: backlogPerWorker = 100)
- Lifecycle hook for graceful shutdown: 60-second timeout for in-flight jobs
- Separate queues for Spot vs On-Demand workers if priority differentiation needed
- Use Fargate Spot for non-critical queues, On-Demand for priority queues

## Performance Considerations
- Interruption rate spikes during AWS re:Invent, Black Friday, Prime Day
- Tasks restarting after interruption take 30-120 seconds (image pull), causing job processing lag
- Jobs should complete within 5 minutes ideally to survive interruption windows
- Long-running Horizon batches may need checkpointing (track progress in DB)
- ARM Spot tasks generally have lower interruption rates than x86

## Security Considerations
- Container images used for Spot tasks should be scanned and trusted
- IAM roles for Spot workers should be least-privilege (SQS receive/delete only)
- Termination lifecycle hooks should log interruption events for audit
- Spot capacity provider does not expose underlying host details
- Cross-account Spot usage requires careful IAM boundary configuration

## Common Mistakes
1. **Running stateful jobs on Spot without checkpointing**: All progress lost on interruption (Cause: assuming Spot is like On-Demand; Consequence: jobs restart from beginning repeatedly, never completing; Better: checkpoint progress in database every 50-100 records)
2. **No On-Demand fallback**: Queue stops processing when Spot is unavailable (Cause: maximum cost savings goal; Consequence: queue backlog grows during Spot shortage; Better: 30% On-Demand baseline ensures continuous processing)
3. **Single AZ for Spot tasks**: AWS can drain an entire AZ (Cause: simpler deployment configuration; Consequence: all workers interrupted simultaneously during AZ event; Better: distribute across 3 AZs)
4. **Ignoring interruption rate variance**: Us-east-1 rates differ from ap-southeast-1 (Cause: assumption of uniform capacity; Consequence: unexpected worker terminations in capacity-constrained regions; Better: check historical interruption rates per region before deployment)

## Anti-Patterns
- **100% Spot without fallback**: Single point of failure for queue processing
- **Stateful services on Spot**: Databases, Redis, or WebSocket servers on interruptible capacity
- **Spot for production web serving**: User-facing requests should never be interrupted
- **No job retry limit**: Jobs interrupted repeatedly with infinite retries cause processing loops

## Examples
- **Laravel Horizon workers**: 5 x t4g.small Fargate Spot tasks, 1 x t4g.small On-Demand, Image processing queue, `--timeout=90` on Horizon
- **Batch report generation**: 10 Fargate Spot tasks triggered by CloudWatch schedule, mixed capacity, 30-minute timeout per job
- **CI/CD runners**: 2 x m7g.medium Fargate Spot, run for build duration only, no capacity reservations

## Related Topics
- Fargate Pricing Analysis (ku-24)
- Spot Instances Strategy (ku-03)
- Spot Interruption Costs (ku-04)
- KEDA Scale-to-Zero Workers (ku-45)

## AI Agent Notes
- Default: Spot + On-Demand mixed capacity (70/30) for all queue workers
- Default: set `--timeout=90` on Horizon for Spot compatibility
- Always implement lifecycle hook for graceful shutdown
- Diversify instance types and AZs to reduce interruption risk
- Monitor SpotInterruptionCount weekly for capacity health
