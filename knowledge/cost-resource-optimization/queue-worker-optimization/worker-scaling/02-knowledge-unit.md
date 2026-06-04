# KU-01-WORKER-SCALING: Worker Scaling

## Metadata
- **ID**: KU-01-WORKER-SCALING
- **Subdomain**: Queue Worker Optimization
- **Topic**: Worker Scaling
- **Source**: Queue Worker Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Worker scaling adjusts the number of queue worker processes to match the volume of queued jobs. Under-provisioned workers cause job backlog (hours of latency). Over-provisioned workers waste compute resources (paying for idle capacity). For Laravel applications using SQS, auto-scaling workers based on queue depth is the most effective cost optimization: workers exist only when there is work to do.

## Core Concepts
- **Queue depth**: Number of messages waiting; primary metric for scaling decisions
- **Worker throughput**: Jobs processed per second per worker; depends on job complexity
- **Scale-out threshold**: Queue depth at which new workers are added
- **Scale-in threshold**: Queue depth below which workers are removed
- **SQS ApproximateNumberOfMessagesVisible**: CloudWatch metric for queue depth
- **Scaling cooldown**: Time between scaling actions to prevent oscillation
- **Graceful shutdown**: Workers finish current job before termination

## Mental Models
- Default: min=1, max=20, Spot instances, SQS depth metric
- Default: scale-out cooldown 120s, scale-in cooldown 300s
- Track job duration to calculate optimal worker count

## Internal Mechanics
- Worker warm-up: 2-5 minutes for new EC2 instance; 30-60 seconds for Fargate
- Pre-scaling: Schedule worker increase 15 minutes before known batch jobs
- SQS polling overhead: Each worker polls every 0.1-10 seconds; too many workers = high SQS API cost
- Batching: Receive up to 10 messages per SQS poll (reduces API calls by 10x)
- Job processing time variance: Mix of fast (10ms) and slow (60s) jobs; separate queues for different durations

## Patterns
- Scale workers on SQS ApproximateNumberOfMessagesVisible
- Set min workers = 1
- Use step scaling for large backlogs
- Set scale-in cooldown to 300+ seconds
- Monitor job processing time per worker
- Use queue-specific scaling policies

## Architectural Decisions
- Worker ASG: min=1, max=50, use Spot instances
- Scaling metric: SQS ApproximateNumberOfMessagesVisible (average over 1 minute)
- Scale-out cooldown: 120 seconds
- Scale-in cooldown: 300 seconds
- Use mixed instances policies for Spot diversification
- For Fargate: ECS Service Auto Scaling with SQS metric (simpler)
- For KEDA: ScaledObject with SQS trigger and polling interval

## Tradeoffs
**When To Use:**
- Auto-scaling workers: Variable queue load; batch jobs, user-triggered processing, scheduled tasks
- Manual workers: Constant, predictable queue load (always 500 jobs waiting)
- Scheduled workers: Known processing windows (month-end reports, daily digest emails)
- Spot workers: Fault-tolerant workloads; save 60-90% vs On-Demand
- KEDA scaling: Kubernetes-based workers; event-driven scaling

**When NOT To Use:**
- Auto-scaling for stable load: If queue depth is always 100-200, fixed worker count is simpler
- Auto-scaling without min workers: Setting min=0 means cold start on every job (queue processing delayed 2-5 minutes)
- Overly aggressive scaling: Adding/removing workers every 30 seconds causes thrashing
- Scaling on queue depth alone: Consider job complexity; 1000 simple jobs vs 10 complex jobs need different scaling

## Performance Considerations
- Worker warm-up: 2-5 minutes for new EC2 instance; 30-60 seconds for Fargate
- Pre-scaling: Schedule worker increase 15 minutes before known batch jobs
- SQS polling overhead: Each worker polls every 0.1-10 seconds; too many workers = high SQS API cost
- Batching: Receive up to 10 messages per SQS poll (reduces API calls by 10x)
- Job processing time variance: Mix of fast (10ms) and slow (60s) jobs; separate queues for different durations

## Production Considerations
- Worker instances need SQS IAM permissions (receive, delete, change visibility)
- Use queue-specific IAM policies for least privilege
- Workers should not have database write access for read-only processing
- SQS encryption (SSE-KMS) for sensitive job data
- Monitor worker scaling events in CloudTrail

## Common Mistakes
- **min=0 workers in auto-scaling**: No workers running during off-peak; first job waits 5 minutes for instance boot (Cause: cost optimization; Consequence: 5-minute latency for every burst; Better: min=1 worker always running; cost is minimal)
- **Scale-in too fast**: Removing workers every 60 seconds when queue drops (Cause: tight cooldown; Consequence: workers terminated mid-job, SQS retry delay; Better: minimum 300 second scale-in cooldown)
- **No job duration monitoring**: Scaling based on raw queue depth without knowing per-worker throughput (Cause: blind scaling; Consequence: under- or over-provisioning; Better: track jobs_per_second and job_duration_seconds per worker)

## Failure Modes
- **Manual worker management**: SSH-ing to add workers; defeats purpose of auto-scaling
- **Web + queue on same ASG**: Queue workers competing with web requests for CPU
- **On-Demand workers for fault-tolerant workloads**: Paying 4x for queue processing that runs fine on Spot

## Ecosystem Usage
- **Standard auto-scaling**: min=1, max=20; scale-out at depth=1000 (add 2), scale-in at depth=100 (remove 1); cooldown 120/300
- **Priority queue**: Email worker ASG: min=2, max=10; scale-out at depth=100; scale-in at depth=10
- **Batch worker ASG**: Report generation: min=0, max=5; scheduled scale-up 1 hour before month-end; scale-in after completion

## Related Knowledge Units
- Batch Processing (ku-02)
- Auto Scaling Workers (ku-03)
- Spot Worker (ku-05)
- Throughput Optimization (ku-06)

## Research Notes
Derived from Queue Worker Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.