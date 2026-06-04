# Queue Worker Scaling

## Metadata
- **ID**: KU-10-QUEUE-WORKER-SCALING
- **Subdomain**: compute-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Queue Worker Scaling
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Queue worker scaling adjusts the number of worker processes handling background jobs based on queue depth. For Laravel applications with SQS or database queues, workload varies dramatically between peak and off-peak hours. Auto-scaling queue workers to match queue depth eliminates idle worker cost during low traffic while maintaining job throughput during peaks. Workers are ideal Spot instance candidates (fault-tolerant, interruption-safe).

## Core Concepts
- **Queue depth**: Number of messages waiting in queue; primary scaling metric
- **Worker throughput**: Jobs per second per worker (varies by job complexity)
- **Auto Scaling on SQS metric**: Scale out when ApproximateNumberOfMessagesVisible > threshold
- **KEDA**: Kubernetes Event-Driven Autoscaling; scales workers based on SQS queue depth in EKS
- **Spot interruption tolerance**: Queue workers are stateless; interruption = SQS visibility timeout retry
- **Scaling lag**: Time from queue depth increase to new worker processing jobs (2-5 minutes)

## When To Use
- Auto-scaling workers: Any app with variable queue load (daily batch jobs, user-triggered processing)
- Spot-based workers: All non-critical queue processing (save 60-90% vs On-Demand)
- KEDA scaling: Kubernetes-based deployments with event-driven autoscaling
- Manual scaling: Small apps with predictable, constant queue load
- Fargate Spot: Containerized workers with minimal operational overhead

## When NOT To Use
- Auto-scaling for constant load: If queue depth is always ~100 messages, fixed workers are simpler
- Spot for time-critical jobs: Jobs that must complete within minutes regardless of interruptions
- KEDA for small apps: KEDA adds complexity; CloudWatch + ASG scaling is simpler for EC2-based workers
- Manual scaling for variable load: Over-provisioned during low traffic, under-provisioned during peaks

## Best Practices
- **Scale workers on ApproximateNumberOfMessagesVisible**: Set CloudWatch alarm at depth = desired_latency * avg_throughput (WHY: latency-based scaling ensures jobs complete on time; if target latency is 5 min and each worker processes 10 jobs/min, scale when depth exceeds 50)
- **Use Spot instances for worker fleets**: Mix Spot + On-Demand in ASG, with Spot as primary (WHY: queue workers handle interruptions gracefully via SQS visibility timeout; 70-90% cost reduction vs On-Demand)
- **Set cooldown of 5+ minutes for scale-in**: Workers should finish in-flight jobs before termination (WHY: terminating a worker mid-job forces SQS visibility timeout retry; wastes processing and delays completion)
- **Use separate auto-scaling groups per queue priority**: High-priority queues (email, notifications) vs low-priority (reports, cleanup) (WHY: prevents low-priority jobs from starving high-priority queues; each ASG scales independently)
- **Configure lifecycle hooks for graceful shutdown**: 60-second timeout to signal worker to stop accepting new jobs (WHY: workers finish current job, then exit; SQS doesn't need to retry in-flight messages)

## Architecture Guidelines
- Worker ASG: min=1 (keep 1 running), max=50 (cost cap), Spot mixed instances policy
- Scaling metric: SQS ApproximateNumberOfMessagesVisible (avg over 1 minute)
- Scale-out threshold: 1000 messages; add 2 workers per alarm
- Scale-in threshold: 100 messages; remove 1 worker per alarm
- Add scale-out cooldown=120s, scale-in cooldown=600s (slow scale-in to prevent oscillation)
- For Fargate: ECS Service Auto Scaling with SQS metric (simpler than ASG)

## Performance Considerations
- Worker warm-up: New instances need 2-5 minutes to boot, pull container/image, register
- Pre-scaling: If jobs are predictable (daily reports), schedule capacity increase 15 minutes before
- SQS polling overhead: Each worker polls SQS every 0.1-10s (configurable); too many workers create SQS API cost
- Batching: Process up to 10 messages per SQS receive call (ReduceMessageBatchSize tuning)
- Job processing time variability: Workers process at different speeds based on job type; separate queues by duration

## Security Considerations
- Worker instances need SQS IAM permissions (send, receive, delete, change visibility)
- Use queue-specific IAM policies for least privilege
- Enable SQS encryption (SSE-KMS) for sensitive job data
- Workers should not have database write access if processing read-only jobs
- Rotate queue URLs and credentials; workers should fetch from parameter store

## Common Mistakes
1. **Not auto-scaling queue workers**: Fixed 2 workers processing jobs that surge from 100 to 10000 (Cause: "workers always running is simpler"; Consequence: hours of job backlog during spikes, days to catch up; Better: auto-scale on queue depth, add workers proportional to backlog)
2. **Same scaling for all queues**: High-priority email queue and low-priority cleanup queue share same ASG (Cause: single ASG for simplicity; Consequence: cleanup jobs block email processing during spike; Better: separate ASGs per priority with different scaling thresholds)
3. **Scale-in too aggressive**: Removing workers every 3 minutes when queue depth drops (Cause: tight cooldown; Consequence: workers terminated mid-job, wasted processing; Better: 10+ minute scale-in cooldown, allow workers to finish in-flight jobs)

## Anti-Patterns
- **Manual worker management**: SSH-ing to add/remove workers; defeats automation
- **Web + queue on same server**: Queue workers steal CPU from web requests (separate servers)
- **On-Demand workers only**: Paying 4x for fault-tolerant workloads that should be on Spot
- **No backpressure handling**: Workers keep accepting jobs when database is overwhelmed (use rate limiting)

## Examples
- **Standard worker ASG**: Spot instances (r7g.large), min=2, max=20; scale out at depth=500, add 2; scale in at depth=100, remove 1
- **Fargate Spot workers**: ECS service with Fargate Spot capacity provider; KEDA ScaledObject with SQS trigger; cooldown=300s
- **Priority queues**: high-queue ASG (min=2, scale at depth=100); low-queue ASG (min=0, scale at depth=1000)

## Related Topics
- Spot Instances (ku-02)
- Batch Processing
- Worker Pool Sizing (ku-07)
- KEDA Scaling

## AI Agent Notes
- Default: Spot-based auto-scaling workers with SQS depth metric
- Separate ASGs per queue priority
- Always set scale-in cooldown >= 5 minutes

## Verification
- [ ] Worker auto-scaling configured on SQS queue depth
- [ ] Spot instances used for worker fleet
- [ ] Separate scaling policies per queue priority
- [ ] Scale-in cooldown >= 5 minutes
- [ ] Graceful shutdown via lifecycle hooks
- [ ] No workers running on web servers
- [ ] SQS metrics monitored for backlog alerts
