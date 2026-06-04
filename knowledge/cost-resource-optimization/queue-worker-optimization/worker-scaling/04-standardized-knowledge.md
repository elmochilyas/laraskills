# Worker Scaling

## Metadata
- **ID**: KU-01-WORKER-SCALING
- **Subdomain**: queue-worker-cost-efficiency
- **Domain**: cost-resource-optimization
- **Topic**: Worker Scaling
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Worker scaling adjusts the number of queue worker processes to match the volume of queued jobs. Under-provisioned workers cause job backlog (hours of latency). Over-provisioned workers waste compute resources (paying for idle capacity). For Laravel applications using SQS, auto-scaling workers based on queue depth is the most effective cost optimization: workers exist only when there is work to do.

## Core Concepts
- **Queue depth**: Number of messages waiting; primary metric for scaling decisions
- **Worker throughput**: Jobs processed per second per worker; depends on job complexity
- **Scale-out threshold**: Queue depth at which new workers are added
- **Scale-in threshold**: Queue depth below which workers are removed
- **SQS ApproximateNumberOfMessagesVisible**: CloudWatch metric for queue depth
- **Scaling cooldown**: Time between scaling actions to prevent oscillation
- **Graceful shutdown**: Workers finish current job before termination

## When To Use
- Auto-scaling workers: Variable queue load; batch jobs, user-triggered processing, scheduled tasks
- Manual workers: Constant, predictable queue load (always 500 jobs waiting)
- Scheduled workers: Known processing windows (month-end reports, daily digest emails)
- Spot workers: Fault-tolerant workloads; save 60-90% vs On-Demand
- KEDA scaling: Kubernetes-based workers; event-driven scaling

## When NOT To Use
- Auto-scaling for stable load: If queue depth is always 100-200, fixed worker count is simpler
- Auto-scaling without min workers: Setting min=0 means cold start on every job (queue processing delayed 2-5 minutes)
- Overly aggressive scaling: Adding/removing workers every 30 seconds causes thrashing
- Scaling on queue depth alone: Consider job complexity; 1000 simple jobs vs 10 complex jobs need different scaling

## Best Practices
- **Scale workers on SQS ApproximateNumberOfMessagesVisible**: Set target processing time (e.g., keep queue depth < 1000) (WHY: latency-based scaling ensures jobs complete on time; if each worker processes 10 jobs/min and target latency is 5 min, scale when depth > 50)
- **Set min workers = 1**: Always keep at least 1 worker running (WHY: prevents cold-start delay; queue processing starts instantly instead of waiting 2-5 minutes for instance boot; $30/month for 1 always-on worker is worth the latency savings)
- **Use step scaling for large backlogs**: Add workers proportionally: 2 at depth 500, 4 at depth 2000, 8 at depth 10000 (WHY: small backlogs only need a few extra workers; large backlogs need rapid catch-up; step scaling avoids both under- and over-reaction)
- **Set scale-in cooldown to 300+ seconds**: Allow time for workers to finish in-flight jobs (WHY: terminating workers mid-job triggers SQS visibility timeout; wastes processing and delays job completion; 5-minute cooldown ensures current work completes)
- **Monitor job processing time per worker**: Track average job duration to calculate appropriate worker count (WHY: scaling blindly without job duration data may over- or under-provision; formula: workers_needed = jobs_per_second * avg_job_duration_seconds)
- **Use queue-specific scaling policies**: Separate scaling for priority queues (email, notifications) vs batch queues (reports, cleanup) (WHY: high-priority jobs need faster scaling response; batch jobs can tolerate longer processing times and cooldowns)

## Architecture Guidelines
- Worker ASG: min=1, max=50, use Spot instances
- Scaling metric: SQS ApproximateNumberOfMessagesVisible (average over 1 minute)
- Scale-out cooldown: 120 seconds
- Scale-in cooldown: 300 seconds
- Use mixed instances policies for Spot diversification
- For Fargate: ECS Service Auto Scaling with SQS metric (simpler)
- For KEDA: ScaledObject with SQS trigger and polling interval

## Performance Considerations
- Worker warm-up: 2-5 minutes for new EC2 instance; 30-60 seconds for Fargate
- Pre-scaling: Schedule worker increase 15 minutes before known batch jobs
- SQS polling overhead: Each worker polls every 0.1-10 seconds; too many workers = high SQS API cost
- Batching: Receive up to 10 messages per SQS poll (reduces API calls by 10x)
- Job processing time variance: Mix of fast (10ms) and slow (60s) jobs; separate queues for different durations

## Security Considerations
- Worker instances need SQS IAM permissions (receive, delete, change visibility)
- Use queue-specific IAM policies for least privilege
- Workers should not have database write access for read-only processing
- SQS encryption (SSE-KMS) for sensitive job data
- Monitor worker scaling events in CloudTrail

## Common Mistakes
1. **min=0 workers in auto-scaling**: No workers running during off-peak; first job waits 5 minutes for instance boot (Cause: cost optimization; Consequence: 5-minute latency for every burst; Better: min=1 worker always running; cost is minimal)
2. **Scale-in too fast**: Removing workers every 60 seconds when queue drops (Cause: tight cooldown; Consequence: workers terminated mid-job, SQS retry delay; Better: minimum 300 second scale-in cooldown)
3. **No job duration monitoring**: Scaling based on raw queue depth without knowing per-worker throughput (Cause: blind scaling; Consequence: under- or over-provisioning; Better: track jobs_per_second and job_duration_seconds per worker)

## Anti-Patterns
- **Manual worker management**: SSH-ing to add workers; defeats purpose of auto-scaling
- **Web + queue on same ASG**: Queue workers competing with web requests for CPU
- **On-Demand workers for fault-tolerant workloads**: Paying 4x for queue processing that runs fine on Spot

## Examples
- **Standard auto-scaling**: min=1, max=20; scale-out at depth=1000 (add 2), scale-in at depth=100 (remove 1); cooldown 120/300
- **Priority queue**: Email worker ASG: min=2, max=10; scale-out at depth=100; scale-in at depth=10
- **Batch worker ASG**: Report generation: min=0, max=5; scheduled scale-up 1 hour before month-end; scale-in after completion

## Related Topics
- Batch Processing (ku-02)
- Auto Scaling Workers (ku-03)
- Spot Worker (ku-05)
- Throughput Optimization (ku-06)

## AI Agent Notes
- Default: min=1, max=20, Spot instances, SQS depth metric
- Default: scale-out cooldown 120s, scale-in cooldown 300s
- Track job duration to calculate optimal worker count

## Verification
- [ ] Worker auto-scaling configured on SQS queue depth
- [ ] min=1 worker always running (prevents cold-start)
- [ ] Scale-in cooldown >= 300 seconds
- [ ] Job processing time tracked per worker
- [ ] Spot instance-based worker fleet
- [ ] Queue-specific scaling policies for priority jobs
- [ ] Graceful shutdown configured via lifecycle hooks
