## Use Spot + On-Demand Mixed Capacity
---
## Architecture
---
Always configure queue worker fleets with mixed Spot and On-Demand capacity; never use 100% Spot without fallback.
---
Spare Spot capacity may be unavailable; 30% On-Demand baseline ensures continuous queue processing during Spot shortages while 70% Spot captures most of the discount.
---
Worker ASG: 70% Spot, 30% On-Demand, min=1 On-Demand, max=50 total.
---
100% Spot capacity; queue stops processing when Spot is unavailable.
---
Time-critical workloads where even brief processing delays are unacceptable; still use >0% On-Demand.
---
Queue processing stops during Spot shortages, backlog grows, hours of delayed jobs.
---
## Set Queue Worker Timeout Below Spot Warning
---
## Reliability
---
Always configure queue worker `--timeout` to 90 seconds or less when using Spot instances.
---
Spot gives 2 minutes (SIGTERM) before reclaiming capacity; jobs exceeding 120 seconds get interrupted mid-execution; 90s timeout ensures jobs complete before forced termination.
---
Horizon: `--timeout=90` on Spot workers.
---
`--timeout=300` on Spot workers; jobs take 150s and are interrupted.
---
Jobs that require >90s execution; use On-Demand for those queues with longer timeouts.
---
In-flight jobs terminated mid-execution, 50% compute wasted on retries.
---
## Implement Graceful SIGTERM Handling
---
## Reliability
---
Always implement SIGTERM signal handling in Supervisor or container entrypoint to stop workers cleanly on Spot interruption.
---
Spot's 2-minute warning is delivered as SIGTERM; catching it allows in-flight jobs to complete before forced termination, preventing invisible SQS retries.
---
Supervisor: `stopsignal=SIGTERM, stopwaitsecs=60`. Worker finishes current job, then exits.
---
No signal handling; workers killed immediately on interruption.
---
On-Demand workers not subject to Spot interruption; still good practice for rolling updates.
---
Up to 50% of worker compute wasted on mid-job retries.
---
## Diversify Instance Types and AZs
---
## Reliability
---
Always use multiple instance types and all 3 AZs when configuring Spot capacity providers.
---
Spot capacity varies per instance type and AZ; t4g.medium may be unavailable but m7g.medium is available; one AZ can be drained entirely. Diversification reduces interruption rate by 40-60%.
---
Spot capacity provider: instance types = m7g.large, m7g.xlarge, t4g.xlarge. AZs = us-east-1a, b, c.
---
Single instance type (t4g.medium) in a single AZ.
---
Entire region running out of Spot capacity (rare, during re:Invent); On-Demand fallback covers this.
---
50-60% higher interruption rate, all workers terminated simultaneously during AZ event.
---
## Monitor SpotInterruptionCount
---
## Monitoring
---
Always monitor SpotInterruptionCount metric per service; investigate sustained high interruption rates.
---
Sustained high interruption indicates Spot capacity issue requiring fallback to On-Demand or instance type changes.
---
CloudWatch alarm: SpotInterruptionCount > 5/hour triggers alert and On-Demand fallback.
---
No monitoring of Spot interruption frequency.
---
On-Demand-only deployments; no interruptions to monitor.
---
Unexpected worker terminations without mitigation, queue processing delays, unplanned fallback.
---
## Default to Spot for All Non-Critical Queues
---
## Cost Optimization
---
Use Fargate Spot for all non-critical queue workers and batch processing; reserve On-Demand for priority queues.
---
Non-critical queues (report generation, cleanup, data export) tolerate delays from Spot interruptions; paying On-Demand prices for these workloads is unnecessary.
---
Image processing queue → Fargate Spot. Email delivery queue → On-Demand.
---
All queues running on On-Demand including non-critical batch jobs.
---
All queues have strict completion SLAs requiring guaranteed capacity.
---
70% cost premium on fault-tolerant workloads.
