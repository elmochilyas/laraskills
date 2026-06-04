## Auto-Scale Workers on Queue Depth
---
## Architecture
---
Always configure auto-scaling for queue workers based on SQS ApproximateNumberOfMessagesVisible; never use fixed worker counts for variable queue loads.
---
Queue load varies dramatically between peak and off-peak; fixed workers are over-provisioned during low traffic and under-provisioned during spikes, causing either waste or backlog.
---
ASG: scale out when SQS depth > 500 messages, add 2 workers. Scale in when depth < 100 messages.
---
Fixed 2 workers processing jobs that surge from 100 to 10000.
---
Predictable, constant queue load where fixed workers match the average.
---
Idle worker cost during low traffic; hours of job backlog during spikes.
---
## Use Spot Instances for Workers
---
## Cost Optimization
---
Always use Spot (or Fargate Spot) instances as primary compute for queue worker fleets; mix with On-Demand for baseline.
---
Queue workers are fault-tolerant — SQS visibility timeout ensures interrupted jobs are retried — making them ideal for Spot's 70-90% discount.
---
Worker ASG: 70% Spot, 30% On-Demand, mixed instances policy.
---
Running all queue workers on On-Demand instances.
---
Time-critical jobs that must complete within minutes regardless of interruptions.
---
Paying 3-10x more for queue processing than necessary.
---
## Set Scale-In Cooldown of 5+ Minutes
---
## Reliability
---
Always set scale-in cooldown to at least 5 minutes for worker Auto Scaling groups.
---
Terminating a worker mid-job forces SQS visibility timeout retry, wasting processing time and delaying job completion; longer cooldown allows in-flight jobs to finish.
---
ASG: scale-in cooldown = 300 seconds.
---
Scale-in cooldown = 60 seconds, removing workers every 3 minutes when queue depth drops.
---
Spot interruption handling where workers must be replaced quickly; still need graceful shutdown.
---
Wasted compute from mid-job terminations, delayed job completion, increased SQS API costs.
---
## Use Separate ASGs Per Queue Priority
---
## Architecture
---
Always configure separate Auto Scaling groups for different queue priorities (high, default, low).
---
A low-priority batch job spike should not trigger scaling that delays high-priority email or notification processing; separate ASGs scale independently based on each queue's depth.
---
high-queue ASG: min=2, scale at depth=100. low-queue ASG: min=0, scale at depth=1000.
---
Single ASG scaling on combined queue depth for all priority levels.
---
Single queue with uniform job priority; even then, separation prevents cascade.
---
High-priority jobs delayed by low-priority batch processing; unpredictable delivery SLAs.
---
## Configure Lifecycle Hooks for Graceful Shutdown
---
## Reliability
---
Always configure EC2 lifecycle hooks or ECS task graceful shutdown to signal workers to stop accepting new jobs before termination.
---
Without graceful shutdown, workers processing a long job are terminated mid-execution, forcing SQS visibility timeout retry and wasting 50%+ of compute on re-processing.
---
Lifecycle hook: 60s timeout, signal worker via supervisor to stop accepting jobs, finish current job, exit cleanly.
---
No lifecycle hook; workers killed immediately on scale-in or Spot interruption.
---
Spot interruptions that give only 2 minutes warning; still sufficient for most queue jobs <90s.
---
Up to 50% compute wasted on mid-job terminations and retries.
