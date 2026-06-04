# Auto Scaling Workers

## Metadata
- **ID**: KU-03-AUTO-SCALING-WORKERS
- **Subdomain**: queue-worker-cost-efficiency
- **Domain**: cost-resource-optimization
- **Topic**: Auto Scaling Workers
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Auto Scaling Workers automatically adjusts the number of queue worker instances based on SQS queue depth. Unlike web server auto-scaling (which scales on CPU or request count), worker scaling responds to job backlog. For Laravel applications with variable queue load (batch jobs, user-triggered processing, scheduled tasks), auto-scaling workers eliminate idle compute costs during low traffic while ensuring job throughput during peaks. Combined with Spot instances, this is the single biggest cost optimization for queue processing.

## Core Concepts
- **Target tracking on SQS depth**: Maintain queue depth at a target value (e.g., 1000 messages)
- **Step scaling on backlog**: Add workers in steps based on backlog per worker (backlogPerWorker = queueDepth / runningWorkers)
- **SQS metric**: ApproximateNumberOfMessagesVisible (current queue depth)
- **ASG scaling**: Amazon EC2 Auto Scaling or ECS Service Auto Scaling
- **KEDA scaling**: Kubernetes Event-Driven Autoscaling for EKS-based workers
- **Cooldown period**: Prevents rapid scaling in/out oscillations
- **Mixed instances**: Spot + On-Demand in same ASG for cost + reliability

## When To Use
- ASG scaling: EC2-based queue workers; full control over instance types
- ECS Service scaling: Fargate-based workers; simpler, containerized
- KEDA scaling: Kubernetes-based workers; event-driven, fine-grained
- Target tracking: Simple metric-to-capacity mapping; works for most apps
- Step scaling: Complex workloads with different response needs per backlog level
- Scheduled scaling: Known batch windows (pre-scale before expected backlog)

## When NOT To Use
- Manual worker adjustment: Always automate; manual scaling causes over/under-provisioning
- CPU-based scaling for workers: Worker CPU doesn't correlate with job backlog; use SQS depth directly
- KEDA for simple apps: KEDA adds Kubernetes complexity; ASG/ECS scaling is simpler for EC2/Fargate
- Instant scale-in: Terminating workers as soon as queue clears causes mid-job terminations

## Best Practices
- **Scale on backlogPerWorker, not queue depth alone**: Target backlogPerWorker = 100 (messages per active worker) (WHY: 1000 messages with 10 workers = 100 backlog each (fine); 1000 messages with 2 workers = 500 backlog each (need more); backlogPerWorker normalizes scaling for current capacity)
- **Use ASG with mixed instances policy**: 70% Spot, 30% On-Demand for workers (WHY: workers are fault-tolerant (interruption = SQS retry); Spot saves 70% on compute; On-Demand base ensures capacity if Spot is unavailable)
- **Set graceful shutdown lifecycle hook**: 60-second timeout to finish in-flight jobs before termination (WHY: scale-in terminates workers mid-job; lifecycle hook sends SIGTERM, worker finishes current job, then exits; prevents invisible retries)
- **Use per-queue scaling policies**: High-priority queue (email) scales faster than batch queue (reports) (WHY: different queues have different latency requirements; priority queues add workers at backlog=10; batch queues at backlog=1000)
- **Monitor scale-in events**: Track how many workers are terminated; correlate with job failures (WHY: frequent scale-in during active processing indicates too-aggressive scale-in policy; adjust cooldown or threshold)
- **Set warm-up time for new workers**: Configure 120-300 second warm-up before worker is considered "in service" (WHY: new instances take 2-5 minutes to boot and start polling; without warm-up, ASG adds capacity thinking current workers handle load, but they're still booting)

## Architecture Guidelines
- Worker ASG: min=1, max=50, t4g.medium or m7g.large instances
- Scaling: Target tracking on ApproximateNumberOfMessagesVisible (target = 1000)
- Scale-out: Add 1-2 workers per step (at backlogPerWorker > 500)
- Scale-in: Remove 1 worker at a time (backlogPerWorker < 50)
- Cooldown: 180s scale-out, 300s scale-in
- Lifecycle hook: 60-second graceful shutdown
- CloudWatch alarm: SQS queue depth > 5000 triggers notification (not scaling action)

## Performance Considerations
- New worker boot time: 2-5 minutes (EC2), 30-60 seconds (Fargate)
- Scaling lag: 3-5 minutes from queue depth increase to new worker processing jobs
- Warm workers: Keep 1-2 workers always running (min=1) for immediate processing
- Pre-scaling: Schedule capacity 15 minutes before known batch jobs
- SQS polling: Each worker polls every 0.1-10s; too many idle workers = wasted API calls

## Security Considerations
- Worker IAM role: Least privilege (SQS receive/delete; specific S3 bucket if needed)
- Queue-specific IAM: Each queue has its own IAM policy; workers only access their queue
- Scale-in events logged in CloudTrail for audit
- Lifecycle hook should not expose credentials
- Monitor for unexpected scaling actions (possible cost attack)

## Common Mistakes
1. **Scaling on SQS depth without backlogPerWorker**: Adding 2 workers at depth=1000 regardless of current workers (Cause: simple CloudWatch scaling policy; Consequence: when 10 workers already active, adding 2 more may over-provision; Better: backlogPerWorker = depth/workers; scale when backlog exceeds threshold regardless of worker count)
2. **Identical scaling for all queues**: Email queue and report queue have same scaling thresholds (Cause: single scaling policy; Consequence: report backlog doesn't trigger enough workers; Better: priority queues scale faster (backlog=100), batch queues scale slower (backlog=1000))
3. **No lifecycle hook**: Workers terminated mid-job during scale-in (Cause: assuming ASG termination is clean; Consequence: SQS visibility timeout causes job retries, wasted processing; Better: lifecycle hook allows 60s to finish job before termination)
4. **Cooldown too short**: 60-second cooldown causes rapid scaling oscillation (Cause: want responsive scaling; Consequence: workers added/removed constantly; Better: 180s scale-out, 300s scale-in)

## Anti-Patterns
- **CPU-based worker scaling**: Worker CPU doesn't reflect queue depth; scales at wrong times
- **min=0 workers**: Cold start delay for every new job (2-5 minute latency)
- **Manual scaling during batch processing**: Engineers manually adding workers; human error prone
- **On-Demand only workers**: 3-4x more expensive for fault-tolerant queue processing

## Examples
- **EC2 worker ASG**: 2 x t4g.medium (min=1), mixed instances 70% Spot; target tracking on ApproximateNumberOfMessagesVisible (target=500); cooldown 180/300
- **Fargate worker**: ECS service with Fargate Spot; ECS Service Auto Scaling on SQS metric; min=1, max=20
- **KEDA worker**: ScaledObject with `queueLength: 100`; polling interval 30s; cooldown period 300s

## Related Topics
- Worker Scaling (ku-01)
- Spot Worker (ku-05)
- KEDA Scaling

## AI Agent Notes
- Default: backlogPerWorker scaling (not raw queue depth)
- Default: Spot + On-Demand mixed instances
- Default: lifecycle hook for graceful shutdown
- Queue-specific scaling policies

## Verification
- [ ] Worker auto-scaling configured on SQS backlogPerWorker
- [ ] Mixed instances policy (Spot + On-Demand)
- [ ] Lifecycle hook for graceful shutdown
- [ ] Queue-specific scaling policies for priority queues
- [ ] Scale-in cooldown >= 300 seconds
- [ ] min=1 worker always running
- [ ] No CPU-based worker scaling
