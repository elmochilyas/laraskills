# KU-03-AUTO-SCALING-WORKERS: Auto Scaling Workers

## Metadata
- **ID**: KU-03-AUTO-SCALING-WORKERS
- **Subdomain**: Queue Worker Optimization
- **Topic**: Auto Scaling Workers
- **Source**: Queue Worker Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Auto Scaling Workers automatically adjusts the number of queue worker instances based on SQS queue depth. Unlike web server auto-scaling (which scales on CPU or request count), worker scaling responds to job backlog. For Laravel applications with variable queue load (batch jobs, user-triggered processing, scheduled tasks), auto-scaling workers eliminate idle compute costs during low traffic while ensuring job throughput during peaks. Combined with Spot instances, this is the single biggest cost optimization for queue processing.

## Core Concepts
- **Target tracking on SQS depth**: Maintain queue depth at a target value (e.g., 1000 messages)
- **Step scaling on backlog**: Add workers in steps based on backlog per worker (backlogPerWorker = queueDepth / runningWorkers)
- **SQS metric**: ApproximateNumberOfMessagesVisible (current queue depth)
- **ASG scaling**: Amazon EC2 Auto Scaling or ECS Service Auto Scaling
- **KEDA scaling**: Kubernetes Event-Driven Autoscaling for EKS-based workers
- **Cooldown period**: Prevents rapid scaling in/out oscillations
- **Mixed instances**: Spot + On-Demand in same ASG for cost + reliability

## Mental Models
- Default: backlogPerWorker scaling (not raw queue depth)
- Default: Spot + On-Demand mixed instances
- Default: lifecycle hook for graceful shutdown
- Queue-specific scaling policies

## Internal Mechanics
- New worker boot time: 2-5 minutes (EC2), 30-60 seconds (Fargate)
- Scaling lag: 3-5 minutes from queue depth increase to new worker processing jobs
- Warm workers: Keep 1-2 workers always running (min=1) for immediate processing
- Pre-scaling: Schedule capacity 15 minutes before known batch jobs
- SQS polling: Each worker polls every 0.1-10s; too many idle workers = wasted API calls

## Patterns
- Scale on backlogPerWorker, not queue depth alone
- Use ASG with mixed instances policy
- Set graceful shutdown lifecycle hook
- Use per-queue scaling policies
- Monitor scale-in events
- Set warm-up time for new workers

## Architectural Decisions
- Worker ASG: min=1, max=50, t4g.medium or m7g.large instances
- Scaling: Target tracking on ApproximateNumberOfMessagesVisible (target = 1000)
- Scale-out: Add 1-2 workers per step (at backlogPerWorker > 500)
- Scale-in: Remove 1 worker at a time (backlogPerWorker < 50)
- Cooldown: 180s scale-out, 300s scale-in
- Lifecycle hook: 60-second graceful shutdown
- CloudWatch alarm: SQS queue depth > 5000 triggers notification (not scaling action)

## Tradeoffs
**When To Use:**
- ASG scaling: EC2-based queue workers; full control over instance types
- ECS Service scaling: Fargate-based workers; simpler, containerized
- KEDA scaling: Kubernetes-based workers; event-driven, fine-grained
- Target tracking: Simple metric-to-capacity mapping; works for most apps
- Step scaling: Complex workloads with different response needs per backlog level
- Scheduled scaling: Known batch windows (pre-scale before expected backlog)

**When NOT To Use:**
- Manual worker adjustment: Always automate; manual scaling causes over/under-provisioning
- CPU-based scaling for workers: Worker CPU doesn't correlate with job backlog; use SQS depth directly
- KEDA for simple apps: KEDA adds Kubernetes complexity; ASG/ECS scaling is simpler for EC2/Fargate
- Instant scale-in: Terminating workers as soon as queue clears causes mid-job terminations

## Performance Considerations
- New worker boot time: 2-5 minutes (EC2), 30-60 seconds (Fargate)
- Scaling lag: 3-5 minutes from queue depth increase to new worker processing jobs
- Warm workers: Keep 1-2 workers always running (min=1) for immediate processing
- Pre-scaling: Schedule capacity 15 minutes before known batch jobs
- SQS polling: Each worker polls every 0.1-10s; too many idle workers = wasted API calls

## Production Considerations
- Worker IAM role: Least privilege (SQS receive/delete; specific S3 bucket if needed)
- Queue-specific IAM: Each queue has its own IAM policy; workers only access their queue
- Scale-in events logged in CloudTrail for audit
- Lifecycle hook should not expose credentials
- Monitor for unexpected scaling actions (possible cost attack)

## Common Mistakes
- **Scaling on SQS depth without backlogPerWorker**: Adding 2 workers at depth=1000 regardless of current workers (Cause: simple CloudWatch scaling policy; Consequence: when 10 workers already active, adding 2 more may over-provision; Better: backlogPerWorker = depth/workers; scale when backlog exceeds threshold regardless of worker count)
- **Identical scaling for all queues**: Email queue and report queue have same scaling thresholds (Cause: single scaling policy; Consequence: report backlog doesn't trigger enough workers; Better: priority queues scale faster (backlog=100), batch queues scale slower (backlog=1000))
- **No lifecycle hook**: Workers terminated mid-job during scale-in (Cause: assuming ASG termination is clean; Consequence: SQS visibility timeout causes job retries, wasted processing; Better: lifecycle hook allows 60s to finish job before termination)
- **Cooldown too short**: 60-second cooldown causes rapid scaling oscillation (Cause: want responsive scaling; Consequence: workers added/removed constantly; Better: 180s scale-out, 300s scale-in)

## Failure Modes
- **CPU-based worker scaling**: Worker CPU doesn't reflect queue depth; scales at wrong times
- **min=0 workers**: Cold start delay for every new job (2-5 minute latency)
- **Manual scaling during batch processing**: Engineers manually adding workers; human error prone
- **On-Demand only workers**: 3-4x more expensive for fault-tolerant queue processing

## Ecosystem Usage
- **EC2 worker ASG**: 2 x t4g.medium (min=1), mixed instances 70% Spot; target tracking on ApproximateNumberOfMessagesVisible (target=500); cooldown 180/300
- **Fargate worker**: ECS service with Fargate Spot; ECS Service Auto Scaling on SQS metric; min=1, max=20
- **KEDA worker**: ScaledObject with `queueLength: 100`; polling interval 30s; cooldown period 300s

## Related Knowledge Units
- Worker Scaling (ku-01)
- Spot Worker (ku-05)
- KEDA Scaling

## Research Notes
Derived from Queue Worker Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.