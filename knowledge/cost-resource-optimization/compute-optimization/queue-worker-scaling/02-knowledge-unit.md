# KU-10-QUEUE-WORKER-SCALING: Queue Worker Scaling

## Metadata
- **ID**: KU-10-QUEUE-WORKER-SCALING
- **Subdomain**: Compute Optimization
- **Topic**: Queue Worker Scaling
- **Source**: Compute Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Queue worker scaling adjusts the number of worker processes handling background jobs based on queue depth. For Laravel applications with SQS or database queues, workload varies dramatically between peak and off-peak hours. Auto-scaling queue workers to match queue depth eliminates idle worker cost during low traffic while maintaining job throughput during peaks. Workers are ideal Spot instance candidates (fault-tolerant, interruption-safe).

## Core Concepts
- **Queue depth**: Number of messages waiting in queue; primary scaling metric
- **Worker throughput**: Jobs per second per worker (varies by job complexity)
- **Auto Scaling on SQS metric**: Scale out when ApproximateNumberOfMessagesVisible > threshold
- **KEDA**: Kubernetes Event-Driven Autoscaling; scales workers based on SQS queue depth in EKS
- **Spot interruption tolerance**: Queue workers are stateless; interruption = SQS visibility timeout retry
- **Scaling lag**: Time from queue depth increase to new worker processing jobs (2-5 minutes)

## Mental Models
- Default: Spot-based auto-scaling workers with SQS depth metric
- Separate ASGs per queue priority
- Always set scale-in cooldown >= 5 minutes

## Internal Mechanics
- Worker warm-up: New instances need 2-5 minutes to boot, pull container/image, register
- Pre-scaling: If jobs are predictable (daily reports), schedule capacity increase 15 minutes before
- SQS polling overhead: Each worker polls SQS every 0.1-10s (configurable); too many workers create SQS API cost
- Batching: Process up to 10 messages per SQS receive call (ReduceMessageBatchSize tuning)
- Job processing time variability: Workers process at different speeds based on job type; separate queues by duration

## Patterns
- Scale workers on ApproximateNumberOfMessagesVisible
- Use Spot instances for worker fleets
- Set cooldown of 5+ minutes for scale-in
- Use separate auto-scaling groups per queue priority
- Configure lifecycle hooks for graceful shutdown

## Architectural Decisions
- Worker ASG: min=1 (keep 1 running), max=50 (cost cap), Spot mixed instances policy
- Scaling metric: SQS ApproximateNumberOfMessagesVisible (avg over 1 minute)
- Scale-out threshold: 1000 messages; add 2 workers per alarm
- Scale-in threshold: 100 messages; remove 1 worker per alarm
- Add scale-out cooldown=120s, scale-in cooldown=600s (slow scale-in to prevent oscillation)
- For Fargate: ECS Service Auto Scaling with SQS metric (simpler than ASG)

## Tradeoffs
**When To Use:**
- Auto-scaling workers: Any app with variable queue load (daily batch jobs, user-triggered processing)
- Spot-based workers: All non-critical queue processing (save 60-90% vs On-Demand)
- KEDA scaling: Kubernetes-based deployments with event-driven autoscaling
- Manual scaling: Small apps with predictable, constant queue load
- Fargate Spot: Containerized workers with minimal operational overhead

**When NOT To Use:**
- Auto-scaling for constant load: If queue depth is always ~100 messages, fixed workers are simpler
- Spot for time-critical jobs: Jobs that must complete within minutes regardless of interruptions
- KEDA for small apps: KEDA adds complexity; CloudWatch + ASG scaling is simpler for EC2-based workers
- Manual scaling for variable load: Over-provisioned during low traffic, under-provisioned during peaks

## Performance Considerations
- Worker warm-up: New instances need 2-5 minutes to boot, pull container/image, register
- Pre-scaling: If jobs are predictable (daily reports), schedule capacity increase 15 minutes before
- SQS polling overhead: Each worker polls SQS every 0.1-10s (configurable); too many workers create SQS API cost
- Batching: Process up to 10 messages per SQS receive call (ReduceMessageBatchSize tuning)
- Job processing time variability: Workers process at different speeds based on job type; separate queues by duration

## Production Considerations
- Worker instances need SQS IAM permissions (send, receive, delete, change visibility)
- Use queue-specific IAM policies for least privilege
- Enable SQS encryption (SSE-KMS) for sensitive job data
- Workers should not have database write access if processing read-only jobs
- Rotate queue URLs and credentials; workers should fetch from parameter store

## Common Mistakes
- **Not auto-scaling queue workers**: Fixed 2 workers processing jobs that surge from 100 to 10000 (Cause: "workers always running is simpler"; Consequence: hours of job backlog during spikes, days to catch up; Better: auto-scale on queue depth, add workers proportional to backlog)
- **Same scaling for all queues**: High-priority email queue and low-priority cleanup queue share same ASG (Cause: single ASG for simplicity; Consequence: cleanup jobs block email processing during spike; Better: separate ASGs per priority with different scaling thresholds)
- **Scale-in too aggressive**: Removing workers every 3 minutes when queue depth drops (Cause: tight cooldown; Consequence: workers terminated mid-job, wasted processing; Better: 10+ minute scale-in cooldown, allow workers to finish in-flight jobs)

## Failure Modes
- **Manual worker management**: SSH-ing to add/remove workers; defeats automation
- **Web + queue on same server**: Queue workers steal CPU from web requests (separate servers)
- **On-Demand workers only**: Paying 4x for fault-tolerant workloads that should be on Spot
- **No backpressure handling**: Workers keep accepting jobs when database is overwhelmed (use rate limiting)

## Ecosystem Usage
- **Standard worker ASG**: Spot instances (r7g.large), min=2, max=20; scale out at depth=500, add 2; scale in at depth=100, remove 1
- **Fargate Spot workers**: ECS service with Fargate Spot capacity provider; KEDA ScaledObject with SQS trigger; cooldown=300s
- **Priority queues**: high-queue ASG (min=2, scale at depth=100); low-queue ASG (min=0, scale at depth=1000)

## Related Knowledge Units
- Spot Instances (ku-02)
- Batch Processing
- Worker Pool Sizing (ku-07)
- KEDA Scaling

## Research Notes
Derived from Compute Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.